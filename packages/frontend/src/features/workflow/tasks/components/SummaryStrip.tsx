"use client";

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Circle as CircleIcon } from '@mui/icons-material';
import type { ActiveTask } from '@/lib/types';

export function SummaryStrip({ tasks }: { tasks: ActiveTask[] }) {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === 'To_Do').length;
    const ready = tasks.filter(t => t.status === 'Ready_to_Start').length;
    const inProgress = tasks.filter(t => t.status === 'In_Progress').length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const overdue = tasks.filter(t => {
        if (!t.due_date || t.status === 'Completed') return false;
        return new Date(t.due_date) < new Date();
    }).length;
    const totalHours = tasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);

    const items = [
        { label: 'Total', value: total, color: '#579BFC' },
        { label: 'To Do', value: todo, color: '#C4C4C4' },
        { label: 'Ready', value: ready, color: '#FDAB3D' },
        { label: 'Working', value: inProgress, color: '#579BFC' },
        { label: 'Done', value: completed, color: '#00C875' },
        ...(overdue > 0 ? [{ label: 'Overdue', value: overdue, color: '#D83A52' }] : []),
        { label: 'Hours', value: `${totalHours.toFixed(1)}h`, color: '#A25DDC' },
    ];

    return (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
            {items.map((item, idx) => (
                <Box key={item.label} sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    px: 1.5, py: 0.875,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    ...(idx === 0 && {
                        bgcolor: 'rgba(87,155,252,0.08)',
                        border: '1px solid rgba(87,155,252,0.2)',
                    }),
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
