import type { ApiClient } from '@/shared/api/client';
import type {
    FloorPlan,
    FloorPlanObject,
    SaveFloorPlanCanvasRequest,
    SceneSpatialLayout,
    SceneCameraPosition,
    SceneSubjectPosition,
    SceneSpaceAssignment,
    UpsertCameraPositionRequest,
    UpsertSubjectPositionRequest,
    PackageSpaceSlot,
    SaveSpaceSlotCanvasRequest,
    SpaceSlotZone,
    SpatialContext,
    MomentCameraPosition,
    MomentSubjectPosition,
    MomentSpatialLayout,
    UpsertMomentCameraPositionRequest,
    UpsertMomentSubjectPositionRequest,
} from '../types/floor-plan.types';

export type FloorPlanApi = ReturnType<typeof createFloorPlanApi>;

export const createFloorPlanApi = (client: ApiClient) => ({
    // ==================== FLOOR PLANS ====================

    getByLocation: (locationId: number): Promise<FloorPlan[]> =>
        client.get(`/api/locations/${locationId}/floor-plans`),

    getById: (locationId: number, id: number): Promise<FloorPlan> =>
        client.get(`/api/locations/${locationId}/floor-plans/${id}`),

    create: (locationId: number, data?: { name?: string }): Promise<FloorPlan> =>
        client.post(`/api/locations/${locationId}/floor-plans`, data ?? {}),

    update: (locationId: number, id: number, data: Partial<FloorPlan>): Promise<FloorPlan> =>
        client.patch(`/api/locations/${locationId}/floor-plans/${id}`, data),

    delete: (locationId: number, id: number): Promise<void> =>
        client.delete(`/api/locations/${locationId}/floor-plans/${id}`),

    saveCanvas: (locationId: number, id: number, data: SaveFloorPlanCanvasRequest): Promise<FloorPlan> =>
        client.patch(`/api/locations/${locationId}/floor-plans/${id}/canvas`, data),

    // ── Objects ───────────────────────────────────────────

    createObject: (locationId: number, floorPlanId: number, data: Omit<FloorPlanObject, 'id' | 'floor_plan_id' | 'created_at' | 'updated_at'>): Promise<FloorPlanObject> =>
        client.post(`/api/locations/${locationId}/floor-plans/${floorPlanId}/objects`, data),

    updateObject: (locationId: number, objectId: number): Promise<FloorPlanObject> =>
        client.patch(`/api/locations/${locationId}/floor-plans/objects/${objectId}`, {}),

    deleteObject: (locationId: number, objectId: number): Promise<void> =>
        client.delete(`/api/locations/${locationId}/floor-plans/objects/${objectId}`),

    // ── Space Boundaries ──────────────────────────────────

    updateSpaceBoundary: (
        locationId: number,
        floorPlanId: number,
        spaceId: number,
        data: { boundary_json?: Array<{ x: number; y: number }>; fill_color?: string },
    ): Promise<void> =>
        client.patch(`/api/locations/${locationId}/floor-plans/${floorPlanId}/spaces/${spaceId}/boundary`, data),

    // ==================== SCENE SPATIAL ====================

    sceneSpatial: {
        getLayout: (sceneId: number): Promise<SceneSpatialLayout> =>
            client.get(`/api/films/scenes/${sceneId}/spatial`),

        getSpaces: (sceneId: number): Promise<SceneSpaceAssignment[]> =>
            client.get(`/api/films/scenes/${sceneId}/spatial/spaces`),

        addSpace: (sceneId: number, data: { space_id: number; order_index?: number }): Promise<SceneSpaceAssignment> =>
            client.post(`/api/films/scenes/${sceneId}/spatial/spaces`, data),

        removeSpace: (sceneId: number, spaceId: number): Promise<void> =>
            client.delete(`/api/films/scenes/${sceneId}/spatial/spaces/${spaceId}`),

        getCameras: (sceneId: number): Promise<SceneCameraPosition[]> =>
            client.get(`/api/films/scenes/${sceneId}/spatial/cameras`),

        upsertCamera: (sceneId: number, data: UpsertCameraPositionRequest): Promise<SceneCameraPosition> =>
            client.put(`/api/films/scenes/${sceneId}/spatial/cameras`, data),

        removeCamera: (sceneId: number, trackId: number): Promise<void> =>
            client.delete(`/api/films/scenes/${sceneId}/spatial/cameras/${trackId}`),

        getSubjects: (sceneId: number): Promise<SceneSubjectPosition[]> =>
            client.get(`/api/films/scenes/${sceneId}/spatial/subjects`),

        upsertSubject: (sceneId: number, data: UpsertSubjectPositionRequest): Promise<SceneSubjectPosition> =>
            client.put(`/api/films/scenes/${sceneId}/spatial/subjects`, data),

        removeSubject: (sceneId: number, subjectId: number): Promise<void> =>
            client.delete(`/api/films/scenes/${sceneId}/spatial/subjects/${subjectId}`),

        // ── Moment-level overrides (keyframes) ────────────

        getMomentLayout: (sceneId: number, momentId: number): Promise<MomentSpatialLayout> =>
            client.get(`/api/films/scenes/${sceneId}/spatial/moments/${momentId}`),

        getMomentCameras: (sceneId: number, momentId: number): Promise<MomentCameraPosition[]> =>
            client.get(`/api/films/scenes/${sceneId}/spatial/moments/${momentId}/cameras`),

        upsertMomentCamera: (sceneId: number, momentId: number, data: UpsertMomentCameraPositionRequest): Promise<MomentCameraPosition> =>
            client.put(`/api/films/scenes/${sceneId}/spatial/moments/${momentId}/cameras`, data),

        removeMomentCamera: (sceneId: number, momentId: number, trackId: number): Promise<void> =>
            client.delete(`/api/films/scenes/${sceneId}/spatial/moments/${momentId}/cameras/${trackId}`),

        getMomentSubjects: (sceneId: number, momentId: number): Promise<MomentSubjectPosition[]> =>
            client.get(`/api/films/scenes/${sceneId}/spatial/moments/${momentId}/subjects`),

        upsertMomentSubject: (sceneId: number, momentId: number, data: UpsertMomentSubjectPositionRequest): Promise<MomentSubjectPosition> =>
            client.put(`/api/films/scenes/${sceneId}/spatial/moments/${momentId}/subjects`, data),

        removeMomentSubject: (sceneId: number, momentId: number, subjectId: number): Promise<void> =>
            client.delete(`/api/films/scenes/${sceneId}/spatial/moments/${momentId}/subjects/${subjectId}`),
    },

    // ==================== SPACE SLOT SPATIAL ====================

    spaceSlots: {
        getByActivity: (activityId: number): Promise<PackageSpaceSlot[]> =>
            client.get(`/api/space-slots/by-activity/${activityId}`),

        getById: (id: number): Promise<PackageSpaceSlot> =>
            client.get(`/api/space-slots/${id}`),

        getByPackage: (packageId: number, options?: { sync?: boolean }): Promise<PackageSpaceSlot[]> => {
            const query = options?.sync === false ? '?sync=false' : '';
            return client.get(`/api/space-slots/by-package/${packageId}${query}`);
        },

        saveCanvas: (id: number, data: SaveSpaceSlotCanvasRequest): Promise<PackageSpaceSlot> =>
            client.patch(`/api/space-slots/${id}/canvas`, data),

        updateCameraPosition: (
            id: number,
            x: number,
            y: number,
            rotation?: number,
            sceneMomentId?: number,
        ): Promise<void> =>
            client.patch(`/api/space-slots/cameras/${id}/position`, { x, y, rotation, sceneMomentId }),

        updateSubjectPosition: (
            id: number,
            x: number,
            y: number,
            rotation?: number,
            packageMomentId?: number,
            sceneMomentId?: number,
        ): Promise<void> =>
            client.patch(`/api/space-slots/subjects/${id}/position`, {
                x,
                y,
                rotation,
                packageMomentId,
                sceneMomentId,
            }),

        getMomentOverrides: (slotId: number, momentId: number): Promise<{ cameras: any[]; subjects: any[] }> =>
            client.get(`/api/space-slots/${slotId}/moments/${momentId}`),

        upsertMomentCamera: (
            cameraPositionId: number,
            momentId: number,
            x: number,
            y: number,
            rotation?: number,
            sceneMomentId?: number,
        ): Promise<any> =>
            client.put(
                `/api/space-slots/moment-cameras/${cameraPositionId}/${momentId}`,
                { x, y, rotation, sceneMomentId },
            ),

        upsertMomentSubject: (
            subjectPositionId: number,
            momentId: number,
            x: number,
            y: number,
            rotation?: number,
            sceneMomentId?: number,
        ): Promise<any> =>
            client.put(
                `/api/space-slots/moment-subjects/${subjectPositionId}/${momentId}`,
                { x, y, rotation, sceneMomentId },
            ),

        aimCameras: (
            slotId: number,
            data: { packageMomentId: number; sceneMomentId: number },
        ): Promise<{ updatedCameraPositionIds: number[] }> =>
            client.post(`/api/space-slots/${slotId}/aim-cameras`, data),

        // ── Zones ─────────────────────────────────────────

        getZones: (slotId: number): Promise<SpaceSlotZone[]> =>
            client.get(`/api/space-slots/${slotId}/zones`),

        upsertZones: (slotId: number, zones: Array<{
            id?: number; name: string; label?: string;
            polygon: Array<{ x: number; y: number }>; color?: string;
            description?: string; order_index?: number;
        }>): Promise<SpaceSlotZone[]> =>
            client.put(`/api/space-slots/${slotId}/zones`, zones),

        // ── Blocking Environment (AI) ─────────────────────

        getSpatialContext: (slotId: number, momentId?: number): Promise<SpatialContext> =>
            client.get(`/api/space-slots/${slotId}/blocking-environment${momentId ? `?momentId=${momentId}` : ''}`),

        getResolvedFacing: (slotId: number): Promise<{ cameras: Record<number, number>; subjects: Record<number, number> }> =>
            client.get(`/api/space-slots/${slotId}/blocking-environment/resolved-facing`),
    },
});
