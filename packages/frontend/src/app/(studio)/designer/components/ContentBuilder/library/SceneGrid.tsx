"use client";

import React from "react";
import { Box, Grid } from "@mui/material";
import { ScenesLibrary } from "../types/sceneTypes";
import SceneCard from "./SceneCard";

interface SceneGridProps {
    scenes: ScenesLibrary[];
    selectedSceneId?: number;
    onSceneSelect?: (scene: ScenesLibrary) => void;
    readOnly?: boolean;
    gridCols?: number;
}

const SceneGrid: React.FC<SceneGridProps> = ({
    scenes,
    selectedSceneId,
    onSceneSelect,
    readOnly = false,
    gridCols = 2,
}) => {
    return (
        <Box
            sx={{
                height: "100%",
                overflow: "auto",
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
            <Grid container spacing={2}>
                {scenes.map((scene) => (
                    <Grid item xs={12} sm={6} md={12 / gridCols} key={scene.id}>
                        <SceneCard
                            scene={scene}
                            isSelected={selectedSceneId === scene.id}
                            onClick={() => onSceneSelect?.(scene)}
                            readOnly={readOnly}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default SceneGrid;
