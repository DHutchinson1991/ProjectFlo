'use client';

import { useCallback } from 'react';
import { proposalsApi } from '../api';
import { clientPortalApi } from '@/features/workflow/client-portal/api';
import type { Proposal } from '../types';

export function useProposalShareLink() {
  const getShareToken = useCallback(async (inquiryId: number, proposal: Proposal) => {
    if (proposal.share_token) {
      return proposal.share_token;
    }

    return proposalsApi.generateShareToken(inquiryId, proposal.id);
  }, []);

  /** Get the shareable portal URL for a proposal */
  const getPortalUrl = useCallback(async (inquiryId: number) => {
    const { portal_token } = await clientPortalApi.generateToken(inquiryId);
    return {
      token: portal_token,
      url: `${window.location.origin}/portal/${portal_token}?tab=proposal`,
    };
  }, []);

  const copyShareUrl = useCallback(async (inquiryId: number) => {
    const share = await getPortalUrl(inquiryId);
    await navigator.clipboard.writeText(share.url);
    return share;
  }, [getPortalUrl]);

  /** Opens the client portal with the proposal tab selected and ?preview to skip analytics */
  const openPreview = useCallback(async (inquiryId: number) => {
    const { portal_token } = await clientPortalApi.generateToken(inquiryId);
    window.open(`/portal/${portal_token}?tab=proposal&preview`, '_blank');
  }, []);

  return {
    getShareToken,
    getPortalUrl,
    copyShareUrl,
    openPreview,
  };
}