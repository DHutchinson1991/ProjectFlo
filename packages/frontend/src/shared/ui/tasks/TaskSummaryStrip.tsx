'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Circle as CircleIcon } from '@mui/icons-material';

export interface SummaryItem {
    label: string;
    value: string | number;
    color: string;
}

export interface TaskSummaryStripProps {
    items: SummaryItem[];
}

export function TaskSummaryStrip({ items }: TaskSummaryStripProps) {
    return (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
            {items.map((item, idx) => (
                <Box key={item.label} sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    px: 1.5, py: 0.875,
                    borderRadius: 1.5,
                    bgcolor: idx === 0 ? 'rgba(87,155,252,0.08)' : 'rgba(255,255,255,0.03)',
                    border: idx === 0 ? '1px solid rgba(87,155,252,0.2)' : '1px solid rgba(255,255,255,0.06)',
                }}>
                    <CircleIcon sx={{ fontSize: 7, color: item.color }} />
                    <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', fontWeight: 600, letterSpacing: '0.03em' }}>
                        {item.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 800, color: idx === 0 ? '#579BFC' : 'text.primary', lineHeight: 1 }}>
                        {item.value}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
}
