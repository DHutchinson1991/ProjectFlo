'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { publicProposalsApi } from '../api';
import { proposalKeys } from '../constants';

export function usePublicProposal(token: string | null | undefined, preview = false) {
  const queryClient = useQueryClient();
  const normalizedToken = token ?? null;

  const query = useQuery({
    queryKey: proposalKeys.publicDetail(normalizedToken),
    queryFn: () => publicProposalsApi.getByShareToken(normalizedToken!, preview),
    enabled: !!normalizedToken,
    refetchInterval: preview ? false : 5_000,
  });

  const reload = () =>
    normalizedToken
      ? queryClient.invalidateQueries({ queryKey: proposalKeys.publicDetail(normalizedToken) })
      : Promise.resolve();

  return {
    proposal: query.data ?? null,
    isLoading: query.isPending,
    error: query.error instanceof Error ? query.error.message : null,
    reload,
  };
}