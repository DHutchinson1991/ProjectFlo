'use client';

import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import {
  useCreateActivity,
  useCreateMoment,
  useDeleteActivity,
  useDeleteMoment,
} from '../hooks';
import type { DayBlueprintAiProgressEvent } from '../hooks';
import type { DayBlueprintActivity, DayBlueprintDay, DayBlueprintMoment, DayBlueprintVersionDetail } from '../types';
import { sanitizeStreamingMomentDisplayName } from './day-blueprint-streaming-moment-name';
import {
  PackageActivityTable,
  type PackageActivityTableActivity,
  type PackageActivityTableMetricColumn,
  type PackageActivityTableMoment,
} from '@/shared/ui/PackageActivityTable';
import { ACTIVITY_COLORS, parseTimeToMinutes, formatMinutes, formatSeconds } from '@/shared/ui/PackageTimeline/activity-schedule-helpers';

interface DayBlueprintActivitiesRailProps {
  day: DayBlueprintDay | null;
  selectedActivityId: number | null;
  selectedMomentId: number | null;
  onSelectActivity: (activityId: number | null) => void;
  onSelectMoment: (activityId: number, momentId: number) => void;
  isDraft: boolean;
  blueprintId: number;
  versionId: number;
  version: DayBlueprintVersionDetail;
  /** When true, new moments inherit the prior moment's actions/placements (blank-wizard blueprints). */
  blankAuthoring?: boolean;
  onCommitMomentDuration?: (activityId: number, momentId: number, durationSeconds: number) => void | Promise<void>;
  isGeneratingMoments?: boolean;
  pendingMomentsByActivity?: Record<number, PendingDayBlueprintMomentPreview[]>;
  aiProgressEvents?: ReadonlyArray<DayBlueprintAiProgressEvent>;
  aiProgressCurrentLabel?: string;
}

export interface PendingDayBlueprintMomentPreview {
  key: string;
  activityId: number;
  name: string;
  durationSeconds: number;
  orderIndex: number;
  actionCount?: number;
  placementCount?: number;
}

const BLUEPRINT_ACTIVITY_METRIC_COLUMNS: PackageActivityTableMetricColumn[] = [
  { key: 'subjects', label: 'Subjects', width: '11%' },
  { key: 'locations', label: 'Locations', width: '11%' },
];

function momentMinutes(moment: DayBlueprintMoment): number {
  if (moment.duration_seconds != null) return Math.round(moment.duration_seconds / 60);
  if (moment.expected_duration_minutes != null) return moment.expected_duration_minutes;
  return 0;
}

function activityTotals(activity: DayBlueprintActivity) {
  const moments = activity.moments ?? [];
  const momentMin = moments.reduce((sum, moment) => sum + momentMinutes(moment), 0);
  const planned = activity.default_duration_minutes ?? momentMin;
  return { momentCount: moments.length, momentMin, planned };
}

export function DayBlueprintActivitiesRail({
  day,
  selectedActivityId,
  selectedMomentId,
  onSelectActivity,
  onSelectMoment,
  isDraft,
  blueprintId,
  versionId,
  version,
  blankAuthoring = false,
  onCommitMomentDuration,
  isGeneratingMoments = false,
  pendingMomentsByActivity = {},
  aiProgressEvents = [],
  aiProgressCurrentLabel = '',
}: DayBlueprintActivitiesRailProps) {
  const createActivity = useCreateActivity(blueprintId, versionId);
  const deleteActivity = useDeleteActivity(blueprintId, versionId);
  const createMoment = useCreateMoment(blueprintId, versionId);
  const deleteMoment = useDeleteMoment(blueprintId, versionId);

  const roleTypicalCounts = useMemo(() => new Map(
    (version.subject_roles ?? []).map((link) => [link.subject_role_id, Math.max(link.typical_count ?? 1, 1)]),
  ), [version.subject_roles]);
  const spaceSlotLocationRoleIds = useMemo(() => new Map(
    (version.space_slots ?? []).map((slot) => [slot.id, slot.day_blueprint_location_role_id]),
  ), [version.space_slots]);

  const dayActivities = useMemo(() => [...(day?.activities ?? [])].sort((left, right) => {
    const leftStart = parseTimeToMinutes(left.default_start_time);
    const rightStart = parseTimeToMinutes(right.default_start_time);
    if (leftStart != null && rightStart != null) return leftStart - rightStart;
    if (leftStart != null) return -1;
    if (rightStart != null) return 1;
    return left.order_index - right.order_index;
  }), [day]);

  const autoExpandActivityIds = useMemo(() => {
    if (!isGeneratingMoments || !day) return [];
    const ids = new Set<number>();
    for (const key of Object.keys(pendingMomentsByActivity)) {
      ids.add(Number(key));
    }
    for (let i = aiProgressEvents.length - 1; i >= 0; i -= 1) {
      const activityId = aiProgressEvents[i]?.data?.activityId;
      if (typeof activityId === 'number') {
        ids.add(activityId);
        break;
      }
    }
    const trimmed = aiProgressCurrentLabel.trim();
    const expanding = /^Expanding\s+(.+)$/i.exec(trimmed);
    if (expanding) {
      const target = expanding[1].trim().toLowerCase();
      for (const act of dayActivities) {
        if (act.name?.trim().toLowerCase() === target) {
          ids.add(act.id);
          break;
        }
      }
    }
    if (ids.size === 0 && dayActivities[0]) {
      ids.add(dayActivities[0].id);
    }
    return Array.from(ids);
  }, [
    aiProgressCurrentLabel,
    aiProgressEvents,
    day,
    dayActivities,
    isGeneratingMoments,
    pendingMomentsByActivity,
  ]);

  const subjectCountForActivity = (activity: DayBlueprintActivity) => {
    const roleIds = new Set<number>();
    for (const moment of activity.moments ?? []) {
      for (const action of moment.actions ?? []) roleIds.add(action.subject_role_id);
      for (const placement of moment.placements ?? []) roleIds.add(placement.subject_role_id);
    }
    return Array.from(roleIds).reduce((sum, roleId) => sum + (roleTypicalCounts.get(roleId) ?? 1), 0);
  };

  const locationCountForActivity = (activity: DayBlueprintActivity) => {
    const locationRoleIds = new Set<number>();
    for (const link of activity.activity_locations ?? []) {
      locationRoleIds.add(link.day_blueprint_location_role_id);
    }
    if (locationRoleIds.size > 0) return locationRoleIds.size;
    for (const moment of activity.moments ?? []) {
      for (const placement of moment.placements ?? []) {
        const locationRoleId = spaceSlotLocationRoleIds.get(placement.day_blueprint_space_slot_id);
        if (locationRoleId) locationRoleIds.add(locationRoleId);
      }
    }
    return locationRoleIds.size;
  };

  const handleAddActivity = async (name: string) => {
    if (!day || !name.trim()) return;
    await createActivity.mutateAsync({
      dayId: day.id,
      data: {
        name: name.trim(),
        order_index: dayActivities.length,
        color: ACTIVITY_COLORS[dayActivities.length % ACTIVITY_COLORS.length],
      },
    });
  };

  const handleAddMoment = async (activityId: number, name: string, durationSeconds: number) => {
    if (!name.trim()) return;
    const activity = dayActivities.find((entry) => entry.id === activityId);
    const sortedMoments = [...(activity?.moments ?? [])].sort(
      (left, right) => (left.order_index ?? 0) - (right.order_index ?? 0),
    );
    const previousMoment = sortedMoments.length > 0 ? sortedMoments[sortedMoments.length - 1] : null;
    const inheritFromMomentId =
      blankAuthoring && previousMoment != null ? previousMoment.id : undefined;
    await createMoment.mutateAsync({
      activityId,
      data: {
        name: name.trim(),
        duration_seconds: durationSeconds || 60,
        order_index: activity?.moments?.length ?? 0,
        ...(inheritFromMomentId != null ? { inherit_from_moment_id: inheritFromMomentId } : {}),
      },
    });
  };

  const tableActivities = useMemo<PackageActivityTableActivity[]>(() => dayActivities.map((activity) => {
    const color = activity.color ?? ACTIVITY_COLORS[activity.order_index % ACTIVITY_COLORS.length];
    const duration = activity.default_duration_minutes ?? activityTotals(activity).planned;
    const persistedMoments = (activity.moments ?? []).map((moment, index) => ({
      id: moment.id,
      name: sanitizeStreamingMomentDisplayName(moment.name ?? ''),
      durationLabel: formatSeconds(moment.duration_seconds),
      durationSeconds: moment.duration_seconds ?? 60,
      orderIndex: moment.order_index ?? index,
    }));
    const pendingMoments = (pendingMomentsByActivity[activity.id] ?? []).map((moment) => ({
      id: previewMomentId(moment.key),
      name: sanitizeStreamingMomentDisplayName(moment.name || 'Generating beat') || 'Generating beat',
      nameShimmer: true,
      // While streaming, the duration arrives in a separate event. Show an
      // ellipsis until the model emits a real duration so the row doesn't
      // misleadingly read "1m" for every moment.
      durationLabel: moment.durationSeconds > 0 ? formatSeconds(moment.durationSeconds) : '…',
      orderIndex: moment.orderIndex,
    }));
    // While the AI is generating, optimistically hide the previously-persisted
    // moments (the backend has already cleared them inside the transaction)
    // so users see new moments stream in one by one rather than a mix of
    // stale + new rows.
    const visibleMoments = isGeneratingMoments
      ? pendingMoments
      : [...persistedMoments, ...pendingMoments];
    const mergedMoments: PackageActivityTableMoment[] = visibleMoments
      .sort((left, right) => {
        if (left.orderIndex !== right.orderIndex) return left.orderIndex - right.orderIndex;
        return left.id - right.id;
      })
      .map((row) => {
        const moment: PackageActivityTableMoment = {
          id: row.id,
          name: row.name,
          durationLabel: row.durationLabel,
        };
        if ('durationSeconds' in row && row.durationSeconds != null) {
          moment.durationSeconds = row.durationSeconds;
        }
        if ('nameShimmer' in row && row.nameShimmer) {
          moment.nameShimmer = true;
        }
        return moment;
      });

    return {
      id: activity.id,
      name: activity.name,
      color,
      durationLabel: duration > 0 ? formatMinutes(duration) : '—',
      metrics: {
        subjects: subjectCountForActivity(activity) || null,
        locations: locationCountForActivity(activity) || null,
      },
      moments: mergedMoments,
    };
  }), [dayActivities, isGeneratingMoments, pendingMomentsByActivity]);

  if (!day) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Select a day to view and edit activities
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <PackageActivityTable
        activities={tableActivities}
        metricColumns={BLUEPRINT_ACTIVITY_METRIC_COLUMNS}
        autoExpandActivityIds={autoExpandActivityIds}
        emptyMomentLabel={isGeneratingMoments ? 'Generating moments...' : 'No moments yet'}
        selectedActivityId={selectedActivityId}
        selectedMomentId={selectedMomentId}
        readOnly={!isDraft}
        onSelectActivity={(activityId) => onSelectActivity(selectedActivityId === activityId ? null : activityId)}
        onSelectMoment={onSelectMoment}
        onAddActivity={isDraft ? handleAddActivity : undefined}
        onDeleteActivity={isDraft ? (activityId) => {
          const activity = dayActivities.find((entry) => entry.id === activityId);
          if (!activity || !window.confirm(`Delete activity "${activity.name}"?`)) return;
          deleteActivity.mutate(activityId);
        } : undefined}
        onAddMoment={isDraft ? handleAddMoment : undefined}
        onDeleteMoment={isDraft ? (activityId, momentId) => {
          const activity = dayActivities.find((entry) => entry.id === activityId);
          const moment = activity?.moments?.find((entry) => entry.id === momentId);
          if (!moment || !window.confirm(`Delete moment "${moment.name}"?`)) return;
          deleteMoment.mutate(momentId);
        } : undefined}
        onCommitMomentDuration={isDraft ? onCommitMomentDuration : undefined}
      />
    </Box>
  );
}

function previewMomentId(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return -Math.abs(hash || 1);
}