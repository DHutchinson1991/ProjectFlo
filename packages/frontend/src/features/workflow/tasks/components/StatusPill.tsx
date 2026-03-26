"use client";

import React from 'react';
import { Box, Typography } from '@mui/material';
import { STATUS_CONFIG, GRID_COLS } from '../constants';

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

const HEADERS = ['Project / Inquiry', 'Task', 'Status', 'Person', 'Due Date', 'Hours'];

export function ColumnHeaders() {
    return (
        <Box sx={{
            display: 'grid', gridTemplateColumns: GRID_COLS,
            bgcolor: 'rgba(255,255,255,0.022)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
            {/* chevron col spacer */}
            <Box />
            {HEADERS.map((h, i) => (
                <Typography key={h} sx={{
                    fontSize: '0.625rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)',
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                    px: i === 0 ? 2.5 : 1.5, py: 1,
                }}>
                    {h}
                </Typography>
            ))}
        </Box>
    );
}
