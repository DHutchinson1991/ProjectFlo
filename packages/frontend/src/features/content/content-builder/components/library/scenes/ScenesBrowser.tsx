"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MovieFilterIcon from "@mui/icons-material/MovieFilter";
import { ScenesLibrary, SceneType } from "@/features/content/scenes/types";
import { ScenesSearch } from "./ScenesSearch";
import { ScenesCategoryFilter } from "./ScenesCategoryFilter";
import { ScenesGrid } from "./ScenesGrid";

interface ScenesBrowserProps {
    scenes: ScenesLibrary[];
    selectedSceneId?: number;
    onSceneSelect?: (scene: ScenesLibrary) => void;
    readOnly?: boolean;
    title?: string;
    showDelete?: boolean;
    onSceneDelete?: (scene: ScenesLibrary) => void;
}

const ScenesBrowser: React.FC<ScenesBrowserProps> = ({
    scenes,
    selectedSceneId,
    onSceneSelect,
    readOnly = false,
    title = "Scenes Library",
    showDelete = false,
    onSceneDelete,
}) => {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState("all");

    const getMomentsCount = (scene: ScenesLibrary) =>
        (scene.moments?.length || scene.moments_count || 0) as number;

    const isRealtimeScene = (scene: ScenesLibrary) =>
        scene.type === SceneType.MOMENTS ? true : scene.type === SceneType.MONTAGE ? false : getMomentsCount(scene) > 0;

    // Calculate categories with counts (scene mode)
    const categories = React.useMemo(() => {
        const realtimeCount = scenes.filter(isRealtimeScene).length;
        const montageCount = scenes.length - realtimeCount;

        return [
            { id: 'all', name: 'All', count: scenes.length },
            {
                id: 'realtime',
                name: 'Realtime',
                count: realtimeCount,
                icon: <AccessTimeIcon sx={{ fontSize: 14, color: "#4CAF50" }} />,
            },
            {
                id: 'montage',
                name: 'Montage',
                count: montageCount,
                icon: <MovieFilterIcon sx={{ fontSize: 14, color: "#FFB020" }} />,
            },
        ];
    }, [scenes]);

    // Filter scenes based on search and category
    const filteredScenes = React.useMemo(() => {
        let filtered = scenes;

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(scene =>
                scene.name.toLowerCase().includes(term) ||
                scene.description?.toLowerCase().includes(term)
            );
        }

        // Filter by category
        if (selectedCategory === "realtime") {
            filtered = filtered.filter(isRealtimeScene);
        }

        if (selectedCategory === "montage") {
            filtered = filtered.filter(scene => !isRealtimeScene(scene));
        }

        return filtered;
    }, [scenes, searchTerm, selectedCategory]);

    return (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                bgcolor: "#1a1a1a",
                overflow: "hidden",
                overflowX: "hidden", // Explicitly prevent horizontal scroll
                borderRight: "1px solid #333",
                borderLeft: "1px solid #333",
                borderRadius: 0, // Remove border radius for sidebar
                boxSizing: "border-box", // Ensure padding doesn't cause overflow
                width: "100%", // Take full width of parent container
                minWidth: 0, // Allow shrinking if needed
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 1.5, // Reduce padding for sidebar
                    borderBottom: "1px solid #333",
                    flexShrink: 0,
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        color: "white",
                        fontWeight: 600,
                        fontSize: "0.9rem", // Smaller font for sidebar
                        mb: 1.5,
                    }}
                >
                    {title}
                </Typography>

                {/* Search */}
                <ScenesSearch
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                />

                {/* Categories */}
                <ScenesCategoryFilter
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onCategorySelect={setSelectedCategory}
                />
            </Box>

            {/* Content */}
            <Box
                sx={{
                    flex: 1,
                    p: 1.5, // Reduce padding for sidebar
                    overflowY: "auto",
                    overflowX: "hidden", // Prevent horizontal scroll
                    width: "100%", // Take full width
                    boxSizing: "border-box", // Include padding in width calculation
                    minWidth: 0, // Allow shrinking
                    position: "relative", // Establish positioning context
                    // Prevent any layout shifts during drag operations
                    transform: "none",
                    willChange: "auto",
                    // Lock the container from any movement
                    left: 0,
                    right: 0,
                    // Prevent text selection during drag which can cause layout shifts
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    MozUserSelect: "none",
                    msUserSelect: "none",
                }}
            >
                {filteredScenes.length > 0 ? (
                    <ScenesGrid
                        scenes={filteredScenes}
                        selectedSceneId={selectedSceneId}
                        onSceneSelect={onSceneSelect}
                        readOnly={readOnly}
                        showDelete={showDelete}
                        onSceneDelete={onSceneDelete}
                    />
                ) : (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            color: "rgba(255, 255, 255, 0.5)",
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="body2">
                            {searchTerm || selectedCategory !== "all"
                                ? "No scenes match your search criteria"
                                : "No scenes available"}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export { ScenesBrowser };
