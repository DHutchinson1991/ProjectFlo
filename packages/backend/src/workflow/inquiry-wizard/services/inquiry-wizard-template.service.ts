import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma, InquiryWizardStage } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { CreateInquiryWizardTemplateDto } from '../dto/create-inquiry-wizard-template.dto';
import { UpdateInquiryWizardTemplateDto } from '../dto/update-inquiry-wizard-template.dto';
import { DEFAULT_TEMPLATE_QUESTIONS, DEFAULT_TEMPLATE_STEPS } from '../constants/default-template';
import {
    DEFAULT_DISCOVERY_CALL_QUESTIONS,
    DISCOVERY_CALL_TEMPLATE_VERSION,
} from '../constants/default-discovery-call-template';

@Injectable()
export class InquiryWizardTemplateService {
    constructor(private readonly prisma: PrismaService) {}

    async getActiveTemplate(brandId?: number, stage: InquiryWizardStage = InquiryWizardStage.INTAKE) {
        if (!brandId) {
            throw new NotFoundException(
                stage === InquiryWizardStage.DISCOVERY_CALL
                    ? 'No active discovery-call template found'
                    : 'No active inquiry wizard template found',
            );
        }

        if (stage === InquiryWizardStage.DISCOVERY_CALL) {
            return this.getActiveDiscoveryCallTemplate(brandId);
        }

        const existing = await this.prisma.inquiry_wizard_templates.findFirst({
            where: {
                is_active: true,
                stage,
                brand_id: brandId,
            },
            include: { questions: { orderBy: { order_index: 'asc' } } },
        });

        if (existing) return existing;

        return this.createDefaultTemplate(brandId);
    }

    async listTemplates(brandId: number, stage?: InquiryWizardStage) {
        return this.prisma.inquiry_wizard_templates.findMany({
            where: { brand_id: brandId, ...(stage ? { stage } : {}) },
            include: { questions: { orderBy: { order_index: 'asc' } } },
            orderBy: { updated_at: 'desc' },
        });
    }

    /** DISCOVERY_CALL-stage only: delete the active template and recreate it from defaults. */
    async resetActiveTemplate(brandId: number, stage: InquiryWizardStage = InquiryWizardStage.DISCOVERY_CALL) {
        const existing = await this.prisma.inquiry_wizard_templates.findFirst({
            where: { brand_id: brandId, is_active: true, stage },
        });
        if (existing) {
            await this.prisma.inquiry_wizard_questions.deleteMany({
                where: { template_id: existing.id },
            });
            await this.prisma.inquiry_wizard_templates.delete({
                where: { id: existing.id },
            });
        }
        return this.createDefaultDiscoveryCallTemplate(brandId);
    }

    private async getActiveDiscoveryCallTemplate(brandId: number) {
        const existing = await this.prisma.inquiry_wizard_templates.findFirst({
            where: { brand_id: brandId, is_active: true, stage: InquiryWizardStage.DISCOVERY_CALL },
            include: { questions: { orderBy: { order_index: 'asc' } } },
        });
        if (!existing) return this.createDefaultDiscoveryCallTemplate(brandId);

        // Auto-reset if template is from an older default version
        const versionTag = `[v${DISCOVERY_CALL_TEMPLATE_VERSION}]`;
        if (!existing.description?.includes(versionTag)) {
            return this.resetActiveTemplate(brandId, InquiryWizardStage.DISCOVERY_CALL);
        }
        return existing;
    }

    private createDefaultDiscoveryCallTemplate(brandId: number) {
        return this.prisma.inquiry_wizard_templates.create({
            data: {
                brand_id: brandId,
                name: 'Discovery Call Guide',
                description: `Conversational guide and notes capture for discovery calls with couples. Sections 1\u20135 are shareable with the client for review. [v${DISCOVERY_CALL_TEMPLATE_VERSION}]`,
                is_active: true,
                status: 'live',
                stage: InquiryWizardStage.DISCOVERY_CALL,
                questions: {
                    create: DEFAULT_DISCOVERY_CALL_QUESTIONS.map((q) => ({
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

    async getTemplateById(templateId: number, brandId: number) {
        const template = await this.prisma.inquiry_wizard_templates.findFirst({
            where: { id: templateId, brand_id: brandId },
            include: { questions: { orderBy: { order_index: 'asc' } } },
        });
        if (!template) {
            throw new NotFoundException('Inquiry wizard template not found');
        }
        return template;
    }

    async createTemplate(payload: CreateInquiryWizardTemplateDto, brandId: number) {
        const status = payload.status ?? 'draft';
        const isLive = status === 'live';

        return this.prisma.inquiry_wizard_templates.create({
            data: {
                brand_id: brandId,
                name: payload.name,
                description: payload.description,
                is_active: payload.is_active ?? true,
                status,
                version: payload.version ?? '1.0',
                stage: payload.stage ?? InquiryWizardStage.INTAKE,
                published_at: isLive ? new Date() : null,
                steps_config: (payload.steps_config ?? undefined) as Prisma.InputJsonValue | undefined,
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
                        section: question.section,
                        script_hint: question.script_hint,
                        visibility: question.visibility ?? 'both',
                    })),
                },
            },
            include: { questions: { orderBy: { order_index: 'asc' } } },
        });
    }

    async updateTemplate(templateId: number, payload: UpdateInquiryWizardTemplateDto, brandId: number) {
        const template = await this.getTemplateById(templateId, brandId);

        return this.prisma.$transaction(async (tx) => {
            if (payload.questions) {
                await tx.inquiry_wizard_questions.deleteMany({
                    where: { template_id: template.id },
                });
            }

            const status = payload.status ?? template.status;
            const isLive = status === 'live';

            return tx.inquiry_wizard_templates.update({
                where: { id: template.id },
                data: {
                    name: payload.name ?? template.name,
                    description: payload.description ?? template.description,
                    is_active: isLive ? true : (payload.is_active ?? template.is_active),
                    status,
                    version: payload.version ?? template.version,
                    published_at: isLive ? new Date() : template.published_at,
                    steps_config: payload.steps_config !== undefined
                        ? (payload.steps_config as Prisma.InputJsonValue)
                        : (template.steps_config as Prisma.InputJsonValue ?? undefined),
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
                                  section: question.section,
                                  script_hint: question.script_hint,
                                  visibility: question.visibility ?? 'both',
                              })),
                          }
                        : undefined,
                },
                include: { questions: { orderBy: { order_index: 'asc' } } },
            });
        });
    }

    async generateShareToken(templateId: number, brandId: number): Promise<string> {
        const template = await this.getTemplateById(templateId, brandId);
        if (template.stage !== InquiryWizardStage.INTAKE) {
            throw new BadRequestException('Only intake questionnaire templates can be shared publicly');
        }
        if (template.share_token) return template.share_token;

        const token = randomUUID();
        await this.prisma.inquiry_wizard_templates.update({
            where: { id: template.id },
            data: { share_token: token },
        });
        return token;
    }

    async findByShareToken(token: string) {
        const template = await this.prisma.inquiry_wizard_templates.findUnique({
            where: { share_token: token },
            include: {
                questions: { orderBy: { order_index: 'asc' } },
                brand: {
                    select: {
                        id: true,
                        name: true,
                        display_name: true,
                        description: true,
                        website: true,
                        email: true,
                        phone: true,
                        address_line1: true,
                        address_line2: true,
                        city: true,
                        state: true,
                        country: true,
                        postal_code: true,
                        logo_url: true,
                        currency: true,
                    },
                },
            },
        });

        if (!template || !template.is_active || template.stage !== InquiryWizardStage.INTAKE) {
            throw new NotFoundException('Questionnaire not found or no longer active');
        }

        const [packages, packageSets] = await Promise.all([
            this.prisma.service_packages.findMany({
                where: { brand_id: template.brand_id, is_active: true },
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.package_sets.findMany({
                where: { brand_id: template.brand_id },
                include: {
                    slots: {
                        orderBy: { order_index: 'asc' },
                        select: { id: true, slot_label: true, service_package_id: true, order_index: true },
                    },
                },
                orderBy: { order_index: 'asc' },
            }),
        ]);

        return { ...template, packages, package_sets: packageSets };
    }

    private createDefaultTemplate(brandId: number) {
        return this.prisma.inquiry_wizard_templates.create({
            data: {
                brand_id: brandId,
                name: 'Sales Inquiry Wizard',
                description: 'Standard booking questionnaire for incoming sales inquiries.',
                is_active: true,
                status: 'live',
                version: '1.0',
                published_at: new Date(),
                steps_config: DEFAULT_TEMPLATE_STEPS as Prisma.InputJsonValue,
                questions: { create: DEFAULT_TEMPLATE_QUESTIONS },
            },
            include: { questions: { orderBy: { order_index: 'asc' } } },
        });
    }
}
