import React, { useState } from 'react';
import { Box, Chip, CircularProgress, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { MoreVert, Send } from '@mui/icons-material';
import type { RequestState } from '../../types';

export interface RequestBadgeProps {
    requestState?: RequestState;
    onSend: () => void;
    onUpdateStatus: (status: 'pending' | 'confirmed' | 'declined' | 'cancelled') => void;
    onDirectConfirm?: () => void;
    sending?: boolean;
}

export function RequestBadge({
    requestState,
    onSend,
    onUpdateStatus,
    onDirectConfirm,
    sending,
}: RequestBadgeProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    if (sending) {
        return <CircularProgress size={14} sx={{ color: '#64748b' }} />;
    }

    if (!requestState) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <Tooltip title="Send availability request" arrow placement="top">
                    <IconButton
                        size="small"
                        onClick={onSend}
                        sx={{
                            p: 0.5,
                            color: '#64748b',
                            border: '1px solid rgba(148,163,184,0.2)',
                            bgcolor: 'rgba(148,163,184,0.05)',
                            '&:hover': { color: '#60a5fa', bgcolor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)' },
                        }}
                    >
                        <Send sx={{ fontSize: 14 }} />
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
        pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
        confirmed: { label: 'Confirmed', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
        declined: { label: 'Declined', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
        cancelled: { label: 'Cancelled', color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)' },
    }[requestState.status];

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
                {requestState.status !== 'confirmed' && (
                    <MenuItem
                        dense
                        sx={{ fontSize: '0.8rem', color: '#10b981' }}
                        onClick={() => { onUpdateStatus('confirmed'); setAnchorEl(null); }}
                    >
                        Mark as Confirmed
                    </MenuItem>
                )}
                {requestState.status === 'confirmed' && (
                    <MenuItem
                        dense
                        sx={{ fontSize: '0.8rem', color: '#f59e0b' }}
                        onClick={() => { onUpdateStatus('pending'); setAnchorEl(null); }}
                    >
                        Unconfirm
                    </MenuItem>
                )}
                {requestState.status !== 'declined' && (
                    <MenuItem
                        dense
                        sx={{ fontSize: '0.8rem', color: '#ef4444' }}
                        onClick={() => { onUpdateStatus('declined'); setAnchorEl(null); }}
                    >
                        Mark as Declined
                    </MenuItem>
                )}
                {requestState.status !== 'pending' && (
                    <MenuItem
                        dense
                        sx={{ fontSize: '0.8rem', color: '#94a3b8' }}
                        onClick={() => { onSend(); setAnchorEl(null); }}
                    >
                        Resend Request
                    </MenuItem>
                )}
                {requestState.status !== 'cancelled' && (
                    <MenuItem
                        dense
                        sx={{ fontSize: '0.8rem', color: '#64748b' }}
                        onClick={() => { onUpdateStatus('cancelled'); setAnchorEl(null); }}
                    >
                        Cancel Request
                    </MenuItem>
                )}
            </Menu>
        </>
    );
}
