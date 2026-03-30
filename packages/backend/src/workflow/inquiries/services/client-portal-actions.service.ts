import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { ProposalLifecycleService } from '../../proposals/services/proposal-lifecycle.service';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClientPortalActionsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly proposalLifecycleService: ProposalLifecycleService,
    ) {}

    async getOrCreatePortalToken(inquiryId: number, brandId: number): Promise<string> {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: { id: inquiryId, contact: { brand_id: brandId } },
            select: { id: true, portal_token: true },
        });
        if (!inquiry) throw new NotFoundException('Inquiry not found');
        if (inquiry.portal_token) return inquiry.portal_token;

        const token = randomUUID();
        await this.prisma.inquiries.update({ where: { id: inquiryId }, data: { portal_token: token } });
        return token;
    }

    async getPackageOptions(token: string) {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: { portal_token: token },
            select: { id: true, contact: { select: { brand_id: true } } },
        });
        if (!inquiry) throw new NotFoundException('Portal not found');

        const packages = await this.prisma.service_packages.findMany({
            where: { brand_id: inquiry.contact.brand_id!, is_active: true },
            select: { id: true, name: true, description: true, category: true, currency: true, contents: true },
            orderBy: { name: 'asc' },
        });
        return { packages };
    }

    async submitPackageRequest(
        token: string,
        data: { selected_package_id?: number; customisations?: Prisma.InputJsonValue; notes?: string },
    ) {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: { portal_token: token },
            select: { id: true, contact: { select: { brand_id: true } } },
        });
        if (!inquiry) throw new NotFoundException('Portal not found');

        const request = await this.prisma.package_requests.create({
            data: {
                inquiry_id: inquiry.id,
                selected_package_id: data.selected_package_id ?? null,
                customisations: data.customisations ?? Prisma.DbNull,
                notes: data.notes ?? null,
            },
        });

        return request;
    }

    async respondToProposalByPortalToken(token: string, response: string, message?: string) {
        const inquiry = await this.prisma.inquiries.findUnique({
            where: { portal_token: token },
            select: {
                proposals: {
                    where: { status: { in: ['Sent', 'ChangesRequested'] } },
                    orderBy: { id: 'desc' },
                    take: 1,
                    select: { share_token: true },
                },
            },
        });
        if (!inquiry) throw new NotFoundException('Portal not found');

        const proposal = inquiry.proposals[0];
        if (!proposal?.share_token) throw new NotFoundException('No active proposal found for this portal');

        return this.proposalLifecycleService.respondToProposal(proposal.share_token, response, message);
    }
}
