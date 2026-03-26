"use client";

import React from "react";
import { Box } from "@mui/material";
import { ScenesLibrary } from "@/features/content/scenes/types";
import SceneCard from "./SceneCard";

interface ScenesGridProps {
    scenes: ScenesLibrary[];
    selectedSceneId?: number;
    onSceneSelect?: (scene: ScenesLibrary) => void;
    readOnly?: boolean;
    showDelete?: boolean;
    onSceneDelete?: (scene: ScenesLibrary) => void;
}

const ScenesGrid: React.FC<ScenesGridProps> = ({
    scenes,
    selectedSceneId,
    onSceneSelect,
    readOnly = false,
    showDelete = false,
    onSceneDelete,
}) => {
    return (
        <Box
            sx={{
                height: "100%",
                overflowY: "auto", // Only allow vertical scroll
                overflowX: "hidden", // Explicitly prevent horizontal scroll
                position: "relative", // Establish positioning context
                // Additional stabilization
                left: 0,
                right: 0,
                transform: "none",
                // Prevent text selection during drag
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
                "&::-webkit-scrollbar": {
                    width: 6,
                },
                "&::-webkit-scrollbar-track": {
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 3,
                },
                "&::-webkit-scrollbar-thumb": {
                    background: "rgba(255, 255, 255, 0.2)",
                    borderRadius: 3,
                    "&:hover": {
                        background: "rgba(255, 255, 255, 0.3)",
                    },
                },
            }}
        >
            {/* Replace Grid with simple flex container */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    width: "100%",
                    padding: 0,
                    margin: 0,
                    position: "static",
                    transform: "none",
                    // Lock the container completely during any drag operations
                    isolation: "isolate", // Create a new stacking context
                    containment: "layout style", // Prevent layout from affecting other elements
                    // Prevent any layout shifts during drag operations
                    "& > *": {
                        flexShrink: 0, // Prevent items from shrinking
                        width: "100%",
                        maxWidth: "100%",
                        // Ensure each item maintains its space even when dragged
                        minHeight: "fit-content",
                        position: "relative",
                    }
                }}
            >
                {scenes.map((scene) => (
                    <Box
                        key={scene.id}
                        sx={{
                            width: "100%",
                            position: "static",
                            transform: "none",
                            minHeight: "120px", // Set a minimum height to maintain space
                            height: "auto",
                            // Create a stable container that doesn't collapse when content is dragged
                            display: "flex",
                            flexDirection: "column",
                            // Ensure this container always maintains its space
                            isolation: "isolate",
                            containment: "layout",
                        }}
                    >
                        <SceneCard
                            scene={scene}
                            isSelected={selectedSceneId === scene.id}
                            onClick={() => onSceneSelect?.(scene)}
                            readOnly={readOnly}
                            showDelete={showDelete}
                            onDelete={() => onSceneDelete?.(scene)}
                        />
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export { ScenesGrid };
