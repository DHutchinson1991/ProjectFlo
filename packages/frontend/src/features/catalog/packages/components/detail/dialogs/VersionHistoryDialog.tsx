'use client';

import React from 'react';
import {
    Box, Typography, Button, IconButton,
    Stack, Chip, Tooltip, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import RestoreIcon from '@mui/icons-material/Restore';
import CloseIcon from '@mui/icons-material/Close';

// ─── Props ───────────────────────────────────────────────────────────

export interface VersionHistoryDialogProps {
    open: boolean;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    packageVersions: any[];
    versionsLoading: boolean;
    onRestore: (versionId: number) => void;
}

// ─── Component ───────────────────────────────────────────────────────

export function VersionHistoryDialog({
    open,
    onClose,
    packageVersions,
    versionsLoading,
    onRestore,
}: VersionHistoryDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    background: 'rgba(16, 18, 22, 0.98)',
                    border: '1px solid rgba(52, 58, 68, 0.4)',
                    borderRadius: 3,
                    backdropFilter: 'blur(20px)',
                    maxHeight: '80vh',
                },
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }} component="div">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <HistoryIcon sx={{ fontSize: 20, color: '#8b5cf6' }} />
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9' }}>Version History</Typography>
                        <Typography variant="caption" component="span" sx={{ color: '#64748b', display: 'block' }}>
                            {packageVersions.length} version{packageVersions.length !== 1 ? 's' : ''} saved
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#64748b' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                {versionsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={32} sx={{ color: '#8b5cf6' }} />
                    </Box>
                ) : packageVersions.length > 0 ? (
                    <Stack spacing={1.5}>
                        {packageVersions.map((version, idx) => {
                            const snapshot = version.snapshot as Record<string, unknown> | null;
                            const versionDate = new Date(version.created_at);
                            const isLatest = idx === 0;
                            return (
                                <Box
                                    key={version.id}
                                    sx={{
                                        p: 2, borderRadius: 2,
                                        bgcolor: isLatest ? 'rgba(139, 92, 246, 0.06)' : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${isLatest ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.06)'}`,
                                        transition: 'all 0.2s ease',
                                        '&:hover': { border: '1px solid rgba(139, 92, 246, 0.3)', bgcolor: 'rgba(139, 92, 246, 0.04)' },
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.85rem' }}>
                                                    v{version.version_number}
                                                </Typography>
                                                {isLatest && (
                                                    <Chip label="Latest" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' }} />
                                                )}
                                            </Box>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>
                                                {versionDate.toLocaleDateString()} at {versionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                            {version.change_summary && (
                                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                                                    {version.change_summary}
                                                </Typography>
                                            )}
                                            {snapshot && (
                                                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                    <Chip
                                                        label={String(snapshot.name || 'Untitled')}
                                                        size="small"
                                                        sx={{ height: 20, fontSize: '0.62rem', bgcolor: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
                                                    />
                                                    {!!snapshot.base_price && (
                                                        <Chip
                                                            label={`$${Number(snapshot.base_price).toFixed(2)}`}
                                                            size="small"
                                                            sx={{ height: 20, fontSize: '0.62rem', bgcolor: 'rgba(16, 185, 129, 0.08)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                                                        />
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                        {!isLatest && (
                                            <Tooltip title="Restore this version">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onRestore(version.id)}
                                                    sx={{
                                                        color: '#8b5cf6',
                                                        bgcolor: 'rgba(139, 92, 246, 0.08)',
                                                        border: '1px solid rgba(139, 92, 246, 0.2)',
                                                        borderRadius: 1.5,
                                                        '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.15)' },
                                                    }}
                                                >
                                                    <RestoreIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Stack>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.4 }} />
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                            No versions yet. Save the package to create the first version.
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} sx={{ color: '#64748b', textTransform: 'none' }}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
