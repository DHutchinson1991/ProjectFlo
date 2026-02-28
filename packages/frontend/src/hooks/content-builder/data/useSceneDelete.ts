import { useCallback } from "react";
import { createScenesApi } from "@/lib/api/scenes.api";
import { apiClient } from "@/lib/api";

/**
 * Hook to handle scene deletion
 * Deletes a scene from the database and the timeline
 * Uses domain API: createScenesApi from @/lib/api/scenes.api
 */
export const useSceneDelete = (
    filmId: number,
    onSceneDeleted: (sceneId: number) => void
) => {
    const handleDeleteScene = useCallback(
        async (sceneId: number, sceneName: string) => {
            console.log(`🗑️ [DELETE] Deleting scene ${sceneId} (${sceneName}) from film ${filmId}`);
            
            // Create the API inside the callback to ensure fresh instance
            const scenesApi = createScenesApi(apiClient);
            console.log(`🗑️ [DELETE] Callback type:`, typeof onSceneDeleted);
            console.log(`🗑️ [DELETE] API client available:`, !!scenesApi);
            console.log(`🗑️ [DELETE] API methods available:`, scenesApi?.scenes ? 'YES' : 'NO');

            try {
                console.log(`🗑️ [DELETE] Attempting to call scenesApi.scenes.delete(${sceneId})...`);
                
                // Delete from database using domain API
                const deleteResult = await scenesApi.scenes.delete(sceneId);
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
        [filmId, onSceneDeleted]
    );

    return {
        handleDeleteScene,
    };
};;
