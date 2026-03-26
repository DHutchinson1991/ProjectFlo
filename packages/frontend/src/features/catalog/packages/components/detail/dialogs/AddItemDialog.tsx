'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, TextField,
    Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import InventoryIcon from '@mui/icons-material/Inventory';

// ─── Props ───────────────────────────────────────────────────────────

export interface AddItemDialogProps {
    open: boolean;
    onClose: () => void;
    /** Which tab to pre-select when the dialog opens. */
    initialType: 'film' | 'service';
    /**
     * Callback when the user confirms adding a service.
     */
    onAddService: (description: string) => void;
    /** Opens the Film Creation Wizard (separate dialog). */
    onOpenFilmWizard: () => void;
}

// ─── Component ───────────────────────────────────────────────────────

export function AddItemDialog({
    open,
    onClose,
    initialType,
    onAddService,
    onOpenFilmWizard,
}: AddItemDialogProps) {
    const [newItemType, setNewItemType] = useState<'film' | 'service'>(initialType);
    const [serviceDescription, setServiceDescription] = useState('');

    // Reset internal state whenever the dialog opens or the initial type changes
    useEffect(() => {
        if (open) {
            setNewItemType(initialType);
            setServiceDescription('');
        }
    }, [open, initialType]);

    // When Film is selected, go straight to the wizard
    useEffect(() => {
        if (open && newItemType === 'film') {
            onClose();
            onOpenFilmWizard();
        }
    }, [open, newItemType, onClose, onOpenFilmWizard]);

    const handleSubmitService = () => {
        onAddService(serviceDescription);
        onClose();
    };

    return (
        <Dialog
            open={open && newItemType === 'service'}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { background: 'rgba(16, 18, 22, 0.95)', border: '1px solid rgba(52, 58, 68, 0.4)', borderRadius: 3, backdropFilter: 'blur(20px)' } }}
        >
            <DialogTitle sx={{ pb: 1 }} component="div">
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9' }}>Add to Package</Typography>
                <Typography variant="caption" component="span" sx={{ color: '#64748b', display: 'block' }}>Choose what to add to this package</Typography>
            </DialogTitle>

            <DialogContent sx={{ pb: 1 }}>
                {/* Type selection tabs */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
                    <Chip
                        icon={<VideoLibraryIcon sx={{ fontSize: '16px !important' }} />}
                        label="Film"
                        onClick={() => setNewItemType('film')}
                        sx={{
                            flex: 1, height: 40, fontWeight: 600, fontSize: '0.85rem',
                            bgcolor: 'rgba(255,255,255,0.04)',
                            color: '#94a3b8',
                            border: '1px solid rgba(52, 58, 68, 0.3)',
                            '& .MuiChip-icon': { color: '#64748b' },
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                        }}
                    />
                    <Chip
                        icon={<InventoryIcon sx={{ fontSize: '16px !important' }} />}
                        label="Service"
                        onClick={() => setNewItemType('service')}
                        sx={{
                            flex: 1, height: 40, fontWeight: 600, fontSize: '0.85rem',
                            bgcolor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            '& .MuiChip-icon': { color: '#10b981' },
                            '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' },
                        }}
                    />
                </Box>

                {/* Service input */}
                <Stack spacing={2}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>Service Details</Typography>
                    <TextField
                        label="Service Description"
                        size="small"
                        fullWidth
                        autoFocus
                        value={serviceDescription}
                        onChange={(e) => setServiceDescription(e.target.value)}
                        placeholder="e.g. Drone coverage, Second shooter..."
                    />
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
                <Button onClick={onClose} sx={{ color: '#64748b', textTransform: 'none' }}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmitService}
                    disabled={!serviceDescription}
                    sx={{ bgcolor: '#648CFF', '&:hover': { bgcolor: '#5A7BF0' }, borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}
                >
                    Add Service
                </Button>
            </DialogActions>
        </Dialog>
    );
}
