import React from 'react';
import { PlaybackScreenProps } from '../types';
import { usePlaybackScreen } from '../hooks';
import { Box, Typography } from '@mui/material';

/**
 * PlaybackScreen Component
 * 
 * Simple display showing what's currently playing in each layer:
 * - Video Layer
 * - Audio Layer  
 * - Music Layer
 */
export const PlaybackScreen: React.FC<PlaybackScreenProps> = ({
    currentScene = null,
    totalDuration,
    currentTime,
    className = '',
    tracks = []
}) => {
    const { playbackData, isEmpty } = usePlaybackScreen({
        currentTimelineScene: currentScene,
        currentTime,
        duration: totalDuration,
        isPlaying: false,
        tracks
    });

    // Group media by media type (since track_id is not available in the data)
    const getMediaByType = (mediaType: string) => {
        if (!playbackData?.mediaDetails) return [];
        return playbackData.mediaDetails.filter(media =>
            media.mediaType?.toLowerCase() === mediaType.toLowerCase()
        );
    };

    const videoMedia = getMediaByType('video');
    const audioMedia = getMediaByType('audio');
    const musicMedia = getMediaByType('music');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getLayerText = (mediaList: any[], layerName: string) => {
        if (mediaList.length === 0) {
            return `${layerName}: Nothing playing`;
        }

        // If we have media components, show the scene name
        if (mediaList.length > 0) {
            return `${layerName}: ${currentScene?.name || 'Unknown Scene'}`;
        }

        // Fallback
        return `${layerName}: ${mediaList[0].mediaType} Component`;
    };

    return (
        <Box
            className={className}
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#000',
                color: '#fff',
                padding: 2,
                textAlign: 'center'
            }}
        >
            {isEmpty ? (
                <Typography
                    variant="h6"
                    sx={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontWeight: 400
                    }}
                >
                    No scene at this time
                </Typography>
            ) : (
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    width: '100%',
                    maxWidth: 400
                }}>
                    {/* Video Layer */}
                    <Typography
                        variant="body1"
                        sx={{
                            color: videoMedia.length > 0 ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                            fontWeight: videoMedia.length > 0 ? 500 : 400,
                            fontSize: '16px'
                        }}
                    >
                        {getLayerText(videoMedia, 'Video')}
                    </Typography>

                    {/* Audio Layer */}
                    <Typography
                        variant="body1"
                        sx={{
                            color: audioMedia.length > 0 ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                            fontWeight: audioMedia.length > 0 ? 500 : 400,
                            fontSize: '16px'
                        }}
                    >
                        {getLayerText(audioMedia, 'Audio')}
                    </Typography>

                    {/* Music Layer */}
                    <Typography
                        variant="body1"
                        sx={{
                            color: musicMedia.length > 0 ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                            fontWeight: musicMedia.length > 0 ? 500 : 400,
                            fontSize: '16px'
                        }}
                    >
                        {getLayerText(musicMedia, 'Music')}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};
