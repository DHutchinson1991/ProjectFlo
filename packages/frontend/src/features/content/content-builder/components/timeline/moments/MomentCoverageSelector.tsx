"use client";

import React from "react";
import { 
    Grid, 
    Typography, 
    FormControlLabel, 
    Checkbox, 
    FormGroup, 
    Box, 
    Divider 
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { TimelineTrack } from "@/features/content/content-builder/types/timeline";
import { getDefaultTrackColor } from "../../../utils/colorUtils";

interface MomentCoverageSelectorProps {
    allTracks: TimelineTrack[];
    coverage: Record<string, boolean>;
    onChange: (type: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;
    readOnly?: boolean;
}

export const MomentCoverageSelector: React.FC<MomentCoverageSelectorProps> = ({
    allTracks,
    coverage,
    onChange,
    readOnly
}) => {
    // 1. FALLBACK: If no tracks provided, show generic types
    if (allTracks.length === 0) {
        const basicTypes = [
            { id: 'VIDEO', label: 'Video', color: getDefaultTrackColor('VIDEO') },
            { id: 'AUDIO', label: 'Audio', color: getDefaultTrackColor('AUDIO') },
            { id: 'GRAPHICS', label: 'Graphics', color: getDefaultTrackColor('GRAPHICS') },
            { id: 'MUSIC', label: 'Music', color: getDefaultTrackColor('MUSIC') },
        ];

        return (
            <FormGroup>
                {basicTypes.map(type => (
                    <FormControlLabel
                        key={type.id}
                        control={
                            <Checkbox 
                                checked={!!coverage[type.id]} 
                                onChange={onChange(type.id)}
                                disabled={readOnly}
                                sx={{ 
                                    color: 'rgba(255,255,255,0.3)',
                                    '&.Mui-checked': { color: type.color } 
                                }}
                            />
                        }
                        label={
                            <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                                {type.label}
                            </Typography>
                        }
                    />
                ))}
            </FormGroup>
        );
    }

    // 2. GROUPING LOGIC: Group tracks by type
    const groupedTracks = allTracks.reduce((acc, track) => {
        const type = track.track_type || 'OTHER';
        if (!acc[type]) acc[type] = [];
        acc[type].push(track);
        return acc;
    }, {} as Record<string, TimelineTrack[]>);

    // Sort keys based on standard order
    const typeOrder = ['VIDEO', 'AUDIO', 'GRAPHICS', 'MUSIC', 'LIGHTING'];
    const sortedTypes = Object.keys(groupedTracks).sort((a, b) => {
        const idxA = typeOrder.indexOf(a);
        const idxB = typeOrder.indexOf(b);
        if (idxA === -1 && idxB === -1) return a.localeCompare(b);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });

    return (
        <Grid container spacing={2}>
            {sortedTypes.map(type => {
                const tracks = groupedTracks[type];
                const trackColor = getDefaultTrackColor(type);
                
                return (
                    <Grid item xs={12} sm={6} key={type}>
                        <Box sx={{ mb: 1 }}>
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    color: alpha(trackColor, 0.9), 
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    display: 'block',
                                    mb: 0.5,
                                    borderBottom: `1px solid ${alpha(trackColor, 0.3)}`
                                }}
                            >
                                {type}
                            </Typography>
                            <FormGroup>
                                {tracks.map(track => (
                                    <FormControlLabel
                                        key={track.id}
                                        control={
                                            <Checkbox
                                                checked={!!coverage[track.name]}
                                                onChange={onChange(track.name)}
                                                disabled={readOnly}
                                                size="small"
                                                sx={{
                                                    color: 'rgba(255,255,255,0.3)',
                                                    '&.Mui-checked': { color: trackColor },
                                                    py: 0.5
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem' }}>
                                                {track.name}
                                            </Typography>
                                        }
                                        sx={{ 
                                            ml: 0, 
                                            mr: 1,
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }
                                        }}
                                    />
                                ))}
                            </FormGroup>
                        </Box>
                    </Grid>
                );
            })}
        </Grid>
    );
};
