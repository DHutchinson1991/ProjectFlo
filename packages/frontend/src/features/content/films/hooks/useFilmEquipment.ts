import { useCallback, useRef } from "react";
import { apiClient } from "@/lib/api";
import { createFilmsApi } from "../api";
import type { ApiClient } from "@/lib/api/api-client.types";
import { transformBackendTrack } from "@/lib/utils/trackUtils";

const filmsApi = createFilmsApi(apiClient as unknown as ApiClient);
import type { TimelineTrack } from "@/lib/types/timeline";
import type { FilmTimelineTrack } from "@/lib/types/domains/equipment";

interface EquipmentSummary {
    tracks?: FilmTimelineTrack[];
}

export const useFilmEquipment = (
    filmId: number,
    onTracksUpdate: (tracks: TimelineTrack[]) => void,
    onTracksSave: (tracks: TimelineTrack[]) => void
) => {
    const regenerateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleEquipmentChange = useCallback(async (summary?: EquipmentSummary) => {
        if (summary?.tracks) {
            const newTracks = summary.tracks.map((t) => transformBackendTrack(t));
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
                const rawTracks = await filmsApi.tracks.generate(filmId, {
                    overwrite: true
                });
                const newTracks = rawTracks.map((t) => transformBackendTrack(t));
                
                onTracksUpdate(newTracks);
                onTracksSave(newTracks);
            } catch (error) {
                console.error("Failed to sync tracks:", error);
            }
        }, 300);
    }, [filmId, onTracksUpdate, onTracksSave]);

    return {
        handleEquipmentChange,
    };
};
