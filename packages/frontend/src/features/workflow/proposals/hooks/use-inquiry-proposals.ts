'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { proposalsApi } from '../api';
import { proposalKeys } from '../constants';
import type { Proposal } from '../types';

export function useInquiryProposals(inquiryId: number | null | undefined) {
  const { currentBrand } = useBrand();
  const queryClient = useQueryClient();
  const brandId = currentBrand?.id ?? null;
  const normalizedInquiryId = inquiryId ?? null;

  const query = useQuery({
    queryKey: proposalKeys.byInquiry(brandId, normalizedInquiryId),
    queryFn: () => proposalsApi.getAllByInquiry(normalizedInquiryId!),
    enabled: !!brandId && !!normalizedInquiryId && !Number.isNaN(normalizedInquiryId),
  });

  const reload = () =>
    normalizedInquiryId
      ? queryClient.invalidateQueries({ queryKey: proposalKeys.byInquiry(brandId, normalizedInquiryId) })
      : Promise.resolve();

  return {
    proposals: query.data ?? ([] as Proposal[]),
    isLoading: query.isPending,
    error: query.error instanceof Error ? query.error.message : null,
    reload,
  };
}