import { useCallback } from "react";
import type { TimelineScene } from "@/features/content/content-builder/types/timeline";
import { sortTracksForTimeline, normalizeTracksForTimeline } from "@/features/content/content-builder/utils/trackSortingUtils";

interface TimelineState {
    scenes: TimelineScene[];
    tracks: any[];
    version: string;
    saved_at: string;
}

/**
 * Hook to manage timeline state persistence in localStorage/sessionStorage
 */
export const useTimelineStorage = (filmId: string | number) => {
    const timelineKey = `film_${filmId}_timeline`;
    const tracksKey = `film_${filmId}_tracks`;

    /**
     * Save timeline state to localStorage
     */
    const saveTimeline = useCallback((scenes: TimelineScene[], tracks?: any[]) => {
        const timelineState: TimelineState = {
            scenes,
            tracks: tracks || [],
            version: '3.0',
            saved_at: new Date().toISOString()
        };
        
        localStorage.setItem(timelineKey, JSON.stringify(timelineState));
        console.log("✅ Timeline state saved to localStorage");
    }, [timelineKey]);

    /**
     * Load timeline state from localStorage
     */
    const loadTimeline = useCallback((): TimelineState | null => {
        try {
            const stored = localStorage.getItem(timelineKey);
            if (!stored) return null;
            
            const parsed = JSON.parse(stored);
            console.log("📂 Loaded timeline state from localStorage");
            return parsed;
        } catch (err) {
            console.error("Failed to load timeline from localStorage:", err);
            return null;
        }
    }, [timelineKey]);

    /**
     * Save tracks to sessionStorage (normalized for ContentBuilder)
     */
    const saveTracks = useCallback((tracks: any[]) => {
        const normalized = normalizeTracksForTimeline(tracks);
        const sorted = sortTracksForTimeline(normalized);
        
        sessionStorage.setItem(tracksKey, JSON.stringify(sorted));
        console.log("✅ Tracks saved to sessionStorage:", sorted.length);
        return sorted;
    }, [tracksKey]);

    /**
     * Load tracks from sessionStorage
     */
    const loadTracks = useCallback((): any[] | null => {
        try {
            const stored = sessionStorage.getItem(tracksKey);
            if (!stored) return null;
            
            const parsed = JSON.parse(stored);
            console.log("📂 Loaded tracks from sessionStorage:", parsed.length);
            return parsed;
        } catch (err) {
            console.error("Failed to load tracks from sessionStorage:", err);
            return null;
        }
    }, [tracksKey]);

    /**
     * Clear all stored timeline data
     */
    const clearAll = useCallback(() => {
        localStorage.removeItem(timelineKey);
        sessionStorage.removeItem(tracksKey);
        console.log("🗑️ Cleared timeline storage");
    }, [timelineKey, tracksKey]);

    return {
        saveTimeline,
        loadTimeline,
        saveTracks,
        loadTracks,
        clearAll,
    };
};
