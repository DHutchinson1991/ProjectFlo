import { useState, useCallback } from "react";
import { ScenesLibrary, ScenesLibraryState } from "../types/sceneTypes";

/**
 * Hook for managing scenes library state including loading, filtering, and search
 */
export const useScenesLibrary = () => {
    const [libraryState, setLibraryState] = useState<ScenesLibraryState>({
        availableScenes: [],
        loadingScenes: false,
        searchTerm: "",
        selectedCategory: "ALL",
    });

    const loadAvailableScenes = useCallback(async () => {
        try {
            setLibraryState((prev: ScenesLibraryState) => ({ ...prev, loadingScenes: true }));
            // Updated API endpoint to get scenes with media components
            const response = await fetch("http://localhost:3002/scenes/with-relations");
            if (response.ok) {
                const scenes: ScenesLibrary[] = await response.json();
                setLibraryState((prev: ScenesLibraryState) => ({
                    ...prev,
                    availableScenes: scenes,
                    loadingScenes: false,
                }));
            }
        } catch (error) {
            console.error("Failed to load scenes:", error);
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
