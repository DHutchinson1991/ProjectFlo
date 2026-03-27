import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { EstimatesService } from '../../../finance/estimates/estimates.service';
import { ProjectPackageSnapshotService } from '../../projects/project-package-snapshot.service';
import { TaskLibraryService } from '../../task-library/task-library.service';
import { PaymentSchedulesService } from '../../../finance/payment-schedules/payment-schedules.service';
import { Decimal } from '@prisma/client/runtime/library';
import {
    AutoEstimateItem, CrewOperator, roundMoney, buildEquipmentItems, buildItemsFromOperators,
} from './estimate-item-builders';
import { TaskEntry, CrewEntry } from '../types/estimate-service.types';

@Injectable()
export class InquiryWizardEstimateService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly estimatesService: EstimatesService,
        private readonly snapshotService: ProjectPackageSnapshotService,
        private readonly taskLibraryService: TaskLibraryService,
        private readonly paymentSchedulesService: PaymentSchedulesService,
    ) {}

    async autoCreateDraftEstimate(inquiryId: number): Promise<void> {
        try {
            const existingCount = await this.prisma.estimates.count({ where: { inquiry_id: inquiryId } });
            if (existingCount > 0) return;

            const inquiry = await this.prisma.inquiries.findUnique({
                where: { id: inquiryId },
                select: {
                    wedding_date: true,
                    preferred_payment_schedule_template_id: true,
                    selected_package: { select: { id: true, name: true, base_price: true, currency: true } },
                    contact: { select: { brand: { select: { id: true, default_tax_rate: true, default_payment_method: true } } } },
                },
            });
            if (!inquiry?.selected_package) return;

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
                    ? [{ description: pkg.name, quantity: 1, unit: 'Package', unit_price: fallbackBasePrice, category: 'Package' }]
                    : [];
            if (estimateItems.length === 0) return;

            const estimate = await this.estimatesService.create(inquiryId, {
                estimate_number: `AUTO-${inquiryId}-${Date.now()}`,
                title: pkg.name,
                issue_date: today.toISOString(),
                expiry_date: expiry.toISOString(),
                is_primary: true,
                tax_rate: Number(brand.default_tax_rate ?? 0),
                payment_method: brand.default_payment_method ?? 'Bank Transfer',
                items: estimateItems,
            });

            await this.applyPaymentSchedule(inquiry, estimate, brand.id, today);
        } catch (err) {
            console.error(`Auto-estimate creation failed for inquiry ${inquiryId}:`, err);
        }
    }

    private async applyPaymentSchedule(
        inquiry: { wedding_date: Date | null; preferred_payment_schedule_template_id: number | null },
        estimate: { id: number | bigint; total_amount: number | Decimal | null },
        brandId: number,
        today: Date,
    ): Promise<void> {
        let scheduleTemplate = inquiry.preferred_payment_schedule_template_id
            ? await this.prisma.payment_schedule_templates.findUnique({
                where: { id: inquiry.preferred_payment_schedule_template_id },
                include: { rules: { orderBy: { order_index: 'asc' } } },
            })
            : null;
        if (!scheduleTemplate) {
            scheduleTemplate = await this.paymentSchedulesService.getDefaultTemplate(brandId);
        }
        if (scheduleTemplate && inquiry.wedding_date) {
            await this.paymentSchedulesService.applyToEstimate(Number(estimate.id), {
                template_id: scheduleTemplate.id,
                booking_date: today.toISOString().split('T')[0],
                event_date: inquiry.wedding_date.toISOString().split('T')[0],
                total_amount: Number(estimate.total_amount ?? 0),
            });
        }
    }

    private async buildAutoEstimateItems(
        inquiryId: number,
        packageId: number,
        brandId: number,
    ): Promise<AutoEstimateItem[]> {
        const [scheduleFilms, operators, taskPreview] = await Promise.all([
            this.snapshotService.getFilms({ inquiryId }).catch(() => [] as Array<{ film_id: number; film?: { name?: string } }>),
            this.snapshotService.getOperators({ inquiryId }).catch(() => [] as CrewOperator[]),
            this.taskLibraryService.previewAutoGenerationForSystem(packageId, brandId, inquiryId).catch(() => null),
        ]);

        const items: AutoEstimateItem[] = [];
        const filmNames = (scheduleFilms as Array<{ film_id: number; film?: { name?: string } }>)
            .map((pf) => pf.film?.name || `Film #${pf.film_id}`);

        if (taskPreview?.tasks) {
            this.buildItemsFromTasks(taskPreview.tasks as TaskEntry[], operators as CrewOperator[], filmNames, items);
        } else {
            items.push(...buildItemsFromOperators(operators));
        }

        items.push(...buildEquipmentItems(operators));

        return items
            .filter((item) => item.description.trim().length > 0)
            .map((item) => ({ ...item, quantity: roundMoney(item.quantity), unit_price: roundMoney(item.unit_price) }));
    }

    private buildItemsFromTasks(
        tasks: TaskEntry[],
        operators: CrewOperator[],
        filmNames: string[],
        items: AutoEstimateItem[],
    ): void {
        const allCrewMap = new Map<string, CrewEntry>();
        this.accumulateTaskCrew(tasks, operators, filmNames, allCrewMap);

        for (const entry of allCrewMap.values()) {
            if (entry.category === 'Planning' || entry.category === 'Coverage') {
                const derivedRate = entry.rate > 0 ? entry.rate : entry.hours > 0 ? entry.cost / entry.hours : entry.cost;
                items.push({
                    description: entry.role ? `${entry.name} - ${entry.role}` : entry.name,
                    category: entry.category,
                    quantity: roundMoney(entry.hours),
                    unit: 'Hours',
                    unit_price: roundMoney(derivedRate),
                });
            }
        }

        this.buildPostProductionItems(allCrewMap, items);
    }

    private accumulateTaskCrew(
        tasks: TaskEntry[],
        operators: CrewOperator[],
        filmNames: string[],
        allCrewMap: Map<string, CrewEntry>,
    ): void {
        const planningCategories = new Set(['creative', 'production']);
        const postProductionCategories = new Set(['post-production']);
        const taskExcludedPhases = new Set(['Lead', 'Inquiry', 'Booking']);

        for (const task of tasks) {
            if (taskExcludedPhases.has(task.phase ?? '') || !task.assigned_to_name) continue;
            const cost = Number(task.estimated_cost ?? 0);
            const key = `${task.assigned_to_name}|${task.role_name ?? ''}`;
            const existing = allCrewMap.get(key);

            if (existing) {
                existing.hours += Number(task.total_hours || 0);
                existing.cost += cost;
                if (task.phase === 'Post_Production') {
                    const filmKey = filmNames.find((fn) => task.name?.includes(fn)) || 'General';
                    const fc = existing.ppFilmCosts.get(filmKey);
                    if (fc) { fc.hours += Number(task.total_hours || 0); fc.cost += cost; }
                    else existing.ppFilmCosts.set(filmKey, { hours: Number(task.total_hours || 0), cost });
                }
                continue;
            }

            const matchingOp = operators.find((op) => {
                const name = op.crew_member
                    ? `${op.crew_member.contact?.first_name || ''} ${op.crew_member.contact?.last_name || ''}`.trim()
                    : '';
                return name === task.assigned_to_name
                    && (op.job_role?.display_name === task.role_name || op.job_role?.name === task.role_name);
            });
            const category = matchingOp?.job_role?.category?.toLowerCase() || '';
            const lineCategory = planningCategories.has(category) ? 'Planning'
                : postProductionCategories.has(category) ? 'Post-Production' : 'Coverage';
            const ppFilmCosts = new Map<string, { hours: number; cost: number }>();
            if (task.phase === 'Post_Production') {
                const filmKey = filmNames.find((fn) => task.name?.includes(fn)) || 'General';
                ppFilmCosts.set(filmKey, { hours: Number(task.total_hours || 0), cost });
            }

            allCrewMap.set(key, {
                name: task.assigned_to_name, role: task.role_name ?? '', category: lineCategory,
                hours: Number(task.total_hours || 0), cost, rate: Number(task.hourly_rate ?? 0), ppFilmCosts,
            });
        }
    }

    private buildPostProductionItems(
        allCrewMap: Map<string, CrewEntry>,
        items: AutoEstimateItem[],
    ): void {
        const ppEntries = Array.from(allCrewMap.values()).filter((e) => e.category === 'Post-Production');
        if (ppEntries.length === 0) return;

        const ppByFilm = new Map<string, Map<string, { name: string; role: string; hours: number; cost: number; rate: number }>>();

        for (const entry of ppEntries) {
            const ppFilmHours = Array.from(entry.ppFilmCosts.values()).reduce((s, v) => s + v.hours, 0);
            const ppFilmCost = Array.from(entry.ppFilmCosts.values()).reduce((s, v) => s + v.cost, 0);
            const deliveryHours = entry.hours - ppFilmHours;
            const deliveryCost = entry.cost - ppFilmCost;

            for (const [filmKey, filmCost] of entry.ppFilmCosts) {
                if (!ppByFilm.has(filmKey)) ppByFilm.set(filmKey, new Map());
                const crewKey = `${entry.name}|${entry.role}`;
                const existing = ppByFilm.get(filmKey)!.get(crewKey);
                if (existing) { existing.hours += filmCost.hours; existing.cost += filmCost.cost; }
                else ppByFilm.get(filmKey)!.set(crewKey, { name: entry.name, role: entry.role, hours: filmCost.hours, cost: filmCost.cost, rate: entry.rate });
            }

            if (deliveryCost > 0.001) {
                if (!ppByFilm.has('General')) ppByFilm.set('General', new Map());
                const crewKey = `${entry.name}|${entry.role}`;
                const existing = ppByFilm.get('General')!.get(crewKey);
                if (existing) { existing.hours += deliveryHours; existing.cost += deliveryCost; }
                else ppByFilm.get('General')!.set(crewKey, { name: entry.name, role: entry.role, hours: deliveryHours, cost: deliveryCost, rate: entry.rate });
            }
        }

        for (const [filmKey, filmMap] of ppByFilm) {
            const category = filmKey === 'General' ? 'Post-Production' : `Post-Production:${filmKey}`;
            for (const entry of filmMap.values()) {
                const derivedRate = entry.rate > 0 ? entry.rate : entry.hours > 0 ? entry.cost / entry.hours : entry.cost;
                items.push({
                    description: entry.role ? `${entry.name} - ${entry.role}` : entry.name,
                    category, quantity: roundMoney(entry.hours), unit: 'Hours', unit_price: roundMoney(derivedRate),
                });
            }
        }
    }
}
