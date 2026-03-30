'use client';

import React from 'react';
import { Box, Typography, SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';

// ─── Props ──────────────────────────────────────────────────────────
export interface ScheduleCardShellProps {
    title: string;
    /** The icon element — should be an MUI SvgIcon, sized inside the shell */
    icon: React.ReactElement;
    /** Hex or CSS color — used for icon tint, icon bg, icon border, and count chip */
    accentColor: string;
    /** Optional subtitle line below the title (e.g. selected activity / day name) */
    subtitle?: React.ReactNode;
    /** Slot for header right — chips, icon buttons, etc. */
    headerRight?: React.ReactNode;
    /** Whether to show the header bottom border. Default: true */
    showHeaderBorder?: boolean;
    cardSx: SxProps<Theme>;
    children: React.ReactNode;
    /** Optional node rendered inside the header box after the title row (e.g. override controls) */
    headerExtra?: React.ReactNode;
    /** Optional footer strip rendered after children */
    footer?: React.ReactNode;
}

// ─── Component ──────────────────────────────────────────────────────
export function ScheduleCardShell({
    title,
    icon,
    accentColor,
    subtitle,
    headerRight,
    showHeaderBorder = true,
    cardSx,
    children,
    headerExtra,
    footer,
}: ScheduleCardShellProps) {
    return (
        <Box sx={{ ...(cardSx as object), overflow: 'hidden' }}>
            {/* ── Header ── */}
            <Box sx={{
                px: 2.5, pt: 2, pb: 1.5,
                borderBottom: showHeaderBorder ? '1px solid rgba(52, 58, 68, 0.25)' : 'none',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {/* Icon box */}
                        <Box sx={{
                            width: 28, height: 28, borderRadius: 1.5,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: alpha(accentColor, 0.1),
                            border: `1px solid ${alpha(accentColor, 0.2)}`,
                        }}>
                            {React.cloneElement(icon, { sx: { fontSize: 14, color: accentColor, ...((icon.props as React.HTMLAttributes<SVGElement>).style ?? {}) } })}
                        </Box>

                        {/* Title + optional subtitle */}
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {title}
                            </Typography>
                            {subtitle && subtitle}
                        </Box>
                    </Box>

                    {/* Right slot */}
                    {headerRight}
                </Box>
                {headerExtra}
            </Box>

            {/* ── Body ── */}
            {children}

            {/* ── Footer (optional) ── */}
            {footer}
        </Box>
    );
}
