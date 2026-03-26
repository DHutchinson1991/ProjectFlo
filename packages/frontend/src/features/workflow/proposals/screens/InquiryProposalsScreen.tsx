'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as BackIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  OpenInNew as PreviewIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import { proposalsApi } from '../api';
import { ProposalStatusChip } from '../components';
import { useInquiryProposalHeader, useInquiryProposals, useProposalShareLink } from '../hooks';
import type { Proposal } from '../types';

export function InquiryProposalsScreen() {
  const router = useRouter();
  const params = useParams();
  const inquiryId = Number(params.id);
  const { proposals, isLoading: proposalsLoading, error: proposalsError, reload } = useInquiryProposals(inquiryId);
  const { inquiry, isLoading: inquiryLoading, error: inquiryError } = useInquiryProposalHeader(inquiryId);
  const { copyShareUrl } = useProposalShareLink();

  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({ open: true, message, severity });
  };

  const handleGenerate = async () => {
    try {
      await proposalsApi.create(inquiryId, {});
      await reload();
      showNotification('Proposal generated!', 'success');
    } catch {
      showNotification('Failed to generate proposal', 'error');
    }
  };

  const handleCopyLink = async (proposal: Proposal) => {
    try {
      await copyShareUrl(inquiryId, proposal);
      showNotification('Share link copied!', 'success');
    } catch {
      showNotification('Failed to copy link', 'error');
    }
  };

  const handleSend = async (proposalId: number) => {
    try {
      await proposalsApi.sendProposal(inquiryId, proposalId);
      await reload();
      showNotification('Proposal sent!', 'success');
    } catch {
      showNotification('Failed to send proposal', 'error');
    }
  };

  const handleDelete = async (proposalId: number) => {
    if (!confirm('Delete this proposal? This cannot be undone.')) return;

    try {
      await proposalsApi.delete(inquiryId, proposalId);
      await reload();
      showNotification('Proposal deleted', 'success');
    } catch {
      showNotification('Failed to delete proposal', 'error');
    }
  };

  if (proposalsLoading || inquiryLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 780, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => router.back()} sx={{ color: '#94a3b8' }}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#f1f5f9' }}>
            Proposals
          </Typography>
          {inquiry && (
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              {inquiry.contact.first_name} {inquiry.contact.last_name} {'•'} {inquiry.contact.email}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleGenerate}
          sx={{
            textTransform: 'none',
            bgcolor: '#7c4dff',
            fontWeight: 600,
            '&:hover': { bgcolor: '#651fff' },
          }}
        >
          Generate Proposal
        </Button>
      </Stack>

      <Paper
        sx={{
          p: 2,
          mb: 3,
          bgcolor: alpha('#7c4dff', 0.06),
          border: '1px solid',
          borderColor: alpha('#7c4dff', 0.15),
          borderRadius: 2,
        }}
      >
        <Typography variant="body2" sx={{ color: '#a78bfa' }}>
          Proposals are auto-generated from your <strong>Settings {'>'} Proposal Defaults</strong> and the inquiry&apos;s data.
          The hero title is tailored to the event type and the intro message uses the customer&apos;s name.
        </Typography>
      </Paper>

      {(proposalsError || inquiryError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {proposalsError || inquiryError}
        </Alert>
      )}

      {proposals.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: '#161b22',
            border: '1px solid #1e1e1e',
            borderRadius: 2,
          }}
        >
          <Typography sx={{ color: '#94a3b8', mb: 2 }}>No proposals generated yet.</Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleGenerate}
            sx={{ textTransform: 'none' }}
          >
            Generate First Proposal
          </Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {proposals.map((proposal) => (
            <Paper
              key={proposal.id}
              sx={{
                p: 2,
                bgcolor: '#161b22',
                border: '1px solid #1e1e1e',
                borderRadius: 2,
                '&:hover': { borderColor: '#333' },
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#e0e0e0' }}>
                      {proposal.title}
                    </Typography>
                    <ProposalStatusChip status={proposal.status} />
                  </Stack>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    v{proposal.version} {'•'} Created {proposal.created_at.toLocaleDateString()}
                    {proposal.sent_at && ` • Sent ${proposal.sent_at.toLocaleDateString()}`}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={0.5}>
                  <IconButton onClick={() => router.push(`/sales/inquiries/${inquiryId}/proposals/${proposal.id}`)} sx={{ color: '#94a3b8' }}>
                    <PreviewIcon />
                  </IconButton>
                  <IconButton onClick={() => void handleCopyLink(proposal)} sx={{ color: '#94a3b8' }}>
                    <LinkIcon />
                  </IconButton>
                  {proposal.status === 'Draft' && (
                    <IconButton onClick={() => void handleSend(proposal.id)} sx={{ color: '#94a3b8' }}>
                      <SendIcon />
                    </IconButton>
                  )}
                  <IconButton onClick={() => void handleDelete(proposal.id)} sx={{ color: '#ef4444' }}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification((prev) => ({ ...prev, open: false }))}>
        <Alert onClose={() => setNotification((prev) => ({ ...prev, open: false }))} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}