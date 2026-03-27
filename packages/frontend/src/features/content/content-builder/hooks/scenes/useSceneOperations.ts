import { useCallback } from "react";
import { TimelineScene, TimelineTrack } from '@/features/content/content-builder/types/timeline';
import { calculateTimelineDuration } from "@/features/content/content-builder/utils/timelineUtils";
import { createTimelineScenesFromLibraryScene } from "../../utils/dragDropUtils";
import { filmsApi } from "@/features/content/films/api";

/**
 * Hook for managing scene operations
 * Handles:
 * - Adding scenes from library to timeline
 * - Reordering scenes with magnetic timeline logic
 * - Deleting scenes and scene groups
 * - Calculating scene repositioning
 */
export const useSceneOperations = ({
    scenes,
    setScenes,
    tracks,
    setTracks,
    onTimelineUpdated,
    onSave,
}: {
    scenes: TimelineScene[];
    setScenes: (scenes: TimelineScene[] | ((prev: TimelineScene[]) => TimelineScene[])) => void;
    tracks: TimelineTrack[];
    setTracks: (tracks: TimelineTrack[] | ((prev: TimelineTrack[]) => TimelineTrack[])) => void;
    onTimelineUpdated?: (totalDuration: number) => void;
    onSave?: (scenes: TimelineScene[]) => Promise<void>;
}) => {
    // Handle scene deletion
    const handleSceneDelete = useCallback((sceneToDelete: TimelineScene) => {
        setScenes(prev => prev.filter(scene => scene.id !== sceneToDelete.id));
    }, [setScenes]);

    // Handle scene reordering
    const handleReorderScene = useCallback((direction: 'left' | 'right', sceneName: string) => {
        let reorderPayload: Array<{ id: number; order_index: number }> = [];
        let filmId: number | undefined;

        setScenes(prev => {
            // 1. Group all scenes by name to identify "Scene Groups"
            const groups: Map<string, { name: string, startTime: number, duration: number, scenes: TimelineScene[] }> = new Map();
            
            prev.forEach(scene => {
                const name = scene.name;
                const existing = groups.get(name);
                if (existing) {
                    existing.scenes.push(scene);
                    const sceneEnd = scene.start_time + scene.duration;
                    existing.startTime = Math.min(existing.startTime, scene.start_time);
                    existing.duration = Math.max(existing.startTime + existing.duration, sceneEnd) - existing.startTime;
                } else {
                    groups.set(name, {
                        name,
                        startTime: scene.start_time,
                        duration: scene.duration,
                        scenes: [scene]
                    });
                }
            });

            // 2. Convert to array and sort by start time
            const sortedGroups = Array.from(groups.values()).sort((a, b) => a.startTime - b.startTime);
            
            // 3. Find index of target group
            const currentIndex = sortedGroups.findIndex(g => g.name === sceneName);
            if (currentIndex === -1) return prev;

            // 4. Determine swap target
            const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
            
            // Boundary checks
            if (targetIndex < 0 || targetIndex >= sortedGroups.length) return prev;

            // 5. Swap groups in the array
            const temp = sortedGroups[currentIndex];
            sortedGroups[currentIndex] = sortedGroups[targetIndex];
            sortedGroups[targetIndex] = temp;

            // 6. Recalculate start times sequentially (Magnetic Timeline Logic)
            let currentCursor = 0;
            const updatedScenes: TimelineScene[] = [];

            reorderPayload = [];
            filmId = prev.find((scene) => typeof scene.film_id === "number")?.film_id;

            sortedGroups.forEach((group, groupOrderIndex) => {
                // Calculate max duration of this group to know how much to shift cursor
                let groupMaxDuration = 0;
                
                group.scenes.forEach(scene => {
                    const relativeOffset = scene.start_time - group.startTime; // Keep relative position within group? 
                    // Actually, for "Moments" timelines, usually all tracks start at the group start time.
                    // But if they are staggered, we should preserve that stagger relative to the new start.
                    
                    const newStart = currentCursor + (scene.start_time - group.startTime);
                    
                    updatedScenes.push({
                        ...scene,
                        start_time: newStart,
                        order_index: groupOrderIndex,
                    });

                    if (typeof scene.id === "number") {
                        reorderPayload.push({ id: scene.id, order_index: groupOrderIndex });
                    }

                    // Update group max duration based on this scene
                    const sceneEnd = newStart + scene.duration;
                    groupMaxDuration = Math.max(groupMaxDuration, sceneEnd - currentCursor);
                });

                // Move cursor to end of this group
                currentCursor += groupMaxDuration;
            });

            return updatedScenes;
        });

        if (filmId && reorderPayload.length > 0) {
            filmsApi.localScenes.reorder(filmId, reorderPayload).catch((error) => {
                console.warn("⚠️ [SCENE-OPS] Failed to sync scene order:", error);
            });
        }
    }, [setScenes]);

    // Handle scene group deletion by name
    const handleDeleteSceneGroup = useCallback((sceneName: string) => {
        setScenes(prev => prev.filter(scene => scene.name !== sceneName));
    }, [setScenes]);

    // Handle scene selection from library - add to timeline and close modal
    const handleSceneFromLibrary = useCallback(async (libraryScene: any) => {
        console.log(`📋 [SCENE-OPS] Starting library scene addition:`, libraryScene.name);
        const preferredStartTime = calculateTimelineDuration(scenes);
        console.log(`📋 [SCENE-OPS] Preferred start time from current timeline: ${preferredStartTime}s`);
        console.log(`📋 [SCENE-OPS] Current scenes count: ${scenes.length}, Current tracks count: ${tracks.length}`);

        const result = createTimelineScenesFromLibraryScene(
            libraryScene,
            tracks,
            preferredStartTime,
            scenes
        );

        console.log(`📋 [SCENE-OPS] Import result:`, {
            scenesCreated: result.scenes.length,
            tracksCreated: result.newTracks.length,
            sceneDetails: result.scenes.map(s => ({
                id: s.id,
                name: s.name,
                trackId: s.track_id,
                startTime: s.start_time,
                duration: s.duration,
                type: s.scene_type
            }))
        });

        // Batch updates to minimize re-renders
        // Update tracks and scenes in sequence without intermediate renders
        if (result.newTracks.length > 0) {
            console.log(`📋 [SCENE-OPS] Adding ${result.newTracks.length} new tracks`);
            setTracks(prev => [...prev, ...result.newTracks]);
        }

        let updatedScenes: TimelineScene[] = [];
        if (result.scenes.length > 0) {
            console.log(`📋 [SCENE-OPS] Adding ${result.scenes.length} new scenes to state`);
            setScenes(prev => {
                updatedScenes = [...prev, ...result.scenes];
                console.log(`📋 [SCENE-OPS] Total scenes after update: ${updatedScenes.length}`);
                
                return updatedScenes;
            });

            // Auto-save the timeline after adding scene from library
            // This ensures beats/moments can be edited immediately
            if (onSave && updatedScenes.length > 0) {
                console.log(`📋 [SCENE-OPS] Auto-saving timeline after adding scene from library...`);
                try {
                    await onSave(updatedScenes);
                    console.log(`✅ [SCENE-OPS] Timeline auto-saved successfully`);
                } catch (error) {
                    console.error(`❌ [SCENE-OPS] Failed to auto-save timeline:`, error);
                }
            }
        }
    }, [scenes, tracks, setTracks, setScenes, onTimelineUpdated, onSave]);

    return {
        handleSceneDelete,
        handleReorderScene,
        handleDeleteSceneGroup,
        handleSceneFromLibrary,
    };
};
