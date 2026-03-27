'use client';

import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, TextField, Button, Chip, CircularProgress,
    IconButton, Checkbox, FormControlLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useEventTypes } from '@/features/catalog/event-types/hooks';
import { useCreatePackageSet } from '@/features/catalog/packages/hooks';

// ─── Tier Constants ──────────────────────────────────────────────────

const TIER_OPTIONS = [
    { label: 'Budget',   color: '#F97316' },
    { label: 'Basic',    color: '#3B82F6' },
    { label: 'Standard', color: '#EC4899' },
    { label: 'Premium',  color: '#EAB308' },
    { label: 'Ultimate', color: '#22D3EE' },
] as const;

// ─── Emoji Presets ───────────────────────────────────────────────────

const EMOJI_OPTIONS = ['📦', '💒', '🎉', '🎥', '🎵', '🏢', '🪷', '💍', '🎬', '🌿', '✨', '🎊'];

// ─── Props ───────────────────────────────────────────────────────────

interface CreatePackageSetDialogProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    brandId: number;
}

// ─── Component ───────────────────────────────────────────────────────

export default function CreatePackageSetDialog({
    open, onClose, onCreated, brandId,
}: CreatePackageSetDialogProps) {
    const { data: eventTypes = [] } = useEventTypes({ enabled: open });
    const createPackageSetMutation = useCreatePackageSet(brandId);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [emoji, setEmoji] = useState('📦');
    const [eventTypeId, setEventTypeId] = useState<number | null>(null);
    const [selectedTiers, setSelectedTiers] = useState<Set<string>>(new Set(['Basic', 'Standard', 'Premium']));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setName('');
            setDescription('');
            setEmoji('📦');
            setEventTypeId(null);
            setSelectedTiers(new Set(['Basic', 'Standard', 'Premium']));
            setError('');
        }
    }, [open]);

    const toggleTier = (tier: string) => {
        setSelectedTiers(prev => {
            const next = new Set(prev);
            if (next.has(tier)) next.delete(tier);
            else next.add(tier);
            return next;
        });
    };

    const handleSelectEventType = (etId: number, etName: string) => {
        setEventTypeId(etId);
        if (!name.trim() || eventTypes.some(et => et.name === name.trim())) {
            setName(`${etName} Packages`);
        }
    };

    const handleCreate = async () => {
        if (!eventTypeId) { setError('Please select an event type'); return; }
        if (!name.trim()) { setError('Name is required'); return; }
        if (selectedTiers.size === 0) { setError('Select at least one tier level'); return; }
        setSaving(true);
        setError('');
        try {
            const tierLabels = TIER_OPTIONS
                .map(t => t.label)
                .filter(t => selectedTiers.has(t));

            await createPackageSetMutation.mutateAsync({
                name: name.trim(),
                description: description.trim() || undefined,
                emoji,
                event_type_id: eventTypeId,
                tier_labels: tierLabels,
            });
            onCreated();
            onClose();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err?.message || 'Failed to create set');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: '#0f1117',
                    border: '1px solid rgba(52, 58, 68, 0.4)',
                    borderRadius: 3,
                },
            }}
        >
            <DialogTitle sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                pb: 1, borderBottom: '1px solid rgba(52, 58, 68, 0.3)',
            }}>
                <Typography sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.1rem' }}>
                    Create Package Set
                </Typography>
                <IconButton onClick={onClose} sx={{ color: '#64748b' }}>
                    <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: '20px !important' }}>
                {/* Emoji Picker */}
                <Box sx={{ mb: 3 }}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, mb: 1 }}>
                        Icon
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        {EMOJI_OPTIONS.map(e => (
                            <Box
                                key={e}
                                onClick={() => setEmoji(e)}
                                sx={{
                                    width: 40, height: 40, borderRadius: 2,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.3rem', cursor: 'pointer',
                                    bgcolor: emoji === e ? 'rgba(100, 140, 255, 0.12)' : 'rgba(255,255,255,0.03)',
                                    border: emoji === e ? '1px solid rgba(100, 140, 255, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                                    transition: 'all 0.15s',
                                    '&:hover': { bgcolor: 'rgba(100, 140, 255, 0.08)' },
                                }}
                            >
                                {e}
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Name */}
                <TextField
                    fullWidth
                    label="Set Name"
                    placeholder="e.g., Wedding Packages, Birthday Parties"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    error={!!error}
                    helperText={error}
                    sx={{
                        mb: 2.5,
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255,255,255,0.03)',
                            color: '#e2e8f0',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&.Mui-focused fieldset': { borderColor: '#648CFF' },
                        },
                        '& .MuiInputLabel-root': { color: '#64748b' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#648CFF' },
                    }}
                />

                {/* Description */}
                <TextField
                    fullWidth
                    label="Description (optional)"
                    placeholder="Brief description of this package set"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    multiline
                    rows={2}
                    sx={{
                        mb: 2.5,
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255,255,255,0.03)',
                            color: '#e2e8f0',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&.Mui-focused fieldset': { borderColor: '#648CFF' },
                        },
                        '& .MuiInputLabel-root': { color: '#64748b' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#648CFF' },
                    }}
                />

                {/* Event Type (required) */}
                <Box>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, mb: 1 }}>
                        Event Type <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
                    </Typography>
                    {eventTypes.length === 0 ? (
                        <Typography sx={{ color: '#475569', fontSize: '0.75rem', fontStyle: 'italic' }}>
                            No event types yet — add one in your brand settings first
                        </Typography>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            {eventTypes.map(et => (
                                <Chip
                                    key={et.id}
                                    label={`${et.icon || '🎬'} ${et.name}`}
                                    size="small"
                                    onClick={() => handleSelectEventType(et.id, et.name)}
                                    sx={{
                                        height: 28, fontSize: '0.7rem', fontWeight: 600, borderRadius: 1.5,
                                        bgcolor: eventTypeId === et.id ? 'rgba(100,140,255,0.12)' : 'rgba(255,255,255,0.03)',
                                        color: eventTypeId === et.id ? '#648CFF' : '#94a3b8',
                                        border: eventTypeId === et.id ? '1px solid rgba(100,140,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                        cursor: 'pointer',
                                    }}
                                />
                            ))}
                        </Box>
                    )}
                </Box>

                {/* Tier Levels (required — at least 1) */}
                <Box sx={{ mt: 2.5 }}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, mb: 1 }}>
                        Tier Levels <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
                    </Typography>
                    <Typography sx={{ color: '#475569', fontSize: '0.68rem', mb: 1.5 }}>
                        Select which pricing tiers this set should include (at least 1)
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {TIER_OPTIONS.map(tier => {
                            const checked = selectedTiers.has(tier.label);
                            return (
                                <FormControlLabel
                                    key={tier.label}
                                    control={
                                        <Checkbox
                                            checked={checked}
                                            onChange={() => toggleTier(tier.label)}
                                            sx={{
                                                color: 'rgba(255,255,255,0.15)',
                                                '&.Mui-checked': { color: tier.color },
                                                p: 0.75,
                                            }}
                                            size="small"
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{
                                                width: 10, height: 10, borderRadius: '50%',
                                                bgcolor: tier.color,
                                                boxShadow: checked ? `0 0 8px ${tier.color}60` : 'none',
                                                transition: 'box-shadow 0.2s',
                                            }} />
                                            <Typography sx={{
                                                fontSize: '0.78rem',
                                                fontWeight: checked ? 700 : 500,
                                                color: checked ? tier.color : '#64748b',
                                                transition: 'color 0.15s',
                                            }}>
                                                {tier.label}
                                            </Typography>
                                        </Box>
                                    }
                                    sx={{ ml: 0, '& .MuiFormControlLabel-label': { ml: 0.5 } }}
                                />
                            );
                        })}
                    </Box>
                    {error === 'Select at least one tier level' && (
                        <Typography sx={{ color: '#ef4444', fontSize: '0.7rem', mt: 0.5 }}>
                            {error}
                        </Typography>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: '1px solid rgba(52, 58, 68, 0.3)' }}>
                <Button onClick={onClose} sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleCreate}
                    disabled={saving || !name.trim() || !eventTypeId || selectedTiers.size === 0}
                    sx={{
                        bgcolor: '#f59e0b', color: '#0f172a', fontWeight: 700,
                        textTransform: 'none', px: 3, fontSize: '0.8rem',
                        borderRadius: 2,
                        '&:hover': { bgcolor: '#d97706' },
                        '&:disabled': { bgcolor: 'rgba(245,158,11,0.3)', color: '#64748b' },
                    }}
                >
                    {saving ? <CircularProgress size={18} sx={{ color: '#0f172a' }} /> : 'Create Set'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
