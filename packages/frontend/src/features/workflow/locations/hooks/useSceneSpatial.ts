'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { floorPlanApi } from '../api';
import type {
    UpsertCameraPositionRequest,
    UpsertSubjectPositionRequest,
    UpsertMomentCameraPositionRequest,
    UpsertMomentSubjectPositionRequest,
} from '../types/floor-plan.types';

export const sceneSpatialKeys = {
    all: (brandId: string) => ['scene-spatial', brandId] as const,
    layout: (brandId: string, sceneId: number) =>
        [...sceneSpatialKeys.all(brandId), 'layout', sceneId] as const,
    momentLayout: (brandId: string, sceneId: number, momentId: number) =>
        [...sceneSpatialKeys.layout(brandId, sceneId), 'moment', momentId] as const,
};

export function useSceneSpatialLayout(sceneId: number | null | undefined) {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');

    return useQuery({
        queryKey: sceneSpatialKeys.layout(brandId, sceneId!),
        queryFn: () => floorPlanApi.sceneSpatial.getLayout(sceneId!),
        enabled: !!currentBrand?.id && !!sceneId,
        staleTime: 1000 * 60 * 2,
    });
}

export function useUpsertCameraPosition() {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sceneId,
            data,
        }: {
            sceneId: number;
            data: UpsertCameraPositionRequest;
        }) => floorPlanApi.sceneSpatial.upsertCamera(sceneId, data),
        onSuccess: (_, { sceneId }) => {
            queryClient.invalidateQueries({
                queryKey: sceneSpatialKeys.layout(brandId, sceneId),
            });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'spatial-overlay'] });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'composition-guide'] });
        },
    });
}

export function useUpsertSubjectPosition() {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sceneId,
            data,
        }: {
            sceneId: number;
            data: UpsertSubjectPositionRequest;
        }) => floorPlanApi.sceneSpatial.upsertSubject(sceneId, data),
        onSuccess: (_, { sceneId }) => {
            queryClient.invalidateQueries({
                queryKey: sceneSpatialKeys.layout(brandId, sceneId),
            });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'spatial-overlay'] });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'composition-guide'] });
        },
    });
}

export function useRemoveCameraPosition() {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sceneId,
            trackId,
        }: {
            sceneId: number;
            trackId: number;
        }) => floorPlanApi.sceneSpatial.removeCamera(sceneId, trackId),
        onSuccess: (_, { sceneId }) => {
            queryClient.invalidateQueries({
                queryKey: sceneSpatialKeys.layout(brandId, sceneId),
            });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'spatial-overlay'] });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'composition-guide'] });
        },
    });
}

export function useRemoveSubjectPosition() {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sceneId,
            subjectId,
        }: {
            sceneId: number;
            subjectId: number;
        }) => floorPlanApi.sceneSpatial.removeSubject(sceneId, subjectId),
        onSuccess: (_, { sceneId }) => {
            queryClient.invalidateQueries({
                queryKey: sceneSpatialKeys.layout(brandId, sceneId),
            });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'spatial-overlay'] });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'composition-guide'] });
        },
    });
}

// ── Moment-Level Spatial Hooks (Keyframe Overrides) ─────────────

export function useMomentSpatialLayout(
    sceneId: number | null | undefined,
    momentId: number | null | undefined,
) {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');

    return useQuery({
        queryKey: sceneSpatialKeys.momentLayout(brandId, sceneId!, momentId!),
        queryFn: () => floorPlanApi.sceneSpatial.getMomentLayout(sceneId!, momentId!),
        enabled: !!currentBrand?.id && !!sceneId && !!momentId,
        staleTime: 1000 * 60 * 2,
    });
}

export function useUpsertMomentCameraPosition() {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sceneId,
            momentId,
            data,
        }: {
            sceneId: number;
            momentId: number;
            data: UpsertMomentCameraPositionRequest;
        }) => floorPlanApi.sceneSpatial.upsertMomentCamera(sceneId, momentId, data),
        onSuccess: (_, { sceneId, momentId }) => {
            queryClient.invalidateQueries({
                queryKey: sceneSpatialKeys.momentLayout(brandId, sceneId, momentId),
            });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'spatial-overlay'] });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'composition-guide'] });
        },
    });
}

export function useUpsertMomentSubjectPosition() {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sceneId,
            momentId,
            data,
        }: {
            sceneId: number;
            momentId: number;
            data: UpsertMomentSubjectPositionRequest;
        }) => floorPlanApi.sceneSpatial.upsertMomentSubject(sceneId, momentId, data),
        onSuccess: (_, { sceneId, momentId }) => {
            queryClient.invalidateQueries({
                queryKey: sceneSpatialKeys.momentLayout(brandId, sceneId, momentId),
            });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'spatial-overlay'] });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'composition-guide'] });
        },
    });
}

export function useRemoveMomentCameraPosition() {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sceneId,
            momentId,
            trackId,
        }: {
            sceneId: number;
            momentId: number;
            trackId: number;
        }) => floorPlanApi.sceneSpatial.removeMomentCamera(sceneId, momentId, trackId),
        onSuccess: (_, { sceneId, momentId }) => {
            queryClient.invalidateQueries({
                queryKey: sceneSpatialKeys.momentLayout(brandId, sceneId, momentId),
            });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'spatial-overlay'] });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'composition-guide'] });
        },
    });
}

export function useRemoveMomentSubjectPosition() {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sceneId,
            momentId,
            subjectId,
        }: {
            sceneId: number;
            momentId: number;
            subjectId: number;
        }) => floorPlanApi.sceneSpatial.removeMomentSubject(sceneId, momentId, subjectId),
        onSuccess: (_, { sceneId, momentId }) => {
            queryClient.invalidateQueries({
                queryKey: sceneSpatialKeys.momentLayout(brandId, sceneId, momentId),
            });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'spatial-overlay'] });
            queryClient.invalidateQueries({ queryKey: ['shot-previews', 'composition-guide'] });
        },
    });
}
