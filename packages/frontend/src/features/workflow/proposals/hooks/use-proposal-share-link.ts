'use client';

import { useCallback } from 'react';
import { proposalsApi } from '../api';
import type { Proposal } from '../types';

export function useProposalShareLink() {
  const getShareToken = useCallback(async (inquiryId: number, proposal: Proposal) => {
    if (proposal.share_token) {
      return proposal.share_token;
    }

    return proposalsApi.generateShareToken(inquiryId, proposal.id);
  }, []);

  const getShareUrl = useCallback(async (inquiryId: number, proposal: Proposal) => {
    const token = await getShareToken(inquiryId, proposal);
    return {
      token,
      url: `${window.location.origin}/proposals/${token}`,
    };
  }, [getShareToken]);

  const copyShareUrl = useCallback(async (inquiryId: number, proposal: Proposal) => {
    const share = await getShareUrl(inquiryId, proposal);
    await navigator.clipboard.writeText(share.url);
    return share;
  }, [getShareUrl]);

  const openPreview = useCallback(async (inquiryId: number, proposal: Proposal) => {
    const share = await getShareUrl(inquiryId, proposal);
    window.open(`/proposals/${share.token}`, '_blank');
    return share;
  }, [getShareUrl]);

  return {
    getShareToken,
    getShareUrl,
    copyShareUrl,
    openPreview,
  };
}