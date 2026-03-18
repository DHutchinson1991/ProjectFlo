'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Box, Typography, Chip, Tooltip, IconButton,
    Menu, MenuItem, CircularProgress,
    TextField, Divider, Popover,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MovieIcon from '@mui/icons-material/Movie';
import AddIcon from '@mui/icons-material/Add';

import RefreshIcon from '@mui/icons-material/Refresh';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

import { api } from '@/lib/api';
import { useOptionalScheduleApi } from './ScheduleApiContext';

// ─── Types ───────────────────────────────────────────────────────────

interface EventDay {
    id: number;
    name: string;
    order_index: number;
    description?: string | null;
    _joinId?: number; // PackageEventDay join table ID
}

interface ActivityRecord {
    id: number;
    package_id: number;
    package_event_day_id: number;
    name: string;
    description?: string | null;
    color?: string | null;
    icon?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    duration_minutes?: number | null;
    order_index: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scene_schedules?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operators?: any[];
}

interface OperatorRecord {
    id: number;
    contributor_id?: number | null;
    event_day_template_id: number;
    package_activity_id?: number | null;
    position_name?: string;
    position_color?: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contributor?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    job_role?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    equipment?: any[];
}

// DayCoverage type kept for prop compatibility (legacy)
interface DayCoverage {
    mode: 'hours' | 'window';
    hours?: number;
    window?: { from: string; to: string };
}

interface PackageScheduleCardProps {
    packageId: number | null;
    brandId: number;
    packageEventDays: EventDay[];
    setPackageEventDays: React.Dispatch<React.SetStateAction<EventDay[]>>;
    packageDayOperators: OperatorRecord[];
    dayCoverage?: Record<number, DayCoverage>;
    onDayCoverageChange?: (dayId: number, coverage: DayCoverage) => void;
    cardSx: Record<string, unknown>;
    /** Controlled active day (lifted to parent) */
    activeDayId?: number | null;
    /** Callback when user switches day tab */
    onActiveDayChange?: (dayId: number | null) => void;
    /** Currently selected activity for bidirectional highlight */
    selectedActivityId?: number | null;
    /** Callback when user clicks a timeline bar to select an activity */
    onSelectedActivityChange?: (id: number | null) => void;
    /** Callback when user drags a timeline bar to change start/end time */
    onActivityTimeChange?: (activityId: number, startTime: string, endTime: string) => void;
    /** Live colour overrides keyed by activity id – used for instant preview while editing */
    colorOverrides?: Record<number, string>;
    /**
     * External activities to render on the timeline (optional).
     * When provided (and packageId is null / instance mode), these are used
     * instead of the internal API-loaded activities. This allows the
     * timeline to work for project/inquiry instances without having a packageId.
     */
    externalActivities?: ActivityRecord[];
}

// ─── Activity Colors & Presets ───────────────────────────────────────

const ACTIVITY_COLORS = [
    '#f59e0b', '#10b981', '#648CFF', '#ec4899',
    '#a855f7', '#0ea5e9', '#ef4444', '#f97316',
    '#14b8a6', '#8b5cf6', '#06b6d4', '#d946ef',
];

const ACTIVITY_PRESETS = [
    { name: 'Bridal Prep', color: '#ec4899' },
    { name: 'Groom Prep', color: '#648CFF' },
    { name: 'First Look', color: '#a855f7' },
    { name: 'Ceremony', color: '#f59e0b' },
    { name: 'Family Portraits', color: '#10b981' },
    { name: 'Couple Portraits', color: '#0ea5e9' },
    { name: 'Cocktail Hour', color: '#f97316' },
    { name: 'Reception', color: '#14b8a6' },
    { name: 'First Dance', color: '#d946ef' },
    { name: 'Speeches & Toasts', color: '#8b5cf6' },
    { name: 'Detail Shots', color: '#06b6d4' },
    { name: 'Send Off', color: '#ef4444' },
];

// ─── Helpers ─────────────────────────────────────────────────────────

function parseTimeToMinutes(time: string | null | undefined): number | null {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
}

function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function formatDuration(mins: number): string {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
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

/** Assign timed activities to non-overlapping horizontal lanes for Gantt rendering */
function assignLanes(
    acts: { id: number; start_time?: string | null; end_time?: string | null; duration_minutes?: number | null }[],
): Map<number, number> {
    const lanes = new Map<number, number>();
    const laneEnds: number[] = [];
    const timed = acts
        .filter(a => parseTimeToMinutes(a.start_time) !== null)
        .sort((a, b) => parseTimeToMinutes(a.start_time)! - parseTimeToMinutes(b.start_time)!);
    for (const act of timed) {
        const s = parseTimeToMinutes(act.start_time)!;
        const e = act.end_time
            ? (parseTimeToMinutes(act.end_time) ?? s + (act.duration_minutes || 60))
            : s + (act.duration_minutes || 60);
        let placed = false;
        for (let i = 0; i < laneEnds.length; i++) {
            if (s >= laneEnds[i]) {
                lanes.set(act.id, i);
                laneEnds[i] = e;
                placed = true;
                break;
            }
        }
        if (!placed) {
            lanes.set(act.id, laneEnds.length);
            laneEnds.push(e);
        }
    }
    return lanes;
}

// ─── Component ───────────────────────────────────────────────────────

export const PackageScheduleCard: React.FC<PackageScheduleCardProps> = ({
    packageId,
    brandId,
    packageEventDays,
    setPackageEventDays,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    packageDayOperators,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dayCoverage,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onDayCoverageChange,
    cardSx,
    activeDayId: controlledDayId,
    onActiveDayChange,
    selectedActivityId,
    onSelectedActivityChange,
    onActivityTimeChange,
    colorOverrides,
    externalActivities,
}) => {
    // ── Schedule API adapter (context if available, else direct package API) ──
    const contextApi = useOptionalScheduleApi();

    const [loading, setLoading] = useState(false);
    const [activities, setActivities] = useState<ActivityRecord[]>([]);
    const [localDayId, setLocalDayId] = useState<number | null>(null);
    // Use parent-controlled dayId if provided, else local
    const activeDayId = controlledDayId !== undefined ? controlledDayId : localDayId;
    const setActiveDayId = useCallback((id: number | null) => {
        if (onActiveDayChange) onActiveDayChange(id);
        else setLocalDayId(id);
    }, [onActiveDayChange]);
    const [dayMenuAnchor, setDayMenuAnchor] = useState<null | HTMLElement>(null);
    const [brandEventDays, setBrandEventDays] = useState<EventDay[]>([]);
    const [newDayName, setNewDayName] = useState('');
    // Coverage inline editing (removed — now auto-computed from activities)
    // Add Day wizard state
    const [addDayStep, setAddDayStep] = useState<'name' | 'activities'>('name');
    const [pendingDayName, setPendingDayName] = useState('');
    const [pendingDayId, setPendingDayId] = useState<number | null>(null);
    const [pendingJoinId, setPendingJoinId] = useState<number | null>(null);
    const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set(ACTIVITY_PRESETS.map(p => p.name)));

    // Drag-and-drop day reorder state
    const [dragDayId, setDragDayId] = useState<number | null>(null);
    const [dragOverDayId, setDragOverDayId] = useState<number | null>(null);

    // ── Timeline bar drag/resize state ──
    const lanesRef = useRef<HTMLDivElement>(null);
    // dragInfo stores the active drag operation (null = no drag in progress)
    // Using ref to avoid re-renders on every mouse move for performance
    const dragInfo = useRef<{
        activityId: number;
        mode: 'move' | 'resize-left' | 'resize-right';
        origStartMin: number;
        origEndMin: number;
        startX: number; // mouse X at drag start
    } | null>(null);
    // Visual drag state (triggers re-renders for the bar position)
    const [dragPreview, setDragPreview] = useState<{
        activityId: number;
        startMin: number;
        endMin: number;
    } | null>(null);
    // Ref mirror of dragPreview so mouseup handler can read latest without stale closure
    const dragPreviewRef = useRef<typeof dragPreview>(null);
    // Track if mouse actually moved during drag (to distinguish click vs drag)
    const didDragMove = useRef(false);

    // ── Auto-select first day ──
    useEffect(() => {
        if (packageEventDays.length > 0 && activeDayId == null) {
            setActiveDayId(packageEventDays[0].id);
        }
    }, [packageEventDays, activeDayId, setActiveDayId]);

    // The _joinId on each EventDay is the PackageEventDay join table PK.
    // Activities reference this join table ID via package_event_day_id.
    const activePackageEventDayId = useMemo(() => {
        if (!activeDayId) return null;
        const ped = packageEventDays.find(d => d.id === activeDayId);
        return ped?._joinId ?? null;
    }, [activeDayId, packageEventDays]);

    // ── Load activities ──
    const loadActivities = useCallback(async () => {
        if (!packageId) return; // instance mode: activities are supplied via externalActivities
        setLoading(true);
        try {
            const all = await api.schedule.packageActivities.getAll(packageId);
            setActivities(all);
        } catch (err) {
            console.warn('Failed to load package activities:', err);
        } finally {
            setLoading(false);
        }
    }, [packageId]);

    useEffect(() => {
        loadActivities();
    }, [loadActivities]);

    // Sync from externalActivities when in instance mode (no packageId)
    useEffect(() => {
        if (!packageId && externalActivities) {
            setActivities(externalActivities);
        }
    }, [packageId, externalActivities]);

    // ── Activities for the active day, sorted by time then order ──
    const activeDayActivities = useMemo(() => {
        if (!activePackageEventDayId) return [];
        return activities
            .filter(a => a.package_event_day_id === activePackageEventDayId)
            .sort((a, b) => {
                const aT = parseTimeToMinutes(a.start_time);
                const bT = parseTimeToMinutes(b.start_time);
                if (aT !== null && bT !== null) return aT - bT;
                if (aT !== null) return -1;
                if (bT !== null) return 1;
                return a.order_index - b.order_index;
            });
    }, [activePackageEventDayId, activities]);

    // ── Timeline range (auto-computed from activities, default 14h span) ──
    const timelineRange = useMemo(() => {
        const timed = activeDayActivities.filter(a => a.start_time);

        if (timed.length === 0) {
            // Default: 14h centered around midday (6 AM – 8 PM)
            return { startHour: 6, endHour: 20 };
        }

        // Calculate activity span from first to last
        let lo = Infinity, hi = -Infinity;
        for (const a of timed) {
            const s = parseTimeToMinutes(a.start_time);
            if (s === null) continue;
            const e = a.end_time ? parseTimeToMinutes(a.end_time) : null;
            lo = Math.min(lo, s);
            hi = Math.max(hi, e ?? (s + (a.duration_minutes || 60)));
        }

        const startHour = Math.max(0, Math.floor(lo / 60));
        const endHour = Math.min(24, Math.ceil(hi / 60) + 1);

        return { startHour, endHour: Math.max(endHour, startHour + 4) };
    }, [activeDayActivities]);

    // ── Approximate filming hours: first activity start → last activity end ──
    const filmingSpan = useMemo(() => {
        const timed = activeDayActivities.filter(a => a.start_time);
        if (timed.length === 0) return { hours: 14, firstActivity: null, lastActivity: null };

        let lo = Infinity, hi = -Infinity;
        let firstAct: ActivityRecord | null = null;
        let lastAct: ActivityRecord | null = null;
        for (const a of timed) {
            const s = parseTimeToMinutes(a.start_time);
            if (s === null) continue;
            const e = a.end_time ? parseTimeToMinutes(a.end_time) : (s + (a.duration_minutes || 60));
            if (s < lo) { lo = s; firstAct = a; }
            if (e > hi) { hi = e; lastAct = a; }
        }
        const spanMinutes = hi - lo;
        return {
            hours: Math.round((spanMinutes / 60) * 10) / 10,
            firstActivity: firstAct,
            lastActivity: lastAct,
        };
    }, [activeDayActivities]);

    const totalMinutes = (timelineRange.endHour - timelineRange.startHour) * 60;
    const hourMarkers = Array.from(
        { length: timelineRange.endHour - timelineRange.startHour + 1 },
        (_, i) => timelineRange.startHour + i,
    );
    const getPos = (min: number) => {
        const off = min - timelineRange.startHour * 60;
        return Math.max(0, Math.min(100, (off / totalMinutes) * 100));
    };
    const getW = (dur: number) => Math.max(2, Math.min(100, (dur / totalMinutes) * 100));

    // ── Derived stats ──
    const timedCount = activeDayActivities.filter(a => a.start_time).length;
    const totalDuration = activeDayActivities.reduce((sum, a) => {
        if (a.start_time && a.end_time) {
            const s = parseTimeToMinutes(a.start_time);
            const e = parseTimeToMinutes(a.end_time);
            if (s !== null && e !== null) return sum + (e - s);
        }
        return sum + (a.duration_minutes || 0);
    }, 0);

    const getActivityDuration = (a: ActivityRecord): number => {
        if (a.start_time && a.end_time) {
            const s = parseTimeToMinutes(a.start_time);
            const e = parseTimeToMinutes(a.end_time);
            if (s !== null && e !== null) return e - s;
        }
        return a.duration_minutes || 60;
    };

    // ── Lane assignment for overlapping Gantt activities ──
    const activityLanes = useMemo(() => assignLanes(activeDayActivities), [activeDayActivities]);
    const laneCount = useMemo(() => {
        if (activityLanes.size === 0) return 1;
        return Math.max(...Array.from(activityLanes.values())) + 1;
    }, [activityLanes]);

    // ── Timeline drag helpers ──
    const SNAP_MINUTES = 15;
    const snap = (min: number) => Math.round(min / SNAP_MINUTES) * SNAP_MINUTES;
    const MIN_DURATION = 15; // minimum bar duration in minutes

    const pixelsToMinutes = useCallback((px: number): number => {
        if (!lanesRef.current) return 0;
        const containerWidth = lanesRef.current.getBoundingClientRect().width;
        if (containerWidth <= 0) return 0;
        return (px / containerWidth) * totalMinutes;
    }, [totalMinutes]);

    const handleBarMouseDown = useCallback((
        e: React.MouseEvent,
        actId: number,
        mode: 'move' | 'resize-left' | 'resize-right',
        sMin: number,
        eMin: number,
    ) => {
        e.preventDefault();
        e.stopPropagation();
        didDragMove.current = false;
        dragInfo.current = {
            activityId: actId,
            mode,
            origStartMin: sMin,
            origEndMin: eMin,
            startX: e.clientX,
        };
        const initial = { activityId: actId, startMin: sMin, endMin: eMin };
        setDragPreview(initial);
        dragPreviewRef.current = initial;
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const info = dragInfo.current;
            if (!info) return;
            const dx = e.clientX - info.startX;
            const deltaMin = pixelsToMinutes(dx);

            // Mark as a real drag if mouse moved more than 3px
            if (Math.abs(dx) > 3) didDragMove.current = true;

            let newStart = info.origStartMin;
            let newEnd = info.origEndMin;

            if (info.mode === 'move') {
                const dur = info.origEndMin - info.origStartMin;
                newStart = snap(info.origStartMin + deltaMin);
                // Clamp to timeline range
                newStart = Math.max(timelineRange.startHour * 60, Math.min(timelineRange.endHour * 60 - dur, newStart));
                newEnd = newStart + dur;
            } else if (info.mode === 'resize-left') {
                newStart = snap(info.origStartMin + deltaMin);
                newStart = Math.max(timelineRange.startHour * 60, Math.min(info.origEndMin - MIN_DURATION, newStart));
                newEnd = info.origEndMin;
            } else if (info.mode === 'resize-right') {
                newEnd = snap(info.origEndMin + deltaMin);
                newEnd = Math.max(info.origStartMin + MIN_DURATION, Math.min(timelineRange.endHour * 60, newEnd));
                newStart = info.origStartMin;
            }

            const next = { activityId: info.activityId, startMin: newStart, endMin: newEnd };
            setDragPreview(next);
            dragPreviewRef.current = next;
        };

        const handleMouseUp = () => {
            const info = dragInfo.current;
            const preview = dragPreviewRef.current;
            if (info && preview && onActivityTimeChange && didDragMove.current) {
                const startStr = minutesToTime(preview.startMin);
                const endStr = minutesToTime(preview.endMin);
                // Only fire if actually changed
                if (preview.startMin !== info.origStartMin || preview.endMin !== info.origEndMin) {
                    onActivityTimeChange(info.activityId, startStr, endStr);
                    // Update local activities state immediately for visual feedback
                    setActivities(prev => prev.map(a =>
                        a.id === info.activityId
                            ? { ...a, start_time: startStr, end_time: endStr, duration_minutes: preview.endMin - preview.startMin }
                            : a
                    ));
                }
            }
            dragInfo.current = null;
            setDragPreview(null);
            dragPreviewRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [pixelsToMinutes, timelineRange, onActivityTimeChange]);

    // Click handler for timeline bar selection
    const handleBarClick = useCallback((e: React.MouseEvent, actId: number) => {
        // Don't fire click if we just finished a drag (mouse moved significantly)
        if (didDragMove.current) {
            didDragMove.current = false;
            return;
        }
        e.stopPropagation();
        if (onSelectedActivityChange) {
            onSelectedActivityChange(selectedActivityId === actId ? null : actId);
        }
    }, [onSelectedActivityChange, selectedActivityId]);


    // ══════════════════════════════════════════════════════════════════
    //  Render
    // ══════════════════════════════════════════════════════════════════

    return (
        <Box sx={{ ...cardSx, overflow: 'hidden' }}>

            {/* ── Accent gradient ── */}
            <Box sx={{
                height: 2,
                background: 'linear-gradient(90deg, #f59e0b 0%, rgba(245, 158, 11, 0.3) 50%, transparent 100%)',
            }} />

            {/* ── Header with Inline Day Tabs ── */}
            <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid rgba(52, 58, 68, 0.2)' }}>
                {/* Title row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: (packageId && packageEventDays.length > 0) ? 1 : 0 }}>
                    <Box sx={{
                        width: 28, height: 28, borderRadius: 1.5, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)',
                    }}>
                        <CalendarTodayIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                    </Box>
                    <Typography variant="subtitle2" sx={{
                        fontWeight: 700, color: '#f1f5f9', fontSize: '0.85rem',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                        Schedule
                    </Typography>
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton
                            size="small" onClick={() => loadActivities()}
                            sx={{ p: 0.5, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#f59e0b' } }}
                        >
                            <RefreshIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Box>
                </Box>

                {/* Inline day tabs (shown for both package and instance mode) */}
                {(packageId || contextApi) && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {packageEventDays.map((day, dayIdx) => {
                            const isActive = activeDayId === day.id;
                            const actCount = activities.filter(a => a.package_event_day_id === day._joinId).length;
                            const isDragOver = dragOverDayId === day.id && dragDayId !== day.id;
                            return (
                                <Box
                                    key={day.id}
                                    draggable
                                    onDragStart={() => setDragDayId(day.id)}
                                    onDragEnd={() => { setDragDayId(null); setDragOverDayId(null); }}
                                    onDragOver={(e) => { e.preventDefault(); setDragOverDayId(day.id); }}
                                    onDragLeave={() => setDragOverDayId(null)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (dragDayId === null || dragDayId === day.id) return;
                                        setPackageEventDays(prev => {
                                            const arr = [...prev];
                                            const fromIdx = arr.findIndex(d => d.id === dragDayId);
                                            const toIdx = arr.findIndex(d => d.id === day.id);
                                            if (fromIdx === -1 || toIdx === -1) return prev;
                                            const [moved] = arr.splice(fromIdx, 1);
                                            arr.splice(toIdx, 0, moved);
                                            return arr;
                                        });
                                        setDragDayId(null);
                                        setDragOverDayId(null);
                                    }}
                                    onClick={() => setActiveDayId(day.id)}
                                    sx={{
                                        display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                        px: 1.25, py: 0.5, borderRadius: 1.5,
                                        cursor: 'grab', transition: 'all 0.15s ease',
                                        bgcolor: isActive ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.02)',
                                        border: isActive
                                            ? '1px solid rgba(245, 158, 11, 0.35)'
                                            : isDragOver
                                                ? '1px solid rgba(245, 158, 11, 0.5)'
                                                : '1px solid rgba(255,255,255,0.06)',
                                        opacity: dragDayId === day.id ? 0.5 : 1,
                                        transform: isDragOver ? 'scale(1.02)' : 'none',
                                        '&:hover': {
                                            borderColor: 'rgba(245, 158, 11, 0.25)',
                                            bgcolor: 'rgba(245, 158, 11, 0.06)',
                                            '& .day-del': { opacity: 1 },
                                        },
                                        '&:active': { cursor: 'grabbing' },
                                    }}
                                >
                                    <Typography sx={{
                                        fontSize: '0.6rem', fontWeight: 800, color: isActive ? '#f59e0b' : '#64748b',
                                        textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: 1,
                                    }}>
                                        Day {dayIdx + 1}:
                                    </Typography>
                                    <Typography sx={{
                                        fontSize: '0.7rem', fontWeight: 600,
                                        color: isActive ? '#f1f5f9' : '#94a3b8', lineHeight: 1,
                                    }}>
                                        {day.name}
                                    </Typography>
                                    {actCount > 0 && (
                                        <Box sx={{
                                            minWidth: 16, height: 16, borderRadius: '50%', px: 0.25,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            bgcolor: isActive ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.06)',
                                        }}>
                                            <Typography sx={{
                                                fontSize: '0.5rem', fontWeight: 700, lineHeight: 1,
                                                color: isActive ? '#f59e0b' : '#64748b',
                                            }}>
                                                {actCount}
                                            </Typography>
                                        </Box>
                                    )}
                                    <IconButton
                                        className="day-del" size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPackageEventDays(prev => prev.filter(d => d.id !== day.id));
                                            if (activeDayId === day.id) {
                                                setActiveDayId(packageEventDays.find(d => d.id !== day.id)?.id || null);
                                            }
                                            if (packageId) {
                                                api.schedule.packageEventDays.remove(packageId, day.id).catch(() => {});
                                            } else if (contextApi) {
                                                contextApi.eventDays.delete(day.id).catch(() => {});
                                            }
                                        }}
                                        sx={{
                                            p: 0, ml: -0.25, opacity: 0, transition: 'opacity 0.15s',
                                            color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' },
                                        }}
                                    >
                                        <CloseIcon sx={{ fontSize: 11 }} />
                                    </IconButton>
                                </Box>
                            );
                        })}
                        {/* + Add Day */}
                        <Box
                            onClick={async (e) => {
                                const anchor = e.currentTarget as HTMLElement;
                                try {
                                    if (contextApi?.brandEventDays) {
                                        const all = await contextApi.brandEventDays.getAll(brandId);
                                        setBrandEventDays(all);
                                    } else {
                                        const all = await api.schedule.eventDays.getAll(brandId);
                                        setBrandEventDays(all);
                                    }
                                } catch { /* use cache */ }
                                setDayMenuAnchor(anchor);
                            }}
                            sx={{
                                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                px: 1.25, py: 0.5, borderRadius: 1.5, cursor: 'pointer',
                                border: '1px dashed rgba(245, 158, 11, 0.3)',
                                bgcolor: 'rgba(245, 158, 11, 0.04)',
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                    bgcolor: 'rgba(245, 158, 11, 0.1)',
                                    borderColor: 'rgba(245, 158, 11, 0.5)',
                                    boxShadow: '0 0 12px rgba(245, 158, 11, 0.08)',
                                },
                            }}
                        >
                            <AddIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b' }}>
                                Add Day
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* ── Add Day Popover (clean two-step wizard) ── */}
            <Popover
                anchorEl={dayMenuAnchor} open={Boolean(dayMenuAnchor)}
                onClose={() => {
                    setDayMenuAnchor(null); setNewDayName('');
                    setAddDayStep('name'); setPendingDayName('');
                    setPendingDayId(null); setPendingJoinId(null);
                    setSelectedPresets(new Set(ACTIVITY_PRESETS.map(p => p.name)));
                }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: {
                        bgcolor: '#141720', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 3, width: 340, overflow: 'hidden',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    },
                }}
            >
                {/* Step indicator */}
                <Box sx={{
                    px: 2.5, pt: 2, pb: 1.5,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', gap: 1.5,
                }}>
                    <Box sx={{
                        width: 28, height: 28, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: addDayStep === 'name' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        border: addDayStep === 'name' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                    }}>
                        {addDayStep === 'name'
                            ? <CalendarTodayIcon sx={{ fontSize: 13, color: '#f59e0b' }} />
                            : <CheckIcon sx={{ fontSize: 13, color: '#10b981' }} />
                        }
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 }}>
                            {addDayStep === 'name' ? 'Add Event Day' : `Setup "${pendingDayName}"`}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: '#64748b', lineHeight: 1.2 }}>
                            {addDayStep === 'name' ? 'Choose or create an event day' : 'Pick activities for this day'}
                        </Typography>
                    </Box>
                    {/* Step dots */}
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: addDayStep === 'activities' ? '#f59e0b' : 'rgba(255,255,255,0.1)' }} />
                    </Box>
                </Box>

                {addDayStep === 'name' && (
                    <Box sx={{ py: 1 }}>
                        {/* Existing unassigned brand days */}
                        {brandEventDays.filter(bd => !packageEventDays.some(pd => pd.id === bd.id)).length > 0 && (
                            <Box sx={{ mb: 1 }}>
                                <Typography sx={{ px: 2.5, py: 0.5, fontSize: '0.55rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Existing Days
                                </Typography>
                                {brandEventDays
                                    .filter(bd => !packageEventDays.some(pd => pd.id === bd.id))
                                    .map(bd => (
                                        <Box
                                            key={bd.id}
                                            onClick={async () => {
                                                try {
                                                    if (packageId) {
                                                        const res = await api.schedule.packageEventDays.add(packageId, bd.id);
                                                        setPendingDayId(bd.id);
                                                        setPendingJoinId(res._joinId ?? res.id);
                                                        setPendingDayName(bd.name);
                                                        setPackageEventDays(prev => [...prev, { ...bd, _joinId: res._joinId ?? res.id }]);
                                                    } else if (contextApi) {
                                                        const res = await contextApi.eventDays.create({ name: bd.name, event_day_template_id: bd.id });
                                                        const newDay = { ...bd, id: res.id, _joinId: res.id };
                                                        setPendingDayId(res.id);
                                                        setPendingJoinId(res.id);
                                                        setPendingDayName(bd.name);
                                                        setPackageEventDays(prev => [...prev, newDay]);
                                                    } else {
                                                        return;
                                                    }
                                                    setAddDayStep('activities');
                                                } catch (err) {
                                                    console.warn('Failed to add event day:', err);
                                                }
                                            }}
                                            sx={{
                                                display: 'flex', alignItems: 'center', gap: 1,
                                                px: 2.5, py: 1, cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                                '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.06)' },
                                            }}
                                        >
                                            <CalendarTodayIcon sx={{ fontSize: 14, color: '#f59e0b', opacity: 0.7 }} />
                                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#e2e8f0' }}>
                                                {bd.name}
                                            </Typography>
                                        </Box>
                                    ))
                                }
                                <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)', mt: 0.5 }} />
                            </Box>
                        )}
                        {/* Create new day inline */}
                        <Typography sx={{ px: 2.5, py: 0.5, fontSize: '0.55rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Create New
                        </Typography>
                        <Box sx={{ px: 2, pb: 1.5, display: 'flex', gap: 0.75 }}>
                            <TextField
                                placeholder="e.g. Wedding Day, Rehearsal Dinner…"
                                value={newDayName}
                                onChange={e => setNewDayName(e.target.value)}
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter' && newDayName.trim() && (packageId || contextApi)) {
                                        try {
                                            if (packageId) {
                                                const created = await api.schedule.eventDays.create(brandId, { name: newDayName.trim() });
                                                const res = await api.schedule.packageEventDays.add(packageId, created.id);
                                                setPendingDayId(created.id);
                                                setPendingJoinId(res._joinId ?? res.id);
                                                setPendingDayName(created.name);
                                                setPackageEventDays(prev => [...prev, { ...created, _joinId: res._joinId ?? res.id }]);
                                            } else if (contextApi) {
                                                const res = await contextApi.eventDays.create({ name: newDayName.trim() });
                                                setPendingDayId(res.id);
                                                setPendingJoinId(res.id);
                                                setPendingDayName(res.name || newDayName.trim());
                                                setPackageEventDays(prev => [...prev, { id: res.id, name: res.name || newDayName.trim(), order_index: prev.length, _joinId: res.id }]);
                                            }
                                            setNewDayName('');
                                            setAddDayStep('activities');
                                        } catch (err) {
                                            console.warn('Failed to create event day:', err);
                                        }
                                    }
                                }}
                                size="small"
                                autoFocus
                                sx={{
                                    flex: 1,
                                    '& .MuiOutlinedInput-root': {
                                        height: 34, fontSize: '0.72rem', color: '#e2e8f0',
                                        borderRadius: 2,
                                        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                                        '&:hover fieldset': { borderColor: 'rgba(245, 158, 11, 0.3)' },
                                        '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
                                    },
                                }}
                            />
                            <Chip
                                label="Create"
                                size="small"
                                disabled={!newDayName.trim()}
                                onClick={async () => {
                                    if (!newDayName.trim() || (!packageId && !contextApi)) return;
                                    try {
                                        if (packageId) {
                                            const created = await api.schedule.eventDays.create(brandId, { name: newDayName.trim() });
                                            const res = await api.schedule.packageEventDays.add(packageId, created.id);
                                            setPendingDayId(created.id);
                                            setPendingJoinId(res._joinId ?? res.id);
                                            setPendingDayName(created.name);
                                            setPackageEventDays(prev => [...prev, { ...created, _joinId: res._joinId ?? res.id }]);
                                        } else if (contextApi) {
                                            const res = await contextApi.eventDays.create({ name: newDayName.trim() });
                                            setPendingDayId(res.id);
                                            setPendingJoinId(res.id);
                                            setPendingDayName(res.name || newDayName.trim());
                                            setPackageEventDays(prev => [...prev, { id: res.id, name: res.name || newDayName.trim(), order_index: prev.length, _joinId: res.id }]);
                                        }
                                        setNewDayName('');
                                        setAddDayStep('activities');
                                    } catch (err) {
                                        console.warn('Failed to create event day:', err);
                                    }
                                }}
                                sx={{
                                    height: 34, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                                    bgcolor: newDayName.trim() ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.04)',
                                    color: newDayName.trim() ? '#f59e0b' : '#334155',
                                    border: newDayName.trim() ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '8px',
                                    '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.25)' },
                                    '&.Mui-disabled': { opacity: 0.4, color: '#334155' },
                                }}
                            />
                        </Box>
                    </Box>
                )}

                {addDayStep === 'activities' && (
                    <Box sx={{ py: 1 }}>
                        {/* Select All / None */}
                        <Box sx={{ px: 2.5, pb: 0.75, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                                onClick={() => setSelectedPresets(new Set(ACTIVITY_PRESETS.map(p => p.name)))}
                                sx={{ fontSize: '0.58rem', fontWeight: 600, color: '#648CFF', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            >
                                Select All
                            </Typography>
                            <Typography sx={{ fontSize: '0.5rem', color: '#334155' }}>•</Typography>
                            <Typography
                                onClick={() => setSelectedPresets(new Set())}
                                sx={{ fontSize: '0.58rem', fontWeight: 600, color: '#648CFF', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            >
                                None
                            </Typography>
                            <Typography sx={{ ml: 'auto', fontSize: '0.55rem', color: '#475569' }}>
                                {selectedPresets.size} selected
                            </Typography>
                        </Box>
                        {/* Activity checklist — grid layout */}
                        <Box sx={{ px: 1.5, maxHeight: 260, overflow: 'auto' }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                                {ACTIVITY_PRESETS.map(preset => {
                                    const checked = selectedPresets.has(preset.name);
                                    return (
                                        <Box
                                            key={preset.name}
                                            onClick={() => {
                                                setSelectedPresets(prev => {
                                                    const n = new Set(prev);
                                                    if (n.has(preset.name)) n.delete(preset.name);
                                                    else n.add(preset.name);
                                                    return n;
                                                });
                                            }}
                                            sx={{
                                                display: 'flex', alignItems: 'center', gap: 0.75,
                                                px: 1.25, py: 0.75, borderRadius: 1.5, cursor: 'pointer',
                                                bgcolor: checked ? `${preset.color}12` : 'transparent',
                                                border: checked ? `1px solid ${preset.color}30` : '1px solid transparent',
                                                transition: 'all 0.12s ease',
                                                '&:hover': { bgcolor: `${preset.color}18` },
                                            }}
                                        >
                                            <Box sx={{
                                                width: 16, height: 16, borderRadius: 1, flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                bgcolor: checked ? preset.color : 'transparent',
                                                border: checked ? `2px solid ${preset.color}` : '2px solid rgba(255,255,255,0.15)',
                                                transition: 'all 0.12s ease',
                                            }}>
                                                {checked && <CheckIcon sx={{ fontSize: 10, color: '#fff' }} />}
                                            </Box>
                                            <Typography sx={{
                                                fontSize: '0.62rem', fontWeight: 600,
                                                color: checked ? '#e2e8f0' : '#94a3b8',
                                                lineHeight: 1.2,
                                            }}>
                                                {preset.name}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)', mt: 1 }} />
                        {/* Action buttons */}
                        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'flex-end', gap: 0.75 }}>
                            <Chip
                                label="Skip"
                                size="small"
                                onClick={() => {
                                    if (pendingDayId) setActiveDayId(pendingDayId);
                                    setDayMenuAnchor(null);
                                    setAddDayStep('name');
                                    setPendingDayId(null);
                                    setPendingJoinId(null);
                                    setPendingDayName('');
                                    setSelectedPresets(new Set(ACTIVITY_PRESETS.map(p => p.name)));
                                }}
                                sx={{
                                    height: 28, fontSize: '0.6rem', fontWeight: 600, cursor: 'pointer',
                                    bgcolor: 'rgba(255,255,255,0.04)', color: '#64748b',
                                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                                }}
                            />
                            <Chip
                                label={`Add ${selectedPresets.size} activit${selectedPresets.size !== 1 ? 'ies' : 'y'}`}
                                size="small"
                                disabled={selectedPresets.size === 0}
                                onClick={async () => {
                                    if ((!packageId && !contextApi) || !pendingJoinId) return;
                                    const toCreate = ACTIVITY_PRESETS.filter(p => selectedPresets.has(p.name));
                                    try {
                                        const created: ActivityRecord[] = [];
                                        for (let i = 0; i < toCreate.length; i++) {
                                            let act: ActivityRecord;
                                            if (packageId) {
                                                act = await api.schedule.packageActivities.create(packageId, {
                                                    package_event_day_id: pendingJoinId,
                                                    name: toCreate[i].name,
                                                    color: toCreate[i].color,
                                                    order_index: i,
                                                });
                                            } else {
                                                act = await contextApi!.activities.create(pendingJoinId, {
                                                    name: toCreate[i].name,
                                                    color: toCreate[i].color,
                                                    order_index: i,
                                                });
                                                // Normalize for timeline display
                                                act = { ...act, package_event_day_id: act.package_event_day_id ?? (act as any).project_event_day_id ?? pendingJoinId };
                                            }
                                            created.push(act);
                                        }
                                        setActivities(prev => [...prev, ...created]);
                                    } catch (err) {
                                        console.warn('Failed to create activities:', err);
                                    }
                                    if (pendingDayId) setActiveDayId(pendingDayId);
                                    setDayMenuAnchor(null);
                                    setAddDayStep('name');
                                    setPendingDayId(null);
                                    setPendingJoinId(null);
                                    setPendingDayName('');
                                    setSelectedPresets(new Set(ACTIVITY_PRESETS.map(p => p.name)));
                                }}
                                sx={{
                                    height: 28, fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer',
                                    bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
                                    border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px',
                                    '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.25)' },
                                    '&.Mui-disabled': { opacity: 0.4 },
                                }}
                            />
                        </Box>
                    </Box>
                )}
            </Popover>



            {/* ── Body ── */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={20} sx={{ color: '#f59e0b' }} />
                </Box>
            ) : packageEventDays.length === 0 ? (
                /* Empty state */
                <Box sx={{ textAlign: 'center', py: 4, px: 2.5 }}>
                    <Box sx={{
                        width: 44, height: 44, borderRadius: 2, mx: 'auto', mb: 1.5,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52, 58, 68, 0.3)',
                    }}>
                        <CalendarTodayIcon sx={{ fontSize: 20, color: '#334155' }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontSize: '0.7rem' }}>
                        No event days configured
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#334155', display: 'block', fontSize: '0.6rem', mt: 0.25 }}>
                        Add event days to build your schedule
                    </Typography>
                </Box>
            ) : (
                <>
                    {/* ── Filming Hours & Activity Range Bar ── */}
                    {activeDayId && (
                        <Box sx={{
                            px: 2.5, py: 1, display: 'flex', alignItems: 'center', gap: 1,
                            flexWrap: 'wrap', borderBottom: '1px solid rgba(52, 58, 68, 0.15)',
                        }}>
                            {/* Approximate filming hours */}
                            <Chip
                                icon={<AccessTimeIcon sx={{ fontSize: '13px !important', color: '#648CFF !important' }} />}
                                label={`~${filmingSpan.hours}h approx. filming`}
                                size="small"
                                sx={{
                                    height: 24, fontSize: '0.65rem', fontWeight: 600,
                                    bgcolor: 'rgba(100, 140, 255, 0.08)', color: '#648CFF',
                                    border: 'none', '& .MuiChip-icon': { ml: '4px' },
                                }}
                            />
                            {/* Activity range: first → last */}
                            {filmingSpan.firstActivity && filmingSpan.lastActivity && (
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#64748b' }}>
                                    {filmingSpan.firstActivity.name}
                                    {filmingSpan.firstActivity.start_time ? ` (${formatTimeDisplay(filmingSpan.firstActivity.start_time)})` : ''}
                                    {' → '}
                                    {filmingSpan.lastActivity.name}
                                    {filmingSpan.lastActivity.end_time ? ` (${formatTimeDisplay(filmingSpan.lastActivity.end_time)})` : ''}
                                </Typography>
                            )}
                            <Chip
                                label={`${activeDayActivities.length} activit${activeDayActivities.length !== 1 ? 'ies' : 'y'}`}
                                size="small"
                                sx={{ height: 24, fontSize: '0.65rem', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.04)', color: '#64748b', border: 'none', ml: 'auto' }}
                            />
                            {totalDuration > 0 && (
                                <Chip
                                    label={formatDuration(totalDuration)} size="small"
                                    sx={{ height: 24, fontSize: '0.65rem', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.04)', color: '#64748b', border: 'none' }}
                                />
                            )}
                        </Box>
                    )}

                    {/* ── Visual Timeline (Activity Gantt) ── */}
                    {activeDayId && timedCount > 0 && (
                        <Box sx={{
                            mx: 2, mt: 1, mb: 0.5, py: 1.5, px: 0.75,
                            bgcolor: 'rgba(0,0,0,0.2)',
                            borderRadius: 2,
                            border: '1px solid rgba(255,255,255,0.03)',
                        }}>
                            {/* Hour labels */}
                            <Box sx={{ position: 'relative', height: 22, ml: '72px', mb: 0.75 }}>
                                {hourMarkers
                                    .filter((_, i) => i % (hourMarkers.length > 14 ? 2 : 1) === 0)
                                    .map(hour => (
                                        <Typography
                                            key={hour}
                                            sx={{
                                                position: 'absolute', left: `${getPos(hour * 60)}%`,
                                                transform: 'translateX(-50%)', fontSize: '0.6rem',
                                                color: 'rgba(255,255,255,0.35)', fontWeight: 600,
                                                fontFamily: 'monospace', userSelect: 'none',
                                            }}
                                        >
                                            {formatTimeDisplay(`${hour.toString().padStart(2, '0')}:00`)}
                                        </Typography>
                                    ))}
                            </Box>

                            {/* Gantt lanes */}
                            <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
                                {/* Left label */}
                                <Box sx={{
                                    width: 72, minWidth: 72, display: 'flex', alignItems: 'flex-start',
                                    pt: 0.75, pr: 1,
                                    borderRight: '1px solid rgba(255,255,255,0.04)',
                                }}>
                                    <Typography sx={{
                                        fontSize: '0.6rem', fontWeight: 700,
                                        color: 'rgba(245, 158, 11, 0.5)',
                                        textTransform: 'uppercase', letterSpacing: '0.5px',
                                    }}>
                                        Timeline
                                    </Typography>
                                </Box>

                                {/* Lanes area */}
                                <Box
                                    ref={lanesRef}
                                    sx={{
                                        flex: 1, position: 'relative',
                                        borderRadius: '0 6px 6px 0',
                                        overflow: 'visible',
                                        minHeight: laneCount * 34 + 8,
                                    }}
                                >
                                    {/* Grid lines */}
                                    {hourMarkers.map(hour => (
                                        <Box key={hour} sx={{
                                            position: 'absolute', left: `${getPos(hour * 60)}%`,
                                            top: 0, bottom: 0, width: '1px',
                                            bgcolor: hour % 2 === 0
                                                ? 'rgba(255,255,255,0.04)'
                                                : 'rgba(255,255,255,0.015)',
                                        }} />
                                    ))}

                                    {/* Activity blocks in stacked lanes */}
                                    {activeDayActivities.map((act) => {
                                        const rawSMin = parseTimeToMinutes(act.start_time);
                                        if (rawSMin === null) return null;
                                        const rawDur = getActivityDuration(act);
                                        const rawEMin = rawSMin + rawDur;

                                        // Use drag preview if this activity is being dragged
                                        const isDragging = dragPreview?.activityId === act.id;
                                        const sMin = isDragging ? dragPreview!.startMin : rawSMin;
                                        const eMin = isDragging ? dragPreview!.endMin : rawEMin;
                                        const dur = eMin - sMin;

                                        const c = colorOverrides?.[act.id] ?? act.color ?? ACTIVITY_COLORS[act.order_index % ACTIVITY_COLORS.length];
                                        const lane = activityLanes.get(act.id) ?? 0;
                                        const isSelected = selectedActivityId === act.id;

                                        return (
                                            <Tooltip
                                                key={act.id} arrow placement="top"
                                                disableHoverListener={isDragging}
                                                disableFocusListener={isDragging}
                                                disableTouchListener={isDragging}
                                                title={
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{act.name}</Typography>
                                                        <Typography sx={{ fontSize: '0.65rem', opacity: 0.9 }}>
                                                            {formatTimeDisplay(minutesToTime(sMin))} – {formatTimeDisplay(minutesToTime(eMin))} ({formatDuration(dur)})
                                                        </Typography>
                                                        {(act.scene_schedules?.length ?? 0) > 0 && (
                                                            <Typography sx={{ fontSize: '0.6rem', opacity: 0.7 }}>
                                                                {act.scene_schedules!.length} scene{act.scene_schedules!.length !== 1 ? 's' : ''} linked
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                            >
                                                <Box
                                                    onClick={(e) => handleBarClick(e, act.id)}
                                                    onMouseDown={(e) => {
                                                        // Only start move drag on the body (not on resize handles)
                                                        const target = e.target as HTMLElement;
                                                        if (target.dataset.resizeHandle) return;
                                                        handleBarMouseDown(e, act.id, 'move', sMin, eMin);
                                                    }}
                                                    sx={{
                                                        position: 'absolute',
                                                        left: `${getPos(sMin)}%`,
                                                        width: `${Math.max(3, getW(dur))}%`,
                                                        top: lane * 34 + 4,
                                                        height: 26,
                                                        bgcolor: isSelected ? `${c}35` : `${c}18`,
                                                        borderRadius: '5px',
                                                        display: 'flex', alignItems: 'center', px: 1,
                                                        overflow: 'visible', cursor: isDragging ? 'grabbing' : 'pointer',
                                                        border: isSelected ? `1.5px solid ${c}` : `1px solid ${c}30`,
                                                        borderLeft: `3px solid ${c}`,
                                                        transition: isDragging ? 'none' : 'all 0.15s ease',
                                                        zIndex: isDragging ? 10 : isSelected ? 5 : 1,
                                                        boxShadow: isSelected
                                                            ? `0 0 12px ${c}40, 0 2px 8px ${c}25`
                                                            : isDragging
                                                                ? `0 4px 16px rgba(0,0,0,0.4)`
                                                                : 'none',
                                                        userSelect: 'none',
                                                        '&:hover': {
                                                            bgcolor: isSelected ? `${c}40` : `${c}30`,
                                                            borderColor: `${c}60`,
                                                            boxShadow: `0 2px 8px ${c}25`,
                                                            zIndex: isDragging ? 10 : 3,
                                                        },
                                                    }}
                                                >
                                                    {/* Left resize handle */}
                                                    <Box
                                                        data-resize-handle="left"
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            handleBarMouseDown(e, act.id, 'resize-left', sMin, eMin);
                                                        }}
                                                        sx={{
                                                            position: 'absolute',
                                                            left: -2, top: 0, bottom: 0, width: 6,
                                                            cursor: 'ew-resize',
                                                            zIndex: 4,
                                                            '&:hover': {
                                                                bgcolor: `${c}40`,
                                                                borderRadius: '3px 0 0 3px',
                                                            },
                                                        }}
                                                    />

                                                    {/* Activity name label */}
                                                    <Typography sx={{
                                                        fontSize: '0.6rem', fontWeight: 700,
                                                        color: c, lineHeight: 1,
                                                        whiteSpace: 'nowrap', overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        pointerEvents: 'none',
                                                    }}>
                                                        {act.name}
                                                    </Typography>

                                                    {/* Right resize handle */}
                                                    <Box
                                                        data-resize-handle="right"
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            handleBarMouseDown(e, act.id, 'resize-right', sMin, eMin);
                                                        }}
                                                        sx={{
                                                            position: 'absolute',
                                                            right: -2, top: 0, bottom: 0, width: 6,
                                                            cursor: 'ew-resize',
                                                            zIndex: 4,
                                                            '&:hover': {
                                                                bgcolor: `${c}40`,
                                                                borderRadius: '0 3px 3px 0',
                                                            },
                                                        }}
                                                    />
                                                </Box>
                                            </Tooltip>
                                        );
                                    })}
                                </Box>
                            </Box>
                        </Box>
                    )}


                </>
            )}

        </Box>
    );
};

export default PackageScheduleCard;
