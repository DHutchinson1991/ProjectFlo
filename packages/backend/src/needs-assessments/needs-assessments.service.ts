import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { geocodeAddress } from '../common/geocoding.util';
import {
    CreateNeedsAssessmentSubmissionDto,
    CreateNeedsAssessmentTemplateDto,
    UpdateNeedsAssessmentTemplateDto,
} from './dto/needs-assessment.dto';
import { InquiriesService } from '../inquiries/inquiries.service';
import { InquiryTasksService } from '../inquiry-tasks/inquiry-tasks.service';
import { EstimatesService } from '../estimates/estimates.service';
import { $Enums, Prisma } from '@prisma/client';
import { ProjectPackageSnapshotService } from '../projects/project-package-snapshot.service';
import { TaskLibraryService } from '../business/task-library/task-library.service';
import { PaymentSchedulesService } from '../payment-schedules/payment-schedules.service';

type AutoEstimateItem = {
    category?: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
};

@Injectable()
export class NeedsAssessmentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly inquiriesService: InquiriesService,
        private readonly inquiryTasksService: InquiryTasksService,
        private readonly estimatesService: EstimatesService,
        private readonly snapshotService: ProjectPackageSnapshotService,
        private readonly taskLibraryService: TaskLibraryService,
        private readonly paymentSchedulesService: PaymentSchedulesService,
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

        // If an existing inquiry_id is provided, link to it and update its fields from responses
        if (payload.inquiry_id) {
            inquiryId = payload.inquiry_id;
            const responses = payload.responses || {};

            // Fetch the existing inquiry so we can selectively fill blank fields
            const existingInquiry = await this.prisma.inquiries.findUnique({
                where: { id: payload.inquiry_id },
                include: { contact: { select: { id: true, first_name: true, last_name: true, email: true, phone_number: true } } },
            });
            contactId = existingInquiry?.contact_id ?? undefined;

            // Build an update payload — only overwrite fields that are currently blank
            const inquiryUpdate: Record<string, unknown> = {};

            if (!existingInquiry?.wedding_date && responses['wedding_date'])
                inquiryUpdate.wedding_date = new Date(responses['wedding_date'] as string);

            if (!existingInquiry?.guest_count && responses['guest_count'])
                inquiryUpdate.guest_count = responses['guest_count'] as string;

            if (!existingInquiry?.notes && responses['notes'])
                inquiryUpdate.notes = responses['notes'] as string;

            if (!existingInquiry?.lead_source && responses['lead_source'])
                inquiryUpdate.lead_source = responses['lead_source'] as string;

            // Always update lead_source_details with the full response JSON so it stays fresh
            inquiryUpdate.lead_source_details = JSON.stringify(responses);

            // selected_package_id from payload (wizard package step) or responses fallback
            const pkgIdFromPayload = payload.selected_package_id;
            const pkgIdFromResponses = responses['selected_package'] ? Number(responses['selected_package']) : null;
            const resolvedPkgId = (pkgIdFromPayload && !isNaN(pkgIdFromPayload)) ? pkgIdFromPayload
                : (pkgIdFromResponses && !isNaN(pkgIdFromResponses) ? pkgIdFromResponses : null);
            if (resolvedPkgId && !existingInquiry?.selected_package_id)
                inquiryUpdate.selected_package_id = resolvedPkgId;

            // Store preferred payment schedule template from wizard selection
            const resolvedScheduleId = payload.preferred_payment_schedule_template_id
                ?? (responses['payment_schedule_template_id'] != null
                    ? Number(responses['payment_schedule_template_id'])
                    : null);
            if (resolvedScheduleId)
                inquiryUpdate.preferred_payment_schedule_template_id = resolvedScheduleId;

            // Sync event_type_id from responses.event_type when the inquiry doesn't have one set
            if (!existingInquiry?.event_type_id && responses['event_type']) {
                const rawEventType = String(responses['event_type']).trim();
                // Try exact (case-insensitive) first, then singular form (strip trailing "s")
                let matchedEventType = await this.prisma.eventType.findFirst({
                    where: { name: { equals: rawEventType, mode: 'insensitive' } },
                });
                if (!matchedEventType && rawEventType.toLowerCase().endsWith('s')) {
                    matchedEventType = await this.prisma.eventType.findFirst({
                        where: { name: { equals: rawEventType.slice(0, -1), mode: 'insensitive' } },
                    });
                }
                if (matchedEventType) {
                    inquiryUpdate.event_type_id = matchedEventType.id;
                }
            }

            if (Object.keys(inquiryUpdate).length > 0) {
                await this.prisma.inquiries.update({
                    where: { id: payload.inquiry_id },
                    data: inquiryUpdate as Prisma.inquiriesUpdateInput,
                });

                // Re-evaluate auto-subtasks now that inquiry fields may have changed
                await this.inquiryTasksService.syncReviewInquiryAutoSubtasks(payload.inquiry_id);

                if (resolvedPkgId && !existingInquiry?.selected_package_id) {
                    try {
                        await this.inquiriesService.handlePackageSelection(payload.inquiry_id, resolvedPkgId, brandId);
                    } catch (err) {
                        console.error(`Failed to create inquiry package snapshot for inquiry ${payload.inquiry_id}:`, err);
                    }
                }
            }

            // Update contact fields if they were blank
            if (existingInquiry?.contact) {
                const contactUpdate: Record<string, string> = {};
                const c = existingInquiry.contact;
                if ((!c.first_name || c.first_name === 'Unknown') && responses['contact_first_name'])
                    contactUpdate.first_name = responses['contact_first_name'] as string;
                if ((!c.last_name || c.last_name === 'Lead') && responses['contact_last_name'])
                    contactUpdate.last_name = responses['contact_last_name'] as string;
                if (!c.phone_number && responses['contact_phone'])
                    contactUpdate.phone_number = responses['contact_phone'] as string;

                if (Object.keys(contactUpdate).length > 0) {
                    await this.prisma.contacts.update({
                        where: { id: existingInquiry.contact.id },
                        data: contactUpdate,
                    });
                }
            }

            // Pre-fill location slots and subject names from collected NA responses
            const prefillFirstName = ((responses['contact_first_name'] as string | undefined)?.trim()) || existingInquiry?.contact?.first_name || '';
            const prefillLastName = ((responses['contact_last_name'] as string | undefined)?.trim()) || existingInquiry?.contact?.last_name || '';
            const prefillContactName = [prefillFirstName, prefillLastName].filter(Boolean).join(' ');
            try {
                await this.prefillLocationSlots(payload.inquiry_id as number, responses as Record<string, unknown>, brandId);
                await this.prefillSubjectNames(payload.inquiry_id as number, responses as Record<string, unknown>, prefillContactName);
            } catch (err) {
                // Pre-fill is best-effort — log but don't fail the submission
                console.error(`NA prefill error for inquiry ${payload.inquiry_id}:`, err);
            }
        } else if (payload.create_inquiry) {
            const responses = payload.responses || {};
            const contact = payload.contact || {};
            const inquiry = payload.inquiry || {};

            const inferredInquiry = {
                wedding_date: inquiry.wedding_date || (responses['wedding_date'] as string) || new Date().toISOString(),
                guest_count: inquiry.guest_count || (responses['guest_count'] as string),
                notes: inquiry.notes || (responses['notes'] as string),
                lead_source: inquiry.lead_source || (responses['lead_source'] as string) || 'Needs Assessment',
                lead_source_details: inquiry.lead_source_details || JSON.stringify(responses),
                selected_package_id: payload.selected_package_id || inquiry.selected_package_id,
                ...(((payload.preferred_payment_schedule_template_id || responses['payment_schedule_template_id']) ? {
                    preferred_payment_schedule_template_id:
                        payload.preferred_payment_schedule_template_id
                        ?? (responses['payment_schedule_template_id'] != null
                            ? Number(responses['payment_schedule_template_id'])
                            : undefined),
                } : {}) as Record<string, unknown>),
                status: $Enums.inquiries_status.New,
                first_name: contact.first_name || (responses['contact_first_name'] as string) || 'Unknown',
                last_name: contact.last_name || (responses['contact_last_name'] as string) || 'Lead',
                email: contact.email || (responses['contact_email'] as string) || `needs_assessment_${Date.now()}@temp.com`,
                phone_number: contact.phone_number || (responses['contact_phone'] as string) || '',
            };

            // Resolve event_type_id from the wizard responses.event_type string
            if (responses['event_type']) {
                const rawEventType = String(responses['event_type']).trim();
                let matchedET = await this.prisma.eventType.findFirst({
                    where: { name: { equals: rawEventType, mode: 'insensitive' } },
                    select: { id: true },
                });
                if (!matchedET && rawEventType.toLowerCase().endsWith('s')) {
                    matchedET = await this.prisma.eventType.findFirst({
                        where: { name: { equals: rawEventType.slice(0, -1), mode: 'insensitive' } },
                        select: { id: true },
                    });
                }
                if (matchedET) {
                    (inferredInquiry as Record<string, unknown>)['event_type_id'] = matchedET.id;
                }
            }

            const createdInquiry = await this.inquiriesService.create(inferredInquiry, brandId);
            inquiryId = createdInquiry.id;

            // Auto-generate a portal token so the client gets a persistent link
            const portalToken = randomUUID();
            await this.prisma.inquiries.update({
                where: { id: createdInquiry.id },
                data: { portal_token: portalToken },
            });

            const linkedContact = await this.prisma.contacts.findUnique({
                where: { email: inferredInquiry.email },
                select: { id: true },
            });
            contactId = linkedContact?.id;
        }

        const submission = await this.prisma.needs_assessment_submissions.create({
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
            await this.autoCreateDraftEstimate(inquiryId);
        }

        return submission;
    }

    /**
     * Auto-create a Draft estimate from the inquiry's live schedule snapshot.
     * Falls back to a single package-price line item only when no snapshot-derived
     * estimate items can be built.
     */
    private async autoCreateDraftEstimate(inquiryId: number): Promise<void> {
        try {
            const existingCount = await this.prisma.estimates.count({ where: { inquiry_id: inquiryId } });
            if (existingCount > 0) return; // already has an estimate

            const inquiry = await this.prisma.inquiries.findUnique({
                where: { id: inquiryId },
                select: {
                    wedding_date: true,
                    preferred_payment_schedule_template_id: true,
                    selected_package: { select: { id: true, name: true, base_price: true, currency: true } },
                    contact: {
                        select: {
                            brand: {
                                select: {
                                    id: true,
                                    default_tax_rate: true,
                                    default_payment_method: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!inquiry?.selected_package) return; // no package selected — nothing to draft

            const pkg = inquiry.selected_package;
            const brand = inquiry.contact?.brand;
            if (!brand?.id) return;

            const today = new Date();
            const expiry = new Date(today);
            expiry.setDate(today.getDate() + 30);

            const items = await this.buildAutoEstimateItems(inquiryId, pkg.id, brand.id);
            const fallbackBasePrice = Number(pkg.base_price ?? 0);
            const estimateItems = items.length > 0
                ? items
                : fallbackBasePrice > 0
                    ? [{
                        description: pkg.name,
                        quantity: 1,
                        unit: 'Package',
                        unit_price: fallbackBasePrice,
                        category: 'Package',
                    }]
                    : [];

            if (estimateItems.length === 0) return;

            const estimate = await this.estimatesService.create(inquiryId, {
                title: pkg.name,
                issue_date: today.toISOString(),
                expiry_date: expiry.toISOString(),
                status: undefined, // defaults to Draft
                is_primary: true,
                tax_rate: Number(brand.default_tax_rate ?? 0),
                payment_method: brand.default_payment_method ?? 'Bank Transfer',
                items: estimateItems,
            } as any);

            // Use the inquiry's preferred template first, fall back to brand default
            let scheduleTemplate = inquiry.preferred_payment_schedule_template_id
                ? await this.prisma.payment_schedule_templates.findUnique({
                    where: { id: inquiry.preferred_payment_schedule_template_id },
                    include: { rules: { orderBy: { order_index: 'asc' } } },
                })
                : null;
            if (!scheduleTemplate) {
                scheduleTemplate = await this.paymentSchedulesService.getDefaultTemplate(brand.id);
            }
            if (scheduleTemplate && inquiry.wedding_date) {
                await this.paymentSchedulesService.applyToEstimate(Number(estimate.id), {
                    template_id: scheduleTemplate.id,
                    booking_date: today.toISOString().split('T')[0],
                    event_date: inquiry.wedding_date.toISOString().split('T')[0],
                    total_amount: Number(estimate.total_amount ?? 0),
                });
            }
        } catch (err) {
            // Auto-create is best-effort — log but never fail the submission
            console.error(`Auto-estimate creation failed for inquiry ${inquiryId}:`, err);
        }
    }

    private async buildAutoEstimateItems(
        inquiryId: number,
        packageId: number,
        brandId: number,
    ): Promise<AutoEstimateItem[]> {
        const [scheduleFilms, operators, taskPreview] = await Promise.all([
            this.snapshotService.getFilms({ inquiryId }).catch(() => [] as any[]),
            this.snapshotService.getOperators({ inquiryId }).catch(() => [] as any[]),
            this.taskLibraryService.previewAutoGenerationForSystem(packageId, brandId, inquiryId).catch(() => null),
        ]);

        const items: AutoEstimateItem[] = [];
        const filmNames = scheduleFilms.map((pf: any) => pf.film?.name || `Film #${pf.film_id}`);
        const roundMoney = (value: number) => Math.round(value * 100) / 100;

        const resolveHourlyRate = (op: any): number => {
            const contributorRoles = op.contributor?.contributor_job_roles || [];
            if (op.job_role_id) {
                const match = contributorRoles.find(
                    (role: any) => role.job_role_id === op.job_role_id && role.payment_bracket?.hourly_rate,
                );
                if (match?.payment_bracket?.hourly_rate) return Number(match.payment_bracket.hourly_rate);
            }
            const primary = contributorRoles.find((role: any) => role.is_primary && role.payment_bracket?.hourly_rate);
            if (primary?.payment_bracket?.hourly_rate) return Number(primary.payment_bracket.hourly_rate);
            const anyRole = contributorRoles.find((role: any) => role.payment_bracket?.hourly_rate);
            if (anyRole?.payment_bracket?.hourly_rate) return Number(anyRole.payment_bracket.hourly_rate);
            if (op.contributor?.default_hourly_rate) return Number(op.contributor.default_hourly_rate);
            return 0;
        };

        const resolveDayRate = (op: any): number => {
            const contributorRoles = op.contributor?.contributor_job_roles || [];
            if (op.job_role_id) {
                const match = contributorRoles.find(
                    (role: any) => role.job_role_id === op.job_role_id && role.payment_bracket?.day_rate,
                );
                if (match?.payment_bracket?.day_rate) return Number(match.payment_bracket.day_rate);
            }
            const primary = contributorRoles.find((role: any) => role.is_primary && role.payment_bracket?.day_rate);
            if (primary?.payment_bracket?.day_rate) return Number(primary.payment_bracket.day_rate);
            return 0;
        };

        const usesDayRate = (op: any): boolean => {
            const contributorRoles = op.contributor?.contributor_job_roles || [];
            if (op.job_role_id) {
                const match = contributorRoles.find((role: any) => role.job_role_id === op.job_role_id);
                if (match?.payment_bracket) {
                    return Number(match.payment_bracket.day_rate || 0) > 0
                        && Number(match.payment_bracket.hourly_rate || 0) === 0;
                }
            }
            return false;
        };

        const planningCategories = new Set(['creative', 'production']);
        const postProductionCategories = new Set(['post-production']);
        const taskExcludedPhases = new Set(['Lead', 'Inquiry', 'Booking']);

        type CrewAccum = {
            name: string;
            role: string;
            hours: number;
            days: number;
            hourlyRate: number;
            dayRate: number;
            useDayRate: boolean;
        };

        const planningCrew = new Map<string, CrewAccum>();
        const coverageCrew = new Map<string, CrewAccum>();
        const postProdCrew = new Map<string, CrewAccum>();

        for (const op of operators) {
            if (!op.contributor_id && !op.job_role_id) continue;
            const key = `${op.contributor_id ?? 0}|${op.job_role_id ?? 0}`;
            const name = op.contributor
                ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim()
                : (op.job_role?.display_name || op.job_role?.name || 'TBC');
            const role = op.job_role?.display_name || op.job_role?.name || '';
            const hours = Number(op.hours || 0);
            const category = op.job_role?.category?.toLowerCase() || '';
            const bucket = planningCategories.has(category)
                ? planningCrew
                : postProductionCategories.has(category)
                    ? postProdCrew
                    : coverageCrew;
            const existing = bucket.get(key);

            if (existing) {
                existing.hours += hours;
                existing.days += 1;
                continue;
            }

            bucket.set(key, {
                name,
                role,
                hours,
                days: 1,
                hourlyRate: resolveHourlyRate(op),
                dayRate: resolveDayRate(op),
                useDayRate: usesDayRate(op),
            });
        }

        if (taskPreview?.tasks) {
            const allCrewMap = new Map<string, {
                name: string;
                role: string;
                category: string;
                hours: number;
                cost: number;
                rate: number;
                ppFilmCosts: Map<string, { hours: number; cost: number }>;
            }>();

            for (const task of taskPreview.tasks) {
                if (taskExcludedPhases.has(task.phase) || !task.assigned_to_name) continue;

                const cost = Number(task.estimated_cost ?? 0);
                const key = `${task.assigned_to_name}|${task.role_name ?? ''}`;
                const existing = allCrewMap.get(key);

                if (existing) {
                    existing.hours += Number(task.total_hours || 0);
                    existing.cost += cost;
                    if (task.phase === 'Post_Production') {
                        const filmKey = filmNames.find((filmName) => task.name?.includes(filmName)) || 'General';
                        const filmCost = existing.ppFilmCosts.get(filmKey);
                        if (filmCost) {
                            filmCost.hours += Number(task.total_hours || 0);
                            filmCost.cost += cost;
                        } else {
                            existing.ppFilmCosts.set(filmKey, {
                                hours: Number(task.total_hours || 0),
                                cost,
                            });
                        }
                    }
                    continue;
                }

                const matchingOperator = operators.find((op: any) => {
                    const name = op.contributor
                        ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim()
                        : '';
                    return name === task.assigned_to_name
                        && (op.job_role?.display_name === task.role_name || op.job_role?.name === task.role_name);
                });
                const category = matchingOperator?.job_role?.category?.toLowerCase() || '';
                const lineCategory = planningCategories.has(category)
                    ? 'Planning'
                    : postProductionCategories.has(category)
                        ? 'Post-Production'
                        : 'Coverage';
                const ppFilmCosts = new Map<string, { hours: number; cost: number }>();
                if (task.phase === 'Post_Production') {
                    const filmKey = filmNames.find((filmName) => task.name?.includes(filmName)) || 'General';
                    ppFilmCosts.set(filmKey, {
                        hours: Number(task.total_hours || 0),
                        cost,
                    });
                }

                allCrewMap.set(key, {
                    name: task.assigned_to_name,
                    role: task.role_name ?? '',
                    category: lineCategory,
                    hours: Number(task.total_hours || 0),
                    cost,
                    rate: Number(task.hourly_rate ?? 0),
                    ppFilmCosts,
                });
            }

            for (const entry of allCrewMap.values()) {
                if (entry.category !== 'Planning' && entry.category !== 'Coverage') continue;
                const derivedRate = entry.rate > 0
                    ? entry.rate
                    : entry.hours > 0
                        ? entry.cost / entry.hours
                        : entry.cost;
                items.push({
                    description: entry.role ? `${entry.name} - ${entry.role}` : entry.name,
                    category: entry.category,
                    quantity: roundMoney(entry.hours),
                    unit: 'Hours',
                    unit_price: roundMoney(derivedRate),
                });
            }

            const postProductionEntries = Array.from(allCrewMap.values()).filter((entry) => entry.category === 'Post-Production');
            if (postProductionEntries.length > 0) {
                const postProductionByFilm = new Map<string, Map<string, { name: string; role: string; hours: number; cost: number; rate: number }>>();

                for (const entry of postProductionEntries) {
                    const postProductionFilmHours = Array.from(entry.ppFilmCosts.values()).reduce((sum, value) => sum + value.hours, 0);
                    const postProductionFilmCost = Array.from(entry.ppFilmCosts.values()).reduce((sum, value) => sum + value.cost, 0);
                    const deliveryHours = entry.hours - postProductionFilmHours;
                    const deliveryCost = entry.cost - postProductionFilmCost;

                    for (const [filmKey, filmCost] of entry.ppFilmCosts) {
                        if (!postProductionByFilm.has(filmKey)) {
                            postProductionByFilm.set(filmKey, new Map());
                        }
                        const crewKey = `${entry.name}|${entry.role}`;
                        const existing = postProductionByFilm.get(filmKey)?.get(crewKey);
                        if (existing) {
                            existing.hours += filmCost.hours;
                            existing.cost += filmCost.cost;
                        } else {
                            postProductionByFilm.get(filmKey)?.set(crewKey, {
                                name: entry.name,
                                role: entry.role,
                                hours: filmCost.hours,
                                cost: filmCost.cost,
                                rate: entry.rate,
                            });
                        }
                    }

                    if (deliveryCost > 0.001) {
                        if (!postProductionByFilm.has('General')) {
                            postProductionByFilm.set('General', new Map());
                        }
                        const crewKey = `${entry.name}|${entry.role}`;
                        const existing = postProductionByFilm.get('General')?.get(crewKey);
                        if (existing) {
                            existing.hours += deliveryHours;
                            existing.cost += deliveryCost;
                        } else {
                            postProductionByFilm.get('General')?.set(crewKey, {
                                name: entry.name,
                                role: entry.role,
                                hours: deliveryHours,
                                cost: deliveryCost,
                                rate: entry.rate,
                            });
                        }
                    }
                }

                for (const [filmKey, filmMap] of postProductionByFilm) {
                    const category = filmKey === 'General' ? 'Post-Production' : `Post-Production:${filmKey}`;
                    for (const entry of filmMap.values()) {
                        const derivedRate = entry.rate > 0
                            ? entry.rate
                            : entry.hours > 0
                                ? entry.cost / entry.hours
                                : entry.cost;
                        items.push({
                            description: entry.role ? `${entry.name} - ${entry.role}` : entry.name,
                            category,
                            quantity: roundMoney(entry.hours),
                            unit: 'Hours',
                            unit_price: roundMoney(derivedRate),
                        });
                    }
                }
            }
        } else {
            const pushFallback = (crewMap: Map<string, CrewAccum>, category: string) => {
                for (const crew of crewMap.values()) {
                    items.push({
                        description: crew.role ? `${crew.name} - ${crew.role}` : crew.name,
                        category,
                        quantity: crew.useDayRate && crew.dayRate > 0 ? crew.days : roundMoney(crew.hours),
                        unit: crew.useDayRate && crew.dayRate > 0 ? 'Days' : 'Hours',
                        unit_price: roundMoney(crew.useDayRate && crew.dayRate > 0 ? crew.dayRate : crew.hourlyRate),
                    });
                }
            };

            pushFallback(planningCrew, 'Planning');
            pushFallback(coverageCrew, 'Coverage');
            pushFallback(postProdCrew, 'Post-Production');
        }

        const equipmentSeen = new Set<number>();
        for (const op of operators) {
            for (const equipmentRelation of op.equipment || []) {
                const equipmentId = equipmentRelation.equipment_id ?? equipmentRelation.equipment?.id;
                if (!equipmentId || equipmentSeen.has(equipmentId)) continue;
                equipmentSeen.add(equipmentId);
                const price = Number(equipmentRelation.equipment?.rental_price_per_day || 0);
                const name = [equipmentRelation.equipment?.item_name, equipmentRelation.equipment?.model]
                    .filter(Boolean)
                    .join(' ');
                items.push({
                    description: name || `Equipment #${equipmentId}`,
                    category: 'Equipment',
                    quantity: 1,
                    unit: 'Day',
                    unit_price: roundMoney(price),
                });
            }
        }

        return items
            .filter((item) => item.description.trim().length > 0)
            .map((item) => ({
                ...item,
                quantity: roundMoney(item.quantity),
                unit_price: roundMoney(item.unit_price),
            }));
    }

    async convertSubmission(submissionId: number, brandId: number) {
        const submission = await this.getSubmissionById(submissionId, brandId);
        if (submission.inquiry_id) {
            return submission;
        }

        const responses = submission.responses as Record<string, unknown>;
        const inferredInquiry = {
            wedding_date: (responses['wedding_date'] as string) || new Date().toISOString(),
            guest_count: (responses['guest_count'] as string),
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

    // ─── Review endpoints ─────────────────────────────────────────────────────

    async checkDateConflicts(submissionId: number, brandId: number) {
        const submission = await this.prisma.needs_assessment_submissions.findFirst({
            where: { id: submissionId, brand_id: brandId },
            include: { inquiry: { select: { id: true, wedding_date: true } } },
        });

        if (!submission?.inquiry?.wedding_date) {
            return { wedding_date: null, booked_conflicts: [], soft_conflicts: [] };
        }

        const weddingDate = submission.inquiry.wedding_date;
        const dayStart = new Date(weddingDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(weddingDate);
        dayEnd.setHours(23, 59, 59, 999);

        const [conflictingInquiries, conflictingProjects] = await Promise.all([
            this.prisma.inquiries.findMany({
                where: {
                    id: { not: submission.inquiry.id },
                    wedding_date: { gte: dayStart, lte: dayEnd },
                },
                include: { contact: { select: { first_name: true, last_name: true } } },
            }),
            this.prisma.projects.findMany({
                where: {
                    wedding_date: { gte: dayStart, lte: dayEnd },
                    brand_id: brandId,
                    archived_at: null,
                },
                select: { id: true, project_name: true },
            }),
        ]);

        const booked_conflicts: { type: string; id: number; name: string; status: string }[] = [
            ...conflictingInquiries
                .filter((i) => i.status === 'Booked')
                .map((i) => ({
                    type: 'inquiry',
                    id: i.id,
                    name: `${i.contact.first_name} ${i.contact.last_name}`.trim(),
                    status: 'Booked',
                })),
            ...conflictingProjects.map((p) => ({
                type: 'project',
                id: p.id,
                name: p.project_name ?? `Project #${p.id}`,
                status: 'Confirmed',
            })),
        ];

        const soft_conflicts = conflictingInquiries
            .filter((i) => i.status !== 'Booked')
            .map((i) => ({
                type: 'inquiry',
                id: i.id,
                name: `${i.contact.first_name} ${i.contact.last_name}`.trim(),
                status: String(i.status),
            }));

        return { wedding_date: weddingDate, booked_conflicts, soft_conflicts };
    }

    async checkCrewConflicts(submissionId: number, brandId: number) {
        const submission = await this.prisma.needs_assessment_submissions.findFirst({
            where: { id: submissionId, brand_id: brandId },
            include: { inquiry: { select: { id: true, wedding_date: true } } },
        });

        if (!submission?.inquiry?.wedding_date) {
            return { conflicts: [] };
        }

        const weddingDate = submission.inquiry.wedding_date;
        const dayStart = new Date(weddingDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(weddingDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Find calendar events for event-day types on that date
        const events = await this.prisma.calendar_events.findMany({
            where: {
                event_type: { in: ['WEDDING_DAY', 'PROJECT_ASSIGNMENT'] },
                start_time: { lte: dayEnd },
                end_time: { gte: dayStart },
            },
            include: {
                contributor: {
                    include: {
                        contact: { select: { first_name: true, last_name: true } },
                        contributor_job_roles: {
                            include: { job_role: { select: { name: true, display_name: true } } },
                        },
                    },
                },
            },
        });

        // On-set role keywords — videographers/operators/photographers/drone pilots
        const ON_SET_KEYWORDS = ['videographer', 'operator', 'cinematographer', 'photographer', 'drone'];

        const seen = new Set<number>();
        const conflicts: { contributor_id: number; name: string; role: string; event_type: string; event_title: string }[] = [];

        for (const ev of events) {
            const cid = ev.contributor_id;
            if (seen.has(cid)) continue;

            const matchingRole = ev.contributor.contributor_job_roles.find((r) =>
                ON_SET_KEYWORDS.some((kw) => r.job_role.name.toLowerCase().includes(kw)),
            );
            if (!matchingRole) continue;

            seen.add(cid);
            conflicts.push({
                contributor_id: cid,
                name: `${ev.contributor.contact.first_name} ${ev.contributor.contact.last_name}`.trim(),
                role: matchingRole.job_role.display_name ?? matchingRole.job_role.name,
                event_type: ev.event_type,
                event_title: ev.title,
            });
        }

        return { conflicts };
    }

    async reviewSubmission(
        submissionId: number,
        brandId: number,
        data: { review_notes?: string; review_checklist_state?: Record<string, unknown> },
    ) {
        const submission = await this.getSubmissionById(submissionId, brandId);

        const updated = await this.prisma.needs_assessment_submissions.update({
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

    private createDefaultTemplate(brandId: number) {
        const questions = [
            { order_index: 1, prompt: 'Contact first name', field_type: 'text', field_key: 'contact_first_name', required: true, category: 'contact' },
            { order_index: 2, prompt: 'Contact last name', field_type: 'text', field_key: 'contact_last_name', required: true, category: 'contact' },
            { order_index: 3, prompt: 'Contact email', field_type: 'email', field_key: 'contact_email', required: true, category: 'contact' },
            { order_index: 4, prompt: 'Contact phone number', field_type: 'phone', field_key: 'contact_phone', required: false, category: 'contact' },
            { order_index: 5, prompt: 'Your role in the wedding', field_type: 'select', field_key: 'contact_role', required: false, options: { values: ['Bride', 'Groom', 'Partner', 'Prefer not to say'] }, help_text: 'This helps us personalise your experience.', category: 'contact' },
            { order_index: 6, prompt: "Your partner's name", field_type: 'text', field_key: 'partner_name', required: false, help_text: 'Leave blank if you prefer not to say or are still deciding.', category: 'contact' },
            { order_index: 7, prompt: 'Wedding / Event date', field_type: 'date', field_key: 'wedding_date', required: true, category: 'event' },
            { order_index: 8, prompt: 'Ceremony venue name', field_type: 'text', field_key: 'ceremony_location', required: false, help_text: 'Where is your ceremony being held? Leave blank if TBC.', category: 'event' },
            { order_index: 9, prompt: 'Bridal preparation venue', field_type: 'text', field_key: 'bridal_prep_location', required: false, help_text: 'e.g. hotel, home — leave blank if unknown.', category: 'event' },
            { order_index: 10, prompt: 'Groom / partner preparation venue', field_type: 'text', field_key: 'groom_prep_location', required: false, help_text: 'Leave blank if unknown or prefer not to say.', category: 'event' },
            { order_index: 11, prompt: 'Reception venue', field_type: 'text', field_key: 'reception_location', required: false, help_text: 'Leave blank if same as ceremony or TBC.', category: 'event' },
            { order_index: 12, prompt: 'Priority level', field_type: 'select', field_key: 'priority_level', required: true, options: { values: ['Low', 'Medium', 'High'] }, category: 'event' },
            { order_index: 13, prompt: 'Coverage hours needed', field_type: 'select', field_key: 'coverage_hours', required: false, options: { values: ['4-6 hours', '6-8 hours', '8-10 hours', 'Full day'] }, category: 'coverage' },
            { order_index: 14, prompt: 'Deliverables requested', field_type: 'multiselect', field_key: 'deliverables', required: false, options: { values: ['Highlight film', 'Full ceremony', 'Speeches', 'Raw footage', 'Social clips'] }, category: 'coverage' },
            { order_index: 15, prompt: 'Add-ons / extras', field_type: 'multiselect', field_key: 'add_ons', required: false, options: { values: ['Drone coverage', 'Second shooter', 'Same-day edit', 'Live stream'] }, category: 'coverage' },
            { order_index: 16, prompt: 'Budget range', field_type: 'select', field_key: 'budget_range', required: false, options: { values: ['£2k-£4k', '£4k-£6k', '£6k-£8k', '£8k+'] }, category: 'budget' },
            { order_index: 17, prompt: 'Budget flexibility', field_type: 'select', field_key: 'budget_flexible', required: false, options: { values: ['Fixed', 'Some flexibility', 'Flexible'] }, category: 'budget' },
            { order_index: 18, prompt: 'Decision timeline', field_type: 'select', field_key: 'decision_timeline', required: false, options: { values: ['ASAP', '1-2 weeks', '1 month', 'Just exploring'] }, category: 'reach' },
            { order_index: 19, prompt: 'Target booking date', field_type: 'date', field_key: 'booking_date', required: false, category: 'reach' },
            { order_index: 20, prompt: 'Key stakeholders / who decides', field_type: 'text', field_key: 'stakeholders', required: false, category: 'reach' },
            { order_index: 21, prompt: 'Preferred communication method', field_type: 'select', field_key: 'preferred_contact_method', required: false, options: { values: ['Email', 'Phone', 'Text', 'Zoom'] }, category: 'reach' },
            { order_index: 22, prompt: 'Preferred contact time', field_type: 'text', field_key: 'preferred_contact_time', required: false, category: 'reach' },
            { order_index: 23, prompt: 'Additional notes', field_type: 'textarea', field_key: 'notes', required: false, category: 'reach' },
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
                steps_config: [
                    { key: 'contact', label: 'You', description: "Let's start with the basics" },
                    { key: 'event', label: 'Your Wedding', description: 'Tell us about your day' },
                    { key: 'coverage', label: 'Coverage', description: "What you'd like us to capture" },
                    { key: 'budget', label: 'Budget', description: 'Help us find the right fit' },
                    { key: 'package', label: 'Package', description: 'Choose your package', type: 'package_select' },
                    { key: 'reach', label: 'Reach You', description: 'How best to connect' },
                    { key: 'call', label: 'Discovery Call', description: 'How would you like to connect?', type: 'discovery_call' },
                ] as Prisma.InputJsonValue,
                questions: {
                    create: questions,
                },
            },
            include: { questions: { orderBy: { order_index: 'asc' } } },
        });
    }

    private async prefillLocationSlots(
        inquiryId: number,
        responses: Record<string, unknown>,
        brandId: number,
    ): Promise<void> {
        // Maps activity name keywords → the NA response field key containing the location name
        const ACTIVITY_TO_RESPONSE_KEY: Record<string, string> = {
            ceremony: 'ceremony_location',
            'bridal prep': 'bridal_prep_location',
            'bride prep': 'bridal_prep_location',
            'groom prep': 'groom_prep_location',
            reception: 'reception_location',
        };

        const slots = await this.prisma.projectLocationSlot.findMany({
            where: { inquiry_id: inquiryId, name: null },
            include: {
                activity_assignments: {
                    include: { project_activity: { select: { name: true } } },
                },
            },
        });

        if (slots.length === 0) return;

        for (const slot of slots) {
            const assignedNames = slot.activity_assignments
                .map((a) => a.project_activity?.name?.toLowerCase() ?? '')
                .filter(Boolean);
            let locationName: string | null = null;
            let locationAddress: string | null = null;

            for (const [keyword, responseKey] of Object.entries(ACTIVITY_TO_RESPONSE_KEY)) {
                if (assignedNames.some((name) => name.includes(keyword))) {
                    const val = responses[responseKey];
                    if (val && typeof val === 'string' && val.trim()) {
                        locationName = val.trim();
                        // Pick up companion address key if the wizard captured it
                        const addrVal = responses[`${responseKey}_address`];
                        if (addrVal && typeof addrVal === 'string' && addrVal.trim()) {
                            locationAddress = addrVal.trim();
                        }
                        break;
                    }
                }
            }

            // Fallback: use ceremony_location, venue_details from NA, or inquiry venue_details
            if (!locationName) {
                const fallback = responses['ceremony_location'] ?? responses['venue_details'];
                if (fallback && typeof fallback === 'string' && fallback.trim()) {
                    locationName = fallback.trim();
                    const fallbackAddr = responses['ceremony_location_address'] ?? responses['venue_address'];
                    if (fallbackAddr && typeof fallbackAddr === 'string' && fallbackAddr.trim()) {
                        locationAddress = fallbackAddr.trim();
                    }
                }
            }

            if (locationName) {
                // Look up an existing LocationsLibrary entry (case-insensitive) or create one
                const existingLib = await this.prisma.locationsLibrary.findFirst({
                    where: {
                        name: { equals: locationName, mode: 'insensitive' },
                        brand_id: brandId,
                        is_active: true,
                    },
                    select: { id: true },
                });
                let libEntry = existingLib;
                if (!libEntry) {
                    // Attempt to geocode before creating so the library entry has coords from day one
                    const geocodeQuery = locationAddress
                        ? `${locationName}, ${locationAddress}`
                        : locationName;
                    const coords = await geocodeAddress(geocodeQuery);
                    libEntry = await this.prisma.locationsLibrary.create({
                        data: {
                            name: locationName,
                            brand_id: brandId,
                            ...(locationAddress ? { address_line1: locationAddress } : {}),
                            ...(coords ? { lat: coords.lat, lng: coords.lng, precision: 'EXACT' } : {}),
                        },
                        select: { id: true },
                    });
                }
                await this.prisma.projectLocationSlot.update({
                    where: { id: slot.id },
                    data: {
                        location_id: libEntry.id,
                        name: locationName,
                        ...(locationAddress ? { address: locationAddress } : {}),
                    },
                });
            }
        }
    }

    private async prefillSubjectNames(
        inquiryId: number,
        responses: Record<string, unknown>,
        contactFullName: string,
    ): Promise<void> {
        const contactRole = ((responses['contact_role'] as string | undefined) ?? '').toLowerCase().trim();
        const partnerName = ((responses['partner_name'] as string | undefined) ?? '').trim();

        // Only auto-fill for recognised, unambiguous roles
        if (!contactRole || contactRole === 'prefer not to say' || !contactFullName) return;

        // Determine what role name the partner would have in the subject list
        let partnerRole: string | null = null;
        if (contactRole === 'bride') partnerRole = 'groom';
        else if (contactRole === 'groom') partnerRole = 'bride';
        // 'partner' stays null — both partners share the same role label, so we can't map unambiguously

        const subjects = await this.prisma.projectDaySubject.findMany({
            where: { inquiry_id: inquiryId, real_name: null },
            orderBy: { order_index: 'asc' },
        });

        if (subjects.length === 0) return;

        for (const subject of subjects) {
            const subjectNameLower = subject.name.toLowerCase();
            let realName: string | null = null;

            if (subjectNameLower.includes(contactRole)) {
                realName = contactFullName;
            } else if (partnerRole && subjectNameLower.includes(partnerRole) && partnerName) {
                realName = partnerName;
            }

            if (realName) {
                await this.prisma.projectDaySubject.update({
                    where: { id: subject.id },
                    data: { real_name: realName },
                });
            }
        }
    }

    /* ── Public share-token methods ─────────────────────────────────────────── */

    async generateShareToken(templateId: number, brandId: number): Promise<string> {
        const template = await this.getTemplateById(templateId, brandId);

        if (template.share_token) {
            return template.share_token;
        }

        const token = randomUUID();
        await this.prisma.needs_assessment_templates.update({
            where: { id: template.id },
            data: { share_token: token },
        });

        return token;
    }

    async findByShareToken(token: string) {
        const template = await this.prisma.needs_assessment_templates.findUnique({
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

        if (!template || !template.is_active) {
            throw new NotFoundException('Questionnaire not found or no longer active');
        }

        // Fetch packages and package sets for the brand so the public page can
        // render the package-select step without authentication.
        const [packages, packageSets] = await Promise.all([
            this.prisma.service_packages.findMany({
                where: { brand_id: template.brand_id, is_active: true },
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.package_sets.findMany({
                where: { brand_id: template.brand_id },
                include: {
                    event_type: { select: { id: true, name: true, icon: true, color: true } },
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

    async createPublicSubmission(
        token: string,
        payload: CreateNeedsAssessmentSubmissionDto,
    ) {
        const template = await this.findByShareToken(token);
        return this.createSubmission(
            { ...payload, template_id: template.id },
            template.brand_id,
        );
    }

    async updateSubmissionResponses(
        submissionId: number,
        responses: Record<string, unknown>,
    ) {
        const submission = await this.prisma.needs_assessment_submissions.findUnique({
            where: { id: submissionId },
            select: { id: true, inquiry_id: true, responses: true },
        });
        if (!submission) throw new NotFoundException('Submission not found');

        const oldResponses = (submission.responses as Record<string, unknown>) || {};
        const merged = { ...oldResponses, ...responses };

        const updated = await this.prisma.needs_assessment_submissions.update({
            where: { id: submissionId },
            data: { responses: merged as Prisma.InputJsonValue },
            include: {
                template: { include: { questions: { orderBy: { order_index: 'asc' } } } },
                inquiry: { select: { id: true, portal_token: true } },
            },
        });

        // Log the edit as an activity
        if (submission.inquiry_id) {
            const changedFields = Object.keys(responses).filter(
                (k) => JSON.stringify(oldResponses[k]) !== JSON.stringify(responses[k]),
            );
            await this.prisma.activity_logs.create({
                data: {
                    inquiry_id: submission.inquiry_id,
                    type: 'client_update',
                    description: `Client updated questionnaire answers (${changedFields.length} field${changedFields.length === 1 ? '' : 's'})`,
                    metadata: { changed_fields: changedFields, source: 'portal' } as Prisma.InputJsonValue,
                },
            });
        }

        return updated;
    }
}
