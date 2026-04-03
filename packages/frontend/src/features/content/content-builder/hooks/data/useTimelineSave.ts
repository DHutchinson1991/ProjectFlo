import { useCallback } from "react";
import { beatsApi } from "@/features/content/beats/api";
import { scenesApi as defaultScenesApi } from "@/features/content/scenes/api";
import type { TimelineScene } from "@/features/content/content-builder/types/timeline";
import type { FilmContentApi } from "@/features/content/films/components/FilmApiContext";

/**
 * Hook to handle timeline save operations
 * Saves timeline scenes to the database and maintains track order
 * Uses domain API: scenesApi from @/features/content/scenes/api
 * 
 * Accepts an optional `filmApi` adapter — when provided, all persistence
 * routes through it (supporting library, project-instance, and inquiry-
 * instance modes). When omitted, falls back to the library-mode APIs
 * directly for backward compatibility.
 * 
 * Returns: handleSave function and idMapping (client ID -> database ID)
 */
export const useTimelineSave = (
    filmId: number,
    onTimelineSave: (scenes: TimelineScene[], tracks?: any[]) => void,
    onTracksSave: (tracks: any[]) => void,
    filmApi?: FilmContentApi | null,
) => {
    // Build an internal API surface that honours the adapter when present
    const scenesApi = filmApi ? null : defaultScenesApi;

    // Helper: delegate to adapter or fallback
    const scenesCreate = filmApi
        ? (data: any) => filmApi.scenes.create(data)
        : (data: any) => scenesApi!.scenes.create(data);
    const scenesUpdate = filmApi
        ? (id: number, data: any) => filmApi.scenes.update(id, data)
        : (id: number, data: any) => scenesApi!.scenes.update(id, data);
    const scenesDelete = filmApi
        ? (id: number) => filmApi.scenes.delete(id)
        : (id: number) => scenesApi!.scenes.delete(id);
    const scenesRecordingSetupUpsert = filmApi
        ? (sceneId: number, data: any) => filmApi.scenes.recordingSetup.upsert(sceneId, data)
        : (sceneId: number, data: any) => scenesApi!.scenes.recordingSetup.upsert(sceneId, data);
    const momentsCreate = filmApi
        ? (data: any) => filmApi.moments.create(data)
        : (data: any) => scenesApi!.moments.create(data);
    const beatsCreate = filmApi
        ? (sceneId: number, data: any) => filmApi.beats.create(sceneId, data)
        : (sceneId: number, data: any) => beatsApi.create(sceneId, data);
    let lastSavedIdMapping: Map<number | string, number> = new Map();

    const handleSave = useCallback(async (scenes: TimelineScene[], tracks?: any[]) => {
        console.log("💾 Saving film timeline state...");
        console.log(`💾 [SAVE] Film ID: ${filmId}, Scenes: ${scenes.length}, Tracks: ${tracks?.length || 0}`);

        // Save to localStorage/sessionStorage
        onTimelineSave(scenes, tracks);

        try {
            // Track which scenes got saved with new database IDs - declare at top level
            const savedSceneIds = new Map<number | string, number>();
            
            // Save each scene to the database
            if (scenes && scenes.length > 0) {
                console.log(`📍 [SAVE] Saving ${scenes.length} scenes to film ${filmId}`);
                console.log(`📍 [SAVE] API being used:`, filmApi ? `✅ FilmContentApi (${filmApi.mode})` : (scenesApi?.scenes ? "✅ scenes.api loaded" : "❌ scenes.api NOT loaded"));
                
                for (let index = 0; index < scenes.length; index++) {
                    const scene = scenes[index];
                    try {
                        // Check if scene is new (doesn't exist in database)
                        // New scenes have client-generated IDs (large numbers) or are marked isNew
                        const isClientGeneratedId = typeof scene.id === 'number' && scene.id > 1000000000000;
                        const isNewScene = isClientGeneratedId || (scene as any).isNew;
                        
                        if (!isNewScene && scene.id && typeof scene.id === 'number') {
                            console.log(`📍 [SAVE] Scene ${index + 1}/${scenes.length}: Skipping already saved scene ID ${scene.id}`);
                            continue;
                        }
                        
                        console.log(`📍 [SAVE] Scene ${index + 1}/${scenes.length}: Detected as NEW - will save to database`, {
                            clientId: scene.id,
                            isClientGenerated: isClientGeneratedId,
                            isMarkedNew: (scene as any).isNew
                        });

                        // Get the template ID - prefer original_scene_id (set by conversion), fall back to library_id
                        const templateId = (scene as any).original_scene_id || (scene as any).library_id || 1;
                        
                        // Create scene with library scene reference using domain API
                        const sceneData = {
                            film_id: filmId,
                            name: scene.name,
                            scene_template_id: templateId,
                            order_index: index,
                        };
                        
                        console.log(`📍 [SAVE] Scene ${index + 1}/${scenes.length}:`);
                        console.log(`  - Film ID: ${sceneData.film_id}`);
                        console.log(`  - Name: ${sceneData.name}`);
                        console.log(`  - Template ID: ${sceneData.scene_template_id}`);
                        console.log(`  - Order Index: ${sceneData.order_index}`);
                        console.log(`  - Type: ${(scene as any).scene_type}`);
                        console.log(`  - Duration: ${scene.duration}s`);
                        console.log(`  - Moments: ${(scene.moments?.length || 0)}`);
                        console.log(`📍 [SAVE] About to call scenes.create with data:`, sceneData);
                        
                        const result = await scenesCreate(sceneData);
                        const newDatabaseId = (result as any).id;
                        console.log(`✅ [SAVE] Scene saved successfully:`, { clientId: scene.id, databaseId: newDatabaseId, name: (result as any).name });
                        
                        // Track the mapping from client ID to database ID
                        if (scene.id) {
                            savedSceneIds.set(scene.id, newDatabaseId);
                        }
                        
                        // 🔥 NEW: Save moments from the template to the database
                        if (scene.moments && scene.moments.length > 0) {
                            console.log(`📍 [SAVE] Saving ${scene.moments.length} moments for scene ${newDatabaseId} (${scene.name})`);
                            try {
                                for (let momentIndex = 0; momentIndex < scene.moments.length; momentIndex++) {
                                    const moment = scene.moments[momentIndex];
                                    const momentData = {
                                        film_scene_id: newDatabaseId,
                                        name: moment.name,
                                        order_index: momentIndex,
                                        duration: moment.duration || 60,
                                    };
                                    console.log(`  📍 [SAVE] Moment ${momentIndex + 1}/${scene.moments.length}: ${moment.name} (${moment.duration}s)`);
                                    
                                    const momentResult = await momentsCreate(momentData);
                                    console.log(`  ✅ [SAVE] Moment created: ID ${(momentResult as any).id}`);
                                }
                                console.log(`✅ [SAVE] All moments saved for scene ${newDatabaseId}`);
                            } catch (momentError: any) {
                                console.error(`❌ [SAVE] Error saving moments for scene ${newDatabaseId}:`, {
                                    errorMessage: momentError?.message,
                                    errorStatus: momentError?.status,
                                    momentCount: scene.moments.length
                                });
                                console.warn(`⚠️ [SAVE] Failed to save moments but scene itself was created. Continuing...`, momentError);
                            }
                        } else {
                            console.log(`📍 [SAVE] Scene ${newDatabaseId} has no moments to save`);
                        }

                        // 🔥 NEW: Save beats from the template to the database (for montage scenes)
                        if ((scene as any).beats && (scene as any).beats.length > 0) {
                            console.log(`📍 [SAVE] Saving ${(scene as any).beats.length} beats for scene ${newDatabaseId} (${scene.name})`);
                            try {
                                const savedBeats = [];
                                for (let beatIndex = 0; beatIndex < (scene as any).beats.length; beatIndex++) {
                                    const beat = (scene as any).beats[beatIndex];
                                    const beatData = {
                                        name: beat.name,
                                        duration_seconds: beat.duration_seconds || 10,
                                        order_index: beatIndex,
                                        shot_count: beat.shot_count ?? null,
                                    };
                                    console.log(`  📍 [SAVE] Beat ${beatIndex + 1}/${(scene as any).beats.length}: ${beat.name} (${beat.duration_seconds}s)`);
                                    
                                    const beatResult = await beatsCreate(newDatabaseId, beatData) as { id: number };
                                    savedBeats.push(beatResult);
                                    console.log(`  ✅ [SAVE] Beat created: ID ${beatResult.id}`);
                                }
                                // Update scene.beats with the saved beats (now with real database IDs)
                                (scene as any).beats = savedBeats;
                                console.log(`✅ [SAVE] All beats saved for scene ${newDatabaseId}`);
                            } catch (beatError: any) {
                                console.error(`❌ [SAVE] Error saving beats for scene ${newDatabaseId}:`, {
                                    errorMessage: beatError?.message,
                                    errorStatus: beatError?.status,
                                    beatCount: (scene as any).beats.length
                                });
                                console.warn(`⚠️ [SAVE] Failed to save beats but scene itself was created. Continuing...`, beatError);
                            }
                        } else {
                            console.log(`📍 [SAVE] Scene ${newDatabaseId} has no beats to save`);
                        }

                            // 🔥 NEW: Apply template recording setup (camera/audio counts + graphics) to new scene
                            const templateRecordingSetup = (scene as any).recording_setup_template || (scene as any).recording_setup;
                            const cameraCount = Number.isFinite(templateRecordingSetup?.camera_count)
                                ? Number(templateRecordingSetup.camera_count)
                                : (templateRecordingSetup?.camera_track_ids?.length || 0);
                            const audioCount = Number.isFinite(templateRecordingSetup?.audio_count)
                                ? Number(templateRecordingSetup.audio_count)
                                : (templateRecordingSetup?.audio_track_ids?.length || 0);

                            if (templateRecordingSetup && tracks && tracks.length > 0) {
                                const normalizedTracks = tracks.map((track: any) => ({
                                    ...track,
                                    track_type: track.track_type?.toString().toLowerCase(),
                                }));

                                const cameraTrackIds = normalizedTracks
                                    .filter((track: any) => track.track_type === 'video')
                                    .slice(0, Math.max(0, cameraCount))
                                    .map((track: any) => track.id);

                                const audioTrackIds = normalizedTracks
                                    .filter((track: any) => track.track_type === 'audio')
                                    .slice(0, Math.max(0, audioCount))
                                    .map((track: any) => track.id);

                                const shouldApplySetup = cameraTrackIds.length > 0 || audioTrackIds.length > 0 || templateRecordingSetup.graphics_enabled === true;

                                if (shouldApplySetup) {
                                    try {
                                        await scenesRecordingSetupUpsert(newDatabaseId, {
                                            camera_track_ids: cameraTrackIds,
                                            audio_track_ids: audioTrackIds,
                                            graphics_enabled: !!templateRecordingSetup.graphics_enabled,
                                        });
                                        console.log(`✅ [SAVE] Recording setup applied for scene ${newDatabaseId}`, {
                                            cameraTrackCount: cameraTrackIds.length,
                                            audioTrackCount: audioTrackIds.length,
                                            graphicsEnabled: !!templateRecordingSetup.graphics_enabled,
                                        });
                                    } catch (recordingError: any) {
                                        console.warn(`⚠️ [SAVE] Failed to apply recording setup for scene ${newDatabaseId}:`, recordingError);
                                    }
                                }
                            }
                    } catch (sceneError: any) {
                        console.error(`❌ [SAVE] Error details for scene "${scene.name}":`, {
                            errorMessage: sceneError?.message,
                            errorStatus: sceneError?.status,
                            errorResponse: sceneError?.response,
                            sceneData: {
                                id: scene.id,
                                name: scene.name,
                                templateId: (scene as any).original_scene_id || (scene as any).library_id,
                                type: (scene as any).scene_type
                            }
                        });
                        console.warn(`⚠️ [SAVE] Failed to save scene "${scene.name}":`, sceneError);
                        // Continue with other scenes even if one fails
                    }
                }
            }

            // Store the ID mapping for use in delete operations
            lastSavedIdMapping = savedSceneIds;
            console.log('💾 [SAVE] ID mapping saved:', Array.from(savedSceneIds.entries()));

            // Sync scene order to database if scenes provided
            if (scenes && scenes.length > 0) {
                console.log(`📍 [SAVE] Reordering ${scenes.length} scenes in film ${filmId}`);
                console.log(`📍 [SAVE] Saved scene IDs map:`, Array.from(savedSceneIds.entries()));
                
                try {
                    // Update each scene's order using domain API
                    // Note: Only update scenes that already exist in the database
                    let successCount = 0;
                    for (let index = 0; index < scenes.length; index++) {
                        const scene = scenes[index];
                        // Use mapped database ID if available, otherwise use scene ID
                        const databaseId = savedSceneIds && savedSceneIds.has(scene.id) 
                            ? savedSceneIds.get(scene.id) 
                            : scene.id;
                        
                        if (databaseId && typeof databaseId === 'number') {
                            const isClientGenerated = typeof scene.id === 'number' && scene.id > 1000000000000;
                            console.log(`📍 [SAVE] Updating scene order - Index ${index + 1}/${scenes.length}:`, {
                                clientId: scene.id,
                                databaseId: databaseId,
                                newOrder: index,
                                isNewScene: isClientGenerated
                            });
                            
                            try {
                                console.log(`📍 [SAVE] About to call scenes.update(${databaseId}, {order_index: ${index}, name: ${scene.name}})`);
                                await scenesUpdate(databaseId, {
                                    order_index: index,
                                    name: scene.name,
                                });
                                successCount++;
                            } catch (updateError: any) {
                                console.error(`❌ [SAVE] Error updating scene ${databaseId}:`, {
                                    errorMessage: updateError?.message,
                                    errorStatus: updateError?.status,
                                    errorResponse: updateError?.response,
                                    attemptedUpdate: { sceneId: databaseId, orderIndex: index }
                                });
                                console.warn(`⚠️ [SAVE] Failed to update order for scene ${databaseId}:`, updateError);
                            }
                        } else {
                            console.warn(`⚠️ [SAVE] Skipping order update - no valid database ID for scene ${scene.id}`);
                        }
                    }
                    
                    console.log(`✅ [SAVE] Scene order synced for ${successCount}/${scenes.length} scenes`);
                } catch (reorderError) {
                    console.warn("⚠️ [SAVE] Failed to sync scene order:", reorderError);
                    // Scene reorder failure is non-critical, don't block save
                }
            }

            console.log("✅ Film timeline saved successfully");
        } catch (error) {
            console.error("❌ [SAVE] Error saving timeline:", error);
            // Don't throw - save locally succeeded
        }
    }, [filmId, onTimelineSave, onTracksSave, scenesApi, filmApi]);

    return {
        handleSave,
        getIdMapping: () => lastSavedIdMapping, // Return the ID mapping for client -> database ID conversion
    };
};
