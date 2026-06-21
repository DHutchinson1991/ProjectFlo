'use client';

import React, { useMemo } from 'react';
import { useCreateDay } from '../hooks';
import type { DayBlueprintActivity, DayBlueprintDay, DayBlueprintMoment } from '../types';
import { PackageTimeline, type PackageTimelineActivity, type PackageTimelineDay } from '@/shared/ui/PackageTimeline';
import { ACTIVITY_COLORS, parseTimeToMinutes } from '@/shared/ui/PackageTimeline/activity-schedule-helpers';

interface DayBlueprintTimelineSectionProps {
  days: DayBlueprintDay[];
  activeDayId: number | null;
  selectedActivityId: number | null;
  onSelectDay: (dayId: number) => void;
  onSelectActivity: (dayId: number, activityId: number) => void;
  isDraft: boolean;
  blueprintId: number;
  versionId: number;
}

function momentMinutes(moment: DayBlueprintMoment): number {
  if (moment.duration_seconds != null) return Math.round(moment.duration_seconds / 60);
  if (moment.expected_duration_minutes != null) return moment.expected_duration_minutes;
  return 0;
}

function activityTotals(activity: DayBlueprintActivity) {
  const moments = activity.moments ?? [];
  const momentMin = moments.reduce((sum: number, moment: DayBlueprintMoment) => sum + momentMinutes(moment), 0);
  const planned = activity.default_duration_minutes ?? momentMin;
  return { planned };
}

export function DayBlueprintTimelineSection({
  days,
  activeDayId,
  selectedActivityId,
  onSelectDay,
  onSelectActivity,
  isDraft,
  blueprintId,
  versionId,
}: DayBlueprintTimelineSectionProps) {
  const createDay = useCreateDay(blueprintId, versionId);
  const activeDay = days.find((day) => day.id === activeDayId) ?? days[0] ?? null;

  const timelineDays = useMemo<PackageTimelineDay[]>(() => days.map((day) => ({
    id: day.id,
    name: day.name,
    activityCount: day.activities?.length ?? 0,
  })), [days]);

  const timelineActivities = useMemo<PackageTimelineActivity[]>(() => {
    return [...(activeDay?.activities ?? [])]
      .sort((left, right) => {
        const leftStart = parseTimeToMinutes(left.default_start_time);
        const rightStart = parseTimeToMinutes(right.default_start_time);
        if (leftStart != null && rightStart != null) return leftStart - rightStart;
        if (leftStart != null) return -1;
        if (rightStart != null) return 1;
        return left.order_index - right.order_index;
      })
      .map((activity) => ({
        id: activity.id,
        name: activity.name,
        color: activity.color ?? ACTIVITY_COLORS[activity.order_index % ACTIVITY_COLORS.length],
        startTime: activity.default_start_time,
        endTime: null,
        durationMinutes: activity.default_duration_minutes ?? activityTotals(activity).planned,
        orderIndex: activity.order_index,
      }));
  }, [activeDay]);

  const handleAddDay = async () => {
    const nextDayNumber = days.length + 1;
    const day = await createDay.mutateAsync({
      name: `New Day ${nextDayNumber}`,
      order_index: days.length,
    });
    onSelectDay(day.id);
  };

  return (
    <PackageTimeline
      days={timelineDays}
      activities={timelineActivities}
      activeDayId={activeDay?.id ?? null}
      selectedActivityId={selectedActivityId}
      showAddDay={isDraft}
      onSelectDay={onSelectDay}
      onSelectActivity={(activityId) => {
        if (activeDay) onSelectActivity(activeDay.id, activityId);
      }}
      onAddDay={isDraft ? () => void handleAddDay() : undefined}
      emptyDaysTitle="No days configured"
      emptyDaysSubtitle="Add a day to build the blueprint timeline"
    />
  );
}