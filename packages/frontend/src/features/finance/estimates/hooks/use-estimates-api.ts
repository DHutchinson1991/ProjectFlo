'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { estimatesApi } from '../api';
import type { CreateEstimateData, UpdateEstimateData, Estimate } from '../types';
import { estimateKeys } from './queryKeys';

export { estimateKeys };

// ─── Shared setup ─────────────────────────────────────────────────────────────

function useEstimateContext(inquiryId: number | null | undefined) {
    const { currentBrand } = useBrand();
    const queryClient = useQueryClient();
    const brandId = currentBrand?.id ?? null;
    const nInquiryId = inquiryId ?? null;
    const invalidate = () =>
        nInquiryId
            ? queryClient.invalidateQueries({ queryKey: estimateKeys.byInquiry(brandId, nInquiryId) })
            : Promise.resolve();
    return { brandId, nInquiryId, invalidate };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

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

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateEstimate(inquiryId: number | null | undefined) {
    const { nInquiryId, invalidate } = useEstimateContext(inquiryId);
    return useMutation({
        mutationFn: (data: CreateEstimateData) => estimatesApi.create(nInquiryId!, data),
        onSuccess: invalidate,
    });
}

export function useUpdateEstimate(inquiryId: number | null | undefined) {
    const { nInquiryId, invalidate } = useEstimateContext(inquiryId);
    return useMutation({
        mutationFn: ({ estimateId, data }: { estimateId: number; data: UpdateEstimateData }) =>
            estimatesApi.update(nInquiryId!, estimateId, data),
        onSuccess: invalidate,
    });
}

export function useDeleteEstimate(inquiryId: number | null | undefined) {
    const { nInquiryId, invalidate } = useEstimateContext(inquiryId);
    return useMutation({
        mutationFn: (estimateId: number) => estimatesApi.delete(nInquiryId!, estimateId),
        onSuccess: invalidate,
    });
}

export function useSendEstimate(inquiryId: number | null | undefined) {
    const { nInquiryId, invalidate } = useEstimateContext(inquiryId);
    return useMutation({
        mutationFn: (estimateId: number) => estimatesApi.send(nInquiryId!, estimateId),
        onSuccess: invalidate,
    });
}

export function useRefreshEstimateCosts(inquiryId: number | null | undefined) {
    const { nInquiryId, invalidate } = useEstimateContext(inquiryId);
    return useMutation({
        mutationFn: (estimateId: number) => estimatesApi.refresh(nInquiryId!, estimateId),
        onSuccess: invalidate,
    });
}

export function useReviseEstimate(inquiryId: number | null | undefined) {
    const { nInquiryId, invalidate } = useEstimateContext(inquiryId);
    return useMutation({
        mutationFn: (estimateId: number) => estimatesApi.revise(nInquiryId!, estimateId),
        onSuccess: invalidate,
    });
}
