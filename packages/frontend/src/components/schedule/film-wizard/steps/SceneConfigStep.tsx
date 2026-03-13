'use client';

import React from 'react';
import {
  Typography,
  Box,
  Stack,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion';

import type { PackageActivityRecord, ActivitySceneConfig } from '../FilmCreationWizard';

interface SceneConfigStepProps {
  activities: PackageActivityRecord[];
  selectedActivityIds: Set<number>;
  sceneConfigs: Record<number, ActivitySceneConfig>;
  onSceneConfigsChange: (configs: Record<number, ActivitySceneConfig>) => void;
  disabled: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function SceneConfigStep({
  activities,
  selectedActivityIds,
  sceneConfigs,
  onSceneConfigsChange,
  disabled,
}: SceneConfigStepProps) {
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
    onSceneConfigsChange({
      ...sceneConfigs,
      [activityId]: { ...current, ...update },
    });
  };

  const totalDuration = selectedActivities.reduce((sum, activity) => {
    const config = getConfig(activity.id);
    if (config.mode === 'REALTIME') {
      return sum + (activity.duration_minutes ? activity.duration_minutes * 60 : 0);
    }
    return sum + (config.montageDurationSeconds ?? 60);
  }, 0);

  return (
    <Stack spacing={2}>
      <Box>
        <Typography
          variant="caption"
          sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}
        >
          Configure Scenes
        </Typography>
        <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem', display: 'block', mt: 0.25 }}>
          Each activity becomes a scene. Choose realtime (full length with moments) or montage (condensed with beats).
        </Typography>
      </Box>

      <Stack spacing={1.5}>
        {selectedActivities.map((activity, index) => {
          const config = getConfig(activity.id);
          const activityDurationSec = activity.duration_minutes ? activity.duration_minutes * 60 : 0;
          const momentCount = activity.moments?.length ?? 0;

          return (
            <Box
              key={activity.id}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(52, 58, 68, 0.3)',
              }}
            >
              {/* Scene header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
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

              {/* Mode toggle */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ToggleButtonGroup
                  value={config.mode}
                  exclusive
                  onChange={(_e, newMode) => { if (newMode) updateConfig(activity.id, { mode: newMode }); }}
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

                {/* Scene details */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {config.mode === 'REALTIME' ? (
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                      Full length{activityDurationSec > 0 ? ` • ${formatDuration(activityDurationSec)}` : ''}{momentCount > 0 ? ` • ${momentCount} moments auto-populated` : ''}
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Slider
                        value={config.montageDurationSeconds ?? 60}
                        onChange={(_e, val) => updateConfig(activity.id, { montageDurationSeconds: val as number })}
                        min={10}
                        max={Math.min(activityDurationSec || 600, 600)}
                        step={5}
                        disabled={disabled}
                        valueLabelDisplay="auto"
                        valueLabelFormat={formatDuration}
                        sx={{
                          flex: 1,
                          color: '#a78bfa',
                          '& .MuiSlider-thumb': { width: 14, height: 14 },
                          '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.08)' },
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#a78bfa', fontWeight: 600, fontSize: '0.72rem', minWidth: 48, textAlign: 'right' }}>
                        {formatDuration(config.montageDurationSeconds ?? 60)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Stack>

      {/* Total duration summary */}
      <Box sx={{
        p: 1.5, borderRadius: 2,
        bgcolor: 'rgba(100, 140, 255, 0.05)',
        border: '1px solid rgba(100, 140, 255, 0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
          Estimated Total Duration
        </Typography>
        <Typography variant="body2" sx={{ color: '#648CFF', fontWeight: 700, fontSize: '0.85rem' }}>
          {formatDuration(totalDuration)}
        </Typography>
      </Box>
    </Stack>
  );
}
