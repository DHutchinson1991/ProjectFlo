'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { useBrand } from '@/features/platform/brand';
import { proposalKeys } from '../constants';
import type { ProposalInquiryHeader } from '../types';

export function useInquiryProposalHeader(inquiryId: number | null | undefined) {
  const { currentBrand } = useBrand();
  const queryClient = useQueryClient();
  const brandId = currentBrand?.id ?? null;
  const normalizedInquiryId = inquiryId ?? null;

  const query = useQuery({
    queryKey: proposalKeys.inquiryHeader(brandId, normalizedInquiryId),
    queryFn: async (): Promise<ProposalInquiryHeader> => {
      const inquiry = await inquiriesApi.getById(normalizedInquiryId!);
      return {
        id: inquiry.id,
        contact: {
          first_name: inquiry.contact.first_name,
          last_name: inquiry.contact.last_name,
          email: inquiry.contact.email,
        },
      };
    },
    enabled: !!brandId && !!normalizedInquiryId && !Number.isNaN(normalizedInquiryId),
  });

  const reload = () =>
    normalizedInquiryId
      ? queryClient.invalidateQueries({ queryKey: proposalKeys.inquiryHeader(brandId, normalizedInquiryId) })
      : Promise.resolve();

  return {
    inquiry: query.data ?? null,
    isLoading: query.isPending,
    error: query.error instanceof Error ? query.error.message : null,
    reload,
  };
}