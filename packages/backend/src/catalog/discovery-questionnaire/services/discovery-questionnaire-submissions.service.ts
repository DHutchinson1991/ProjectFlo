import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateDiscoveryQuestionnaireSubmissionDto } from '../dto/create-discovery-questionnaire-submission.dto';
import { UpdateDiscoveryQuestionnaireSubmissionDto } from '../dto/update-discovery-questionnaire-submission.dto';
import { InquiryTasksService } from '../../../workflow/tasks/inquiry/services/inquiry-tasks.service';

@Injectable()
export class DiscoveryQuestionnaireSubmissionsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly inquiryTasksService: InquiryTasksService,
    ) {}

    private readonly submissionInclude = {
        template: { include: { questions: { orderBy: { order_index: 'asc' as const } } } },
    };

    async listSubmissions(brandId: number, inquiryId?: number) {
        return this.prisma.discovery_questionnaire_submissions.findMany({
            where: {
                brand_id: brandId,
                ...(inquiryId ? { inquiry_id: inquiryId } : {}),
            },
            include: this.submissionInclude,
            orderBy: { submitted_at: 'desc' },
        });
    }

    async getSubmissionById(submissionId: number, brandId: number) {
        const submission = await this.prisma.discovery_questionnaire_submissions.findFirst({
            where: { id: submissionId, brand_id: brandId },
            include: this.submissionInclude,
        });
        if (!submission) throw new NotFoundException('Discovery questionnaire submission not found');
        return submission;
    }

    async getSubmissionByInquiryId(inquiryId: number, brandId: number) {
        return this.prisma.discovery_questionnaire_submissions.findFirst({
            where: { inquiry_id: inquiryId, brand_id: brandId },
            include: this.submissionInclude,
            orderBy: { submitted_at: 'desc' },
        });
    }

    async updateSubmission(
        submissionId: number,
        payload: UpdateDiscoveryQuestionnaireSubmissionDto,
        brandId: number,
    ) {
        const existing = await this.prisma.discovery_questionnaire_submissions.findFirst({
            where: { id: submissionId, brand_id: brandId },
        });
        if (!existing) throw new NotFoundException('Discovery questionnaire submission not found');

        return this.prisma.discovery_questionnaire_submissions.update({
            where: { id: submissionId },
            data: {
                ...(payload.responses !== undefined && { responses: payload.responses as Prisma.InputJsonValue }),
                ...(payload.call_notes !== undefined && { call_notes: payload.call_notes }),
                ...(payload.transcript !== undefined && { transcript: payload.transcript }),
                ...(payload.sentiment !== undefined && { sentiment: payload.sentiment as Prisma.InputJsonValue }),
                ...(payload.call_duration_seconds !== undefined && { call_duration_seconds: payload.call_duration_seconds }),
            },
            include: this.submissionInclude,
        });
    }

    async createSubmission(
        payload: CreateDiscoveryQuestionnaireSubmissionDto,
        brandId: number,
    ) {
        const submission = await this.prisma.discovery_questionnaire_submissions.create({
            data: {
                brand_id: brandId,
                template_id: payload.template_id,
                inquiry_id: payload.inquiry_id,
                responses: payload.responses as Prisma.InputJsonValue,
                call_notes: payload.call_notes,
                transcript: payload.transcript,
                sentiment: payload.sentiment
                    ? (payload.sentiment as Prisma.InputJsonValue)
                    : undefined,
                call_duration_seconds: payload.call_duration_seconds,
            },
            include: this.submissionInclude,
        });

        if (payload.inquiry_id) {
            try {
                await this.inquiryTasksService.autoCompleteByName(
                    payload.inquiry_id,
                    'Discovery Call',
                );
            } catch {
                // Best-effort — don't fail the submission if task auto-complete errors
            }
        }

        return submission;
    }
}
