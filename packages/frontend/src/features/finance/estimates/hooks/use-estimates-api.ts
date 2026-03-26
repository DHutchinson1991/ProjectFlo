'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { estimatesApi } from '../api';
import type { CreateEstimateData, UpdateEstimateData, Estimate } from '../types';

export const estimateKeys = {
    all: ['estimates'] as const,
    byInquiry: (brandId: number | null, inquiryId: number | null) =>
        ['estimates', 'inquiry', brandId, inquiryId] as const,
    detail: (brandId: number | null, inquiryId: number | null, estimateId: number | null) =>
        ['estimates', 'detail', brandId, inquiryId, estimateId] as const,
    snapshots: (brandId: number | null, inquiryId: number | null, estimateId: number | null) =>
        ['estimates', 'snapshots', brandId, inquiryId, estimateId] as const,
};

export function useInquiryEstimates(inquiryId: number | null | undefined) {
    const { currentBrand } = useBrand();
    const queryClient = useQueryClient();
    const brandId = currentBrand?.id ?? null;
    const nInquiryId = inquiryId ?? null;

    const query = useQuery({
        queryKey: estimateKeys.byInquiry(brandId, nInquiryId),
        queryFn: () => estimatesApi.getAllByInquiry(nInquiryId!),
        enabled: !!brandId && !!nInquiryId,
    });

    return {
        estimates: query.data ?? ([] as Estimate[]),
        isLoading: query.isPending,
        error: query.error instanceof Error ? query.error.message : null,
        reload: () =>
            nInquiryId
                ? queryClient.invalidateQueries({ queryKey: estimateKeys.byInquiry(brandId, nInquiryId) })
                : Promise.resolve(),
    };
}

export function useEstimateDetail(inquiryId: number | null | undefined, estimateId: number | null | undefined) {
    const { currentBrand } = useBrand();
    const queryClient = useQueryClient();
    const brandId = currentBrand?.id ?? null;
    const nInquiryId = inquiryId ?? null;
    const nEstimateId = estimateId ?? null;

    const query = useQuery({
        queryKey: estimateKeys.detail(brandId, nInquiryId, nEstimateId),
        queryFn: () => estimatesApi.getById(nInquiryId!, nEstimateId!),
        enabled: !!brandId && !!nInquiryId && !!nEstimateId,
    });

    return {
        estimate: query.data ?? null,
        isLoading: query.isPending,
        error: query.error instanceof Error ? query.error.message : null,
        reload: () =>
            nInquiryId && nEstimateId
                ? queryClient.invalidateQueries({ queryKey: estimateKeys.detail(brandId, nInquiryId, nEstimateId) })
                : Promise.resolve(),
    };
}

export function useEstimateMutations(inquiryId: number | null | undefined) {
    const { currentBrand } = useBrand();
    const queryClient = useQueryClient();
    const brandId = currentBrand?.id ?? null;
    const nInquiryId = inquiryId ?? null;

    const invalidateList = () =>
        nInquiryId
            ? queryClient.invalidateQueries({ queryKey: estimateKeys.byInquiry(brandId, nInquiryId) })
            : Promise.resolve();

    const createMutation = useMutation({
        mutationFn: (data: CreateEstimateData) => estimatesApi.create(nInquiryId!, data),
        onSuccess: invalidateList,
    });

    const updateMutation = useMutation({
        mutationFn: ({ estimateId, data }: { estimateId: number; data: UpdateEstimateData }) =>
            estimatesApi.update(nInquiryId!, estimateId, data),
        onSuccess: invalidateList,
    });

    const deleteMutation = useMutation({
        mutationFn: (estimateId: number) => estimatesApi.delete(nInquiryId!, estimateId),
        onSuccess: invalidateList,
    });

    const sendMutation = useMutation({
        mutationFn: (estimateId: number) => estimatesApi.send(nInquiryId!, estimateId),
        onSuccess: invalidateList,
    });

    const refreshMutation = useMutation({
        mutationFn: (estimateId: number) => estimatesApi.refresh(nInquiryId!, estimateId),
        onSuccess: invalidateList,
    });

    const reviseMutation = useMutation({
        mutationFn: (estimateId: number) => estimatesApi.revise(nInquiryId!, estimateId),
        onSuccess: invalidateList,
    });

    return {
        createEstimate: createMutation.mutateAsync,
        updateEstimate: (estimateId: number, data: UpdateEstimateData) =>
            updateMutation.mutateAsync({ estimateId, data }),
        deleteEstimate: deleteMutation.mutateAsync,
        sendEstimate: sendMutation.mutateAsync,
        refreshEstimate: refreshMutation.mutateAsync,
        reviseEstimate: reviseMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
