'use client';

import React, { ReactNode } from 'react';
import { Box, Typography, LinearProgress, Collapse } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

export interface TaskGroupHeaderProps {
    /** Group title (phase label, project name, etc.) */
    title: string;
    /** Primary accent color for left border, text, badge, progress bar */
    color: string;
    /** Number of items in the group */
    count: number;
    /** Whether the group is expanded */
    expanded: boolean;
    /** Toggle callback */
    onToggle: () => void;
    /** Optional icon rendered before the title */
    icon?: ReactNode;
    /** Optional badge text after the count */
    badge?: string;
    /** 0–100 progress percentage (omit to hide progress bar) */
    progress?: number;
    /** Progress label, e.g. "5/12" (shown after the progress bar) */
    progressLabel?: string;
    /** Total hours to display */
    totalHours?: number;
    /** Content rendered when expanded */
    children: ReactNode;
    /** Optional right-side slot for extra controls (e.g. add button) */
    actions?: ReactNode;
}

export function TaskGroupHeader({
    title, color, count, expanded, onToggle,
    icon, badge, progress, progressLabel, totalHours,
    children, actions,
}: TaskGroupHeaderProps) {
    return (
        <Box sx={{ '&:not(:last-child)': { borderBottom: '1px solid rgba(255,255,255,0.05)' } }}>
            {/* Header */}
            <Box
                onClick={onToggle}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.25,
                    cursor: 'pointer', userSelect: 'none', bgcolor: 'rgba(255,255,255,0.015)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                    borderLeft: `4px solid ${color}`, transition: 'background 0.15s',
                }}
            >
                <ExpandMoreIcon sx={{
                    fontSize: 18, color: 'text.secondary', flexShrink: 0,
                    transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s',
                }} />
                {icon && <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</Box>}
                <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color, letterSpacing: '-0.01em' }}>
                    {title}
                </Typography>
                <Box sx={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    height: 22, minWidth: 28, px: 0.75, borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem',
                    bgcolor: `${color}1a`, color, border: `1px solid ${color}33`,
                }}>
                    {count}
                </Box>
                {badge && (
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', fontWeight: 500 }}>
                        {badge}
                    </Typography>
                )}
                {progress !== undefined && (
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, ml: 1 }}>
                        <LinearProgress
                            variant="determinate" value={progress}
                            sx={{
                                flex: 1, maxWidth: 100, height: 3, borderRadius: 2,
                                bgcolor: 'rgba(255,255,255,0.07)',
                                '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 },
                            }}
                        />
                        {progressLabel && (
                            <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled', whiteSpace: 'nowrap', fontWeight: 500 }}>
                                {progressLabel}
                            </Typography>
                        )}
                    </Box>
                )}
                {progress === undefined && <Box sx={{ flex: 1 }} />}
                {totalHours !== undefined && totalHours > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 0.5 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
                            {totalHours.toFixed(1)}h
                        </Typography>
                    </Box>
                )}
                {actions}
            </Box>

            {/* Collapsible content */}
            <Collapse in={expanded}>
                {children}
            </Collapse>
        </Box>
    );
}
