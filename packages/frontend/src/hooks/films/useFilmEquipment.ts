import { useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { transformBackendTrack } from "@/lib/utils/trackUtils";

/**
 * Hook to manage film equipment changes and track regeneration
 */
export const useFilmEquipment = (
    filmId: number,
    onTracksUpdate: (tracks: any[]) => void,
    onTracksSave: (tracks: any[]) => void
) => {
    const regenerateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleEquipmentChange = useCallback(async (summary?: any) => {
        // If summary contains tracks, we can use them immediately
        if (summary?.tracks) {
            console.log('🚀 Updating tracks immediately from summary...');
            const newTracks = summary.tracks.map((t: any) => transformBackendTrack(t));
            onTracksUpdate(newTracks);
            onTracksSave(newTracks);
            return;
        }

        // Otherwise, fall back to debounced regeneration
        // Clear existing timeout to debounce rapid calls
        if (regenerateTimeoutRef.current) {
            clearTimeout(regenerateTimeoutRef.current);
        }

        // We'll keep a small debounce (300ms) for UI smoothness
        regenerateTimeoutRef.current = setTimeout(async () => {
            try {
                console.log('🔄 Syncing tracks after equipment change...');
                const rawTracks = await api.films.tracks.generate(filmId, {
                    overwrite: true
                });
                
                // Transform raw tracks to TimelineTrack format
                const newTracks = rawTracks.map((t: any) => transformBackendTrack(t));
                
                onTracksUpdate(newTracks);
                onTracksSave(newTracks);
                console.log('✅ Sync completed');
            } catch (error) {
                console.error("Failed to sync tracks:", error);
            }
        }, 300);
    }, [filmId, onTracksUpdate, onTracksSave]);

    return {
        handleEquipmentChange,
    };
};
