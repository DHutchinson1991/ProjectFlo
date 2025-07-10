import { useState, useCallback } from "react";
import { TimelineTrack } from "../types/timelineTypes";
import { DatabaseLayer } from "../types/timelineTypes";

export const useTimelineData = () => {
    const [tracks, setTracks] = useState<TimelineTrack[]>([
        // Default tracks in new order: Graphics → Video → Audio → Music
        {
            id: 4, // Database layer ID for Graphics
            name: "Graphics",
            track_type: "graphics",
            height: 60,
            visible: true,
            muted: false,
            color: "#ff9800",
            order_index: 1,
        },
        {
            id: 1, // Database layer ID for Video
            name: "Video",
            track_type: "video",
            height: 60,
            visible: true,
            muted: false,
            color: "#2196f3",
            order_index: 2,
        },
        {
            id: 2, // Database layer ID for Audio
            name: "Audio",
            track_type: "audio",
            height: 60,
            visible: true,
            muted: false,
            color: "#4caf50",
            order_index: 3,
        },
        {
            id: 3, // Database layer ID for Music
            name: "Music",
            track_type: "music",
            height: 60,
            visible: true,
            muted: false,
            color: "#9c27b0",
            order_index: 4,
        },
    ]);

    // Load timeline layers from database on component mount
    const loadTimelineLayers = useCallback(async () => {
        try {
            const response = await fetch("http://localhost:3002/timeline/layers");
            if (response.ok) {
                const layers: DatabaseLayer[] = await response.json();

                // Map database layers to frontend tracks
                const mappedTracks: TimelineTrack[] = layers
                    .map((layer) => {
                        return {
                            id: layer.id,
                            name: layer.name,
                            track_type: layer.name.toLowerCase() as
                                | "video"
                                | "audio"
                                | "graphics"
                                | "music",
                            height: 60,
                            visible: layer.is_active,
                            muted: false,
                            color: layer.color_hex,
                            order_index: layer.order_index, // Use the database order_index directly
                        };
                    })
                    .sort((a, b) => a.order_index - b.order_index);

                if (mappedTracks.length > 0) {
                    setTracks(mappedTracks);
                    console.log("✅ Loaded timeline layers from database:", mappedTracks);
                } else {
                    console.log("⚠️ No layers returned from database, keeping defaults");
                }
            } else {
                console.error(
                    "❌ Failed to load timeline layers:",
                    response.statusText,
                );
            }
        } catch (error) {
            console.error("❌ Error loading timeline layers:", error);
            // Keep default tracks if loading fails
        }
    }, []);

    return {
        tracks,
        setTracks,
        loadTimelineLayers,
    };
};
