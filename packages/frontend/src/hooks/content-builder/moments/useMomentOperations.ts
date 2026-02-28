import { useCallback } from 'react';
import { momentsApi } from "@/lib/api/moments";
import { TimelineScene } from '@/lib/types/timeline';

/**
 * Hook to handle moment operations like save, delete, remove coverage
 */
export const useMomentOperations = (
    scene: TimelineScene, 
    moments: any[],
    onClosePopover: () => void,
    onMomentsUpdate?: (updatedMoments: any[]) => void
) => {
    
    // Save Moment Logic
    const handleSaveMoment = useCallback(async (updatedMoment: any) => {
        if (!updatedMoment.id) return;

        // 1. Optimistic Update (Local)
        const oldMoment = moments.find((m: any) => m.id === updatedMoment.id);
        const updatedMoments = moments.map((m: any) => {
            if (m.id === updatedMoment.id) {
                const recordingSetup = updatedMoment.recording_setup ?? m.recording_setup;
                const hasRecordingSetup = typeof updatedMoment.has_recording_setup !== 'undefined'
                    ? updatedMoment.has_recording_setup
                    : (typeof m.has_recording_setup !== 'undefined'
                        ? m.has_recording_setup
                        : !!recordingSetup);
                return {
                    ...m,
                    ...updatedMoment,
                    recording_setup: recordingSetup,
                    has_recording_setup: hasRecordingSetup,
                };
            }
            return m;
        });
        
        // Update via callback if provided (propagates to global scenes state)
        if (onMomentsUpdate) {
            onMomentsUpdate(updatedMoments);
        } else {
            // Fallback: mutate scene object directly
            (scene as any).moments = updatedMoments;
        }
        
        onClosePopover(); // Close UI immediately

        console.debug("[useMomentOperations] Saved moment", {
            momentId: updatedMoment.id,
            sceneId: scene.id,
        });

        // 2. Sync to Backend
        if (oldMoment && (updatedMoment.name !== oldMoment.name || updatedMoment.duration !== oldMoment.duration)) {
            try {
                await momentsApi.updateSceneMoment(scene.id, updatedMoment.id, {
                    name: updatedMoment.name,
                    duration: updatedMoment.duration
                });
            } catch (error) {
                console.error("Failed to update moment details", error);
            }
        }
    }, [scene, moments, onClosePopover, onMomentsUpdate]);

    return { handleSaveMoment };

};
