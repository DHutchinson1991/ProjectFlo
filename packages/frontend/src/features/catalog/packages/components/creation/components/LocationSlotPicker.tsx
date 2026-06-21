'use client';

import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import { clampLocationCount } from '../helpers/location-helpers';

interface LocationSlotPickerProps {
  value: number;
  onChange: (count: number) => void;
  accent?: string;
  compact?: boolean;
}

export default function LocationSlotPicker({
  value,
  onChange,
  accent = '#22d3ee',
  compact = false,
}: LocationSlotPickerProps) {
  const selected = clampLocationCount(value);

  return (
    <Box
      sx={{
        mt: compact ? 1 : 1.5,
        pt: compact ? 1 : 1.25,
        borderTop: '1px solid rgba(148,163,184,0.1)',
      }}
    >
      <Typography
        sx={{
          color: '#64748b',
          fontSize: compact ? '0.62rem' : '0.65rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          mb: compact ? 0.75 : 1,
        }}
      >
        Location slots for this day
      </Typography>
      <Typography
        sx={{
          color: '#475569',
          fontSize: compact ? '0.68rem' : '0.72rem',
          mb: compact ? 1 : 1.25,
          lineHeight: 1.45,
        }}
      >
        Numbered slots (1–5). Venues are assigned when an inquiry or project is scheduled.
      </Typography>
      <Stack direction="row" spacing={1} justifyContent={compact ? 'flex-start' : 'center'} flexWrap="wrap" useFlexGap>
        {[1, 2, 3, 4, 5].map((n) => (
          <Box
            key={n}
            onClick={() => onChange(n)}
            sx={{
              width: compact ? 52 : 56,
              height: compact ? 52 : 56,
              borderRadius: 1.5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.25,
              cursor: 'pointer',
              transition: 'all 0.15s',
              bgcolor: n <= selected ? `${accent}14` : 'rgba(255,255,255,0.02)',
              border: n === selected ? `2px solid ${accent}` : n <= selected ? `1px solid ${accent}55` : '1px solid rgba(255,255,255,0.08)',
              color: n <= selected ? accent : '#475569',
              '&:hover': { borderColor: accent, bgcolor: `${accent}10` },
            }}
          >
            <PlaceIcon sx={{ fontSize: '0.9rem' }} />
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{n}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
