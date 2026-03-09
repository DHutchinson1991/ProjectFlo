'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, TextField,
    Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import InventoryIcon from '@mui/icons-material/Inventory';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import type { FilmData, PackageActivityRecord } from '../_lib/types';

// ─── Props ───────────────────────────────────────────────────────────

export interface AddItemDialogProps {
    open: boolean;
    onClose: () => void;
    /** Which tab to pre-select when the dialog opens. */
    initialType: 'film' | 'service';
    films: FilmData[];
    packageActivities: PackageActivityRecord[];
    /**
     * Callback when the user confirms adding an item.
     * PageComponent handles the actual API / state mutation.
     */
    onAdd: (type: 'film' | 'service', filmId?: string, description?: string) => void;
    /** Opens the Activity Film Wizard (separate dialog). */
    onOpenActivityWizard: () => void;
}

// ─── Component ───────────────────────────────────────────────────────

export function AddItemDialog({
    open,
    onClose,
    initialType,
    films,
    packageActivities,
    onAdd,
    onOpenActivityWizard,
}: AddItemDialogProps) {
    const [newItemType, setNewItemType] = useState<'film' | 'service'>(initialType);
    const [selectedFilmId, setSelectedFilmId] = useState('');
    const [serviceDescription, setServiceDescription] = useState('');

    // Reset internal state whenever the dialog opens or the initial type changes
    useEffect(() => {
        if (open) {
            setNewItemType(initialType);
            setSelectedFilmId('');
            setServiceDescription('');
        }
    }, [open, initialType]);

    const handleSubmit = () => {
        onAdd(newItemType, selectedFilmId, serviceDescription);
        onClose();
    };

    return (
        <Dialog
            open={open}
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
                            bgcolor: newItemType === 'film' ? 'rgba(100, 140, 255, 0.15)' : 'rgba(255,255,255,0.04)',
                            color: newItemType === 'film' ? '#648CFF' : '#94a3b8',
                            border: `1px solid ${newItemType === 'film' ? 'rgba(100, 140, 255, 0.35)' : 'rgba(52, 58, 68, 0.3)'}`,
                            '& .MuiChip-icon': { color: newItemType === 'film' ? '#648CFF' : '#64748b' },
                            '&:hover': { bgcolor: newItemType === 'film' ? 'rgba(100, 140, 255, 0.2)' : 'rgba(255,255,255,0.06)' },
                        }}
                    />
                    <Chip
                        icon={<InventoryIcon sx={{ fontSize: '16px !important' }} />}
                        label="Service"
                        onClick={() => setNewItemType('service')}
                        sx={{
                            flex: 1, height: 40, fontWeight: 600, fontSize: '0.85rem',
                            bgcolor: newItemType === 'service' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
                            color: newItemType === 'service' ? '#10b981' : '#94a3b8',
                            border: `1px solid ${newItemType === 'service' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(52, 58, 68, 0.3)'}`,
                            '& .MuiChip-icon': { color: newItemType === 'service' ? '#10b981' : '#64748b' },
                            '&:hover': { bgcolor: newItemType === 'service' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.06)' },
                        }}
                    />
                </Box>

                {/* From Activities shortcut */}
                {packageActivities.length > 0 && (
                    <Box
                        onClick={() => { onClose(); onOpenActivityWizard(); }}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5,
                            p: 1.5, mb: 2, borderRadius: 2, cursor: 'pointer',
                            bgcolor: 'rgba(167, 139, 250, 0.06)',
                            border: '1px solid rgba(167, 139, 250, 0.2)',
                            transition: 'all 0.15s ease',
                            '&:hover': { bgcolor: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.35)' },
                        }}
                    >
                        <AutoAwesomeIcon sx={{ fontSize: 18, color: '#a78bfa' }} />
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#e2e8f0' }}>
                                Create from Activities
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                                Auto-create scenes &amp; moments from your schedule
                            </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#a78bfa', fontWeight: 600, fontSize: '0.7rem' }}>
                            {packageActivities.length} activit{packageActivities.length !== 1 ? 'ies' : 'y'}
                        </Typography>
                    </Box>
                )}

                {/* Film picker */}
                {newItemType === 'film' && (
                    <Stack spacing={2}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>Select Film Template</Typography>
                        <Stack spacing={1}>
                            {films.map((f) => {
                                const isSelected = selectedFilmId === String(f.id);
                                const sceneCount = f.scenes?.length || 0;
                                return (
                                    <Box
                                        key={f.id}
                                        onClick={() => setSelectedFilmId(String(f.id))}
                                        sx={{
                                            display: 'flex', alignItems: 'center', gap: 1.5,
                                            p: 1.5, borderRadius: 2, cursor: 'pointer',
                                            bgcolor: isSelected ? 'rgba(100, 140, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${isSelected ? 'rgba(100, 140, 255, 0.35)' : 'rgba(52, 58, 68, 0.25)'}`,
                                            transition: 'all 0.15s ease',
                                            '&:hover': { bgcolor: isSelected ? 'rgba(100, 140, 255, 0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isSelected ? 'rgba(100, 140, 255, 0.45)' : 'rgba(52, 58, 68, 0.45)'}` },
                                        }}
                                    >
                                        <Box sx={{
                                            width: 32, height: 32, borderRadius: 1.5,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            bgcolor: isSelected ? 'rgba(100, 140, 255, 0.15)' : 'rgba(255,255,255,0.05)',
                                            flexShrink: 0,
                                        }}>
                                            <VideoLibraryIcon sx={{ fontSize: 16, color: isSelected ? '#648CFF' : '#64748b' }} />
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', color: isSelected ? '#f1f5f9' : '#94a3b8' }}>
                                                {f.name}
                                            </Typography>
                                            {sceneCount > 0 && (
                                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                                                    {sceneCount} scene{sceneCount !== 1 ? 's' : ''}
                                                </Typography>
                                            )}
                                        </Box>
                                        {isSelected && (
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#648CFF', flexShrink: 0 }} />
                                        )}
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Stack>
                )}

                {/* Service input */}
                {newItemType === 'service' && (
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
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
                <Button onClick={onClose} sx={{ color: '#64748b', textTransform: 'none' }}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={newItemType === 'film' ? !selectedFilmId : !serviceDescription}
                    sx={{ bgcolor: '#648CFF', '&:hover': { bgcolor: '#5A7BF0' }, borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}
                >
                    {newItemType === 'film' ? 'Add Film' : 'Add Service'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
