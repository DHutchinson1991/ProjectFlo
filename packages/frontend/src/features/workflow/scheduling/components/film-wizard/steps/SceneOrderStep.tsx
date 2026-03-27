'use client';

import React, { useMemo } from 'react';
import {
  Typography,
  Box,
  Stack,
  Chip,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VideocamIcon from '@mui/icons-material/Videocam';
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion';
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

import { MontageStyle } from '@/features/content/scenes/types';
import type { PackageActivityRecord, ActivitySceneConfig } from '../FilmCreationWizard';

// ─── Types ───────────────────────────────────────────────────────────

export interface SceneOrderEntry {
  /** Unique drag key: 'activity-{id}' or 'combined-montage' */
  id: string;
  label: string;
  mode: 'REALTIME' | 'MONTAGE';
  /** Activity IDs that source this scene */
  activityIds: number[];
  durationLabel: string;
  style?: MontageStyle;
  isCombined: boolean;
}

interface SceneOrderStepProps {
  activities: PackageActivityRecord[];
  selectedActivityIds: Set<number>;
  sceneConfigs: Record<number, ActivitySceneConfig>;
  combineMontage: boolean;
  combinedMontageStyle: MontageStyle;
  combinedMontageDuration: number;
  sceneOrder: SceneOrderEntry[];
  onSceneOrderChange: (order: SceneOrderEntry[]) => void;
  disabled?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const STYLE_LABELS: Record<string, string> = {
  RHYTHMIC: 'Rhythmic',
  IMPRESSIONISTIC: 'Impressionistic',
  SEQUENTIAL: 'Sequential',
  PARALLEL: 'Parallel',
  HIGHLIGHTS: 'Highlights',
  NARRATIVE_ARC: 'Narrative Arc',
};

function formatDuration(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${seconds}s`;
}

/** Build the default scene order from current wizard state */
export function buildDefaultSceneOrder(
  activities: PackageActivityRecord[],
  selectedActivityIds: Set<number>,
  sceneConfigs: Record<number, ActivitySceneConfig>,
  combineMontage: boolean,
  combinedMontageStyle: MontageStyle,
  combinedMontageDuration: number,
): SceneOrderEntry[] {
  const selected = activities
    .filter(a => selectedActivityIds.has(a.id))
    .sort((a, b) => {
      const dayA = a.package_event_day_id ?? 0;
      const dayB = b.package_event_day_id ?? 0;
      if (dayA !== dayB) return dayA - dayB;
      const timeA = a.start_time ?? '';
      const timeB = b.start_time ?? '';
      if (timeA !== timeB) return timeA.localeCompare(timeB);
      return a.name.localeCompare(b.name);
    });

  const entries: SceneOrderEntry[] = [];
  const montageActivities = selected.filter(
    a => (sceneConfigs[a.id] ?? { mode: 'REALTIME' as const }).mode === 'MONTAGE',
  );
  const shouldCombine = combineMontage && montageActivities.length >= 2;
  let combinedInserted = false;

  for (const activity of selected) {
    const config = sceneConfigs[activity.id] ?? { mode: 'REALTIME' as const };

    if (config.mode === 'REALTIME') {
      const durSec = activity.duration_minutes ? activity.duration_minutes * 60 : undefined;
      entries.push({
        id: `activity-${activity.id}`,
        label: activity.name,
        mode: 'REALTIME',
        activityIds: [activity.id],
        durationLabel: durSec ? formatDuration(durSec) : 'No duration',
        isCombined: false,
      });
    } else if (shouldCombine) {
      if (!combinedInserted) {
        const combinedName =
          montageActivities.length <= 3
            ? montageActivities.map(a => a.name).join(' + ')
            : 'Combined Montage';
        entries.push({
          id: 'combined-montage',
          label: combinedName,
          mode: 'MONTAGE',
          activityIds: montageActivities.map(a => a.id),
          durationLabel: formatDuration(combinedMontageDuration),
          style: combinedMontageStyle,
          isCombined: true,
        });
        combinedInserted = true;
      }
      // Skip subsequent montage activities — already in combined
    } else {
      // Individual montage scene
      const durSec = config.montageDurationSeconds ?? 60;
      entries.push({
        id: `activity-${activity.id}`,
        label: activity.name,
        mode: 'MONTAGE',
        activityIds: [activity.id],
        durationLabel: formatDuration(durSec),
        style: config.montageStyle,
        isCombined: false,
      });
    }
  }

  return entries;
}

// ─── Sortable Scene Card ─────────────────────────────────────────────

function SortableSceneCard({
  entry,
  index,
}: {
  entry: SceneOrderEntry;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto' as const,
  };

  const isRealtime = entry.mode === 'REALTIME';

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isDragging
          ? 'rgba(167, 139, 250, 0.5)'
          : isRealtime
            ? 'rgba(52, 58, 68, 0.4)'
            : 'rgba(167, 139, 250, 0.25)',
        bgcolor: isDragging
          ? 'rgba(167, 139, 250, 0.08)'
          : 'rgba(255, 255, 255, 0.02)',
        '&:hover': {
          borderColor: 'rgba(167, 139, 250, 0.4)',
          bgcolor: 'rgba(255, 255, 255, 0.03)',
        },
      }}
    >
      {/* Drag handle */}
      <Box
        {...attributes}
        {...listeners}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'grab',
          color: '#64748b',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <DragIndicatorIcon sx={{ fontSize: 20 }} />
      </Box>

      {/* Order number */}
      <Typography
        sx={{
          color: '#64748b',
          fontSize: '0.75rem',
          fontWeight: 700,
          minWidth: 20,
          textAlign: 'center',
        }}
      >
        {index + 1}
      </Typography>

      {/* Mode icon */}
      {isRealtime ? (
        <VideocamIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
      ) : (
        <AutoAwesomeMotionIcon sx={{ fontSize: 18, color: '#a78bfa' }} />
      )}

      {/* Scene info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            color: '#f1f5f9',
            fontSize: '0.85rem',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {entry.label}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
          <Typography sx={{ color: '#64748b', fontSize: '0.7rem' }}>
            {entry.durationLabel}
          </Typography>
          {entry.style && (
            <Typography sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
              &middot; {STYLE_LABELS[entry.style] ?? entry.style}
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Mode chip */}
      <Chip
        label={isRealtime ? 'Realtime' : entry.isCombined ? 'Combined' : 'Montage'}
        size="small"
        sx={{
          height: 22,
          fontSize: '0.65rem',
          fontWeight: 600,
          bgcolor: isRealtime ? 'rgba(59, 130, 246, 0.12)' : 'rgba(167, 139, 250, 0.12)',
          color: isRealtime ? '#60a5fa' : '#a78bfa',
          border: '1px solid',
          borderColor: isRealtime ? 'rgba(59, 130, 246, 0.25)' : 'rgba(167, 139, 250, 0.25)',
        }}
      />
    </Box>
  );
}

// ─── Component ───────────────────────────────────────────────────────

export function SceneOrderStep({
  sceneOrder,
  onSceneOrderChange,
  disabled,
}: SceneOrderStepProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = sceneOrder.findIndex(e => e.id === active.id);
    const newIdx = sceneOrder.findIndex(e => e.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    onSceneOrderChange(arrayMove(sceneOrder, oldIdx, newIdx));
  };

  const sortableIds = useMemo(() => sceneOrder.map(e => e.id), [sceneOrder]);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ color: '#f1f5f9', fontWeight: 700, mb: 0.5 }}>
        Scene Order
      </Typography>
      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
        Drag scenes to set the order they&apos;ll appear in your film. The default order follows the
        timeline chronology.
      </Typography>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <Stack spacing={1}>
            {sceneOrder.map((entry, index) => (
              <SortableSceneCard key={entry.id} entry={entry} index={index} />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>

      {sceneOrder.length === 0 && (
        <Box
          sx={{
            py: 4,
            textAlign: 'center',
            borderRadius: 2,
            border: '1px dashed rgba(52, 58, 68, 0.4)',
          }}
        >
          <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
            No scenes to order. Go back and configure your activities.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
