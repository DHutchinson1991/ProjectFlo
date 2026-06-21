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
  /** Renders on the title row, after the optional version-history control (e.g. blueprint lineage). */
  titleRowExtras?: React.ReactNode;
  subtitle?: React.ReactNode;
  chips?: PackageSurfaceHeaderChip[];
  readOnlyMessage?: React.ReactNode;
  editableTitle?: boolean;
  /** When true, omits the title input/display (e.g. overview hero owns the name). */
  hideTitle?: boolean;
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
  titleRowExtras,
  subtitle,
  chips = [],
  readOnlyMessage,
  editableTitle = false,
  hideTitle = false,
  isSaving = false,
  savingLabel = 'Saving...',
  onTitleChange,
  onBack,
  onVersionHistory,
  actions,
}: PackageSurfaceHeaderProps) {
  const displayTitle = title || titlePlaceholder;
  /** Fallback for browsers without `field-sizing: content` — wide enough not to clip typical names. */
  const titleInputSize = Math.min(Math.max(displayTitle.length + 10, 28), 120);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {onBack && (
          <IconButton onClick={onBack} sx={{ color: '#64748b', p: 0.5, flexShrink: 0 }} aria-label="Back">
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </IconButton>
        )}

        <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {/*
            Single intrinsic-sized strip: title + history + extras hug together.
            maxWidth:100% + flex-shrink on title/extras only ellipsizes when the *whole* strip exceeds the middle column.
          */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              flexWrap: 'nowrap',
              maxWidth: '100%',
              minWidth: 0,
              verticalAlign: 'middle',
            }}
          >
            {!hideTitle ? (
              editableTitle ? (
                <Box
                  sx={{
                    flex: '1 1 auto',
                    flexShrink: 2,
                    minWidth: 0,
                    overflow: 'hidden',
                    alignSelf: 'stretch',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    component="input"
                    value={title}
                    size={titleInputSize}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => onTitleChange?.(event.target.value)}
                    placeholder={titlePlaceholder}
                    title={title || titlePlaceholder}
                    sx={{
                      boxSizing: 'content-box',
                      width: 'auto',
                      maxWidth: '100%',
                      minWidth: '12ch',
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
                      borderBottom: '1px solid transparent',
                      transition: 'border-color 0.2s ease',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fieldSizing: 'content',
                      '&:hover': { borderColor: 'rgba(255,255,255,0.08)' },
                      '&:focus': { borderColor: '#648CFF' },
                      '&::placeholder': { color: '#334155' },
                    }}
                  />
                </Box>
              ) : (
                <Typography
                  sx={{
                    flex: '1 1 auto',
                    flexShrink: 2,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#e2e8f0',
                    fontWeight: 700,
                    fontSize: '1.15rem',
                    lineHeight: 1.2,
                  }}
                >
                  {displayTitle}
                </Typography>
              )
            ) : null}

            {onVersionHistory && (
              <Tooltip title="Version History">
                <IconButton
                  onClick={onVersionHistory}
                  sx={{
                    color: '#475569',
                    p: 0.5,
                    flexShrink: 0,
                    '&:hover': { color: '#94a3b8' },
                  }}
                  aria-label="Version history"
                >
                  <HistoryIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}

            {titleRowExtras != null && (
              <>
                {onVersionHistory ? (
                  <Box
                    aria-hidden
                    sx={{
                      width: '1px',
                      height: 18,
                      bgcolor: 'rgba(148,163,184,0.22)',
                      borderRadius: 1,
                      flexShrink: 0,
                    }}
                  />
                ) : null}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'nowrap',
                    gap: 0.25,
                    flexGrow: 0,
                    flexShrink: 3,
                    minWidth: 0,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {titleRowExtras}
                </Box>
              </>
            )}
          </Box>

          {subtitle && (
            <Box sx={{ color: '#94a3b8', fontSize: '0.88rem', mt: 0.75, maxWidth: 760 }}>
              {subtitle}
            </Box>
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
