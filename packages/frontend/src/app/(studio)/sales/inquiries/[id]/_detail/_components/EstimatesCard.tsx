'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Card, CardContent, Button, Stack, TextField, Dialog,
    IconButton, FormControl, InputLabel, Select, MenuItem,
    Chip, Collapse, InputAdornment, Tooltip,
} from '@mui/material';
import {
    AttachMoney, Add, Edit, Save, Send as SendIcon, Delete,
    Star, StarBorder, ExpandLess, ExpandMore,
    ContentCopy as ContentCopyIcon, Close, ReceiptLong,
} from '@mui/icons-material';
import { estimatesService, api } from '@/lib/api';
import { useBrand } from '@/app/providers/BrandProvider';
import { Estimate, EstimateItem } from '@/lib/types';
import type { PaymentScheduleTemplate, EstimatePaymentMilestone } from '@/lib/types';
import { getCurrencySymbol } from '@/lib/utils/formatUtils';
import LineItemEditor, { LineItem } from '../../components/LineItemEditor';
import type { WorkflowCardProps } from '../_lib';
import { WorkflowCard } from './WorkflowCard';

const EstimatesCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const { currentBrand } = useBrand();

    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEstimate, setEditingEstimate] = useState<Partial<Estimate> | null>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);

    // Payment schedule state
    const [defaultTemplate, setDefaultTemplate] = useState<PaymentScheduleTemplate | null>(null);
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

    // Load default payment schedule template for the brand
    useEffect(() => {
        if (!currentBrand?.id) return;
        api.paymentSchedules.getDefault(currentBrand.id)
            .then(setDefaultTemplate)
            .catch(() => { /* no default template set */ });
    }, [currentBrand?.id]);

    const loadMilestones = async (estimateId: number) => {
        try {
            const ms = await api.paymentSchedules.getMilestones(estimateId);
            setMilestones(ms || []);
        } catch {
            setMilestones([]);
        }
    };

    // Accordion state
    const [expandedId, setExpandedId] = useState<number | null>(null);
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
                    const estimatesData = await estimatesService.getAllByInquiry(inquiry.id);
                    setEstimates(estimatesData || []);
                } catch (error) {
                    console.error('Error fetching estimates:', error);
                    setEstimates([]);
                }
            }
        };
        fetchEstimates();
    }, [inquiry?.id]);

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
        pkgTitle = snapshot?.package_name || '';

        // 1. Fetch live schedule data (films, operators, task preview) in parallel
        //    Films come from the actual schedule — NOT the stale package snapshot —
        //    so renames and additions are always reflected.
        try {
            const packageId = inquiry.selected_package_id;
            const brandId = currentBrand?.id;

            const [scheduleFilms, operators, taskPreview] = await Promise.all([
                api.inquiries.scheduleSnapshot.getFilms(inquiry.id).catch(() => [] as any[]),
                api.inquiries.scheduleSnapshot.getOperators(inquiry.id) as Promise<any[]>,
                packageId && brandId
                    ? api.taskLibrary.previewAutoGeneration(packageId, brandId, inquiry.id).catch(() => null)
                    : Promise.resolve(null),
            ]);

            // Collect film names for post-production matching (no separate Films section)
            const filmNames: string[] = [];
            for (const pf of scheduleFilms) {
                const filmName = pf.film?.name || `Film #${pf.film_id}`;
                filmNames.push(filmName);
            }

            // ── Categorize operators by job_role.category ──
            // creative / production → Planning (Director, Producer)
            // technical             → Coverage  (Videographer, Sound Engineer)
            // post-production       → Post-Production per film (Editor)
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

                // Pick the right bucket based on role category
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
                        name,
                        role,
                        hours,
                        days: 1,
                        hourlyRate: resolveHourlyRate(op),
                        dayRate: resolveDayRate(op),
                        useDayRate: isDayRate(op),
                    });
                }
            }

            // Helper: push crew items into initialItems for a given category
            const pushCrewItems = (crew: Map<string, CrewAccum>, categoryLabel: string) => {
                for (const c of crew.values()) {
                    const description = c.role ? `${c.name} — ${c.role}` : c.name;
                    if (c.useDayRate && c.dayRate > 0) {
                        initialItems.push({
                            tempId: makeTempId(),
                            description,
                            category: categoryLabel,
                            quantity: c.days,
                            unit: 'Days',
                            unit_price: c.dayRate,
                            total: c.dayRate * c.days,
                        });
                    } else {
                        initialItems.push({
                            tempId: makeTempId(),
                            description,
                            category: categoryLabel,
                            quantity: c.hours,
                            unit: 'Hours',
                            unit_price: c.hourlyRate,
                            total: c.hourlyRate * c.hours,
                        });
                    }
                }
            };

            pushCrewItems(planningCrew, 'Planning');
            pushCrewItems(coverageCrew, 'Coverage');

            // ── Post-Production: per-film breakdown from task preview ──
            // Task preview already expands per_film tasks (e.g. "Edit Film — Ceremony V8").
            // We use that for the detailed per-film cost breakdown.
            // Additionally, coverage-day editors (postProdCrew) are listed under
            // the first post-prod sub-heading so their event-day hours are visible.
            if (taskPreview?.tasks) {
                // Group post-prod tasks by film name
                const postProdByFilm = new Map<string, { items: { name: string; role: string; hours: number; rate: number; cost: number }[] }>();
                for (const task of taskPreview.tasks) {
                    if (task.phase !== 'Post_Production') continue;
                    // Filter out inquiry/booking phase costs
                    if (task.phase === 'Inquiry' || task.phase === 'Booking') continue;
                    if (!task.assigned_to_name) continue;
                    // Task names from per_film trigger include the film name (e.g. "Edit Film — Ceremony V8")
                    // Try to match a film name from the schedule
                    const matchedFilm = filmNames.find(fn => task.name?.includes(fn));
                    const filmKey = matchedFilm || 'General';
                    if (!postProdByFilm.has(filmKey)) {
                        postProdByFilm.set(filmKey, { items: [] });
                    }
                    postProdByFilm.get(filmKey)!.items.push({
                        name: task.assigned_to_name,
                        role: task.role_name ?? '',
                        hours: task.total_hours,
                        rate: task.hourly_rate ?? 0,
                        cost: task.estimated_cost ?? 0,
                    });
                }


                // If we have per-film breakdown, create sub-grouped items
                if (postProdByFilm.size > 0) {
                    for (const [filmKey, group] of postProdByFilm) {
                        // 'Post-Production' = general, 'Post-Production:<Film>' = per-film sub-group
                        const catLabel = filmKey === 'General' ? 'Post-Production' : `Post-Production:${filmKey}`;
                        // Merge by person+role within each film
                        const merged = new Map<string, { name: string; role: string; hours: number; rate: number; cost: number }>();
                        for (const item of group.items) {
                            const k = `${item.name}|${item.role}`;
                            const ex = merged.get(k);
                            if (ex) {
                                ex.hours += item.hours;
                                ex.cost += item.cost;
                            } else {
                                merged.set(k, { ...item });
                            }
                        }
                        for (const pp of merged.values()) {
                            const baseDesc = pp.role ? `${pp.name} — ${pp.role}` : pp.name;
                            const description = baseDesc;
                            initialItems.push({
                                tempId: makeTempId(),
                                description,
                                category: catLabel,
                                quantity: Math.round(pp.hours * 10) / 10,
                                unit: 'Hours',
                                unit_price: pp.rate,
                                total: pp.cost,
                            });
                        }
                    }
                } else {
                    // Fallback: no task preview post-prod, use coverage-day editors
                    pushCrewItems(postProdCrew, 'Post-Production');
                }
            } else {
                // No task preview available — fall back to coverage-day post-prod crew
                pushCrewItems(postProdCrew, 'Post-Production');
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
        setDialogOpen(true);
        // Load existing milestones for this estimate
        loadMilestones(estimate.id);
    };

    const handleSave = async (statusOverride?: string) => {
        try {
            const currentStatus = typeof statusOverride === 'string' ? statusOverride : (editingEstimate?.status || 'Draft');

            const estimateData = {
                estimate_number: editingEstimate?.estimate_number || `EST-${Date.now()}`,
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
                await estimatesService.update(inquiry.id, editingEstimate.id, estimateData);
                savedId = editingEstimate.id;
            } else {
                const created = await estimatesService.create(inquiry.id, estimateData);
                savedId = created?.id;
            }

            // Auto-apply default payment schedule template to new estimates
            if (isNew && savedId && defaultTemplate && inquiry.event_date) {
                try {
                    const ms = await api.paymentSchedules.applyToEstimate(savedId, {
                        template_id: defaultTemplate.id,
                        booking_date: new Date().toISOString().split('T')[0],
                        event_date: typeof inquiry.event_date === 'string'
                            ? inquiry.event_date.split('T')[0]
                            : new Date(inquiry.event_date as unknown as string).toISOString().split('T')[0],
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
                const updatedEstimates = await estimatesService.getAllByInquiry(inquiry.id);
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
                estimate_number: `EST-${Date.now()}`,
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

            const created = await estimatesService.create(inquiry.id, estimateData);
            setDialogOpen(false);

            if (created?.id) {
                autoExpandIdRef.current = Number(created.id);
            }

            const updatedEstimates = await estimatesService.getAllByInquiry(inquiry.id);
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
            await estimatesService.delete(inquiry.id, estimateId);
            setDialogOpen(false);

            const updatedEstimates = await estimatesService.getAllByInquiry(inquiry.id);
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
            await estimatesService.update(inquiry.id, estimateId, { is_primary: true });

            const updatedEstimates = await estimatesService.getAllByInquiry(inquiry.id);
            setEstimates(updatedEstimates || []);

            setExpandedId(estimateId);
        } catch (err) {
            console.error('Error setting focus:', err);
            alert(`Failed to set focus: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // Calculation helpers
    const calculateSubtotal = () => lineItems.reduce((acc, item) => acc + (item.total || 0), 0);
    const subtotal = calculateSubtotal();
    const taxAmount = (subtotal * (taxRate / 100));
    const totalAmount = subtotal + taxAmount;

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
                            {estimates.map((estimate) => (
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
                                                <Typography sx={{ fontSize: '0.68rem', color: '#475569', mt: 0.25 }}>
                                                    {new Date(estimate.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </Typography>
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
                                                {currencySymbol}{Number(estimate.total_amount || 0).toLocaleString()}
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
                                        return (
                                            <Box sx={{ px: 2, pt: 0.75, pb: 1.25 }}>
                                                {/* Category bars */}
                                                <Box sx={{ display: 'flex', gap: 0.5, mb: 1, height: 4, borderRadius: 2, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.04)' }}>
                                                    {Object.entries(grouped).map(([cat, total]) => (
                                                        <Tooltip key={cat} title={`${cat}: ${currencySymbol}${total.toFixed(2)}`} arrow placement="top">
                                                            <Box sx={{ flex: total / estSubtotal, bgcolor: catColors[cat] || '#94a3b8', borderRadius: 1, minWidth: 4, transition: 'flex 0.3s' }} />
                                                        </Tooltip>
                                                    ))}
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
                                                    {Number(estimate.tax_rate) > 0 && <Typography sx={{ fontSize: '0.7rem', color: '#475569' }}>+{estimate.tax_rate}% tax</Typography>}
                                                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'monospace', color: '#f59e0b' }}>{currencySymbol}{Number(estimate.total_amount).toLocaleString()}</Typography>
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
                            ))}
                        </Stack>
                    )}
                </CardContent>
            </WorkflowCard>

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
                            {editingEstimate?.title && (
                                <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.25 }}>{editingEstimate.title}</Typography>
                            )}
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
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Payment Schedule</Typography>
                                {defaultTemplate && (
                                    <Chip label={defaultTemplate.name} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(16,185,129,0.08)', color: '#10b981', border: 'none' }} />
                                )}
                            </Box>
                            {milestones.length > 0 ? (
                                /* Saved milestones (existing estimate) */
                                <Stack spacing={0.75}>
                                    {milestones.map((m, i) => {
                                        const pct = totalAmount > 0 ? Math.round((Number(m.amount) / totalAmount) * 100) : 0;
                                        return (
                                            <Box key={i} sx={{ py: 0.75, px: 1.25, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(148,163,184,0.06)' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                    <Typography sx={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>{m.label}</Typography>
                                                    <Chip label={m.status} size="small" sx={{
                                                        height: 16, fontSize: '0.55rem',
                                                        bgcolor: m.status === 'PAID' ? 'rgba(16,185,129,0.15)' : m.status === 'OVERDUE' ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.08)',
                                                        color: m.status === 'PAID' ? '#10b981' : m.status === 'OVERDUE' ? '#ef4444' : '#64748b',
                                                        border: 'none',
                                                    }} />
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                    <Typography sx={{ fontSize: '0.68rem', color: '#475569' }}>
                                                        {m.due_date ? new Date(m.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'monospace', color: '#f59e0b' }}>
                                                        {currencySymbol}{Number(m.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        <Typography component="span" sx={{ fontSize: '0.62rem', color: '#475569', ml: 0.5 }}>({pct}%)</Typography>
                                                    </Typography>
                                                </Box>
                                                {/* Progress bar */}
                                                <Box sx={{ mt: 0.75, height: 3, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.08)', overflow: 'hidden' }}>
                                                    <Box sx={{ height: '100%', width: `${pct}%`, borderRadius: 2, bgcolor: m.status === 'PAID' ? '#10b981' : '#f59e0b', transition: 'width 0.3s' }} />
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            ) : defaultTemplate?.rules?.length ? (
                                /* Preview from template rules (new estimate, before save) */
                                <Stack spacing={0.75}>
                                    {defaultTemplate.rules
                                        .slice()
                                        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                                        .map((rule, i) => {
                                            const amount = rule.amount_type === 'PERCENT'
                                                ? (Number(rule.amount_value) / 100) * totalAmount
                                                : Number(rule.amount_value);
                                            const pct = rule.amount_type === 'PERCENT'
                                                ? Math.round(Number(rule.amount_value))
                                                : (totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0);
                                            const triggerLabel =
                                                rule.trigger_type === 'AFTER_BOOKING' ? `${rule.trigger_days ?? 0}d after booking` :
                                                rule.trigger_type === 'BEFORE_EVENT' ? `${rule.trigger_days ?? 0}d before event` :
                                                rule.trigger_type === 'AFTER_EVENT' ? `${rule.trigger_days ?? 0}d after event` :
                                                'On date';
                                            return (
                                                <Box key={i} sx={{ py: 0.75, px: 1.25, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(148,163,184,0.06)' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                        <Typography sx={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>{rule.label}</Typography>
                                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'monospace', color: '#f59e0b' }}>
                                                            {currencySymbol}{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography sx={{ fontSize: '0.62rem', color: '#475569' }}>{triggerLabel}</Typography>
                                                        <Typography sx={{ fontSize: '0.62rem', color: '#475569' }}>{pct}%</Typography>
                                                    </Box>
                                                    {/* Progress bar */}
                                                    <Box sx={{ mt: 0.5, height: 3, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.08)', overflow: 'hidden' }}>
                                                        <Box sx={{ height: '100%', width: `${pct}%`, borderRadius: 2, bgcolor: '#f59e0b40' }} />
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                </Stack>
                            ) : (
                                <Typography sx={{ fontSize: '0.75rem', color: '#334155', fontStyle: 'italic' }}>
                                    No schedule configured — add one in Settings
                                </Typography>
                            )}
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
