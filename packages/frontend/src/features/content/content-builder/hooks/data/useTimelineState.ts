import { useState, useEffect } from "react";
import { TimelineScene, TimelineTrack } from '@/features/content/content-builder/types/timeline';
import { getDefaultTrackColor } from "../../utils/colorUtils";

/**
 * Hook for initializing and managing ContentBuilder's timeline state
 * Handles:
 * - Scenes state initialization
 * - Tracks state initialization
 * - UI visibility flags
 */
export const useTimelineState = (
    initialScenes: TimelineScene[] = [],
    initialTracks: TimelineTrack[] = []
) => {
    // Local state for scenes
    const [scenes, setScenes] = useState<TimelineScene[]>(initialScenes);
    
    // UI State
    const [showLibrary, setShowLibrary] = useState(false);
    const [showCreateSceneDialog, setShowCreateSceneDialog] = useState(false);

    // Track state - use initialTracks if provided, otherwise use defaults
    const [tracks, setTracks] = useState<TimelineTrack[]>(
        initialTracks.length > 0 ? initialTracks : [
            // Default tracks (only used if no initialTracks provided)
            {
                id: 4,
                name: "Graphics",
                track_type: "graphics",
                height: 60,
                visible: true,
                muted: false,
                color: getDefaultTrackColor("graphics"),
                order_index: 1,
            },
            {
                id: 1,
                name: "Video",
                track_type: "video",
                height: 60,
                visible: true,
                muted: false,
                color: getDefaultTrackColor("video"),
                order_index: 2,
            },
            {
                id: 2,
                name: "Audio",
                track_type: "audio",
                height: 60,
                visible: true,
                muted: false,
                color: getDefaultTrackColor("audio"),
                order_index: 3,
            },
            {
                id: 3,
                name: "Music",
                track_type: "music",
                height: 60,
                visible: true,
                muted: false,
                color: getDefaultTrackColor("music"),
                order_index: 4,
            },
        ]
    );

    // Update tracks when initialTracks changes
    useEffect(() => {
        if (initialTracks && initialTracks.length > 0) {
            setTracks(initialTracks);
        }
    }, [initialTracks]);

    // Update scenes when initialScenes change
    useEffect(() => {
        if (initialScenes && initialScenes.length >= 0) {
            setScenes(initialScenes);
        }
    }, [initialScenes]);

    return {
        scenes,
        setScenes,
        tracks,
        setTracks,
        showLibrary,
        setShowLibrary,
        showCreateSceneDialog,
        setShowCreateSceneDialog,
    };
};
