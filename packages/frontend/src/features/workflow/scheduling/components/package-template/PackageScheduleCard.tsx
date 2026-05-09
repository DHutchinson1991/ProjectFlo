'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Chip, Divider, Popover, TextField, Typography } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckIcon from '@mui/icons-material/Check';

import { PackageTimeline, type PackageTimelineActivity, type PackageTimelineDay } from '@/shared/ui/PackageTimeline';
import { ACTIVITY_COLORS, parseTimeToMinutes } from '@/shared/ui/PackageTimeline/activity-schedule-helpers';
import { scheduleApi as workflowScheduleApi } from '@/features/workflow/scheduling/api';
import { useOptionalScheduleApi } from '../shared/ScheduleApiContext';

interface EventDay {
    id: number;
    name: string;
    order_index: number;
    description?: string | null;
    _joinId?: number;
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
    crewSlots?: any[];
}

interface CrewSlotRecord {
    id: number;
    crew_id?: number | null;
    event_day_template_id: number;
    package_activity_id?: number | null;
    label?: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    crew?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    job_role?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    equipment?: any[];
}

interface EventDayCreateResult {
    id: number;
    name?: string;
    order_index?: number;
}

interface EventDayJoinResult {
    id: number;
    _joinId?: number;
}

interface DayCoverage {
    mode: 'hours' | 'window';
    hours?: number;
    window?: { from: string; to: string };
}

interface PackageTimelineCardProps {
    packageId: number | null;
    brandId: number;
    packageEventDays: EventDay[];
    setPackageEventDays: React.Dispatch<React.SetStateAction<EventDay[]>>;
    PackageCrewSlots: CrewSlotRecord[];
    dayCoverage?: Record<number, DayCoverage>;
    onDayCoverageChange?: (dayId: number, coverage: DayCoverage) => void;
    cardSx: Record<string, unknown>;
    activeDayId?: number | null;
    onActiveDayChange?: (dayId: number | null) => void;
    selectedActivityId?: number | null;
    onSelectedActivityChange?: (id: number | null) => void;
    onActivityTimeChange?: (activityId: number, startTime: string, endTime: string) => void;
    colorOverrides?: Record<number, string>;
    externalActivities?: ActivityRecord[];
}

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


export const PackageTimelineCard: React.FC<PackageTimelineCardProps> = ({
    packageId,
    brandId,
    packageEventDays,
    setPackageEventDays,
    PackageCrewSlots: _PackageCrewSlots,
    dayCoverage: _dayCoverage,
    onDayCoverageChange: _onDayCoverageChange,
    cardSx: _cardSx,
    activeDayId: controlledDayId,
    onActiveDayChange,
    selectedActivityId,
    onSelectedActivityChange,
    onActivityTimeChange,
    colorOverrides,
    externalActivities,
}) => {
    const contextApi = useOptionalScheduleApi();
    const [loading, setLoading] = useState(false);
    const [activities, setActivities] = useState<ActivityRecord[]>([]);
    const [localDayId, setLocalDayId] = useState<number | null>(null);
    const activeDayId = controlledDayId !== undefined ? controlledDayId : localDayId;
    const setActiveDayId = useCallback((id: number | null) => {
        if (onActiveDayChange) onActiveDayChange(id);
        else setLocalDayId(id);
    }, [onActiveDayChange]);

    const [dayMenuAnchor, setDayMenuAnchor] = useState<null | HTMLElement>(null);
    const [brandEventDays, setBrandEventDays] = useState<EventDay[]>([]);
    const [newDayName, setNewDayName] = useState('');
    const [addDayStep, setAddDayStep] = useState<'name' | 'activities'>('name');
    const [pendingDayName, setPendingDayName] = useState('');
    const [pendingDayId, setPendingDayId] = useState<number | null>(null);
    const [pendingJoinId, setPendingJoinId] = useState<number | null>(null);
    const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set(ACTIVITY_PRESETS.map(preset => preset.name)));
    const prevColorOverridesRef = useRef<Record<number, string>>({});

    useEffect(() => {
        if (packageEventDays.length > 0 && activeDayId == null) {
            setActiveDayId(packageEventDays[0].id);
        }
    }, [packageEventDays, activeDayId, setActiveDayId]);

    const activePackageEventDayId = useMemo(() => {
        if (!activeDayId) return null;
        const eventDay = packageEventDays.find(day => day.id === activeDayId);
        return eventDay?._joinId ?? null;
    }, [activeDayId, packageEventDays]);

    const loadActivities = useCallback(async () => {
        if (!packageId) return;
        setLoading(true);
        try {
            const all = await workflowScheduleApi.packageActivities.getAll(packageId) as ActivityRecord[];
            setActivities(all);
        } catch (error) {
            console.warn('Failed to load package activities:', error);
        } finally {
            setLoading(false);
        }
    }, [packageId]);

    useEffect(() => {
        loadActivities();
    }, [loadActivities]);

    useEffect(() => {
        if (!packageId && externalActivities) {
            setActivities(externalActivities);
        }
    }, [packageId, externalActivities]);

    useEffect(() => {
        const previous = prevColorOverridesRef.current;
        const current = colorOverrides ?? {};
        if (Object.keys(current).length === 0 && Object.keys(previous).length > 0) {
            setActivities(currentActivities => currentActivities.map(activity => (
                previous[activity.id] ? { ...activity, color: previous[activity.id] } : activity
            )));
        }
        prevColorOverridesRef.current = current;
    }, [colorOverrides]);

    const activeDayActivities = useMemo(() => {
        if (!activePackageEventDayId) return [];
        return activities
            .filter(activity => activity.package_event_day_id === activePackageEventDayId)
            .sort((left, right) => {
                const leftStart = parseTimeToMinutes(left.start_time);
                const rightStart = parseTimeToMinutes(right.start_time);
                if (leftStart !== null && rightStart !== null) return leftStart - rightStart;
                if (leftStart !== null) return -1;
                if (rightStart !== null) return 1;
                return left.order_index - right.order_index;
            });
    }, [activePackageEventDayId, activities]);

    const timelineDays = useMemo<PackageTimelineDay[]>(() => packageEventDays.map(day => ({
        id: day.id,
        name: day.name,
        activityCount: activities.filter(activity => activity.package_event_day_id === day._joinId).length,
    })), [activities, packageEventDays]);

    const timelineActivities = useMemo<PackageTimelineActivity[]>(() => activeDayActivities.map(activity => ({
        id: activity.id,
        name: activity.name,
        color: colorOverrides?.[activity.id] ?? activity.color ?? ACTIVITY_COLORS[activity.order_index % ACTIVITY_COLORS.length],
        startTime: activity.start_time,
        endTime: activity.end_time,
        durationMinutes: activity.duration_minutes,
        orderIndex: activity.order_index,
        sceneCount: activity.scene_schedules?.length ?? 0,
    })), [activeDayActivities, colorOverrides]);

    const resetAddDayMenu = useCallback(() => {
        setDayMenuAnchor(null);
        setNewDayName('');
        setAddDayStep('name');
        setPendingDayName('');
        setPendingDayId(null);
        setPendingJoinId(null);
        setSelectedPresets(new Set(ACTIVITY_PRESETS.map(preset => preset.name)));
    }, []);

    const handleOpenAddDay = useCallback(async (event: React.MouseEvent<HTMLElement>) => {
        const anchor = event.currentTarget;
        try {
            const all = contextApi?.brandEventDays
                ? await contextApi.brandEventDays.getAll(brandId) as EventDay[]
                : await workflowScheduleApi.eventDays.getAll(brandId) as EventDay[];
            setBrandEventDays(all);
        } catch {
            // Keep existing cache if day-template loading fails.
        }
        setDayMenuAnchor(anchor);
    }, [brandId, contextApi]);

    const addExistingBrandDay = useCallback(async (brandDay: EventDay) => {
        try {
            if (packageId) {
                const result = await workflowScheduleApi.packageEventDays.add(packageId, brandDay.id) as EventDayJoinResult;
                setPendingDayId(brandDay.id);
                setPendingJoinId(result._joinId ?? result.id);
                setPendingDayName(brandDay.name);
                setPackageEventDays(previous => [...previous, { ...brandDay, _joinId: result._joinId ?? result.id }]);
            } else if (contextApi) {
                const result = await contextApi.eventDays.create({ name: brandDay.name, event_day_template_id: brandDay.id }) as EventDayCreateResult;
                setPendingDayId(result.id);
                setPendingJoinId(result.id);
                setPendingDayName(brandDay.name);
                setPackageEventDays(previous => [...previous, { ...brandDay, id: result.id, _joinId: result.id }]);
            } else {
                return;
            }
            setAddDayStep('activities');
        } catch (error) {
            console.warn('Failed to add event day:', error);
        }
    }, [contextApi, packageId, setPackageEventDays]);

    const createNewDay = useCallback(async () => {
        const trimmedName = newDayName.trim();
        if (!trimmedName || (!packageId && !contextApi)) return;
        try {
            if (packageId) {
                const created = await workflowScheduleApi.eventDays.create(brandId, { name: trimmedName }) as EventDayCreateResult;
                const result = await workflowScheduleApi.packageEventDays.add(packageId, created.id) as EventDayJoinResult;
                setPendingDayId(created.id);
                setPendingJoinId(result._joinId ?? result.id);
                setPendingDayName(created.name || trimmedName);
                setPackageEventDays(previous => [...previous, {
                    id: created.id,
                    name: created.name || trimmedName,
                    order_index: created.order_index ?? previous.length,
                    _joinId: result._joinId ?? result.id,
                }]);
            } else if (contextApi) {
                const result = await contextApi.eventDays.create({ name: trimmedName }) as EventDayCreateResult;
                setPendingDayId(result.id);
                setPendingJoinId(result.id);
                setPendingDayName(result.name || trimmedName);
                setPackageEventDays(previous => [...previous, {
                    id: result.id,
                    name: result.name || trimmedName,
                    order_index: previous.length,
                    _joinId: result.id,
                }]);
            }
            setNewDayName('');
            setAddDayStep('activities');
        } catch (error) {
            console.warn('Failed to create event day:', error);
        }
    }, [brandId, contextApi, newDayName, packageId, setPackageEventDays]);

    const createPresetActivities = useCallback(async () => {
        if ((!packageId && !contextApi) || !pendingJoinId) return;
        const presetsToCreate = ACTIVITY_PRESETS.filter(preset => selectedPresets.has(preset.name));
        try {
            const createdActivities: ActivityRecord[] = [];
            for (let index = 0; index < presetsToCreate.length; index += 1) {
                const preset = presetsToCreate[index];
                let activity: ActivityRecord;
                if (packageId) {
                    activity = await workflowScheduleApi.packageActivities.create(packageId, {
                        package_event_day_id: pendingJoinId,
                        name: preset.name,
                        color: preset.color,
                        order_index: index,
                    }) as ActivityRecord;
                } else {
                    activity = await contextApi!.activities.create(pendingJoinId, {
                        name: preset.name,
                        color: preset.color,
                        order_index: index,
                    }) as ActivityRecord;
                    activity = {
                        ...activity,
                        package_event_day_id: activity.package_event_day_id ?? (activity as { project_event_day_id?: number }).project_event_day_id ?? pendingJoinId,
                    };
                }
                createdActivities.push(activity);
            }
            setActivities(previous => [...previous, ...createdActivities]);
        } catch (error) {
            console.warn('Failed to create activities:', error);
        }
        if (pendingDayId) setActiveDayId(pendingDayId);
        resetAddDayMenu();
    }, [contextApi, packageId, pendingDayId, pendingJoinId, resetAddDayMenu, selectedPresets, setActiveDayId]);

    const handleRemoveDay = useCallback((dayId: number) => {
        setPackageEventDays(previous => previous.filter(day => day.id !== dayId));
        if (activeDayId === dayId) {
            setActiveDayId(packageEventDays.find(day => day.id !== dayId)?.id || null);
        }
        if (packageId) {
            workflowScheduleApi.packageEventDays.remove(packageId, dayId).catch(() => undefined);
        } else if (contextApi) {
            contextApi.eventDays.delete(dayId).catch(() => undefined);
        }
    }, [activeDayId, contextApi, packageEventDays, packageId, setActiveDayId, setPackageEventDays]);

    const handleMoveDay = useCallback((fromDayId: number, toDayId: number) => {
        setPackageEventDays(previous => {
            const next = [...previous];
            const fromIndex = next.findIndex(day => day.id === fromDayId);
            const toIndex = next.findIndex(day => day.id === toDayId);
            if (fromIndex === -1 || toIndex === -1) return previous;
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    }, [setPackageEventDays]);

    const handleSelectActivity = useCallback((activityId: number) => {
        onSelectedActivityChange?.(selectedActivityId === activityId ? null : activityId);
    }, [onSelectedActivityChange, selectedActivityId]);

    const handleActivityTimeChange = useCallback((activityId: number, startTime: string, endTime: string) => {
        onActivityTimeChange?.(activityId, startTime, endTime);
        const start = parseTimeToMinutes(startTime);
        const end = parseTimeToMinutes(endTime);
        setActivities(previous => previous.map(activity => (
            activity.id === activityId
                ? { ...activity, start_time: startTime, end_time: endTime, duration_minutes: start !== null && end !== null ? end - start : activity.duration_minutes }
                : activity
        )));
    }, [onActivityTimeChange]);

    return (
        <Box sx={{ overflow: 'hidden' }}>
            <PackageTimeline
                days={timelineDays}
                activities={timelineActivities}
                activeDayId={activeDayId ?? null}
                selectedActivityId={selectedActivityId}
                loading={loading}
                onSelectDay={setActiveDayId}
                onSelectActivity={handleSelectActivity}
                onAddDay={packageId || contextApi ? handleOpenAddDay : undefined}
                onRemoveDay={packageId || contextApi ? handleRemoveDay : undefined}
                onMoveDay={handleMoveDay}
                onActivityTimeChange={onActivityTimeChange ? handleActivityTimeChange : undefined}
            />

            <Popover
                anchorEl={dayMenuAnchor}
                open={Boolean(dayMenuAnchor)}
                onClose={resetAddDayMenu}
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
                <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: addDayStep === 'name' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        border: addDayStep === 'name' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                    }}>
                        {addDayStep === 'name'
                            ? <CalendarTodayIcon sx={{ fontSize: 13, color: '#f59e0b' }} />
                            : <CheckIcon sx={{ fontSize: 13, color: '#10b981' }} />}
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 }}>
                            {addDayStep === 'name' ? 'Add Event Day' : `Setup "${pendingDayName}"`}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: '#64748b', lineHeight: 1.2 }}>
                            {addDayStep === 'name' ? 'Choose or create an event day' : 'Pick activities for this day'}
                        </Typography>
                    </Box>
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: addDayStep === 'activities' ? '#f59e0b' : 'rgba(255,255,255,0.1)' }} />
                    </Box>
                </Box>

                {addDayStep === 'name' && (
                    <Box sx={{ py: 1 }}>
                        {brandEventDays.filter(brandDay => !packageEventDays.some(packageDay => packageDay.id === brandDay.id)).length > 0 && (
                            <Box sx={{ mb: 1 }}>
                                <Typography sx={{ px: 2.5, py: 0.5, fontSize: '0.55rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Existing Days
                                </Typography>
                                {brandEventDays
                                    .filter(brandDay => !packageEventDays.some(packageDay => packageDay.id === brandDay.id))
                                    .map(brandDay => (
                                        <Box
                                            key={brandDay.id}
                                            onClick={() => addExistingBrandDay(brandDay)}
                                            sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2.5, py: 1, cursor: 'pointer', transition: 'all 0.15s ease', '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.06)' } }}
                                        >
                                            <CalendarTodayIcon sx={{ fontSize: 14, color: '#f59e0b', opacity: 0.7 }} />
                                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#e2e8f0' }}>{brandDay.name}</Typography>
                                        </Box>
                                    ))}
                                <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)', mt: 0.5 }} />
                            </Box>
                        )}
                        <Typography sx={{ px: 2.5, py: 0.5, fontSize: '0.55rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Create New
                        </Typography>
                        <Box sx={{ px: 2, pb: 1.5, display: 'flex', gap: 0.75 }}>
                            <TextField
                                placeholder="e.g. Wedding Day, Rehearsal Dinner..."
                                value={newDayName}
                                onChange={event => setNewDayName(event.target.value)}
                                onKeyDown={event => { if (event.key === 'Enter') createNewDay(); }}
                                size="small"
                                autoFocus
                                sx={{
                                    flex: 1,
                                    '& .MuiOutlinedInput-root': {
                                        height: 34, fontSize: '0.72rem', color: '#e2e8f0', borderRadius: 2,
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
                                onClick={createNewDay}
                                sx={{
                                    height: 34, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                                    bgcolor: newDayName.trim() ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.04)',
                                    color: newDayName.trim() ? '#f59e0b' : '#334155',
                                    border: newDayName.trim() ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '8px', '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.25)' },
                                    '&.Mui-disabled': { opacity: 0.4, color: '#334155' },
                                }}
                            />
                        </Box>
                    </Box>
                )}

                {addDayStep === 'activities' && (
                    <Box sx={{ py: 1 }}>
                        <Box sx={{ px: 2.5, pb: 0.75, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography onClick={() => setSelectedPresets(new Set(ACTIVITY_PRESETS.map(preset => preset.name)))} sx={{ fontSize: '0.58rem', fontWeight: 600, color: '#648CFF', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                                Select All
                            </Typography>
                            <Typography sx={{ fontSize: '0.5rem', color: '#334155' }}>•</Typography>
                            <Typography onClick={() => setSelectedPresets(new Set())} sx={{ fontSize: '0.58rem', fontWeight: 600, color: '#648CFF', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                                None
                            </Typography>
                            <Typography sx={{ ml: 'auto', fontSize: '0.55rem', color: '#475569' }}>{selectedPresets.size} selected</Typography>
                        </Box>
                        <Box sx={{ px: 1.5, maxHeight: 260, overflow: 'auto' }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                                {ACTIVITY_PRESETS.map(preset => {
                                    const checked = selectedPresets.has(preset.name);
                                    return (
                                        <Box
                                            key={preset.name}
                                            onClick={() => setSelectedPresets(previous => {
                                                const next = new Set(previous);
                                                if (next.has(preset.name)) next.delete(preset.name);
                                                else next.add(preset.name);
                                                return next;
                                            })}
                                            sx={{
                                                display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.75, borderRadius: 1.5, cursor: 'pointer',
                                                bgcolor: checked ? `${preset.color}12` : 'transparent',
                                                border: checked ? `1px solid ${preset.color}30` : '1px solid transparent',
                                                transition: 'all 0.12s ease', '&:hover': { bgcolor: `${preset.color}18` },
                                            }}
                                        >
                                            <Box sx={{
                                                width: 16, height: 16, borderRadius: 1, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                bgcolor: checked ? preset.color : 'transparent',
                                                border: checked ? `2px solid ${preset.color}` : '2px solid rgba(255,255,255,0.15)',
                                                transition: 'all 0.12s ease',
                                            }}>
                                                {checked && <CheckIcon sx={{ fontSize: 10, color: '#fff' }} />}
                                            </Box>
                                            <Typography sx={{ fontSize: '0.62rem', fontWeight: 600, color: checked ? '#e2e8f0' : '#94a3b8', lineHeight: 1.2 }}>
                                                {preset.name}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)', mt: 1 }} />
                        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'flex-end', gap: 0.75 }}>
                            <Chip
                                label="Skip"
                                size="small"
                                onClick={() => { if (pendingDayId) setActiveDayId(pendingDayId); resetAddDayMenu(); }}
                                sx={{ height: 28, fontSize: '0.6rem', fontWeight: 600, cursor: 'pointer', bgcolor: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
                            />
                            <Chip
                                label={`Add ${selectedPresets.size} activit${selectedPresets.size !== 1 ? 'ies' : 'y'}`}
                                size="small"
                                disabled={selectedPresets.size === 0}
                                onClick={createPresetActivities}
                                sx={{ height: 28, fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer', bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.25)' }, '&.Mui-disabled': { opacity: 0.4 } }}
                            />
                        </Box>
                    </Box>
                )}
            </Popover>
        </Box>
    );
};

export default PackageTimelineCard;
