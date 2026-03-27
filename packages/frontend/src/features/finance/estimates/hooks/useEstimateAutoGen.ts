'use client';

import { useCallback } from 'react';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { activeTasksApi } from '@/features/workflow/tasks';
import { useBrand } from '@/features/platform/brand';
import { roundMoney, computeLineTotal } from '@/shared/utils/pricing';
import {
    resolveHourlyRate,
    resolveDayRate,
    usesDayRate,
    PLANNING_CATEGORIES,
    POST_PRODUCTION_CATEGORIES,
    NON_DELIVERY_PHASES,
} from '@/shared/utils/rates';
import type { RateResolvable, CrewAccum } from '@/shared/utils/rates';
import type { LineItem } from '@/features/workflow/inquiries/components/LineItemEditor';
import type { Inquiry } from '@/features/workflow/inquiries/types';

const makeTempId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export interface AutoGenResult {
    initialItems: LineItem[];
    pkgTitle: string;
}

/**
 * Returns a memoised `generateInitialItems()` function that fetches the live
 * schedule snapshot and task preview, then builds the pre-populated line items
 * for a new estimate.
 */
export function useEstimateAutoGen(inquiry: Inquiry) {
    const { currentBrand } = useBrand();

    const generateInitialItems = useCallback(async (): Promise<AutoGenResult> => {
        let initialItems: LineItem[] = [];
        let pkgTitle = '';

        const snapshot = inquiry.package_contents_snapshot;
        pkgTitle = snapshot?.package_name || inquiry.selected_package?.name || '';

        try {
            const packageId = inquiry.selected_package_id;
            const brandId = currentBrand?.id;

            const [scheduleFilms, operators, taskPreview] = await Promise.all([
                inquiriesApi.scheduleSnapshot.getFilms(inquiry.id).catch(() => [] as any[]),
                inquiriesApi.scheduleSnapshot.getOperators(inquiry.id) as Promise<any[]>,
                packageId && brandId
                    ? activeTasksApi.previewAutoGeneration(packageId, brandId, inquiry.id).catch(() => null)
                    : Promise.resolve(null),
            ]);

            const filmNames: string[] = scheduleFilms.map(
                (pf: any) => pf.film?.name || `Film #${pf.film_id}`
            );

            const planningCrew = new Map<string, CrewAccum>();
            const coverageCrew = new Map<string, CrewAccum>();
            const postProdCrew = new Map<string, CrewAccum>();

            for (const op of operators) {
                if (!op.crew_member_id && !op.job_role_id) continue;
                const key = `${op.crew_member_id ?? 0}|${op.job_role_id ?? 0}`;
                const name = op.crew_member
                    ? `${op.crew_member.contact?.first_name || ''} ${op.crew_member.contact?.last_name || ''}`.trim()
                    : (op.job_role?.display_name || op.job_role?.name || 'TBC');
                const role = op.job_role?.display_name || op.job_role?.name || '';
                const hours = Number(op.hours || 0);
                const category = op.job_role?.category?.toLowerCase() || '';

                const bucket = PLANNING_CATEGORIES.has(category)
                    ? planningCrew
                    : POST_PRODUCTION_CATEGORIES.has(category)
                        ? postProdCrew
                        : coverageCrew;

                const existing = bucket.get(key);
                if (existing) {
                    existing.hours += hours;
                    existing.days += 1;
                } else {
                    bucket.set(key, {
                        name, role, hours, days: 1,
                        hourlyRate: resolveHourlyRate(op as RateResolvable),
                        dayRate: resolveDayRate(op as RateResolvable),
                        useDayRate: usesDayRate(op as RateResolvable),
                    });
                }
            }

            if (taskPreview?.tasks) {
                const allCrewMap = new Map<string, {
                    name: string; role: string; category: string;
                    hours: number; cost: number; rate: number;
                    ppFilmCosts: Map<string, { hours: number; cost: number }>;
                }>();

                for (const task of taskPreview.tasks) {
                    if (NON_DELIVERY_PHASES.has(task.phase)) continue;
                    if (!task.assigned_to_name) continue;
                    const cost = task.estimated_cost ?? 0;
                    const k = `${task.assigned_to_name}|${task.role_name ?? ''}`;
                    const ex = allCrewMap.get(k);

                    if (ex) {
                        ex.hours += task.total_hours;
                        ex.cost += cost;
                        if (task.phase === 'Post_Production') {
                            const fk = filmNames.find(fn => task.name?.includes(fn)) || 'General';
                            const fc = ex.ppFilmCosts.get(fk);
                            if (fc) { fc.hours += task.total_hours; fc.cost += cost; }
                            else { ex.ppFilmCosts.set(fk, { hours: task.total_hours, cost }); }
                        }
                    } else {
                        const op = operators.find((o: any) => {
                            const n = o.crew_member
                                ? `${o.crew_member.contact?.first_name || ''} ${o.crew_member.contact?.last_name || ''}`.trim()
                                : '';
                            return n === task.assigned_to_name &&
                                (o.job_role?.display_name === task.role_name || o.job_role?.name === task.role_name);
                        });
                        const cat = op?.job_role?.category?.toLowerCase() || '';
                        const lineCategory = PLANNING_CATEGORIES.has(cat) ? 'Planning'
                            : POST_PRODUCTION_CATEGORIES.has(cat) ? 'Post-Production'
                            : 'Coverage';
                        const ppFilmCosts = new Map<string, { hours: number; cost: number }>();
                        if (task.phase === 'Post_Production') {
                            const fk = filmNames.find(fn => task.name?.includes(fn)) || 'General';
                            ppFilmCosts.set(fk, { hours: task.total_hours, cost });
                        }
                        allCrewMap.set(k, {
                            name: task.assigned_to_name, role: task.role_name ?? '',
                            category: lineCategory, hours: task.total_hours, cost,
                            rate: task.hourly_rate ?? 0, ppFilmCosts,
                        });
                    }
                }

                // Planning + Coverage
                for (const entry of allCrewMap.values()) {
                    if (entry.category !== 'Planning' && entry.category !== 'Coverage') continue;
                    initialItems.push({
                        tempId: makeTempId(),
                        description: entry.role ? `${entry.name} — ${entry.role}` : entry.name,
                        category: entry.category,
                        quantity: roundMoney(entry.hours),
                        unit: 'Hours',
                        unit_price: entry.rate,
                        total: roundMoney(entry.cost),
                    });
                }

                // Post-Production (per film)
                const ppEntries = Array.from(allCrewMap.values()).filter(v => v.category === 'Post-Production');
                if (ppEntries.length > 0) {
                    const ppByFilm = new Map<string, Map<string, { name: string; role: string; hours: number; cost: number; rate: number }>>();

                    for (const entry of ppEntries) {
                        const ppFilmHours = Array.from(entry.ppFilmCosts.values()).reduce((s, v) => s + v.hours, 0);
                        const ppFilmCost  = Array.from(entry.ppFilmCosts.values()).reduce((s, v) => s + v.cost,  0);
                        const deliveryHours = entry.hours - ppFilmHours;
                        const deliveryCost  = entry.cost  - ppFilmCost;

                        for (const [fk, fc] of entry.ppFilmCosts) {
                            if (!ppByFilm.has(fk)) ppByFilm.set(fk, new Map());
                            const k = `${entry.name}|${entry.role}`;
                            const ex = ppByFilm.get(fk)!.get(k);
                            if (ex) { ex.hours += fc.hours; ex.cost += fc.cost; }
                            else { ppByFilm.get(fk)!.set(k, { name: entry.name, role: entry.role, hours: fc.hours, cost: fc.cost, rate: entry.rate }); }
                        }

                        if (deliveryCost > 0.001) {
                            if (!ppByFilm.has('General')) ppByFilm.set('General', new Map());
                            const k = `${entry.name}|${entry.role}`;
                            const ex2 = ppByFilm.get('General')!.get(k);
                            if (ex2) { ex2.hours += deliveryHours; ex2.cost += deliveryCost; }
                            else { ppByFilm.get('General')!.set(k, { name: entry.name, role: entry.role, hours: deliveryHours, cost: deliveryCost, rate: entry.rate }); }
                        }
                    }

                    for (const [filmKey, filmMap] of ppByFilm) {
                        const catLabel = filmKey === 'General' ? 'Post-Production' : `Post-Production:${filmKey}`;
                        for (const pp of filmMap.values()) {
                            initialItems.push({
                                tempId: makeTempId(),
                                description: pp.role ? `${pp.name} — ${pp.role}` : pp.name,
                                category: catLabel,
                                quantity: roundMoney(pp.hours),
                                unit: 'Hours',
                                unit_price: pp.rate,
                                total: roundMoney(pp.cost),
                            });
                        }
                    }
                }
            } else {
                // Fallback: no task preview — use operator rate × hours
                const pushFallback = (crew: Map<string, CrewAccum>, categoryLabel: string) => {
                    for (const c of crew.values()) {
                        const description = c.role ? `${c.name} — ${c.role}` : c.name;
                        if (c.useDayRate && c.dayRate > 0) {
                            initialItems.push({ tempId: makeTempId(), description, category: categoryLabel, quantity: c.days, unit: 'Days', unit_price: c.dayRate, total: computeLineTotal(c.days, c.dayRate) });
                        } else {
                            initialItems.push({ tempId: makeTempId(), description, category: categoryLabel, quantity: c.hours, unit: 'Hours', unit_price: c.hourlyRate, total: computeLineTotal(c.hours, c.hourlyRate) });
                        }
                    }
                };
                pushFallback(planningCrew, 'Planning');
                pushFallback(coverageCrew, 'Coverage');
                pushFallback(postProdCrew, 'Post-Production');
            }

            // Equipment — deduplicate by equipment_id
            const equipmentSeen = new Set<number>();
            for (const op of operators) {
                for (const eq of (op.equipment || [])) {
                    const eqId = eq.equipment_id ?? eq.equipment?.id;
                    if (!eqId || equipmentSeen.has(eqId)) continue;
                    equipmentSeen.add(eqId);
                    const price = Number(eq.equipment?.rental_price_per_day || 0);
                    const name = [eq.equipment?.item_name, eq.equipment?.model].filter(Boolean).join(' ');
                    initialItems.push({
                        tempId: makeTempId(),
                        description: name || `Equipment #${eqId}`,
                        category: 'Equipment',
                        quantity: 1,
                        unit: 'Day',
                        unit_price: price,
                        total: price,
                    });
                }
            }
        } catch (err) {
            console.error('Failed to load operators for estimate:', err);
        }

        if (initialItems.length === 0) {
            initialItems = [{ tempId: `item-${Date.now()}`, description: '', quantity: 1, unit: 'Qty', unit_price: 0, total: 0 }];
        }

        return { initialItems, pkgTitle };
    }, [inquiry, currentBrand]);

    return { generateInitialItems };
}
