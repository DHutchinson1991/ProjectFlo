'use client';

import React, { useState } from 'react';
import {
    Box, Typography,
    IconButton, Chip, Tooltip, Checkbox,
    Table, TableBody, TableCell, TableHead, TableRow, CircularProgress,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import { scheduleApi } from '@/features/workflow/scheduling/package-template';
import { useOptionalScheduleApi } from '@/features/workflow/scheduling/shared';
import type { EventDay } from '@/features/workflow/scheduling/package-template';
import type { UsePlanningProgressReturn } from '../../../hooks/usePlanningProgress';
import type {
    PackageActivityRecord,
    PackageEventDaySubjectRecord,
    SubjectType,
} from '../../../types';
import { detailGlassCardSx, detailHeaderCellSx, detailBodyCellSx } from '../detail-tokens';


/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

interface MomentRecord {
    id: number;
    name: string;
    description?: string | null;
    order_index: number;
    duration_seconds: number;
    subject_actions?: Record<string, string | { action: string | null; focal: string } | null> | null;
}

interface ActivityWithMoments {
    id: number;
    name: string;
    moments?: MomentRecord[];
}

const STANDARD_GUEST_OPTIONS = [50, 100, 150] as const;

function normalizeSubjectRoleName(value: string | null | undefined): string {
    return value
        ?.trim()
        .toLowerCase()
        .replace(/honour/g, 'honor')
        .replace(/\s+/g, ' ')
        ?? '';
}

function isGuestsRoleName(value: string | null | undefined): boolean {
    return normalizeSubjectRoleName(value) === 'guests';
}

interface SubjectsCardProps {
    packageId: number | null;
    packageEventDays: EventDay[];
    packageActivities: PackageActivityRecord[];
    packageSubjects: PackageEventDaySubjectRecord[];
    setPackageSubjects: React.Dispatch<React.SetStateAction<PackageEventDaySubjectRecord[]>>;
    subjectTemplates: SubjectType[];
    scheduleActiveDayId: number | null;
    selectedActivityId: number | null;
    selectedMomentId?: number | null;
    activitiesWithMoments?: ActivityWithMoments[];
    cardSx?: SxProps<Theme>;
    /** When true, hides all inline editing (real_name, count, member_names). */
    readOnly?: boolean;
    selectedSubjectId?: number | null;
    onSelectSubject?: (id: number | null) => void;
    planning?: UsePlanningProgressReturn;
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function SubjectsCard({
    packageId,
    packageEventDays,
    packageActivities,
    packageSubjects,
    setPackageSubjects,
    subjectTemplates,
    scheduleActiveDayId,
    selectedActivityId,
    selectedMomentId,
    activitiesWithMoments,
    cardSx,
    readOnly = false,
    selectedSubjectId,
    onSelectSubject,
    planning,
}: SubjectsCardProps) {
    // ─── ScheduleApi adapter (use context if available, else direct package API) ──
    const contextApi = useOptionalScheduleApi();
    const subjectApi = contextApi?.subjects ?? {
        create: (dayId: number, data: any) => scheduleApi.packageEventDaySubjects.create(packageId!, { event_day_template_id: dayId, ...data }),
        update: (id: number, data: any) => scheduleApi.packageEventDaySubjects.update(id, data),
        delete: (id: number) => scheduleApi.packageEventDaySubjects.delete(id),
        assignActivity: (subjectId: number, activityId: number) => scheduleApi.packageEventDaySubjects.assignActivity(subjectId, activityId),
        unassignActivity: (subjectId: number, activityId: number) => scheduleApi.packageEventDaySubjects.unassignActivity(subjectId, activityId),
    };
    // When using ScheduleApi, we always have a valid owner, so packageId check can be relaxed
    const hasOwner = !!contextApi || !!packageId;
    const isInstanceMode = !!contextApi && contextApi.mode !== 'package';

    // ─── Internalized UI state ───────────────────────────────────────
    const [isAddingSubject, setIsAddingSubject] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');
    // Inline count editing — track which subject is being typed into
    const [editingCountId, setEditingCountId] = useState<number | null>(null);
    const [editingCountValue, setEditingCountValue] = useState('');
    // Inline real_name editing (instance mode only)
    const [editingRealNameId, setEditingRealNameId] = useState<number | null>(null);
    const [editingRealNameValue, setEditingRealNameValue] = useState('');

    // ─── Derived values ──────────────────────────────────────────────
    const activeEventDayId = scheduleActiveDayId || packageEventDays[0]?.id;
    const activeDay = packageEventDays.find(d => d.id === activeEventDayId);
    const selectedActivity = selectedActivityId ? packageActivities.find(a => a.id === selectedActivityId) : null;
    const activeDayActivities = packageActivities.filter((activity: PackageActivityRecord) => activity.package_event_day_id === activeEventDayId);
     
    const daySubjects = packageSubjects
        .filter((s: any) => s.event_day_template_id === activeEventDayId) // eslint-disable-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const aGuests = (a.name as string).toLowerCase() === 'guests';
            const bGuests = (b.name as string).toLowerCase() === 'guests';
            if (aGuests && !bGuests) return 1;
            if (!aGuests && bGuests) return -1;
            return 0;
        });

    // ── Multi-activity subject assignments (DB-backed via activity_assignments) ──
    const isSubjectAssigned = (s: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!selectedActivityId) return true;
        if (s.activity_assignments && s.activity_assignments.length > 0) {
            return s.activity_assignments.some((a: any) => a.package_activity_id === selectedActivityId); // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        // Legacy fallback
        if (s.package_activity_id) return s.package_activity_id === selectedActivityId;
        return false; // no explicit assignment — click to assign
    };

    const toggleSubjectActivity = async (s: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!selectedActivityId) return;
        try {
            const assigned = isSubjectAssigned(s);
            const updatedSubj = assigned
                ? await subjectApi.unassignActivity(s.id, selectedActivityId)
                : await subjectApi.assignActivity(s.id, selectedActivityId);
            // Update local state with the returned subject (includes activity_assignments)
            setPackageSubjects(prev => prev.map((sub: any) => sub.id === s.id ? { ...sub, ...updatedSubj } : sub)); // eslint-disable-line @typescript-eslint/no-explicit-any
        } catch (err) {
            console.warn('Failed to toggle subject activity:', err);
        }
    };

    // Suggest all subject roles not yet added to the active day
    const existingNames = new Set(daySubjects.map((subject: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
        normalizeSubjectRoleName(subject.role_template?.role_name ?? subject.name),
    ));
    const suggestedRoles = subjectTemplates.filter((role) => !existingNames.has(normalizeSubjectRoleName(role.role_name)));
    const guestSubjects = packageSubjects.filter((subject) => isGuestsRoleName(subject.name) || isGuestsRoleName(subject.role_template?.role_name));
    const guestCounts = guestSubjects
        .map((subject) => subject.count)
        .filter((count): count is number => typeof count === 'number' && Number.isFinite(count) && count > 0);
    const selectedGuestCount = guestCounts.length > 0 && guestCounts.every((count) => count === guestCounts[0])
        ? guestCounts[0]
        : null;

    // ── Selected moment context ──────────────────────────────────────
    const selectedMoment = selectedMomentId
        ? (activitiesWithMoments ?? []).flatMap(a => a.moments ?? []).find(m => m.id === selectedMomentId) ?? null
        : null;
    const activePlanningStep = planning?.activeStep ?? null;
    const activePlanningSubjectIds = new Set(activePlanningStep?.subjectIds ?? []);
    const planningMatchesSelectedActivity = !selectedActivity || activePlanningStep?.activityName === selectedActivity.name;

    const getSubjectAction = (subjectName: string): string | null => {
        if (!selectedMoment?.subject_actions) return null;
        const entry = selectedMoment.subject_actions[subjectName];
        if (!entry) return null; // null = not present
        if (typeof entry === 'string') return entry; // knowledge base format
        return entry.action; // AI format { action, focal }
    };

    const getSubjectFocal = (subjectName: string): string | null => {
        if (!selectedMoment?.subject_actions) return null;
        const entry = selectedMoment.subject_actions[subjectName];
        if (!entry) return null;
        if (typeof entry === 'string') return null; // knowledge base has no focal
        return entry.focal;
    };

    const isSubjectPresent = (subjectName: string): boolean => {
        if (!selectedMoment?.subject_actions) return true;
        return selectedMoment.subject_actions[subjectName] !== null;
    };

    // ─── Helpers ─────────────────────────────────────────────────────
    const addSubjectFromTemplate = async (role: { id: number; role_name: string; is_group?: boolean; never_group?: boolean }) => {
        if (!activeEventDayId || !hasOwner) return;
        try {
            const created = await subjectApi.create(activeEventDayId, {
                name: role.role_name,
                category: 'PEOPLE',
                role_template_id: role.id,
                ...(role.is_group ? { count: isGuestsRoleName(role.role_name) ? (selectedGuestCount ?? STANDARD_GUEST_OPTIONS[0]) : 4 } : {}),
            });
            let nextSubject = created;
            if (created?.id && activeDayActivities.length > 0) {
                for (const activity of activeDayActivities) {
                    nextSubject = await subjectApi.assignActivity(created.id, activity.id);
                }
            }
            setPackageSubjects(prev => [...prev, { ...created, ...nextSubject }]);
        } catch (err) { console.warn('Failed to add subject:', err); }
    };

    const addCustomSubject = async () => {
        if (!newSubjectName.trim() || !activeEventDayId || !hasOwner) return;
        try {
            const created = await subjectApi.create(activeEventDayId, {
                name: newSubjectName.trim(),
                category: 'PEOPLE',
            });
            let nextSubject = created;
            if (created?.id && activeDayActivities.length > 0) {
                for (const activity of activeDayActivities) {
                    nextSubject = await subjectApi.assignActivity(created.id, activity.id);
                }
            }
            setPackageSubjects(prev => [...prev, { ...created, ...nextSubject }]);
            setNewSubjectName('');
            setIsAddingSubject(false);
        } catch (err) { console.warn('Failed to add subject:', err); }
    };

    // ─── Render ──────────────────────────────────────────────────────
    const hCellSx: SxProps<Theme> = detailHeaderCellSx;
    const bCellSx: SxProps<Theme> = detailBodyCellSx;

    return (
        <>
        <Box sx={detailGlassCardSx}>
            {/* ── Section header ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.01em' }}>
                    People
                </Typography>
                {selectedActivity && (
                    <Typography sx={{ fontSize: '0.55rem', color: selectedActivity.color || '#f59e0b', fontWeight: 600 }}>Filtering: {selectedActivity.name}</Typography>
                )}
                {(!readOnly && hasOwner && packageEventDays.length > 0) && (
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                            size="small"
                            onClick={() => { setIsAddingSubject(true); setNewSubjectName(''); }}
                            sx={{ p: 0.25, color: '#64748b', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                        >
                            <AddIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Box>
                )}
            </Box>

            {/* ── Subjects table ── */}
            {(daySubjects.length > 0 || isAddingSubject) ? (
                <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <colgroup>
                        {selectedActivityId && <col style={{ width: '4%' }} />}
                        <col style={{ width: selectedActivityId ? '40%' : '44%' }} />
                        <col style={{ width: selectedActivityId ? '22%' : '24%' }} />
                        <col style={{ width: selectedActivityId ? '22%' : '20%' }} />
                        <col style={{ width: '12%' }} />
                    </colgroup>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                            {selectedActivityId && <TableCell sx={{ ...hCellSx, width: 28, p: 0 }} />}
                            <TableCell sx={hCellSx}>Subject</TableCell>
                            <TableCell sx={hCellSx}>Focal</TableCell>
                            <TableCell sx={hCellSx}>Count</TableCell>
                            <TableCell sx={hCellSx} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {daySubjects.map((subj: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const subjAssigned = isSubjectAssigned(subj);
                        const isFixedGroup = !!(subj as any).role_template?.is_group;
                        const isNeverGroup = !!(subj as any).role_template?.never_group;
                        const isGroup = isFixedGroup || (subj.count !== null && subj.count !== undefined);
                        const currentCount: number = subj.count ?? (isFixedGroup ? 4 : 1);
                        const isEditingThis = editingCountId === subj.id;
                        const isGuestsRole = subj.name.toLowerCase() === 'guests';
                        const isNamedGroup = isGroup && !isGuestsRole;
                        const isSubjectPlanningActive = planningMatchesSelectedActivity
                            && activePlanningSubjectIds.has(subj.id)
                            && (activePlanningStep?.step === 'activity-casting' || activePlanningStep?.step === 'activity-actions');
                        const planningSpinnerColor = activePlanningStep?.step === 'activity-actions' ? '#22c55e' : '#38bdf8';

                        const resizeMemberNames = (newCount: number): string[] | undefined => {
                            if (!isInstanceMode || !isNamedGroup) return undefined;
                            const names: string[] = Array.isArray((subj as any).member_names) ? [...(subj as any).member_names] : [];
                            while (names.length < newCount) names.push('');
                            return names.slice(0, newCount);
                        };

                        const applyCount = async (rawVal: string) => {
                            setEditingCountId(null);
                            const n = parseInt(rawVal, 10);
                            const next = isNaN(n) ? currentCount : Math.max(1, n);
                            if (next === currentCount) return;
                            const memberNames = resizeMemberNames(next);
                            try {
                                const payload: any = { count: next };
                                if (memberNames) payload.member_names = memberNames;
                                const updated = await subjectApi.update(subj.id, payload);
                                setPackageSubjects(prev => prev.map((s: any) => s.id === subj.id ? { ...s, count: updated?.count ?? next, ...(memberNames ? { member_names: memberNames } : {}) } : s)); // eslint-disable-line @typescript-eslint/no-explicit-any
                            } catch (err) { console.warn('Failed to update count:', err); }
                        };

                        const adjustCount = async (e: React.MouseEvent, delta: number) => {
                            e.stopPropagation();
                            const next = Math.max(1, currentCount + delta);
                            if (next === currentCount) return;
                            // Dropping to 1 reverts to non-group (count = null)
                            const newCount = next === 1 ? null : next;
                            const memberNames = resizeMemberNames(next);
                            try {
                                const payload: any = { count: newCount };
                                if (memberNames) payload.member_names = memberNames;
                                const updated = await subjectApi.update(subj.id, payload);
                                setPackageSubjects(prev => prev.map((s: any) => s.id === subj.id ? { ...s, count: updated?.count ?? newCount, ...(memberNames ? { member_names: memberNames } : {}) } : s)); // eslint-disable-line @typescript-eslint/no-explicit-any
                            } catch (err) { console.warn('Failed to update count:', err); }
                        };

                        const toggleGroup = async (e: React.MouseEvent) => {
                            e.stopPropagation();
                            const newCount = isGroup ? null : 2;
                            try {
                                const updated = await subjectApi.update(subj.id, { count: newCount });
                                setPackageSubjects(prev => prev.map((s: any) => s.id === subj.id ? { ...s, count: updated?.count ?? newCount } : s)); // eslint-disable-line @typescript-eslint/no-explicit-any
                            } catch (err) { console.warn('Failed to toggle group:', err); }
                        };

                        return (
                        <React.Fragment key={subj.id}>
                        <TableRow
                            onClick={() => onSelectSubject?.(selectedSubjectId === subj.id ? null : subj.id)}
                            sx={{
                                transition: 'all 0.2s ease',
                                cursor: onSelectSubject ? 'pointer' : undefined,
                                opacity: subjAssigned ? 1 : 0.3,
                                ...(selectedSubjectId === subj.id && { bgcolor: 'rgba(245,158,11,0.08)' }),
                                ...(isSubjectPlanningActive && { bgcolor: 'rgba(34,197,94,0.08)' }),
                                '&:hover': {
                                    bgcolor: isSubjectPlanningActive
                                        ? 'rgba(34,197,94,0.12)'
                                        : selectedSubjectId === subj.id
                                            ? 'rgba(245,158,11,0.12)'
                                            : 'rgba(167, 139, 250, 0.03)',
                                    opacity: selectedActivityId && !subjAssigned ? 0.7 : (subjAssigned ? 1 : 0.3),
                                    '& .subj-del': { opacity: subjAssigned ? 1 : 0 },
                                    '& .subj-group-toggle': { opacity: 1 },
                                },
                            }}
                        >
                            {/* Assignment checkbox */}
                            {selectedActivityId && (
                                <TableCell sx={{ ...bCellSx, p: 0, textAlign: 'center' }}>
                                    <Checkbox
                                        checked={subjAssigned}
                                        onChange={() => toggleSubjectActivity(subj)}
                                        onClick={(e) => e.stopPropagation()}
                                        size="small"
                                        sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 15 }, color: 'rgba(255,255,255,0.15)', '&.Mui-checked': { color: selectedActivity?.color || '#f59e0b' } }}
                                    />
                                </TableCell>
                            )}
                            {/* Subject name */}
                            <TableCell sx={bCellSx}>
                                <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontWeight: 600, fontSize: '0.72rem', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {subj.name}
                                            </Box>
                                            {isSubjectPlanningActive && (
                                                <Tooltip title={activePlanningStep?.momentName ? `${activePlanningStep.momentName}` : 'Planner is working on this subject'}>
                                                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5, flexShrink: 0 }}>
                                                        <CircularProgress size={10} thickness={6} sx={{ color: planningSpinnerColor }} />
                                                    </Box>
                                                </Tooltip>
                                            )}
                                            {isInstanceMode && !readOnly && !isGroup && subj.name.toLowerCase() !== 'guests' ? (
                                                editingRealNameId === subj.id ? (
                                                    <Box component="input" type="text" autoFocus value={editingRealNameValue}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingRealNameValue(e.target.value)}
                                                        onBlur={async () => {
                                                            const val = editingRealNameValue.trim() || null;
                                                            setEditingRealNameId(null);
                                                            if (val !== ((subj as any).real_name ?? null)) {
                                                                try {
                                                                    const updated = await subjectApi.update(subj.id, { real_name: val });
                                                                    setPackageSubjects(prev => prev.map((s: any) => s.id === subj.id ? { ...s, real_name: updated?.real_name ?? val } : s));
                                                                } catch (err) { console.error('Failed to save real_name:', err); }
                                                            }
                                                        }}
                                                        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingRealNameId(null); e.stopPropagation(); }}
                                                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                        sx={{ ml: 0.5, border: '1px solid rgba(167,139,250,0.4)', borderRadius: '3px', bgcolor: 'rgba(167,139,250,0.08)', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 400, py: '1px', px: '4px', outline: 'none', width: 120, fontFamily: 'inherit' }}
                                                    />
                                                ) : (
                                                    <Box component="span"
                                                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditingRealNameId(subj.id); setEditingRealNameValue((subj as any).real_name ?? ''); }}
                                                        sx={{ color: (subj as any).real_name ? '#94a3b8' : 'rgba(255,255,255,0.15)', fontWeight: 400, fontStyle: (subj as any).real_name ? 'normal' : 'italic', fontSize: (subj as any).real_name ? 'inherit' : '0.65rem', cursor: 'pointer', borderRadius: '3px', ml: 0.25, px: 0.25, '&:hover': { bgcolor: 'rgba(167,139,250,0.08)' }, transition: 'background 0.15s' }}
                                                    >
                                                        {(subj as any).real_name ? ` — ${(subj as any).real_name}` : '— Add name...'}
                                                    </Box>
                                                )
                                            ) : (subj as any).real_name ? (
                                                <Box component="span" sx={{ color: '#94a3b8', fontWeight: 400 }}> — {(subj as any).real_name}</Box>
                                            ) : null}
                                        </Typography>
                                </Box>
                            </TableCell>

                            {/* Focal */}
                            <TableCell sx={bCellSx}>
                                {selectedMoment && (() => {
                                    const focal = getSubjectFocal(subj.name);
                                    const present = isSubjectPresent(subj.name);
                                    if (!present) return <Typography sx={{ fontSize: '0.55rem', color: '#475569', fontStyle: 'italic' }}>—</Typography>;
                                    if (!focal) return <Typography sx={{ fontSize: '0.55rem', color: '#334155' }}>—</Typography>;
                                    const FOCAL_COLORS: Record<string, string> = { PRIMARY: '#a78bfa', SECONDARY: '#38bdf8', BACKGROUND: '#64748b' };
                                    return <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: FOCAL_COLORS[focal] ?? '#64748b', textTransform: 'capitalize', letterSpacing: '0.2px' }}>{focal.toLowerCase()}</Typography>;
                                })()}
                            </TableCell>

                            {/* Count */}
                            <TableCell sx={bCellSx}>
                                {isGroup ? (readOnly ? (
                                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#a78bfa', fontVariantNumeric: 'tabular-nums' }}>×{currentCount}</Typography>
                                ) : (
                                    <Box onClick={e => e.stopPropagation()} sx={{ display: 'flex', alignItems: 'center', gap: 0.15 }}>
                                        <IconButton size="small" onClick={(e) => adjustCount(e, -1)}
                                            sx={{ p: 0.15, color: '#64748b', '&:hover': { color: '#a78bfa', bgcolor: 'rgba(167,139,250,0.12)' } }}>
                                            <Box component="span" sx={{ fontSize: 13, lineHeight: 1, fontWeight: 700 }}>−</Box>
                                        </IconButton>
                                        {isEditingThis ? (
                                            <Box component="input" type="number" autoFocus value={editingCountValue}
                                                onChange={e => setEditingCountValue(e.target.value)}
                                                onBlur={e => applyCount(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') applyCount((e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditingCountId(null); e.stopPropagation(); }}
                                                onClick={e => e.stopPropagation()}
                                                sx={{ width: 36, textAlign: 'center', border: '1px solid rgba(167,139,250,0.5)', borderRadius: '4px', bgcolor: 'rgba(167,139,250,0.1)', color: '#a78bfa', fontSize: '0.65rem', fontWeight: 700, py: '1px', px: '2px', outline: 'none', '&::-webkit-inner-spin-button': { display: 'none' } }}
                                            />
                                        ) : (
                                            <Typography
                                                onClick={(e) => { e.stopPropagation(); setEditingCountId(subj.id); setEditingCountValue(String(currentCount)); }}
                                                sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#a78bfa', minWidth: 20, textAlign: 'center', fontVariantNumeric: 'tabular-nums', cursor: 'text', px: 0.25, borderRadius: '4px', '&:hover': { bgcolor: 'rgba(167,139,250,0.1)' } }}
                                            >
                                                {currentCount}
                                            </Typography>
                                        )}
                                        <IconButton size="small" onClick={(e) => adjustCount(e, +1)}
                                            sx={{ p: 0.15, color: '#64748b', '&:hover': { color: '#a78bfa', bgcolor: 'rgba(167,139,250,0.12)' } }}>
                                            <Box component="span" sx={{ fontSize: 13, lineHeight: 1, fontWeight: 700 }}>+</Box>
                                        </IconButton>
                                    </Box>
                                )) : (
                                    !readOnly && !isFixedGroup && !isNeverGroup ? (
                                        <Tooltip title="Click to make group" placement="top">
                                            <Typography
                                                onClick={(e) => { e.stopPropagation(); toggleGroup(e); }}
                                                sx={{ fontSize: '0.65rem', color: '#64748b', fontVariantNumeric: 'tabular-nums', cursor: 'pointer', display: 'inline-block', px: 0.25, borderRadius: '4px', '&:hover': { color: '#a78bfa', bgcolor: 'rgba(167,139,250,0.08)' } }}
                                            >1</Typography>
                                        </Tooltip>
                                    ) : (
                                        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>1</Typography>
                                    )
                                )}
                            </TableCell>

                            {/* Actions */}
                            <TableCell sx={{ ...bCellSx, textAlign: 'right' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.25 }}>
                                    {!readOnly && (
                                        <Box className="subj-del" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
                                            <IconButton size="small"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try { await subjectApi.delete(subj.id); setPackageSubjects(prev => prev.filter((s: any) => s.id !== subj.id)); } catch (err) { console.warn('Failed to remove subject:', err); } // eslint-disable-line @typescript-eslint/no-explicit-any
                                                }}
                                                sx={{ p: 0.25, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}>
                                                <DeleteIcon sx={{ fontSize: 11 }} />
                                            </IconButton>
                                        </Box>
                                    )}
                                </Box>
                            </TableCell>
                        </TableRow>

                        {/* Member name slots — instance mode, named groups only */}
                        {isInstanceMode && !readOnly && isNamedGroup && currentCount > 0 && (
                            <TableRow>
                                <TableCell colSpan={selectedActivityId ? 5 : 4} sx={{ py: 0, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <Box sx={{ pl: 2.5, py: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                        {Array.from({ length: currentCount }, (_, idx) => {
                                            const names: string[] = Array.isArray((subj as any).member_names) ? (subj as any).member_names : [];
                                            const val = names[idx] ?? '';
                                            return (
                                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Typography sx={{ fontSize: '0.55rem', color: '#475569', minWidth: 12, textAlign: 'right' }}>{idx + 1}.</Typography>
                                                    <Box component="input" type="text" placeholder={`${subj.name.replace(/s$/, '')} ${idx + 1}`} value={val}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                            const updated = [...names]; while (updated.length < currentCount) updated.push(''); updated[idx] = e.target.value;
                                                            setPackageSubjects(prev => prev.map((s: any) => s.id === subj.id ? { ...s, member_names: updated } : s));
                                                        }}
                                                        onBlur={async () => { const updated = [...names]; while (updated.length < currentCount) updated.push(''); try { await subjectApi.update(subj.id, { member_names: updated.slice(0, currentCount) } as any); } catch { /* ignore */ } }}
                                                        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); e.stopPropagation(); }}
                                                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                        sx={{ flex: 1, border: 'none', borderBottom: '1px solid rgba(167,139,250,0.15)', bgcolor: 'transparent', color: '#94a3b8', fontSize: '0.62rem', py: '2px', px: '3px', outline: 'none', fontFamily: 'inherit', '&::placeholder': { color: 'rgba(255,255,255,0.12)', fontStyle: 'italic' }, '&:focus': { borderBottomColor: 'rgba(167,139,250,0.5)' } }}
                                                    />
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}

                        </React.Fragment>
                        );
                    })}
                    {/* Inline add row */}
                    {isAddingSubject && (
                        <TableRow>
                            {selectedActivityId && <TableCell sx={{ ...bCellSx, p: 0 }} />}
                            <TableCell sx={bCellSx}>
                                <Box component="input" type="text" autoFocus
                                    placeholder="Subject name…"
                                    value={newSubjectName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSubjectName(e.target.value)}
                                    onKeyDown={async (e: React.KeyboardEvent) => {
                                        if (e.key === 'Enter' && newSubjectName.trim()) await addCustomSubject();
                                        if (e.key === 'Escape') { setIsAddingSubject(false); setNewSubjectName(''); }
                                        e.stopPropagation();
                                    }}
                                    onBlur={async () => {
                                        if (newSubjectName.trim()) await addCustomSubject();
                                        else { setIsAddingSubject(false); setNewSubjectName(''); }
                                    }}
                                    sx={{ width: '100%', border: 'none', borderBottom: '1px solid rgba(167,139,250,0.4)', bgcolor: 'transparent', color: '#f1f5f9', fontSize: '0.72rem', fontWeight: 600, py: '2px', px: 0, outline: 'none', fontFamily: 'inherit', '&::placeholder': { color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', fontWeight: 400 } }}
                                />
                            </TableCell>
                            <TableCell sx={bCellSx} />
                            <TableCell sx={bCellSx}>
                                <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>1</Typography>
                            </TableCell>
                            <TableCell sx={bCellSx} />
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            ) : !readOnly ? (
                <Box sx={{ py: 2, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#475569', mb: 1 }}>No subjects added yet</Typography>
                </Box>
            ) : null}

            {/* Template role suggestions */}
            {!readOnly && suggestedRoles.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                    {daySubjects.length === 0 && (
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.58rem', display: 'block', mb: 0.75 }}>
                            Suggested roles:
                        </Typography>
                    )}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {suggestedRoles.map(role => (
                            <Chip
                                key={role.id}
                                label={`${role.role_name}${role.is_group ? ' (Group)' : ''}`}
                                size="small"
                                onClick={() => addSubjectFromTemplate(role)}
                                icon={<AddIcon sx={{ fontSize: '10px !important' }} />}
                                sx={{
                                    height: 20, fontSize: '0.6rem', fontWeight: 600, cursor: 'pointer',
                                    bgcolor: 'rgba(167, 139, 250, 0.07)', color: '#a78bfa',
                                    border: '1px dashed rgba(167, 139, 250, 0.3)',
                                    '& .MuiChip-icon': { color: '#a78bfa' },
                                    '&:hover': { bgcolor: 'rgba(167, 139, 250, 0.15)', borderStyle: 'solid' },
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            )}

        </Box>
        </>
    );
}
