'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { floorPlanApi } from '../api';
import type { SaveSpaceSlotCanvasRequest } from '../types/floor-plan.types';

export const spaceSlotKeys = {
    all: (brandId: string) => ['space-slots', brandId] as const,
    byActivity: (brandId: string, activityId: number) =>
        [...spaceSlotKeys.all(brandId), 'activity', activityId] as const,
    byPackage: (brandId: string, packageId: number) =>
        [...spaceSlotKeys.all(brandId), 'package', packageId] as const,
    detail: (brandId: string, id: number) =>
        [...spaceSlotKeys.all(brandId), 'detail', id] as const,
    momentOverrides: (brandId: string, slotId: number, momentId: number) =>
        [...spaceSlotKeys.all(brandId), 'moment', slotId, momentId] as const,
    zones: (brandId: string, slotId: number) =>
        [...spaceSlotKeys.all(brandId), 'zones', slotId] as const,
    blockingEnvironment: (brandId: string, slotId: number, momentId?: number) =>
        [...spaceSlotKeys.all(brandId), 'blocking-environment', slotId, momentId] as const,
    blockingResolvedFacing: (brandId: string, slotId: number) =>
        [...spaceSlotKeys.all(brandId), 'blocking-environment-resolved-facing', slotId] as const,
};

/**
 * Fetch space slots assigned to a package activity.
 */
export function useSpaceSlotsByActivity(activityId: number | null | undefined) {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');

    return useQuery({
        queryKey: spaceSlotKeys.byActivity(brandId, activityId ?? 0),
        queryFn: () => floorPlanApi.spaceSlots.getByActivity(activityId!),
        enabled: !!currentBrand?.id && !!activityId,
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Fetch all space slots for a package.
 */
export function useSpaceSlotsByPackage(packageId: number | null | undefined) {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');

    return useQuery({
        queryKey: spaceSlotKeys.byPackage(brandId, packageId ?? 0),
        queryFn: () => floorPlanApi.spaceSlots.getByPackage(packageId!),
        enabled: !!currentBrand?.id && !!packageId,
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Fetch a single space slot by ID.
 */
export function useSpaceSlot(id: number | null | undefined) {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');

    return useQuery({
        queryKey: spaceSlotKeys.detail(brandId, id ?? 0),
        queryFn: () => floorPlanApi.spaceSlots.getById(id!),
        enabled: !!currentBrand?.id && !!id,
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Save (auto-save) a space slot's canvas — objects, cameras, subjects.
 * Invalidates both the detail and by-activity queries.
 */
export function useSaveSpaceSlotCanvas() {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: SaveSpaceSlotCanvasRequest }) =>
            floorPlanApi.spaceSlots.saveCanvas(id, data),
        onSuccess: (result) => {
            // Update detail cache directly
            queryClient.setQueryData(
                spaceSlotKeys.detail(brandId, result.id),
                result,
            );
            // Invalidate list queries
            queryClient.invalidateQueries({
                queryKey: spaceSlotKeys.all(brandId),
            });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'spatial-overlay'] });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'composition-guide'] });
        },
    });
}

/**
 * Update a single camera position's coordinates (for drag-and-drop in overlay).
 */
export function useUpdateSlotCameraPosition() {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, x, y, rotation }: { id: number; x: number; y: number; rotation?: number }) =>
            floorPlanApi.spaceSlots.updateCameraPosition(id, x, y, rotation),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: spaceSlotKeys.all(brandId),
            });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'spatial-overlay'] });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'composition-guide'] });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'moment-conflicts'] });
        },
    });
}

/**
 * Update a single subject position's coordinates (for drag-and-drop in overlay).
 */
export function useUpdateSlotSubjectPosition() {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, x, y, rotation }: { id: number; x: number; y: number; rotation?: number }) =>
            floorPlanApi.spaceSlots.updateSubjectPosition(id, x, y, rotation),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: spaceSlotKeys.all(brandId),
            });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'spatial-overlay'] });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'composition-guide'] });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'moment-conflicts'] });
        },
    });
}

/**
 * Upsert a camera moment override (keyframe position for a specific moment).
 */
export function useUpsertSlotMomentCamera() {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ cameraPositionId, momentId, x, y, rotation }: {
            cameraPositionId: number; momentId: number; x: number; y: number; rotation?: number;
        }) => floorPlanApi.spaceSlots.upsertMomentCamera(cameraPositionId, momentId, x, y, rotation),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: spaceSlotKeys.all(brandId),
            });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'spatial-overlay'] });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'composition-guide'] });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'moment-conflicts'] });
        },
    });
}

/**
 * Upsert a subject moment override (keyframe position for a specific moment).
 */
export function useUpsertSlotMomentSubject() {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ subjectPositionId, momentId, x, y, rotation }: {
            subjectPositionId: number; momentId: number; x: number; y: number; rotation?: number;
        }) => floorPlanApi.spaceSlots.upsertMomentSubject(subjectPositionId, momentId, x, y, rotation),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: spaceSlotKeys.all(brandId),
            });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'spatial-overlay'] });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'composition-guide'] });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'moment-conflicts'] });
        },
    });
}

// ═══════════════════════════════════════════════════════════
// ZONES
// ═══════════════════════════════════════════════════════════

export function useSpaceSlotZones(slotId: number | null | undefined) {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');

    return useQuery({
        queryKey: spaceSlotKeys.zones(brandId, slotId ?? 0),
        queryFn: () => floorPlanApi.spaceSlots.getZones(slotId!),
        enabled: !!currentBrand?.id && !!slotId,
        staleTime: 1000 * 60 * 5,
    });
}

export function useUpsertSpaceSlotZones() {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ slotId, zones }: {
            slotId: number;
            zones: Array<{
                id?: number; name: string; label?: string;
                polygon: Array<{ x: number; y: number }>; color?: string;
                description?: string; order_index?: number;
            }>;
        }) => floorPlanApi.spaceSlots.upsertZones(slotId, zones),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({
                queryKey: spaceSlotKeys.zones(brandId, vars.slotId),
            });
            queryClient.invalidateQueries({
                queryKey: spaceSlotKeys.detail(brandId, vars.slotId),
            });
        },
    });
}

// ═══════════════════════════════════════════════════════════
// BLOCKING ENVIRONMENT / RESOLVED FACING — consumed by backend AI only.
// Frontend hooks removed (unused). Re-add from floorPlanApi when
// a UI consumer is introduced.
// ═══════════════════════════════════════════════════════════
