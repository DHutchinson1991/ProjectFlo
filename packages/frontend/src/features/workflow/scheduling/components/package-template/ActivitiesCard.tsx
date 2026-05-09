'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';

import { crewSlotsApi, scheduleApi as workflowScheduleApi } from '@/features/workflow/scheduling/api';
import type { UsePlanningProgressReturn } from '@/features/catalog/packages/hooks/usePlanningProgress';
import { PackageActivityTable, type PackageActivityTableActivity, type PackageActivityTableMetricColumn } from '@/shared/ui';
import { ACTIVITY_COLORS, parseTimeToMinutes, formatMinutes, formatSeconds } from '@/shared/ui/PackageTimeline/activity-schedule-helpers';
import { useOptionalScheduleApi } from '../shared/ScheduleApiContext';

interface MomentRecord {
    id: number;
    package_activity_id: number;
    name: string;
    description?: string | null;
    order_index: number;
    duration_seconds: number;
    is_required: boolean;
    notes?: string | null;
    subject_actions?: Record<string, { action: string | null; focal: string } | null> | null;
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
    crewSlots?: any[];
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
    selectedMomentId?: number | null;
    onSelectedMomentChange?: (id: number | null) => void;
    onColorPreview?: (activityId: number | null, color: string | null) => void;
    planning?: UsePlanningProgressReturn;
    onPlanningComplete?: () => void;
}

const PACKAGE_ACTIVITY_METRIC_COLUMNS: PackageActivityTableMetricColumn[] = [
    { key: 'cameras', label: 'Cameras', width: '11%' },
    { key: 'subjects', label: 'Subjects', width: '11%' },
    { key: 'audio', label: 'Audio', width: '11%' },
    { key: 'locations', label: 'Locations', width: '11%' },
];

function getActivityDuration(activity: ActivityRecord): number {
    if (activity.duration_minutes && activity.duration_minutes > 0) return activity.duration_minutes;
    if (activity.start_time && activity.end_time) {
        const start = parseTimeToMinutes(activity.start_time);
        const end = parseTimeToMinutes(activity.end_time);
        if (start !== null && end !== null && end > start) return end - start;
    }
    return 0;
}

export const ActivitiesCard: React.FC<ActivitiesCardProps> = ({
    packageId,
    packageEventDays,
    activities,
    setActivities,
    activeDayId,
    cardSx,
    packageSubjects = [],
    packageLocationSlots = [],
    PackageCrewSlots = [],
    selectedActivityId,
    onSelectedActivityChange,
    selectedMomentId,
    onSelectedMomentChange,
    planning,
    onPlanningComplete,
}) => {
    const completeFiredRef = useRef(false);
    const completionMomentRefreshRef = useRef(false);
    const fetchedMomentsRef = useRef<Set<string>>(new Set());
    const activitiesRef = useRef(activities);
    activitiesRef.current = activities;
    const [momentLoadingIds, setMomentLoadingIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (planning?.status === 'complete' && !completeFiredRef.current) {
            completeFiredRef.current = true;
            const timer = setTimeout(() => onPlanningComplete?.(), 200);
            return () => clearTimeout(timer);
        }
    }, [planning?.status, onPlanningComplete]);

    useEffect(() => {
        if (planning?.status === 'connecting') {
            fetchedMomentsRef.current.clear();
            completeFiredRef.current = false;
            completionMomentRefreshRef.current = false;
        }
    }, [planning?.status]);

    useEffect(() => {
        if (planning?.status !== 'complete' || completionMomentRefreshRef.current || activities.length === 0) {
            return;
        }

        completionMomentRefreshRef.current = true;
        let cancelled = false;

        void Promise.all(
            activities.map(async (activity) => [
                activity.id,
                await workflowScheduleApi.packageActivityMoments.getAll(activity.id),
            ] as const),
        ).then((entries) => {
            if (cancelled) return;
            const momentsByActivityId = new Map(entries);
            setActivities((previous) => previous.map((activity) => {
                const refreshedMoments = momentsByActivityId.get(activity.id);
                return refreshedMoments ? { ...activity, moments: refreshedMoments } : activity;
            }));
        }).catch((error) => {
            console.warn('Failed to refresh activity moments after planning completion:', error);
            completionMomentRefreshRef.current = false;
        });

        return () => {
            cancelled = true;
        };
    }, [activities, planning?.status, setActivities]);

    useEffect(() => {
        if (!planning || planning.status === 'idle') return;
        for (const step of planning.steps) {
            if (step.step !== 'activity-moments' || step.status !== 'completed' || !step.activityName) continue;
            if (fetchedMomentsRef.current.has(step.activityName)) continue;
            fetchedMomentsRef.current.add(step.activityName);
            const matchedActivity = activitiesRef.current.find((activity) => activity.name === step.activityName);
            if (!matchedActivity) continue;
            const activityId = matchedActivity.id;
            setMomentLoadingIds((previous) => new Set(previous).add(activityId));
            workflowScheduleApi.packageActivityMoments.getAll(activityId)
                .then((fetched) => {
                    setActivities((previous) => previous.map((activity) => (
                        activity.id === activityId ? { ...activity, moments: fetched } : activity
                    )));
                    setMomentLoadingIds((previous) => {
                        const next = new Set(previous);
                        next.delete(activityId);
                        return next;
                    });
                })
                .catch(() => {
                    setMomentLoadingIds((previous) => {
                        const next = new Set(previous);
                        next.delete(activityId);
                        return next;
                    });
                });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planning?.steps]);

    const contextApi = useOptionalScheduleApi();
    const hasOwner = !!contextApi || !!packageId;

    const activityApi = contextApi?.activities ?? {
        create: (dayId: number, data: any) => workflowScheduleApi.packageActivities.create(packageId!, { package_event_day_id: dayId, ...data }), // eslint-disable-line @typescript-eslint/no-explicit-any
        delete: (id: number) => workflowScheduleApi.packageActivities.delete(id),
    };
    const momentApi = contextApi?.moments ?? {
        create: (activityId: number, data: any) => workflowScheduleApi.packageActivityMoments.create(activityId, data), // eslint-disable-line @typescript-eslint/no-explicit-any
        delete: (id: number) => workflowScheduleApi.packageActivityMoments.delete(id),
    };

    const activeDayJoinId = packageEventDays.find((day) => day.id === activeDayId)?._joinId;
    const dayActivities = useMemo(() => activities
        .filter((activity) => activity.package_event_day_id === activeDayJoinId)
        .sort((left, right) => {
            const leftStart = parseTimeToMinutes(left.start_time);
            const rightStart = parseTimeToMinutes(right.start_time);
            if (leftStart === null && rightStart === null) return (left.order_index ?? 0) - (right.order_index ?? 0);
            if (leftStart === null) return 1;
            if (rightStart === null) return -1;
            return leftStart - rightStart;
        }), [activities, activeDayJoinId]);

    const daySubjects = useMemo(() => packageSubjects.filter((subject) => subject.event_day_template_id === activeDayId), [packageSubjects, activeDayId]);
    const dayLocationSlots = useMemo(() => packageLocationSlots.filter((slot) => slot.event_day_template_id === activeDayId), [packageLocationSlots, activeDayId]);
    const dayCrew = useMemo(() => PackageCrewSlots.filter((slot) => slot.event_day_template_id === activeDayId), [PackageCrewSlots, activeDayId]);
    const activePlanningStep = planning?.activeStep ?? null;

    const handleDeleteActivity = useCallback(async (id: number) => {
        try {
            await activityApi.delete(id);
            setActivities((previous) => previous.filter((activity) => activity.id !== id));
        } catch (error) {
            console.warn('Failed to delete activity:', error);
        }
    }, [activityApi, setActivities]);

    const handleAddActivity = useCallback(async (name: string) => {
        if (!name || !hasOwner || !activeDayJoinId) return;
        try {
            const created = await activityApi.create(activeDayJoinId, {
                name,
                color: ACTIVITY_COLORS[dayActivities.length % ACTIVITY_COLORS.length],
                order_index: dayActivities.length,
            });
            setActivities((previous) => [...previous, created]);
            onSelectedActivityChange?.(created.id);
        } catch (error) {
            console.warn('Failed to create activity:', error);
        }
    }, [activeDayJoinId, activityApi, dayActivities.length, hasOwner, onSelectedActivityChange, setActivities]);

    const handleAddMoment = useCallback(async (activityId: number, name: string, durationSeconds: number) => {
        if (!name) return;
        try {
            const existing = activities.find((activity) => activity.id === activityId)?.moments ?? [];
            const created = await momentApi.create(activityId, {
                name,
                duration_seconds: durationSeconds || 30,
                order_index: existing.length,
            });
            setActivities((previous) => previous.map((activity) => (
                activity.id === activityId ? { ...activity, moments: [...(activity.moments ?? []), created] } : activity
            )));
        } catch (error) {
            console.warn('Failed to add moment:', error);
        }
    }, [activities, momentApi, setActivities]);

    const handleDeleteMoment = useCallback(async (activityId: number, momentId: number) => {
        try {
            await momentApi.delete(momentId);
            setActivities((previous) => previous.map((activity) => (
                activity.id === activityId
                    ? { ...activity, moments: (activity.moments ?? []).filter((moment) => moment.id !== momentId) }
                    : activity
            )));
        } catch (error) {
            console.warn('Failed to delete moment:', error);
        }
    }, [momentApi, setActivities]);

    const tableActivities = useMemo<PackageActivityTableActivity[]>(() => dayActivities.map((activity) => {
        const color = activity.color || ACTIVITY_COLORS[(activity.order_index ?? 0) % ACTIVITY_COLORS.length];
        const duration = getActivityDuration(activity);
        const activePlanningMatchesActivity = activePlanningStep?.activityName === activity.name;
        const activeMomentId = activePlanningMatchesActivity ? activePlanningStep?.momentId : undefined;
        const activeMomentStep = activePlanningMatchesActivity ? activePlanningStep?.step : undefined;

        const isAssignedToActivity = (subject: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
            subject.activity_assignments?.some((assignment: { package_activity_id: number }) => assignment.package_activity_id === activity.id) ||
            (!subject.activity_assignments?.length && subject.package_activity_id === activity.id);
        const assignedSubjects = daySubjects.filter(isAssignedToActivity);
        const keySubjectCount = assignedSubjects
            .filter((subject: any) => (subject.name as string).toLowerCase() !== 'guests') // eslint-disable-line @typescript-eslint/no-explicit-any
            .reduce((sum: number, subject: any) => sum + (subject.count != null ? (subject.count as number) : 1), 0); // eslint-disable-line @typescript-eslint/no-explicit-any
        const guestCount = assignedSubjects
            .filter((subject: any) => (subject.name as string).toLowerCase() === 'guests') // eslint-disable-line @typescript-eslint/no-explicit-any
            .reduce((sum: number, subject: any) => sum + (subject.count != null ? (subject.count as number) : 1), 0); // eslint-disable-line @typescript-eslint/no-explicit-any
        const subjectCount = keySubjectCount + guestCount;
        const locationCount = dayLocationSlots.filter((slot) =>
            slot.activity_assignments?.some((assignment: { package_activity_id: number }) => assignment.package_activity_id === activity.id)
        ).length;
        const isAssignedToCrew = (slot: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
            slot.activity_assignments?.some((assignment: { package_activity_id: number }) => assignment.package_activity_id === activity.id) ||
            (!slot.activity_assignments?.length && !slot.package_activity_id) ||
            (!slot.activity_assignments?.length && slot.package_activity_id === activity.id);
        const assignedCrew = dayCrew.filter(isAssignedToCrew);
        const cameraCount = new Set(assignedCrew.flatMap((slot: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
            (slot.equipment || [])
                .filter((equipment: any) => (equipment.equipment?.category || 'CAMERA') !== 'AUDIO') // eslint-disable-line @typescript-eslint/no-explicit-any
                .map((equipment: any) => equipment.equipment_id), // eslint-disable-line @typescript-eslint/no-explicit-any
        )).size;
        const audioCount = new Set(assignedCrew.flatMap((slot: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
            (slot.equipment || [])
                .filter((equipment: any) => equipment.equipment?.category === 'AUDIO') // eslint-disable-line @typescript-eslint/no-explicit-any
                .map((equipment: any) => equipment.equipment_id), // eslint-disable-line @typescript-eslint/no-explicit-any
        )).size;

        return {
            id: activity.id,
            name: activity.name,
            color,
            durationLabel: duration > 0 ? formatMinutes(duration) : '—',
            metrics: {
                cameras: cameraCount || null,
                subjects: subjectCount || null,
                audio: audioCount || null,
                locations: locationCount || null,
            },
            moments: (activity.moments ?? []).map((moment) => ({
                id: moment.id,
                name: moment.name,
                durationLabel: formatSeconds(moment.duration_seconds),
                isActive: momentLoadingIds.has(activity.id) || (activeMomentId === moment.id && (activeMomentStep === 'activity-casting' || activeMomentStep === 'activity-actions')),
                activeColor: activeMomentStep === 'activity-actions' ? '#22c55e' : '#38bdf8',
            })),
        };
    }), [activePlanningStep?.activityName, activePlanningStep?.momentId, activePlanningStep?.step, dayActivities, dayCrew, dayLocationSlots, daySubjects, momentLoadingIds]);

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
        <PackageActivityTable
            activities={tableActivities}
            metricColumns={PACKAGE_ACTIVITY_METRIC_COLUMNS}
            selectedActivityId={selectedActivityId}
            selectedMomentId={selectedMomentId}
            onSelectActivity={(activityId) => onSelectedActivityChange?.(selectedActivityId === activityId ? null : activityId)}
            onSelectMoment={(_, momentId) => onSelectedMomentChange?.(selectedMomentId === momentId ? null : momentId)}
            onAddActivity={hasOwner && activeDayJoinId ? handleAddActivity : undefined}
            onDeleteActivity={handleDeleteActivity}
            onAddMoment={handleAddMoment}
            onDeleteMoment={handleDeleteMoment}
        />
    );
};

export default ActivitiesCard;
