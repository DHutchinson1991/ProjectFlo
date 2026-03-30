'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Button, IconButton, Menu, MenuItem,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Checkbox, CircularProgress, SxProps, Theme,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveIcon from '@mui/icons-material/Remove';
import Link from 'next/link';

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
import { ScheduleCardShell } from './ScheduleCardShell';

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
    cardSx: SxProps<Theme>;
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
    cardSx,
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
    const [crewMenuAnchor, setCrewMenuAnchor] = useState<null | HTMLElement>(null);
    const [crewMenuDayId, setCrewMenuDayId] = useState<number | null>(null);
    const [crewAssignAnchor, setCrewAssignAnchor] = useState<null | HTMLElement>(null);
    const [crewAssignSlotId, setCrewAssignSlotId] = useState<number | null>(null);
    const [rolePickerOpen, setRolePickerOpen] = useState(false);
    const [rolePickerCrew, setRolePickerCrew] = useState<CrewOption | null>(null);
    const [rolePickerSelectedIds, setRolePickerSelectedIds] = useState<number[]>([]);
    const [rolePickerSaving, setRolePickerSaving] = useState(false);

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

    return (
        <>
        <ScheduleCardShell
            title="Crew"
            icon={<PersonIcon />}
            accentColor="#EC4899"
            showHeaderBorder={crewDayOps.length > 0}
            subtitle={selectedActivity ? (
                <Typography sx={{ fontSize: '0.55rem', color: '#a855f7', fontWeight: 600, mt: -0.25 }}>{selectedActivity.name}</Typography>
            ) : crewActiveDay && packageEventDays.length > 1 ? (
                <Typography sx={{ fontSize: '0.55rem', color: '#f59e0b', fontWeight: 600, mt: -0.25 }}>{crewActiveDay.name}</Typography>
            ) : undefined}
            headerRight={crewDayOps.length > 0
                ? <Chip label={`${crewDayOps.length}`} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(236, 72, 153, 0.1)', color: '#EC4899', border: '1px solid rgba(236, 72, 153, 0.2)', '& .MuiChip-label': { px: 0.6 } }} />
                : undefined
            }
            cardSx={cardSx}
        >

            {/* Crew listing — grouped by crew */}
            <Box sx={{ px: 2.5, pt: 1.5, pb: 1.5 }}>
                {groups.map(([key, group], gi) => {
                    // On-site band is charged once per person. Off-site hourly work
                    // is always added, even for roles that also have on-site tasks.
                    const personOnsiteHours = onsiteHoursMap.get(group.name) || 0;
                    let onsiteCostCharged = false;
                    const memberTotal = group.ops.reduce((sum, op) => {
                        if (isCrewDayRate(op)) {
                            return sum + getCrewDayRate(op) * Number(op.hours || 1);
                        }
                        const roleName = op.job_role ? (op.job_role.display_name || op.job_role.name) : null;
                        const taskKey = roleName ? `${group.name}|${roleName}` : null;
                        const isRoleOnsite = taskKey ? onsiteRoleSet.has(taskKey) : false;
                        const rate = getCrewHourlyRate(op);
                        if (isRoleOnsite && personOnsiteHours > 0) {
                            let roleCost = 0;
                            // Band cost: charged once across all on-site roles for this person
                            if (!onsiteCostCharged) {
                                const onsiteCost = resolveOnsiteCost(op, personOnsiteHours, onsiteHalfDayMax, onsiteFullDayMax);
                                if (onsiteCost !== null) {
                                    onsiteCostCharged = true;
                                    roleCost += onsiteCost;
                                }
                            }
                            // Off-site hourly work for this role (total task hours minus on-site hours)
                            const totalRoleHours = taskKey ? (taskHoursMap.get(taskKey) || 0) : 0;
                            const onsiteRoleHours = taskKey ? (onsiteRoleHoursMap.get(taskKey) || 0) : 0;
                            const offSiteHours = Math.max(0, totalRoleHours - onsiteRoleHours);
                            roleCost += rate * offSiteHours;
                            return sum + roleCost;
                        }
                        // Purely off-site: standard hourly billing
                        const taskHours = taskKey ? (taskHoursMap.get(taskKey) || 0) : 0;
                        // Only fall back to crew-slot hours when there's no task preview
                        const hours = taskHours > 0 ? taskHours : (taskPreview ? 0 : Number(op.hours || 0));
                        return sum + rate * hours;
                    }, 0);

                    return (
                        <Box key={key} sx={{ mb: gi < groups.length - 1 ? 1.5 : 0 }}>
                            {/* Crew header + subtotal */}
                            <Box
                                onClick={() => {
                                    const firstOp = group.ops[0];
                                    if (firstOp?.crew) {
                                        const dayId = scheduleActiveDayId || packageEventDays[0]?.id;
                                        const existingRoleIds = dayId
                                            ? PackageCrewSlots
                                                .filter(o => o.event_day_template_id === dayId && o.crew_id === firstOp.crew_id && o.job_role_id)
                                                .map(o => o.job_role_id!)
                                            : [];
                                        setRolePickerCrew(firstOp.crew as CrewOption);
                                        setRolePickerSelectedIds(existingRoleIds);
                                        setRolePickerOpen(true);
                                    }
                                }}
                                sx={{ display: 'grid', gridTemplateColumns: '14px 1fr auto auto 19px', gap: 0.75, alignItems: 'center', mb: 0.5, cursor: 'pointer', px: 1, mx: -1, borderRadius: 1.5, py: 0.25, transition: 'all 0.15s ease', '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.08)' } }}
                            >
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: group.color, justifySelf: 'center' }} />
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#38bdf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {group.name}
                                </Typography>
                                <Box />
                                <Typography variant="caption" sx={{
                                    color: memberTotal > 0 ? '#f59e0b' : '#475569',
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    fontVariantNumeric: 'tabular-nums',
                                    textAlign: 'right',
                                    minWidth: 56,
                                    justifySelf: 'end',
                                }}>
                                    {memberTotal > 0 ? formatCurrency(memberTotal, currency) : '—'}
                                </Typography>
                                <Box sx={{ width: 19, flexShrink: 0 }} />
                            </Box>

                            {/* Roles for this crew entry — split into standard and on-site sections */}
                            {(() => {
                                // Pre-compute per-op data so we can split into sections
                                const opData = group.ops.map((op) => {
                                    const assigned = isCrewAssigned(op);
                                    const activatable = isActivatableRole(op);
                                    const dayRate = isCrewDayRate(op);
                                    const roleName = op.job_role ? (op.job_role.display_name || op.job_role.name) : null;
                                    const taskKey = roleName ? `${group.name}|${roleName}` : null;
                                    const totalTaskHours = taskKey ? (taskHoursMap.get(taskKey) || 0) : 0;
                                    // Only classify this op as on-site if its specific role has on-site tasks.
                                    const isOnsiteRole = taskKey ? onsiteRoleSet.has(taskKey) : false;
                                    const onsiteHours = isOnsiteRole ? (onsiteHoursMap.get(group.name) || 0) : 0;
                                    const onsiteBand = onsiteHours > 0
                                        ? getOnsiteBand(onsiteHours, onsiteHalfDayMax, onsiteFullDayMax)
                                        : null;
                                    const rate = dayRate ? getCrewDayRate(op) : getCrewHourlyRate(op);
                                    // For on-site roles, separate off-site task hours from on-site hours
                                    const roleOnsiteHours = taskKey ? (onsiteRoleHoursMap.get(taskKey) || 0) : 0;
                                    const offSiteTaskHours = isOnsiteRole ? Math.max(0, totalTaskHours - roleOnsiteHours) : 0;
                                    // taskHours shown in the badge: off-site hours only for on-site roles
                                    const taskHours = isOnsiteRole ? offSiteTaskHours : totalTaskHours;
                                    // Only fall back to crew-slot hours when there's no task preview
                                    const hours = dayRate ? Number(op.hours || 1) : (totalTaskHours > 0 ? totalTaskHours : (taskPreview ? 0 : Number(op.hours || 0)));
                                    const onsiteCost = onsiteHours > 0
                                        ? resolveOnsiteCost(op, onsiteHours, onsiteHalfDayMax, onsiteFullDayMax)
                                        : null;
                                    // For on-site roles: band cost + off-site hourly work
                                    const cost = onsiteCost !== null
                                        ? roundMoney((onsiteCost) + getCrewHourlyRate(op) * offSiteTaskHours)
                                        : roundMoney(rate * hours);
                                    const tierName = (() => {
                                        if (!op?.crew || !op?.job_role) return null;
                                        const match = op.crew.job_role_assignments?.find(cjr => cjr.job_role_id === op.job_role_id);
                                        return match?.payment_bracket?.name || null;
                                    })();
                                    const displayLabel = op.job_role
                                        ? `${op.job_role.display_name || op.job_role.name}${tierName ? ` - ${tierName}` : ''}`
                                        : (op.label || 'Crew');
                                    return { op, assigned, activatable, dayRate, taskHours, onsiteHours, onsiteBand, cost, onsiteCost, displayLabel };
                                });

                                const standardOps = opData.filter(d => !d.onsiteBand);
                                // First on-site op carries the band cost + its off-site hourly.
                                // Secondary on-site ops only carry their own off-site hourly (band is "incl.").
                                const rawOnsiteOps = opData.filter(d => !!d.onsiteBand);
                                const onsiteOps = rawOnsiteOps.map((d, i) => {
                                    if (i === 0) return { ...d, isSecondaryOnsite: false };
                                    // Secondary: off-site hourly only (band already charged on primary)
                                    const offSiteCost = roundMoney(getCrewHourlyRate(d.op) * d.taskHours);
                                    return { ...d, cost: offSiteCost, onsiteCost: null, isSecondaryOnsite: true };
                                });

                                const renderOpRow = (d: typeof opData[0] & { isSecondaryOnsite?: boolean }, isOnsite: boolean) => {
                                    const { op, assigned, activatable, dayRate, taskHours, onsiteHours: _oh, onsiteBand, cost, displayLabel, isSecondaryOnsite = false } = d;
                                    const isLocked = !!selectedActivityId && !activatable;
                                    const isActiveAssigned = !!selectedActivityId && activatable && assigned;
                                    const isDimUnassigned = !!selectedActivityId && activatable && !assigned;
                                    return (
                                        <Box
                                            key={op.id}
                                            onClick={() => {
                                                if (!selectedActivityId || isLocked) return;
                                                toggleCrewActivity(op);
                                            }}
                                            sx={{
                                                display: 'grid',
                                                gridTemplateColumns: '14px 1fr auto auto 19px',
                                                gap: 0.75,
                                                alignItems: 'center',
                                                py: 0.4, pl: 2.5, pr: 1, mx: -1, borderRadius: 1.5,
                                                transition: 'all 0.2s ease',
                                                opacity: isLocked ? 0.28 : (isDimUnassigned ? 0.3 : 1),
                                                cursor: isLocked ? 'default' : (selectedActivityId ? 'pointer' : 'default'),
                                                ...(isLocked ? {} : {
                                                    '&:hover': {
                                                        bgcolor: selectedActivityId ? 'rgba(236, 72, 153, 0.06)' : 'rgba(236, 72, 153, 0.04)',
                                                        opacity: isDimUnassigned ? 0.7 : 1,
                                                        '& .op-del': { opacity: !selectedActivityId ? 1 : (assigned ? 1 : 0) },
                                                    },
                                                }),
                                            }}
                                        >
                                            {/* Col 1: dot */}
                                            <Box sx={{ width: 4, height: 4, borderRadius: '50%', flexShrink: 0, bgcolor: op.crew?.crew_color || group.color, opacity: isActiveAssigned ? 1 : 0.5, justifySelf: 'center' }} />

                                            {/* Col 2: role label + on-site / off-site chip */}
                                            <Box
                                                sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0, cursor: !selectedActivityId ? 'pointer' : undefined }}
                                                onClick={(e) => {
                                                    if (selectedActivityId) return;
                                                    e.stopPropagation();
                                                    setCrewAssignAnchor(e.currentTarget as HTMLElement);
                                                    setCrewAssignSlotId(op.id);
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem', color: isActiveAssigned ? '#f1f5f9' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {displayLabel}
                                                </Typography>
                                                {isOnsite ? (
                                                    <Chip label="On Site" size="small" sx={{
                                                        height: 18, fontSize: '0.5rem', fontWeight: 700,
                                                        bgcolor: 'rgba(249, 115, 22, 0.1)', color: '#f97316',
                                                        border: '1px solid rgba(249, 115, 22, 0.25)',
                                                        '& .MuiChip-label': { px: 0.6 },
                                                        flexShrink: 0,
                                                    }} />
                                                ) : (
                                                    <Chip label="Off Site" size="small" sx={{
                                                        height: 18, fontSize: '0.5rem', fontWeight: 700,
                                                        bgcolor: 'rgba(100, 116, 139, 0.1)', color: '#64748b',
                                                        border: '1px solid rgba(100, 116, 139, 0.2)',
                                                        '& .MuiChip-label': { px: 0.6 },
                                                        flexShrink: 0,
                                                    }} />
                                                )}
                                            </Box>

                                            {/* Col 3: hours badge / band badge */}
                                            <Box sx={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {isOnsite && !isSecondaryOnsite && onsiteBand ? (
                                                    <>
                                                        {taskHours > 0 && (
                                                            <Typography variant="caption" sx={{
                                                                color: '#22d3ee', fontWeight: 700, fontSize: '0.6rem',
                                                                fontVariantNumeric: 'tabular-nums',
                                                                bgcolor: 'rgba(34, 211, 238, 0.1)', border: '1px solid rgba(34, 211, 238, 0.2)',
                                                                borderRadius: 1, px: 0.6, py: 0.15, lineHeight: 1.4,
                                                            }}>
                                                                {Math.round(taskHours * 10) / 10}h
                                                            </Typography>
                                                        )}
                                                        <Typography variant="caption" sx={{
                                                            color: onsiteBand === 'Day + OT' ? '#ef4444' : onsiteBand === 'Day' ? '#f59e0b' : '#f97316',
                                                            fontWeight: 700, fontSize: '0.6rem',
                                                            fontVariantNumeric: 'tabular-nums',
                                                            bgcolor: onsiteBand === 'Day + OT' ? 'rgba(239,68,68,0.1)' : onsiteBand === 'Day' ? 'rgba(245,158,11,0.1)' : 'rgba(249,115,22,0.1)',
                                                            border: `1px solid ${onsiteBand === 'Day + OT' ? 'rgba(239,68,68,0.3)' : onsiteBand === 'Day' ? 'rgba(245,158,11,0.3)' : 'rgba(249,115,22,0.3)'}`,
                                                            borderRadius: 1, px: 0.6, py: 0.15, lineHeight: 1.4,
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            {onsiteBand === 'Half Day' ? '½ Day' : onsiteBand}
                                                        </Typography>
                                                    </>
                                                ) : !isOnsite && !dayRate && taskHours > 0 ? (
                                                    <Typography variant="caption" sx={{
                                                        color: '#22d3ee', fontWeight: 700, fontSize: '0.6rem',
                                                        fontVariantNumeric: 'tabular-nums',
                                                        bgcolor: 'rgba(34, 211, 238, 0.1)', border: '1px solid rgba(34, 211, 238, 0.2)',
                                                        borderRadius: 1, px: 0.6, py: 0.15, lineHeight: 1.4,
                                                    }}>
                                                        {Math.round(taskHours * 10) / 10}h
                                                    </Typography>
                                                ) : !isOnsite && dayRate ? (
                                                    <Typography variant="caption" sx={{
                                                        color: '#f59e0b', fontWeight: 600, fontSize: '0.6rem',
                                                        fontVariantNumeric: 'tabular-nums',
                                                        bgcolor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)',
                                                        borderRadius: 1, px: 0.6, py: 0.15, lineHeight: 1.4,
                                                    }}>
                                                        Day
                                                    </Typography>
                                                ) : null}
                                            </Box>

                                            {/* Col 4: cost */}
                                            <Box sx={{ justifySelf: 'end', minWidth: 56 }}>
                                                {isSecondaryOnsite && cost === 0 ? (
                                                    <Typography variant="caption" sx={{ color: 'rgba(148, 163, 184, 0.4)', fontWeight: 500, fontSize: '0.55rem', textAlign: 'right', fontStyle: 'italic', display: 'block' }}>
                                                        incl.
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="caption" sx={{
                                                        color: cost > 0 ? '#f59e0b' : '#475569',
                                                        fontWeight: 600, fontSize: '0.65rem',
                                                        fontVariantNumeric: 'tabular-nums', textAlign: 'right',
                                                        display: 'block',
                                                    }}>
                                                        {cost > 0 ? formatCurrency(cost, currency) : '—'}
                                                    </Typography>
                                                )}
                                            </Box>

                                            {/* Col 5: delete button */}
                                            <Box className="op-del" sx={{ opacity: 0, transition: 'opacity 0.15s', justifySelf: 'center' }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            await crewSlotApi.remove(op.id);
                                                            setPackageCrewSlots(prev => prev.filter(o => o.id !== op.id));
                                                        } catch (err) {
                                                            console.warn('Failed to remove crew slot:', err);
                                                        }
                                                    }}
                                                    sx={{ p: 0.25, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}
                                                >
                                                    <DeleteIcon sx={{ fontSize: 11 }} />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    );
                                };

                                return (
                                    <>
                                        {standardOps.map(d => renderOpRow(d, false))}
                                        {onsiteOps.map(d => renderOpRow(d, true))}
                                    </>
                                );
                            })()}
                        </Box>
                    );
                })}

                {/* Crew Total */}
                {crewDayOps.length > 0 && (() => {
                    const seenOnsiteCrew = new Set<string>();
                    const totalCrewCost = crewDayOps.reduce((sum, op) => {
                        if (isCrewDayRate(op)) {
                            return sum + getCrewDayRate(op) * Number(op.hours || 1);
                        }
                        const crewName = op.crew
                            ? `${op.crew.contact?.first_name || ''} ${op.crew.contact?.last_name || ''}`.trim()
                            : '';
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
                            // Off-site hourly work for this on-site role
                            const totalRoleHours = taskKey ? (taskHoursMap.get(taskKey) || 0) : 0;
                            const onsiteRoleHours = taskKey ? (onsiteRoleHoursMap.get(taskKey) || 0) : 0;
                            const offSiteHours = Math.max(0, totalRoleHours - onsiteRoleHours);
                            roleCost += rate * offSiteHours;
                            return sum + roleCost;
                        }
                        // Purely off-site: standard hourly billing
                        const taskHours = taskKey ? (taskHoursMap.get(taskKey) || 0) : 0;
                        // Only fall back to crew-slot hours when there's no task preview
                        const hours = taskHours > 0 ? taskHours : (taskPreview ? 0 : Number(op.hours || 0));
                        return sum + rate * hours;
                    }, 0);
                    return (
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: '14px 1fr auto auto 19px',
                            gap: 0.75,
                            alignItems: 'center',
                            mt: 1.5, pt: 1, mx: -1, px: 1,
                            borderTop: '1px solid rgba(245, 158, 11, 0.15)',
                        }}>
                            <Box />
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                Total
                            </Typography>
                            <Box />
                            <Typography variant="caption" sx={{
                                color: totalCrewCost > 0 ? '#f59e0b' : '#475569',
                                fontWeight: 700, fontSize: '0.75rem',
                                fontVariantNumeric: 'tabular-nums', textAlign: 'right',
                                minWidth: 56, justifySelf: 'end',
                            }}>
                                {totalCrewCost > 0 ? formatCurrency(totalCrewCost, currency) : '—'}
                            </Typography>
                            <Box />
                        </Box>
                    );
                })()}

                {/* Add Crew + Manage buttons */}
                <Box sx={{ mt: crewDayOps.length > 0 ? 1 : 0.5, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    {hasOwner && packageEventDays.length > 0 && (
                        <Button
                            size="small"
                            startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                            onClick={(e) => {
                                setCrewMenuAnchor(e.currentTarget);
                                setCrewMenuDayId(scheduleActiveDayId || packageEventDays[0]?.id || null);
                            }}
                            sx={{ fontSize: '0.6rem', color: '#EC4899', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(236, 72, 153, 0.06)' } }}
                        >
                            Add Crew
                        </Button>
                    )}
                    <Button
                        size="small"
                        href="/equipment"
                        component={Link}
                        sx={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', color: '#94a3b8' } }}
                    >
                        Manage
                    </Button>
                </Box>
            </Box>
        </ScheduleCardShell>

        {/* Crew Add Menu — Role-based crew slot creation */}
        <Menu
            anchorEl={crewMenuAnchor}
            open={Boolean(crewMenuAnchor)}
            onClose={() => { setCrewMenuAnchor(null); setCrewMenuDayId(null); }}
            PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 220, maxHeight: 420 } }}
        >
            {/* Section: Add by Job Role (unassigned slot) */}
            <MenuItem disabled sx={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, py: 0.4, opacity: '1 !important' }}>
                Add Role Slot
            </MenuItem>
            {jobRoles.length === 0 ? (
                <MenuItem disabled sx={{ fontSize: '0.7rem', color: '#475569' }}>No roles defined</MenuItem>
            ) : (
                jobRoles.map(role => (
                    <MenuItem
                        key={`role-${role.id}`}
                        onClick={async () => {
                            setCrewMenuAnchor(null);
                            if (!hasOwner || !crewMenuDayId) return;
                            try {
                                const roleName = role.display_name || role.name;
                                const existingCount = PackageCrewSlots.filter(o =>
                                    o.event_day_template_id === crewMenuDayId &&
                                    o.job_role_id === role.id
                                ).length;
                                const label = existingCount > 0 ? `${roleName} ${existingCount + 1}` : null;

                                const newOp = await crewSlotApi.add(crewMenuDayId, {
                                    label,
                                    crew_id: null,
                                    job_role_id: role.id,
                                });
                                if (selectedActivityId && newOp?.id) {
                                    const assignedOp = await crewSlotApi.assignActivity(newOp.id, selectedActivityId);
                                    setPackageCrewSlots(prev => [...prev, { ...newOp, ...assignedOp }]);
                                } else {
                                    setPackageCrewSlots(prev => [...prev, newOp]);
                                }
                            } catch (err) {
                                console.warn('Failed to add role slot:', err);
                            }
                            setCrewMenuDayId(null);
                        }}
                        sx={{ fontSize: '0.7rem', color: '#e2e8f0', '&:hover': { bgcolor: 'rgba(236, 72, 153, 0.1)' } }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EC4899', flexShrink: 0, opacity: 0.5 }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{role.display_name || role.name}</Typography>
                                {role.category && <Typography sx={{ fontSize: '0.5rem', color: '#64748b' }}>{role.category}</Typography>}
                            </Box>
                        </Box>
                    </MenuItem>
                ))
            )}

            {/* Divider */}
            {crew.length > 0 && (
                <Box sx={{ my: 0.5, borderTop: '1px solid rgba(255,255,255,0.08)' }} />
            )}

            {/* Section: Add specific crew — opens role picker */}
            {crew.length > 0 && (
                <>
                    <MenuItem disabled sx={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, py: 0.4, opacity: '1 !important' }}>
                        Add Specific Person
                    </MenuItem>
                    {crew.map(cm => {
                        const cmName = `${cm.contact.first_name || ''} ${cm.contact.last_name || ''}`.trim() || 'Unnamed';
                        const primaryRole = (cm.job_role_assignments ?? []).find(r => r.is_primary)?.job_role ||
                            (cm.job_role_assignments ?? [])[0]?.job_role;
                        const slotsOnDay = crewMenuDayId
                            ? PackageCrewSlots.filter(o =>
                                o.event_day_template_id === crewMenuDayId && o.crew_id === cm.id
                            ).length
                            : 0;
                        return (
                            <MenuItem
                                key={`crew-${cm.id}`}
                                onClick={() => {
                                    setCrewMenuAnchor(null);
                                    const existingRoleIds = crewMenuDayId
                                        ? PackageCrewSlots
                                            .filter(o => o.event_day_template_id === crewMenuDayId && o.crew_id === cm.id && o.job_role_id)
                                            .map(o => o.job_role_id!)
                                        : [];
                                    setRolePickerCrew(cm);
                                    setRolePickerSelectedIds(existingRoleIds);
                                    setRolePickerOpen(true);
                                }}
                                sx={{ fontSize: '0.7rem', color: '#e2e8f0', '&:hover': { bgcolor: 'rgba(236, 72, 153, 0.1)' } }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cm.crew_color || '#EC4899', flexShrink: 0 }} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{cmName}</Typography>
                                        {primaryRole && <Typography sx={{ fontSize: '0.55rem', color: '#64748b' }}>{primaryRole.display_name || primaryRole.name}</Typography>}
                                    </Box>
                                    {slotsOnDay > 0 && (
                                        <Chip label={slotsOnDay} size="small" sx={{ height: 16, fontSize: '0.5rem', fontWeight: 700, bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.2)', '& .MuiChip-label': { px: 0.5 } }} />
                                    )}
                                </Box>
                            </MenuItem>
                        );
                    })}
                </>
            )}
        </Menu>

        {/* Crew Assignment Menu — assign/reassign crew to a role slot */}
        <Menu
            anchorEl={crewAssignAnchor}
            open={Boolean(crewAssignAnchor)}
            onClose={() => { setCrewAssignAnchor(null); setCrewAssignSlotId(null); }}
            PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 200, maxHeight: 350 } }}
        >
            {/* Unassign option */}
            {crewAssignSlotId && PackageCrewSlots.find(o => o.id === crewAssignSlotId)?.crew_id && (
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
                    sx={{ fontSize: '0.7rem', color: '#f59e0b', '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.1)' } }}
                >
                    <RemoveIcon sx={{ fontSize: 14, mr: 1 }} /> Unassign
                </MenuItem>
            )}
            {crewAssignSlotId && PackageCrewSlots.find(o => o.id === crewAssignSlotId)?.crew_id && (
                <Box sx={{ my: 0.5, borderTop: '1px solid rgba(255,255,255,0.08)' }} />
            )}
            {/* Crew list */}
            {(() => {
                const slot = crewAssignSlotId ? PackageCrewSlots.find(o => o.id === crewAssignSlotId) : null;
                const slotRoleId = slot?.job_role_id;

                const matchingCrew = slotRoleId
                    ? crew.filter(cm => (cm.job_role_assignments ?? []).some(r => r.job_role.id === slotRoleId))
                    : crew;
                const otherCrew = slotRoleId
                    ? crew.filter(cm => !(cm.job_role_assignments ?? []).some(r => r.job_role.id === slotRoleId))
                    : [];

                const renderCrewItem = (cm: CrewOption) => {
                    const cmName = `${cm.contact.first_name || ''} ${cm.contact.last_name || ''}`.trim() || 'Unnamed';
                    const primaryRole = (cm.job_role_assignments ?? []).find(r => r.is_primary)?.job_role || (cm.job_role_assignments ?? [])[0]?.job_role;
                    const isCurrentlyAssigned = slot?.crew_id === cm.id;
                    return (
                        <MenuItem
                            key={cm.id}
                            disabled={isCurrentlyAssigned}
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
                            sx={{
                                fontSize: '0.7rem',
                                color: isCurrentlyAssigned ? '#38bdf8' : '#e2e8f0',
                                '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.1)' },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cm.crew_color || '#EC4899', flexShrink: 0 }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{cmName}</Typography>
                                    {primaryRole && <Typography sx={{ fontSize: '0.5rem', color: '#64748b' }}>{primaryRole.display_name || primaryRole.name}</Typography>}
                                </Box>
                                {isCurrentlyAssigned && <Typography sx={{ fontSize: '0.5rem', color: '#38bdf8' }}>✓</Typography>}
                            </Box>
                        </MenuItem>
                    );
                };

                return (
                    <>
                        {matchingCrew.length > 0 && slotRoleId && (
                            <MenuItem disabled sx={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, py: 0.4, opacity: '1 !important' }}>
                                Matching Role
                            </MenuItem>
                        )}
                        {matchingCrew.map(renderCrewItem)}
                        {otherCrew.length > 0 && (
                            <>
                                <Box sx={{ my: 0.5, borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                                <MenuItem disabled sx={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, py: 0.4, opacity: '1 !important' }}>
                                    Other Crew
                                </MenuItem>
                                {otherCrew.map(renderCrewItem)}
                            </>
                        )}
                        {matchingCrew.length === 0 && otherCrew.length === 0 && (
                            <MenuItem disabled sx={{ fontSize: '0.7rem', color: '#475569' }}>No crew available</MenuItem>
                        )}
                    </>
                );
            })()}
        </Menu>

        {/* Multi-Role Picker Dialog */}
        <Dialog
            open={rolePickerOpen}
            onClose={() => { setRolePickerOpen(false); setRolePickerCrew(null); setRolePickerSelectedIds([]); }}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3 } }}
        >
            {rolePickerCrew && (() => {
                const cmName = `${rolePickerCrew.contact.first_name || ''} ${rolePickerCrew.contact.last_name || ''}`.trim() || 'Unnamed';
                const dayId = crewMenuDayId || scheduleActiveDayId || packageEventDays[0]?.id;
                const existingSlotsForPerson = dayId
                    ? PackageCrewSlots.filter(o => o.event_day_template_id === dayId && o.crew_id === rolePickerCrew.id)
                    : [];
                const existingRoleIdsOnDay = existingSlotsForPerson.filter(o => o.job_role_id).map(o => o.job_role_id!);

                return (
                    <>
                        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: rolePickerCrew.crew_color || '#EC4899', flexShrink: 0 }} />
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9' }}>Assign Roles — {cmName}</Typography>
                                <Typography sx={{ fontSize: '0.65rem', color: '#64748b', mt: -0.2 }}>Select which roles this person should fill on this day</Typography>
                            </Box>
                        </DialogTitle>
                        <DialogContent sx={{ pt: '8px !important', pb: 0 }}>
                            {jobRoles.length === 0 ? (
                                <Typography sx={{ color: '#475569', fontSize: '0.75rem', py: 2, textAlign: 'center' }}>No roles defined. Create roles in the Crew section first.</Typography>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {jobRoles.map(role => {
                                        const isChecked = rolePickerSelectedIds.includes(role.id);
                                        const wasAlreadySaved = existingRoleIdsOnDay.includes(role.id);
                                        const hasRoleInProfile = (rolePickerCrew.job_role_assignments ?? []).some(r => r.job_role.id === role.id);
                                        return (
                                            <Box
                                                key={role.id}
                                                onClick={() => {
                                                    setRolePickerSelectedIds(prev =>
                                                        prev.includes(role.id)
                                                            ? prev.filter(id => id !== role.id)
                                                            : [...prev, role.id]
                                                    );
                                                }}
                                                sx={{
                                                    display: 'flex', alignItems: 'center', gap: 1, py: 0.75, px: 1.5, mx: -1.5,
                                                    borderRadius: 1.5, cursor: 'pointer',
                                                    bgcolor: isChecked ? 'rgba(236, 72, 153, 0.06)' : 'transparent',
                                                    '&:hover': { bgcolor: isChecked ? 'rgba(236, 72, 153, 0.1)' : 'rgba(255,255,255,0.03)' },
                                                    transition: 'all 0.15s ease',
                                                }}
                                            >
                                                <Checkbox
                                                    checked={isChecked}
                                                    size="small"
                                                    sx={{ p: 0, color: 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: '#EC4899' } }}
                                                />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: isChecked ? '#f1f5f9' : '#94a3b8' }}>
                                                            {role.display_name || role.name}
                                                        </Typography>
                                                        {hasRoleInProfile && (
                                                            <Chip label="profile" size="small" sx={{ height: 14, fontSize: '0.45rem', fontWeight: 600, bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', '& .MuiChip-label': { px: 0.4 } }} />
                                                        )}
                                                        {wasAlreadySaved && (
                                                            <Chip label="assigned" size="small" sx={{ height: 14, fontSize: '0.45rem', fontWeight: 600, bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', '& .MuiChip-label': { px: 0.4 } }} />
                                                        )}
                                                    </Box>
                                                    {role.category && (
                                                        <Typography sx={{ fontSize: '0.55rem', color: '#475569', mt: -0.1 }}>{role.category}</Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ px: 3, py: 2 }}>
                            <Button
                                onClick={() => { setRolePickerOpen(false); setRolePickerCrew(null); setRolePickerSelectedIds([]); }}
                                sx={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'none' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                disabled={rolePickerSelectedIds.length === 0 || rolePickerSaving}
                                onClick={async () => {
                                    if (!hasOwner || !rolePickerCrew) return;
                                    const dayIdForSave = crewMenuDayId || scheduleActiveDayId || packageEventDays[0]?.id;
                                    if (!dayIdForSave) return;
                                    setRolePickerSaving(true);
                                    try {
                                        const cm = rolePickerCrew;
                                        const cmNameForSave = `${cm.contact.first_name || ''} ${cm.contact.last_name || ''}`.trim() || 'Unnamed';

                                        const existingSlotsForSave = PackageCrewSlots.filter(
                                            o => o.event_day_template_id === dayIdForSave && o.crew_id === cm.id && o.job_role_id
                                        );
                                        const existingRoleIds = existingSlotsForSave.map(o => o.job_role_id!);

                                        const rolesToAdd = rolePickerSelectedIds.filter(id => !existingRoleIds.includes(id));
                                        const slotsToRemove = existingSlotsForSave.filter(o => !rolePickerSelectedIds.includes(o.job_role_id!));

                                        for (const slot of slotsToRemove) {
                                            await crewSlotApi.remove(slot.id);
                                        }

                                        const newOps: PackageCrewSlotRecord[] = [];
                                        for (const roleId of rolesToAdd) {
                                            const role = jobRoles.find(r => r.id === roleId);
                                            const roleName = role?.display_name || role?.name || 'Crew';
                                            const allExistingForRole = PackageCrewSlots.filter(
                                                o => o.event_day_template_id === dayIdForSave && o.job_role_id === roleId
                                            ).length;
                                            const label = allExistingForRole > 0 ? `${roleName} (${cmNameForSave})` : null;
                                            try {
                                                let newOp = await crewSlotApi.add(dayIdForSave, {
                                                    label,
                                                    crew_id: cm.id,
                                                    job_role_id: roleId,
                                                });
                                                if (selectedActivityId && newOp?.id) {
                                                    const assignedOp = await crewSlotApi.assignActivity(newOp.id, selectedActivityId);
                                                    newOp = { ...newOp, ...assignedOp };
                                                }
                                                newOps.push(newOp);
                                            } catch (err) {
                                                console.warn(`Failed to add role slot ${roleName}:`, err);
                                            }
                                        }

                                        setPackageCrewSlots(prev => {
                                            const removeIds = new Set(slotsToRemove.map(s => s.id));
                                            return [...prev.filter(o => !removeIds.has(o.id)), ...newOps];
                                        });
                                    } catch (err) {
                                        console.warn('Failed to save role assignments:', err);
                                    } finally {
                                        setRolePickerSaving(false);
                                        setRolePickerOpen(false);
                                        setRolePickerCrew(null);
                                        setRolePickerSelectedIds([]);
                                        setCrewMenuDayId(null);
                                    }
                                }}
                                sx={{
                                    fontSize: '0.7rem', textTransform: 'none', fontWeight: 600,
                                    bgcolor: '#EC4899', '&:hover': { bgcolor: '#db2777' },
                                    '&.Mui-disabled': { bgcolor: 'rgba(236, 72, 153, 0.2)', color: 'rgba(255,255,255,0.25)' },
                                }}
                            >
                                {rolePickerSaving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : `Save (${rolePickerSelectedIds.length} role${rolePickerSelectedIds.length !== 1 ? 's' : ''})`}
                            </Button>
                        </DialogActions>
                    </>
                );
            })()}
        </Dialog>
        </>
    );
}
