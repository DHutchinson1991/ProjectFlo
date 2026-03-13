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

import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils/formatUtils';
import { useOptionalScheduleApi } from '@/components/schedule/ScheduleApiContext';
import type { EventDayTemplate } from '@/components/schedule';
import type { JobRole } from '@/lib/types/job-roles';
import type { TaskAutoGenerationPreview } from '@/lib/types/task-library';

import type {
    CrewMemberOption,
    PackageDayOperatorRecord,
    PackageActivityRecord,
} from '../_lib/types';
import {
    getCrewHourlyRate,
    isCrewDayRate,
    getCrewDayRate,
    buildTaskHoursMap,
} from '../_lib/helpers';

// ─── Props ──────────────────────────────────────────────────────────
export interface CrewCardProps {
    packageId: number | null;
    packageDayOperators: PackageDayOperatorRecord[];
    setPackageDayOperators: React.Dispatch<React.SetStateAction<PackageDayOperatorRecord[]>>;
    packageEventDays: EventDayTemplate[];
    packageActivities: PackageActivityRecord[];
    scheduleActiveDayId: number | null;
    selectedActivityId: number | null;
    crewMembers: CrewMemberOption[];
    jobRoles: JobRole[];
    taskPreview: TaskAutoGenerationPreview | null;
    currency: string;
    cardSx: SxProps<Theme>;
}

// ─── Component ──────────────────────────────────────────────────────
export function CrewCard({
    packageId,
    packageDayOperators,
    setPackageDayOperators,
    packageEventDays,
    packageActivities,
    scheduleActiveDayId,
    selectedActivityId,
    crewMembers,
    jobRoles,
    taskPreview,
    currency,
    cardSx,
}: CrewCardProps) {
    // ── ScheduleApi adapter (context if available, else direct package API) ──
    const contextApi = useOptionalScheduleApi();
    const operatorApi = contextApi?.operators ?? {
        add: (dayId: number, data: any) => api.operators.packageDay.add(packageId!, { event_day_template_id: dayId, ...data }),
        remove: (id: number) => api.operators.packageDay.remove(id),
        assign: (id: number, contributorId: number | null) => api.operators.packageDay.assign(id, contributorId),
        assignActivity: (id: number, activityId: number) => api.operators.packageDay.assignActivity(id, activityId),
        unassignActivity: (id: number, activityId: number) => api.operators.packageDay.unassignActivity(id, activityId),
    };
    const hasOwner = !!contextApi || !!packageId;

    // ── Internalized UI state (menus, pickers, dialogs) ──
    const [operatorMenuAnchor, setOperatorMenuAnchor] = useState<null | HTMLElement>(null);
    const [operatorMenuDayId, setOperatorMenuDayId] = useState<number | null>(null);
    const [crewAssignAnchor, setCrewAssignAnchor] = useState<null | HTMLElement>(null);
    const [crewAssignSlotId, setCrewAssignSlotId] = useState<number | null>(null);
    const [rolePickerOpen, setRolePickerOpen] = useState(false);
    const [rolePickerCrewMember, setRolePickerCrewMember] = useState<CrewMemberOption | null>(null);
    const [rolePickerSelectedIds, setRolePickerSelectedIds] = useState<number[]>([]);
    const [rolePickerSaving, setRolePickerSaving] = useState(false);

    // ── Derived values ──
    const dayFilteredOps = scheduleActiveDayId
        ? packageDayOperators.filter(o => o.event_day_template_id === scheduleActiveDayId)
        : packageEventDays[0]
            ? packageDayOperators.filter(o => o.event_day_template_id === packageEventDays[0].id)
            : packageDayOperators;

    const crewDayOps = dayFilteredOps.filter(o => !!(o.contributor_id || o.job_role_id));
    const crewActiveDay = packageEventDays.find(d => d.id === (scheduleActiveDayId || packageEventDays[0]?.id));
    const selectedActivity = selectedActivityId ? packageActivities.find(a => a.id === selectedActivityId) : null;

    // ── Multi-activity helpers ──
    const isCrewExplicitlyAssigned = (op: PackageDayOperatorRecord): boolean => {
        if (!selectedActivityId) return false;
        if (op.activity_assignments && op.activity_assignments.length > 0) {
            return op.activity_assignments.some(a => a.package_activity_id === selectedActivityId);
        }
        if (op.package_activity_id) return op.package_activity_id === selectedActivityId;
        return false;
    };

    const isCrewAssigned = (op: PackageDayOperatorRecord) => {
        if (!selectedActivityId) return true;
        if (isCrewExplicitlyAssigned(op)) return true;
        if (!op.activity_assignments || op.activity_assignments.length === 0) {
            if (!op.package_activity_id) return true;
        }
        return false;
    };

    const toggleCrewActivity = async (op: PackageDayOperatorRecord) => {
        if (!selectedActivityId) return;
        try {
            const explicitlyAssigned = isCrewExplicitlyAssigned(op);
            const updatedOp = explicitlyAssigned
                ? await operatorApi.unassignActivity(op.id, selectedActivityId)
                : await operatorApi.assignActivity(op.id, selectedActivityId);
            setPackageDayOperators(prev => prev.map(o => o.id === op.id ? { ...o, ...updatedOp } : o));
        } catch (err) {
            console.warn('Failed to toggle crew activity:', err);
        }
    };

    // Roles that can be toggled per-activity: videographers / camera ops and sound / audio roles
    const isActivatableRole = (op: PackageDayOperatorRecord): boolean => {
        const rn = (op.job_role?.display_name || op.job_role?.name || op.position_name || '').toLowerCase();
        return rn.includes('videographer') || rn.includes('camera') ||
               rn.includes('sound') || rn.includes('audio') || rn.includes('mixer');
    };

    // ── Task hours map ──
    const taskHoursMap = buildTaskHoursMap(taskPreview);

    // ── Grouped crew ──
    const grouped = new Map<string, { name: string; color: string; ops: typeof crewDayOps }>();
    for (const op of crewDayOps) {
        const key = op.contributor_id ? `c-${op.contributor_id}` : `unassigned-${op.id}`;
        const name = op.contributor
            ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim() || 'Assigned'
            : op.position_name || 'Unassigned';
        const color = op.contributor?.crew_color || op.position_color || '#EC4899';
        if (!grouped.has(key)) {
            grouped.set(key, { name, color, ops: [] });
        }
        grouped.get(key)!.ops.push(op);
    }
    const groups = Array.from(grouped.entries());

    return (
        <>
        <Box sx={{ ...(cardSx as object), overflow: 'hidden' }}>
            {/* Card Header */}
            <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: crewDayOps.length > 0 ? '1px solid rgba(52, 58, 68, 0.25)' : 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                            <PersonIcon sx={{ fontSize: 14, color: '#EC4899' }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Crew</Typography>
                            {selectedActivity ? (
                                <Typography sx={{ fontSize: '0.55rem', color: '#a855f7', fontWeight: 600, mt: -0.25 }}>{selectedActivity.name}</Typography>
                            ) : crewActiveDay && packageEventDays.length > 1 ? (
                                <Typography sx={{ fontSize: '0.55rem', color: '#f59e0b', fontWeight: 600, mt: -0.25 }}>{crewActiveDay.name}</Typography>
                            ) : null}
                        </Box>
                    </Box>
                    {crewDayOps.length > 0 && (
                        <Chip label={`${crewDayOps.length}`} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(236, 72, 153, 0.1)', color: '#EC4899', border: '1px solid rgba(236, 72, 153, 0.2)', '& .MuiChip-label': { px: 0.6 } }} />
                    )}
                </Box>
            </Box>

            {/* Crew listing — grouped by crew member */}
            <Box sx={{ px: 2.5, pt: 1.5, pb: 1.5 }}>
                {groups.map(([key, group], gi) => {
                    const memberTotal = group.ops.reduce((sum, op) => {
                        if (isCrewDayRate(op)) {
                            return sum + getCrewDayRate(op) * Number(op.hours || 1);
                        }
                        const roleName = op.job_role ? (op.job_role.display_name || op.job_role.name) : null;
                        const taskKey = roleName ? `${group.name}|${roleName}` : null;
                        const taskHours = taskKey ? (taskHoursMap.get(taskKey) || 0) : 0;
                        const rate = getCrewHourlyRate(op);
                        const hours = taskHours > 0 ? taskHours : Number(op.hours || 0);
                        return sum + rate * hours;
                    }, 0);

                    return (
                        <Box key={key} sx={{ mb: gi < groups.length - 1 ? 1.5 : 0 }}>
                            {/* Crew member header + subtotal */}
                            <Box
                                onClick={() => {
                                    const firstOp = group.ops[0];
                                    if (firstOp?.contributor) {
                                        const dayId = scheduleActiveDayId || packageEventDays[0]?.id;
                                        const existingRoleIds = dayId
                                            ? packageDayOperators
                                                .filter(o => o.event_day_template_id === dayId && o.contributor_id === firstOp.contributor_id && o.job_role_id)
                                                .map(o => o.job_role_id!)
                                            : [];
                                        setRolePickerCrewMember(firstOp.contributor as CrewMemberOption);
                                        setRolePickerSelectedIds(existingRoleIds);
                                        setRolePickerOpen(true);
                                    }
                                }}
                                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, cursor: 'pointer', px: 1, mx: -1, borderRadius: 1.5, py: 0.25, transition: 'all 0.15s ease', '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.08)' } }}
                            >
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: group.color }} />
                                <Typography variant="body2" sx={{ flex: 1, fontWeight: 700, fontSize: '0.7rem', color: '#38bdf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {group.name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 72, gap: 0.5, flexShrink: 0 }}>
                                    <Typography variant="caption" sx={{
                                        color: memberTotal > 0 ? '#f59e0b' : '#475569',
                                        fontWeight: 700,
                                        fontSize: '0.65rem',
                                        fontVariantNumeric: 'tabular-nums',
                                        textAlign: 'right',
                                    }}>
                                        {memberTotal > 0 ? formatCurrency(memberTotal, currency) : '—'}
                                    </Typography>
                                    <Box sx={{ width: 19, flexShrink: 0 }} />
                                </Box>
                            </Box>

                            {/* Roles for this crew member */}
                            {group.ops.map((op) => {
                                const assigned = isCrewAssigned(op);
                                const activatable = isActivatableRole(op);
                                const dayRate = isCrewDayRate(op);
                                const roleName = op.job_role ? (op.job_role.display_name || op.job_role.name) : null;
                                const taskKey = roleName ? `${group.name}|${roleName}` : null;
                                const taskHours = taskKey ? (taskHoursMap.get(taskKey) || 0) : 0;
                                const rate = dayRate ? getCrewDayRate(op) : getCrewHourlyRate(op);
                                const hours = dayRate ? Number(op.hours || 1) : (taskHours > 0 ? taskHours : Number(op.hours || 0));
                                const cost = rate * hours;

                                // Derived activity-selection states
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
                                            display: 'flex', alignItems: 'center', gap: 1,
                                            py: 0.25, pl: 2.5, pr: 1, mx: -1, borderRadius: 1.5,
                                            transition: 'all 0.2s ease',
                                            opacity: isLocked ? 0.28 : (isDimUnassigned ? 0.3 : 1),
                                            cursor: isLocked ? 'default' : (selectedActivityId ? 'pointer' : 'default'),
                                            bgcolor: isActiveAssigned ? 'rgba(236, 72, 153, 0.07)' : 'transparent',
                                            ...(isLocked ? {} : {
                                                '&:hover': {
                                                    bgcolor: selectedActivityId ? 'rgba(236, 72, 153, 0.1)' : 'rgba(236, 72, 153, 0.04)',
                                                    opacity: isDimUnassigned ? 0.7 : 1,
                                                    '& .op-del': { opacity: !selectedActivityId ? 1 : (assigned ? 1 : 0) },
                                                },
                                            }),
                                        }}
                                    >
                                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', flexShrink: 0, bgcolor: op.position_color || group.color, opacity: isActiveAssigned ? 1 : 0.5 }} />
                                        <Box
                                            sx={{ flex: 1, minWidth: 0, cursor: !selectedActivityId ? 'pointer' : undefined }}
                                            onClick={(e) => {
                                                if (selectedActivityId) return;
                                                e.stopPropagation();
                                                setCrewAssignAnchor(e.currentTarget as HTMLElement);
                                                setCrewAssignSlotId(op.id);
                                            }}
                                        >
                                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.6rem', color: isActiveAssigned ? '#f1f5f9' : '#94a3b8' }}>
                                                {(() => {
                                                    let tierName: string | null = null;
                                                    if (op?.contributor && op?.job_role) {
                                                        const jobRoleMatch = op.contributor.contributor_job_roles?.find(
                                                            (cjr) => cjr.job_role_id === op.job_role_id
                                                        );
                                                        tierName = jobRoleMatch?.payment_bracket?.name || null;
                                                    }
                                                    return op.job_role
                                                        ? `${op.job_role.display_name || op.job_role.name}${tierName ? ` - ${tierName}` : ''}`
                                                        : (op.position_name || 'Crew');
                                                })()}
                                            </Typography>
                                        </Box>
                                        {/* Task hours badge */}
                                        {!dayRate && taskHours > 0 && (
                                            <Typography variant="caption" sx={{
                                                color: '#22d3ee', fontWeight: 700, fontSize: '0.5rem',
                                                fontVariantNumeric: 'tabular-nums',
                                                bgcolor: 'rgba(34, 211, 238, 0.1)', border: '1px solid rgba(34, 211, 238, 0.2)',
                                                borderRadius: 1, px: 0.5, py: 0.1, flexShrink: 0, lineHeight: 1.4,
                                            }}>
                                                {Math.round(taskHours * 10) / 10}h
                                            </Typography>
                                        )}
                                        {dayRate && (
                                            <Typography variant="caption" sx={{
                                                color: '#f59e0b', fontWeight: 600, fontSize: '0.5rem',
                                                fontVariantNumeric: 'tabular-nums',
                                                bgcolor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)',
                                                borderRadius: 1, px: 0.5, py: 0.1, flexShrink: 0, lineHeight: 1.4,
                                            }}>
                                                Day
                                            </Typography>
                                        )}
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 72, gap: 0.5, flexShrink: 0 }}>
                                            <Typography variant="caption" sx={{
                                                color: cost > 0 ? 'rgba(245, 158, 11, 0.6)' : '#475569',
                                                fontWeight: 500, fontSize: '0.55rem',
                                                fontVariantNumeric: 'tabular-nums', textAlign: 'right',
                                            }}>
                                                {cost > 0 ? formatCurrency(cost, currency) : '—'}
                                            </Typography>
                                            <Box className="op-del" sx={{ opacity: 0, transition: 'opacity 0.15s', width: 19, flexShrink: 0 }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            await operatorApi.remove(op.id);
                                                            setPackageDayOperators(prev => prev.filter(o => o.id !== op.id));
                                                        } catch (err) {
                                                            console.warn('Failed to remove operator:', err);
                                                        }
                                                    }}
                                                    sx={{ p: 0.25, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}
                                                >
                                                    <DeleteIcon sx={{ fontSize: 11 }} />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    );
                })}

                {/* Crew Total */}
                {crewDayOps.length > 0 && (() => {
                    const totalCrewCost = crewDayOps.reduce((sum, op) => {
                        if (isCrewDayRate(op)) {
                            return sum + getCrewDayRate(op) * Number(op.hours || 1);
                        }
                        const crewName = op.contributor
                            ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim()
                            : '';
                        const roleName = op.job_role ? (op.job_role.display_name || op.job_role.name) : null;
                        const taskKey = crewName && roleName ? `${crewName}|${roleName}` : null;
                        const taskHours = taskKey ? (taskHoursMap.get(taskKey) || 0) : 0;
                        const rate = getCrewHourlyRate(op);
                        const hours = taskHours > 0 ? taskHours : Number(op.hours || 0);
                        return sum + rate * hours;
                    }, 0);
                    return (
                        <Box sx={{
                            display: 'flex', alignItems: 'center',
                            mt: 1.5, pt: 1, mx: -1, px: 1,
                            borderTop: '1px solid rgba(245, 158, 11, 0.15)',
                        }}>
                            <Box sx={{ width: 8, flexShrink: 0 }} />
                            <Typography variant="caption" sx={{ flex: 1, color: '#94a3b8', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', ml: 1 }}>
                                Total
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 72, gap: 0.5, flexShrink: 0 }}>
                                <Typography variant="caption" sx={{
                                    color: totalCrewCost > 0 ? '#f59e0b' : '#475569',
                                    fontWeight: 700, fontSize: '0.7rem',
                                    fontVariantNumeric: 'tabular-nums', textAlign: 'right',
                                }}>
                                    {totalCrewCost > 0 ? formatCurrency(totalCrewCost, currency) : '—'}
                                </Typography>
                                <Box sx={{ width: 19, flexShrink: 0 }} />
                            </Box>
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
                                setOperatorMenuAnchor(e.currentTarget);
                                setOperatorMenuDayId(scheduleActiveDayId || packageEventDays[0]?.id || null);
                            }}
                            sx={{ fontSize: '0.6rem', color: '#EC4899', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(236, 72, 153, 0.06)' } }}
                        >
                            Add Crew
                        </Button>
                    )}
                    <Button
                        size="small"
                        href="/manager/equipment"
                        component={Link}
                        sx={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', color: '#94a3b8' } }}
                    >
                        Manage
                    </Button>
                </Box>
            </Box>
        </Box>

        {/* Operator Add Menu — Role-based crew slot creation */}
        <Menu
            anchorEl={operatorMenuAnchor}
            open={Boolean(operatorMenuAnchor)}
            onClose={() => { setOperatorMenuAnchor(null); setOperatorMenuDayId(null); }}
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
                            setOperatorMenuAnchor(null);
                            if (!hasOwner || !operatorMenuDayId) return;
                            try {
                                const roleName = role.display_name || role.name;
                                const existingCount = packageDayOperators.filter(o =>
                                    o.event_day_template_id === operatorMenuDayId &&
                                    o.job_role_id === role.id
                                ).length;
                                const positionName = existingCount > 0 ? `${roleName} ${existingCount + 1}` : roleName;

                                const newOp = await operatorApi.add(operatorMenuDayId, {
                                    position_name: positionName,
                                    contributor_id: null,
                                    job_role_id: role.id,
                                });
                                if (selectedActivityId && newOp?.id) {
                                    const assignedOp = await operatorApi.assignActivity(newOp.id, selectedActivityId);
                                    setPackageDayOperators(prev => [...prev, { ...newOp, ...assignedOp }]);
                                } else {
                                    setPackageDayOperators(prev => [...prev, newOp]);
                                }
                            } catch (err) {
                                console.warn('Failed to add role slot:', err);
                            }
                            setOperatorMenuDayId(null);
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
            {crewMembers.length > 0 && (
                <Box sx={{ my: 0.5, borderTop: '1px solid rgba(255,255,255,0.08)' }} />
            )}

            {/* Section: Add specific crew member — opens role picker */}
            {crewMembers.length > 0 && (
                <>
                    <MenuItem disabled sx={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, py: 0.4, opacity: '1 !important' }}>
                        Add Specific Person
                    </MenuItem>
                    {crewMembers.map(cm => {
                        const cmName = `${cm.contact.first_name || ''} ${cm.contact.last_name || ''}`.trim() || 'Unnamed';
                        const primaryRole = (cm.contributor_job_roles ?? []).find(r => r.is_primary)?.job_role ||
                            (cm.contributor_job_roles ?? [])[0]?.job_role;
                        const slotsOnDay = operatorMenuDayId
                            ? packageDayOperators.filter(o =>
                                o.event_day_template_id === operatorMenuDayId && o.contributor_id === cm.id
                            ).length
                            : 0;
                        return (
                            <MenuItem
                                key={`crew-${cm.id}`}
                                onClick={() => {
                                    setOperatorMenuAnchor(null);
                                    const existingRoleIds = operatorMenuDayId
                                        ? packageDayOperators
                                            .filter(o => o.event_day_template_id === operatorMenuDayId && o.contributor_id === cm.id && o.job_role_id)
                                            .map(o => o.job_role_id!)
                                        : [];
                                    setRolePickerCrewMember(cm);
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

        {/* Crew Assignment Menu — assign/reassign a crew member to a role slot */}
        <Menu
            anchorEl={crewAssignAnchor}
            open={Boolean(crewAssignAnchor)}
            onClose={() => { setCrewAssignAnchor(null); setCrewAssignSlotId(null); }}
            PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 200, maxHeight: 350 } }}
        >
            {/* Unassign option */}
            {crewAssignSlotId && packageDayOperators.find(o => o.id === crewAssignSlotId)?.contributor_id && (
                <MenuItem
                    onClick={async () => {
                        if (!crewAssignSlotId) return;
                        try {
                            await operatorApi.assign(crewAssignSlotId, null);
                            setPackageDayOperators(prev =>
                                prev.map(o => o.id === crewAssignSlotId ? { ...o, contributor_id: null, contributor: null } : o)
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
            {crewAssignSlotId && packageDayOperators.find(o => o.id === crewAssignSlotId)?.contributor_id && (
                <Box sx={{ my: 0.5, borderTop: '1px solid rgba(255,255,255,0.08)' }} />
            )}
            {/* Crew member list */}
            {(() => {
                const slot = crewAssignSlotId ? packageDayOperators.find(o => o.id === crewAssignSlotId) : null;
                const slotRoleId = slot?.job_role_id;

                const matchingCrew = slotRoleId
                    ? crewMembers.filter(cm => (cm.contributor_job_roles ?? []).some(r => r.job_role.id === slotRoleId))
                    : crewMembers;
                const otherCrew = slotRoleId
                    ? crewMembers.filter(cm => !(cm.contributor_job_roles ?? []).some(r => r.job_role.id === slotRoleId))
                    : [];

                const renderCrewItem = (cm: CrewMemberOption) => {
                    const cmName = `${cm.contact.first_name || ''} ${cm.contact.last_name || ''}`.trim() || 'Unnamed';
                    const primaryRole = (cm.contributor_job_roles ?? []).find(r => r.is_primary)?.job_role || (cm.contributor_job_roles ?? [])[0]?.job_role;
                    const isCurrentlyAssigned = slot?.contributor_id === cm.id;
                    return (
                        <MenuItem
                            key={cm.id}
                            disabled={isCurrentlyAssigned}
                            onClick={async () => {
                                if (!crewAssignSlotId || isCurrentlyAssigned) return;
                                try {
                                    const updated = await operatorApi.assign(crewAssignSlotId, cm.id);
                                    setPackageDayOperators(prev =>
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
                            <MenuItem disabled sx={{ fontSize: '0.7rem', color: '#475569' }}>No crew members available</MenuItem>
                        )}
                    </>
                );
            })()}
        </Menu>

        {/* Multi-Role Picker Dialog */}
        <Dialog
            open={rolePickerOpen}
            onClose={() => { setRolePickerOpen(false); setRolePickerCrewMember(null); setRolePickerSelectedIds([]); }}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3 } }}
        >
            {rolePickerCrewMember && (() => {
                const cmName = `${rolePickerCrewMember.contact.first_name || ''} ${rolePickerCrewMember.contact.last_name || ''}`.trim() || 'Unnamed';
                const dayId = operatorMenuDayId || scheduleActiveDayId || packageEventDays[0]?.id;
                const existingSlotsForPerson = dayId
                    ? packageDayOperators.filter(o => o.event_day_template_id === dayId && o.contributor_id === rolePickerCrewMember.id)
                    : [];
                const existingRoleIdsOnDay = existingSlotsForPerson.filter(o => o.job_role_id).map(o => o.job_role_id!);

                return (
                    <>
                        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: rolePickerCrewMember.crew_color || '#EC4899', flexShrink: 0 }} />
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
                                        const hasRoleInProfile = (rolePickerCrewMember.contributor_job_roles ?? []).some(r => r.job_role.id === role.id);
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
                                onClick={() => { setRolePickerOpen(false); setRolePickerCrewMember(null); setRolePickerSelectedIds([]); }}
                                sx={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'none' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                disabled={rolePickerSelectedIds.length === 0 || rolePickerSaving}
                                onClick={async () => {
                                    if (!hasOwner || !rolePickerCrewMember) return;
                                    const dayIdForSave = operatorMenuDayId || scheduleActiveDayId || packageEventDays[0]?.id;
                                    if (!dayIdForSave) return;
                                    setRolePickerSaving(true);
                                    try {
                                        const cm = rolePickerCrewMember;
                                        const cmNameForSave = `${cm.contact.first_name || ''} ${cm.contact.last_name || ''}`.trim() || 'Unnamed';

                                        const existingSlotsForSave = packageDayOperators.filter(
                                            o => o.event_day_template_id === dayIdForSave && o.contributor_id === cm.id && o.job_role_id
                                        );
                                        const existingRoleIds = existingSlotsForSave.map(o => o.job_role_id!);

                                        const rolesToAdd = rolePickerSelectedIds.filter(id => !existingRoleIds.includes(id));
                                        const slotsToRemove = existingSlotsForSave.filter(o => !rolePickerSelectedIds.includes(o.job_role_id!));

                                        for (const slot of slotsToRemove) {
                                            await operatorApi.remove(slot.id);
                                        }

                                        const newOps: PackageDayOperatorRecord[] = [];
                                        for (const roleId of rolesToAdd) {
                                            const role = jobRoles.find(r => r.id === roleId);
                                            const roleName = role?.display_name || role?.name || 'Crew';
                                            const allExistingForRole = packageDayOperators.filter(
                                                o => o.event_day_template_id === dayIdForSave && o.job_role_id === roleId
                                            ).length;
                                            const positionName = allExistingForRole > 0 ? `${roleName} (${cmNameForSave})` : roleName;
                                            try {
                                                let newOp = await operatorApi.add(dayIdForSave, {
                                                    position_name: positionName,
                                                    position_color: cm.crew_color || null,
                                                    contributor_id: cm.id,
                                                    job_role_id: roleId,
                                                });
                                                if (selectedActivityId && newOp?.id) {
                                                    const assignedOp = await operatorApi.assignActivity(newOp.id, selectedActivityId);
                                                    newOp = { ...newOp, ...assignedOp };
                                                }
                                                newOps.push(newOp);
                                            } catch (err) {
                                                console.warn(`Failed to add role slot ${roleName}:`, err);
                                            }
                                        }

                                        setPackageDayOperators(prev => {
                                            const removeIds = new Set(slotsToRemove.map(s => s.id));
                                            return [...prev.filter(o => !removeIds.has(o.id)), ...newOps];
                                        });
                                    } catch (err) {
                                        console.warn('Failed to save role assignments:', err);
                                    } finally {
                                        setRolePickerSaving(false);
                                        setRolePickerOpen(false);
                                        setRolePickerCrewMember(null);
                                        setRolePickerSelectedIds([]);
                                        setOperatorMenuDayId(null);
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
