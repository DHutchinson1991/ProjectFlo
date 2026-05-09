'use client';

import React from 'react';
import { Box } from '@mui/material';
import { AiPlayground } from '@/features/ai/gemma/components/AiPlayground';

export default function AiPlaygroundPage() {
  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <AiPlayground />
    </Box>
  );
}
