import { useMemo } from 'react';
import { TimelineScene, PlaybackScreenState, PlaybackScreenData } from '../types';
import { TimelineTrack } from '../types/timelineTypes';
import { formatDuration } from '../utils';

interface UsePlaybackScreenProps {
    currentTimelineScene: TimelineScene | null;
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    tracks?: TimelineTrack[]; // Add tracks to get track names
}

/**
 * Custom hook for managing PlaybackScreen state and data
 * Provides formatted scene information for display
 */
export const usePlaybackScreen = ({
    currentTimelineScene,
    currentTime,
    duration,
    isPlaying,
    tracks = []
}: UsePlaybackScreenProps): PlaybackScreenState => {
    const playbackData: PlaybackScreenData | null = useMemo(() => {
        if (!currentTimelineScene) return null;

        // Get all media components from the current scene
        const allMediaComponents = currentTimelineScene.media_components || [];

        const mediaCount = allMediaComponents.length;
        const mediaTypes = allMediaComponents
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((comp: any) => comp.media_type) // Use any since the structure varies
            .filter(Boolean) as string[];
        const uniqueMediaTypes = [...new Set(mediaTypes)];

        // Use the current scene for basic scene info
        // Use currentTimelineScene instead of reassigning to sceneName

        // Calculate timing for this scene
        const sceneStart = currentTimelineScene.start_time;
        const sceneEnd = currentTimelineScene.start_time + currentTimelineScene.duration;
        const sceneDuration = currentTimelineScene.duration;

        const progress = sceneDuration > 0
            ? Math.max(0, Math.min(100, ((currentTime - sceneStart) / sceneDuration) * 100))
            : 0;

        return {
            // Scene identity
            sceneName: currentTimelineScene.name,
            sceneId: currentTimelineScene.id,
            sceneDescription: currentTimelineScene.description || '',

            // Media information - from all media components in this scene
            mediaCount,
            mediaTypes: uniqueMediaTypes,
            mediaDetails: allMediaComponents.map((comp: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                // The current data structure doesn't have track_id, so we'll map by media_type
                const track = tracks.find(t => t.name.toLowerCase() === comp.media_type?.toLowerCase());

                const mediaDetail = {
                    id: comp.id,
                    mediaType: comp.media_type,
                    fileName: '', // Timeline components don't have filenames
                    duration: comp.duration_seconds || comp.duration || 0,
                    trackName: track?.name,
                    trackType: track?.track_type,
                    isPrimary: comp.is_primary
                };

                return mediaDetail;
            }),

            // Timing information - use scene timing
            sceneStartTime: sceneStart,
            sceneEndTime: sceneEnd,
            sceneDuration: sceneDuration,
            currentTime,
            progress,

            // Status
            isActive: true, // If we have a scene, it's active
            isPlaying,

            // Formatted strings
            formattedStartTime: formatDuration(sceneStart),
            formattedEndTime: formatDuration(sceneEnd),
            formattedDuration: formatDuration(sceneDuration),
            formattedCurrentTime: formatDuration(currentTime),
            formattedProgress: `${Math.round(progress)}%`
        };
    }, [currentTimelineScene, currentTime, duration, isPlaying, tracks]);

    return {
        playbackData,
        hasActiveScene: playbackData?.isActive || false,
        isEmpty: !playbackData
    };
};
