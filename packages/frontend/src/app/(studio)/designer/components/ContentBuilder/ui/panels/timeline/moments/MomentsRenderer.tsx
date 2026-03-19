"use client";

import React, { useState, useCallback } from "react";
import { Box, CircularProgress } from "@mui/material";
import SceneMomentsTrackModule from "../scenes/SceneMomentsTrack";
import type { TimelineSceneWithMoments } from "@/lib/types/domains/moments";

const { TimelineSceneWithMomentsBlock } = SceneMomentsTrackModule;

/**
 * MomentsTimelineRenderer
 * Renders scenes with nested moments for the timeline
 * Handles state management for expanded scenes and moment reordering
 */

interface MomentsTimelineRendererProps {
    scenes: TimelineSceneWithMoments[];
    loading?: boolean;
    onMomentReorder?: (filmId: number, momentId: number, newOrderIndex: number) => Promise<void>;
    filmId?: number;
    readOnly?: boolean;
}

const MomentsRenderer: React.FC<MomentsTimelineRendererProps> = ({
    scenes,
    loading = false,
    onMomentReorder,
    filmId,
    readOnly = false,
}) => {
    // State management
    const [expandedScenes, setExpandedScenes] = useState<{ [sceneId: number]: boolean }>(
        scenes.reduce((acc, scene) => ({ ...acc, [scene.id]: true }), {})
    );

    const [hoveredSceneId, setHoveredSceneId] = useState<number | null>(null);

    // Handlers
    const handleToggleSceneExpand = useCallback((sceneId: number) => {
        setExpandedScenes((prev) => ({
            ...prev,
            [sceneId]: !prev[sceneId],
        }));
    }, []);

    const handleMomentReorder = useCallback(
        async (sceneId: number, momentId: number, newOrderIndex: number) => {
            if (!onMomentReorder || !filmId) return;

            try {
                // Call the API to update the moment order
                await onMomentReorder(filmId, momentId, newOrderIndex);
            } catch (error) {
                console.error("Failed to reorder moment:", error);
            }
        },
        [filmId, onMomentReorder]
    );

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "400px",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!scenes || scenes.length === 0) {
        return (
            <Box
                sx={{
                    p: 2,
                    textAlign: "center",
                    color: "text.secondary",
                }}
            >
                No scenes with moments to display
            </Box>
        );
    }

    // Configuration
    const sceneStartTime = 0;
    const pixelsPerSecond = 2; // Adjust for desired timeline scale

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                width: "100%",
            }}
        >
            {scenes.map((scene) => (
                <TimelineSceneWithMomentsBlock
                    key={scene.id}
                    scene={scene}
                    sceneStartTime={sceneStartTime}
                    pixelsPerSecond={pixelsPerSecond}
                    isHovered={hoveredSceneId === scene.id}
                    onHover={(sceneId) => setHoveredSceneId(sceneId)}
                    onToggleExpand={() => handleToggleSceneExpand(scene.id)}
                    onMomentReorder={!readOnly ? handleMomentReorder : undefined}
                />
            ))}
        </Box>
    );
};

export default MomentsRenderer;
