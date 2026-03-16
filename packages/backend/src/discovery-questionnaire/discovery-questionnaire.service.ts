import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
    CreateDiscoveryQuestionnaireSubmissionDto,
    CreateDiscoveryQuestionnaireTemplateDto,
    UpdateDiscoveryQuestionnaireTemplateDto,
} from './dto/discovery-questionnaire.dto';
import { InquiryTasksService } from '../inquiry-tasks/inquiry-tasks.service';

@Injectable()
export class DiscoveryQuestionnaireService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly inquiryTasksService: InquiryTasksService,
    ) {}

    // ─── Templates ───────────────────────────────────────────────────────────

    async getActiveTemplate(brandId: number) {
        const existing = await this.prisma.discovery_questionnaire_templates.findFirst({
            where: { brand_id: brandId, is_active: true },
            include: { questions: { orderBy: { order_index: 'asc' } } },
        });
        return existing ?? this.createDefaultTemplate(brandId);
    }

    async listTemplates(brandId: number) {
        return this.prisma.discovery_questionnaire_templates.findMany({
            where: { brand_id: brandId },
            include: { questions: { orderBy: { order_index: 'asc' } } },
            orderBy: { updated_at: 'desc' },
        });
    }

    async getTemplateById(templateId: number, brandId: number) {
        const template = await this.prisma.discovery_questionnaire_templates.findFirst({
            where: { id: templateId, brand_id: brandId },
            include: { questions: { orderBy: { order_index: 'asc' } } },
        });
        if (!template) throw new NotFoundException('Discovery questionnaire template not found');
        return template;
    }

    async createTemplate(payload: CreateDiscoveryQuestionnaireTemplateDto, brandId: number) {
        return this.prisma.discovery_questionnaire_templates.create({
            data: {
                brand_id: brandId,
                name: payload.name,
                description: payload.description,
                is_active: payload.is_active ?? true,
                questions: {
                    create: payload.questions.map((q) => ({
                        order_index: q.order_index,
                        section: q.section,
                        prompt: q.prompt,
                        script_hint: q.script_hint,
                        field_type: q.field_type,
                        field_key: q.field_key,
                        required: q.required ?? false,
                        options: (q.options ?? undefined) as Prisma.InputJsonValue | undefined,
                    })),
                },
            },
            include: { questions: { orderBy: { order_index: 'asc' } } },
        });
    }

    async updateTemplate(
        templateId: number,
        payload: UpdateDiscoveryQuestionnaireTemplateDto,
        brandId: number,
    ) {
        const template = await this.getTemplateById(templateId, brandId);

        return this.prisma.$transaction(async (tx) => {
            if (payload.questions) {
                await tx.discovery_questionnaire_questions.deleteMany({
                    where: { template_id: template.id },
                });
            }

            return tx.discovery_questionnaire_templates.update({
                where: { id: template.id },
                data: {
                    name: payload.name ?? template.name,
                    description: payload.description ?? template.description,
                    is_active: payload.is_active ?? template.is_active,
                    questions: payload.questions
                        ? {
                              create: payload.questions.map((q) => ({
                                  order_index: q.order_index,
                                  section: q.section,
                                  prompt: q.prompt,
                                  script_hint: q.script_hint,
                                  field_type: q.field_type,
                                  field_key: q.field_key,
                                  required: q.required ?? false,
                                  options: (q.options ?? undefined) as Prisma.InputJsonValue | undefined,
                              })),
                          }
                        : undefined,
                },
                include: { questions: { orderBy: { order_index: 'asc' } } },
            });
        });
    }

    // ─── Submissions ──────────────────────────────────────────────────────────

    async listSubmissions(brandId: number, inquiryId?: number) {
        return this.prisma.discovery_questionnaire_submissions.findMany({
            where: {
                brand_id: brandId,
                ...(inquiryId ? { inquiry_id: inquiryId } : {}),
            },
            include: { template: { include: { questions: { orderBy: { order_index: 'asc' } } } } },
            orderBy: { submitted_at: 'desc' },
        });
    }

    async getSubmissionById(submissionId: number, brandId: number) {
        const submission = await this.prisma.discovery_questionnaire_submissions.findFirst({
            where: { id: submissionId, brand_id: brandId },
            include: { template: { include: { questions: { orderBy: { order_index: 'asc' } } } } },
        });
        if (!submission) throw new NotFoundException('Discovery questionnaire submission not found');
        return submission;
    }

    async getSubmissionByInquiryId(inquiryId: number, brandId: number) {
        return this.prisma.discovery_questionnaire_submissions.findFirst({
            where: { inquiry_id: inquiryId, brand_id: brandId },
            include: { template: { include: { questions: { orderBy: { order_index: 'asc' } } } } },
            orderBy: { submitted_at: 'desc' },
        });
    }

    async createSubmission(payload: CreateDiscoveryQuestionnaireSubmissionDto, brandId: number) {
        await this.getTemplateById(payload.template_id, brandId);

        const submission = await this.prisma.discovery_questionnaire_submissions.create({
            data: {
                brand_id: brandId,
                template_id: payload.template_id,
                inquiry_id: payload.inquiry_id,
                responses: payload.responses as Prisma.InputJsonValue,
                call_notes: payload.call_notes,
            },
            include: { template: { include: { questions: { orderBy: { order_index: 'asc' } } } } },
        });

        // Auto-complete "Requirements Discovery" task when a submission is linked to an inquiry
        if (payload.inquiry_id) {
            try {
                await this.inquiryTasksService.autoCompleteByName(
                    payload.inquiry_id,
                    'Requirements Discovery',
                );
            } catch {
                // Best-effort — don't fail the submission if task auto-complete errors
            }
        }

        return submission;
    }

    // ─── Default Template ─────────────────────────────────────────────────────

    private createDefaultTemplate(brandId: number) {
        const questions = [
            // Rapport & Opening
            {
                order_index: 1,
                section: 'Rapport & Opening',
                prompt: 'How did you hear about us?',
                script_hint: 'Ask casually: "How did you first come across us?" Note the source — it helps with marketing too.',
                field_type: 'select',
                field_key: 'lead_source',
                required: false,
                options: { values: ['Google / Search', 'Instagram', 'TikTok', 'Friend / Family referral', 'Venue recommendation', 'Wedding fair', 'Photographer referral', 'Other'] },
            },
            {
                order_index: 2,
                section: 'Rapport & Opening',
                prompt: 'Tell me about yourselves as a couple.',
                script_hint: 'Use as a warm opener — let them talk freely. Listen for personality cues. How long together? How did you meet?',
                field_type: 'textarea',
                field_key: 'couple_intro',
                required: false,
            },
            {
                order_index: 3,
                section: 'Rapport & Opening',
                prompt: 'Tell me about your engagement — how did it happen?',
                script_hint: '"I love hearing the proposal story if you want to share it!" — great rapport builder and surfaces emotions to capture.',
                field_type: 'textarea',
                field_key: 'engagement_story',
                required: false,
            },
            // The Wedding Day Vision
            {
                order_index: 4,
                section: 'The Wedding Day Vision',
                prompt: "What's the overall vibe or feeling you want from your wedding film?",
                script_hint: '"If you had to describe the film in three words, what would they be?" — romantic, cinematic, fun, emotional, documentary-style?',
                field_type: 'textarea',
                field_key: 'film_vibe',
                required: false,
            },
            {
                order_index: 5,
                section: 'The Wedding Day Vision',
                prompt: "Are there any films or styles you've seen that resonate with you?",
                script_hint: '"Have you seen any of our work on Instagram or our website that stood out?" — understand their aesthetic preference early.',
                field_type: 'textarea',
                field_key: 'style_references',
                required: false,
            },
            {
                order_index: 6,
                section: 'The Wedding Day Vision',
                prompt: 'What moments on the day are most important to you?',
                script_hint: 'Prompt: "First look? Vows? First dance? Raw emotional moments? Parent reactions?" — helps shape the edit and coverage plan.',
                field_type: 'textarea',
                field_key: 'key_moments',
                required: false,
            },
            {
                order_index: 7,
                section: 'The Wedding Day Vision',
                prompt: "Is there anything you definitely want captured — or definitely don't want?",
                script_hint: '"Any specific people, moments, or details that are non-negotiable for the film? Any no-go zones or sensitivities I should know about?"',
                field_type: 'textarea',
                field_key: 'must_have_shots',
                required: false,
            },
            // Logistics & Timeline
            {
                order_index: 8,
                section: 'Logistics & Timeline',
                prompt: 'Have you confirmed your venues?',
                script_hint: 'Note venue names — some venues have filming restrictions. Ask: "Do you know if there are any restrictions at the ceremony venue?"',
                field_type: 'select',
                field_key: 'venues_confirmed',
                required: false,
                options: { values: ['Yes — all confirmed', 'Ceremony only', 'Reception only', 'Not yet confirmed', 'TBC'] },
            },
            {
                order_index: 9,
                section: 'Logistics & Timeline',
                prompt: 'Can you walk me through the rough shape of your day?',
                script_hint: 'Ask: "What time does prep start? When\'s the ceremony? Speeches after dinner or before? First dance — early or late evening?" Take notes here.',
                field_type: 'textarea',
                field_key: 'rough_timeline',
                required: false,
            },
            {
                order_index: 10,
                section: 'Logistics & Timeline',
                prompt: 'How many guests are you expecting?',
                script_hint: 'Guest count affects the feel of the film and logistics. Larger weddings may need more coverage time.',
                field_type: 'number',
                field_key: 'guest_count',
                required: false,
            },
            {
                order_index: 11,
                section: 'Logistics & Timeline',
                prompt: 'Do you have any other vendors confirmed — photographer, band, planner?',
                script_hint: '"Knowing who else is on the team helps with coordination — especially with photographers and planners." Note any names for follow-up.',
                field_type: 'textarea',
                field_key: 'other_vendors',
                required: false,
            },
            // Coverage & Deliverables
            {
                order_index: 12,
                section: 'Coverage & Deliverables',
                prompt: 'Which film products are you most interested in?',
                script_hint: 'Walk through each one briefly. "Highlight film is our most popular — typically 4-8 mins. Full ceremony is for those who want every word preserved."',
                field_type: 'multiselect',
                field_key: 'desired_products',
                required: false,
                options: { values: ['Highlight film', 'Full ceremony film', 'Full speeches', 'Same-day edit', 'Social media clips', 'Raw footage', 'Second shooter'] },
            },
            {
                order_index: 13,
                section: 'Coverage & Deliverables',
                prompt: 'How long would you ideally like your highlight film to be?',
                script_hint: '"Shorter films (3-5 mins) are tight and punchy — great for sharing. Longer (8-12 mins) gives more room for story and emotion. What feels right for you?"',
                field_type: 'select',
                field_key: 'highlight_length',
                required: false,
                options: { values: ['3-5 minutes', '5-8 minutes', '8-12 minutes', 'No preference — trust your edit', 'Not sure yet'] },
            },
            // Budget & Decision
            {
                order_index: 14,
                section: 'Budget & Decision',
                prompt: 'Have you had a chance to look at our packages?',
                script_hint: 'If yes, ask which one stood out. If no, offer to walk through them briefly now or send a link after the call.',
                field_type: 'select',
                field_key: 'seen_packages',
                required: false,
                options: { values: ['Yes — reviewed in detail', 'Briefly', 'Not yet', 'Looked at the website'] },
            },
            {
                order_index: 15,
                section: 'Budget & Decision',
                prompt: 'Where does our pricing sit relative to your budget?',
                script_hint: 'Ask gently: "Just so I can point you in the right direction — does our pricing feel like it\'s in the right ballpark for you?" Don\'t push.',
                field_type: 'select',
                field_key: 'budget_fit',
                required: false,
                options: { values: ['Works well', 'Slightly over — open to exploring', 'At the top of our range', 'Out of reach at the moment', 'Prefer not to discuss yet'] },
            },
            {
                order_index: 16,
                section: 'Budget & Decision',
                prompt: "What's your timeline for making a decision?",
                script_hint: '"No pressure at all — just helps me know when to follow up." Urgency or a tight date can mean the date is at risk of being taken.',
                field_type: 'select',
                field_key: 'decision_timeline',
                required: false,
                options: { values: ['This week', 'Within two weeks', 'Within a month', 'A few months away', 'Just starting to explore'] },
            },
            {
                order_index: 17,
                section: 'Budget & Decision',
                prompt: 'Is it just the two of you making the decision, or are others involved?',
                script_hint: '"I want to make sure everyone has what they need to feel comfortable moving forward." Parents sometimes fund the videography.',
                field_type: 'text',
                field_key: 'decision_makers',
                required: false,
            },
            // Concerns & Questions
            {
                order_index: 18,
                section: 'Concerns & Questions',
                prompt: 'Do you have any concerns about the videography process?',
                script_hint: 'Common concerns: being on camera, feeling awkward, it being disruptive to guests, not knowing what to expect on the day. Address these proactively.',
                field_type: 'textarea',
                field_key: 'concerns',
                required: false,
            },
            {
                order_index: 19,
                section: 'Concerns & Questions',
                prompt: 'What would make this an easy decision for you?',
                script_hint: 'Powerful closing question — surfaces their actual hesitation or priority. Listen carefully and reflect it back.',
                field_type: 'textarea',
                field_key: 'key_decision_factors',
                required: false,
            },
            {
                order_index: 20,
                section: 'Concerns & Questions',
                prompt: 'Do you have any questions for me?',
                script_hint: '"I want to make sure you feel completely confident." Leave plenty of space here — don\'t rush. Their questions reveal what matters most to them.',
                field_type: 'textarea',
                field_key: 'client_questions',
                required: false,
            },
            // Next Steps
            {
                order_index: 21,
                section: 'Next Steps',
                prompt: "What's the best way to follow up with you?",
                script_hint: '"I\'ll put together a proposal — shall I send it over by email, or would you prefer I call you to walk through it?"',
                field_type: 'select',
                field_key: 'follow_up_method',
                required: false,
                options: { values: ['Email', 'Phone call', 'Text / WhatsApp', 'Video call', 'No follow-up needed yet'] },
            },
            {
                order_index: 22,
                section: 'Next Steps',
                prompt: 'Are you happy for us to put together a formal proposal?',
                script_hint: '"I\'d love to put something tailored together for you — does that sound good?" A yes here is a strong buying signal.',
                field_type: 'select',
                field_key: 'ready_for_proposal',
                required: false,
                options: { values: ['Yes — please send one over', 'Not quite yet', 'Maybe — let me think', 'Already have a proposal'] },
            },
            {
                order_index: 23,
                section: 'Next Steps',
                prompt: 'Internal call notes',
                script_hint: 'Private notes — not shared with the client. Note personality, excitement level, red flags, key priorities, and next action.',
                field_type: 'textarea',
                field_key: 'internal_notes',
                required: false,
            },
        ];

        return this.prisma.discovery_questionnaire_templates.create({
            data: {
                brand_id: brandId,
                name: 'Discovery Call Questionnaire',
                description: 'Script and notes guide for first discovery calls with wedding couples.',
                is_active: true,
                questions: {
                    create: questions.map((q) => ({
                        ...q,
                        options: q.options
                            ? (q.options as Prisma.InputJsonValue)
                            : undefined,
                    })),
                },
            },
            include: { questions: { orderBy: { order_index: 'asc' } } },
        });
    }
}
