"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Typography,
    Button,
    Alert,
    CircularProgress,
    Breadcrumbs,
    IconButton,
    Link,
} from "@mui/material";
import {
    ArrowBack as ArrowBackIcon,
    Settings as SettingsIcon,
    VideoLibrary as VideoLibraryIcon,
} from "@mui/icons-material";
import ContentBuilder from "../../components/ContentBuilder";
import { TimelineScene } from "../../components/ContentBuilder/types";

// Film data interface
interface FilmLibrary {
    id: number;
    name: string;
    description: string;
    type: "STANDARD" | "PREMIUM" | "LUXURY";
    default_music_type: string | null;
    delivery_timeline: number;
    includes_music: boolean;
    is_active: boolean;
    brand_id: number;
    version: string;
    created_at: string;
    updated_at: string;
}

// Local scene interfaces for API responses
interface FilmLocalSceneMediaComponent {
    id: number;
    film_local_scene_id: number;
    media_type: "VIDEO" | "AUDIO" | "MUSIC";
    duration_seconds: number;
    is_primary: boolean;
    music_type?: string;
    notes?: string;
}

interface FilmLocalScene {
    id: number;
    film_id: number;
    original_scene_id?: number;
    name: string;
    description?: string;
    media_components: FilmLocalSceneMediaComponent[];
}

export default function FilmDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const filmId = params.id;

    const [film, setFilm] = useState<FilmLibrary | null>(null);
    const [filmScenes, setFilmScenes] = useState<TimelineScene[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch film details
    const fetchFilm = async () => {
        try {
            const response = await fetch(`http://localhost:3002/films/${filmId}`);
            if (!response.ok) {
                throw new Error(`Film not found: ${response.status}`);
            }
            const data = await response.json();
            setFilm(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch film");
        }
    };

    // Fetch film's local scenes
    const fetchFilmScenes = async () => {
        try {
            const response = await fetch(`http://localhost:3002/films/${filmId}/scenes`);
            if (response.ok) {
                const filmWithScenes = await response.json();

                // Extract local scenes from the film data
                const localScenes = filmWithScenes.local_scenes || [];

                // Convert local scenes to TimelineScene format
                const timelineScenes: TimelineScene[] = localScenes.flatMap((localScene: FilmLocalScene) =>
                    localScene.media_components.map((component: FilmLocalSceneMediaComponent) => ({
                        id: component.id,
                        name: `${localScene.name} - ${component.media_type}`,
                        start_time: 0, // Will be set from timeline data if it exists
                        duration: component.duration_seconds,
                        track_id: getTrackIdForMediaType(component.media_type),
                        scene_type: component.media_type.toLowerCase() as "video" | "audio" | "music",
                        color: getSceneColorByType(component.media_type),
                        description: component.notes || localScene.description,
                        database_type: component.media_type,
                        original_scene_id: localScene.original_scene_id,
                        media_components: [{
                            id: component.id,
                            media_type: component.media_type,
                            track_id: getTrackIdForMediaType(component.media_type),
                            start_time: 0,
                            duration: component.duration_seconds,
                            is_primary: component.is_primary,
                            music_type: component.music_type,
                            notes: component.notes,
                            scene_component_id: component.id
                        }]
                    }))
                );

                setFilmScenes(timelineScenes);
            }
        } catch (err) {
            console.error("Failed to fetch film scenes:", err);
            // Don't set error state for this, just log it
        }
    };

    // Helper functions
    const getTrackIdForMediaType = (mediaType: string): number => {
        switch (mediaType) {
            case "VIDEO": return 1;
            case "AUDIO": return 2;
            case "MUSIC": return 3;
            case "GRAPHICS": return 4;
            default: return 1;
        }
    };

    const getSceneColorByType = (type: string): string => {
        switch (type) {
            case "VIDEO": return "#2196f3";
            case "AUDIO": return "#4caf50";
            case "GRAPHICS": return "#ff9800";
            case "MUSIC": return "#9c27b0";
            default: return "#2196f3";
        }
    };

    // Load film data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchFilm();
            await fetchFilmScenes();
            setLoading(false);
        };

        if (filmId) {
            loadData();
        }
    }, [filmId]);

    const handleSave = async (scenes: TimelineScene[]) => {
        console.log("Saving film template:", scenes);

        try {
            // Get current film scenes to check what's already assigned
            const currentResponse = await fetch(`http://localhost:3002/films/${filmId}/scenes`);
            const currentFilm = await currentResponse.json();
            const existingSceneIds = new Set(currentFilm.local_scenes?.map((s: FilmLocalScene) => s.original_scene_id) || []);

            // Group scenes by their original scene ID to create local copies
            const sceneGroupsMap = new Map<number, TimelineScene[]>();

            scenes.forEach(scene => {
                if (scene.original_scene_id) {
                    if (!sceneGroupsMap.has(scene.original_scene_id)) {
                        sceneGroupsMap.set(scene.original_scene_id, []);
                    }
                    sceneGroupsMap.get(scene.original_scene_id)!.push(scene);
                }
            });

            let savedCount = 0;
            let skippedCount = 0;

            // Save each scene group as a local copy (only if not already assigned)
            for (const [originalSceneId, sceneGroup] of sceneGroupsMap) {
                if (existingSceneIds.has(originalSceneId)) {
                    console.log(`⏭️ Scene ${originalSceneId} already assigned to film, skipping...`);
                    skippedCount++;
                    continue;
                }

                // Find the "primary" scene to get the main timeline position
                const primaryScene = sceneGroup.find(s => s.media_components?.some(c => c.is_primary)) || sceneGroup[0];

                // Call API to assign scene to film and create local copy
                const response = await fetch(`http://localhost:3002/films/${filmId}/scenes/assign`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        scene_id: originalSceneId,
                        order_index: Math.round(primaryScene.start_time), // Use start_time as order for now
                        editing_style: "Standard" // Default editing style
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to save scene ${originalSceneId}: ${response.statusText} - ${errorText}`);
                }

                savedCount++;
            }

            console.log(`✅ Film scenes saved successfully! ${savedCount} new scenes assigned, ${skippedCount} existing scenes.`);

            // Refresh the scenes data after save
            await fetchFilmScenes();

            // Could add success notification here
            // showSnackbar("Film saved successfully!", "success");

        } catch (error) {
            console.error("❌ Failed to save film:", error);
            // Could add error notification here
            // showSnackbar("Failed to save film. Please try again.", "error");
        }
    };

    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="400px"
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error || !film) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error || "Film not found"}</Alert>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push("/designer/films")}
                    sx={{ mt: 2 }}
                >
                    Back to Films
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            {/* Header Section */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 2 }}>
                    <IconButton onClick={() => router.push("/designer/films")}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                            Film Details
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Design and configure your film template
                        </Typography>
                    </Box>
                </Box>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="/designer" sx={{ display: "flex", alignItems: "center" }}>
                        <SettingsIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Designer
                    </Link>
                    <Link underline="hover" color="inherit" href="/designer/films" sx={{ display: "flex", alignItems: "center" }}>
                        <VideoLibraryIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Films Library
                    </Link>
                    <Typography color="text.primary" sx={{ fontWeight: 600 }}>
                        {film.name}
                    </Typography>
                </Breadcrumbs>
            </Box>

            {/* Content Builder */}
            <Box sx={{ flex: 1, overflow: "visible" }}>
                <ContentBuilder
                    initialScenes={filmScenes}
                    onSave={handleSave}
                    readOnly={false}
                />
            </Box>
        </Box>
    );
}
