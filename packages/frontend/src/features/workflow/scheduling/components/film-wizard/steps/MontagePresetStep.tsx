'use client';

import React from 'react';
import {
  Typography,
  Box,
  Stack,
  CircularProgress,
  Chip,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import type { MontagePreset } from '@/features/content/films/types/montage-presets';
import { useMontagePresets } from '@/features/content/films/hooks';

interface MontagePresetStepProps {
  brandId?: number;
  selectedPreset: MontagePreset | null;
  onSelectPreset: (preset: MontagePreset) => void;
  disabled: boolean;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

export function MontagePresetStep({
  brandId,
  selectedPreset,
  onSelectPreset,
  disabled,
}: MontagePresetStepProps) {
  const { presets, isLoading } = useMontagePresets(brandId);
  const activePresets = presets.filter(p => p.is_active);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} sx={{ color: '#a78bfa' }} />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography
        variant="caption"
        sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}
      >
        Select a Montage Preset
      </Typography>
      <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem', mt: -1 }}>
        Presets define the target duration range for your montage film.
      </Typography>

      {activePresets.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px dashed rgba(52, 58, 68, 0.4)' }}>
          <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem' }}>
            No montage presets available.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {activePresets.map((preset) => {
            const isSelected = selectedPreset?.id === preset.id;
            return (
              <Box
                key={preset.id}
                onClick={() => !disabled && onSelectPreset(preset)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  cursor: disabled ? 'default' : 'pointer',
                  bgcolor: isSelected ? 'rgba(167, 139, 250, 0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? 'rgba(167, 139, 250, 0.3)' : 'rgba(52, 58, 68, 0.2)'}`,
                  transition: 'all 0.15s ease',
                  '&:hover': !disabled ? {
                    bgcolor: isSelected ? 'rgba(167, 139, 250, 0.12)' : 'rgba(255,255,255,0.04)',
                  } : undefined,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#f1f5f9' : '#94a3b8' }}
                    >
                      {preset.name}
                    </Typography>
                    {preset.is_system_seeded && (
                      <Chip label="System" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(52, 58, 68, 0.3)', color: '#64748b' }} />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 12, color: '#475569' }} />
                    <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem' }}>
                      {formatDuration(preset.min_duration_seconds)} – {formatDuration(preset.max_duration_seconds)}
                    </Typography>
                  </Box>
                </Box>
                {isSelected && (
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#a78bfa', flexShrink: 0 }} />
                )}
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
