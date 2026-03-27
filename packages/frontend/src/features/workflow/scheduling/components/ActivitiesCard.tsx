'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
    Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
    IconButton, Tooltip, Chip, TextField,
    Button, Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MovieIcon from '@mui/icons-material/Movie';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CameraRollIcon from '@mui/icons-material/CameraRoll';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { alpha } from '@mui/material/styles';

import { crewSlotsApi, scheduleApi as workflowScheduleApi } from '@/features/workflow/scheduling/api';
import { useOptionalScheduleApi } from './ScheduleApiContext';
import AddEditActivityDialog, { type ActivityValues, type ActivitySaveResult } from './AddActivityDialog';

// ─── Types ─────────────────────────────────────────────────────────

interface MomentRecord {
    id: number;
    package_activity_id: number;
    name: string;
    order_index: number;
    duration_seconds: number;
    is_required: boolean;
    notes?: string | null;
}

interface ActivityRecord {
    id: number;
    package_id?: number;
    package_event_day_id: number;
    name: string;
    description?: string | null;
    color?: string | null;
    icon?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    duration_minutes?: number | null;
    order_index?: number;
    moments?: MomentRecord[];
    package_event_day?: { event_day?: { name?: string } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scene_schedules?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operators?: any[];
}

interface ActivitiesCardProps {
    packageId: number | null;
    packageEventDays: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    activities: ActivityRecord[];
    setActivities: React.Dispatch<React.SetStateAction<ActivityRecord[]>>;
    activeDayId?: number | null;
    cardSx: Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    packageSubjects?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setPackageSubjects?: React.Dispatch<React.SetStateAction<any[]>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    packageLocationSlots?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setPackageLocationSlots?: React.Dispatch<React.SetStateAction<any[]>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PackageCrewSlots?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setPackageCrewSlots?: React.Dispatch<React.SetStateAction<any[]>>;
    selectedActivityId?: number | null;
    onSelectedActivityChange?: (id: number | null) => void;
    /** Fired while the colour picker is open so the timeline can preview live */
    onColorPreview?: (activityId: number | null, color: string | null) => void;
}

// ─── Constants & Helpers ─────────────────────────────────────────

const ACTIVITY_COLORS = [
    '#f59e0b', '#10b981', '#648CFF', '#ec4899',
    '#a855f7', '#0ea5e9', '#ef4444', '#f97316',
    '#14b8a6', '#8b5cf6', '#06b6d4', '#d946ef',
];


function parseTimeToMinutes(time: string | null | undefined): number | null {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
}

function formatTimeDisplay(time: string | null | undefined): string {
    if (!time) return '';
    const mins = parseTimeToMinutes(time);
    if (mins === null) return time;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDuration(mins: number): string {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getActivityDuration(act: ActivityRecord): number {
    if (act.duration_minutes && act.duration_minutes > 0) return act.duration_minutes;
    if (act.start_time && act.end_time) {
        const s = parseTimeToMinutes(act.start_time);
        const e = parseTimeToMinutes(act.end_time);
        if (s !== null && e !== null && e > s) return e - s;
    }
    return 0;
}

// ─── Component ───────────────────────────────────────────────────

export const ActivitiesCard: React.FC<ActivitiesCardProps> = ({
    packageId,
    packageEventDays,
    activities,
    setActivities,
    activeDayId,
    cardSx,
    packageSubjects = [],
    setPackageSubjects,
    packageLocationSlots = [],
    setPackageLocationSlots,
    PackageCrewSlots = [],
    setPackageCrewSlots,
    selectedActivityId,
    onSelectedActivityChange,
    onColorPreview,
}) => {
    // dialog state for add/edit
    const [dialogOpen, setDialogOpen] = useState(false);
    // when editing existing activity, remember its id separately
    const [editingId, setEditingId] = useState<number | null>(null);
    // reuse the same value type from the dialog component
    const [dialogInitial, setDialogInitial] = useState<Partial<ActivityValues> | null>(null);

    // ─── ScheduleApi adapter (context if available, else direct package API) ──
    const contextApi = useOptionalScheduleApi();
    const hasOwner = !!contextApi || !!packageId;

    const activityApi = contextApi?.activities ?? {
        create: (dayId: number, data: any) => workflowScheduleApi.packageActivities.create(packageId!, { package_event_day_id: dayId, ...data }),
        update: (id: number, data: any) => workflowScheduleApi.packageActivities.update(id, data),
        delete: (id: number) => workflowScheduleApi.packageActivities.delete(id),
    };
    const momentApi = contextApi?.moments ?? {
        create: (actId: number, data: any) => workflowScheduleApi.packageActivityMoments.create(actId, data),
        update: (id: number, data: any) => workflowScheduleApi.packageActivityMoments.update(id, data),
        delete: (id: number) => workflowScheduleApi.packageActivityMoments.delete(id),
    };
    const subjectApi = contextApi?.subjects ?? {
        create: (dayId: number, data: any) => workflowScheduleApi.packageEventDaySubjects.create(packageId!, { event_day_template_id: dayId, ...data }),
        assignActivity: (subjectId: number, activityId: number) => workflowScheduleApi.packageEventDaySubjects.assignActivity(subjectId, activityId),
        unassignActivity: (subjectId: number, activityId: number) => workflowScheduleApi.packageEventDaySubjects.unassignActivity(subjectId, activityId),
    };
    const locationSlotApi = contextApi?.locationSlots ?? {
        assignActivity: (slotId: number, actId: number) => workflowScheduleApi.packageLocationSlots.assignActivity(slotId, actId),
        unassignActivity: (slotId: number, actId: number) => workflowScheduleApi.packageLocationSlots.unassignActivity(slotId, actId),
    };
    const operatorApi = contextApi?.operators ?? {
        assignActivity: (opId: number, actId: number) => crewSlotsApi.packageDay.assignActivity(opId, actId),
        unassignActivity: (opId: number, actId: number) => crewSlotsApi.packageDay.unassignActivity(opId, actId),
    };

    // ─── Accordion / moment state ────────────────────────────────
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [addingMomentForId, setAddingMomentForId] = useState<number | null>(null);
    const [newMomentName, setNewMomentName] = useState('');
    const [newMomentDuration, setNewMomentDuration] = useState('30');
    const [editingMomentId, setEditingMomentId] = useState<number | null>(null);
    const [editMomentName, setEditMomentName] = useState('');
    const [editMomentDuration, setEditMomentDuration] = useState('');

    const toggleExpand = useCallback((id: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    // ─── Moment CRUD ─────────────────────────────────────────────
    const handleAddMoment = useCallback(async (activityId: number) => {
        const name = newMomentName.trim();
        if (!name) return;
        try {
            const existing = activities.find(a => a.id === activityId)?.moments || [];
            const created = await momentApi.create(activityId, {
                name,
                duration_seconds: parseInt(newMomentDuration, 10) || 30,
                order_index: existing.length,
            });
            setActivities(prev => prev.map(a =>
                a.id === activityId ? { ...a, moments: [...(a.moments || []), created] } : a
            ));
            setNewMomentName('');
            setNewMomentDuration('30');
            setAddingMomentForId(null);
        } catch (err) { console.warn('Failed to add moment:', err); }
    }, [newMomentName, newMomentDuration, activities, setActivities]);

    const handleDeleteMoment = useCallback(async (activityId: number, momentId: number) => {
        try {
            await momentApi.delete(momentId);
            setActivities(prev => prev.map(a =>
                a.id === activityId
                    ? { ...a, moments: (a.moments || []).filter(m => m.id !== momentId) }
                    : a
            ));
        } catch (err) { console.warn('Failed to delete moment:', err); }
    }, [setActivities]);

    const startEditMoment = useCallback((m: MomentRecord) => {
        setEditingMomentId(m.id);
        setEditMomentName(m.name);
        setEditMomentDuration(String(m.duration_seconds || 30));
    }, []);

    const handleSaveEditMoment = useCallback(async (activityId: number) => {
        if (!editingMomentId) return;
        const name = editMomentName.trim();
        if (!name) return;
        try {
            const updated = await momentApi.update(editingMomentId, {
                name,
                duration_seconds: parseInt(editMomentDuration, 10) || 30,
            });
            setActivities(prev => prev.map(a =>
                a.id === activityId
                    ? { ...a, moments: (a.moments || []).map(m => m.id === editingMomentId ? { ...m, ...updated } : m) }
                    : a
            ));
            setEditingMomentId(null);
        } catch (err) { console.warn('Failed to update moment:', err); }
    }, [editingMomentId, editMomentName, editMomentDuration, setActivities]);

    const cancelEditMoment = useCallback(() => { setEditingMomentId(null); }, []);

    const formatMomentDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return s > 0 ? `${m}m ${s}s` : `${m}m`;
    };

    // Get activities for active day
    const activeDayJoinId = packageEventDays.find(d => d.id === activeDayId)?._joinId;
    const dayActivities = useMemo(() => {
        return activities
            .filter(a => a.package_event_day_id === activeDayJoinId)
            .sort((a, b) => {
                const aMin = parseTimeToMinutes(a.start_time);
                const bMin = parseTimeToMinutes(b.start_time);
                if (aMin === null && bMin === null) return (a.order_index ?? 0) - (b.order_index ?? 0);
                if (aMin === null) return 1;  // no time → end
                if (bMin === null) return -1; // no time → end
                return aMin - bMin;
            });
    }, [activities, activeDayJoinId]);

    // Filter subjects, location slots & crew for the active event day
    const daySubjects = useMemo(() => {
        return packageSubjects.filter(s => s.event_day_template_id === activeDayId);
    }, [packageSubjects, activeDayId]);

    const dayLocationSlots = useMemo(() => {
        return packageLocationSlots.filter(s => s.event_day_template_id === activeDayId);
    }, [packageLocationSlots, activeDayId]);

    const dayCrew = useMemo(() => {
        return PackageCrewSlots.filter(o => o.event_day_template_id === activeDayId);
    }, [PackageCrewSlots, activeDayId]);

    const handleDeleteActivity = async (id: number) => {
        try {
            await activityApi.delete(id);
            setActivities(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.warn('Failed to delete activity:', err);
        }
    };

    const handleUpdateActivity = async (id: number, updates: Partial<ActivityRecord>) => {
        try {
            await activityApi.update(id, updates);
            setActivities(prev =>
                prev.map(a => (a.id === id ? { ...a, ...updates } : a))
            );
        } catch (err) {
            console.warn('Failed to update activity:', err);
        }
    };

    // dialog helpers
    const openAddDialog = () => {
        setEditingId(null);
        setDialogInitial(null);
        setDialogOpen(true);
    };
    const openEditDialog = (act: ActivityRecord) => {
        setEditingId(act.id);
        // Compute end_time from start_time + duration_minutes if not explicitly set
        let endTime = act.end_time ?? undefined;
        if (!endTime && act.start_time && act.duration_minutes && act.duration_minutes > 0) {
            const startMins = parseTimeToMinutes(act.start_time);
            if (startMins !== null) {
                const endMins = startMins + act.duration_minutes;
                const h = Math.floor(endMins / 60) % 24;
                const m = endMins % 60;
                endTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            }
        }
        setDialogInitial({
            name: act.name,
            color: act.color || ACTIVITY_COLORS[(act.order_index ?? 0) % ACTIVITY_COLORS.length],
            start_time: act.start_time ?? undefined,
            end_time: endTime,
            description: act.description ?? undefined,
        });
        setDialogOpen(true);
    };

    const handleDialogSave = async (result: ActivitySaveResult) => {
        const { subjectChanges, newSubjects, locationSlotChanges, crewChanges, ...vals } = result;

        let savedActivityId = editingId;

        if (editingId) {
            await handleUpdateActivity(editingId, vals);
        } else {
            // Create activity and capture the new id
            if (hasOwner && activeDayJoinId) {
                try {
                    const newAct = await activityApi.create(activeDayJoinId, {
                        name: vals.name || '',
                        color: vals.color || undefined,
                        start_time: vals.start_time ?? undefined,
                        end_time: vals.end_time ?? undefined,
                        description: vals.description ?? undefined,
                        order_index: dayActivities.length,
                    });
                    setActivities(prev => [...prev, newAct]);
                    savedActivityId = newAct.id;
                } catch (err) {
                    console.warn('Failed to create activity:', err);
                }
            }
        }

        // ── Process subject changes (M2M via activity_assignments) ──
        if (savedActivityId && setPackageSubjects) {
            for (const change of subjectChanges) {
                try {
                    let updatedSubj;
                    if (change.assign) {
                        updatedSubj = await subjectApi.assignActivity(change.id, savedActivityId);
                    } else {
                        updatedSubj = await subjectApi.unassignActivity(change.id, savedActivityId);
                    }
                    setPackageSubjects(prev =>
                        prev.map(s =>
                            s.id === change.id
                                ? { ...s, ...updatedSubj }
                                : s
                        ),
                    );
                } catch (err) {
                    console.warn('Failed to update subject assignment:', err);
                }
            }
            // Create new subjects assigned to this activity
            for (const subjectName of newSubjects) {
                try {
                    const created = await subjectApi.create(activeDayId!, {
                        name: subjectName,
                        package_activity_id: savedActivityId,
                    });
                    setPackageSubjects(prev => [...prev, created]);
                } catch (err) {
                    console.warn('Failed to create subject:', err);
                }
            }
        }

        // ── Process location slot changes (assign/unassign via junction table) ──
        if (savedActivityId && setPackageLocationSlots) {
            for (const change of locationSlotChanges) {
                try {
                    if (change.assign) {
                        const updated = await locationSlotApi.assignActivity(change.slotId, savedActivityId);
                        setPackageLocationSlots(prev =>
                            prev.map(s => s.id === change.slotId ? { ...s, ...updated } : s),
                        );
                    } else {
                        const updated = await locationSlotApi.unassignActivity(change.slotId, savedActivityId);
                        setPackageLocationSlots(prev =>
                            prev.map(s => s.id === change.slotId ? { ...s, ...updated } : s),
                        );
                    }
                } catch (err) {
                    console.warn('Failed to update location slot assignment:', err);
                }
            }
        }

        // ── Process crew changes (M2M via activity_assignments) ──
        if (savedActivityId && setPackageCrewSlots) {
            for (const change of crewChanges) {
                try {
                    let updatedOp;
                    if (change.assign) {
                        updatedOp = await operatorApi.assignActivity(change.id, savedActivityId);
                    } else {
                        updatedOp = await operatorApi.unassignActivity(change.id, savedActivityId);
                    }
                    setPackageCrewSlots(prev =>
                        prev.map(o =>
                            o.id === change.id
                                ? { ...o, ...updatedOp }
                                : o
                        ),
                    );
                } catch (err) {
                    console.warn('Failed to update crew assignment:', err);
                }
            }
        }

        setDialogOpen(false);
        setDialogInitial(null);
        setEditingId(null);
    };

    if (!activeDayId) {
        return (
            <Box sx={{ ...cardSx }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Select a day to view and edit activities
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ ...cardSx, overflow: 'hidden' }}>
            {/* ── Accent gradient ── */}
            <Box sx={{
                height: 2,
                background: 'linear-gradient(90deg, #a855f7 0%, rgba(168, 85, 247, 0.3) 50%, transparent 100%)',
            }} />

            {/* ── Header ── */}
            <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid rgba(52, 58, 68, 0.2)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{
                        width: 28, height: 28, borderRadius: 1.5, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)',
                    }}>
                        <AccessTimeIcon sx={{ fontSize: 14, color: '#a855f7' }} />
                    </Box>
                    <Typography variant="subtitle2" sx={{
                        fontWeight: 700, color: '#f1f5f9', fontSize: '0.85rem',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                        Activities & Moments
                    </Typography>
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                            label={`${dayActivities.length} item${dayActivities.length !== 1 ? 's' : ''}`}
                            size="small"
                            sx={{ height: 24, fontSize: '0.65rem', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.04)', color: '#64748b', border: 'none' }}
                        />
                    </Box>
                </Box>
            </Box>

            {/* ── Content ── */}
            <Box sx={{ p: 2.5 }}>
                {dayActivities.length === 0 ? (
                    // Empty state
                    <Box sx={{
                        p: 5,
                        textAlign: 'center',
                        bgcolor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: 2,
                        border: '1px dashed rgba(255, 255, 255, 0.1)',
                    }}>
                        <MovieIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.3 }} />
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                            No activities yet. Add your first activity to get started.
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={openAddDialog}
                            size="small"
                            sx={{
                                borderColor: 'rgba(168, 85, 247, 0.3)',
                                color: '#a855f7',
                                '&:hover': { borderColor: 'rgba(168, 85, 247, 0.5)', bgcolor: 'rgba(168, 85, 247, 0.08)' },
                            }}
                        >
                            Add Activity
                        </Button>
                    </Box>
                ) : (
                    // Table view
                    <Stack spacing={2}>
                        <Box sx={{ overflowX: 'hidden' }}>
                            <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                                <colgroup>
                                    <col style={{ width: '36%' }} />
                                    <col style={{ width: '17%' }} />
                                    <col style={{ width: '17%' }} />
                                    <col style={{ width: '15%' }} />
                                    <col style={{ width: '15%' }} />
                                </colgroup>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                                        <TableCell sx={{ py: 1.25, fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Activity
                                        </TableCell>
                                        <TableCell sx={{ py: 1.25, fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Start Time
                                        </TableCell>
                                        <TableCell sx={{ py: 1.25, fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            End Time
                                        </TableCell>
                                        <TableCell sx={{ py: 1.25, fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Duration
                                        </TableCell>
                                        <TableCell sx={{ py: 1.25, fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {dayActivities.map((act) => {
                                        const c = act.color || ACTIVITY_COLORS[(act.order_index ?? 0) % ACTIVITY_COLORS.length];
                                        const dur = getActivityDuration(act);
                                        // Compute end time: use explicit end_time, or derive from start_time + duration
                                        const computedEndTime = act.end_time
                                            || (act.start_time && dur > 0
                                                ? (() => {
                                                    const s = parseTimeToMinutes(act.start_time!);
                                                    if (s === null) return null;
                                                    const e = s + dur;
                                                    return `${String(Math.floor(e / 60) % 24).padStart(2, '0')}:${String(e % 60).padStart(2, '0')}`;
                                                })()
                                                : null);
                                        const isExpanded = expandedIds.has(act.id);
                                        const moments = act.moments || [];
                                        const momentCount = moments.length;

                                        // Coverage: how much of the activity duration is filled by moments
                                        const totalMomentSec = moments.reduce((s, m) => s + (m.duration_seconds || 0), 0);
                                        const actDurSec = dur * 60; // convert minutes → seconds
                                        const coveragePercent = actDurSec > 0 && momentCount > 0
                                            ? Math.min(Math.round((totalMomentSec / actDurSec) * 100), 100)
                                            : (momentCount > 0 ? 100 : 0);
                                        const coverageColor = coveragePercent >= 75 ? '#4CAF50' : coveragePercent >= 50 ? '#FFC107' : coveragePercent >= 25 ? '#FF9800' : '#f44336';

                                        // Count assigned subjects, locations & crew for this activity (using activity_assignments junction)
                                        // Split into key subjects and guests (groups counted by their count value)
                                        const _isAssignedToAct = (s: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
                                            s.activity_assignments?.some((a: { package_activity_id: number }) => a.package_activity_id === act.id) ||
                                            (!s.activity_assignments?.length && s.package_activity_id === act.id);
                                        const actAssignedSubjects = daySubjects.filter(_isAssignedToAct);
                                        const actKeySubjectCount = actAssignedSubjects
                                            .filter((s: any) => (s.name as string).toLowerCase() !== 'guests') // eslint-disable-line @typescript-eslint/no-explicit-any
                                            .reduce((sum: number, s: any) => sum + (s.count != null ? (s.count as number) : 1), 0); // eslint-disable-line @typescript-eslint/no-explicit-any
                                        const actGuestCount = actAssignedSubjects
                                            .filter((s: any) => (s.name as string).toLowerCase() === 'guests') // eslint-disable-line @typescript-eslint/no-explicit-any
                                            .reduce((sum: number, s: any) => sum + (s.count != null ? (s.count as number) : 1), 0); // eslint-disable-line @typescript-eslint/no-explicit-any
                                        const actSubjectCount = actKeySubjectCount + actGuestCount;
                                        const actLocationCount = dayLocationSlots.filter(s =>
                                            s.activity_assignments?.some((a: { package_activity_id: number }) => a.package_activity_id === act.id)
                                        ).length;
                                        const _isAssignedToCrew = (o: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
                                            o.activity_assignments?.some((a: { package_activity_id: number }) => a.package_activity_id === act.id) ||
                                            (!o.activity_assignments?.length && o.package_activity_id === act.id);
                                        const actAssignedCrew = dayCrew.filter(_isAssignedToCrew);
                                        const actCameraEquipCount = new Set(
                                            actAssignedCrew.flatMap((o: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
                                                (o.equipment || [])
                                                    .filter((eq: any) => (eq.equipment?.category || 'CAMERA') !== 'AUDIO') // eslint-disable-line @typescript-eslint/no-explicit-any
                                                    .map((eq: any) => eq.equipment_id), // eslint-disable-line @typescript-eslint/no-explicit-any
                                            ),
                                        ).size;
                                        const actAudioEquipCount = new Set(
                                            actAssignedCrew.flatMap((o: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
                                                (o.equipment || [])
                                                    .filter((eq: any) => eq.equipment?.category === 'AUDIO') // eslint-disable-line @typescript-eslint/no-explicit-any
                                                    .map((eq: any) => eq.equipment_id), // eslint-disable-line @typescript-eslint/no-explicit-any
                                            ),
                                        ).size;

                                        return (
                                            <React.Fragment key={act.id}>
                                            <TableRow
                                                onClick={() => {
                                                    // Toggle selection: click again to deselect
                                                    onSelectedActivityChange?.(selectedActivityId === act.id ? null : act.id);
                                                }}
                                                sx={{
                                                    transition: 'all 0.2s ease',
                                                    borderBottom: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
                                                    bgcolor: selectedActivityId === act.id ? 'rgba(168, 85, 247, 0.08)' : 'transparent',
                                                    borderLeft: selectedActivityId === act.id ? '2px solid #a855f7' : '2px solid transparent',
                                                    '&:hover': {
                                                        bgcolor: selectedActivityId === act.id ? 'rgba(168, 85, 247, 0.12)' : 'rgba(168, 85, 247, 0.03)',
                                                        '& .action-btns': { opacity: 1 },
                                                    },
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {/* Activity Name with expand toggle */}
                                                <TableCell sx={{ py: 1, px: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => { e.stopPropagation(); toggleExpand(act.id); }}
                                                            sx={{ p: 0, color: '#64748b', minWidth: 20 }}
                                                        >
                                                            {isExpanded
                                                                ? <ExpandMoreIcon sx={{ fontSize: 16 }} />
                                                                : <ChevronRightIcon sx={{ fontSize: 16 }} />
                                                            }
                                                        </IconButton>
                                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c, flexShrink: 0 }} />
                                                        <Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#e2e8f0' }}>
                                                                    {act.name}
                                                                </Typography>
                                                                {momentCount > 0 && (
                                                                    <Chip
                                                                        icon={<CameraRollIcon sx={{ fontSize: '10px !important', color: '#94a3b8 !important' }} />}
                                                                        label={momentCount}
                                                                        size="small"
                                                                        sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: 'none', '& .MuiChip-icon': { ml: 0.5 } }}
                                                                    />
                                                                )}
                                                                {/* Coverage % badge — shown when moments exist */}
                                                                {momentCount > 0 && dur > 0 && (
                                                                    <Tooltip title={`${Math.floor(totalMomentSec / 60)}m ${totalMomentSec % 60}s of ${formatDuration(dur)} planned`} arrow>
                                                                        <Box sx={{
                                                                            display: 'inline-flex', alignItems: 'center',
                                                                            px: 0.5, py: 0.1, borderRadius: 0.5,
                                                                            bgcolor: alpha(coverageColor, 0.1),
                                                                            border: `1px solid ${alpha(coverageColor, 0.25)}`,
                                                                        }}>
                                                                            <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: coverageColor, lineHeight: 1 }}>
                                                                                {coveragePercent}%
                                                                            </Typography>
                                                                        </Box>
                                                                    </Tooltip>
                                                                )}
                                                            </Box>
                                                            {/* Subject/location/crew badges */}
                                                            {(actSubjectCount > 0 || actLocationCount > 0 || actCameraEquipCount > 0 || actAudioEquipCount > 0) && (
                                                                <Box sx={{ display: 'flex', gap: 0.75, mt: 0.25 }}>
                                                                    {actCameraEquipCount > 0 && (
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                                                            <VideocamIcon sx={{ fontSize: 10, color: '#EC4899' }} />
                                                                            <Typography sx={{ fontSize: '0.6rem', color: '#EC4899' }}>{actCameraEquipCount}</Typography>
                                                                        </Box>
                                                                    )}
                                                                    {actAudioEquipCount > 0 && (
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                                                            <MicIcon sx={{ fontSize: 10, color: '#EC4899' }} />
                                                                            <Typography sx={{ fontSize: '0.6rem', color: '#EC4899' }}>{actAudioEquipCount}</Typography>
                                                                        </Box>
                                                                    )}
                                                                    {actKeySubjectCount > 0 && (
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                                                            <PersonIcon sx={{ fontSize: 10, color: '#a78bfa' }} />
                                                                            <Typography sx={{ fontSize: '0.6rem', color: '#a78bfa' }}>{actKeySubjectCount}</Typography>
                                                                        </Box>
                                                                    )}
                                                                    {actGuestCount > 0 && (
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                                                            <PersonIcon sx={{ fontSize: 10, color: '#6d5a8a' }} />
                                                                            <Typography sx={{ fontSize: '0.6rem', color: '#6d5a8a' }}>{actGuestCount}</Typography>
                                                                        </Box>
                                                                    )}
                                                                    {actLocationCount > 0 && (
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                                                            <PlaceIcon sx={{ fontSize: 10, color: '#34d399' }} />
                                                                            <Typography sx={{ fontSize: '0.6rem', color: '#34d399' }}>{actLocationCount}</Typography>
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </TableCell>

                                                {/* Start Time */}
                                                <TableCell sx={{ py: 1, px: 1 }}>
                                                    <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                                        {act.start_time ? formatTimeDisplay(act.start_time) : '—'}
                                                    </Typography>
                                                </TableCell>

                                                {/* End Time */}
                                                <TableCell sx={{ py: 1, px: 1 }}>
                                                    <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                                        {computedEndTime ? formatTimeDisplay(computedEndTime) : '—'}
                                                    </Typography>
                                                </TableCell>

                                                {/* Duration */}
                                                <TableCell sx={{ py: 1, px: 1 }}>
                                                    <Typography sx={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
                                                        {dur > 0 ? formatDuration(dur) : '—'}
                                                    </Typography>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell sx={{ py: 1, px: 1 }}>
                                                    <Box
                                                        className="action-btns"
                                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', opacity: 0.3, transition: 'opacity 0.15s' }}
                                                    >
                                                        <Tooltip title="Edit">
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => { e.stopPropagation(); openEditDialog(act); }}
                                                                sx={{ p: 0.25, color: '#a855f7' }}
                                                            >
                                                                <EditIcon sx={{ fontSize: 14 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete">
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteActivity(act.id); }}
                                                                sx={{ p: 0.25, color: '#ef4444' }}
                                                            >
                                                                <DeleteIcon sx={{ fontSize: 14 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>

                                            {/* ── Moments accordion sub-rows ── */}
                                            {isExpanded && moments.map((m, mIdx) => (
                                                <TableRow
                                                    key={`moment-${m.id}`}
                                                    sx={{
                                                        bgcolor: 'rgba(255,255,255,0.012)',
                                                        borderBottom: '1px solid rgba(255,255,255,0.025)',
                                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', '& .moment-actions': { opacity: 1 } },
                                                    }}
                                                >
                                                    {editingMomentId === m.id ? (
                                                        /* ── Inline edit mode ── */
                                                        <>
                                                            <TableCell colSpan={3} sx={{ py: 0.4, pl: 1, pr: 1, border: 'none' }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                    <Box sx={{ width: 22, flexShrink: 0 }} />
                                                                    <Typography sx={{ fontSize: '0.6rem', color: '#475569', fontFamily: 'monospace', minWidth: 14, textAlign: 'right', flexShrink: 0 }}>{mIdx + 1}.</Typography>
                                                                    <TextField
                                                                        value={editMomentName}
                                                                        onChange={(e) => setEditMomentName(e.target.value)}
                                                                        size="small"
                                                                        variant="standard"
                                                                        autoFocus
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') handleSaveEditMoment(act.id);
                                                                            if (e.key === 'Escape') cancelEditMoment();
                                                                        }}
                                                                        sx={{ flex: 1, '& .MuiInput-input': { fontSize: '0.72rem', color: '#cbd5e1', py: 0.25 } }}
                                                                    />
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell sx={{ py: 0.4, px: 1, border: 'none' }}>
                                                                <TextField
                                                                    value={editMomentDuration}
                                                                    onChange={(e) => setEditMomentDuration(e.target.value.replace(/[^0-9]/g, ''))}
                                                                    size="small"
                                                                    variant="standard"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleSaveEditMoment(act.id);
                                                                        if (e.key === 'Escape') cancelEditMoment();
                                                                    }}
                                                                    sx={{ width: 48, '& .MuiInput-input': { fontSize: '0.68rem', color: '#94a3b8', py: 0.25, textAlign: 'right' } }}
                                                                    InputProps={{ endAdornment: <Typography sx={{ fontSize: '0.58rem', color: '#475569', ml: 0.25 }}>s</Typography> }}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ py: 0.4, px: 1, border: 'none' }}>
                                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                                    <IconButton size="small" onClick={() => handleSaveEditMoment(act.id)} sx={{ p: 0.25, color: '#10b981' }}>
                                                                        <CheckIcon sx={{ fontSize: 13 }} />
                                                                    </IconButton>
                                                                    <IconButton size="small" onClick={cancelEditMoment} sx={{ p: 0.25, color: '#64748b' }}>
                                                                        <CloseIcon sx={{ fontSize: 13 }} />
                                                                    </IconButton>
                                                                </Box>
                                                            </TableCell>
                                                        </>
                                                    ) : (
                                                        /* ── Display mode ── */
                                                        <>
                                                            <TableCell colSpan={3} sx={{ py: 0.4, pl: 1, pr: 1, border: 'none' }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                    <Box sx={{ width: 22, flexShrink: 0 }} />
                                                                    <Typography sx={{ fontSize: '0.6rem', color: m.is_required ? '#ef4444' : '#475569', fontFamily: 'monospace', minWidth: 14, textAlign: 'right', flexShrink: 0 }}>{mIdx + 1}.</Typography>
                                                                    <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}>
                                                                        {m.name}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell sx={{ py: 0.4, px: 1, border: 'none' }}>
                                                                <Typography sx={{ fontSize: '0.68rem', color: '#535e6e', fontFamily: 'monospace' }}>
                                                                    {formatMomentDuration(m.duration_seconds)}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell sx={{ py: 0.4, px: 1, border: 'none' }}>
                                                                <Box className="moment-actions" sx={{ display: 'flex', gap: 0.25, opacity: 0, transition: 'opacity 0.15s', justifyContent: 'center' }}>
                                                                    <Tooltip title="Edit moment">
                                                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); startEditMoment(m); }} sx={{ p: 0.25, color: '#7c6fa0' }}>
                                                                            <EditIcon sx={{ fontSize: 12 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Delete moment">
                                                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteMoment(act.id, m.id); }} sx={{ p: 0.25, color: '#b04646' }}>
                                                                            <DeleteIcon sx={{ fontSize: 12 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Box>
                                                            </TableCell>
                                                        </>
                                                    )}
                                                </TableRow>
                                            ))}
                                            {/* ── Empty / "No moments yet" sub-row ── */}
                                            {isExpanded && moments.length === 0 && (
                                                <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.012)' }}>
                                                    <TableCell colSpan={5} sx={{ py: 0.75, pl: 1, border: 'none' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, pl: '2px' }}>
                                                            <Box sx={{ width: 22, flexShrink: 0 }} />
                                                            <Box sx={{ width: 14, flexShrink: 0 }} />
                                                        </Box>
                                                        <Typography sx={{ fontSize: '0.68rem', color: '#475569', fontStyle: 'italic', pl: '40px' }}>
                                                            No moments yet
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {/* ── Add moment sub-row ── */}
                                            {isExpanded && (addingMomentForId === act.id ? (
                                                <TableRow sx={{ bgcolor: 'rgba(168,85,247,0.025)' }}>
                                                    <TableCell colSpan={3} sx={{ py: 0.4, pl: 1, pr: 1, border: 'none' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                            <Box sx={{ width: 22, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                                                                <AddIcon sx={{ fontSize: 13, color: '#a855f7' }} />
                                                            </Box>
                                                            <Box sx={{ width: 14, flexShrink: 0 }} />
                                                            <TextField
                                                                placeholder="Moment name..."
                                                                value={newMomentName}
                                                                onChange={(e) => setNewMomentName(e.target.value)}
                                                                size="small"
                                                                variant="standard"
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleAddMoment(act.id);
                                                                    if (e.key === 'Escape') { setAddingMomentForId(null); setNewMomentName(''); }
                                                                }}
                                                                sx={{ flex: 1, '& .MuiInput-input': { fontSize: '0.72rem', color: '#e2e8f0', py: 0.25 } }}
                                                            />
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 0.4, px: 1, border: 'none' }}>
                                                        <TextField
                                                            value={newMomentDuration}
                                                            onChange={(e) => setNewMomentDuration(e.target.value.replace(/[^0-9]/g, ''))}
                                                            size="small"
                                                            variant="standard"
                                                            sx={{ width: 48, '& .MuiInput-input': { fontSize: '0.68rem', color: '#94a3b8', py: 0.25, textAlign: 'right' } }}
                                                            InputProps={{ endAdornment: <Typography sx={{ fontSize: '0.58rem', color: '#475569', ml: 0.25 }}>s</Typography> }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ py: 0.4, px: 1, border: 'none' }}>
                                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                            <IconButton size="small" onClick={() => handleAddMoment(act.id)} sx={{ p: 0.25, color: '#10b981' }}>
                                                                <CheckIcon sx={{ fontSize: 13 }} />
                                                            </IconButton>
                                                            <IconButton size="small" onClick={() => { setAddingMomentForId(null); setNewMomentName(''); }} sx={{ p: 0.25, color: '#64748b' }}>
                                                                <CloseIcon sx={{ fontSize: 13 }} />
                                                            </IconButton>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                <TableRow
                                                    onClick={(e) => { e.stopPropagation(); setAddingMomentForId(act.id); setNewMomentName(''); setNewMomentDuration('30'); }}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                        '&:hover': { bgcolor: 'rgba(168,85,247,0.04)' },
                                                    }}
                                                >
                                                    <TableCell colSpan={5} sx={{ py: 0.5, pl: 1, border: 'none' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, pl: '2px' }}>
                                                            <Box sx={{ width: 22, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                                                                <AddIcon sx={{ fontSize: 11, color: '#7c3aed' }} />
                                                            </Box>
                                                            <Typography sx={{ fontSize: '0.62rem', color: '#7c3aed', fontWeight: 600 }}>
                                                                Add Moment
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Box>

                        {/* Add Activity Button */}
                        <Box
                            onClick={openAddDialog}
                            sx={{
                                mt: 1.5, py: 1.5, px: 2,
                                borderRadius: 2,
                                border: '1px dashed rgba(168, 85, 247, 0.25)',
                                bgcolor: 'rgba(168, 85, 247, 0.04)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bgcolor: 'rgba(168, 85, 247, 0.08)',
                                    border: '1px dashed rgba(168, 85, 247, 0.45)',
                                },
                            }}
                        >
                            <AddIcon sx={{ fontSize: 18, color: '#a855f7' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#a855f7', fontSize: '0.85rem' }}>
                                Add Activity
                            </Typography>
                        </Box>
                    </Stack>
                )}
            </Box>

            {/* ── Add / edit dialog ── */}
            <AddEditActivityDialog
                open={dialogOpen}
                initial={dialogInitial || undefined}
                activityId={editingId ?? undefined}
                existingNames={dayActivities
                    .map(a => a.name)
                    .filter(n => editingId ? n !== dayActivities.find(act => act.id === editingId)?.name : true)
                }
                eventDayId={activeDayId}
                eventDaySubjects={daySubjects}
                eventDayLocationSlots={dayLocationSlots}
                eventDayCrew={dayCrew}
                onClose={() => {
                    setDialogOpen(false);
                    onColorPreview?.(null, null);
                }}
                onSave={handleDialogSave}
                onColorChange={(color) => {
                    if (editingId != null) onColorPreview?.(editingId, color);
                }}
            />
        </Box>
    );
};

export default ActivitiesCard;
