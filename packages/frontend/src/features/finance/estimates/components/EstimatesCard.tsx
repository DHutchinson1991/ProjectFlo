'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Card, CardContent, Button, Stack, TextField, Dialog,
    IconButton, FormControl, InputLabel, Select, MenuItem,
    Chip, Collapse, InputAdornment, Tooltip, Popover, CircularProgress,
} from '@mui/material';
import {
    AttachMoney, Add, Edit, Save, Send as SendIcon, Delete,
    Star, StarBorder, ExpandLess, ExpandMore,
    ContentCopy as ContentCopyIcon, Close, ReceiptLong, Sync, EditNote,
} from '@mui/icons-material';
import { estimatesApi } from '@/features/finance/estimates';
import { paymentSchedulesApi } from '@/features/finance/payment-schedules';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { activeTasksApi } from '@/features/workflow/tasks';
import { useBrand } from '@/app/providers/BrandProvider';
import type { Estimate, EstimateItem, EstimateSnapshot, EstimatePaymentMilestone } from '@/features/finance/estimates/types';
import type { PaymentScheduleTemplate } from '@/features/finance/payment-schedules/types';
import { getCurrencySymbol } from '@/lib/utils/formatUtils';
import { computeTaxBreakdown } from '@/lib/utils/pricing';
import LineItemEditor, { LineItem } from '@/app/(studio)/sales/inquiries/[id]/components/LineItemEditor';
import type { WorkflowCardProps } from '@/app/(studio)/sales/inquiries/[id]/_detail/_lib';
import { WorkflowCard } from '@/app/(studio)/sales/inquiries/[id]/_detail/_components/WorkflowCard';

interface EstimatesCardProps extends WorkflowCardProps {
    refreshKey?: number;
}

const EstimatesCard: React.FC<EstimatesCardProps> = ({ inquiry, onRefresh, isActive, activeColor, refreshKey }) => {
    const { currentBrand } = useBrand();

    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEstimate, setEditingEstimate] = useState<Partial<Estimate> | null>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);

    // Payment schedule state
    const [defaultTemplate, setDefaultTemplate] = useState<PaymentScheduleTemplate | null>(null);
    const [allTemplates, setAllTemplates] = useState<PaymentScheduleTemplate[]>([]);
    const [dialTemplateId, setDialTemplateId] = useState<number | null>(null);
    const [milestones, setMilestones] = useState<EstimatePaymentMilestone[]>([]);

    // Financial State
    const [taxRate, setTaxRate] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
    const [installments, setInstallments] = useState<number>(1);
    const [currencySymbol, setCurrencySymbol] = useState<string>('$');

    // Sync currency symbol whenever the brand changes
    useEffect(() => {
        if (currentBrand?.currency) {
            setCurrencySymbol(getCurrencySymbol(currentBrand.currency));
        }
    }, [currentBrand?.currency]);

    // Load payment schedule templates — prefer inquiry's chosen template, fall back to brand default
    useEffect(() => {
        if (!currentBrand?.id) return;
        paymentSchedulesApi.getAll()
            .then((templates) => {
                setAllTemplates(templates);
                const prefId = inquiry.preferred_payment_schedule_template_id;
                const preferred = prefId ? templates.find((t) => t.id === prefId) : null;
                const def = preferred ?? templates.find((t) => t.is_default) ?? templates[0] ?? null;
                setDefaultTemplate(def);
            })
            .catch(() => { /* no templates */ });
    }, [currentBrand?.id, inquiry.preferred_payment_schedule_template_id]);

    const loadMilestones = async (estimateId: number) => {
        try {
            const ms = await paymentSchedulesApi.getMilestones(estimateId);
            setMilestones(ms || []);
        } catch {
            setMilestones([]);
        }
    };

    // Accordion state
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [snapshots, setSnapshots] = useState<Record<number, EstimateSnapshot[]>>({});
    const [loadingSnapshots, setLoadingSnapshots] = useState<Record<number, boolean>>({});
    const [versionAnchor, setVersionAnchor] = useState<HTMLElement | null>(null);
    const [versionEstimateId, setVersionEstimateId] = useState<number | null>(null);
    const autoExpandIdRef = useRef<number | null>(null);

    // Auto-expand effect
    useEffect(() => {
        if (estimates.length > 0) {
            if (autoExpandIdRef.current) {
                const targetId = autoExpandIdRef.current;
                const exists = estimates.find(e => e.id === targetId);
                if (exists) {
                    setExpandedId(targetId);
                    autoExpandIdRef.current = null;
                    return;
                }
            }
            const primary = estimates.find((e) => e.is_primary);
            if (primary) {
                setExpandedId(primary.id);
            }
        }
    }, [estimates]);

    useEffect(() => {
        const fetchEstimates = async () => {
            if (inquiry?.id) {
                try {
                    const estimatesData = await estimatesApi.getAllByInquiry(inquiry.id);
                    setEstimates(estimatesData || []);
                } catch (error) {
                    console.error('Error fetching estimates:', error);
                    setEstimates([]);
                }
            }
        };
        fetchEstimates();
    }, [inquiry?.id, refreshKey]);

    const handleCreate = async () => {
        setEditingEstimate(null);

        let initialItems: LineItem[] = [];
        let pkgTitle = '';

        // ── Helpers for resolving crew rates (mirrors the package page logic) ──
        const resolveHourlyRate = (op: any): number => {
            const c = op.contributor;
            if (!c) return 0;
            const roles = c.contributor_job_roles || [];
            if (op.job_role_id) {
                const match = roles.find((r: any) => r.job_role_id === op.job_role_id && r.payment_bracket?.hourly_rate);
                if (match?.payment_bracket?.hourly_rate) return Number(match.payment_bracket.hourly_rate);
            }
            const primary = roles.find((r: any) => r.is_primary && r.payment_bracket?.hourly_rate);
            if (primary?.payment_bracket?.hourly_rate) return Number(primary.payment_bracket.hourly_rate);
            const any = roles.find((r: any) => r.payment_bracket?.hourly_rate);
            if (any?.payment_bracket?.hourly_rate) return Number(any.payment_bracket.hourly_rate);
            if (c.default_hourly_rate) return Number(c.default_hourly_rate);
            return 0;
        };
        const resolveDayRate = (op: any): number => {
            const c = op.contributor;
            if (!c) return 0;
            const roles = c.contributor_job_roles || [];
            if (op.job_role_id) {
                const match = roles.find((r: any) => r.job_role_id === op.job_role_id && r.payment_bracket?.day_rate);
                if (match?.payment_bracket?.day_rate) return Number(match.payment_bracket.day_rate);
            }
            const primary = roles.find((r: any) => r.is_primary && r.payment_bracket?.day_rate);
            if (primary?.payment_bracket?.day_rate) return Number(primary.payment_bracket.day_rate);
            return 0;
        };
        const isDayRate = (op: any): boolean => {
            const c = op.contributor;
            if (!c) return false;
            const roles = c.contributor_job_roles || [];
            if (op.job_role_id) {
                const match = roles.find((r: any) => r.job_role_id === op.job_role_id);
                if (match?.payment_bracket) {
                    return Number(match.payment_bracket.day_rate || 0) > 0 && Number(match.payment_bracket.hourly_rate || 0) === 0;
                }
            }
            return false;
        };

        const snapshot = inquiry.package_contents_snapshot;
        const makeTempId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Brand currency takes priority; fall back to snapshot currency, then USD
        setCurrencySymbol(getCurrencySymbol(currentBrand?.currency || snapshot?.currency || 'USD'));
        pkgTitle = snapshot?.package_name || inquiry.selected_package?.name || '';

        // 1. Fetch live schedule data (films, operators, task preview) in parallel
        //    Films come from the actual schedule — NOT the stale package snapshot —
        //    so renames and additions are always reflected.
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

            // Collect film names for post-production matching (no separate Films section)
            const filmNames: string[] = [];
            for (const pf of scheduleFilms) {
                const filmName = pf.film?.name || `Film #${pf.film_id}`;
                filmNames.push(filmName);
            }

            // ── Categorize operators by job_role.category (used for fallback + category lookup) ──
            const PLANNING_CATEGORIES = new Set(['creative', 'production']);
            const POST_PROD_CATEGORIES = new Set(['post-production']);

            type CrewAccum = { name: string; role: string; hours: number; days: number; hourlyRate: number; dayRate: number; useDayRate: boolean };
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

                const bucket = PLANNING_CATEGORIES.has(category)
                    ? planningCrew
                    : POST_PROD_CATEGORIES.has(category)
                        ? postProdCrew
                        : coverageCrew;

                const existing = bucket.get(key);
                if (existing) {
                    existing.hours += hours;
                    existing.days += 1;
                } else {
                    bucket.set(key, {
                        name, role, hours, days: 1,
                        hourlyRate: resolveHourlyRate(op),
                        dayRate: resolveDayRate(op),
                        useDayRate: isDayRate(op),
                    });
                }
            }

            // ── Build line items from ALL non-excluded task preview rows ──
            // This mirrors computeCrewCost() in selectors.ts exactly: sum estimated_cost
            // across ALL non-excluded phases (including Delivery & Post_Production) per person+role.
            // Previous approach split phases and missed Delivery-phase Editor costs.
            const TASK_EXCLUDED = new Set(['Lead', 'Inquiry', 'Booking']);

            if (taskPreview?.tasks) {
                // One entry per name|role: accumulate hours + cost from every task phase
                const allCrewMap = new Map<string, {
                    name: string; role: string; category: string;
                    hours: number; cost: number; rate: number;
                    // track Post_Production task costs per film for the per-film breakdown
                    ppFilmCosts: Map<string, { hours: number; cost: number }>;
                }>();

                // Expected total per computeCrewCost (for comparison logging)
                let expectedCrewTotal = 0;

                console.log('[EstimateBuilder] ── TASK PREVIEW FULL BREAKDOWN ──');
                console.log('[EstimateBuilder] All task rows:', taskPreview.tasks.map((t: any) => ({
                    phase: t.phase, name: t.name, assigned_to_name: t.assigned_to_name,
                    role_name: t.role_name, total_hours: t.total_hours,
                    hourly_rate: t.hourly_rate, estimated_cost: t.estimated_cost,
                })));

                for (const task of taskPreview.tasks) {
                    if (TASK_EXCLUDED.has(task.phase)) continue;
                    if (!task.assigned_to_name) continue;
                    const cost = task.estimated_cost ?? 0;
                    if (cost != null) expectedCrewTotal += cost;

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
                        // Determine crew category from the matching operator
                        const op = operators.find(o => {
                            const n = o.contributor
                                ? `${o.contributor.contact?.first_name || ''} ${o.contributor.contact?.last_name || ''}`.trim()
                                : '';
                            return n === task.assigned_to_name &&
                                (o.job_role?.display_name === task.role_name || o.job_role?.name === task.role_name);
                        });
                        const cat = op?.job_role?.category?.toLowerCase() || '';
                        const lineCategory = PLANNING_CATEGORIES.has(cat) ? 'Planning'
                            : POST_PROD_CATEGORIES.has(cat) ? 'Post-Production'
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

                // ── Logging: compare computed totals ──
                const lineCrewTotal = Array.from(allCrewMap.values()).reduce((s, v) => s + v.cost, 0);
                console.log('[EstimateBuilder] ── CREW COST COMPARISON ──');
                console.log('[EstimateBuilder] allCrewMap entries:', Array.from(allCrewMap.entries()).map(([k, v]) => ({
                    key: k, category: v.category, hours: v.hours, cost: v.cost, rate: v.rate,
                })));
                console.log('[EstimateBuilder] expectedCrewTotal (sum of task estimated_costs):', expectedCrewTotal);
                console.log('[EstimateBuilder] lineCrewTotal (sum of allCrewMap.cost):', lineCrewTotal);
                console.log('[EstimateBuilder] Match:', Math.abs(expectedCrewTotal - lineCrewTotal) < 0.01 ? '✅ YES' : '❌ NO - diff=' + (expectedCrewTotal - lineCrewTotal));

                // ── Emit Planning + Coverage line items ──
                for (const entry of allCrewMap.values()) {
                    if (entry.category !== 'Planning' && entry.category !== 'Coverage') continue;
                    initialItems.push({
                        tempId: makeTempId(),
                        description: entry.role ? `${entry.name} — ${entry.role}` : entry.name,
                        category: entry.category,
                        quantity: Math.round(entry.hours * 100) / 100,
                        unit: 'Hours',
                        unit_price: entry.rate,
                        total: Math.round(entry.cost * 100) / 100,
                    });
                }

                // ── Emit Post-Production line items ──
                // PP tasks get per-film sub-groups; non-PP (e.g. Delivery) go to 'General'
                const ppEntries = Array.from(allCrewMap.values()).filter(v => v.category === 'Post-Production');
                if (ppEntries.length > 0) {
                    // filmKey → name|role → { name, role, hours, cost, rate }
                    const ppByFilm = new Map<string, Map<string, { name: string; role: string; hours: number; cost: number; rate: number }>>();

                    for (const entry of ppEntries) {
                        const ppFilmHours = Array.from(entry.ppFilmCosts.values()).reduce((s, v) => s + v.hours, 0);
                        const ppFilmCost  = Array.from(entry.ppFilmCosts.values()).reduce((s, v) => s + v.cost,  0);
                        const deliveryHours = entry.hours - ppFilmHours;
                        const deliveryCost  = entry.cost  - ppFilmCost;

                        // Per-film Post_Production
                        for (const [fk, fc] of entry.ppFilmCosts) {
                            if (!ppByFilm.has(fk)) ppByFilm.set(fk, new Map());
                            const k = `${entry.name}|${entry.role}`;
                            const ex = ppByFilm.get(fk)!.get(k);
                            if (ex) { ex.hours += fc.hours; ex.cost += fc.cost; }
                            else { ppByFilm.get(fk)!.set(k, { name: entry.name, role: entry.role, hours: fc.hours, cost: fc.cost, rate: entry.rate }); }
                        }

                        // Delivery (non-film) post-prod costs → 'General'
                        if (deliveryCost > 0.001) {
                            if (!ppByFilm.has('General')) ppByFilm.set('General', new Map());
                            const k = `${entry.name}|${entry.role}`;
                            const ex2 = ppByFilm.get('General')!.get(k);
                            if (ex2) { ex2.hours += deliveryHours; ex2.cost += deliveryCost; }
                            else { ppByFilm.get('General')!.set(k, { name: entry.name, role: entry.role, hours: deliveryHours, cost: deliveryCost, rate: entry.rate }); }
                        }
                    }

                    console.log('[EstimateBuilder] ppByFilm breakdown:', Array.from(ppByFilm.entries()).map(([fk, m]) => ({
                        film: fk, items: Array.from(m.values()),
                    })));

                    for (const [filmKey, filmMap] of ppByFilm) {
                        const catLabel = filmKey === 'General' ? 'Post-Production' : `Post-Production:${filmKey}`;
                        for (const pp of filmMap.values()) {
                            initialItems.push({
                                tempId: makeTempId(),
                                description: pp.role ? `${pp.name} — ${pp.role}` : pp.name,
                                category: catLabel,
                                quantity: Math.round(pp.hours * 100) / 100,
                                unit: 'Hours',
                                unit_price: pp.rate,
                                total: Math.round(pp.cost * 100) / 100,
                            });
                        }
                    }
                }
            } else {
                // ── Fallback: no task preview — use operator rate × hours ──
                const pushFallback = (crew: Map<string, CrewAccum>, categoryLabel: string) => {
                    for (const c of crew.values()) {
                        const description = c.role ? `${c.name} — ${c.role}` : c.name;
                        if (c.useDayRate && c.dayRate > 0) {
                            initialItems.push({ tempId: makeTempId(), description, category: categoryLabel, quantity: c.days, unit: 'Days', unit_price: c.dayRate, total: c.dayRate * c.days });
                        } else {
                            initialItems.push({ tempId: makeTempId(), description, category: categoryLabel, quantity: c.hours, unit: 'Hours', unit_price: c.hourlyRate, total: c.hourlyRate * c.hours });
                        }
                    }
                };
                pushFallback(planningCrew, 'Planning');
                pushFallback(coverageCrew, 'Coverage');
                pushFallback(postProdCrew, 'Post-Production');
            }

            // Equipment — deduplicate by equipment_id, use rental_price_per_day
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
            initialItems = [{
                tempId: `item-${Date.now()}`,
                description: '',
                quantity: 1,
                unit: 'Qty',
                unit_price: 0,
                total: 0
            }];
        }


        setLineItems(initialItems);
        setTaxRate(Number(currentBrand?.default_tax_rate) || 0);
        setPaymentMethod(currentBrand?.default_payment_method || 'Bank Transfer');
        setInstallments(1);
        setMilestones([]);
        setDialTemplateId(
            inquiry.preferred_payment_schedule_template_id
            ?? defaultTemplate?.id
            ?? null
        );
        setEditingEstimate(pkgTitle ? { title: pkgTitle } : null);
        setDialogOpen(true);
    };

    const handleEdit = (estimate: Estimate) => {
        setEditingEstimate(estimate);
        // Use brand currency when opening an existing estimate
        setCurrencySymbol(getCurrencySymbol(currentBrand?.currency || 'USD'));
        const items = estimate.items?.map((item: EstimateItem) => ({
            ...item,
            tempId: `item-${item.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            service_date: item.service_date ? new Date(item.service_date).toISOString().split('T')[0] : (item.service_date || ''),
            start_time: item.start_time || '',
            end_time: item.end_time || '',
            category: item.category || '',
            unit: item.unit || 'Qty',
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            total: (Number(item.quantity) * Number(item.unit_price))
        })) || [];

        if (items.length === 0) {
            items.push({
                tempId: `item-${Date.now()}`,
                description: '',
                service_date: '',
                start_time: '',
                end_time: '',
                category: '',
                quantity: 1,
                unit: 'Qty',
                unit_price: 0,
                total: 0
            });
        }

        setLineItems(items);
        setTaxRate(Number(estimate.tax_rate) || 0);
        setPaymentMethod(estimate.payment_method || 'Bank Transfer');
        setInstallments(estimate.installments || 1);
        setMilestones([]);
        setDialTemplateId(
            estimate.schedule_template_id
            ?? inquiry.preferred_payment_schedule_template_id
            ?? defaultTemplate?.id
            ?? null
        );
        setDialogOpen(true);
        // Load existing milestones for this estimate
        loadMilestones(estimate.id);
    };

    const handleSave = async (statusOverride?: string) => {
        try {
            const currentStatus = typeof statusOverride === 'string' ? statusOverride : (editingEstimate?.status || 'Draft');

            const estimateData = {
                estimate_number: editingEstimate?.estimate_number || undefined,
                title: editingEstimate?.title || undefined,
                issue_date: editingEstimate?.issue_date
                    ? new Date(editingEstimate.issue_date).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                expiry_date: editingEstimate?.expiry_date
                    ? new Date(editingEstimate.expiry_date).toISOString().split('T')[0]
                    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tax_rate: taxRate,
                deposit_required: 0,
                payment_method: paymentMethod,
                installments: installments,
                status: currentStatus,
                notes: editingEstimate?.notes,
                terms: editingEstimate?.terms,
                items: lineItems.map(item => ({
                    description: item.description,
                    category: item.category,
                    service_date: item.service_date ? new Date(item.service_date) : undefined,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    unit: item.unit,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price)
                }))
            };

            let savedId: number | undefined;
            const isNew = !editingEstimate?.id;

            if (editingEstimate && editingEstimate.id) {
                await estimatesApi.update(inquiry.id, editingEstimate.id, estimateData);
                savedId = editingEstimate.id;
            } else {
                const created = await estimatesApi.create(inquiry.id, estimateData);
                savedId = created?.id;
            }

            // Apply payment schedule template whenever one is selected (new or existing estimate)
            if (savedId && dialTemplateId && inquiry.event_date) {
                try {
                    const eventDateStr = inquiry.event_date instanceof Date
                        ? inquiry.event_date.toISOString().split('T')[0]
                        : String(inquiry.event_date).split('T')[0];
                    const ms = await paymentSchedulesApi.applyToEstimate(savedId, {
                        template_id: dialTemplateId,
                        booking_date: new Date().toISOString().split('T')[0],
                        event_date: eventDateStr,
                        total_amount: totalAmount,
                    });
                    setMilestones(ms || []);
                } catch { /* schedule apply is non-critical */ }
            }

            setDialogOpen(false);

            try {
                if (savedId) {
                    autoExpandIdRef.current = Number(savedId);
                }
                const updatedEstimates = await estimatesApi.getAllByInquiry(inquiry.id);
                setEstimates(updatedEstimates || []);

                if (!savedId && updatedEstimates && updatedEstimates.length > 0) {
                    const lastId = Number(updatedEstimates[updatedEstimates.length - 1].id);
                    autoExpandIdRef.current = lastId;
                }
            } catch (error) {
                console.error('Error refreshing estimates:', error);
            }

            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error saving estimate:', err);
            alert(`Failed to save estimate: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleDuplicate = async () => {
        try {
            const estimateData = {
                title: `${editingEstimate?.title || 'Estimate'} (Copy)`,
                issue_date: new Date().toISOString().split('T')[0],
                expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tax_rate: taxRate,
                deposit_required: 0,
                payment_method: paymentMethod,
                installments: installments,
                status: 'Draft',
                notes: editingEstimate?.notes,
                items: lineItems.map(item => ({
                    description: item.description,
                    category: item.category,
                    service_date: item.service_date ? new Date(item.service_date) : undefined,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    unit: item.unit,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price)
                }))
            };

            const created = await estimatesApi.create(inquiry.id, estimateData);
            setDialogOpen(false);

            if (created?.id) {
                autoExpandIdRef.current = Number(created.id);
            }

            const updatedEstimates = await estimatesApi.getAllByInquiry(inquiry.id);
            setEstimates(updatedEstimates || []);

            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error duplicating estimate:', err);
            alert(`Failed to duplicate: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleDelete = async (estimateId: number) => {
        if (!confirm('Are you sure you want to delete this estimate? This action cannot be undone.')) return;
        try {
            await estimatesApi.delete(inquiry.id, estimateId);
            setDialogOpen(false);

            const updatedEstimates = await estimatesApi.getAllByInquiry(inquiry.id);
            setEstimates(updatedEstimates || []);

            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error deleting estimate:', err);
            alert(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleSetFocus = async (estimateId: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            await estimatesApi.update(inquiry.id, estimateId, { is_primary: true });

            const updatedEstimates = await estimatesApi.getAllByInquiry(inquiry.id);
            setEstimates(updatedEstimates || []);

            setExpandedId(estimateId);
        } catch (err) {
            console.error('Error setting focus:', err);
            alert(`Failed to set focus: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleRefreshCosts = async (estimateId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await estimatesApi.refresh(inquiry.id, estimateId);
            const updatedEstimates = await estimatesApi.getAllByInquiry(inquiry.id);
            setEstimates(updatedEstimates || []);
            // Reload snapshots so the new history entry is visible
            const updatedSnapshots = await estimatesApi.getSnapshots(inquiry.id, estimateId);
            setSnapshots(prev => ({ ...prev, [estimateId]: updatedSnapshots }));
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error refreshing costs:', err);
            alert(`Failed to refresh costs: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleRevise = async (estimateId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await estimatesApi.revise(inquiry.id, estimateId);
            const updatedEstimates = await estimatesApi.getAllByInquiry(inquiry.id);
            setEstimates(updatedEstimates || []);
            const updatedSnapshots = await estimatesApi.getSnapshots(inquiry.id, estimateId);
            setSnapshots(prev => ({ ...prev, [estimateId]: updatedSnapshots }));
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error revising estimate:', err);
            alert(`Failed to revise estimate: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleSendEstimate = async (estimateId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await estimatesApi.send(inquiry.id, estimateId);
            const updatedEstimates = await estimatesApi.getAllByInquiry(inquiry.id);
            setEstimates(updatedEstimates || []);
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error sending estimate:', err);
            alert(`Failed to send estimate: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const toggleExpand = (id: number) => {
        const nextExpanded = expandedId === id ? null : id;
        setExpandedId(nextExpanded);
        // Load snapshots when expanding, if not already loaded
        if (nextExpanded && !snapshots[id]) {
            setLoadingSnapshots(prev => ({ ...prev, [id]: true }));
            estimatesApi.getSnapshots(inquiry.id, id)
                .then(data => setSnapshots(prev => ({ ...prev, [id]: data })))
                .catch(() => setSnapshots(prev => ({ ...prev, [id]: [] })))
                .finally(() => setLoadingSnapshots(prev => ({ ...prev, [id]: false })));
        }
    };

    // Also load snapshots when auto-expand sets expandedId (bypasses toggleExpand)
    useEffect(() => {
        if (expandedId && !snapshots[expandedId]) {
            setLoadingSnapshots(prev => ({ ...prev, [expandedId]: true }));
            estimatesApi.getSnapshots(inquiry.id, expandedId)
                .then(data => setSnapshots(prev => ({ ...prev, [expandedId]: data })))
                .catch(() => setSnapshots(prev => ({ ...prev, [expandedId]: [] })))
                .finally(() => setLoadingSnapshots(prev => ({ ...prev, [expandedId]: false })));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expandedId]);

    // Calculation helpers
    const calculateSubtotal = () => lineItems.reduce((acc, item) => acc + (item.total || 0), 0);
    const subtotal = calculateSubtotal();
    const { taxAmount, total: totalAmount } = computeTaxBreakdown(subtotal, taxRate);

    return (
        <>
            <WorkflowCard isActive={isActive} activeColor={activeColor}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                                <AttachMoney sx={{ fontSize: 18, color: '#10b981' }} />
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>Estimates</Typography>
                            {estimates.length > 0 && <Chip label={estimates.length} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }} />}
                        </Box>
                        <Button size="small" startIcon={<Add />} onClick={handleCreate} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}>
                            New Estimate
                        </Button>
                    </Box>

                    {estimates.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.12)' }}>
                                <AttachMoney sx={{ fontSize: 22, color: '#10b981' }} />
                            </Box>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>No estimates yet</Typography>
                            <Typography sx={{ color: '#475569', fontSize: '0.72rem', mt: 0.5 }}>Create your first estimate to show the client pricing</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={1.5}>
                            {estimates.map((estimate) => {
                                const { taxAmount: estTaxAmount, total: estPostTax } = computeTaxBreakdown(Number(estimate.total_amount || 0), Number(estimate.tax_rate || 0));
                                return (
                                <Box
                                    key={estimate.id}
                                    sx={{
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: estimate.is_primary ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.08)',
                                        overflow: 'hidden',
                                        bgcolor: 'rgba(255,255,255,0.02)',
                                        transition: 'border-color 0.15s',
                                        '&:hover': { borderColor: estimate.is_primary ? 'rgba(16,185,129,0.5)' : 'rgba(148,163,184,0.18)' },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            px: 2, py: 1.5,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            borderBottom: expandedId === estimate.id ? '1px solid rgba(148,163,184,0.08)' : 'none',
                                        }}
                                        onClick={() => toggleExpand(estimate.id)}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            {estimate.is_primary && (
                                                <Star sx={{ fontSize: 14, color: '#f59e0b' }} />
                                            )}
                                            <Box>
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#f1f5f9', lineHeight: 1.2 }}>
                                                    {estimate.title || `Estimate #${estimate.estimate_number}`}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                                                    <Typography sx={{ fontSize: '0.68rem', color: '#475569' }}>
                                                        {estimate.estimate_number}
                                                    </Typography>
                                                    {(estimate.version ?? 1) > 1 && (
                                                        <Chip
                                                            label={`v${estimate.version}`}
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setVersionEstimateId(estimate.id);
                                                                setVersionAnchor(e.currentTarget);
                                                                if (!snapshots[estimate.id]) {
                                                                    setLoadingSnapshots(prev => ({ ...prev, [estimate.id]: true }));
                                                                    estimatesApi.getSnapshots(inquiry.id, estimate.id)
                                                                        .then(data => setSnapshots(prev => ({ ...prev, [estimate.id]: data })))
                                                                        .catch(() => setSnapshots(prev => ({ ...prev, [estimate.id]: [] })))
                                                                        .finally(() => setLoadingSnapshots(prev => ({ ...prev, [estimate.id]: false })));
                                                                }
                                                            }}
                                                            sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: 'none', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(139,92,246,0.22)' } }}
                                                        />
                                                    )}
                                                    <Typography sx={{ fontSize: '0.62rem', color: '#334155' }}>
                                                        {new Date(estimate.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip
                                                label={estimate.status}
                                                size="small"
                                                sx={{
                                                    height: 20, fontSize: '0.6rem', fontWeight: 700,
                                                    bgcolor: estimate.status === 'Accepted' ? 'rgba(16,185,129,0.15)' : estimate.status === 'Sent' ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.1)',
                                                    color: estimate.status === 'Accepted' ? '#10b981' : estimate.status === 'Sent' ? '#60a5fa' : '#94a3b8',
                                                    border: 'none',
                                                }}
                                            />
                                            <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#f59e0b', fontFamily: 'monospace', minWidth: 70, textAlign: 'right' }}>
                                                {currencySymbol}{estPostTax.toLocaleString()}
                                            </Typography>
                                            <Box sx={{ display: 'flex', ml: 0.5 }}>
                                                <Tooltip title={estimate.is_primary ? 'Primary' : 'Set as Primary'}>
                                                    <IconButton size="small" onClick={(e) => handleSetFocus(estimate.id, e)} sx={{ p: 0.5, color: estimate.is_primary ? '#f59e0b' : '#334155', '&:hover': { color: '#f59e0b' } }}>
                                                        {estimate.is_primary ? <Star sx={{ fontSize: 15 }} /> : <StarBorder sx={{ fontSize: 15 }} />}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(estimate); }} sx={{ p: 0.5, color: '#334155', '&:hover': { color: '#94a3b8' } }}>
                                                        <Edit sx={{ fontSize: 15 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                {estimate.status === 'Draft' && (
                                                    <Tooltip title={estimate.is_stale ? "⚠ Package updated — costs may be stale. Click to sync." : "Refresh Costs"}>
                                                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                                            <IconButton size="small" onClick={(e) => handleRefreshCosts(estimate.id, e)} sx={{ p: 0.5, color: estimate.is_stale ? '#f59e0b' : '#334155', '&:hover': { color: estimate.is_stale ? '#f97316' : '#06b6d4' } }}>
                                                                <Sync sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                            {estimate.is_stale && (
                                                                <Box sx={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, backgroundColor: '#f59e0b', borderRadius: '50%', border: '1px solid white' }} />
                                                            )}
                                                        </Box>
                                                    </Tooltip>
                                                )}
                                                {estimate.status === 'Sent' && estimate.is_stale && (
                                                    <Tooltip title="⚠ Crew or package changed since this estimate was sent. Click to revise.">
                                                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                                            <IconButton size="small" onClick={(e) => handleRevise(estimate.id, e)} sx={{ p: 0.5, color: '#f59e0b', '&:hover': { color: '#f97316' } }}>
                                                                <EditNote sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                            <Box sx={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, backgroundColor: '#f59e0b', borderRadius: '50%', border: '1px solid white' }} />
                                                        </Box>
                                                    </Tooltip>
                                                )}
                                                {estimate.status === 'Draft' && (
                                                    <Tooltip title="Send Estimate">
                                                        <IconButton size="small" onClick={(e) => handleSendEstimate(estimate.id, e)} sx={{ p: 0.5, color: '#334155', '&:hover': { color: '#10b981' } }}>
                                                            <SendIcon sx={{ fontSize: 15 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(estimate.id); }} sx={{ p: 0.5, color: '#334155', '&:hover': { color: '#ef4444' } }}>
                                                        <Delete sx={{ fontSize: 15 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <IconButton size="small" sx={{ p: 0.5, color: '#334155' }}>
                                                    {expandedId === estimate.id ? <ExpandLess sx={{ fontSize: 15 }} /> : <ExpandMore sx={{ fontSize: 15 }} />}
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* ── Compact category-subtotal preview (always visible) ── */}
                                    {(estimate.items?.length ?? 0) > 0 && expandedId !== estimate.id && (() => {
                                        const catColors: Record<string, string> = { Coverage: '#648CFF', Planning: '#a855f7', 'Post-Production': '#f97316', Travel: '#06b6d4', Equipment: '#10b981', Discount: '#ef4444', Other: '#94a3b8' };
                                        const grouped = (estimate.items || []).reduce((acc: Record<string, number>, item: EstimateItem) => {
                                            // Collapse Post-Production sub-categories (e.g. "Post-Production:Ceremony V8")
                                            const raw = item.category || 'Other';
                                            const cat = raw.startsWith('Post-Production') ? 'Post-Production' : raw;
                                            acc[cat] = (acc[cat] || 0) + Number(item.quantity) * Number(item.unit_price);
                                            return acc;
                                        }, {});
                                        const estSubtotal = Object.values(grouped).reduce((s, v) => s + v, 0);
                                        const barTotal = estSubtotal + estTaxAmount;
                                        return (
                                            <Box sx={{ px: 2, pt: 0.75, pb: 1.25 }}>
                                                {/* Category bars */}
                                                <Box sx={{ display: 'flex', gap: 0.5, mb: 1, height: 4, borderRadius: 2, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.04)' }}>
                                                    {Object.entries(grouped).map(([cat, total]) => (
                                                        <Tooltip key={cat} title={`${cat}: ${currencySymbol}${total.toFixed(2)}`} arrow placement="top">
                                                            <Box sx={{ flex: total / barTotal, bgcolor: catColors[cat] || '#94a3b8', borderRadius: 1, minWidth: 4, transition: 'flex 0.3s' }} />
                                                        </Tooltip>
                                                    ))}
                                                    {estTaxAmount > 0 && (
                                                        <Tooltip title={`Tax (${estimate.tax_rate}%): ${currencySymbol}${estTaxAmount.toFixed(2)}`} arrow placement="top">
                                                            <Box sx={{ flex: estTaxAmount / barTotal, bgcolor: '#f59e0b', borderRadius: 1, minWidth: 4, transition: 'flex 0.3s', opacity: 0.7 }} />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                                {/* Category labels + subtotals */}
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, rowGap: 0.5 }}>
                                                    {Object.entries(grouped).map(([cat, total]) => (
                                                        <Box key={cat} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: catColors[cat] || '#94a3b8', flexShrink: 0 }} />
                                                            <Typography sx={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                                {cat}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 700 }}>
                                                                {currencySymbol}{total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                    {estTaxAmount > 0 && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f59e0b', flexShrink: 0, opacity: 0.7 }} />
                                                            <Typography sx={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                                Tax ({estimate.tax_rate}%)
                                                            </Typography>
                                                            <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 700 }}>
                                                                {currencySymbol}{estTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    })()}

                                    <Collapse in={expandedId === estimate.id}>
                                        <Box sx={{ px: 2, py: 1.5 }}>
                                            {/* Group items by category in expanded view */}
                                            {(() => {
                                                const catColors: Record<string, string> = { Coverage: '#648CFF', Planning: '#a855f7', 'Post-Production': '#f97316', Travel: '#06b6d4', Equipment: '#10b981', Discount: '#ef4444', Other: '#94a3b8' };
                                                const grouped = (estimate.items || []).reduce((acc: Record<string, EstimateItem[]>, item: EstimateItem) => {
                                                    const c = item.category || 'Other';
                                                    if (!acc[c]) acc[c] = [];
                                                    acc[c].push(item);
                                                    return acc;
                                                }, {});
                                                return Object.entries(grouped).map(([cat, catItems]) => {
                                                    // Use the top-level category key for color lookup (e.g. "Post-Production:Film" → "Post-Production")
                                                    const colorKey = cat.startsWith('Post-Production') ? 'Post-Production' : cat;
                                                    const catColor = catColors[colorKey] || '#94a3b8';
                                                    const catTotal = (catItems as EstimateItem[]).reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0);
                                                    return (
                                                        <Box key={cat} sx={{ mb: 1.5 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, pl: 0.5 }}>
                                                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: catColor, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                                                                    {cat}
                                                                </Typography>
                                                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: catColor, fontFamily: 'monospace' }}>
                                                                    {currencySymbol}{catTotal.toFixed(2)}
                                                                </Typography>
                                                            </Box>
                                                            {(catItems as EstimateItem[]).map((item: EstimateItem, idx: number) => (
                                                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 0.5, px: 0.5, borderLeft: `2px solid ${catColor}30` }}>
                                                                    <Typography sx={{ flex: 1, fontSize: '0.78rem', color: '#cbd5e1' }}>{item.description}</Typography>
                                                                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>{currencySymbol}{Number(item.unit_price).toFixed(2)} × {item.quantity}</Typography>
                                                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'monospace', color: '#f1f5f9', minWidth: 70, textAlign: 'right' }}>{currencySymbol}{(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</Typography>
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    );
                                                });
                                            })()}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, mt: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                {Number(estimate.deposit_required) > 0 && (
                                                    <Typography sx={{ fontSize: '0.72rem', color: '#475569' }}>Deposit: <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{currencySymbol}{Number(estimate.deposit_required).toLocaleString()}</span></Typography>
                                                )}
                                                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    {Number(estimate.tax_rate) > 0 && (
                                                        <Typography sx={{ fontSize: '0.68rem', color: '#475569', fontFamily: 'monospace' }}>
                                                            {currencySymbol}{Number(estimate.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + {estimate.tax_rate}% tax
                                                        </Typography>
                                                    )}
                                                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'monospace', color: '#f59e0b' }}>{currencySymbol}{estPostTax.toLocaleString()}</Typography>
                                                </Box>
                                            </Box>
                                            {estimate.notes && (
                                                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                    <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', mb: 0.5 }}>Notes</Typography>
                                                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{estimate.notes}</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Collapse>
                                </Box>
                                );
                            })}
                        </Stack>
                    )}
                </CardContent>
            </WorkflowCard>

            {/* Version History Popover */}
            <Popover
                open={Boolean(versionAnchor)}
                anchorEl={versionAnchor}
                onClose={() => { setVersionAnchor(null); setVersionEstimateId(null); }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{ sx: { bgcolor: '#111827', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 2, p: 1.5, minWidth: 260, maxWidth: 340, maxHeight: 320 } }}
            >
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', mb: 1 }}>
                    Version History
                </Typography>
                {versionEstimateId && loadingSnapshots[versionEstimateId] ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={18} sx={{ color: '#a78bfa' }} />
                    </Box>
                ) : versionEstimateId && (snapshots[versionEstimateId]?.length ?? 0) > 0 ? (
                    <Stack spacing={0.5}>
                        {/* Current version */}
                        {(() => {
                            const est = estimates.find(e => e.id === versionEstimateId);
                            if (!est) return null;
                            const currentTax = computeTaxBreakdown(Number(est.total_amount || 0), Number(est.tax_rate || 0));
                            return (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, borderRadius: 1, bgcolor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                    <Chip label={`v${est.version}`} size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: 'none' }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ fontSize: '0.68rem', color: '#e2e8f0', fontWeight: 600 }}>Current</Typography>
                                    </Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', fontFamily: 'monospace', color: '#a78bfa' }}>
                                        {currencySymbol}{currentTax.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Typography>
                                </Box>
                            );
                        })()}
                        {/* Previous versions */}
                        {(snapshots[versionEstimateId] || []).map(snap => (
                            <Box key={snap.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
                                <Chip label={`v${snap.version_number}`} size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(139,92,246,0.08)', color: '#7c3aed', border: 'none' }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontSize: '0.62rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {snap.label || 'Snapshot'}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.55rem', color: '#334155' }}>
                                        {new Date(snap.snapshotted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        {' · '}{snap.items_snapshot.length} item{snap.items_snapshot.length !== 1 ? 's' : ''}
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', fontFamily: 'monospace', color: '#64748b' }}>
                                    {currencySymbol}{Number(snap.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                ) : (
                    <Typography sx={{ fontSize: '0.72rem', color: '#334155', py: 1 }}>
                        No previous versions saved
                    </Typography>
                )}
            </Popover>

            {/* Estimate Builder Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="xl"
                fullWidth
                PaperProps={{
                    sx: {
                        maxHeight: '90vh', height: 'auto',
                        bgcolor: '#090f1c',
                        display: 'flex', flexDirection: 'column',
                        border: '1px solid rgba(148,163,184,0.1)',
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                    }
                }}
            >
                {/* Top accent bar */}
                <Box sx={{ height: 3, background: 'linear-gradient(90deg, #10b981, #10b98160)' }} />

                {/* Dialog Header */}
                <Box sx={{
                    px: 3, py: 2,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    bgcolor: '#0d1629',
                    borderBottom: '1px solid rgba(148,163,184,0.08)',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 34, height: 34, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <ReceiptLong sx={{ fontSize: 18, color: '#10b981' }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#f1f5f9', lineHeight: 1.2 }}>
                                {editingEstimate?.id ? 'Edit Estimate' : 'Estimate Builder'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                                {editingEstimate?.title && (
                                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>{editingEstimate.title}</Typography>
                                )}
                                {editingEstimate?.estimate_number && (
                                    <Chip label={editingEstimate.estimate_number} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: 'rgba(148,163,184,0.08)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.15)' }} />
                                )}
                                {editingEstimate?.id && (editingEstimate?.version ?? 1) > 1 && (
                                    <Chip
                                        label={`v${editingEstimate.version}`}
                                        size="small"
                                        onClick={(e) => {
                                            const estId = editingEstimate.id!;
                                            setVersionEstimateId(estId);
                                            setVersionAnchor(e.currentTarget);
                                            if (!snapshots[estId]) {
                                                setLoadingSnapshots(prev => ({ ...prev, [estId]: true }));
                                                estimatesApi.getSnapshots(inquiry.id, estId)
                                                    .then(data => setSnapshots(prev => ({ ...prev, [estId]: data })))
                                                    .catch(() => setSnapshots(prev => ({ ...prev, [estId]: [] })))
                                                    .finally(() => setLoadingSnapshots(prev => ({ ...prev, [estId]: false })));
                                            }
                                        }}
                                        sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: 'none', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(139,92,246,0.22)' } }}
                                    />
                                )}
                                {editingEstimate?.created_at && (
                                    <Typography sx={{ fontSize: '0.65rem', color: '#334155' }}>
                                        Created {new Date(editingEstimate.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        {editingEstimate?.status && (
                            <Chip
                                label={editingEstimate.status}
                                size="small"
                                sx={{
                                    height: 22, fontSize: '0.65rem', fontWeight: 700,
                                    bgcolor: editingEstimate.status === 'Sent' ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.1)',
                                    color: editingEstimate.status === 'Sent' ? '#60a5fa' : '#94a3b8',
                                    border: 'none',
                                }}
                            />
                        )}
                        {editingEstimate?.id && editingEstimate?.status === 'Draft' && (
                            <Tooltip title={editingEstimate.is_stale ? "⚠ Package updated — costs may be stale. Click to sync." : "Refresh costs from current package"}>
                                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                    <IconButton
                                        size="small"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                                const refreshed = await estimatesApi.refresh(inquiry.id, editingEstimate.id!);
                                                // Update the editing estimate state with refreshed data
                                                setEditingEstimate(prev => ({
                                                    ...prev,
                                                    version: refreshed.version,
                                                    title: refreshed.title || prev?.title,
                                                    total_amount: refreshed.total_amount,
                                                    is_stale: false,
                                                }));
                                                // Update line items in the editor
                                                const items = (refreshed.items || []).map((item: any) => ({
                                                    ...item,
                                                    tempId: `item-${item.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                                    category: item.category || '',
                                                    unit: item.unit || 'Qty',
                                                    quantity: Number(item.quantity),
                                                    unit_price: Number(item.unit_price),
                                                    total: Number(item.quantity) * Number(item.unit_price),
                                                }));
                                                setLineItems(items.length > 0 ? items : [{ tempId: `item-${Date.now()}`, description: '', quantity: 1, unit: 'Qty', unit_price: 0, total: 0 }]);
                                                // Refresh the estimates list + snapshots
                                                const updatedEstimates = await estimatesApi.getAllByInquiry(inquiry.id);
                                                setEstimates(updatedEstimates || []);
                                                const updatedSnapshots = await estimatesApi.getSnapshots(inquiry.id, editingEstimate.id!);
                                                setSnapshots(prev => ({ ...prev, [editingEstimate.id!]: updatedSnapshots }));
                                                if (onRefresh) await onRefresh();
                                            } catch (err) {
                                                console.error('Error refreshing costs:', err);
                                                alert(`Failed to refresh costs: ${err instanceof Error ? err.message : 'Unknown error'}`);
                                            }
                                        }}
                                        sx={{ p: 0.5, color: editingEstimate.is_stale ? '#f59e0b' : '#475569', '&:hover': { color: editingEstimate.is_stale ? '#f97316' : '#06b6d4' } }}
                                    >
                                        <Sync sx={{ fontSize: 17 }} />
                                    </IconButton>
                                    {editingEstimate.is_stale && (
                                        <Box sx={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, backgroundColor: '#f59e0b', borderRadius: '50%', border: '1px solid white' }} />
                                    )}
                                </Box>
                            </Tooltip>
                        )}
                    </Box>
                    <IconButton onClick={() => setDialogOpen(false)} size="small" sx={{ color: '#475569', '&:hover': { color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                        <Close sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>

                {/* Main body */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, flex: 1, overflow: 'hidden' }}>

                    {/* Left — Line items */}
                    <Box sx={{ flex: 1, p: 3, overflowY: 'auto', bgcolor: '#090f1c' }}>
                        {/* Title field */}
                        <Box sx={{ mb: 3 }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.7px', mb: 0.75 }}>Title / Reference</Typography>
                            <TextField
                                placeholder='e.g. "Full Day Wedding Coverage"'
                                fullWidth
                                variant="standard"
                                value={editingEstimate?.title || ''}
                                onChange={(e) => setEditingEstimate({ ...editingEstimate, title: e.target.value })}
                                InputProps={{ disableUnderline: false }}
                                sx={{
                                    '& input': { fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9', pb: 0.75 },
                                    '& .MuiInput-underline:before': { borderBottomColor: 'rgba(148,163,184,0.15)' },
                                    '& .MuiInput-underline:hover:before': { borderBottomColor: 'rgba(148,163,184,0.3) !important' },
                                    '& .MuiInput-underline:after': { borderBottomColor: '#10b981' },
                                }}
                            />
                        </Box>

                        {/* Section label */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Cost Breakdown</Typography>
                            <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(148,163,184,0.07)' }} />
                            <Typography sx={{ fontSize: '0.6rem', color: '#334155', fontStyle: 'italic' }}>auto-generated from package</Typography>
                        </Box>

                        <LineItemEditor
                            items={lineItems}
                            onChange={setLineItems}
                            currencySymbol={currencySymbol}
                            readOnly={true}
                        />

                        {/* Notes */}
                        <Box sx={{ mt: 4 }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.7px', mb: 0.75 }}>Internal Notes</Typography>
                            <TextField
                                multiline
                                rows={3}
                                fullWidth
                                placeholder="Payment terms, special requirements, etc..."
                                value={editingEstimate?.notes || ''}
                                onChange={(e) => setEditingEstimate({ ...editingEstimate, notes: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'rgba(255,255,255,0.02)',
                                        fontSize: '0.82rem',
                                        '& fieldset': { borderColor: 'rgba(148,163,184,0.1)' },
                                        '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.2)' },
                                        '&.Mui-focused fieldset': { borderColor: '#10b981' },
                                    },
                                    '& textarea': { color: '#94a3b8' },
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Right — Financial Summary sidebar */}
                    <Box sx={{
                        width: { xs: '100%', lg: 340 },
                        borderLeft: { lg: '1px solid rgba(148,163,184,0.08)' },
                        bgcolor: '#060b14',
                        display: 'flex', flexDirection: 'column',
                        overflowY: 'auto',
                    }}>
                        {/* Total hero */}
                        <Box sx={{ p: 3, borderBottom: '1px solid rgba(148,163,184,0.08)', textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.8px', mb: 1 }}>Total Amount</Typography>
                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '2.2rem', color: '#f59e0b', lineHeight: 1 }}>
                                {currencySymbol}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </Typography>
                            {taxRate > 0 && (
                                <Typography sx={{ fontSize: '0.7rem', color: '#475569', mt: 0.75 }}>
                                    {currencySymbol}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} + {taxRate}% tax
                                </Typography>
                            )}
                        </Box>

                        {/* Tax + subtotal */}
                        <Box sx={{ p: 3, borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>Subtotal</Typography>
                                <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 600 }}>
                                    {currencySymbol}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>Tax rate</Typography>
                                <TextField
                                    size="small"
                                    type="number"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(Number(e.target.value))}
                                    InputProps={{ endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: '0.75rem', color: '#475569' }}>%</Typography></InputAdornment> }}
                                    sx={{
                                        width: 90,
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255,255,255,0.03)', fontSize: '0.82rem',
                                            '& fieldset': { borderColor: 'rgba(148,163,184,0.1)' },
                                            '&.Mui-focused fieldset': { borderColor: '#10b981' },
                                        },
                                        '& input': { py: 0.6, color: '#94a3b8', textAlign: 'right' },
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Payment settings */}
                        <Box sx={{ p: 3, borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.8px', mb: 2 }}>Payment</Typography>

                            <FormControl fullWidth size="small">
                                <InputLabel sx={{ fontSize: '0.78rem', color: '#475569 !important' }}>Payment Method</InputLabel>
                                <Select
                                    value={paymentMethod}
                                    label="Payment Method"
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.03)', fontSize: '0.82rem', color: '#94a3b8',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.1)' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#10b981' },
                                    }}
                                >
                                    <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                                    <MenuItem value="Credit Card">Credit Card</MenuItem>
                                    <MenuItem value="Cash">Cash</MenuItem>
                                    <MenuItem value="Check">Check</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Payment Schedule */}
                        <Box sx={{ p: 3, flex: 1 }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.8px', mb: 1.5 }}>Payment Schedule</Typography>
                            {(() => {
                                const tpl = allTemplates.find((t) => t.id === dialTemplateId);
                                return tpl ? (
                                    <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', mb: 1.5 }}>
                                        {tpl.name}{tpl.is_default ? ' (default)' : ''}
                                    </Typography>
                                ) : (
                                    <Typography sx={{ fontSize: '0.75rem', color: '#334155', fontStyle: 'italic', mb: 1.5 }}>
                                        No schedule set — change in Payment Terms.
                                    </Typography>
                                );
                            })()}
                            {(() => {
                                const previewTemplate = allTemplates.find((t) => t.id === dialTemplateId) ?? null;

                                // ── Build a unified rows array from whichever source is active ──
                                type PayRow = { label: string; amount: number; pct: number; trigger: string; status?: string; color: string };
                                const MILESTONE_COLORS = ['#a78bfa', '#60a5fa', '#34d399', '#f59e0b', '#f87171', '#818cf8', '#2dd4bf'];

                                let rows: PayRow[] = [];

                                if (milestones.length > 0) {
                                    rows = milestones.map((m, i) => {
                                        const amt = Number(m.amount);
                                        const pct = totalAmount > 0 ? (amt / totalAmount) * 100 : 0;
                                        const statusColor = m.status === 'PAID' ? '#10b981' : m.status === 'OVERDUE' ? '#ef4444' : MILESTONE_COLORS[i % MILESTONE_COLORS.length];
                                        return {
                                            label: m.label,
                                            amount: amt,
                                            pct,
                                            trigger: m.due_date
                                                ? new Date(m.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                                : 'TBD',
                                            status: m.status,
                                            color: statusColor,
                                        };
                                    });
                                } else if (previewTemplate?.rules?.length) {
                                    const sorted = previewTemplate.rules.slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
                                    rows = sorted.map((rule, i) => {
                                        const amt = rule.amount_type === 'PERCENT'
                                            ? (Number(rule.amount_value) / 100) * totalAmount
                                            : Number(rule.amount_value);
                                        const pct = rule.amount_type === 'PERCENT'
                                            ? Number(rule.amount_value)
                                            : (totalAmount > 0 ? (amt / totalAmount) * 100 : 0);
                                        const trigger =
                                            rule.trigger_type === 'AFTER_BOOKING' ? `${rule.trigger_days ?? 0}d after booking` :
                                            rule.trigger_type === 'BEFORE_EVENT'  ? `${rule.trigger_days ?? 0}d before event`  :
                                            rule.trigger_type === 'AFTER_EVENT'   ? `${rule.trigger_days ?? 0}d after event`   :
                                            'On date';
                                        return { label: rule.label, amount: amt, pct, trigger, color: MILESTONE_COLORS[i % MILESTONE_COLORS.length] };
                                    });
                                }

                                if (rows.length === 0) {
                                    return (
                                        <Typography sx={{ fontSize: '0.75rem', color: '#334155', fontStyle: 'italic' }}>
                                            {dialTemplateId ? 'No rules defined for this template.' : 'No schedule selected.'}
                                        </Typography>
                                    );
                                }

                                const barTotal = rows.reduce((s, r) => s + r.amount, 0) || 1;

                                return (
                                    <>
                                        {/* ── Segmented split bar ── */}
                                        <Box sx={{ display: 'flex', gap: 0.5, mb: 1, height: 4, borderRadius: 2, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.04)' }}>
                                            {rows.map((r, i) => (
                                                <Tooltip key={i} title={`${r.label}: ${currencySymbol}${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${Math.round(r.pct)}%)`} arrow placement="top">
                                                    <Box sx={{ flex: r.amount / barTotal, bgcolor: r.color, borderRadius: 1, minWidth: 4, transition: 'flex 0.3s' }} />
                                                </Tooltip>
                                            ))}
                                        </Box>

                                        {/* ── Compact label chips ── */}
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, rowGap: 0.5, mb: 1.5 }}>
                                            {rows.map((r, i) => (
                                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: r.color, flexShrink: 0 }} />
                                                    <Typography sx={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                        {r.label}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 700 }}>
                                                        {currencySymbol}{r.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.58rem', color: '#475569' }}>({Math.round(r.pct)}%)</Typography>
                                                </Box>
                                            ))}
                                        </Box>

                                        {/* ── Individual milestone rows ── */}
                                        <Stack spacing={0.5}>
                                            {rows.map((r, i) => (
                                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, px: 0.75, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${r.color}` }}>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography sx={{ fontSize: '0.73rem', color: '#cbd5e1', fontWeight: 600, lineHeight: 1.2 }}>{r.label}</Typography>
                                                        <Typography sx={{ fontSize: '0.6rem', color: '#475569', mt: 0.1 }}>{r.trigger}</Typography>
                                                    </Box>
                                                    {r.status && (
                                                        <Chip label={r.status} size="small" sx={{
                                                            height: 15, fontSize: '0.52rem',
                                                            bgcolor: r.status === 'PAID' ? 'rgba(16,185,129,0.15)' : r.status === 'OVERDUE' ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.08)',
                                                            color: r.status === 'PAID' ? '#10b981' : r.status === 'OVERDUE' ? '#ef4444' : '#64748b',
                                                            border: 'none',
                                                        }} />
                                                    )}
                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace', color: r.color, minWidth: 56, textAlign: 'right' }}>
                                                        {currencySymbol}{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </>
                                );
                            })()}
                        </Box>
                    </Box>
                </Box>

                {/* Footer */}
                <Box sx={{
                    px: 3, py: 2,
                    borderTop: '1px solid rgba(148,163,184,0.08)',
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    bgcolor: '#0a1020',
                }}>
                    {editingEstimate?.id && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                onClick={handleDuplicate}
                                startIcon={<ContentCopyIcon sx={{ fontSize: '0.85rem !important' }} />}
                                size="small"
                                sx={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'none', '&:hover': { color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.04)' } }}
                            >
                                Duplicate
                            </Button>
                            <Button
                                onClick={() => handleDelete(editingEstimate.id!)}
                                startIcon={<Delete sx={{ fontSize: '0.85rem !important' }} />}
                                size="small"
                                sx={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'none', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.06)' } }}
                            >
                                Delete
                            </Button>
                            {!editingEstimate?.is_primary ? (
                                <Button
                                    onClick={(e) => handleSetFocus(editingEstimate.id!, e)}
                                    startIcon={<StarBorder sx={{ fontSize: '0.85rem !important' }} />}
                                    size="small"
                                    sx={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'none', '&:hover': { color: '#f59e0b', bgcolor: 'rgba(245,158,11,0.06)' } }}
                                >
                                    Make Primary
                                </Button>
                            ) : (
                                <Chip icon={<Star sx={{ fontSize: '0.8rem !important', color: '#f59e0b !important' }} />} label="Primary" size="small"
                                    sx={{ height: 24, fontSize: '0.65rem', bgcolor: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }} />
                            )}
                        </Box>
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Button
                        onClick={() => setDialogOpen(false)}
                        size="small"
                        sx={{ color: '#475569', fontSize: '0.78rem', textTransform: 'none', '&:hover': { color: '#64748b', bgcolor: 'rgba(255,255,255,0.04)' } }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleSave('Draft')}
                        variant="outlined"
                        startIcon={<Save sx={{ fontSize: '0.9rem !important' }} />}
                        size="small"
                        sx={{
                            borderColor: 'rgba(148,163,184,0.2)', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'none',
                            '&:hover': { borderColor: 'rgba(148,163,184,0.35)', bgcolor: 'rgba(255,255,255,0.04)' },
                        }}
                    >
                        Save Draft
                    </Button>
                    <Button
                        onClick={() => handleSave('Sent')}
                        variant="contained"
                        endIcon={<SendIcon sx={{ fontSize: '0.9rem !important' }} />}
                        size="small"
                        sx={{
                            bgcolor: '#10b981', color: '#fff', fontSize: '0.78rem', textTransform: 'none', fontWeight: 700,
                            '&:hover': { bgcolor: '#059669' },
                            boxShadow: '0 0 20px rgba(16,185,129,0.25)',
                        }}
                    >
                        Send Estimate
                    </Button>
                </Box>
            </Dialog>
        </>
    );
};

export { EstimatesCard };
