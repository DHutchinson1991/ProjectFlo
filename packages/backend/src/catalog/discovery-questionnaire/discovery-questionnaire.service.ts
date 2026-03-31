import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateDiscoveryQuestionnaireTemplateDto } from './dto/create-discovery-questionnaire-template.dto';
import { UpdateDiscoveryQuestionnaireTemplateDto } from './dto/update-discovery-questionnaire-template.dto';
import { DEFAULT_DISCOVERY_QUESTIONS, TEMPLATE_VERSION } from './constants/default-template-questions';

@Injectable()
export class DiscoveryQuestionnaireService {
    constructor(private readonly prisma: PrismaService) {}

    // ─── Templates ───────────────────────────────────────────────────────────

    async getActiveTemplate(brandId: number) {
        const existing = await this.prisma.discovery_questionnaire_templates.findFirst({
            where: { brand_id: brandId, is_active: true },
            include: { questions: { orderBy: { order_index: 'asc' } } },
        });
        if (!existing) return this.createDefaultTemplate(brandId);

        // Auto-reset if template is from an older default version
        const versionTag = `[v${TEMPLATE_VERSION}]`;
        if (!existing.description?.includes(versionTag)) {
            return this.resetActiveTemplate(brandId);
        }
        return existing;
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
                        visibility: q.visibility ?? 'both',
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
                                  visibility: q.visibility ?? 'both',
                              })),
                          }
                        : undefined,
                },
                include: { questions: { orderBy: { order_index: 'asc' } } },
            });
        });
    }

    // ─── Default Template ─────────────────────────────────────────────────────

    async resetActiveTemplate(brandId: number) {
        const existing = await this.prisma.discovery_questionnaire_templates.findFirst({
            where: { brand_id: brandId, is_active: true },
        });
        if (existing) {
            await this.prisma.discovery_questionnaire_questions.deleteMany({
                where: { template_id: existing.id },
            });
            await this.prisma.discovery_questionnaire_templates.delete({
                where: { id: existing.id },
            });
        }
        return this.createDefaultTemplate(brandId);
    }

    private createDefaultTemplate(brandId: number) {
        return this.prisma.discovery_questionnaire_templates.create({
            data: {
                brand_id: brandId,
                name: 'Discovery Call Guide',
                description: `Conversational guide and notes capture for discovery calls with couples. Sections 1\u20135 are shareable with the client for review. [v${TEMPLATE_VERSION}]`,
                is_active: true,
                questions: {
                    create: DEFAULT_DISCOVERY_QUESTIONS.map((q) => ({
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
