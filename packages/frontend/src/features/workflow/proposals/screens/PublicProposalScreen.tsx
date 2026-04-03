'use client';

import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import ProposalAcceptanceBar from '../components/ProposalAcceptanceBar';
import ProposalView from '../components/ProposalView';
import { scaleIn, shimmer } from '@/features/workflow/proposals/utils/portal/animations';
import { getThemeColors } from '@/features/workflow/proposals/utils/portal/themes';
import { publicProposalsApi } from '../api';
import { proposalKeys } from '../constants';
import { usePublicProposal, useSectionViewTracker } from '../hooks';

export function PublicProposalScreen() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = String(params.token);
  const isPreview = searchParams.get('preview') === 'true';
  const queryClient = useQueryClient();
  const { proposal, isLoading: loading, error } = usePublicProposal(token, isPreview);
  const { onSectionView, onSectionDuration } = useSectionViewTracker(isPreview ? '' : token);

  const [responding, setResponding] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState<string | null>(null);

  const handleSectionNote = useCallback(
    (sectionType: string, note: string) => {
      if (isPreview) return;
      publicProposalsApi.saveSectionNote(token, sectionType, note).then(() => {
        queryClient.invalidateQueries({ queryKey: proposalKeys.publicDetail(token) });
      }).catch(() => {});
    },
    [token, isPreview, queryClient],
  );

  const handleAccept = async () => {
    if (!proposal) return;

    try {
      setResponding(true);
      const updated = await publicProposalsApi.respond(token, 'Accepted');
      setResponseSuccess('accepted');
      queryClient.setQueryData(proposalKeys.publicDetail(token), updated);
    } catch {
      setResponseSuccess(null);
    } finally {
      setResponding(false);
    }
  };

  const handleRequestChanges = async (message: string) => {
    if (!proposal) return;

    try {
      setResponding(true);
      const updated = await publicProposalsApi.respond(token, 'ChangesRequested', message);
      setResponseSuccess('changes');
      queryClient.setQueryData(proposalKeys.publicDetail(token), updated);
    } catch {
      setResponseSuccess(null);
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#09090b',
          gap: 3,
        }}
      >
        {[180, 120, 240].map((width, index) => (
          <Box
            key={width}
            sx={{
              width,
              height: 10,
              borderRadius: 5,
              background: 'linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)',
              backgroundSize: '200% 100%',
              animation: `${shimmer} 1.6s ease-in-out infinite`,
              animationDelay: `${index * 0.15}s`,
            }}
          />
        ))}
      </Box>
    );
  }

  if (error && !proposal) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#09090b',
          p: 3,
        }}
      >
        <Box
          sx={{
            p: 5,
            maxWidth: 420,
            textAlign: 'center',
            bgcolor: '#18181b',
            border: '1px solid #27272a',
            borderRadius: 3,
            animation: `${scaleIn} 0.5s cubic-bezier(0.16, 1, 0.3, 1) both`,
          }}
        >
          <Typography variant="h6" sx={{ color: '#fafafa', mb: 1, fontWeight: 600 }}>
            Proposal Not Found
          </Typography>
          <Typography variant="body2" sx={{ color: '#a1a1aa', lineHeight: 1.6 }}>
            {error || 'This proposal could not be found or may have expired.'}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!proposal) {
    return null;
  }

  const content = proposal.content;
  const colors = getThemeColors(content?.theme);
  const inquiry = proposal.inquiry;
  const contact = inquiry.contact;
  const estimate = inquiry.estimates?.[0];
  const rawQuote = inquiry.quotes?.[0] ?? null;
  const contract = inquiry.contracts?.[0] ?? null;

  // If quote exists but has no payment milestones, fall back to estimate milestones
  const quote = rawQuote && !(rawQuote.payment_milestones?.length) && (estimate as any)?.payment_milestones?.length
    ? { ...rawQuote, payment_milestones: (estimate as any).payment_milestones }
    : rawQuote;
  const clientName = `${contact.first_name} ${contact.last_name}`;
  const alreadyResponded = !!proposal.client_response;
  const isDark = !content?.theme || content.theme === 'cinematic-dark';

  return (
    <ProposalView
      content={content}
      brand={proposal.brand}
      estimate={estimate}
      pkg={inquiry.selected_package}
      eventDays={inquiry.schedule_event_days || []}
      films={inquiry.schedule_films || []}
      phases={proposal.projectPhases || []}
      clientName={clientName}
      weddingDate={inquiry.wedding_date}
      venueDetails={inquiry.venue_details}
      venueAddress={inquiry.venue_address}
      colors={colors}
      quote={quote}
      contract={contract}
      onSectionView={onSectionView}
      onSectionDuration={onSectionDuration}
      onSectionNote={isPreview ? undefined : handleSectionNote}
      sectionNotes={proposal.section_notes}
      personalMessage={proposal.personalMessage}
      expiryDate={(estimate as any)?.expiry_date ?? null}
      ctaSlot={
        <ProposalAcceptanceBar
          colors={colors}
          isDark={isDark}
          alreadyResponded={alreadyResponded}
          clientResponse={proposal.client_response}
          clientResponseMessage={proposal.client_response_message}
          responding={responding}
          responseSuccess={!!responseSuccess}
          onAccept={handleAccept}
          onRequestChanges={handleRequestChanges}
          sectionNotes={proposal.section_notes}
        />
      }
    />
  );
}