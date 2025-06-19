import React, { useState } from 'react';
import {
    Paper,
    Typography,
    Box,
    Switch,
    FormControlLabel,
    IconButton,
    Collapse,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip
} from '@mui/material';
import {
    Palette as StyleIcon,
    Edit as EditIcon,
    MusicNote as MusicIcon,
    VideoLibrary as VideoIcon,
    Camera as PhotoIcon
} from '@mui/icons-material';
import { DeliverableTemplate } from '../../../_shared/types';
import { deliverableAPI } from '../../../_shared/api';

interface StyleManagementSectionProps {
    deliverable: DeliverableTemplate;
    onDeliverableUpdated: (updatedDeliverable: DeliverableTemplate) => void;
}

export default function StyleManagementSection({
    deliverable,
    onDeliverableUpdated
}: StyleManagementSectionProps) {
    const [isEditingMusic, setIsEditingMusic] = useState(false);
    const [isEditingStyle, setIsEditingStyle] = useState(false);
    const [updating, setUpdating] = useState(false);

    const handleMusicToggle = async (includesMusic: boolean) => {
        try {
            setUpdating(true);
            const updatedDeliverable = await deliverableAPI.update(deliverable.id, {
                includes_music: includesMusic
            });
            onDeliverableUpdated(updatedDeliverable);
        } catch (error) {
            console.error('Failed to update music setting:', error);
        } finally {
            setUpdating(false);
        }
    };

    const handleMusicTypeChange = async (musicType: string) => {
        try {
            setUpdating(true);
            // For now, just store the music type selection locally
            // This would need backend support for default_music_type in the update DTO
            console.log('Music type selected:', musicType);
            setIsEditingMusic(false);
        } catch (error) {
            console.error('Failed to update music type:', error);
        } finally {
            setUpdating(false);
        }
    };

    const handleStyleChange = async (styleType: string) => {
        try {
            setUpdating(true);
            // For now, we'll handle this as a general style setting
            // This can be expanded based on backend schema
            const updatedDeliverable = await deliverableAPI.update(deliverable.id, {
                // Add style-related field here when available in backend
                name: deliverable.name // keeping other fields unchanged for now
            });
            console.log('Style type selected:', styleType);
            onDeliverableUpdated(updatedDeliverable);
            setIsEditingStyle(false);
        } catch (error) {
            console.error('Failed to update style:', error);
        } finally {
            setUpdating(false);
        }
    };

    const musicTypes = [
        { value: 'ROMANTIC', label: 'Romantic', icon: '💕' },
        { value: 'UPBEAT', label: 'Upbeat', icon: '🎵' },
        { value: 'CINEMATIC', label: 'Cinematic', icon: '🎬' },
        { value: 'ACOUSTIC', label: 'Acoustic', icon: '🎸' },
        { value: 'CLASSICAL', label: 'Classical', icon: '🎼' },
        { value: 'CUSTOM', label: 'Custom', icon: '🎧' }
    ];

    const styleTypes = [
        { value: 'DOCUMENTARY', label: 'Documentary', icon: <VideoIcon />, color: '#2196F3' },
        { value: 'CINEMATIC', label: 'Cinematic', icon: <PhotoIcon />, color: '#9C27B0' },
        { value: 'LIFESTYLE', label: 'Lifestyle', icon: <StyleIcon />, color: '#FF9800' },
        { value: 'TRADITIONAL', label: 'Traditional', icon: <VideoIcon />, color: '#4CAF50' },
        { value: 'MODERN', label: 'Modern', icon: <StyleIcon />, color: '#F44336' },
        { value: 'ARTISTIC', label: 'Artistic', icon: <PhotoIcon />, color: '#673AB7' }
    ];

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <StyleIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                    Style Management
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Visual Style Section */}
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                            Visual Style
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => setIsEditingStyle(true)}
                            disabled={updating}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    <Collapse in={isEditingStyle}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {styleTypes.map((style) => (
                                <Chip
                                    key={style.value}
                                    icon={style.icon}
                                    label={style.label}
                                    onClick={() => handleStyleChange(style.value)}
                                    sx={{
                                        bgcolor: style.color + '20',
                                        borderColor: style.color,
                                        color: style.color,
                                        '&:hover': { bgcolor: style.color + '30' }
                                    }}
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    </Collapse>
                </Box>

                {/* Music Section */}
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={deliverable.includes_music || false}
                                    onChange={(e) => handleMusicToggle(e.target.checked)}
                                    disabled={updating}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MusicIcon />
                                    <Typography variant="subtitle1" fontWeight="medium">
                                        Include Music
                                    </Typography>
                                </Box>
                            }
                        />
                    </Box>

                    {deliverable.includes_music && (
                        <Box sx={{ ml: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Music Type: {deliverable.default_music_type || 'Not specified'}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => setIsEditingMusic(true)}
                                    disabled={updating}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Box>

                            <Collapse in={isEditingMusic}>
                                <FormControl size="small" sx={{ minWidth: 200, mb: 2 }}>
                                    <InputLabel>Music Type</InputLabel>
                                    <Select
                                        value={deliverable.default_music_type || ''}
                                        onChange={(e) => handleMusicTypeChange(e.target.value)}
                                        label="Music Type"
                                        disabled={updating}
                                    >
                                        {musicTypes.map((type) => (
                                            <MenuItem key={type.value} value={type.value}>
                                                {type.icon} {type.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Collapse>
                        </Box>
                    )}
                </Box>
            </Box>
        </Paper>
    );
}
