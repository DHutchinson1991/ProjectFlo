"use client";

import React from 'react';
import { keyframes } from '@mui/material/styles';
import {
  Box, Typography, Select, MenuItem, FormControl,
  Checkbox, ListItemText,
} from '@mui/material';
import { capSubjectIds, subjectCapForEditorialShotType } from '@projectflo/shared';

export const SHOT_TYPES = [
  "ESTABLISHING_SHOT", "WIDE_SHOT", "MEDIUM_SHOT", "TWO_SHOT",
  "CLOSE_UP", "EXTREME_CLOSE_UP", "DETAIL_SHOT", "REACTION_SHOT",
  "OVER_SHOULDER", "CUTAWAY", "INSERT_SHOT", "MASTER_SHOT",
] as const;

export const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

export const formatShotLabel = (value?: string | null): string => {
  if (!value) return 'None';
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export const selectSx = {
  height: 34, fontSize: '0.8rem',
  color: 'rgba(255,255,255,0.8)',
  bgcolor: 'rgba(255,255,255,0.04)',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
  '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.3)' },
};

export const menuProps = { PaperProps: { sx: { bgcolor: '#1a1a1a', maxHeight: 280 } } };

const iconPulse = keyframes`
  0%, 100% { opacity: 0.45; transform: scale(1); filter: drop-shadow(0 0 0px transparent); }
  50% { opacity: 1; transform: scale(1.18); filter: drop-shadow(0 0 8px currentColor); }
`;

export const TrackIconButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  color: string;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
  shimmer?: boolean;
}> = ({ icon, label, color, isActive, isSelected, onClick, shimmer }) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0.5,
      px: 1,
      py: 0.75,
      borderRadius: 1,
      cursor: 'pointer',
      flex: 1,
      minWidth: 0,
      bgcolor: isSelected ? `${color}18` : 'transparent',
      transition: 'all 0.12s ease',
      position: 'relative',
      '&:hover': { bgcolor: `${color}12` },
      '&::after': isSelected ? {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: '20%',
        right: '20%',
        height: 2,
        borderRadius: 1,
        bgcolor: color,
      } : {},
    }}
  >
    <Box sx={{
      color: isActive || shimmer ? color : 'rgba(255,255,255,0.2)',
      display: 'flex',
      transition: 'color 0.12s',
      opacity: isActive ? 1 : 0.5,
      ...(shimmer && {
        opacity: 1,
        animation: `${iconPulse} 1.5s ease-in-out infinite`,
      }),
    }}>
      {icon}
    </Box>
    <Typography sx={{
      fontSize: '0.6rem',
      color: isSelected ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.3)',
      fontWeight: isSelected ? 600 : 400,
      textAlign: 'center',
      lineHeight: 1.1,
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      ...(shimmer && {
        animation: `${iconPulse} 1.8s ease-in-out infinite`,
        color: `${color}99`,
      }),
    }}>
      {label}
    </Typography>
  </Box>
);

export const DetailHeader: React.FC<{
  label: string;
  color: string;
  icon: React.ReactNode;
  noMargin?: boolean;
}> = ({ label, color, icon, noMargin }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: noMargin ? 0 : 1 }}>
    <Box sx={{ color, display: 'flex', opacity: 0.7 }}>{icon}</Box>
    <Typography sx={{
      color: 'rgba(255,255,255,0.55)',
      fontSize: '0.72rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }}>
      {label}
    </Typography>
  </Box>
);

export const SubjectMultiSelect: React.FC<{
  value: number[];
  onChange: (ids: number[]) => void;
  subjects: Array<{ id: number; name: string; [k: string]: unknown }>;
  getSubjectName?: (id: number) => string;
  disabled?: boolean;
  accentColor: string;
  shotType?: string | null;
}> = ({ value, onChange, subjects, disabled, accentColor, shotType }) => {
  const handleChange = (next: number[]) => {
    onChange(capSubjectIds(next, shotType ?? null));
  };

  const maxSubjects = subjectCapForEditorialShotType(shotType ?? null);

  return (
    <FormControl fullWidth size="small">
      <Select
        multiple
        value={value}
        onChange={(e) => handleChange(e.target.value as number[])}
        disabled={disabled}
        displayEmpty
        renderValue={(selected) => {
          const sel = selected as number[];
          if (!sel || sel.length === 0)
            return <em style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>Select subjects…</em>;
          return <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>{sel.length} selected</span>;
        }}
        sx={{
          minHeight: 34, fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.8)',
          bgcolor: 'rgba(255,255,255,0.04)',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
          '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.3)' },
        }}
        MenuProps={{
          PaperProps: { sx: { bgcolor: '#1a1a1a', maxHeight: 300 } },
          autoFocus: false,
          disableAutoFocusItem: true,
          variant: 'menu',
        }}
      >
        {subjects.map((s) => {
          const checked = value.includes(s.id);
          const disableAdd = !checked && Number.isFinite(maxSubjects) && value.length >= maxSubjects;
          return (
            <MenuItem
              key={s.id}
              value={s.id}
              disabled={disableAdd}
              sx={{ fontSize: '0.78rem', py: 0.4, opacity: disableAdd ? 0.45 : 1 }}
            >
              <Checkbox checked={checked} size="small"
                sx={{ p: 0.25, mr: 0.75, color: 'rgba(255,255,255,0.4)', '&.Mui-checked': { color: accentColor } }}
              />
              <ListItemText primary={s.name} primaryTypographyProps={{ fontSize: '0.78rem' }} />
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

export const INSPECTOR_PANEL_SX = {
  width: "35%",
  minWidth: "320px",
  maxWidth: "480px",
  flexShrink: 0,
  borderLeft: "1px solid rgba(255,255,255,0.08)",
  background: "#0d0d0d",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "hidden",
} as const;

export type RecordingSetupPayload = {
  camera_assignments: Array<{ track_id: number; subject_ids?: number[]; shot_type?: string | null; shot_type_locked?: boolean; enabled?: boolean }>;
  audio_track_ids: number[];
  audio_assignments?: Array<{ track_id: number; subject_ids?: number[] }>;
  graphics_enabled?: boolean;
  graphics_title?: string | null;
};

export function buildRecordingSetupPayload(
  cameraAssignments: Array<{ track_id: number; subject_ids?: number[]; shot_type?: string | null; shot_type_locked?: boolean; enabled?: boolean }>,
  audioTrackIds: number[],
  audioAssignments: Array<{ track_id: number; subject_ids?: number[] }>,
  graphicsEnabled?: boolean,
): RecordingSetupPayload {
  return {
    camera_assignments: cameraAssignments.map(c => ({
      track_id: c.track_id,
      subject_ids: c.subject_ids || [],
      shot_type: c.shot_type || null,
      shot_type_locked: c.shot_type_locked === true,
      enabled: c.enabled !== false,
    })),
    audio_track_ids: audioTrackIds,
    audio_assignments: audioAssignments.map(a => ({
      track_id: a.track_id,
      subject_ids: a.subject_ids || [],
    })),
    ...(graphicsEnabled !== undefined ? { graphics_enabled: graphicsEnabled } : {}),
  };
}

/** Resolve moments array from a timeline scene object */
export function getMomentsFromScene(scene: { original_scene?: { moments?: unknown[] }; moments?: unknown[] } | null): any[] {
  if (!scene) return [];
  const originalScene = (scene as any).original_scene || scene;
  return originalScene.moments || [];
}

/** Film scene database id from timeline scene */
export function getFilmSceneId(scene: { id?: number; original_scene?: { id?: number }; original_scene_id?: number } | null): number | null {
  if (!scene) return null;
  const id = (scene as any).original_scene?.id ?? (scene as any).original_scene_id ?? scene.id;
  return typeof id === 'number' ? id : null;
}
