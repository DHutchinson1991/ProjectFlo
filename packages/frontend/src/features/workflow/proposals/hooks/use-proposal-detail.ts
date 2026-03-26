'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { proposalsApi } from '../api';
import { proposalKeys } from '../constants';

export function useProposalDetail(inquiryId: number | null | undefined, proposalId: number | null | undefined) {
  const { currentBrand } = useBrand();
  const queryClient = useQueryClient();
  const brandId = currentBrand?.id ?? null;
  const normalizedInquiryId = inquiryId ?? null;
  const normalizedProposalId = proposalId ?? null;

  const query = useQuery({
    queryKey: proposalKeys.detail(brandId, normalizedInquiryId, normalizedProposalId),
    queryFn: () => proposalsApi.getOne(normalizedInquiryId!, normalizedProposalId!),
    enabled:
      !!brandId &&
      !!normalizedInquiryId &&
      !!normalizedProposalId &&
      !Number.isNaN(normalizedInquiryId) &&
      !Number.isNaN(normalizedProposalId),
  });

  const reload = () =>
    normalizedInquiryId && normalizedProposalId
      ? queryClient.invalidateQueries({
          queryKey: proposalKeys.detail(brandId, normalizedInquiryId, normalizedProposalId),
        })
      : Promise.resolve();

  return {
    proposal: query.data ?? null,
    isLoading: query.isPending,
    error: query.error instanceof Error ? query.error.message : null,
    reload,
  };
}