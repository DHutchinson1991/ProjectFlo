import React, { useEffect, useMemo } from 'react';
import { Box, Typography, Chip, Stack, TextField } from '@mui/material';
import { useDayBlueprintVersion, usePublishedDayBlueprintVersions } from '@/features/content/day-blueprints/hooks';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PlaceIcon from '@mui/icons-material/Place';
import VideocamIcon from '@mui/icons-material/Videocam';
import GroupsIcon from '@mui/icons-material/Groups';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MicIcon from '@mui/icons-material/Mic';
import WorkIcon from '@mui/icons-material/Work';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardData } from '../hooks/useWizardData';
import type { WizardDerived } from '../hooks/useWizardDerived';
import type { WizardHandlers } from '../hooks/useWizardHandlers';
import type { EquipmentItem } from '../types/wizard.types';
import {
  PACKAGE_PLANNING_GUEST_COUNT,
  matchesRoleKeywords, CAMERA_ROLE_KEYWORDS, AUDIO_ROLE_KEYWORDS,
} from '../helpers/wizard-helpers';
import { buildReviewDaySummaries } from '../helpers/review-day-summaries';

interface ReviewStepProps {
  state: WizardState;
  data: WizardData;
  derived: WizardDerived;
  handlers: WizardHandlers;
}

export default function ReviewStep({ state, data, derived, handlers }: ReviewStepProps) {
  const {
    selectedEventType, selectedPresetIds,
    customActivities, packageName, roleSlots,
    positionEquipment,
    sourceDayBlueprintVersionId, sourceDayBlueprintId,
    selectedBlueprintActivityIds,
    dayDesignSource, manualDayPlan,
    blueprintScaffoldDays, locationCountByBlueprintDayId, locationCount,
    blueprintDayCount,
  } = state;
  const { data: publishedVersions = [] } = usePublishedDayBlueprintVersions();
  const { data: blueprintVersion } = useDayBlueprintVersion(
    sourceDayBlueprintId,
    sourceDayBlueprintVersionId,
  );
  const { availableJobRoles, equipmentItems } = data;
  const { selectedDays, stats, accent } = derived;

  useEffect(() => {
    if (packageName || !selectedEventType) return;
    const dayCount = stats.days;
    const activityCount = stats.activities;
    const dayLabel = dayCount > 1 ? `${dayCount}-Day ` : '';
    const actLabel = activityCount > 5 ? 'Premium' : activityCount > 3 ? 'Standard' : 'Essential';
    state.setPackageName(`${actLabel} ${dayLabel}${selectedEventType.name} Package`);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-name once on review load
  }, []);

  if (!selectedEventType) return null;

  const blueprintSelection = useMemo(() => {
    if (!sourceDayBlueprintVersionId) return null;
    const row = publishedVersions.find((v) => v.versionId === sourceDayBlueprintVersionId);
    const latest = sourceDayBlueprintId
      ? publishedVersions
          .filter((v) => v.blueprintId === sourceDayBlueprintId)
          .reduce(
            (best, v) => (!best || v.versionNumber > best.versionNumber ? v : best),
            null as (typeof publishedVersions)[number] | null,
          )
      : null;
    return { row, latest };
  }, [publishedVersions, sourceDayBlueprintVersionId, sourceDayBlueprintId]);

  const blueprintDaysFromVersion = useMemo(
    () => (blueprintVersion?.days ?? []).slice().sort((a, b) => a.order_index - b.order_index),
    [blueprintVersion?.days],
  );

  const reviewDays = useMemo(
    () => buildReviewDaySummaries({
      dayDesignSource,
      manualDayPlan,
      sourceDayBlueprintVersionId,
      blueprintScaffoldDays,
      blueprintDaysFromVersion,
      locationCountByBlueprintDayId,
      locationCount,
      blueprintDayCount,
      selectedBlueprintActivityIds,
      selectedDays,
      selectedPresetIds,
      customActivities,
    }),
    [
      dayDesignSource, manualDayPlan, sourceDayBlueprintVersionId, blueprintScaffoldDays,
      blueprintDaysFromVersion, locationCountByBlueprintDayId, locationCount, blueprintDayCount,
      selectedBlueprintActivityIds, selectedDays, selectedPresetIds, customActivities,
    ],
  );

  const totalLocationSlots = useMemo(
    () => reviewDays.reduce((sum, day) => sum + day.locationCount, 0),
    [reviewDays],
  );

  const equipmentLines: Array<{ key: string; label: string; name: string; kind: 'CAMERA' | 'AUDIO' }> = [];
  let camCount = 0;
  let audCount = 0;
  for (const slot of roleSlots) {
    const role = availableJobRoles.find((r) => r.id === slot.jobRoleId);
    const isCamera = matchesRoleKeywords(role, CAMERA_ROLE_KEYWORDS);
    const isAudio = !isCamera && matchesRoleKeywords(role, AUDIO_ROLE_KEYWORDS);
    if (!isCamera && !isAudio) continue;
    for (let posIndex = 0; posIndex < slot.quantity; posIndex++) {
      const eqIds = (positionEquipment[`${slot.jobRoleId}:${posIndex}`] ?? [])
        .filter((id): id is number => id != null);
      for (let eqIndex = 0; eqIndex < eqIds.length; eqIndex++) {
        const eqId = eqIds[eqIndex];
        const eq = equipmentItems.find((e: EquipmentItem) => e.id === eqId);
        if (isCamera) {
          camCount += 1;
          equipmentLines.push({
            key: `cam-${slot.jobRoleId}-${posIndex}-${eqIndex}`,
            label: `Cam ${camCount}`,
            name: eq?.item_name || 'Unknown',
            kind: 'CAMERA',
          });
        } else {
          audCount += 1;
          equipmentLines.push({
            key: `aud-${slot.jobRoleId}-${posIndex}-${eqIndex}`,
            label: `Audio ${audCount}`,
            name: eq?.item_name || 'Unknown',
            kind: 'AUDIO',
          });
        }
      }
    }
  }

  const dayDesignAccent = dayDesignSource === 'manual' ? '#818cf8' : '#f59e0b';
  const dayDesignBg = dayDesignSource === 'manual' ? 'rgba(99,102,241,0.06)' : 'rgba(245,158,11,0.06)';
  const dayDesignBorder = dayDesignSource === 'manual' ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)';

  const summaryCards = [
    { label: 'Days', value: stats.days, color: '#10b981' },
    { label: 'Activities', value: stats.activities, color: '#818cf8' },
    ...(stats.moments > 0 ? [{ label: 'Moments', value: stats.moments, color: '#a78bfa' }] : []),
    { label: 'Loc. slots', value: totalLocationSlots, color: '#22d3ee' },
    { label: 'Crew', value: stats.crew, color: '#818cf8' },
    { label: 'Equipment', value: stats.equipment, color: '#fb923c' },
  ];

  return (
    <Box>
      {/* Package name — merged naming + review header */}
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', mb: 1 }}>
          Name your package
        </Typography>
        <TextField
          value={packageName}
          onChange={(e) => state.setPackageName(e.target.value)}
          placeholder={`e.g., Premium ${selectedEventType.name} Package`}
          fullWidth
          autoFocus
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              fontSize: '1.15rem',
              fontWeight: 700,
              bgcolor: 'rgba(255,255,255,0.03)',
              '& fieldset': { borderColor: `${accent}40`, borderWidth: 2 },
              '&:hover fieldset': { borderColor: `${accent}70` },
              '&.Mui-focused fieldset': { borderColor: accent },
            },
          }}
        />
        <Typography sx={{ color: '#64748b', fontSize: '0.72rem', mt: 0.75 }}>
          Visible to clients — you can change this later.
        </Typography>
      </Box>

      {/* Summary stat cards */}
      <Box sx={{ display: 'flex', gap: 0.75, mb: 2.5, flexWrap: 'wrap' }}>
        {summaryCards.map((stat) => (
          <Box
            key={stat.label}
            sx={{
              flex: '1 1 72px',
              minWidth: 72,
              p: 1,
              borderRadius: 1.25,
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(148,163,184,0.08)',
              textAlign: 'center',
            }}
          >
            <Typography sx={{ color: stat.color, fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
              {stat.value}
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.3px', mt: 0.25 }}>
              {stat.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Unified day design */}
      {(dayDesignSource === 'manual' || blueprintSelection?.row || reviewDays.length > 0) && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 1.5, bgcolor: dayDesignBg, border: `1px solid ${dayDesignBorder}` }}>
          <Typography sx={{ color: dayDesignAccent, fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.4px', mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarMonthIcon sx={{ fontSize: '0.75rem' }} />
            Day design
          </Typography>

          {blueprintSelection?.row && (
            <Typography sx={{ color: '#e2e8f0', fontSize: '0.78rem', mb: 0.35 }}>
              {blueprintSelection.row.blueprintName} · v{blueprintSelection.row.versionNumber}
            </Typography>
          )}

          {dayDesignSource === 'manual' && manualDayPlan && (
            <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem', mb: 1 }}>
              {manualDayPlan.eventDays} day{manualDayPlan.eventDays === 1 ? '' : 's'} · saved as a day design when you create this package
            </Typography>
          )}

          {blueprintSelection?.latest
            && blueprintSelection.latest.versionId !== sourceDayBlueprintVersionId && (
            <Typography sx={{ color: '#f59e0b', fontSize: '0.68rem', mb: 1 }}>
              Note: v{blueprintSelection.latest.versionNumber} is latest; this package snapshots v{blueprintSelection.row?.versionNumber}.
            </Typography>
          )}

          <Stack spacing={0.75}>
            {reviewDays.map((day) => (
              <Box
                key={day.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 0.85,
                  borderRadius: 1,
                  bgcolor: 'rgba(15,23,42,0.35)',
                  border: '1px solid rgba(148,163,184,0.08)',
                }}
              >
                <Typography sx={{ color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {day.name}
                </Typography>
                <Chip
                  label={`${day.activityCount} activit${day.activityCount === 1 ? 'y' : 'ies'}`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.58rem',
                    bgcolor: 'rgba(16,185,129,0.12)',
                    color: '#10b981',
                    border: 'none',
                  }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.35 }}>
                  <PlaceIcon sx={{ fontSize: '0.65rem', color: '#22d3ee' }} />
                  <Typography sx={{ color: '#22d3ee', fontSize: '0.65rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {day.locationCount} slot{day.locationCount === 1 ? '' : 's'}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Team breakdown */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
        <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
          <Typography sx={{ color: '#818cf8', fontWeight: 600, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.4px', mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <GroupsIcon sx={{ fontSize: '0.7rem' }} /> Roles & Crew
          </Typography>
          {roleSlots.length > 0 ? (
            <Stack spacing={0.25}>
              {roleSlots.map((slot) => {
                const role = availableJobRoles.find((r) => r.id === slot.jobRoleId);
                if (!role) return null;
                const roleName = role.display_name || role.name;
                const filledCount = Array.from({ length: slot.quantity }, (_, i) =>
                  handlers.getPositionCrewId(slot.jobRoleId, i),
                ).filter(Boolean).length;
                return (
                  <Box key={slot.jobRoleId} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WorkIcon sx={{ fontSize: '0.55rem', color: '#818cf8' }} />
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', flex: 1 }}>
                      {roleName}{' '}
                      <Box component="span" sx={{ color: '#64748b' }}>×{slot.quantity}</Box>
                    </Typography>
                    <Chip
                      label={filledCount === slot.quantity ? `${filledCount} filled` : `${filledCount}/${slot.quantity}`}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.5rem',
                        border: 'none',
                        bgcolor: filledCount === slot.quantity ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.1)',
                        color: filledCount === slot.quantity ? '#10b981' : '#64748b',
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Typography sx={{ color: '#475569', fontSize: '0.65rem', fontStyle: 'italic' }}>No roles added</Typography>
          )}
        </Box>

        <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'rgba(251,146,60,0.04)', border: '1px solid rgba(251,146,60,0.1)' }}>
          <Typography sx={{ color: '#fb923c', fontWeight: 600, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.4px', mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <VideocamIcon sx={{ fontSize: '0.7rem' }} /> Equipment
          </Typography>
          {stats.equipment > 0 ? (
            <Stack spacing={0.25}>
              {equipmentLines.map((line) => (
                <Box key={line.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {line.kind === 'CAMERA'
                    ? <CameraAltIcon sx={{ fontSize: '0.55rem', color: '#fb923c' }} />
                    : <MicIcon sx={{ fontSize: '0.55rem', color: '#22d3ee' }} />}
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {line.label}: {line.name}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography sx={{ color: '#475569', fontSize: '0.65rem', fontStyle: 'italic' }}>No equipment assigned</Typography>
          )}
        </Box>
      </Box>

      <Typography sx={{ color: '#475569', fontSize: '0.68rem', mt: 1.5, textAlign: 'center' }}>
        Guest planning default: {PACKAGE_PLANNING_GUEST_COUNT} — actual headcount is set from the inquiry or project.
      </Typography>
    </Box>
  );
}
