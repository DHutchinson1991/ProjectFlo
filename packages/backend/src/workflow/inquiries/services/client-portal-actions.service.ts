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
        const { brandId } = await this.resolvePortalContext(token);

        const packages = await this.prisma.service_packages.findMany({
            where: { brand_id: brandId, is_active: true },
            select: { id: true, name: true, description: true, event_category: true, currency: true, contents: true },
            orderBy: { name: 'asc' },
        });
        return { packages };
    }

    async submitPackageRequest(
        token: string,
        data: { selected_package_id?: number; customisations?: Prisma.InputJsonValue; notes?: string },
    ) {
        const { inquiryId } = await this.resolvePortalContext(token);

        const request = await this.prisma.package_requests.create({
            data: {
                inquiry_id: inquiryId,
                selected_package_id: data.selected_package_id ?? null,
                customisations: data.customisations ?? Prisma.DbNull,
                notes: data.notes ?? null,
            },
        });

        return request;
    }

    async respondToProposalByPortalToken(token: string, response: string, message?: string) {
        const { inquiryId } = await this.resolvePortalContext(token);

        const proposal = await this.prisma.proposals.findFirst({
            where: {
                inquiry_id: inquiryId,
                status: { in: ['Sent', 'ChangesRequested'] },
            },
            orderBy: { id: 'desc' },
            select: { share_token: true },
        });
        if (!proposal?.share_token) throw new NotFoundException('No active proposal found for this portal');

        return this.proposalLifecycleService.respondToProposal(proposal.share_token, response, message);
    }

    /**
     * Resolve portal context by token — checks inquiries first, then projects
     * (portal_token moves to projects table after conversion).
     */
    private async resolvePortalContext(
        token: string,
    ): Promise<{ inquiryId: number; brandId: number }> {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: { portal_token: token },
            select: { id: true, contact: { select: { brand_id: true } } },
        });
        if (inquiry?.contact.brand_id) {
            return { inquiryId: inquiry.id, brandId: inquiry.contact.brand_id };
        }

        const project = await this.prisma.projects.findFirst({
            where: { portal_token: token },
            select: { inquiry_id: true, brand_id: true },
        });
        if (!project?.inquiry_id || project.brand_id == null) {
            throw new NotFoundException('Portal not found');
        }

        return { inquiryId: project.inquiry_id, brandId: project.brand_id };
    }
}
