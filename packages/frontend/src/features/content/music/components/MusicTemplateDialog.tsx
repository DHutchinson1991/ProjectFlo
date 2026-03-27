"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Card,
    CardContent,
    Typography,
    Chip,
    Box,
    IconButton,
    Alert,
    CircularProgress
} from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import CloseIcon from '@mui/icons-material/Close';
import { MusicLibraryItem, MusicType } from '@/features/content/music/types';
import { musicApi } from '@/features/content/music/api/music';

interface MusicTemplateDialogProps {
    open: boolean;
    onClose: () => void;
    onUseTemplate: (template: MusicLibraryItem) => void;
    projectId?: number;
    mode?: 'templates' | 'library';
}

const MusicTemplateDialog: React.FC<MusicTemplateDialogProps> = ({
    open,
    onClose,
    onUseTemplate,
    projectId,
    mode = 'templates'
}) => {
    const [templates, setTemplates] = useState<MusicLibraryItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchTemplates();
        }
    }, [open]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            let items: MusicLibraryItem[] = [];
            if (mode === 'library') {
                items = await musicApi.getMusicLibrary(projectId);
            } else {
                items = await musicApi.getMusicTemplates();
            }
            setTemplates(items);
        } catch (error) {
            console.error('Error fetching music items:', error);
        } finally {
            setLoading(false);
        }
    };
    const getMusicTypeColor = (type: MusicType) => {
        switch (type) {
            case 'ORCHESTRAL': return '#7b1fa2';  // Purple 700
            case 'PIANO': return '#8e24aa';       // Purple 600
            case 'MODERN': return '#9c27b0';      // Purple 500
            case 'VINTAGE': return '#ab47bc';     // Purple 400
            case 'SCENE_MATCHED': return '#ba68c8'; // Purple 300
            default: return '#757575';
        }
    };

    const getMusicTypeLabel = (type: MusicType) => {
        switch (type) {
            case 'ORCHESTRAL': return 'Orchestral';
            case 'PIANO': return 'Piano';
            case 'MODERN': return 'Modern';
            case 'VINTAGE': return 'Vintage';
            case 'SCENE_MATCHED': return 'Scene Matched';
            case 'NONE': return 'None';
            default: return type;
        }
    };

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleUseTemplate = (template: MusicLibraryItem) => {
        onUseTemplate(template);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'rgba(156, 39, 176, 0.04)',
                borderBottom: '1px solid rgba(156, 39, 176, 0.12)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MusicNoteIcon sx={{ color: '#9c27b0' }} />
                    <Typography variant="h6" sx={{ color: '#9c27b0', fontWeight: 600 }}>
                        {mode === 'library' ? 'Music Library' : 'Music Templates'}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                    {mode === 'library'
                        ? 'Select a track from your project\'s music library.'
                        : 'Choose from pre-configured music templates to quickly add common wedding music types.'}
                </Alert>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress sx={{ color: '#9c27b0' }} />
                    </Box>
                ) : templates.length === 0 ? (
                    <Alert severity="warning">
                        {mode === 'library' ? 'No music found in the project library.' : 'No music templates found. Create some template music items first.'}
                    </Alert>
                ) : (
                    <Grid container spacing={2}>
                        {templates.map((template) => (
                            <Grid item xs={12} sm={6} key={template.id}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease-in-out',
                                        border: '1px solid rgba(156, 39, 176, 0.12)',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 16px rgba(156, 39, 176, 0.15)',
                                            borderColor: '#9c27b0'
                                        }
                                    }}
                                    onClick={() => handleUseTemplate(template)}
                                >
                                    <CardContent sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            {template.assignment_number && (
                                                <Chip
                                                    label={template.assignment_number}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: '#9c27b0',
                                                        color: 'white',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem'
                                                    }}
                                                />
                                            )}
                                            <Chip
                                                label={getMusicTypeLabel(template.music_type)}
                                                size="small"
                                                sx={{
                                                    backgroundColor: getMusicTypeColor(template.music_type),
                                                    color: 'white',
                                                    fontWeight: 500,
                                                    fontSize: '0.75rem'
                                                }}
                                            />
                                        </Box>

                                        <Typography variant="h6" sx={{
                                            fontWeight: 600,
                                            mb: 0.5,
                                            color: 'text.primary'
                                        }}>
                                            {template.music_name}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            <strong>Artist:</strong> {template.artist}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                            <strong>Duration:</strong> {template.duration ? formatDuration(template.duration) : 'N/A'}
                                        </Typography>
                                        {template.moment_name && (
                                            <Typography variant="caption" color="text.secondary">
                                                Attached to: {template.moment_name}
                                            </Typography>
                                        )}

                                        <Typography variant="body2" color="text.secondary" sx={{
                                            fontStyle: 'italic',
                                            lineHeight: 1.4
                                        }}>
                                            {template.notes}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: 'rgba(156, 39, 176, 0.02)' }}>
                <Button
                    onClick={onClose}
                    sx={{
                        color: 'text.secondary',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                    }}
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MusicTemplateDialog;
