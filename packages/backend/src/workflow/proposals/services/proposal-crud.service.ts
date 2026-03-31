import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { CreateProposalDto, UpdateProposalDto } from '../dto/proposals.dto';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { ProposalContentGeneratorService } from './proposal-content-generator.service';
import { QuotesService } from '../../../finance/quotes/quotes.service';
import { ContractsService } from '../../../finance/contracts/contracts.service';

const PROPOSAL_INCLUDE = {
    inquiry: {
        include: {
            contact: {
                select: { first_name: true, last_name: true, email: true, brand_id: true },
            },
            contracts: {
                orderBy: { id: 'desc' as const },
                take: 1,
                select: {
                    id: true,
                    status: true,
                    sent_at: true,
                    signed_date: true,
                    signers: {
                        select: { status: true, viewed_at: true, signed_at: true },
                        take: 1,
                    },
                },
            },
        },
    },
    project: { select: { id: true, project_name: true } },
    section_views: {
        select: { section_type: true, viewed_at: true, duration_seconds: true },
    },
    section_notes: {
        select: { section_type: true, note: true, created_at: true, updated_at: true },
    },
} as const;

@Injectable()
export class ProposalCrudService {
    private readonly logger = new Logger(ProposalCrudService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly contentGen: ProposalContentGeneratorService,
        private readonly inquiryTasksService: InquiryTasksService,
        private readonly quotesService: QuotesService,
        private readonly contractsService: ContractsService,
    ) {}

    async findAllByInquiry(inquiryId: number, brandId: number) {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: { id: inquiryId, contact: { brand_id: brandId } },
        });
        if (!inquiry) throw new NotFoundException(`Inquiry with ID ${inquiryId} not found`);

        return this.prisma.proposals.findMany({
            where: { inquiry_id: inquiryId },
            include: PROPOSAL_INCLUDE,
            orderBy: { created_at: 'desc' },
        });
    }

    async findOne(id: number, inquiryId: number, brandId: number) {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: { id: inquiryId, contact: { brand_id: brandId } },
        });
        if (!inquiry) throw new NotFoundException(`Inquiry with ID ${inquiryId} not found`);

        const proposal = await this.prisma.proposals.findFirst({
            where: { id, inquiry_id: inquiryId },
            include: PROPOSAL_INCLUDE,
        });
        if (!proposal) throw new NotFoundException(`Proposal with ID ${id} not found`);
        return proposal;
    }

    async create(inquiryId: number, createProposalDto: CreateProposalDto, brandId: number) {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: { id: inquiryId, contact: { brand_id: brandId } },
            include: {
                contact: true,
                event_type: true,
                selected_package: { select: { id: true, name: true, currency: true } },
            },
        });
        if (!inquiry) throw new NotFoundException(`Inquiry with ID ${inquiryId} not found`);

        const content = await this.contentGen.generateProposalContent(inquiry, brandId);
        const title = this.contentGen.generateTitle(inquiry);

        const proposal = await this.prisma.proposals.create({
            data: {
                inquiry_id: inquiryId,
                title,
                content: content as Prisma.InputJsonValue,
                status: 'Draft',
                version: 1,
                share_token: randomUUID(),
            },
            include: PROPOSAL_INCLUDE,
        });

        await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Create & Review Proposal');

        // Auto-create a quote from the primary estimate
        try {
            await this.quotesService.createFromEstimate(inquiryId);
        } catch (err) {
            this.logger.error(`Failed to auto-create quote for inquiry ${inquiryId}: ${err instanceof Error ? err.message : err}`);
        }

        // Auto-compose a contract from the brand's default template
        try {
            const defaultTemplate = await this.prisma.contract_templates.findFirst({
                where: { brand_id: brandId, is_default: true, is_active: true },
            });
            if (defaultTemplate) {
                await this.contractsService.composeFromTemplate(inquiryId, brandId, {
                    template_id: defaultTemplate.id,
                });
                this.logger.log(`Auto-composed contract from template "${defaultTemplate.name}" for inquiry ${inquiryId}`);
            } else {
                this.logger.warn(`No default contract template found for brand ${brandId} — skipping auto-contract`);
            }
        } catch (err) {
            this.logger.error(`Failed to auto-compose contract for inquiry ${inquiryId}: ${err instanceof Error ? err.message : err}`);
        }

        return proposal;
    }

    async update(id: number, inquiryId: number, updateProposalDto: UpdateProposalDto, brandId: number) {
        await this.findOne(id, inquiryId, brandId);
        return this.prisma.proposals.update({
            where: { id },
            data: {
                ...updateProposalDto,
                content: updateProposalDto.content as Prisma.InputJsonValue,
                updated_at: new Date(),
            },
            include: PROPOSAL_INCLUDE,
        });
    }

    async remove(id: number, inquiryId: number, brandId: number) {
        await this.findOne(id, inquiryId, brandId);
        await this.prisma.proposals.delete({ where: { id } });
        return { message: 'Proposal deleted successfully' };
    }
}
