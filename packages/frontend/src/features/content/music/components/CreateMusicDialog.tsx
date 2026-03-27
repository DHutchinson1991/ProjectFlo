"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Paper,
    Grid
} from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { MusicType, MUSIC_TYPE_OPTIONS } from '@/features/content/music/types';
import type { MusicLibraryItem } from '@/features/content/music/types';
import MusicTemplateDialog from './MusicTemplateDialog';

interface MusicItem {
    id?: number;
    music_name?: string;
    artist?: string;
    duration?: number;
    music_type: MusicType;
    file_path?: string;
    notes?: string;
    moment_id?: number;
    moment_name?: string;
    scene_name?: string;
}

interface Moment {
    id: number;
    name: string;
}

interface CreateMusicDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (musicData: Omit<MusicItem, 'id'> & { selectedMomentId?: number }) => void;
    editingItem?: MusicItem | null;
    saving?: boolean;
    moments?: Moment[];
    projectId?: number;
}

const CreateMusicDialog: React.FC<CreateMusicDialogProps> = ({
    open,
    onClose,
    onSave,
    editingItem,
    saving = false,
    moments = [],
    projectId
}) => {
    const [formData, setFormData] = useState<Omit<MusicItem, 'id'>>({
        music_name: '',
        artist: '',
        duration: 0,
        music_type: 'MODERN',
        file_path: '',
        notes: ''
    });

    const [selectedMomentId, setSelectedMomentId] = useState<number | ''>('');
    const [errors, setErrors] = useState<Partial<Record<keyof MusicItem, string>>>({});
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

    useEffect(() => {
        if (editingItem) {
            setFormData({
                music_name: editingItem.music_name || '',
                artist: editingItem.artist || '',
                duration: editingItem.duration || 0,
                music_type: editingItem.music_type,
                file_path: editingItem.file_path || '',
                notes: editingItem.notes || ''
            });
        } else {
            setFormData({
                music_name: '',
                artist: '',
                duration: 0,
                music_type: 'MODERN',
                file_path: '',
                notes: ''
            });
        }
        setSelectedMomentId('');
        setErrors({});
    }, [editingItem, open]);

    const handleInputChange = (field: keyof typeof formData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof MusicItem, string>> = {};

        if (!formData.music_name?.trim()) {
            newErrors.music_name = 'Music name is required';
        }

        if (formData.duration && formData.duration < 0) {
            newErrors.duration = 'Duration must be positive';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm()) return;
        onSave({
            ...formData,
            selectedMomentId: selectedMomentId === '' ? undefined : selectedMomentId
        });
    };

    const handleClose = () => {
        setFormData({
            music_name: '',
            artist: '',
            duration: 0,
            music_type: 'MODERN',
            file_path: '',
            notes: ''
        });
        setSelectedMomentId('');
        setErrors({});
        onClose();
    };

    const handleUseTemplate = (template: MusicLibraryItem) => {
        setFormData({
            music_name: template.music_name || '',
            artist: template.artist || '',
            duration: template.duration || 0,
            music_type: template.music_type,
            file_path: template.file_path || '',
            notes: template.notes || ''
        });
        setTemplateDialogOpen(false);
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        background: (theme) => theme.palette.mode === 'dark'
                            ? 'linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)'
                            : 'linear-gradient(145deg, #f8f9fa 0%, #ffffff 50%, #f1f3f4 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(156, 39, 176, 0.1)',
                        boxShadow: '0 24px 64px rgba(156, 39, 176, 0.15)',
                    }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: (theme) => theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(156, 39, 176, 0.08) 100%)'
                        : 'linear-gradient(135deg, rgba(156, 39, 176, 0.12) 0%, rgba(156, 39, 176, 0.06) 100%)',
                    borderBottom: '1px solid rgba(156, 39, 176, 0.2)',
                    borderRadius: '8px 8px 0 0',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MusicNoteIcon sx={{ color: '#9c27b0' }} />
                        <Typography variant="h6" sx={{ color: '#9c27b0', fontWeight: 600 }}>
                            {editingItem ? 'Edit Music Track' : 'Add New Music Track'}
                        </Typography>
                    </Box>
                    {!editingItem && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setTemplateDialogOpen(true)}
                            sx={{
                                borderColor: 'rgba(156, 39, 176, 0.6)',
                                color: '#9c27b0',
                                fontWeight: 500,
                                '&:hover': {
                                    borderColor: '#9c27b0',
                                    backgroundColor: 'rgba(156, 39, 176, 0.12)',
                                    boxShadow: '0 2px 8px rgba(156, 39, 176, 0.2)',
                                }
                            }}
                            startIcon={<MusicNoteIcon />}
                        >
                            Choose from Library
                        </Button>
                    )}
                </DialogTitle>
                <DialogContent sx={{
                    pb: 2,
                    background: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(0, 0, 0, 0.2)'
                        : 'rgba(255, 255, 255, 0.5)',
                }}>
                    {/* Current Attachment Status */}
                    {editingItem && editingItem.moment_id && editingItem.moment_name && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                mt: 2,
                                borderRadius: 2,
                                border: 1,
                                borderColor: "rgba(156, 39, 176, 0.3)",
                                background: 'rgba(156, 39, 176, 0.08)',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <MusicNoteIcon sx={{ color: '#9c27b0', fontSize: 20 }} />
                                <Typography variant="subtitle2" sx={{ color: '#9c27b0', fontWeight: 600 }}>
                                    Currently Attached To
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {editingItem.moment_name}
                            </Typography>
                            {editingItem.scene_name && (
                                <Typography variant="caption" color="text.secondary">
                                    in {editingItem.scene_name}
                                </Typography>
                            )}
                        </Paper>
                    )}

                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            mt: 2,
                            borderRadius: 2,
                            border: 1,
                            borderColor: "rgba(156, 39, 176, 0.2)",
                            background: (theme) => theme.palette.mode === 'dark'
                                ? 'rgba(26, 26, 26, 0.8)'
                                : 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 8px 24px rgba(156, 39, 176, 0.1)',
                        }}
                    >
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                            Music Details
                        </Typography>

                        <Grid container spacing={2}>
                            {/* Moment Assignment - Full width if moments exist */}
                            {moments.length > 0 && (
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel sx={{
                                            color: '#9c27b0',
                                            '&.Mui-focused': { color: '#9c27b0' }
                                        }}>
                                            Assign to Moment
                                        </InputLabel>
                                        <Select
                                            value={selectedMomentId}
                                            onChange={(e) => setSelectedMomentId(e.target.value as number | '')}
                                            label="Assign to Moment"
                                            sx={{
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(156, 39, 176, 0.3)',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(156, 39, 176, 0.6)',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#9c27b0',
                                                },
                                            }}
                                        >
                                            <MenuItem value="">
                                                <em>No moment assignment</em>
                                            </MenuItem>
                                            {moments.map((moment) => (
                                                <MenuItem key={moment.id} value={moment.id}>
                                                    {moment.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            )}

                            {/* Music Name and Artist - Same row */}
                            <Grid item xs={12} sm={7}>
                                <TextField
                                    label="Music Name *"
                                    value={formData.music_name}
                                    onChange={(e) => handleInputChange('music_name', e.target.value)}
                                    fullWidth
                                    error={!!errors.music_name}
                                    helperText={errors.music_name}
                                    placeholder="e.g., Canon in D, Here Comes the Sun"
                                />
                            </Grid>
                            <Grid item xs={12} sm={5}>
                                <TextField
                                    label="Artist"
                                    value={formData.artist}
                                    onChange={(e) => handleInputChange('artist', e.target.value)}
                                    fullWidth
                                    placeholder="e.g., Pachelbel, The Beatles"
                                />
                            </Grid>

                            {/* Music Type and Duration - Same row */}
                            <Grid item xs={12} sm={7}>
                                <FormControl fullWidth>
                                    <InputLabel>Music Type</InputLabel>
                                    <Select
                                        value={formData.music_type}
                                        label="Music Type"
                                        onChange={(e) => handleInputChange('music_type', e.target.value as MusicType)}
                                    >
                                        {MUSIC_TYPE_OPTIONS.filter(option => option.value !== 'NONE').map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={5}>
                                <TextField
                                    label="Duration (seconds)"
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                                    fullWidth
                                    inputProps={{ min: 0, max: 3600 }}
                                    error={!!errors.duration}
                                    helperText={errors.duration}
                                />
                            </Grid>

                            {/* File Path - Full width */}
                            <Grid item xs={12}>
                                <TextField
                                    label="File Path"
                                    value={formData.file_path}
                                    onChange={(e) => handleInputChange('file_path', e.target.value)}
                                    fullWidth
                                    placeholder="Optional - path to music file"
                                    helperText="Optional - reference to where the music file is stored"
                                />
                            </Grid>

                            {/* Notes - Full width but smaller */}
                            <Grid item xs={12}>
                                <TextField
                                    label="Notes"
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    fullWidth
                                    multiline
                                    rows={2}
                                    placeholder="Additional notes about this music track..."
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </DialogContent>
                <DialogActions sx={{
                    p: 3,
                    borderTop: '1px solid rgba(156, 39, 176, 0.2)',
                    gap: 1,
                    background: (theme) => theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.04) 100%)'
                        : 'linear-gradient(135deg, rgba(156, 39, 176, 0.06) 0%, rgba(156, 39, 176, 0.03) 100%)',
                    borderRadius: '0 0 8px 8px',
                }}>
                    <Button
                        onClick={handleClose}
                        disabled={saving}
                        variant="outlined"
                        sx={{
                            mr: 1,
                            borderColor: 'rgba(156, 39, 176, 0.5)',
                            color: '#9c27b0',
                            '&:hover': {
                                borderColor: '#9c27b0',
                                backgroundColor: 'rgba(156, 39, 176, 0.08)'
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={saving || !formData.music_name?.trim()}
                        startIcon={saving ? <span>⏳</span> : <MusicNoteIcon />}
                        sx={{
                            backgroundColor: '#9c27b0',
                            color: 'white',
                            fontWeight: 600,
                            '&:hover': {
                                backgroundColor: '#7b1fa2',
                                boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)',
                            },
                            '&:disabled': {
                                backgroundColor: 'rgba(156, 39, 176, 0.3)',
                                color: 'rgba(255, 255, 255, 0.5)',
                            }
                        }}
                    >
                        {saving ? 'Saving...' : editingItem ? 'Update Music' : 'Add Music'}
                    </Button>
                </DialogActions>
            </Dialog>

            <MusicTemplateDialog
                open={templateDialogOpen}
                onClose={() => setTemplateDialogOpen(false)}
                onUseTemplate={handleUseTemplate}
                projectId={projectId}
                mode="library"
            />
        </>
    );
};

export default CreateMusicDialog;
