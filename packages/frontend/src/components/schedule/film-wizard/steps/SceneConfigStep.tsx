'use client';

import React, { useEffect, useMemo } from 'react';
import {
  Typography,
  Box,
  Stack,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Checkbox,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import ViewTimelineIcon from '@mui/icons-material/ViewTimeline';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import MovieFilterIcon from '@mui/icons-material/MovieFilter';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { MontageStyle } from '@/lib/types/domains/scenes';
import type { PackageActivityRecord, ActivitySceneConfig } from '../FilmCreationWizard';
import { buildDefaultSceneOrder, type SceneOrderEntry } from './SceneOrderStep';

// ─── Style Card Definitions ──────────────────────────────────────────

interface StyleCardDef {
  value: MontageStyle;
  icon: React.ReactNode;
  label: string;
  description: string;
  group: 'core' | 'advanced';
}

const STYLE_CARDS: StyleCardDef[] = [
  { value: MontageStyle.RHYTHMIC, icon: <MusicNoteIcon sx={{ fontSize: 16 }} />, label: 'Rhythmic', description: 'Even tempo-driven cuts', group: 'core' },
  { value: MontageStyle.HIGHLIGHTS, icon: <AutoAwesomeIcon sx={{ fontSize: 16 }} />, label: 'Highlights', description: 'Hero moments + dramatic pacing', group: 'core' },
  { value: MontageStyle.SEQUENTIAL, icon: <ViewTimelineIcon sx={{ fontSize: 16 }} />, label: 'Sequential', description: 'Chronological story flow', group: 'core' },
  { value: MontageStyle.PARALLEL, icon: <SwapHorizIcon sx={{ fontSize: 16 }} />, label: 'Parallel', description: 'Cross-cut between activities', group: 'advanced' },
  { value: MontageStyle.IMPRESSIONISTIC, icon: <BlurOnIcon sx={{ fontSize: 16 }} />, label: 'Impressionistic', description: 'Dreamy, emotional montage', group: 'advanced' },
  { value: MontageStyle.NARRATIVE_ARC, icon: <ShowChartIcon sx={{ fontSize: 16 }} />, label: 'Narrative Arc', description: 'Setup → climax → resolution', group: 'advanced' },
];

const ACTIVITY_COLORS = ['#F59E0B', '#14B8A6', '#EC4899', '#8B5CF6', '#06B6D4'];

// ─── Props ───────────────────────────────────────────────────────────

interface SceneConfigStepProps {
  activities: PackageActivityRecord[];
  selectedActivityIds: Set<number>;
  sceneConfigs: Record<number, ActivitySceneConfig>;
  onSceneConfigsChange: (configs: Record<number, ActivitySceneConfig>) => void;
  combineMontage: boolean;
  combinedMontageStyle: MontageStyle;
  combinedMontageDuration: number;
  onCombineMontageChange: (value: boolean) => void;
  onCombinedStyleChange: (style: MontageStyle) => void;
  onCombinedDurationChange: (duration: number) => void;
  sceneOrder: SceneOrderEntry[];
  onSceneOrderChange: (order: SceneOrderEntry[]) => void;
  disabled: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function suggestStyle(montageActivities: PackageActivityRecord[]): MontageStyle {
  const momentCounts = montageActivities.map(a => a.moments?.length ?? 0);
  const allMoments = montageActivities.flatMap(a => a.moments ?? []);
  const totalMomentCount = allMoments.length;

  if (momentCounts.length >= 3) {
    const min = Math.min(...momentCounts);
    const max = Math.max(...momentCounts);
    if (max - min <= 2) return MontageStyle.PARALLEL;
  }

  if (totalMomentCount > 0) {
    const avgDuration = allMoments.reduce((s, m) => s + (m.duration_seconds || 60), 0) / totalMomentCount;
    const hasHeroMoment = allMoments.some(m => (m.duration_seconds || 60) >= avgDuration * 3);
    if (hasHeroMoment) return MontageStyle.NARRATIVE_ARC;
  }

  if (totalMomentCount >= 15) return MontageStyle.RHYTHMIC;

  const minCount = Math.min(...momentCounts);
  const maxCount = Math.max(...momentCounts);
  if (momentCounts.length >= 2 && maxCount - minCount <= 2) return MontageStyle.SEQUENTIAL;

  return MontageStyle.HIGHLIGHTS;
}

const STYLE_LABELS: Record<string, string> = {
  RHYTHMIC: 'Rhythmic',
  IMPRESSIONISTIC: 'Impressionistic',
  SEQUENTIAL: 'Sequential',
  PARALLEL: 'Parallel',
  HIGHLIGHTS: 'Highlights',
  NARRATIVE_ARC: 'Narrative Arc',
};

// ─── Sortable Scene Card ─────────────────────────────────────────────

function SortableSceneCard({ entry, index }: { entry: SceneOrderEntry; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id });
  const isRealtime = entry.mode === 'REALTIME';

  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : undefined }}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        px: 1.5, py: 1, borderRadius: 1.5,
        border: '1px solid',
        borderColor: isDragging ? 'rgba(167,139,250,0.5)' : isRealtime ? 'rgba(52,58,68,0.4)' : 'rgba(167,139,250,0.25)',
        bgcolor: isDragging ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.02)',
        '&:hover': { borderColor: 'rgba(167,139,250,0.4)', bgcolor: 'rgba(255,255,255,0.03)' },
      }}
    >
      <Box {...attributes} {...listeners} sx={{ display: 'flex', alignItems: 'center', cursor: 'grab', color: '#64748b', '&:active': { cursor: 'grabbing' } }}>
        <DragIndicatorIcon sx={{ fontSize: 18 }} />
      </Box>
      <Typography sx={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{index + 1}</Typography>
      {isRealtime
        ? <VideocamIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
        : <AutoAwesomeMotionIcon sx={{ fontSize: 16, color: '#a78bfa' }} />
      }
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ color: '#f1f5f9', fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.label}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography sx={{ color: '#64748b', fontSize: '0.6rem' }}>{entry.durationLabel}</Typography>
          {entry.style && <Typography sx={{ color: '#94a3b8', fontSize: '0.55rem' }}>&middot; {STYLE_LABELS[entry.style] ?? entry.style}</Typography>}
        </Stack>
      </Box>
      <Chip
        label={isRealtime ? 'Realtime' : entry.isCombined ? 'Combined' : 'Montage'}
        size="small"
        sx={{
          height: 20, fontSize: '0.6rem', fontWeight: 600,
          bgcolor: isRealtime ? 'rgba(59,130,246,0.12)' : 'rgba(167,139,250,0.12)',
          color: isRealtime ? '#60a5fa' : '#a78bfa',
          border: '1px solid', borderColor: isRealtime ? 'rgba(59,130,246,0.25)' : 'rgba(167,139,250,0.25)',
        }}
      />
    </Box>
  );
}

// ─── Style Card Component ────────────────────────────────────────────

function StyleCard({
  card,
  selected,
  disabled: isDisabled,
  onClick,
}: {
  card: StyleCardDef;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip title={isDisabled ? 'Requires multiple activities' : ''} arrow>
      <Box
        onClick={isDisabled ? undefined : onClick}
        sx={{
          flex: '1 1 0',
          minWidth: 100,
          maxWidth: 140,
          p: 1,
          borderRadius: 1,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.4 : 1,
          bgcolor: selected ? 'rgba(123,97,255,0.1)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${selected ? 'rgba(123,97,255,0.5)' : 'rgba(52,58,68,0.3)'}`,
          position: 'relative',
          transition: 'all 0.15s',
          '&:hover': isDisabled ? {} : {
            bgcolor: selected ? 'rgba(123,97,255,0.12)' : 'rgba(123,97,255,0.06)',
            borderColor: selected ? 'rgba(123,97,255,0.6)' : 'rgba(52,58,68,0.5)',
          },
        }}
      >
        {selected && (
          <Box sx={{
            position: 'absolute', top: 4, right: 4,
            width: 6, height: 6, borderRadius: '50%',
            bgcolor: '#a78bfa',
          }} />
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
          <Box sx={{ color: selected ? '#a78bfa' : '#64748b' }}>{card.icon}</Box>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: selected ? '#e2e8f0' : '#94a3b8' }}>
            {card.label}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.2 }}>
          {card.description}
        </Typography>
      </Box>
    </Tooltip>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function SceneConfigStep({
  activities,
  selectedActivityIds,
  sceneConfigs,
  onSceneConfigsChange,
  combineMontage,
  combinedMontageStyle,
  combinedMontageDuration,
  onCombineMontageChange,
  onCombinedStyleChange,
  onCombinedDurationChange,
  sceneOrder,
  onSceneOrderChange,
  disabled,
}: SceneConfigStepProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const selectedActivities = activities
    .filter(a => selectedActivityIds.has(a.id))
    .sort((a, b) => {
      if (a.package_event_day_id !== b.package_event_day_id) return a.package_event_day_id - b.package_event_day_id;
      if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
      return a.name.localeCompare(b.name);
    });

  const getConfig = (activityId: number): ActivitySceneConfig => {
    return sceneConfigs[activityId] ?? { mode: 'REALTIME', montageDurationSeconds: 60 };
  };

  const updateConfig = (activityId: number, update: Partial<ActivitySceneConfig>) => {
    const current = getConfig(activityId);
    const newConfig = { ...current, ...update };

    // Auto-set BPM when switching to/from RHYTHMIC
    if (update.montageStyle !== undefined) {
      newConfig.montageBpm = update.montageStyle === MontageStyle.RHYTHMIC ? 120 : undefined;
    }

    onSceneConfigsChange({ ...sceneConfigs, [activityId]: newConfig });
  };

  const montageActivities = selectedActivities.filter(a => getConfig(a.id).mode === 'MONTAGE');
  const realtimeActivities = selectedActivities.filter(a => getConfig(a.id).mode === 'REALTIME');

  const showCombinedSection = montageActivities.length >= 2;
  const isCombined = showCombinedSection && combineMontage;

  // Auto-rebuild scene order when configs change
  useEffect(() => {
    const newOrder = buildDefaultSceneOrder(
      activities, selectedActivityIds, sceneConfigs,
      combineMontage, combinedMontageStyle, combinedMontageDuration,
    );
    // Preserve user reordering: if same set of IDs, keep previous positions for matching entries
    const prevIds = new Set(sceneOrder.map(e => e.id));
    const newIds = new Set(newOrder.map(e => e.id));
    const sameSet = prevIds.size === newIds.size && [...prevIds].every(id => newIds.has(id));
    if (sameSet && sceneOrder.length > 0) {
      // Update data (labels/durations) but keep the user's order
      const dataMap = new Map(newOrder.map(e => [e.id, e]));
      onSceneOrderChange(sceneOrder.map(prev => dataMap.get(prev.id) ?? prev));
    } else {
      onSceneOrderChange(newOrder);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneConfigs, combineMontage, combinedMontageStyle, combinedMontageDuration, selectedActivityIds]);

  const sortableIds = useMemo(() => sceneOrder.map(e => e.id), [sceneOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sceneOrder.findIndex(e => e.id === active.id);
    const newIdx = sceneOrder.findIndex(e => e.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    onSceneOrderChange(arrayMove(sceneOrder, oldIdx, newIdx));
  };

  // Compute totals
  const realtimeDuration = realtimeActivities.reduce(
    (sum, a) => sum + (a.duration_minutes ? a.duration_minutes * 60 : 0), 0,
  );
  const montageDuration = isCombined
    ? combinedMontageDuration
    : montageActivities.reduce((sum, a) => sum + (getConfig(a.id).montageDurationSeconds ?? 60), 0);
  const totalDuration = realtimeDuration + montageDuration;

  // Duration slider marks
  const sliderMarks = [
    { value: 30, label: '30s' },
    { value: 60, label: '1m' },
    { value: 120, label: '2m' },
    { value: 300, label: '5m' },
  ];

  // Empty state
  if (selectedActivities.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <MovieFilterIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.15)', mb: 1 }} />
        <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>
          Select activities in the previous step to configure scenes.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Box>
        <Typography
          variant="caption"
          sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}
        >
          Configure Scenes
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', display: 'block', mt: 0.25 }}>
          Choose <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Realtime</strong> for full moment-by-moment coverage, or{' '}
          <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Montage</strong> for a condensed highlight reel. You can mix both modes across activities.
        </Typography>
      </Box>

      {/* Per-activity cards */}
      <Stack spacing={1.5}>
        {selectedActivities.map((activity, index) => {
          const config = getConfig(activity.id);
          const activityDurationSec = activity.duration_minutes ? activity.duration_minutes * 60 : 0;
          const momentCount = activity.moments?.length ?? 0;
          const isInCombinedMontage = isCombined && config.mode === 'MONTAGE';

          return (
            <Box
              key={activity.id}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.02)',
                border: `1px solid ${isInCombinedMontage ? 'rgba(123,97,255,0.3)' : 'rgba(52, 58, 68, 0.3)'}`,
              }}
            >
              {/* Scene header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.6rem' }}>
                    SCENE {index + 1}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#e2e8f0' }}>
                    {activity.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {momentCount > 0 && (
                    <Chip
                      label={`${momentCount} moment${momentCount !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(100, 140, 255, 0.1)', color: '#648CFF', border: '1px solid rgba(100, 140, 255, 0.2)' }}
                    />
                  )}
                  {activityDurationSec > 0 && (
                    <Chip
                      label={formatDuration(activityDurationSec)}
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(52, 58, 68, 0.3)' }}
                    />
                  )}
                </Box>
              </Box>

              {/* Activity intelligence hint */}
              {momentCount <= 2 && momentCount > 0 && (
                <Chip
                  icon={<AutoAwesomeIcon sx={{ fontSize: '12px !important' }} />}
                  label="Great for montage"
                  size="small"
                  sx={{ height: 18, fontSize: '0.6rem', mb: 1, bgcolor: 'rgba(123,97,255,0.15)', color: 'rgba(123,97,255,0.7)', '& .MuiChip-icon': { color: 'rgba(123,97,255,0.7)' } }}
                />
              )}
              {momentCount >= 10 && (
                <Chip
                  icon={<ViewTimelineIcon sx={{ fontSize: '12px !important' }} />}
                  label={`Rich timeline — ${momentCount} moments`}
                  size="small"
                  sx={{ height: 18, fontSize: '0.6rem', mb: 1, bgcolor: 'rgba(30,136,229,0.15)', color: 'rgba(30,136,229,0.7)', '& .MuiChip-icon': { color: 'rgba(30,136,229,0.7)' } }}
                />
              )}

              {/* Mode toggle */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: config.mode === 'MONTAGE' ? 1 : 0 }}>
                <ToggleButtonGroup
                  value={config.mode}
                  exclusive
                  onChange={(_e, newMode) => {
                    if (newMode) {
                      updateConfig(activity.id, {
                        mode: newMode,
                        montageStyle: newMode === 'MONTAGE' ? (config.montageStyle ?? MontageStyle.HIGHLIGHTS) : config.montageStyle,
                      });
                    }
                  }}
                  disabled={disabled}
                  size="small"
                  sx={{ flexShrink: 0 }}
                >
                  <ToggleButton
                    value="REALTIME"
                    sx={{
                      textTransform: 'none', px: 1.5, py: 0.5, fontSize: '0.75rem', fontWeight: 600,
                      color: config.mode === 'REALTIME' ? '#648CFF' : '#64748b',
                      borderColor: config.mode === 'REALTIME' ? 'rgba(100, 140, 255, 0.4)' : 'rgba(52, 58, 68, 0.3)',
                      bgcolor: config.mode === 'REALTIME' ? 'rgba(100, 140, 255, 0.1)' : 'transparent',
                      '&.Mui-selected': { bgcolor: 'rgba(100, 140, 255, 0.15)', color: '#648CFF' },
                      '&:hover': { bgcolor: 'rgba(100, 140, 255, 0.08)' },
                    }}
                  >
                    <VideocamIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    Realtime
                  </ToggleButton>
                  <ToggleButton
                    value="MONTAGE"
                    sx={{
                      textTransform: 'none', px: 1.5, py: 0.5, fontSize: '0.75rem', fontWeight: 600,
                      color: config.mode === 'MONTAGE' ? '#a78bfa' : '#64748b',
                      borderColor: config.mode === 'MONTAGE' ? 'rgba(167, 139, 250, 0.4)' : 'rgba(52, 58, 68, 0.3)',
                      bgcolor: config.mode === 'MONTAGE' ? 'rgba(167, 139, 250, 0.1)' : 'transparent',
                      '&.Mui-selected': { bgcolor: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa' },
                      '&:hover': { bgcolor: 'rgba(167, 139, 250, 0.08)' },
                    }}
                  >
                    <AutoAwesomeMotionIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    Montage
                  </ToggleButton>
                </ToggleButtonGroup>

                {/* Mode explainer */}
                <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', flex: 1 }}>
                  {config.mode === 'REALTIME'
                    ? `Full timeline — each moment gets its own adjustable segment.${activityDurationSec > 0 ? ` ${formatDuration(activityDurationSec)}` : ''}${momentCount > 0 ? ` • ${momentCount} moments` : ''}`
                    : 'Highlight reel — moments are scaled to fit a shorter duration.'}
                </Typography>
              </Box>

              {/* Montage controls */}
              {config.mode === 'MONTAGE' && (
                isInCombinedMontage ? (
                  <Typography sx={{ fontSize: '0.72rem', color: 'rgba(123,97,255,0.6)', fontStyle: 'italic', mt: 0.5 }}>
                    Included in combined montage
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {/* Style cards - Core */}
                    <Box>
                      <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                        Core Styles
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.75 }}>
                        {STYLE_CARDS.filter(c => c.group === 'core').map(card => (
                          <StyleCard
                            key={card.value}
                            card={card}
                            selected={config.montageStyle === card.value}
                            disabled={disabled}
                            onClick={() => updateConfig(activity.id, { montageStyle: card.value })}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Style cards - Advanced */}
                    <Box>
                      <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                        Advanced Styles
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.75 }}>
                        {STYLE_CARDS.filter(c => c.group === 'advanced').map(card => {
                          const isParallel = card.value === MontageStyle.PARALLEL;
                          return (
                            <StyleCard
                              key={card.value}
                              card={card}
                              selected={config.montageStyle === card.value}
                              disabled={disabled || isParallel}
                              onClick={() => updateConfig(activity.id, { montageStyle: card.value })}
                            />
                          );
                        })}
                      </Box>
                    </Box>

                    {/* Duration slider */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Slider
                        value={config.montageDurationSeconds ?? 60}
                        onChange={(_e, val) => updateConfig(activity.id, { montageDurationSeconds: val as number })}
                        min={10}
                        max={Math.min(activityDurationSec || 600, 600)}
                        step={5}
                        marks={sliderMarks.filter(m => m.value <= Math.min(activityDurationSec || 600, 600))}
                        disabled={disabled}
                        valueLabelDisplay="auto"
                        valueLabelFormat={formatDuration}
                        sx={{
                          flex: 1,
                          color: '#a78bfa',
                          '& .MuiSlider-thumb': { width: 14, height: 14 },
                          '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.08)' },
                          '& .MuiSlider-mark': { bgcolor: 'rgba(255,255,255,0.15)', width: 2, height: 8 },
                          '& .MuiSlider-markLabel': { fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)' },
                        }}
                      />
                      <Typography sx={{ color: '#a78bfa', fontWeight: 600, fontSize: '0.72rem', minWidth: 48, textAlign: 'right' }}>
                        {formatDuration(config.montageDurationSeconds ?? 60)}
                      </Typography>
                    </Box>

                    {/* Duration warnings */}
                    {(config.montageDurationSeconds ?? 60) <= 30 && (
                      <Chip
                        label="Very short — moments will be heavily compressed"
                        size="small"
                        sx={{ height: 20, fontSize: '0.6rem', bgcolor: 'rgba(245,158,11,0.2)', color: 'rgba(245,158,11,0.8)', alignSelf: 'flex-start' }}
                      />
                    )}
                    {(config.montageDurationSeconds ?? 60) >= 300 && (
                      <Chip
                        label="Long montage — consider splitting into separate scenes"
                        size="small"
                        sx={{ height: 20, fontSize: '0.6rem', bgcolor: 'rgba(30,136,229,0.15)', color: 'rgba(30,136,229,0.7)', alignSelf: 'flex-start' }}
                      />
                    )}
                  </Stack>
                )
              )}
            </Box>
          );
        })}
      </Stack>

      {/* Combined Montage Section */}
      {showCombinedSection && (
        <Box sx={{
          p: 2, borderRadius: 2,
          bgcolor: 'rgba(123,97,255,0.04)',
          border: '1px solid rgba(123,97,255,0.2)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <AutoAwesomeMotionIcon sx={{ fontSize: 18, color: '#a78bfa' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#e2e8f0' }}>
              Montage Scene
            </Typography>
            <Chip
              label={`${montageActivities.length} activities`}
              size="small"
              sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(123,97,255,0.15)', color: '#a78bfa' }}
            />
          </Box>

          {/* Split checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={!combineMontage}
                onChange={(e) => onCombineMontageChange(!e.target.checked)}
                size="small"
                sx={{ color: 'rgba(123,97,255,0.5)', '&.Mui-checked': { color: '#a78bfa' }, p: 0.5 }}
              />
            }
            label={
              <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
                Create separate montage per activity instead
              </Typography>
            }
            sx={{ mb: combineMontage ? 1.5 : 0, ml: -0.5 }}
          />

          {combineMontage && (
            <Stack spacing={1.5}>
              {/* Source activity chips */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {montageActivities.map((activity, idx) => (
                  <Chip
                    key={activity.id}
                    label={`${activity.name} (${activity.moments?.length ?? 0})`}
                    size="small"
                    sx={{
                      height: 22, fontSize: '0.65rem', fontWeight: 600,
                      bgcolor: `${ACTIVITY_COLORS[idx % ACTIVITY_COLORS.length]}22`,
                      color: ACTIVITY_COLORS[idx % ACTIVITY_COLORS.length],
                      border: `1px solid ${ACTIVITY_COLORS[idx % ACTIVITY_COLORS.length]}44`,
                    }}
                  />
                ))}
              </Box>

              {/* Activity proportion bar */}
              {(() => {
                const counts = montageActivities.map(a => a.moments?.length ?? 1);
                const total = counts.reduce((s, c) => s + c, 0);
                return (
                  <Box sx={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.05)' }}>
                    {montageActivities.map((activity, idx) => (
                      <Tooltip key={activity.id} title={`${activity.name}: ${counts[idx]} moment${counts[idx] !== 1 ? 's' : ''}`} arrow>
                        <Box sx={{
                          width: `${(counts[idx] / total) * 100}%`,
                          bgcolor: ACTIVITY_COLORS[idx % ACTIVITY_COLORS.length],
                          opacity: 0.7,
                          transition: 'width 0.3s',
                        }} />
                      </Tooltip>
                    ))}
                  </Box>
                );
              })()}

              {/* Shared style cards */}
              <Box>
                <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                  Core Styles
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                  {STYLE_CARDS.filter(c => c.group === 'core').map(card => (
                    <StyleCard
                      key={card.value}
                      card={card}
                      selected={combinedMontageStyle === card.value}
                      disabled={disabled}
                      onClick={() => onCombinedStyleChange(card.value)}
                    />
                  ))}
                </Box>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                  Advanced Styles
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                  {STYLE_CARDS.filter(c => c.group === 'advanced').map(card => (
                    <StyleCard
                      key={card.value}
                      card={card}
                      selected={combinedMontageStyle === card.value}
                      disabled={disabled}
                      onClick={() => onCombinedStyleChange(card.value)}
                    />
                  ))}
                </Box>
              </Box>

              {/* Smart suggestion label */}
              {combinedMontageStyle === suggestStyle(montageActivities) && (
                <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                  Suggested based on your moments
                </Typography>
              )}

              {/* Shared duration slider */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Slider
                  value={combinedMontageDuration}
                  onChange={(_e, val) => onCombinedDurationChange(val as number)}
                  min={10}
                  max={600}
                  step={5}
                  marks={sliderMarks}
                  disabled={disabled}
                  valueLabelDisplay="auto"
                  valueLabelFormat={formatDuration}
                  sx={{
                    flex: 1,
                    color: '#a78bfa',
                    '& .MuiSlider-thumb': { width: 14, height: 14 },
                    '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.08)' },
                    '& .MuiSlider-mark': { bgcolor: 'rgba(255,255,255,0.15)', width: 2, height: 8 },
                    '& .MuiSlider-markLabel': { fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)' },
                  }}
                />
                <Typography sx={{ color: '#a78bfa', fontWeight: 600, fontSize: '0.72rem', minWidth: 48, textAlign: 'right' }}>
                  {formatDuration(combinedMontageDuration)}
                </Typography>
              </Box>
            </Stack>
          )}

          {!combineMontage && (
            <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', mt: 0.5 }}>
              Each activity will get its own montage scene with individual settings.
            </Typography>
          )}
        </Box>
      )}

      {/* Scene Order */}
      {sceneOrder.length >= 2 && (
        <Box sx={{
          p: 2, borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(52,58,68,0.3)',
        }}>
          <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
            Scene Order
          </Typography>
          <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', mb: 1.5 }}>
            Drag to reorder how scenes appear in your film.
          </Typography>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <Stack spacing={0.75}>
                {sceneOrder.map((entry, index) => (
                  <SortableSceneCard key={entry.id} entry={entry} index={index} />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>
        </Box>
      )}

      {/* Creation Summary */}
      <Box sx={{
        p: 1.5, borderRadius: 2,
        bgcolor: 'rgba(30,136,229,0.08)',
        border: '1px solid rgba(30,136,229,0.2)',
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <InfoOutlinedIcon sx={{ fontSize: 18, color: 'rgba(30,136,229,0.7)' }} />
        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
          {(() => {
            const parts: string[] = [];
            if (realtimeActivities.length > 0) {
              parts.push(`${realtimeActivities.length} Realtime scene${realtimeActivities.length !== 1 ? 's' : ''}`);
            }
            if (montageActivities.length > 0) {
              if (isCombined) {
                const styleName = STYLE_CARDS.find(c => c.value === combinedMontageStyle)?.label ?? 'Highlights';
                parts.push(`1 Montage scene (${styleName}, ${formatDuration(combinedMontageDuration)})`);
              } else {
                parts.push(`${montageActivities.length} separate Montage scene${montageActivities.length !== 1 ? 's' : ''}`);
              }
            }
            return `Will create: ${parts.join(' + ')}`;
          })()}
        </Typography>
      </Box>

      {/* Total Duration Summary */}
      <Box sx={{
        p: 1.5, borderRadius: 2,
        bgcolor: 'rgba(100, 140, 255, 0.05)',
        border: '1px solid rgba(100, 140, 255, 0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
          Estimated Total Duration
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {realtimeActivities.length > 0 && montageActivities.length > 0 ? (
            <>
              <Typography component="span" sx={{ fontSize: '0.72rem', color: '#648CFF', fontWeight: 600 }}>
                {formatDuration(realtimeDuration)} Realtime
              </Typography>
              <Typography component="span" sx={{ fontSize: '0.72rem', color: '#64748b' }}>+</Typography>
              <Typography component="span" sx={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 600 }}>
                {formatDuration(montageDuration)} Montage
              </Typography>
              <Typography component="span" sx={{ fontSize: '0.72rem', color: '#64748b' }}>=</Typography>
            </>
          ) : null}
          <Typography sx={{ color: '#648CFF', fontWeight: 700, fontSize: '0.85rem' }}>
            {formatDuration(totalDuration)}
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
}
