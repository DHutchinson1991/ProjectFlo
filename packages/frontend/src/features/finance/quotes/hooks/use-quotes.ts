'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { quotesApi } from '../api';
import type { CreateQuoteData, Quote, UpdateQuoteData } from '../types';
import { quoteKeys } from './queryKeys';

export function useInquiryQuotes(inquiryId: number | null | undefined) {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id ?? null;
    const nInquiryId = inquiryId ?? null;

    const query = useQuery({
        queryKey: quoteKeys.byInquiry(brandId, nInquiryId),
        queryFn: () => quotesApi.getAllByInquiry(nInquiryId!),
        enabled: !!brandId && !!nInquiryId,
        staleTime: 1000 * 60 * 2,
    });

    return {
        quotes: query.data ?? ([] as Quote[]),
        isLoading: query.isPending,
        error: query.error instanceof Error ? query.error.message : null,
    };
}

export function useQuoteMutations(inquiryId: number | null | undefined) {
    const { currentBrand } = useBrand();
    const queryClient = useQueryClient();
    const brandId = currentBrand?.id ?? null;
    const nInquiryId = inquiryId ?? null;

    const invalidateList = () =>
        nInquiryId
            ? queryClient.invalidateQueries({ queryKey: quoteKeys.byInquiry(brandId, nInquiryId) })
            : Promise.resolve();

    const createQuote = useMutation({
        mutationFn: (data: CreateQuoteData) => quotesApi.create(nInquiryId!, data),
        onSuccess: invalidateList,
    });

    const updateQuote = useMutation({
        mutationFn: ({ quoteId, data }: { quoteId: number; data: UpdateQuoteData }) =>
            quotesApi.update(nInquiryId!, quoteId, data),
        onSuccess: invalidateList,
    });

    const deleteQuote = useMutation({
        mutationFn: (quoteId: number) => quotesApi.delete(nInquiryId!, quoteId),
        onSuccess: invalidateList,
    });

    return { createQuote, updateQuote, deleteQuote };
}
