"use client";

import React, { useState } from 'react';
import { Box, Typography, Chip, Collapse } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    Lock as LockIcon,
    ExpandMore as ExpandMoreIcon,
    OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useReveal, revealSx } from '@/features/workflow/proposals/utils/portal/animations';
import type { PortalDashboardColors } from '@/features/workflow/proposals/utils/portal/themes';

/* ── ExpandableCard ──────────────────────────────────────── */

export function ExpandableCard({
    icon,
    iconColor,
    title,
    subtitle,
    statusChip,
    locked,
    lockedMessage,
    children,
    action,
    defaultOpen = false,
    colors,
}: {
    icon: React.ReactNode;
    iconColor: string;
    title: string;
    subtitle?: string;
    statusChip?: { label: string; color: string };
    locked?: boolean;
    lockedMessage?: string;
    children?: React.ReactNode;
    action?: React.ReactNode;
    defaultOpen?: boolean;
    colors: PortalDashboardColors;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const r = useReveal();

    return (
        <Box ref={r.ref} sx={{ ...revealSx(r.visible, 0.05) }}>
            <Box sx={{
                bgcolor: alpha(colors.card, 0.7),
                backdropFilter: 'blur(20px) saturate(1.5)',
                border: `1px solid ${alpha(colors.border, 0.6)}`,
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
                ...(locked
                    ? { opacity: 0.5 }
                    : {
                        '&:hover': {
                            borderColor: alpha(iconColor, 0.25),
                            boxShadow: `0 12px 40px ${alpha(iconColor, 0.08)}, 0 4px 12px ${alpha('#000', 0.2)}`,
                        },
                    }),
            }}>
                {/* Top accent line */}
                <Box sx={{ height: 2, background: locked ? alpha(colors.border, 0.3) : `linear-gradient(90deg, transparent 5%, ${alpha(iconColor, 0.5)} 50%, transparent 95%)` }} />

                {/* Header */}
                <Box
                    onClick={() => !locked && children && setOpen(!open)}
                    sx={{
                        display: 'flex', alignItems: 'center', gap: 2,
                        px: { xs: 2.5, md: 3 }, py: 2.5,
                        cursor: locked || !children ? 'default' : 'pointer',
                        userSelect: 'none',
                        '&:hover': !locked && children ? { bgcolor: alpha(colors.border, 0.08) } : {},
                        transition: 'background 0.2s',
                    }}
                >
                    {/* Icon box */}
                    <Box sx={{
                        width: 48, height: 48, borderRadius: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: locked ? alpha(colors.border, 0.2) : alpha(iconColor, 0.12),
                        border: `1.5px ${locked ? 'dashed' : 'solid'} ${locked ? alpha(colors.border, 0.5) : alpha(iconColor, 0.25)}`,
                        color: locked ? colors.muted : iconColor,
                        position: 'relative', flexShrink: 0, transition: 'all 0.3s',
                    }}>
                        {locked ? <LockIcon sx={{ fontSize: 18, opacity: 0.6 }} /> : icon}
                    </Box>

                    {/* Title + subtitle */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography sx={{ color: locked ? colors.muted : colors.text, fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.3 }}>
                                {title}
                            </Typography>
                            {statusChip && (
                                <Chip
                                    label={statusChip.label}
                                    size="small"
                                    sx={{
                                        height: 20, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.04em',
                                        bgcolor: alpha(statusChip.color, 0.12),
                                        color: statusChip.color, border: 'none',
                                        '& .MuiChip-label': { px: 1 },
                                    }}
                                />
                            )}
                        </Box>
                        {(subtitle || (locked && lockedMessage)) && (
                            <Typography sx={{ color: alpha(colors.muted, locked ? 0.5 : 0.8), fontSize: '0.78rem', mt: 0.25, lineHeight: 1.4 }}>
                                {locked ? lockedMessage : subtitle}
                            </Typography>
                        )}
                    </Box>

                    {/* Action or expand toggle */}
                    {!locked && action && !children && action}
                    {!locked && children && (
                        <Box sx={{
                            width: 32, height: 32, borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: alpha(colors.border, 0.2), color: colors.muted,
                            transition: 'all 0.3s',
                            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}>
                            <ExpandMoreIcon sx={{ fontSize: 18 }} />
                        </Box>
                    )}
                </Box>

                {/* Expandable content */}
                {children && (
                    <Collapse in={open} timeout={350} easing="cubic-bezier(0.16,1,0.3,1)">
                        <Box sx={{ borderTop: `1px solid ${alpha(colors.border, 0.4)}` }}>
                            {children}
                        </Box>
                    </Collapse>
                )}

                {/* Inline action when card has expandable content */}
                {!locked && action && children && (
                    <Collapse in={open} timeout={350}>
                        <Box sx={{ px: { xs: 2.5, md: 3 }, pb: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
                            {action}
                        </Box>
                    </Collapse>
                )}
            </Box>
        </Box>
    );
}

/* ── ActionLink ──────────────────────────────────────────── */

export function ActionLink({ href, label, color }: { href: string; label: string; color: string }) {
    return (
        <Box
            component="a"
            href={href}
            sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1,
                py: 1, px: 2.5, borderRadius: '12px',
                background: `linear-gradient(135deg, ${color}, ${alpha(color, 0.7)})`,
                color: '#fff', fontWeight: 600, fontSize: '0.8rem',
                textDecoration: 'none',
                boxShadow: `0 4px 16px ${alpha(color, 0.3)}`,
                transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                '&:hover': { transform: 'translateY(-1px)', boxShadow: `0 6px 24px ${alpha(color, 0.4)}` },
            }}
        >
            {label}
            <OpenInNewIcon sx={{ fontSize: 14 }} />
        </Box>
    );
}
