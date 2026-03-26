'use client';

import React from 'react';
import {
  Typography,
  Box,
  Stack,
  Slider,
  LinearProgress,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import type { FilmStructureTemplateScene } from '@/lib/types/domains/film-structure-templates';
import type { MontagePreset } from '@/lib/types/domains/montage-presets';
import type { SceneDurationOverride } from '../FilmCreationWizard';

interface DurationReviewStepProps {
  templateScenes: FilmStructureTemplateScene[];
  selectedPreset: MontagePreset | null;
  durationOverrides: SceneDurationOverride[];
  onDurationOverridesChange: (overrides: SceneDurationOverride[]) => void;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

export function DurationReviewStep({
  templateScenes,
  selectedPreset,
  durationOverrides,
  onDurationOverridesChange,
}: DurationReviewStepProps) {
  const getDuration = (sceneIndex: number, scene: FilmStructureTemplateScene): number => {
    const override = durationOverrides.find(d => d.sceneIndex === sceneIndex);
    return override?.durationSeconds ?? scene.suggested_duration_seconds ?? 60;
  };

  const setDuration = (sceneIndex: number, durationSeconds: number) => {
    const existing = durationOverrides.find(d => d.sceneIndex === sceneIndex);
    if (existing) {
      onDurationOverridesChange(
        durationOverrides.map(d => d.sceneIndex === sceneIndex ? { ...d, durationSeconds } : d),
      );
    } else {
      onDurationOverridesChange([...durationOverrides, { sceneIndex, durationSeconds }]);
    }
  };

  const totalDuration = templateScenes.reduce(
    (sum, scene, idx) => sum + getDuration(idx, scene),
    0,
  );

  const targetMin = selectedPreset?.min_duration_seconds ?? 0;
  const targetMax = selectedPreset?.max_duration_seconds ?? 0;
  const hasTarget = targetMin > 0 || targetMax > 0;
  const isUnder = hasTarget && totalDuration < targetMin;
  const isOver = hasTarget && totalDuration > targetMax;
  const isInRange = hasTarget && totalDuration >= targetMin && totalDuration <= targetMax;

  // Progress bar value: percentage of target range
  const progressPct = hasTarget && targetMax > 0
    ? Math.min((totalDuration / targetMax) * 100, 120)
    : 0;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography
          variant="caption"
          sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}
        >
          Duration Review
        </Typography>
        <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem', display: 'block', mt: 0.25 }}>
          Adjust scene durations to hit your target range.
        </Typography>
      </Box>

      {/* Target range bar */}
      {hasTarget && (
        <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(52, 58, 68, 0.3)', bgcolor: 'rgba(255,255,255,0.02)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {isInRange && <CheckCircleOutlineIcon sx={{ fontSize: 16, color: '#10b981' }} />}
              {(isUnder || isOver) && <WarningAmberIcon sx={{ fontSize: 16, color: '#f59e0b' }} />}
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#f1f5f9' }}>
                {formatDuration(totalDuration)}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
              Target: {formatDuration(targetMin)} – {formatDuration(targetMax)}
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={Math.min(progressPct, 100)}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(52, 58, 68, 0.3)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                bgcolor: isInRange ? '#10b981' : isUnder ? '#f59e0b' : '#ef4444',
              },
            }}
          />

          {isUnder && (
            <Typography variant="caption" sx={{ color: '#f59e0b', fontSize: '0.68rem', mt: 0.5, display: 'block' }}>
              {formatDuration(targetMin - totalDuration)} under minimum
            </Typography>
          )}
          {isOver && (
            <Typography variant="caption" sx={{ color: '#ef4444', fontSize: '0.68rem', mt: 0.5, display: 'block' }}>
              {formatDuration(totalDuration - targetMax)} over maximum
            </Typography>
          )}
        </Box>
      )}

      {/* Per-scene sliders */}
      <Stack spacing={1} sx={{ maxHeight: 260, overflowY: 'auto', pr: 0.5 }}>
        {templateScenes.map((scene, idx) => {
          const duration = getDuration(idx, scene);
          const suggested = scene.suggested_duration_seconds || 60;
          const maxSlider = Math.max(suggested * 3, 600);
          return (
            <Box
              key={scene.id}
              sx={{ p: 1.25, borderRadius: 1.5, border: '1px solid rgba(52, 58, 68, 0.2)', bgcolor: 'rgba(255,255,255,0.02)' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem' }}>
                  {idx + 1}. {scene.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.78rem' }}>
                  {formatDuration(duration)}
                </Typography>
              </Box>
              <Slider
                value={duration}
                min={5}
                max={maxSlider}
                step={5}
                onChange={(_, val) => setDuration(idx, val as number)}
                sx={{
                  color: '#a78bfa',
                  height: 4,
                  '& .MuiSlider-thumb': { width: 14, height: 14 },
                  '& .MuiSlider-rail': { bgcolor: 'rgba(52, 58, 68, 0.4)' },
                }}
              />
            </Box>
          );
        })}
      </Stack>

      {/* Total */}
      {!hasTarget && templateScenes.length > 0 && (
        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(100, 140, 255, 0.06)', border: '1px solid rgba(100, 140, 255, 0.15)' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
            Total duration: <strong style={{ color: '#f1f5f9' }}>{formatDuration(totalDuration)}</strong>
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
