'use client';

import React from 'react';
import { Box, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';

export interface PackageSurfaceHeaderChip {
  key: string;
  label: React.ReactNode;
  sx?: SxProps<Theme>;
}

export interface PackageSurfaceHeaderProps {
  title: string;
  titlePlaceholder?: string;
  subtitle?: React.ReactNode;
  chips?: PackageSurfaceHeaderChip[];
  readOnlyMessage?: React.ReactNode;
  editableTitle?: boolean;
  isSaving?: boolean;
  savingLabel?: string;
  onTitleChange?: (title: string) => void;
  onBack?: () => void;
  onVersionHistory?: () => void;
  actions?: React.ReactNode;
}

export function PackageSurfaceHeader({
  title,
  titlePlaceholder = 'Package Name',
  subtitle,
  chips = [],
  readOnlyMessage,
  editableTitle = false,
  isSaving = false,
  savingLabel = 'Saving...',
  onTitleChange,
  onBack,
  onVersionHistory,
  actions,
}: PackageSurfaceHeaderProps) {
  const displayTitle = title || titlePlaceholder;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {onBack && (
          <IconButton onClick={onBack} sx={{ color: '#64748b', p: 0.5, mt: 0.1 }} aria-label="Back">
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </IconButton>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
            {editableTitle ? (
              <Box
                component="input"
                value={title}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onTitleChange?.(event.target.value)}
                placeholder={titlePlaceholder}
                size={Math.max(8, displayTitle.length + 1)}
                sx={{
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontWeight: 700,
                  color: '#e2e8f0',
                  fontSize: '1.15rem',
                  fontFamily: 'inherit',
                  lineHeight: 1.2,
                  p: 0,
                  m: 0,
                  maxWidth: '100%',
                  borderBottom: '1px solid transparent',
                  transition: 'border-color 0.2s ease',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.08)' },
                  '&:focus': { borderColor: '#648CFF' },
                  '&::placeholder': { color: '#334155' },
                }}
              />
            ) : (
              <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.15rem', lineHeight: 1.2 }}>
                {displayTitle}
              </Typography>
            )}

            {onVersionHistory && (
              <Tooltip title="Version History">
                <IconButton
                  onClick={onVersionHistory}
                  sx={{
                    color: '#475569',
                    p: 0.5,
                    '&:hover': { color: '#94a3b8' },
                  }}
                  aria-label="Version history"
                >
                  <HistoryIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}

          </Box>

          {subtitle && (
            <Typography sx={{ color: '#94a3b8', fontSize: '0.88rem', mt: 0.75, maxWidth: 760 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0, minHeight: 24, ml: 'auto' }}>
          {chips.map((chip) => (
            <Box key={chip.key} sx={chip.sx}>
              {chip.label}
            </Box>
          ))}
          {readOnlyMessage && (
            <Typography sx={{ color: '#64748b', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              {readOnlyMessage}
            </Typography>
          )}
          {isSaving && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <CircularProgress size={12} sx={{ color: '#475569' }} />
              <Typography sx={{ fontSize: '0.7rem', color: '#475569' }}>{savingLabel}</Typography>
            </Box>
          )}
          {actions}
        </Box>
      </Box>
    </Box>
  );
}

export default PackageSurfaceHeader;
