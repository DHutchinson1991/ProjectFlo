"use client";

import React from 'react';
import { Box } from '@mui/material';
import { STATUS_CONFIG } from '../constants';

export function StatusPill({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.To_Do;
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.6875rem',
            height: 24, px: 1.25, borderRadius: '6px', whiteSpace: 'nowrap',
            minWidth: 64, letterSpacing: '0.02em',
        }}>
            {cfg.label}
        </Box>
    );
}
