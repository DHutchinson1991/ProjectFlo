import { useMemo } from "react";
import { TimelineScene, PlaybackState } from '@/lib/types/timeline';

/**
 * Hook for calculating current active scene(s) from playback state
 * Handles:
 * - Finding all scenes active at current time
 * - Creating composite scenes for multi-track playback (video + audio + music)
 * - Creating proper media_components structure
 */
export const useCurrentScene = (scenes: TimelineScene[], currentTime: number) => {
    const currentScene = useMemo(() => {
        // Find all scenes that overlap with the current time
        const activeScenesAtTime = scenes.filter(scene =>
            currentTime >= scene.start_time &&
            currentTime <= scene.start_time + scene.duration
        );

        if (activeScenesAtTime.length === 0) return null;

        // If multiple scenes are active (grouped scenes), create a composite scene
        if (activeScenesAtTime.length > 1) {
            // Find the primary scene (usually VIDEO)
            const primaryScene = activeScenesAtTime.find(s => s.scene_type === 'video') || activeScenesAtTime[0];

            // Create mock media components for all active scene types
            const mockMediaComponents = activeScenesAtTime.map(scene => {
                // Map scene_type to MediaType - handle graphics as video for compatibility
                let mediaType: 'VIDEO' | 'AUDIO' | 'MUSIC';
                switch (scene.scene_type) {
                    case 'audio':
                        mediaType = 'AUDIO';
                        break;
                    case 'music':
                        mediaType = 'MUSIC';
                        break;
                    case 'video':
                    case 'graphics':
                    default:
                        mediaType = 'VIDEO';
                        break;
                }

                return {
                    id: scene.id,
                    media_type: mediaType,
                    track_id: scene.track_id,
                    start_time: scene.start_time,
                    duration: scene.duration,
                    is_primary: scene.scene_type === 'video',
                    music_type: undefined,
                    notes: undefined,
                    scene_component_id: scene.id
                };
            });

            // Return the primary scene but with all media components from active scenes
            return {
                ...primaryScene,
                name: primaryScene.name.replace(/ - (VIDEO|AUDIO|MUSIC|GRAPHICS)$/, ''), // Clean up name
                media_components: mockMediaComponents
            };
        }

        // Single scene - return as is, but convert it to have proper media_components
        const singleScene = activeScenesAtTime[0];

        // If the scene doesn't have media_components, create one based on its scene_type
        if (!singleScene.media_components || singleScene.media_components.length === 0) {
            let mediaType: 'VIDEO' | 'AUDIO' | 'MUSIC';
            switch (singleScene.scene_type) {
                case 'audio':
                    mediaType = 'AUDIO';
                    break;
                case 'music':
                    mediaType = 'MUSIC';
                    break;
                case 'video':
                case 'graphics':
                default:
                    mediaType = 'VIDEO';
                    break;
            }

            return {
                ...singleScene,
                media_components: [{
                    id: singleScene.id,
                    media_type: mediaType,
                    track_id: singleScene.track_id,
                    start_time: singleScene.start_time,
                    duration: singleScene.duration,
                    is_primary: true,
                    music_type: undefined,
                    notes: undefined,
                    scene_component_id: singleScene.id
                }]
            };
        }

        return singleScene;
    }, [scenes, currentTime]);

    const activeScenesAtTime = useMemo(() => {
        return scenes.filter(scene =>
            currentTime >= scene.start_time &&
            currentTime <= scene.start_time + scene.duration
        );
    }, [scenes, currentTime]);

    return {
        currentScene,
        activeScenesAtTime,
    };
};
