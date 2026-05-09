import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import type { WizardState } from '../hooks/useWizardState';

interface LocationsStepProps {
  state: WizardState;
}

export default function LocationsStep({ state }: LocationsStepProps) {
  const { locationCount } = state;

  return (
    <Box>
      <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 2 }}>How many distinct locations will this event have?</Typography>
      <Stack direction="row" spacing={1.5}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Box key={n} onClick={() => state.setLocationCount(n)} sx={{
            width: 64, height: 64, borderRadius: 2, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 0.25, cursor: 'pointer', transition: 'all 0.15s',
            bgcolor: n <= locationCount ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.02)',
            border: n === locationCount ? '2px solid #22d3ee' : n <= locationCount ? '1px solid rgba(34,211,238,0.3)' : '1px solid rgba(255,255,255,0.08)',
            color: n <= locationCount ? '#22d3ee' : '#475569',
            '&:hover': { borderColor: '#22d3ee', bgcolor: 'rgba(34,211,238,0.06)' },
          }}>
            <PlaceIcon sx={{ fontSize: '1rem' }} />
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{n}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
