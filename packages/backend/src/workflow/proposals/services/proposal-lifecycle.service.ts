import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { ProposalCrudService } from './proposal-crud.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ProposalLifecycleService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly crudService: ProposalCrudService,
        private readonly inquiryTasksService: InquiryTasksService,
    ) {}

    async sendProposal(id: number, inquiryId: number, brandId: number) {
        const proposal = await this.crudService.findOne(id, inquiryId, brandId);
        if (proposal.status === 'Sent') {
            throw new ForbiddenException('Proposal has already been sent');
        }

        const updated = await this.prisma.proposals.update({
            where: { id },
            data: { status: 'Sent', sent_at: new Date() },
            include: {
                inquiry: {
                    include: { contact: { select: { first_name: true, last_name: true, email: true } } },
                },
                project: { select: { id: true, project_name: true } },
            },
        });

        await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Send Proposal');
        return updated;
    }

    async generateShareToken(id: number, inquiryId: number, brandId: number): Promise<string> {
        const proposal = await this.crudService.findOne(id, inquiryId, brandId);
        if (proposal.share_token) return proposal.share_token;

        const token = randomUUID();
        await this.prisma.proposals.update({ where: { id }, data: { share_token: token } });
        return token;
    }

    async findByShareToken(token: string) {
        const proposal = await this.prisma.proposals.findUnique({
            where: { share_token: token },
            include: this._shareTokenInclude(),
        });
        if (!proposal) throw new NotFoundException('Proposal not found');

        const brand = await this._findBrandForProposal(proposal.inquiry.contact_id);
        return { ...proposal, brand };
    }

    async respondToProposal(token: string, response: string, message?: string) {
        if (!['Accepted', 'ChangesRequested'].includes(response)) {
            throw new BadRequestException('Invalid response. Must be "Accepted" or "ChangesRequested".');
        }

        const proposal = await this.prisma.proposals.findUnique({
            where: { share_token: token },
            include: { inquiry: { include: { contact: { select: { first_name: true, last_name: true, email: true } } } } },
        });
        if (!proposal) throw new NotFoundException('Proposal not found');
        if (proposal.status !== 'Sent') {
            throw new ForbiddenException('This proposal cannot be responded to in its current state.');
        }

        const updated = await this.prisma.proposals.update({
            where: { id: proposal.id },
            data: {
                client_response: response,
                client_response_at: new Date(),
                client_response_message: message || null,
                status: response === 'Accepted' ? 'Accepted' : 'Sent',
            },
        });

        if (response === 'Accepted') {
            await this._handleProposalAccepted(proposal.inquiry_id, proposal.inquiry?.contact);
        }

        return updated;
    }

    private async _handleProposalAccepted(inquiryId: number, contact?: { email?: string; first_name?: string | null; last_name?: string | null } | null) {
        const draftContract = await this.prisma.contracts.findFirst({
            where: { inquiry_id: inquiryId, status: 'Draft' },
            orderBy: { id: 'desc' },
        });

        if (draftContract && contact?.email) {
            const signerName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Client';
            await this.prisma.contract_signers.deleteMany({ where: { contract_id: draftContract.id } });
            await this.prisma.contract_signers.create({
                data: { contract_id: draftContract.id, name: signerName, email: contact.email, role: 'client' },
            });
            await this.prisma.contracts.update({
                where: { id: draftContract.id },
                data: { status: 'Sent', sent_at: new Date() },
            });
            await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Contract Sent');
        }
    }

    private async _findBrandForProposal(contactId: number) {
        const contact = await this.prisma.contacts.findFirst({
            where: { id: contactId },
            select: { brand_id: true },
        });
        if (!contact?.brand_id) return null;
        return this.prisma.brands.findUnique({
            where: { id: contact.brand_id },
            select: { id: true, name: true, display_name: true, description: true, website: true, email: true, phone: true, address_line1: true, address_line2: true, city: true, state: true, country: true, postal_code: true, logo_url: true },
        });
    }

    private _shareTokenInclude() {
        return {
            inquiry: {
                include: {
                    contact: { select: { first_name: true, last_name: true, email: true } },
                    estimates: { include: { items: true }, orderBy: [{ total_amount: 'desc' as const }, { is_primary: 'desc' as const }, { created_at: 'desc' as const }], take: 1 },
                    selected_package: { select: { id: true, name: true, description: true, currency: true, contents: true } },
                    schedule_event_days: {
                        orderBy: { order_index: 'asc' as const },
                        include: {
                            activities: {
                                orderBy: { order_index: 'asc' as const },
                                select: {
                                    id: true, name: true, description: true, color: true, icon: true,
                                    start_time: true, end_time: true, duration_minutes: true, order_index: true, notes: true,
                                    moments: { orderBy: { order_index: 'asc' as const }, select: { id: true, name: true, order_index: true, duration_seconds: true, is_required: true } },
                                },
                            },
                            subjects: { orderBy: { order_index: 'asc' as const }, select: { id: true, name: true, real_name: true, count: true, order_index: true } },
                            location_slots: {
                                orderBy: { order_index: 'asc' as const },
                                select: { id: true, name: true, address: true, order_index: true, location: { select: { name: true, address_line1: true, city: true, state: true } } },
                            },
                        },
                    },
                    schedule_films: {
                        orderBy: { order_index: 'asc' as const },
                        select: { id: true, order_index: true, film: { select: { id: true, name: true, film_type: true, target_duration_min: true, target_duration_max: true } } },
                    },
                },
            },
        };
    }
}
