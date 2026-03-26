"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Alert,
    Chip,
    CircularProgress
} from '@mui/material';
import { SceneMoment, formatDuration } from '@/lib/types/moments';

interface MusicItem {
    id?: number;
    music_name?: string;
    artist?: string;
    duration?: number;
    music_type: string;
    file_path?: string;
    notes?: string;
}

interface AttachMusicToMomentDialogProps {
    open: boolean;
    onClose: () => void;
    onAttach: (momentId: number) => void;
    musicItem: MusicItem | null;
    moments: SceneMoment[];
    loading?: boolean;
    saving?: boolean;
}

const AttachMusicToMomentDialog: React.FC<AttachMusicToMomentDialogProps> = ({
    open,
    onClose,
    onAttach,
    musicItem,
    moments,
    loading = false,
    saving = false
}) => {
    const [selectedMomentId, setSelectedMomentId] = useState<number | ''>('');

    useEffect(() => {
        setSelectedMomentId('');
    }, [open]);

    const availableMoments = moments.filter(moment =>
        !moment.music || moment.music.music_type === 'NONE'
    );

    const handleAttach = () => {
        if (selectedMomentId && typeof selectedMomentId === 'number') {
            onAttach(selectedMomentId);
        }
    };

    const handleClose = () => {
        setSelectedMomentId('');
        onClose();
    };

    if (!musicItem) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Attach Music to Moment
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {/* Music Item Info */}
                    <Box sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Music Track:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {musicItem.music_name || 'Untitled'}
                        </Typography>
                        {musicItem.artist && (
                            <Typography variant="body2" color="text.secondary">
                                by {musicItem.artist}
                            </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip
                                label={musicItem.music_type}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                            {musicItem.duration && musicItem.duration > 0 && (
                                <Chip
                                    label={formatDuration(musicItem.duration)}
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        </Box>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={24} />
                            <Typography variant="body2" sx={{ ml: 2 }}>
                                Loading moments...
                            </Typography>
                        </Box>
                    ) : availableMoments.length === 0 ? (
                        <Alert severity="warning">
                            No moments available for music attachment. All moments either already have music or no moments exist in this scene.
                        </Alert>
                    ) : (
                        <>
                            <Typography variant="body2" color="text.secondary">
                                Select a moment to attach this music track to:
                            </Typography>

                            <FormControl fullWidth>
                                <InputLabel>Select Moment</InputLabel>
                                <Select
                                    value={selectedMomentId}
                                    label="Select Moment"
                                    onChange={(e) => setSelectedMomentId(e.target.value as number)}
                                >
                                    {availableMoments.map((moment) => (
                                        <MenuItem key={moment.id} value={moment.id}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {moment.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Duration: {formatDuration(moment.duration || 0)}
                                                    {moment.description && ` • ${moment.description}`}
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Alert severity="info">
                                <Typography variant="body2">
                                    Once attached, this music will be associated with the selected moment and will appear in the moment&apos;s details.
                                </Typography>
                            </Alert>
                        </>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={saving}>
                    Cancel
                </Button>
                <Button
                    onClick={handleAttach}
                    variant="contained"
                    disabled={saving || !selectedMomentId || availableMoments.length === 0}
                >
                    {saving ? 'Attaching...' : 'Attach Music'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AttachMusicToMomentDialog;
