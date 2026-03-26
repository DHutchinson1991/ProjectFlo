import { useState, useCallback, useMemo } from "react";
import { createScenesApi } from "@/features/content/scenes/api";
import { apiClient } from "@/lib/api";
import type { ApiClient } from "@/lib/api/api-client.types";
import type { ScenesLibrary, ScenesLibraryState } from '@/features/content/scenes/types';

/**
 * Hook for managing scenes library state including loading, filtering, and search
 */
export const useScenesLibrary = (filmId?: number) => {
    const scenesApi = useMemo(() => createScenesApi(apiClient as unknown as ApiClient), []);
    const [libraryState, setLibraryState] = useState<ScenesLibraryState>({
        availableScenes: [],
        loadingScenes: false,
        searchTerm: "",
        selectedCategory: "ALL",
    });

    const loadAvailableScenes = useCallback(async () => {
        try {
            setLibraryState((prev: ScenesLibraryState) => ({ ...prev, loadingScenes: true }));
            
            // Per PHASE_1 architecture: scenes library = SceneTemplate (global reusable templates)
            // Backend now has GET /scenes/templates endpoint
            const scenes: ScenesLibrary[] = await scenesApi.templates.getAll();
            
            // SceneTemplate response includes moments and suggested subjects in single call
            // No need for separate fetches
            
            setLibraryState((prev: ScenesLibraryState) => ({
                ...prev,
                availableScenes: scenes,
                loadingScenes: false,
            }));
        } catch (error) {
            console.error("❌ Failed to load scene templates:", error);
            setLibraryState((prev: ScenesLibraryState) => ({ ...prev, loadingScenes: false }));
        }
    }, []);


    const getFilteredScenes = useCallback(() => {
        return libraryState.availableScenes.filter((scene: ScenesLibrary) => {
            const matchesSearch =
                scene.name
                    .toLowerCase()
                    .includes(libraryState.searchTerm.toLowerCase()) ||
                (scene.description
                    ?.toLowerCase()
                    .includes(libraryState.searchTerm.toLowerCase()) ??
                    false);
            const matchesCategory =
                libraryState.selectedCategory === "ALL" ||
                scene.type === libraryState.selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [
        libraryState.availableScenes,
        libraryState.searchTerm,
        libraryState.selectedCategory,
    ]);

    const updateSearchTerm = useCallback((searchTerm: string) => {
        setLibraryState((prev: ScenesLibraryState) => ({ ...prev, searchTerm }));
    }, []);

    const updateSelectedCategory = useCallback((selectedCategory: string) => {
        setLibraryState((prev: ScenesLibraryState) => ({ ...prev, selectedCategory }));
    }, []);

    return {
        libraryState,
        loadAvailableScenes,
        getFilteredScenes,
        updateSearchTerm,
        updateSelectedCategory,
    };
};
