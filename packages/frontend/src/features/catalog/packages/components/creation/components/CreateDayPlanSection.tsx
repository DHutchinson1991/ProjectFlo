'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Checkbox, Stack, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import {
  buildDefaultMomentKeysByActivity,
  buildManualDayPlan,
  defaultActivityKeysForSlot,
  defaultMomentKeysForActivity,
  EVENT_DAY_ROLE_OPTIONS,
  getActivitySuggestionsForSlot,
  getMomentSuggestionsForActivity,
  isDaySlotAssigned,
  manualDayPlanToEditorState,
  MANUAL_DAY_COUNT_OPTIONS,
  MAX_MANUAL_DAY_COUNT,
  type EventDayRole,
  type ManualDaySlotInput,
} from '../helpers/manual-day-plan';
import {
  autoAdjustLocationCount,
  clampLocationCount,
  DEFAULT_LOCATION_COUNT,
} from '../helpers/location-helpers';
import DayBuilder, { type DayBuilderItem } from './DayBuilder';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardDerived } from '../hooks/useWizardDerived';
import { checkboxSx, listRowSx, miniInputSx } from '../helpers/wizard-styles';

interface CreateDayPlanSectionProps {
  state: WizardState;
  derived: WizardDerived;
}

function daySlotChipSx(
  active: boolean,
  assigned: boolean,
  selectedCount: boolean,
  accent: string,
) {
  return {
    minWidth: 52,
    px: 1.5,
    py: 0.85,
    borderRadius: 1.5,
    border: '2px solid',
    borderColor: active ? accent : assigned ? `${accent}70` : selectedCount ? `${accent}55` : 'rgba(148,163,184,0.18)',
    bgcolor: active
      ? `${accent}30`
      : assigned
        ? `${accent}24`
        : selectedCount
          ? 'rgba(255,255,255,0.05)'
          : 'rgba(255,255,255,0.02)',
    color: active ? '#fff' : assigned ? '#e2e8f0' : selectedCount ? '#cbd5e1' : '#94a3b8',
    fontWeight: active || assigned || selectedCount ? 700 : 500,
    fontSize: '0.82rem',
    textAlign: 'center' as const,
    cursor: 'pointer',
    opacity: 1,
    transition: 'all 0.18s',
    boxShadow: active ? `0 0 0 1px ${accent}40` : 'none',
    '&:hover': { borderColor: accent, color: '#e2e8f0' },
  };
}

function ColumnHeader({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        color: '#64748b',
        fontSize: '0.62rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        mb: 1,
      }}
    >
      {children}
    </Typography>
  );
}

function ColumnPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ color: '#475569', fontSize: '0.75rem', lineHeight: 1.45, py: 1, px: 0.5 }}>
      {children}
    </Typography>
  );
}

function ThreeColumnDayEditor({
  dayNumber,
  slot,
  accent,
  focusedActivityKey,
  onFocusActivity,
  onSelectRole,
  onCreateCustom,
  onToggleActivity,
  onToggleMoment,
  onCustomNameChange,
}: {
  dayNumber: number;
  slot?: ManualDaySlotInput;
  accent: string;
  focusedActivityKey: string | null;
  onFocusActivity: (activityKey: string) => void;
  onSelectRole: (dayNumber: number, role: EventDayRole) => void;
  onCreateCustom: (dayNumber: number) => void;
  onToggleActivity: (dayNumber: number, activityKey: string) => void;
  onToggleMoment: (dayNumber: number, activityKey: string, momentKey: string) => void;
  onCustomNameChange: (dayNumber: number, name: string) => void;
}) {
  const isCustom = Boolean(slot?.isCustom);
  const hasType = isDaySlotAssigned(slot);
  const suggestions = getActivitySuggestionsForSlot({
    role: slot?.isCustom ? undefined : slot?.role,
    isCustom: slot?.isCustom,
  });
  const selectedActivityKeys = new Set(slot?.selectedActivityKeys ?? []);
  const momentKeysByActivity = slot?.selectedMomentKeysByActivity ?? {};

  const resolvedFocus =
    focusedActivityKey && selectedActivityKeys.has(focusedActivityKey)
      ? focusedActivityKey
      : suggestions.find((s) => selectedActivityKeys.has(s.key))?.key ?? null;

  const focusedActivity = suggestions.find((s) => s.key === resolvedFocus);
  const momentSuggestions = resolvedFocus ? getMomentSuggestionsForActivity(resolvedFocus) : [];
  const selectedMomentKeys = new Set(
    resolvedFocus ? momentKeysByActivity[resolvedFocus] ?? [] : [],
  );

  const columnShellSx = {
    minHeight: 320,
    maxHeight: 420,
    overflowY: 'auto' as const,
    pr: 0.5,
    '&::-webkit-scrollbar': { width: 4 },
    '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(148,163,184,0.2)', borderRadius: 2 },
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)' },
        gap: { xs: 2, md: 0 },
        minHeight: 340,
        borderTop: '1px solid rgba(148,163,184,0.1)',
        pt: 1.5,
      }}
    >
      <Box sx={{ ...columnShellSx, borderRight: { md: '1px solid rgba(148,163,184,0.1)' }, pr: { md: 1.5 } }}>
        <ColumnHeader>Day type</ColumnHeader>
        <Stack spacing={0.5}>
          {EVENT_DAY_ROLE_OPTIONS.map((option) => {
            const selected = !isCustom && slot?.role === option.value;
            return (
              <Box
                key={option.value}
                onClick={() => onSelectRole(dayNumber, option.value)}
                sx={{
                  ...listRowSx(selected, accent),
                  border: '1px solid',
                  borderColor: selected ? `${accent}55` : 'rgba(148,163,184,0.1)',
                  bgcolor: selected ? `${accent}0A` : 'transparent',
                }}
              >
                <Box sx={checkboxSx(selected, accent)}>
                  {selected && <CheckCircleIcon sx={{ fontSize: '0.7rem' }} />}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      color: selected ? '#e2e8f0' : '#94a3b8',
                      fontSize: '0.8rem',
                      fontWeight: selected ? 700 : 500,
                      lineHeight: 1.25,
                    }}
                  >
                    {option.label}
                  </Typography>
                  <Typography sx={{ color: '#64748b', fontSize: '0.66rem', mt: 0.2, lineHeight: 1.35 }}>
                    {option.description}
                  </Typography>
                </Box>
              </Box>
            );
          })}

          <Box
            onClick={() => onCreateCustom(dayNumber)}
            sx={{
              ...listRowSx(isCustom, accent),
              border: '1px dashed',
              borderColor: isCustom ? `${accent}55` : 'rgba(148,163,184,0.25)',
              bgcolor: 'transparent',
            }}
          >
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: '4px',
                border: `2px dashed ${isCustom ? accent : 'rgba(148,163,184,0.35)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AddIcon sx={{ fontSize: '0.75rem', color: isCustom ? accent : '#64748b' }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  color: isCustom ? '#e2e8f0' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: isCustom ? 700 : 500,
                }}
              >
                Create new day
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.66rem', mt: 0.2 }}>
                Custom name and activities
              </Typography>
            </Box>
          </Box>

          {isCustom && (
            <TextField
              size="small"
              fullWidth
              placeholder="Name your day…"
              value={slot?.customName ?? ''}
              onChange={(e) => onCustomNameChange(dayNumber, e.target.value)}
              sx={{ ...miniInputSx(accent), mt: 0.5 }}
              inputProps={{ sx: { fontSize: '0.85rem', fontWeight: 600, py: '6px !important' } }}
            />
          )}
        </Stack>
      </Box>

      <Box sx={{ ...columnShellSx, borderRight: { md: '1px solid rgba(148,163,184,0.1)' }, px: { md: 1.5 } }}>
        <ColumnHeader>Activities</ColumnHeader>
        {!hasType ? (
          <ColumnPlaceholder>Pick a day type to see activities.</ColumnPlaceholder>
        ) : suggestions.length === 0 ? (
          <ColumnPlaceholder>No default activities for this day yet.</ColumnPlaceholder>
        ) : (
          <Stack spacing={0.35}>
            {suggestions.map((activity) => {
              const checked = selectedActivityKeys.has(activity.key);
              const focused = resolvedFocus === activity.key;
              const momentCount = (momentKeysByActivity[activity.key] ?? []).length;
              return (
                <Box
                  key={activity.key}
                  onClick={() => onFocusActivity(activity.key)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1,
                    py: 0.7,
                    borderRadius: 1,
                    cursor: 'pointer',
                    borderLeft: '2px solid',
                    borderColor: focused ? accent : 'transparent',
                    bgcolor: focused ? `${accent}10` : 'transparent',
                    opacity: checked ? 1 : 0.72,
                    '&:hover': { bgcolor: focused ? `${accent}12` : 'rgba(148,163,184,0.06)' },
                  }}
                >
                  <Checkbox
                    checked={checked}
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => onToggleActivity(dayNumber, activity.key)}
                    sx={{
                      p: 0,
                      color: 'rgba(148,163,184,0.35)',
                      '&.Mui-checked': { color: activity.color },
                    }}
                  />
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: activity.color, flexShrink: 0 }} />
                  <Typography
                    sx={{
                      color: checked ? '#e2e8f0' : '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: focused || checked ? 600 : 500,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {activity.name}
                  </Typography>
                  <Typography sx={{ color: '#64748b', fontSize: '0.62rem', flexShrink: 0 }}>
                    {checked ? `${momentCount} mo` : `${activity.durationMinutes}m`}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      <Box sx={{ ...columnShellSx, pl: { md: 0.5 } }}>
        <ColumnHeader>Moments</ColumnHeader>
        {!hasType ? (
          <ColumnPlaceholder>Pick a day type first.</ColumnPlaceholder>
        ) : !resolvedFocus || !selectedActivityKeys.has(resolvedFocus) ? (
          <ColumnPlaceholder>Select an included activity to view moments.</ColumnPlaceholder>
        ) : (
          <>
            <Typography sx={{ color: accent, fontSize: '0.78rem', fontWeight: 600, mb: 0.75 }}>
              {focusedActivity?.name}
            </Typography>
            <Stack spacing={0.35}>
              {momentSuggestions.map((moment) => {
                const checked = selectedMomentKeys.has(moment.key);
                return (
                  <Box
                    key={moment.key}
                    onClick={() => onToggleMoment(dayNumber, resolvedFocus, moment.key)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1,
                      py: 0.65,
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(148,163,184,0.06)' },
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      size="small"
                      tabIndex={-1}
                      sx={{
                        p: 0,
                        color: 'rgba(148,163,184,0.35)',
                        '&.Mui-checked': { color: accent },
                      }}
                    />
                    <Typography
                      sx={{
                        color: checked ? '#e2e8f0' : '#94a3b8',
                        fontSize: '0.76rem',
                        fontWeight: checked ? 600 : 500,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {moment.name}
                    </Typography>
                    {moment.isKeyMoment && (
                      <StarRoundedIcon sx={{ fontSize: '0.85rem', color: '#f59e0b', flexShrink: 0 }} />
                    )}
                  </Box>
                );
              })}
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
}

export default function CreateDayPlanSection({ state, derived }: CreateDayPlanSectionProps) {
  const { selectedEventType, manualDayPlan } = state;
  const { accent } = derived;

  const initialEditorState = useMemo(
    () => manualDayPlanToEditorState(manualDayPlan),
    // Hydrate once on mount from committed wizard state when returning to this step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [dayCount, setDayCount] = useState(initialEditorState.dayCount);
  const [activeDay, setActiveDay] = useState(initialEditorState.activeDay);
  const [slots, setSlots] = useState<Record<number, ManualDaySlotInput | undefined>>(initialEditorState.slots);
  const [focusedActivityByDay, setFocusedActivityByDay] = useState<Record<number, string | null>>(
    initialEditorState.focusedActivityByDay,
  );

  const plan = useMemo(
    () => buildManualDayPlan(dayCount, slots, selectedEventType?.name),
    [dayCount, slots, selectedEventType?.name],
  );

  useEffect(() => {
    state.setDayDesignSource('manual');
    state.setManualDayPlan(plan);
    state.setBlueprintDayCount(plan.eventDays);
    state.setLocationCount(
      plan.days.length > 0
        ? Math.max(...plan.days.map((day) => day.locationCount))
        : DEFAULT_LOCATION_COUNT,
    );
    state.setSourceDayBlueprintVersionId(null);
    state.setSourceDayBlueprintId(null);
    state.setSelectedBlueprintActivityIds(new Set());
    state.setSelectedDayIds(new Set());
    state.setSelectedPresetIds(new Set());
    state.setSelectedMomentIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync wizard create path from local day plan
  }, [plan]);

  const trimSlotsForCount = (prev: Record<number, ManualDaySlotInput | undefined>, count: number) => {
    const next: Record<number, ManualDaySlotInput | undefined> = {};
    for (let dayNumber = 1; dayNumber <= count; dayNumber++) {
      if (prev[dayNumber]) next[dayNumber] = prev[dayNumber];
    }
    return next;
  };

  const handleDayCount = (count: number) => {
    setDayCount(count);
    setActiveDay((prev) => Math.min(prev, count));
    setSlots((prev) => trimSlotsForCount(prev, count));
  };

  const handleSlotClick = (targetDayCount: number) => {
    handleDayCount(targetDayCount);
    setActiveDay(targetDayCount);
  };

  const handleAddDay = () => {
    if (dayCount >= MAX_MANUAL_DAY_COUNT) return;
    const next = dayCount + 1;
    setDayCount(next);
    setActiveDay(next);
  };

  const handleRoleSelect = (dayNumber: number, role: EventDayRole) => {
    const activityKeys = defaultActivityKeysForSlot({ role });
    setSlots((prev) => ({
      ...prev,
      [dayNumber]: {
        role,
        isCustom: false,
        locationCount: prev[dayNumber]?.locationCount ?? DEFAULT_LOCATION_COUNT,
        selectedActivityKeys: activityKeys,
        selectedMomentKeysByActivity: buildDefaultMomentKeysByActivity(activityKeys),
      },
    }));
    setFocusedActivityByDay((prev) => ({
      ...prev,
      [dayNumber]: activityKeys[0] ?? null,
    }));
  };

  const handleCreateCustom = (dayNumber: number) => {
    const activityKeys = defaultActivityKeysForSlot({ isCustom: true });
    setSlots((prev) => ({
      ...prev,
      [dayNumber]: {
        isCustom: true,
        customName: prev[dayNumber]?.customName ?? '',
        locationCount: prev[dayNumber]?.locationCount ?? DEFAULT_LOCATION_COUNT,
        selectedActivityKeys: activityKeys,
        selectedMomentKeysByActivity: buildDefaultMomentKeysByActivity(activityKeys),
      },
    }));
    setFocusedActivityByDay((prev) => ({
      ...prev,
      [dayNumber]: activityKeys[0] ?? null,
    }));
  };

  const handleCustomNameChange = (dayNumber: number, customName: string) => {
    setSlots((prev) => {
      const current = prev[dayNumber];
      if (!current?.isCustom) return prev;
      return {
        ...prev,
        [dayNumber]: { ...current, customName },
      };
    });
  };

  const handleToggleActivity = (dayNumber: number, activityKey: string) => {
    setSlots((prev) => {
      const current = prev[dayNumber];
      if (!current) return prev;
      const keys = new Set(current.selectedActivityKeys);
      const momentMap = { ...current.selectedMomentKeysByActivity };
      if (keys.has(activityKey)) {
        keys.delete(activityKey);
      } else {
        keys.add(activityKey);
        if (!momentMap[activityKey]?.length) {
          momentMap[activityKey] = defaultMomentKeysForActivity(activityKey);
        }
      }
      const activityCount = keys.size;
      const locationCount = autoAdjustLocationCount(
        activityCount,
        current.locationCount ?? DEFAULT_LOCATION_COUNT,
      );
      return {
        ...prev,
        [dayNumber]: {
          ...current,
          selectedActivityKeys: Array.from(keys),
          selectedMomentKeysByActivity: momentMap,
          locationCount,
        },
      };
    });
    setFocusedActivityByDay((prev) => ({ ...prev, [dayNumber]: activityKey }));
  };

  const handleToggleMoment = (dayNumber: number, activityKey: string, momentKey: string) => {
    setSlots((prev) => {
      const current = prev[dayNumber];
      if (!current) return prev;
      const momentMap = { ...current.selectedMomentKeysByActivity };
      const keys = new Set(momentMap[activityKey] ?? []);
      if (keys.has(momentKey)) keys.delete(momentKey);
      else keys.add(momentKey);
      momentMap[activityKey] = Array.from(keys);
      return {
        ...prev,
        [dayNumber]: { ...current, selectedMomentKeysByActivity: momentMap },
      };
    });
  };

  const handleLocationCountForDay = (dayNumber: number, count: number) => {
    setSlots((prev) => {
      const current = prev[dayNumber];
      if (!current) {
        return {
          ...prev,
          [dayNumber]: {
            selectedActivityKeys: [],
            selectedMomentKeysByActivity: {},
            locationCount: clampLocationCount(count),
          },
        };
      }
      return {
        ...prev,
        [dayNumber]: { ...current, locationCount: clampLocationCount(count) },
      };
    });
  };

  const builderDays: DayBuilderItem[] = useMemo(
    () =>
      Array.from({ length: dayCount }, (_, index) => {
        const dayNumber = index + 1;
        const slot = slots[dayNumber];
        const planDay = plan.days[index];
        return {
          id: dayNumber,
          dayNumber,
          name: isDaySlotAssigned(slot) ? (planDay?.name ?? `Day ${dayNumber}`) : 'Choose a day type',
          assigned: isDaySlotAssigned(slot),
          locationCount: slot?.locationCount ?? planDay?.locationCount ?? DEFAULT_LOCATION_COUNT,
        };
      }),
    [dayCount, slots, plan.days],
  );

  const dayCountHeader = (
    <>
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography sx={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.92rem', mb: 0.5 }}>
          How many days in this package?
        </Typography>
        <Typography sx={{ color: '#64748b', fontSize: '0.72rem', lineHeight: 1.45 }}>
          Assign each day, then choose activities and moments across the three columns.
        </Typography>
      </Box>

      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        justifyContent="center"
        sx={{ mb: 2.5 }}
      >
        {MANUAL_DAY_COUNT_OPTIONS.map((slot) => {
          const assigned = isDaySlotAssigned(slots[slot]);
          const isActive = activeDay === slot;
          const selectedCount = slot <= dayCount;
          return (
            <Box
              key={slot}
              onClick={() => handleSlotClick(slot)}
              sx={daySlotChipSx(isActive, assigned, selectedCount, accent)}
            >
              {slot}
            </Box>
          );
        })}
        {dayCount > MANUAL_DAY_COUNT_OPTIONS.length && (
          <Box
            onClick={() => setActiveDay(dayCount)}
            sx={daySlotChipSx(
              activeDay === dayCount,
              isDaySlotAssigned(slots[dayCount]),
              true,
              accent,
            )}
          >
            {dayCount}
          </Box>
        )}
        {dayCount < MAX_MANUAL_DAY_COUNT && (
          <Box
            onClick={handleAddDay}
            sx={{
              ...daySlotChipSx(false, false, false, accent),
              borderStyle: 'dashed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
            }}
          >
            <AddIcon sx={{ fontSize: 16 }} />
            More
          </Box>
        )}
      </Stack>
    </>
  );

  return (
    <DayBuilder
      accent={accent}
      days={builderDays}
      navigation="carousel"
      header={dayCountHeader}
      activeDayId={activeDay}
      onActiveDayChange={(id) => setActiveDay(Number(id))}
      onLocationCountChange={(id, count) => handleLocationCountForDay(Number(id), count)}
      renderDayContent={(day) => {
        const dayNumber = Number(day.id);
        const activeSlot = slots[dayNumber];
        const focusedActivityKey = focusedActivityByDay[dayNumber] ?? null;
        return (
          <ThreeColumnDayEditor
            dayNumber={dayNumber}
            slot={activeSlot}
            accent={accent}
            focusedActivityKey={focusedActivityKey}
            onFocusActivity={(activityKey) =>
              setFocusedActivityByDay((prev) => ({ ...prev, [dayNumber]: activityKey }))
            }
            onSelectRole={handleRoleSelect}
            onCreateCustom={handleCreateCustom}
            onToggleActivity={handleToggleActivity}
            onToggleMoment={handleToggleMoment}
            onCustomNameChange={handleCustomNameChange}
          />
        );
      }}
    />
  );
}
