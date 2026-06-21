'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

interface DayDesignSubstepHeaderProps {
  title: string;
  subtitle: string;
  accent?: string;
}

export default function DayDesignSubstepHeader({ title, subtitle, accent }: DayDesignSubstepHeaderProps) {
  return (
    <Box sx={{ mb: 2.5 }}>
      {accent && (
        <Box
          sx={{
            width: 32,
            height: 3,
            borderRadius: 999,
            bgcolor: accent,
            mb: 1.25,
            opacity: 0.85,
          }}
        />
      )}
      <Typography sx={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.3 }}>
        {title}
      </Typography>
      <Typography sx={{ color: '#64748b', fontSize: '0.78rem', mt: 0.6, lineHeight: 1.55, maxWidth: 520 }}>
        {subtitle}
      </Typography>
    </Box>
  );
}
