import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateNeedsAssessmentSubmissionDto,
    CreateNeedsAssessmentTemplateDto,
    UpdateNeedsAssessmentTemplateDto,
} from './dto/needs-assessment.dto';
import { InquiriesService } from '../inquiries/inquiries.service';
import { $Enums, Prisma } from '@prisma/client';

@Injectable()
export class NeedsAssessmentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly inquiriesService: InquiriesService,
    ) {}

    async getActiveTemplate(brandId?: number) {
        const existing = await this.prisma.needs_assessment_templates.findFirst({
            where: {
                is_active: true,
                ...(brandId ? { brand_id: brandId } : {}),
            },
            include: { questions: { orderBy: { order_index: 'asc' } } },
        });

        if (existing) {
            return existing;
        }

        if (!brandId) {
            throw new NotFoundException('No active needs assessment template found');
        }

        return this.createDefaultTemplate(brandId);
    }

    async listTemplates(brandId: number) {
        return this.prisma.needs_assessment_templates.findMany({
            where: { brand_id: brandId },
            include: { questions: { orderBy: { order_index: 'asc' } } },
            orderBy: { updated_at: 'desc' },
        });
    }

    async getTemplateById(templateId: number, brandId: number) {
        const template = await this.prisma.needs_assessment_templates.findFirst({
            where: { id: templateId, brand_id: brandId },
            include: { questions: { orderBy: { order_index: 'asc' } } },
        });

        if (!template) {
            throw new NotFoundException('Needs assessment template not found');
        }

        return template;
    }

    async createTemplate(payload: CreateNeedsAssessmentTemplateDto, brandId: number) {
        const status = payload.status ?? 'draft';
        const isLive = status === 'live';

        return this.prisma.needs_assessment_templates.create({
            data: {
                brand_id: brandId,
                name: payload.name,
                description: payload.description,
                is_active: payload.is_active ?? true,
            status,
                version: payload.version ?? '1.0',
            published_at: isLive ? new Date() : null,
                questions: {
                    create: payload.questions.map((question) => ({
                        order_index: question.order_index,
                        prompt: question.prompt,
                        field_type: question.field_type,
                        field_key: question.field_key,
                        required: question.required ?? false,
                        options: (question.options ?? undefined) as Prisma.InputJsonValue | undefined,
                        condition_json: (question.condition_json ?? undefined) as Prisma.InputJsonValue | undefined,
                        help_text: question.help_text,
                        category: question.category,
                    })),
                },
            },
            include: { questions: { orderBy: { order_index: 'asc' } } },
        });
    }

    async updateTemplate(templateId: number, payload: UpdateNeedsAssessmentTemplateDto, brandId: number) {
        const template = await this.getTemplateById(templateId, brandId);

        return this.prisma.$transaction(async (tx) => {
            if (payload.questions) {
                await tx.needs_assessment_questions.deleteMany({
                    where: { template_id: template.id },
                });
            }

            const status = payload.status ?? template.status;
            const isLive = status === 'live';

            const updated = await tx.needs_assessment_templates.update({
                where: { id: template.id },
                data: {
                    name: payload.name ?? template.name,
                    description: payload.description ?? template.description,
                    is_active: isLive ? true : (payload.is_active ?? template.is_active),
                    status,
                    version: payload.version ?? template.version,
                    published_at: isLive ? new Date() : template.published_at,
                    questions: payload.questions
                        ? {
                              create: payload.questions.map((question) => ({
                                  order_index: question.order_index,
                                  prompt: question.prompt,
                                  field_type: question.field_type,
                                  field_key: question.field_key,
                                  required: question.required ?? false,
                                  options: (question.options ?? undefined) as Prisma.InputJsonValue | undefined,
                                  condition_json: (question.condition_json ?? undefined) as Prisma.InputJsonValue | undefined,
                                  help_text: question.help_text,
                                  category: question.category,
                              })),
                          }
                        : undefined,
                },
                include: { questions: { orderBy: { order_index: 'asc' } } },
            });

            return updated;
        });
    }

    async listSubmissions(brandId?: number, inquiryId?: number) {
        return this.prisma.needs_assessment_submissions.findMany({
            where: {
                ...(brandId ? { brand_id: brandId } : {}),
                ...(inquiryId ? { inquiry_id: inquiryId } : {}),
            },
            include: {
                template: true,
                inquiry: true,
                contact: true,
            },
            orderBy: { submitted_at: 'desc' },
        });
    }

    async getSubmissionById(submissionId: number, brandId: number) {
        const submission = await this.prisma.needs_assessment_submissions.findFirst({
            where: { id: submissionId, brand_id: brandId },
            include: { template: { include: { questions: true } }, inquiry: true, contact: true },
        });

        if (!submission) {
            throw new NotFoundException('Needs assessment submission not found');
        }

        return submission;
    }

    async createSubmission(payload: CreateNeedsAssessmentSubmissionDto, brandId: number) {
        const template = await this.getTemplateById(payload.template_id, brandId);

        let inquiryId: number | undefined;
        let contactId: number | undefined;

        if (payload.create_inquiry) {
            const responses = payload.responses || {};
            const contact = payload.contact || {};
            const inquiry = payload.inquiry || {};

            const inferredInquiry = {
                wedding_date: inquiry.wedding_date || (responses['wedding_date'] as string) || new Date().toISOString(),
                venue_details: inquiry.venue_details || (responses['venue_details'] as string),
                notes: inquiry.notes || (responses['notes'] as string),
                lead_source: inquiry.lead_source || (responses['lead_source'] as string) || 'Needs Assessment',
                lead_source_details: inquiry.lead_source_details || JSON.stringify(responses),
                selected_package_id: inquiry.selected_package_id,
                status: $Enums.inquiries_status.New,
                first_name: contact.first_name || (responses['contact_first_name'] as string) || 'Unknown',
                last_name: contact.last_name || (responses['contact_last_name'] as string) || 'Lead',
                email: contact.email || (responses['contact_email'] as string) || `needs_assessment_${Date.now()}@temp.com`,
                phone_number: contact.phone_number || (responses['contact_phone'] as string) || '',
            };

            const createdInquiry = await this.inquiriesService.create(inferredInquiry, brandId);
            inquiryId = createdInquiry.id;

            const linkedContact = await this.prisma.contacts.findUnique({
                where: { email: inferredInquiry.email },
                select: { id: true },
            });
            contactId = linkedContact?.id;
        }

        return this.prisma.needs_assessment_submissions.create({
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
                inquiry: true,
                contact: true,
            },
        });
    }

    async convertSubmission(submissionId: number, brandId: number) {
        const submission = await this.getSubmissionById(submissionId, brandId);
        if (submission.inquiry_id) {
            return submission;
        }

        const responses = submission.responses as Record<string, unknown>;
        const inferredInquiry = {
            wedding_date: (responses['wedding_date'] as string) || new Date().toISOString(),
            venue_details: (responses['venue_details'] as string),
            notes: (responses['notes'] as string),
            lead_source: (responses['lead_source'] as string) || 'Needs Assessment',
            lead_source_details: JSON.stringify(responses),
            selected_package_id: undefined,
            status: $Enums.inquiries_status.New,
            first_name: (responses['contact_first_name'] as string) || 'Unknown',
            last_name: (responses['contact_last_name'] as string) || 'Lead',
            email: (responses['contact_email'] as string) || `needs_assessment_${Date.now()}@temp.com`,
            phone_number: (responses['contact_phone'] as string) || '',
        };

        const createdInquiry = await this.inquiriesService.create(inferredInquiry, brandId);

        return this.prisma.needs_assessment_submissions.update({
            where: { id: submission.id },
            data: {
                inquiry_id: createdInquiry.id,
                status: 'converted',
            },
            include: {
                template: { include: { questions: { orderBy: { order_index: 'asc' } } } },
                inquiry: true,
                contact: true,
            },
        });
    }

    private createDefaultTemplate(brandId: number) {
        const questions = [
            {
                order_index: 1,
                prompt: 'Contact first name',
                field_type: 'text',
                field_key: 'contact_first_name',
                required: true,
                category: 'Contact',
            },
            {
                order_index: 2,
                prompt: 'Contact last name',
                field_type: 'text',
                field_key: 'contact_last_name',
                required: true,
                category: 'Contact',
            },
            {
                order_index: 3,
                prompt: 'Contact email',
                field_type: 'email',
                field_key: 'contact_email',
                required: true,
                category: 'Contact',
            },
            {
                order_index: 4,
                prompt: 'Contact phone number',
                field_type: 'phone',
                field_key: 'contact_phone',
                required: false,
                category: 'Contact',
            },
            {
                order_index: 5,
                prompt: 'Wedding / Event date',
                field_type: 'date',
                field_key: 'wedding_date',
                required: true,
                category: 'Event',
            },
            {
                order_index: 6,
                prompt: 'Venue or location',
                field_type: 'text',
                field_key: 'venue_details',
                required: false,
                category: 'Event',
            },
            {
                order_index: 7,
                prompt: 'Priority level',
                field_type: 'select',
                field_key: 'priority_level',
                required: true,
                options: { values: ['Low', 'Medium', 'High'] },
                category: 'Priority',
            },
            {
                order_index: 8,
                prompt: 'Budget range',
                field_type: 'select',
                field_key: 'budget_range',
                required: false,
                options: { values: ['$2k-$4k', '$4k-$6k', '$6k-$8k', '$8k+'] },
                category: 'Budget',
            },
            {
                order_index: 9,
                prompt: 'Budget flexibility',
                field_type: 'select',
                field_key: 'budget_flexible',
                required: false,
                options: { values: ['Fixed', 'Some flexibility', 'Flexible'] },
                category: 'Budget',
            },
            {
                order_index: 10,
                prompt: 'Coverage hours needed',
                field_type: 'select',
                field_key: 'coverage_hours',
                required: false,
                options: { values: ['4-6 hours', '6-8 hours', '8-10 hours', 'Full day'] },
                category: 'Scope',
            },
            {
                order_index: 11,
                prompt: 'Deliverables requested',
                field_type: 'multiselect',
                field_key: 'deliverables',
                required: false,
                options: { values: ['Highlight film', 'Full ceremony', 'Speeches', 'Raw footage', 'Social clips'] },
                category: 'Scope',
            },
            {
                order_index: 12,
                prompt: 'Add-ons / extras',
                field_type: 'multiselect',
                field_key: 'add_ons',
                required: false,
                options: { values: ['Drone coverage', 'Second shooter', 'Same-day edit', 'Live stream'] },
                category: 'Scope',
            },
            {
                order_index: 13,
                prompt: 'Decision timeline',
                field_type: 'select',
                field_key: 'decision_timeline',
                required: false,
                options: { values: ['ASAP', '1-2 weeks', '1 month', 'Just exploring'] },
                category: 'Timeline',
            },
            {
                order_index: 14,
                prompt: 'Target booking date',
                field_type: 'date',
                field_key: 'booking_date',
                required: false,
                category: 'Timeline',
            },
            {
                order_index: 15,
                prompt: 'Key stakeholders',
                field_type: 'text',
                field_key: 'stakeholders',
                required: false,
                category: 'Stakeholders',
            },
            {
                order_index: 16,
                prompt: 'Preferred communication method',
                field_type: 'select',
                field_key: 'preferred_contact_method',
                required: false,
                options: { values: ['Email', 'Phone', 'Text', 'Zoom'] },
                category: 'Communication',
            },
            {
                order_index: 17,
                prompt: 'Preferred contact time',
                field_type: 'text',
                field_key: 'preferred_contact_time',
                required: false,
                category: 'Communication',
            },
            {
                order_index: 18,
                prompt: 'Additional notes',
                field_type: 'textarea',
                field_key: 'notes',
                required: false,
                category: 'Notes',
            },
        ];

        return this.prisma.needs_assessment_templates.create({
            data: {
                brand_id: brandId,
                name: 'Sales Needs Assessment',
                description: 'Standard booking questionnaire for incoming sales inquiries.',
                is_active: true,
                status: 'live',
                version: '1.0',
                published_at: new Date(),
                questions: {
                    create: questions,
                },
            },
            include: { questions: { orderBy: { order_index: 'asc' } } },
        });
    }
}
