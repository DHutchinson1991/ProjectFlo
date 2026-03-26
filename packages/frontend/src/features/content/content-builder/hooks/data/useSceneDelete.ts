import { useCallback } from "react";
import { createScenesApi } from "@/features/content/scenes/api";
import { apiClient } from "@/lib/api";
import type { ApiClient } from "@/lib/api/api-client.types";
import type { FilmContentApi } from "@/features/content/films/components/FilmApiContext";

/**
 * Hook to handle scene deletion
 * Deletes a scene from the database and the timeline
 * Uses domain API: createScenesApi from @/lib/api/scenes.api
 *
 * Accepts an optional `filmApi` adapter — when provided, the delete
 * routes through it (supporting library / project / inquiry modes).
 * When omitted, falls back to the library-mode API for backward compat.
 */
export const useSceneDelete = (
    filmId: number,
    onSceneDeleted: (sceneId: number) => void,
    filmApi?: FilmContentApi | null,
) => {
    const handleDeleteScene = useCallback(
        async (sceneId: number, sceneName: string) => {
            console.log(`🗑️ [DELETE] Deleting scene ${sceneId} (${sceneName}) from film ${filmId}`);

            // Use adapter when available, otherwise fall back to library API
            const deleteScene = filmApi
                ? (id: number) => filmApi.scenes.delete(id)
                : (() => {
                    const scenesApi = createScenesApi(apiClient as unknown as ApiClient);
                    return (id: number) => scenesApi.scenes.delete(id);
                })();

            console.log(`🗑️ [DELETE] Mode: ${filmApi ? filmApi.mode : 'library (fallback)'}`);

            try {
                console.log(`🗑️ [DELETE] Attempting to delete scene ${sceneId}...`);
                
                // Delete from database
                const deleteResult = await deleteScene(sceneId);
                console.log(`✅ [DELETE] Scene ${sceneId} deleted from database:`, deleteResult);

                // Update local state
                console.log(`🗑️ [DELETE] Calling onSceneDeleted callback for scene ${sceneId}...`);
                onSceneDeleted(sceneId);
                console.log(`✅ [DELETE] Scene removed from timeline state`);
                
                return { success: true, sceneId, message: `Scene ${sceneName} deleted` };
            } catch (error: any) {
                console.error(
                    `❌ [DELETE] Failed to delete scene ${sceneId}:`,
                    error
                );
                console.error(`❌ [DELETE] Error details:`, {
                    message: error?.message,
                    status: error?.status,
                    response: error?.response,
                    stack: error?.stack
                });
                throw error;
            }
        },
        [filmId, onSceneDeleted, filmApi]
    );

    return {
        handleDeleteScene,
    };
};;
