'use client';

import React from 'react';
import {
    Box, Typography, Button, IconButton,
    Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import InventoryIcon from '@mui/icons-material/Inventory';
import CloseIcon from '@mui/icons-material/Close';

import type { EventDay } from '@/components/schedule';
import type { ServicePackageItem } from '@/lib/types/domains/sales';

// ─── Props ───────────────────────────────────────────────────────────

export interface PreviewDialogProps {
    open: boolean;
    onClose: () => void;
    formData: {
        name?: string | null;
        description?: string | null;
        category?: string | null;
        base_price?: number | string | null;
        contents?: {
            items?: ServicePackageItem[];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            [key: string]: any;
        } | null;
    };
    packageEventDays: EventDay[];
}

// ─── Component ───────────────────────────────────────────────────────

export function PreviewDialog({ open, onClose, formData, packageEventDays }: PreviewDialogProps) {
    const items = formData.contents?.items || [];
    const total = items.reduce((sum, item) => sum + (item.price || 0), 0) + Number(formData.base_price || 0);

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
                },
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }} component="div">
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9' }}>Client Preview</Typography>
                    <Typography variant="caption" component="span" sx={{ color: '#64748b', display: 'block' }}>How clients will see this package</Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#64748b' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                {/* Package Header */}
                <Box sx={{ mb: 3, pb: 2.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#f1f5f9', mb: 0.5 }}>
                        {formData.name || 'Untitled Package'}
                    </Typography>
                    {formData.description && (
                        <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                            {formData.description}
                        </Typography>
                    )}
                    {formData.category && (
                        <Chip
                            label={formData.category}
                            size="small"
                            sx={{ mt: 1, bgcolor: 'rgba(100, 140, 255, 0.1)', color: '#648CFF', fontWeight: 600, fontSize: '0.7rem', height: 24, border: '1px solid rgba(100, 140, 255, 0.25)' }}
                        />
                    )}
                </Box>

                {/* What's Included */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 2 }}>
                    What&apos;s Included
                </Typography>
                <Stack spacing={1.5} sx={{ mb: 3 }}>
                    {items.map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <Box sx={{
                                width: 32, height: 32, borderRadius: 1.5,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: item.type === 'film' ? 'rgba(100, 140, 255, 0.1)' : 'rgba(255,255,255,0.06)',
                            }}>
                                {item.type === 'film'
                                    ? <VideoLibraryIcon sx={{ fontSize: 16, color: '#648CFF' }} />
                                    : <InventoryIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                }
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#f1f5f9' }}>
                                    {item.description}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                    {item.type === 'film' ? 'Film' : 'Service'}
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem' }}>
                                ${item.price?.toFixed(2) || '0.00'}
                            </Typography>
                        </Box>
                    ))}
                    {items.length === 0 && (
                        <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', py: 2 }}>No items in this package yet.</Typography>
                    )}
                </Stack>

                {/* Schedule Overview */}
                {packageEventDays.length > 0 && (
                    <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.5 }}>
                            Schedule
                        </Typography>
                        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {packageEventDays.map((day) => (
                                <Chip
                                    key={day.id}
                                    label={day.name}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', fontWeight: 600, fontSize: '0.7rem', height: 26, border: '1px solid rgba(139, 92, 246, 0.25)' }}
                                />
                            ))}
                        </Box>
                    </>
                )}

                {/* Total Pricing */}
                <Box sx={{ mt: 2, pt: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9' }}>Package Total</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981' }}>
                        ${total.toFixed(2)}
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} sx={{ color: '#64748b', textTransform: 'none' }}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
