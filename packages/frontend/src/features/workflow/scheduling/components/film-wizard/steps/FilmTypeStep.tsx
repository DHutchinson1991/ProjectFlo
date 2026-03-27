'use client';

import React from 'react';
import {
  Typography,
  Box,
  TextField,
  Stack,
} from '@mui/material';
import TheatersIcon from '@mui/icons-material/Theaters';
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion';
import VideocamIcon from '@mui/icons-material/Videocam';

import { FilmType } from '@/features/content/films/types';

interface FilmTypeStepProps {
  filmType: FilmType;
  filmName: string;
  packageName?: string;
  onFilmTypeChange: (type: FilmType) => void;
  onFilmNameChange: (name: string) => void;
  disabled: boolean;
}

const FILM_TYPE_OPTIONS: Array<{
  type: FilmType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    type: FilmType.ACTIVITY,
    label: 'Activity Film',
    description: 'A single activity captured in full — one scene per activity with all its moments.',
    icon: <VideocamIcon sx={{ fontSize: 28 }} />,
    color: '#10b981',
  },
  {
    type: FilmType.FEATURE,
    label: 'Feature Film',
    description: 'Multiple activities shown chronologically — each activity becomes a scene with moments.',
    icon: <TheatersIcon sx={{ fontSize: 28 }} />,
    color: '#648CFF',
  },
  {
    type: FilmType.MONTAGE,
    label: 'Montage Film',
    description: 'Curated highlights with custom scene structure, cherry-picked moments, and audio layering.',
    icon: <AutoAwesomeMotionIcon sx={{ fontSize: 28 }} />,
    color: '#a78bfa',
  },
];

export function FilmTypeStep({
  filmType,
  filmName,
  packageName,
  onFilmTypeChange,
  onFilmNameChange,
  disabled,
}: FilmTypeStepProps) {
  return (
    <Stack spacing={2.5}>
      {/* Film Name */}
      <Box>
        <Typography
          variant="caption"
          sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem', mb: 0.5, display: 'block' }}
        >
          Film Name
        </Typography>
        <TextField
          size="small"
          fullWidth
          autoFocus
          value={filmName}
          onChange={(e) => onFilmNameChange(e.target.value)}
          placeholder={`${packageName || 'Package'} Film`}
          disabled={disabled}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.03)',
              '& fieldset': { borderColor: 'rgba(52, 58, 68, 0.4)' },
              '&:hover fieldset': { borderColor: 'rgba(100, 140, 255, 0.3)' },
              '&.Mui-focused fieldset': { borderColor: '#648CFF' },
            },
            '& .MuiInputBase-input': { color: '#f1f5f9', fontSize: '0.85rem' },
            '& .MuiInputBase-input::placeholder': { color: '#475569' },
          }}
        />
      </Box>

      {/* Film Type Selection */}
      <Box>
        <Typography
          variant="caption"
          sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem', mb: 1, display: 'block' }}
        >
          Film Type
        </Typography>
        <Stack spacing={1}>
          {FILM_TYPE_OPTIONS.map((option) => {
            const isSelected = filmType === option.type;
            return (
              <Box
                key={option.type}
                onClick={() => !disabled && onFilmTypeChange(option.type)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  cursor: disabled ? 'default' : 'pointer',
                  bgcolor: isSelected ? `${option.color}12` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? `${option.color}40` : 'rgba(52, 58, 68, 0.2)'}`,
                  transition: 'all 0.15s ease',
                  opacity: disabled ? 0.6 : 1,
                  '&:hover': !disabled ? {
                    bgcolor: isSelected ? `${option.color}18` : 'rgba(255,255,255,0.04)',
                  } : undefined,
                }}
              >
                <Box sx={{ color: isSelected ? option.color : '#475569', display: 'flex' }}>
                  {option.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#f1f5f9' : '#94a3b8', lineHeight: 1.3 }}
                  >
                    {option.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#64748b', fontSize: '0.72rem', lineHeight: 1.4, display: 'block', mt: 0.25 }}
                  >
                    {option.description}
                  </Typography>
                </Box>
                {isSelected && (
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: option.color, flexShrink: 0 }} />
                )}
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
}
