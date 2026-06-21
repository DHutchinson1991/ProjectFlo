import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Typography, Chip, Stack,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useDayBlueprintVersion, usePublishedDayBlueprintVersions } from '@/features/content/day-blueprints/hooks';
import type { DayBlueprintDay } from '@/features/content/day-blueprints/types';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardDerived } from '../hooks/useWizardDerived';
import type { WizardHandlers } from '../hooks/useWizardHandlers';
import DayDesignSubstepHeader from '../components/DayDesignSubstepHeader';
import DayBuilder, { type DayBuilderItem } from '../components/DayBuilder';
import {
  autoAdjustLocationCount,
  defaultLocationCountForBlueprintDay,
  maxLocationCount,
} from '../helpers/location-helpers';
import { sectionBtnSx, listRowSx, checkboxSx } from '../helpers/wizard-styles';

interface ActivitiesStepProps {
  state: WizardState;
  derived: WizardDerived;
  handlers: WizardHandlers;
}

function formatMinutes(mins: number): string {
  if (!mins) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function BlueprintActivitiesPicker({
  state,
  derived,
  handlers,
}: ActivitiesStepProps) {
  const {
    sourceDayBlueprintVersionId,
    sourceDayBlueprintId,
    selectedBlueprintActivityIds,
    locationCountByBlueprintDayId,
    setLocationCountForBlueprintDay,
    setLocationCount,
  } = state;
  const { accent } = derived;
  const initializedForVersionRef = useRef<number | null>(null);
  const locationInitForVersionRef = useRef<number | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number | string>>(new Set());
  const expandedDaysInitRef = useRef<number | null>(null);
  const { data: publishedVersions = [] } = usePublishedDayBlueprintVersions();
  const resolvedBlueprintId =
    sourceDayBlueprintId
    ?? publishedVersions.find((row) => row.versionId === sourceDayBlueprintVersionId)?.blueprintId
    ?? null;

  const versionQuery = useDayBlueprintVersion(
    resolvedBlueprintId,
    sourceDayBlueprintVersionId,
  );
  const version = versionQuery.data;
  const blueprintDays = useMemo(
    () => (version?.days ?? []).slice().sort((a, b) => a.order_index - b.order_index),
    [version?.days],
  );
  const daysWithActivities = useMemo(
    () => blueprintDays.filter((d) => (d.activities ?? []).length > 0),
    [blueprintDays],
  );
  const allActivityIds = useMemo(
    () => blueprintDays.flatMap((day) => (day.activities ?? []).map((activity) => activity.id)),
    [blueprintDays],
  );
  const totalActivities = allActivityIds.length;

  const latestPublishedForBlueprint = useMemo(() => {
    if (!sourceDayBlueprintId) return null;
    const rows = publishedVersions.filter((row) => row.blueprintId === sourceDayBlueprintId);
    return rows.reduce(
      (best, row) => (!best || row.versionNumber > best.versionNumber ? row : best),
      null as (typeof rows)[number] | null,
    );
  }, [publishedVersions, sourceDayBlueprintId]);

  const isStaleBlueprintVersion =
    latestPublishedForBlueprint != null
    && sourceDayBlueprintVersionId !== latestPublishedForBlueprint.versionId;

  useEffect(() => {
    state.setBlueprintDayCount(blueprintDays.length);
  }, [blueprintDays.length, state]);

  useEffect(() => {
    if (!sourceDayBlueprintVersionId || !version || totalActivities === 0) return;
    if (initializedForVersionRef.current === sourceDayBlueprintVersionId) return;
    initializedForVersionRef.current = sourceDayBlueprintVersionId;
    handlers.selectAllBlueprintActivities(allActivityIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once per blueprint version
  }, [sourceDayBlueprintVersionId, version?.id, totalActivities]);

  useEffect(() => {
    if (!sourceDayBlueprintVersionId) {
      initializedForVersionRef.current = null;
      locationInitForVersionRef.current = null;
    }
  }, [sourceDayBlueprintVersionId]);

  useEffect(() => {
    if (!version || blueprintDays.length === 0) return;
    if (locationInitForVersionRef.current === version.id) return;
    locationInitForVersionRef.current = version.id;
    const defaults: Record<number, number> = {};
    for (const day of blueprintDays) {
      defaults[day.id] = defaultLocationCountForBlueprintDay(day);
    }
    state.setLocationCountByBlueprintDayId(defaults);
    state.setBlueprintScaffoldDays(
      blueprintDays.map((day) => ({
        id: day.id,
        name: day.name,
        order_index: day.order_index,
      })),
    );
    state.setLocationCount(maxLocationCount(Object.values(defaults)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once per blueprint version
  }, [version?.id, blueprintDays]);

  useEffect(() => {
    const counts = Object.values(locationCountByBlueprintDayId);
    if (counts.length > 0) {
      setLocationCount(maxLocationCount(counts));
    }
  }, [locationCountByBlueprintDayId, setLocationCount]);

  useEffect(() => {
    if (!version || daysWithActivities.length === 0) return;
    if (expandedDaysInitRef.current === version.id) return;
    expandedDaysInitRef.current = version.id;
    setExpandedDays(new Set([daysWithActivities[0].id]));
  }, [version?.id, daysWithActivities]);

  const toggleDayExpand = (dayId: number | string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  };

  const handleBlueprintLocationChange = (dayId: number | string, count: number) => {
    setLocationCountForBlueprintDay(Number(dayId), count);
  };

  const autoAdjustDayLocations = (day: DayBlueprintDay) => {
    const activities = (day.activities ?? []).filter((a) => selectedBlueprintActivityIds.has(a.id));
    const current = locationCountByBlueprintDayId[day.id]
      ?? defaultLocationCountForBlueprintDay(day);
    const adjusted = autoAdjustLocationCount(activities.length, current);
    if (adjusted !== current) {
      setLocationCountForBlueprintDay(day.id, adjusted);
    }
  };

  const builderDays: DayBuilderItem[] = useMemo(
    () =>
      daysWithActivities.map((day, index) => ({
        id: day.id,
        dayNumber: index + 1,
        name: day.name,
        assigned: true,
        locationCount: locationCountByBlueprintDayId[day.id]
          ?? defaultLocationCountForBlueprintDay(day),
      })),
    [daysWithActivities, locationCountByBlueprintDayId],
  );

  const navigation = daysWithActivities.length <= 1 ? 'carousel' : 'accordion';

  if (versionQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
        <CircularProgress size={18} sx={{ color: accent }} />
        <Typography sx={{ color: '#94a3b8', fontSize: '0.82rem' }}>
          Loading blueprint activities...
        </Typography>
      </Box>
    );
  }

  if (versionQuery.isError || !version) {
    return (
      <Typography sx={{ color: '#f59e0b', fontSize: '0.8rem' }}>
        Could not load activities for this blueprint. Go back and re-select the blueprint.
      </Typography>
    );
  }

  return (
    <Box>
      <DayDesignSubstepHeader
        accent={accent}
        title="Review your days"
        subtitle="Confirm activities and location slots for each day. All activities are selected by default — deselect anything you do not need."
      />

      {isStaleBlueprintVersion && latestPublishedForBlueprint && (
        <Typography sx={{ color: '#f59e0b', fontSize: '0.75rem', mb: 1.5 }}>
          A newer blueprint version exists (v{latestPublishedForBlueprint.versionNumber}). This package
          will snapshot v{version?.version_number ?? '?'} from your selection.
        </Typography>
      )}

      {blueprintDays.length > 1 && (
        <Typography sx={{ color: '#64748b', fontSize: '0.72rem', mb: 1.5 }}>
          {blueprintDays.length} package days will be created from this blueprint — one per day below.
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0, ml: 'auto' }}>
          <Chip
            label={`${selectedBlueprintActivityIds.size}/${totalActivities} included`}
            size="small"
            sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'none' }}
          />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Box
              component="button"
              onClick={() => handlers.selectAllBlueprintActivities(allActivityIds)}
              sx={sectionBtnSx('#10b981')}
            >
              All
            </Box>
            <Box
              component="button"
              onClick={handlers.deselectAllBlueprintActivities}
              sx={{ ...sectionBtnSx('#64748b'), borderColor: 'rgba(255,255,255,0.1)' }}
            >
              None
            </Box>
          </Box>
        </Box>
      </Box>

      {totalActivities === 0 ? (
        <Typography sx={{ color: '#475569', fontSize: '0.8rem', fontStyle: 'italic' }}>
          This design has no activities yet. Pick a different library design or use Create instead.
        </Typography>
      ) : (
        <DayBuilder
          accent={accent}
          days={builderDays}
          navigation={navigation}
          expandedDayIds={expandedDays}
          onToggleDayExpand={toggleDayExpand}
          onLocationCountChange={handleBlueprintLocationChange}
          locationPickerCompact
          renderDayContent={(builderDay) => {
            const day = daysWithActivities.find((d) => d.id === builderDay.id);
            if (!day) return null;
            const activities = (day.activities ?? []).slice().sort((a, b) => a.order_index - b.order_index);
            return (
              <Stack spacing={0.5}>
                {activities.map((activity) => {
                  const sel = selectedBlueprintActivityIds.has(activity.id);
                  const pColor = activity.color || '#818cf8';
                  const momentCount = activity.moments?.length ?? 0;
                  return (
                    <Box key={activity.id} sx={listRowSx(sel, pColor)}>
                      <Box
                        onClick={() => {
                          handlers.toggleBlueprintActivity(activity.id);
                          queueMicrotask(() => autoAdjustDayLocations(day));
                        }}
                        sx={checkboxSx(sel, pColor)}
                      >
                        {sel && <CheckCircleIcon sx={{ fontSize: '0.7rem' }} />}
                      </Box>
                      <Typography
                        onClick={() => {
                          handlers.toggleBlueprintActivity(activity.id);
                          queueMicrotask(() => autoAdjustDayLocations(day));
                        }}
                        sx={{
                          color: sel ? '#e2e8f0' : '#94a3b8',
                          fontSize: '0.82rem',
                          fontWeight: sel ? 600 : 400,
                          cursor: 'pointer',
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {activity.name}
                      </Typography>
                      {activity.default_duration_minutes ? (
                        <Typography sx={{ color: '#475569', fontSize: '0.65rem', flexShrink: 0 }}>
                          {formatMinutes(activity.default_duration_minutes)}
                        </Typography>
                      ) : null}
                      <Typography sx={{ color: '#64748b', fontSize: '0.65rem', flexShrink: 0, minWidth: 64, textAlign: 'right' }}>
                        {momentCount} moment{momentCount === 1 ? '' : 's'}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            );
          }}
        />
      )}
    </Box>
  );
}

function ManualDayDesignReview({
  state,
  derived,
}: {
  state: WizardState;
  derived: WizardDerived;
}) {
  const { manualDayPlan } = state;
  const { accent } = derived;
  const [expandedDays, setExpandedDays] = useState<Set<number | string>>(() => new Set([0]));

  if (!manualDayPlan?.days.length) {
    return (
      <Typography sx={{ color: '#f59e0b', fontSize: '0.8rem' }}>
        No days configured. Go back and choose how many event days to include.
      </Typography>
    );
  }

  const isSingleDay = manualDayPlan.days.length <= 1;
  const navigation = isSingleDay ? 'carousel' : 'accordion';

  const builderDays: DayBuilderItem[] = manualDayPlan.days.map((day, index) => ({
    id: day.order_index,
    dayNumber: index + 1,
    name: day.name,
    assigned: true,
    locationCount: day.locationCount,
  }));

  const toggleDayExpand = (dayId: number | string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  };

  return (
    <Box>
      <Typography sx={{ color: '#64748b', fontSize: '0.78rem', mb: 2, lineHeight: 1.45 }}>
        This package includes {manualDayPlan.eventDays} day
        {manualDayPlan.eventDays === 1 ? '' : 's'} with starter activities. Moments and timing are refined on the package page.
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
        <Box>
          <Typography sx={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}>
            Your package days
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.72rem', mt: 0.35 }}>
            {isSingleDay
              ? 'One day with your selected activities.'
              : `${manualDayPlan.days.length} days — expand to preview each one.`}
          </Typography>
        </Box>
        <Chip
          label={`${manualDayPlan.days.length} day${manualDayPlan.days.length === 1 ? '' : 's'}`}
          size="small"
          sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'none' }}
        />
      </Box>

      <DayBuilder
        accent={accent}
        days={builderDays}
        navigation={navigation}
        expandedDayIds={expandedDays}
        onToggleDayExpand={toggleDayExpand}
        onLocationCountChange={() => {}}
        showLocationPicker={false}
        locationPickerCompact
        renderDayContent={(builderDay) => {
          const day = manualDayPlan.days.find((d) => d.order_index === builderDay.id);
          if (!day) return null;
          const selectedActivities = day.activities.filter((a) => a.selected);
          return (
            <Stack spacing={0.5}>
              {selectedActivities.map((activity) => (
                <Box
                  key={activity.key}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1,
                    py: 0.65,
                    borderRadius: 1,
                    bgcolor: `${activity.color}10`,
                    border: `1px solid ${activity.color}22`,
                  }}
                >
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: activity.color }} />
                  <Typography sx={{ color: '#cbd5e1', fontSize: '0.75rem', flex: 1 }}>
                    {activity.name}
                  </Typography>
                  <Typography sx={{ color: '#64748b', fontSize: '0.65rem' }}>
                    {activity.durationMinutes}m
                  </Typography>
                </Box>
              ))}
            </Stack>
          );
        }}
      />
    </Box>
  );
}

export default function ActivitiesStep({ state, derived, handlers }: ActivitiesStepProps) {
  const { selectedEventType, sourceDayBlueprintVersionId, dayDesignSource } = state;

  if (!selectedEventType) return null;

  if (sourceDayBlueprintVersionId !== null) {
    return <BlueprintActivitiesPicker state={state} derived={derived} handlers={handlers} />;
  }

  if (dayDesignSource === 'manual') {
    return <ManualDayDesignReview state={state} derived={derived} />;
  }

  return (
    <Typography sx={{ color: '#f59e0b', fontSize: '0.8rem' }}>
      Choose a day design source to continue.
    </Typography>
  );
}
