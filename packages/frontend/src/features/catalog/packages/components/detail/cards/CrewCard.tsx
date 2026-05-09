'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Button, IconButton, Menu, MenuItem,
    Checkbox,
    Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveIcon from '@mui/icons-material/Remove';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { formatCurrency } from '@/shared/utils/formatUtils';
import { roundMoney } from '@/shared/utils/pricing';
import { crewSlotsApi } from '@/features/workflow/scheduling/shared';
import { useOptionalScheduleApi } from '@/features/workflow/scheduling/shared';
import type { EventDay } from '@/features/workflow/scheduling/package-template';
import type { JobRole } from '@/features/catalog/task-library/types';
import type { TaskAutoGenerationPreview } from '@/features/catalog/task-library/types';

import type {
    CrewOption,
    PackageCrewSlotRecord,
    PackageActivityRecord,
} from '../../../types';
import { detailGlassCardSx } from '../detail-tokens';
import {
    getCrewHourlyRate,
    isCrewDayRate,
    getCrewDayRate,
    buildTaskHoursMap,
    buildOnsiteHoursMap,
    buildOnsiteRoleSet,
    buildOnsiteRoleHoursMap,
    resolveOnsiteCost,
} from '../../../utils/package-helpers';
import { useBrandFinanceSettings } from '@/features/finance/brand-finance-settings/hooks';

/** Map on-site hours to a billing band label. */
function getOnsiteBand(
    hours: number,
    halfDayMax: number,
    fullDayMax: number,
): 'Half Day' | 'Day' | 'Day + OT' {
    if (hours < halfDayMax) return 'Half Day';
    if (hours < fullDayMax) return 'Day';
    return 'Day + OT';
}

// ─── Props ──────────────────────────────────────────────────────────
export interface CrewCardProps {
    packageId: number | null;
    PackageCrewSlots: PackageCrewSlotRecord[];
    setPackageCrewSlots: React.Dispatch<React.SetStateAction<PackageCrewSlotRecord[]>>;
    packageEventDays: EventDay[];
    packageActivities: PackageActivityRecord[];
    scheduleActiveDayId: number | null;
    selectedActivityId: number | null;
    crew: CrewOption[];
    jobRoles: JobRole[];
    taskPreview: TaskAutoGenerationPreview | null;
    currency: string;
    selectedCrewSlotId?: number | null;
    onSelectCrewSlot?: (id: number | null) => void;
    cardSx?: import('@mui/material').SxProps;
}

// ─── Component ──────────────────────────────────────────────────────
export function CrewCard({
    packageId,
    PackageCrewSlots,
    setPackageCrewSlots,
    packageEventDays,
    packageActivities,
    scheduleActiveDayId,
    selectedActivityId,
    crew,
    jobRoles,
    taskPreview,
    currency,
    selectedCrewSlotId,
    onSelectCrewSlot,
}: CrewCardProps) {
    // ── ScheduleApi adapter (context if available, else direct package API) ──
    const contextApi = useOptionalScheduleApi();
    const crewSlotApi = contextApi?.crewSlots ?? {
        add: (dayId: number, data: any) => crewSlotsApi.packageDay.add(packageId!, { package_event_day_id: dayId, ...data }),
        remove: (id: number) => crewSlotsApi.packageDay.remove(id),
        assign: (id: number, crewId: number | null) => crewSlotsApi.packageDay.assign(id, crewId),
        assignActivity: (id: number, activityId: number) => crewSlotsApi.packageDay.assignActivity(id, activityId),
        unassignActivity: (id: number, activityId: number) => crewSlotsApi.packageDay.unassignActivity(id, activityId),
    };
    const hasOwner = !!contextApi || !!packageId;

    // ── Internalized UI state (menus, pickers, dialogs) ──
    const [crewAssignAnchor, setCrewAssignAnchor] = useState<null | HTMLElement>(null);
    const [crewAssignSlotId, setCrewAssignSlotId] = useState<number | null>(null);
    const [rowCtxMenu, setRowCtxMenu] = useState<{ top: number; left: number; slotId: number } | null>(null);

    // ── Derived values ──
    const dayFilteredOps = scheduleActiveDayId
        ? PackageCrewSlots.filter(o => o.event_day_template_id === scheduleActiveDayId)
        : packageEventDays[0]
            ? PackageCrewSlots.filter(o => o.event_day_template_id === packageEventDays[0].id)
            : PackageCrewSlots;

    const crewDayOps = dayFilteredOps.filter(o => !!(o.crew_id || o.job_role_id));
    const crewActiveDay = packageEventDays.find(d => d.id === (scheduleActiveDayId || packageEventDays[0]?.id));
    const selectedActivity = selectedActivityId ? packageActivities.find(a => a.id === selectedActivityId) : null;

    // ── Multi-activity helpers ──
    const isCrewExplicitlyAssigned = (op: PackageCrewSlotRecord): boolean => {
        if (!selectedActivityId) return false;
        if (op.activity_assignments && op.activity_assignments.length > 0) {
            return op.activity_assignments.some(a => a.package_activity_id === selectedActivityId);
        }
        if (op.package_activity_id) return op.package_activity_id === selectedActivityId;
        return false;
    };

    const isCrewAssigned = (op: PackageCrewSlotRecord) => {
        if (!selectedActivityId) return true;
        if (isCrewExplicitlyAssigned(op)) return true;
        if (!op.activity_assignments || op.activity_assignments.length === 0) {
            if (!op.package_activity_id) return true;
        }
        return false;
    };

    const toggleCrewActivity = async (op: PackageCrewSlotRecord) => {
        if (!selectedActivityId) return;
        try {
            const explicitlyAssigned = isCrewExplicitlyAssigned(op);
            const updatedOp = explicitlyAssigned
                ? await crewSlotApi.unassignActivity(op.id, selectedActivityId)
                : await crewSlotApi.assignActivity(op.id, selectedActivityId);
            setPackageCrewSlots(prev => prev.map(o => o.id === op.id ? { ...o, ...updatedOp } : o));
        } catch (err) {
            console.warn('Failed to toggle crew activity:', err);
        }
    };

    // All roles can be toggled per-activity
    const isActivatableRole = (_op: PackageCrewSlotRecord): boolean => true;

    // ── Task hours map ──
    const taskHoursMap = buildTaskHoursMap(taskPreview);
    const onsiteHoursMap = buildOnsiteHoursMap(taskPreview);
    const onsiteRoleSet = buildOnsiteRoleSet(taskPreview);
    const onsiteRoleHoursMap = buildOnsiteRoleHoursMap(taskPreview);

    // ── Finance settings (for on-site billing thresholds) ──
    const { data: financeSettings } = useBrandFinanceSettings();
    const onsiteHalfDayMax = financeSettings?.onsite_half_day_max_hours ?? 6;
    const onsiteFullDayMax = financeSettings?.onsite_full_day_max_hours ?? 12;

    // ── Grouped crew ──
    const grouped = new Map<string, { name: string; color: string; ops: typeof crewDayOps }>();
    for (const op of crewDayOps) {
        const key = op.crew_id ? `c-${op.crew_id}` : `unassigned-${op.id}`;
        const name = op.crew
            ? `${op.crew.contact?.first_name || ''} ${op.crew.contact?.last_name || ''}`.trim() || 'Assigned'
            : op.label || 'Unassigned';
        const color = op.crew?.crew_color || '#EC4899';
        if (!grouped.has(key)) {
            grouped.set(key, { name, color, ops: [] });
        }
        grouped.get(key)!.ops.push(op);
    }
    const groups = Array.from(grouped.entries());

    // ── Flatten ops for table rows ──
    const flatRows: Array<{
        op: typeof crewDayOps[0];
        crewName: string;
        crewColor: string;
        displayLabel: string;
        isOnsite: boolean;
        taskHours: number;
        offSiteTaskHours: number;
        onsiteBand: string | null;
        cost: number;
        isSecondaryOnsite: boolean;
        assigned: boolean;
        dayRate: boolean;
    }> = [];

    for (const [, group] of groups) {
        const opData = group.ops.map((op) => {
            const assigned = isCrewAssigned(op);
            const activatable = isActivatableRole(op);
            const dayRate = isCrewDayRate(op);
            const roleName = op.job_role ? (op.job_role.display_name || op.job_role.name) : null;
            const taskKey = roleName ? `${group.name}|${roleName}` : null;
            const totalTaskHours = taskKey ? (taskHoursMap.get(taskKey) || 0) : 0;
            const isOnsiteRole = taskKey ? onsiteRoleSet.has(taskKey) : false;
            const onsiteHours = isOnsiteRole ? (onsiteHoursMap.get(group.name) || 0) : 0;
            const onsiteBand = onsiteHours > 0 ? getOnsiteBand(onsiteHours, onsiteHalfDayMax, onsiteFullDayMax) : null;
            const rate = dayRate ? getCrewDayRate(op) : getCrewHourlyRate(op);
            const roleOnsiteHours = taskKey ? (onsiteRoleHoursMap.get(taskKey) || 0) : 0;
            const offSiteTaskHours = isOnsiteRole ? Math.max(0, totalTaskHours - roleOnsiteHours) : 0;
            const taskHours = isOnsiteRole ? offSiteTaskHours : totalTaskHours;
            const hours = dayRate ? Number(op.hours || 1) : (totalTaskHours > 0 ? totalTaskHours : (taskPreview ? 0 : Number(op.hours || 0)));
            const onsiteCost = onsiteHours > 0 ? resolveOnsiteCost(op, onsiteHours, onsiteHalfDayMax, onsiteFullDayMax) : null;
            const cost = onsiteCost !== null ? roundMoney(onsiteCost + getCrewHourlyRate(op) * offSiteTaskHours) : roundMoney(rate * hours);
            const tierName = (() => {
                if (!op?.crew || !op?.job_role) return null;
                const match = op.crew.job_role_assignments?.find(cjr => cjr.job_role_id === op.job_role_id);
                return match?.payment_bracket?.name || null;
            })();
            const displayLabel = op.job_role
                ? (op.job_role.display_name || op.job_role.name)
                : (op.label || 'Crew');
            return { op, assigned, activatable, dayRate, taskHours, onsiteBand, cost, displayLabel, offSiteTaskHours };
        });

        const standardOps = opData.filter(d => !d.onsiteBand);
        const rawOnsiteOps = opData.filter(d => !!d.onsiteBand);

        for (const d of standardOps) {
            flatRows.push({ ...d, crewName: group.name, crewColor: group.color, isOnsite: false, isSecondaryOnsite: false });
        }

        // Process onsite ops: band cost in onsite section, offsite hours in offsite section
        rawOnsiteOps.forEach((d, i) => {
            const hourlyRate = getCrewHourlyRate(d.op);
            if (i === 0) {
                // Primary: band cost only in the onsite section
                const groupOnsiteHours = onsiteHoursMap.get(group.name) || 0;
                const bandCost = resolveOnsiteCost(d.op, groupOnsiteHours, onsiteHalfDayMax, onsiteFullDayMax) ?? 0;
                flatRows.push({
                    ...d,
                    cost: roundMoney(bandCost),
                    crewName: group.name, crewColor: group.color,
                    isOnsite: true, isSecondaryOnsite: false,
                });
            } else {
                // Secondary: show in onsite as "incl." (covered by band)
                flatRows.push({
                    ...d,
                    cost: 0,
                    crewName: group.name, crewColor: group.color,
                    isOnsite: true, isSecondaryOnsite: true,
                });
            }
            // If this role has offsite hours, add an offsite row
            if (d.offSiteTaskHours > 0) {
                const offSiteCost = roundMoney(hourlyRate * d.offSiteTaskHours);
                flatRows.push({
                    ...d,
                    cost: offSiteCost,
                    taskHours: d.offSiteTaskHours,
                    onsiteBand: null,
                    crewName: group.name, crewColor: group.color,
                    isOnsite: false, isSecondaryOnsite: false,
                });
            }
        });
    }

    // ── Total cost computation ──
    const totalCrewCost = (() => {
        const seenOnsiteCrew = new Set<string>();
        return crewDayOps.reduce((sum, op) => {
            if (isCrewDayRate(op)) return sum + getCrewDayRate(op) * Number(op.hours || 1);
            const crewName = op.crew ? `${op.crew.contact?.first_name || ''} ${op.crew.contact?.last_name || ''}`.trim() : '';
            const roleName = op.job_role ? (op.job_role.display_name || op.job_role.name) : null;
            const taskKey = crewName && roleName ? `${crewName}|${roleName}` : null;
            const isRoleOnsite = taskKey ? onsiteRoleSet.has(taskKey) : false;
            const opOnsiteHours = crewName ? (onsiteHoursMap.get(crewName) || 0) : 0;
            const rate = getCrewHourlyRate(op);
            if (isRoleOnsite && opOnsiteHours > 0) {
                let roleCost = 0;
                if (!seenOnsiteCrew.has(crewName)) {
                    seenOnsiteCrew.add(crewName);
                    const onsiteCost = resolveOnsiteCost(op, opOnsiteHours, onsiteHalfDayMax, onsiteFullDayMax);
                    if (onsiteCost !== null) roleCost += onsiteCost;
                }
                const totalRoleHours = taskKey ? (taskHoursMap.get(taskKey) || 0) : 0;
                const onsiteRoleHours = taskKey ? (onsiteRoleHoursMap.get(taskKey) || 0) : 0;
                const offSiteHours = Math.max(0, totalRoleHours - onsiteRoleHours);
                roleCost += rate * offSiteHours;
                return sum + roleCost;
            }
            const taskHours = taskKey ? (taskHoursMap.get(taskKey) || 0) : 0;
            const hours = taskHours > 0 ? taskHours : (taskPreview ? 0 : Number(op.hours || 0));
            return sum + rate * hours;
        }, 0);
    })();

    // ── Split into offsite / onsite ──
    const offsiteRows = flatRows.filter(r => !r.isOnsite);
    const onsiteRows = flatRows.filter(r => r.isOnsite);
    const offsiteSubtotal = roundMoney(offsiteRows.reduce((s, r) => s + r.cost, 0));
    const onsiteSubtotal = roundMoney(onsiteRows.reduce((s, r) => s + r.cost, 0));

    const hCellSx = { py: 1.25, px: 1.5, fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' } as const;
    const bCellSx = { py: 1.1, px: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.72rem' } as const;

    // ── Shared row renderer (used by both tables) ──
    const renderCrewRow = (row: typeof flatRows[0]) => {
        const { op, assigned, dayRate, taskHours, onsiteBand, cost, displayLabel, crewName, isOnsite, isSecondaryOnsite } = row;
        const isLocked = !!selectedActivityId && !isActivatableRole(op);
        const isDimUnassigned = !!selectedActivityId && !isLocked && !assigned;
        return (
            <TableRow
                key={op.id}
                onClick={() => onSelectCrewSlot?.(selectedCrewSlotId === op.id ? null : op.id)}
                onContextMenu={(e) => { e.preventDefault(); setRowCtxMenu({ top: e.clientY, left: e.clientX, slotId: op.id }); }}
                sx={{
                    opacity: isLocked ? 0.28 : (isDimUnassigned ? 0.3 : 1),
                    cursor: onSelectCrewSlot ? 'pointer' : undefined,
                    transition: 'all 0.2s ease',
                    ...(selectedCrewSlotId === op.id && { bgcolor: 'rgba(139,92,246,0.08)' }),
                    '&:hover': {
                        bgcolor: selectedCrewSlotId === op.id ? 'rgba(139,92,246,0.12)' : 'rgba(236, 72, 153, 0.04)',
                        opacity: isDimUnassigned ? 0.7 : 1,
                    },
                }}
            >
                {/* Assignment checkbox */}
                {selectedActivityId && (
                    <TableCell sx={{ ...bCellSx, p: 0, textAlign: 'center' }}>
                        {!isLocked && (
                            <Checkbox
                                checked={assigned}
                                onChange={() => toggleCrewActivity(op)}
                                onClick={(e) => e.stopPropagation()}
                                size="small"
                                sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 15 }, color: 'rgba(255,255,255,0.15)', '&.Mui-checked': { color: selectedActivity?.color || '#f59e0b' } }}
                            />
                        )}
                    </TableCell>
                )}
                {/* Role */}
                <TableCell
                    sx={{ ...bCellSx }}
                >
                    <Typography variant="body2" sx={{
                        fontWeight: 600, fontSize: '0.75rem', color: '#cbd5e1',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {displayLabel}
                    </Typography>
                </TableCell>
                {/* Crew name — dropdown to pick crew */}
                <TableCell
                    sx={bCellSx}
                >
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, minWidth: 0, maxWidth: '100%' }}>
                        <Typography variant="body2" sx={{
                            fontWeight: 500, fontSize: '0.75rem', color: '#94a3b8',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {crewName}
                        </Typography>
                        <KeyboardArrowDownIcon
                            onClick={(e) => {
                                e.stopPropagation();
                                setCrewAssignAnchor(e.currentTarget as unknown as HTMLElement);
                                setCrewAssignSlotId(op.id);
                            }}
                            sx={{ fontSize: 13, color: '#475569', flexShrink: 0, cursor: 'pointer', '&:hover': { color: '#94a3b8' } }}
                        />
                    </Box>
                </TableCell>
                {/* Hours */}
                <TableCell sx={{ ...bCellSx, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{
                        fontSize: '0.6rem', fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        color: '#94a3b8',
                    }}>
                        {isOnsite
                            ? '—'
                            : dayRate ? 'Day'
                            : taskHours > 0 ? `${Math.round(taskHours * 10) / 10}h`
                            : '—'}
                    </Typography>
                </TableCell>
                {/* Cost */}
                <TableCell sx={{ ...bCellSx, textAlign: 'right' }}>
                    {isOnsite ? (
                        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500, fontSize: '0.6rem' }}>
                            —
                        </Typography>
                    ) : (
                        <Typography variant="caption" sx={{
                            color: cost > 0 ? '#f59e0b' : '#475569',
                            fontWeight: 600, fontSize: '0.65rem',
                            fontVariantNumeric: 'tabular-nums',
                        }}>
                            {cost > 0 ? formatCurrency(cost, currency) : '—'}
                        </Typography>
                    )}
                </TableCell>
            </TableRow>
        );
    };

    return (
        <>
        <Box sx={detailGlassCardSx}>
            {/* ── Section header ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.01em' }}>
                    Roles
                </Typography>

            </Box>
            {crewDayOps.length > 0 ? (
                <>
                    {/* ── Single merged table (Offsite + Onsite) ── */}
                    <Table size="small" sx={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
                        <colgroup>
                            {selectedActivityId && <col style={{ width: '4%' }} />}
                            <col style={{ width: selectedActivityId ? '28%' : '30%' }} />
                            <col style={{ width: selectedActivityId ? '30%' : '33%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: selectedActivityId ? '24%' : '23%' }} />
                        </colgroup>
                        <TableHead>
                            {/* OFFSITE section label */}
                            <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                                <TableCell colSpan={selectedActivityId ? 5 : 4} sx={{ py: 0.7, px: 1.5, borderBottom: 'none', borderLeft: '2px solid rgba(148,163,184,0.5)' }}>
                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                                        Offsite
                                    </Typography>
                                </TableCell>
                            </TableRow>
                            {/* Column headers */}
                            <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                                {selectedActivityId && <TableCell sx={{ ...hCellSx, width: 28, p: 0 }} />}
                                <TableCell sx={{ ...hCellSx }}>Role</TableCell>
                                <TableCell sx={hCellSx}>Crew</TableCell>
                                <TableCell sx={{ ...hCellSx, textAlign: 'center' }}>Hours</TableCell>
                                <TableCell sx={{ ...hCellSx, textAlign: 'right' }}>Cost</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {/* Offsite rows */}
                            {offsiteRows.map(renderCrewRow)}
                            {offsiteRows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={selectedActivityId ? 6 : 5} sx={{ ...bCellSx, borderBottom: 'none', py: 1.5, textAlign: 'center' }}>
                                        <Typography sx={{ color: '#475569', fontSize: '0.6rem', fontStyle: 'italic' }}>No offsite roles</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                            {offsiteRows.length > 0 && (
                                <TableRow>
                                    <TableCell colSpan={selectedActivityId ? 4 : 3} sx={{ ...bCellSx, borderBottom: 'none', borderTop: '1px solid rgba(245, 158, 11, 0.15)' }}>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                            Subtotal
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ ...bCellSx, textAlign: 'right', borderBottom: 'none', borderTop: '1px solid rgba(245, 158, 11, 0.15)' }}>
                                        <Typography variant="caption" sx={{ color: offsiteSubtotal > 0 ? '#f59e0b' : '#475569', fontWeight: 600, fontSize: '0.65rem', fontVariantNumeric: 'tabular-nums' }}>
                                            {offsiteSubtotal > 0 ? formatCurrency(offsiteSubtotal, currency) : '—'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}

                            {/* ONSITE section separator row */}
                            <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                                <TableCell colSpan={selectedActivityId ? 5 : 4} sx={{ py: 0.7, px: 1.5, borderBottom: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', borderLeft: '2px solid rgba(148,163,184,0.5)' }}>
                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                                        Onsite
                                    </Typography>
                                </TableCell>
                            </TableRow>

                            {/* Onsite rows */}
                            {onsiteRows.map(renderCrewRow)}
                            {/* Event Day band cost row */}
                            {onsiteRows.length > 0 && (() => {
                                const primaryOnsite = onsiteRows.find(r => !r.isSecondaryOnsite && r.onsiteBand);
                                const bandLabel = primaryOnsite?.onsiteBand === 'Half Day' ? '½ Day' : (primaryOnsite?.onsiteBand || 'Day');
                                return (
                                    <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.015)' }}>
                                        <TableCell colSpan={selectedActivityId ? 3 : 2} sx={{ ...bCellSx, borderBottom: 'none', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 600 }}>
                                                Event Day
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ ...bCellSx, textAlign: 'center', borderBottom: 'none' }}>
                                            <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                {bandLabel}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ ...bCellSx, textAlign: 'right', borderBottom: 'none', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                            <Typography variant="caption" sx={{
                                                color: onsiteSubtotal > 0 ? '#f59e0b' : '#475569',
                                                fontWeight: 600, fontSize: '0.65rem', fontVariantNumeric: 'tabular-nums',
                                            }}>
                                                {onsiteSubtotal > 0 ? formatCurrency(onsiteSubtotal, currency) : '—'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                );
                            })()}
                            {onsiteRows.length > 0 && (
                                <TableRow>
                                    <TableCell colSpan={selectedActivityId ? 4 : 3} sx={{ ...bCellSx, borderBottom: 'none', borderTop: '1px solid rgba(245, 158, 11, 0.15)' }}>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                            Subtotal
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ ...bCellSx, textAlign: 'right', borderBottom: 'none', borderTop: '1px solid rgba(245, 158, 11, 0.15)' }}>
                                        <Typography variant="caption" sx={{ color: onsiteSubtotal > 0 ? '#f59e0b' : '#475569', fontWeight: 600, fontSize: '0.65rem', fontVariantNumeric: 'tabular-nums' }}>
                                            {onsiteSubtotal > 0 ? formatCurrency(onsiteSubtotal, currency) : '—'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                            {onsiteRows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={selectedActivityId ? 6 : 5} sx={{ ...bCellSx, borderBottom: 'none', py: 1.5, textAlign: 'center' }}>
                                        <Typography sx={{ color: '#475569', fontSize: '0.6rem', fontStyle: 'italic' }}>No onsite roles</Typography>
                                    </TableCell>
                                </TableRow>
                            )}

                            {/* ── Grand Total spacer ── */}
                            <TableRow>
                                <TableCell colSpan={selectedActivityId ? 5 : 4} sx={{ py: 0.5, borderBottom: 'none', borderTop: '2px solid rgba(255,255,255,0.06)' }} />
                            </TableRow>
                            {/* ── Grand Total row ── */}
                            <TableRow sx={{ bgcolor: 'rgba(245, 158, 11, 0.04)' }}>
                                <TableCell colSpan={selectedActivityId ? 4 : 3} sx={{ py: 1.25, borderBottom: 'none', borderTop: '1px solid rgba(245, 158, 11, 0.25)' }}>
                                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Total
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 1.25, textAlign: 'right', borderBottom: 'none', borderTop: '1px solid rgba(245, 158, 11, 0.25)' }}>
                                    <Typography sx={{
                                        color: totalCrewCost > 0 ? '#f59e0b' : '#475569',
                                        fontWeight: 700, fontSize: '0.95rem',
                                        fontVariantNumeric: 'tabular-nums',
                                    }}>
                                        {totalCrewCost > 0 ? formatCurrency(totalCrewCost, currency) : '—'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </>
            ) : (
                /* Empty state */
                <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography sx={{ color: '#475569', fontSize: '0.7rem' }}>No roles assigned</Typography>

                </Box>
            )}
        </Box>

        {/* Crew Add Menu — Role-based crew slot creation */}
        {/* Row context menu — right-click actions */}
        <Menu
            open={Boolean(rowCtxMenu)}
            onClose={() => setRowCtxMenu(null)}
            anchorReference="anchorPosition"
            anchorPosition={rowCtxMenu ? { top: rowCtxMenu.top, left: rowCtxMenu.left } : undefined}
            PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' } }}
        >
            <MenuItem
                onClick={async () => {
                    if (!rowCtxMenu) return;
                    try {
                        await crewSlotApi.remove(rowCtxMenu.slotId);
                        setPackageCrewSlots(prev => prev.filter(o => o.id !== rowCtxMenu.slotId));
                    } catch (err) {
                        console.warn('Failed to remove crew slot:', err);
                    }
                    setRowCtxMenu(null);
                }}
                sx={{ fontSize: '0.72rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 1 }}
            >
                <DeleteIcon sx={{ fontSize: 14 }} /> Remove Role
            </MenuItem>
        </Menu>
        {/* Crew Assignment Menu — assign/reassign crew to a role slot */}
        <Menu
            anchorEl={crewAssignAnchor}
            open={Boolean(crewAssignAnchor)}
            onClose={() => { setCrewAssignAnchor(null); setCrewAssignSlotId(null); }}
            PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' } }}
        >
            {(() => {
                const slot = crewAssignSlotId ? PackageCrewSlots.find(o => o.id === crewAssignSlotId) : null;
                const slotRoleId = slot?.job_role_id;
                const matchingCrew = (slotRoleId
                    ? crew.filter(cm => (cm.job_role_assignments ?? []).some(r => r.job_role.id === slotRoleId))
                    : crew
                ).sort((a, b) => {
                    const aName = `${a.contact.first_name || ''} ${a.contact.last_name || ''}`.trim();
                    const bName = `${b.contact.first_name || ''} ${b.contact.last_name || ''}`.trim();
                    return aName.localeCompare(bName);
                });
                return (
                    <>
                        {matchingCrew.length === 0 && (
                            <MenuItem disabled sx={{ fontSize: '0.72rem', color: '#475569' }}>No crew available</MenuItem>
                        )}
                        {matchingCrew.map(cm => {
                            const cmName = `${cm.contact.first_name || ''} ${cm.contact.last_name || ''}`.trim() || 'Unnamed';
                            const primaryRole = (cm.job_role_assignments ?? []).find(r => r.is_primary)?.job_role || (cm.job_role_assignments ?? [])[0]?.job_role;
                            const roleLabel = primaryRole?.display_name || primaryRole?.name || '';
                            const isCurrentlyAssigned = slot?.crew_id === cm.id;
                            return (
                                <MenuItem
                                    key={cm.id}
                                    onClick={async () => {
                                        if (!crewAssignSlotId || isCurrentlyAssigned) return;
                                        try {
                                            const updated = await crewSlotApi.assign(crewAssignSlotId, cm.id);
                                            setPackageCrewSlots(prev =>
                                                prev.map(o => o.id === crewAssignSlotId ? { ...o, ...updated } : o)
                                            );
                                        } catch (err) {
                                            console.warn('Failed to assign crew:', err);
                                        }
                                        setCrewAssignAnchor(null);
                                        setCrewAssignSlotId(null);
                                    }}
                                    sx={{ fontSize: '0.72rem', color: isCurrentlyAssigned ? '#f59e0b' : '#cbd5e1', py: 0.75, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                                >
                                    {cmName}{isCurrentlyAssigned ? ' ✓' : ''}
                                </MenuItem>
                            );
                        })}
                        {/* Unassign */}
                        {slot?.crew_id && (
                            <MenuItem
                                onClick={async () => {
                                    if (!crewAssignSlotId) return;
                                    try {
                                        await crewSlotApi.assign(crewAssignSlotId, null);
                                        setPackageCrewSlots(prev =>
                                            prev.map(o => o.id === crewAssignSlotId ? { ...o, crew_id: null, crew: null } : o)
                                        );
                                    } catch (err) {
                                        console.warn('Failed to unassign crew:', err);
                                    }
                                    setCrewAssignAnchor(null);
                                    setCrewAssignSlotId(null);
                                }}
                                sx={{ fontSize: '0.72rem', color: '#ef4444', py: 0.75, borderTop: '1px solid rgba(255,255,255,0.06)', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }}
                            >
                                Unassign
                            </MenuItem>
                        )}
                    </>
                );
            })()}
        </Menu>
        </>
    );
}
