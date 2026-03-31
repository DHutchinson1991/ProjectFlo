import React, { useState } from 'react';
import { Box, Chip, CircularProgress, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { EventAvailable, MoreVert } from '@mui/icons-material';
import type { ReservationState } from '../../types';

export interface ReserveBadgeProps {
    reservationState?: ReservationState;
    onReserve: () => void;
    onUpdateStatus: (status: 'confirmed' | 'cancelled') => void;
    onDirectConfirm?: () => void;
    reserving?: boolean;
    owner?: { name: string; email?: string | null; phone?: string | null } | null;
}

export function ReserveBadge({
    reservationState,
    onReserve,
    onUpdateStatus,
    onDirectConfirm,
    reserving,
    owner,
}: ReserveBadgeProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    if (reserving) {
        return <CircularProgress size={14} sx={{ color: '#64748b' }} />;
    }

    const status = reservationState?.status;
    const isActive = status === 'reserved' || status === 'confirmed';

    if (!isActive) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <Tooltip title="Send reservation request" arrow placement="top">
                    <IconButton
                        size="small"
                        onClick={onReserve}
                        sx={{
                            p: 0.5,
                            color: '#64748b',
                            border: '1px solid rgba(148,163,184,0.2)',
                            bgcolor: 'rgba(148,163,184,0.05)',
                            '&:hover': { color: '#34d399', bgcolor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' },
                        }}
                    >
                        <EventAvailable sx={{ fontSize: 14 }} />
                    </IconButton>
                </Tooltip>
                <IconButton
                    size="small"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{ p: 0.25, color: '#475569', '&:hover': { color: '#94a3b8' } }}
                >
                    <MoreVert sx={{ fontSize: 14 }} />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid rgba(52,58,68,0.5)', minWidth: 160 } }}
                >
                    {onDirectConfirm && (
                        <MenuItem
                            dense
                            sx={{ fontSize: '0.8rem', color: '#10b981' }}
                            onClick={() => { onDirectConfirm(); setAnchorEl(null); }}
                        >
                            Mark as Confirmed
                        </MenuItem>
                    )}
                </Menu>
            </Box>
        );
    }

    const statusConfig = {
        reserved: { label: 'Reserved', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
        confirmed: { label: 'Confirmed', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    }[status as 'reserved' | 'confirmed'];

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <Chip
                    size="small"
                    label={statusConfig.label}
                    sx={{
                        height: 22,
                        color: statusConfig.color,
                        bgcolor: statusConfig.bg,
                        border: `1px solid ${statusConfig.border}`,
                        fontSize: '0.7rem',
                    }}
                />
                <IconButton
                    size="small"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{ p: 0.25, color: '#475569', '&:hover': { color: '#94a3b8' } }}
                >
                    <MoreVert sx={{ fontSize: 14 }} />
                </IconButton>
            </Box>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid rgba(52,58,68,0.5)', minWidth: 160 } }}
            >
                {status !== 'confirmed' && (
                    <MenuItem
                        dense
                        sx={{ fontSize: '0.8rem', color: '#10b981' }}
                        onClick={() => { onUpdateStatus('confirmed'); setAnchorEl(null); }}
                    >
                        Mark as Confirmed
                    </MenuItem>
                )}
                {status !== 'reserved' && (
                    <MenuItem
                        dense
                        sx={{ fontSize: '0.8rem', color: '#94a3b8' }}
                        onClick={() => { onReserve(); setAnchorEl(null); }}
                    >
                        Resend Request
                    </MenuItem>
                )}
                {owner?.email && (
                    <MenuItem
                        dense
                        component="a"
                        href={`mailto:${owner.email}`}
                        sx={{ fontSize: '0.8rem', color: '#94a3b8' }}
                        onClick={() => setAnchorEl(null)}
                    >
                        Contact Owner
                    </MenuItem>
                )}
                <MenuItem
                    dense
                    sx={{ fontSize: '0.8rem', color: '#ef4444' }}
                    onClick={() => { onUpdateStatus('cancelled'); setAnchorEl(null); }}
                >
                    Cancel Reservation
                </MenuItem>
            </Menu>
        </>
    );
}
