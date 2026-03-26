'use client';

import React, { useCallback } from 'react';
import {
  Typography,
  Box,
  Stack,
  Chip,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';

import type { FilmStructureTemplateScene } from '@/lib/types/domains/film-structure-templates';
import type { PackageActivityRecord, SceneAudioConfig } from '../FilmCreationWizard';

interface AudioSourceStepProps {
  templateScenes: FilmStructureTemplateScene[];
  activities: PackageActivityRecord[];
  audioConfigs: SceneAudioConfig[];
  onAudioConfigsChange: (configs: SceneAudioConfig[]) => void;
  disabled: boolean;
}

export function AudioSourceStep({
  templateScenes,
  activities,
  audioConfigs,
  onAudioConfigsChange,
  disabled,
}: AudioSourceStepProps) {

  const getConfig = (sceneIndex: number): SceneAudioConfig => {
    return audioConfigs.find(c => c.sceneIndex === sceneIndex) || {
      sceneIndex,
      sourceType: null,
      trackType: 'SPEECH',
    };
  };

  const updateConfig = useCallback((sceneIndex: number, update: Partial<SceneAudioConfig>) => {
    const existing = audioConfigs.find(c => c.sceneIndex === sceneIndex);
    if (existing) {
      onAudioConfigsChange(audioConfigs.map(c => c.sceneIndex === sceneIndex ? { ...c, ...update } : c));
    } else {
      onAudioConfigsChange([...audioConfigs, { sceneIndex, sourceType: null, trackType: 'SPEECH' as const, ...update }]);
    }
  }, [audioConfigs, onAudioConfigsChange]);

  // Build a flat list of audio-eligible sources from activities + their moments
  const sourceOptions = activities.flatMap(activity => {
    const opts: Array<{ label: string; sourceType: 'ACTIVITY' | 'MOMENT'; activityId: number; momentId?: number }> = [
      { label: `${activity.name} (full)`, sourceType: 'ACTIVITY', activityId: activity.id },
    ];
    for (const moment of (activity.moments || [])) {
      opts.push({
        label: `${activity.name} → ${moment.name}`,
        sourceType: 'MOMENT',
        activityId: activity.id,
        momentId: moment.id,
      });
    }
    return opts;
  });

  return (
    <Stack spacing={2}>
      <Box>
        <Typography
          variant="caption"
          sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}
        >
          Audio Sources
        </Typography>
        <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem', display: 'block', mt: 0.25 }}>
          Optionally set where each scene&apos;s audio comes from (e.g., vows audio over a montage).
        </Typography>
      </Box>

      <Stack spacing={1} sx={{ maxHeight: 340, overflowY: 'auto', pr: 0.5 }}>
        {templateScenes.map((scene, sceneIdx) => {
          const config = getConfig(sceneIdx);
          const selectedSourceKey = config.sourceType === 'MOMENT' && config.sourceMomentId
            ? `MOMENT:${config.sourceActivityId}:${config.sourceMomentId}`
            : config.sourceType === 'ACTIVITY' && config.sourceActivityId
              ? `ACTIVITY:${config.sourceActivityId}`
              : '';

          return (
            <Box
              key={scene.id}
              sx={{
                p: 1.5, borderRadius: 2,
                border: '1px solid rgba(52, 58, 68, 0.3)',
                bgcolor: 'rgba(255,255,255,0.02)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  label={sceneIdx + 1}
                  size="small"
                  sx={{ height: 20, width: 20, fontSize: '0.65rem', bgcolor: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa' }}
                />
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#f1f5f9', flex: 1 }}>
                  {scene.name}
                </Typography>
                <GraphicEqIcon sx={{ fontSize: 16, color: config.sourceType ? '#10b981' : '#334155' }} />
              </Box>

              <Stack spacing={1}>
                <Select
                  value={selectedSourceKey}
                  displayEmpty
                  size="small"
                  disabled={disabled}
                  onChange={(e) => {
                    const val = e.target.value as string;
                    if (!val) {
                      updateConfig(sceneIdx, { sourceType: null, sourceActivityId: undefined, sourceMomentId: undefined });
                      return;
                    }
                    const [type, actId, momId] = val.split(':');
                    updateConfig(sceneIdx, {
                      sourceType: type as 'ACTIVITY' | 'MOMENT',
                      sourceActivityId: parseInt(actId, 10),
                      sourceMomentId: momId ? parseInt(momId, 10) : undefined,
                    });
                  }}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(52, 58, 68, 0.4)' },
                    '& .MuiSelect-select': { color: '#94a3b8', fontSize: '0.78rem', py: 0.75 },
                    '& .MuiSvgIcon-root': { color: '#475569' },
                  }}
                >
                  <MenuItem value="">
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                      No audio source
                    </Typography>
                  </MenuItem>
                  {sourceOptions.map((opt, idx) => (
                    <MenuItem
                      key={idx}
                      value={opt.sourceType === 'MOMENT' ? `MOMENT:${opt.activityId}:${opt.momentId}` : `ACTIVITY:${opt.activityId}`}
                    >
                      <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                        {opt.label}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>

                {config.sourceType && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Select
                      value={config.trackType}
                      size="small"
                      disabled={disabled}
                      onChange={(e) => updateConfig(sceneIdx, { trackType: e.target.value as 'SPEECH' | 'AMBIENT' | 'MUSIC' })}
                      sx={{
                        flex: 1,
                        bgcolor: 'rgba(255,255,255,0.03)',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(52, 58, 68, 0.4)' },
                        '& .MuiSelect-select': { color: '#94a3b8', fontSize: '0.75rem', py: 0.75 },
                        '& .MuiSvgIcon-root': { color: '#475569' },
                      }}
                    >
                      <MenuItem value="SPEECH">Speech</MenuItem>
                      <MenuItem value="AMBIENT">Ambient</MenuItem>
                      <MenuItem value="MUSIC">Music</MenuItem>
                    </Select>
                    <TextField
                      size="small"
                      placeholder="Notes..."
                      disabled={disabled}
                      value={config.notes || ''}
                      onChange={(e) => updateConfig(sceneIdx, { notes: e.target.value })}
                      sx={{
                        flex: 2,
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(255,255,255,0.03)',
                          '& fieldset': { borderColor: 'rgba(52, 58, 68, 0.4)' },
                        },
                        '& .MuiInputBase-input': { color: '#94a3b8', fontSize: '0.75rem', py: '6px' },
                        '& .MuiInputBase-input::placeholder': { color: '#475569' },
                      }}
                    />
                  </Box>
                )}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}
