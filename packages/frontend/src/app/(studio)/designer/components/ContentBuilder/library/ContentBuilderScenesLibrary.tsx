"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { ScenesLibrary } from "../types/sceneTypes";
import { getSceneCategories } from "../utils";
import SceneSearch from "./SceneSearch";
import SceneCategories from "./SceneCategories";
import SceneGrid from "./SceneGrid";

interface ContentBuilderScenesLibraryProps {
    scenes: ScenesLibrary[];
    selectedSceneId?: number;
    onSceneSelect?: (scene: ScenesLibrary) => void;
    readOnly?: boolean;
    title?: string;
}

const ContentBuilderScenesLibrary: React.FC<ContentBuilderScenesLibraryProps> = ({
    scenes,
    selectedSceneId,
    onSceneSelect,
    readOnly = false,
    title = "Scenes Library",
}) => {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState("all");

    // Filter scenes based on search and category
    const filteredScenes = React.useMemo(() => {
        let filtered = scenes;

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(scene =>
                scene.name.toLowerCase().includes(term) ||
                scene.description?.toLowerCase().includes(term) ||
                scene.type.toLowerCase().includes(term)
            );
        }

        // Filter by category
        if (selectedCategory !== "all") {
            filtered = filtered.filter(scene =>
                scene.type.toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        return filtered;
    }, [scenes, searchTerm, selectedCategory]);

    // Calculate category counts
    const categories = React.useMemo(() => {
        const baseCats = getSceneCategories();
        return baseCats.map(cat => ({
            ...cat,
            count: cat.id === "all"
                ? scenes.length
                : scenes.filter(scene => scene.type.toLowerCase() === cat.id).length,
        }));
    }, [scenes]);

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
                <SceneSearch
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                />

                {/* Categories */}
                <SceneCategories
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
                    <SceneGrid
                        scenes={filteredScenes}
                        selectedSceneId={selectedSceneId}
                        onSceneSelect={onSceneSelect}
                        readOnly={readOnly}
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

export default ContentBuilderScenesLibrary;
