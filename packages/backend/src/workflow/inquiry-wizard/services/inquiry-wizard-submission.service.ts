import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { CreateInquiryWizardSubmissionDto } from '../dto/create-inquiry-wizard-submission.dto';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';
import { InquiryWizardEstimateService } from './inquiry-wizard-estimate.service';
import { InquiryWizardLinkService } from './inquiry-wizard-link.service';

@Injectable()
export class InquiryWizardSubmissionService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly inquiryTasksService: InquiryTasksService,
        private readonly templateService: InquiryWizardTemplateService,
        private readonly estimateService: InquiryWizardEstimateService,
        private readonly linkService: InquiryWizardLinkService,
    ) {}

    async listSubmissions(brandId?: number, inquiryId?: number) {
        return this.prisma.inquiry_wizard_submissions.findMany({
            where: {
                ...(brandId ? { brand_id: brandId } : {}),
                ...(inquiryId ? { inquiry_id: inquiryId } : {}),
            },
            include: { template: true, inquiry: true, contact: true },
            orderBy: { submitted_at: 'desc' },
        });
    }

    async getSubmissionById(submissionId: number, brandId: number) {
        const submission = await this.prisma.inquiry_wizard_submissions.findFirst({
            where: { id: submissionId, brand_id: brandId },
            include: { template: { include: { questions: true } }, inquiry: true, contact: true },
        });
        if (!submission) {
            throw new NotFoundException('Inquiry wizard submission not found');
        }
        return submission;
    }

    async createSubmission(payload: CreateInquiryWizardSubmissionDto, brandId: number) {
        const template = await this.templateService.getTemplateById(payload.template_id, brandId);
        let inquiryId: number | undefined;
        let contactId: number | undefined;

        if (payload.inquiry_id) {
            const result = await this.linkService.linkToExistingInquiry(payload, brandId);
            inquiryId = result.inquiryId;
            contactId = result.contactId;
        } else if (payload.create_inquiry) {
            const result = await this.linkService.createNewInquiry(payload, brandId);
            inquiryId = result.inquiryId;
            contactId = result.contactId;
        }

        const submission = await this.prisma.inquiry_wizard_submissions.create({
            data: {
                brand_id: brandId,
                template_id: template.id,
                inquiry_id: inquiryId,
                contact_id: contactId,
                status: payload.status || 'submitted',
                responses: payload.responses as Prisma.InputJsonValue,
            },
            include: {
                template: { include: { questions: { orderBy: { order_index: 'asc' } } } },
                inquiry: { select: { id: true, portal_token: true } },
                contact: true,
            },
        });

        if (inquiryId) {
            await this.estimateService.autoCreateDraftEstimate(inquiryId);
        }

        return submission;
    }

    async convertSubmission(submissionId: number, brandId: number) {
        const submission = await this.getSubmissionById(submissionId, brandId);
        if (submission.inquiry_id) return submission;

        const responses = submission.responses as Record<string, unknown>;
        const createdInquiryId = await this.linkService.createInquiryFromResponses(responses, brandId);

        return this.prisma.inquiry_wizard_submissions.update({
            where: { id: submission.id },
            data: { inquiry_id: createdInquiryId, status: 'converted' },
            include: {
                template: { include: { questions: { orderBy: { order_index: 'asc' } } } },
                inquiry: true,
                contact: true,
            },
        });
    }

    async reviewSubmission(
        submissionId: number,
        brandId: number,
        data: { review_notes?: string; review_checklist_state?: Record<string, unknown> },
    ) {
        const submission = await this.getSubmissionById(submissionId, brandId);

        const updated = await this.prisma.inquiry_wizard_submissions.update({
            where: { id: submissionId },
            data: {
                review_notes: data.review_notes,
                reviewed_at: new Date(),
                ...(data.review_checklist_state !== undefined
                    ? { review_checklist_state: data.review_checklist_state as Prisma.InputJsonValue }
                    : {}),
            },
            include: { template: { include: { questions: true } }, inquiry: true, contact: true },
        });

        if (submission.inquiry_id) {
            await this.inquiryTasksService.autoCompleteByName(submission.inquiry_id, 'Review Inquiry');
        }

        return updated;
    }

    async createPublicSubmission(token: string, payload: CreateInquiryWizardSubmissionDto) {
        const template = await this.templateService.findByShareToken(token);
        return this.createSubmission(
            { ...payload, template_id: template.id },
            template.brand_id,
        );
    }

    async updateSubmissionResponses(submissionId: number, responses: Record<string, unknown>) {
        const submission = await this.prisma.inquiry_wizard_submissions.findUnique({
            where: { id: submissionId },
            select: { id: true, inquiry_id: true, responses: true },
        });
        if (!submission) throw new NotFoundException('Submission not found');

        const oldResponses = (submission.responses as Record<string, unknown>) || {};
        const merged = { ...oldResponses, ...responses };

        const updated = await this.prisma.inquiry_wizard_submissions.update({
            where: { id: submissionId },
            data: { responses: merged as Prisma.InputJsonValue },
            include: {
                template: { include: { questions: { orderBy: { order_index: 'asc' } } } },
                inquiry: { select: { id: true, portal_token: true } },
            },
        });

        // Sync payment schedule template ID to inquiry if it was updated
        if ('payment_schedule_template_id' in responses && submission.inquiry_id) {
            const templateId = responses.payment_schedule_template_id;
            await this.prisma.inquiries.update({
                where: { id: submission.inquiry_id },
                data: {
                    preferred_payment_schedule_template_id:
                        typeof templateId === 'number' ? templateId : null,
                },
            });
        }

        return updated;
    }
}
