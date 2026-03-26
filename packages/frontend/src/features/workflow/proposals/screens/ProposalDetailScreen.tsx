'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SendIcon from '@mui/icons-material/Send';
import { useBrand } from '@/features/platform/brand';
import { proposalsApi } from '../api';
import { proposalKeys } from '../constants';
import { useProposalDetail, useProposalShareLink } from '../hooks';

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  Draft: { bg: alpha('#ff9800', 0.15), color: '#ffb74d', label: 'Draft' },
  Sent: { bg: alpha('#2196f3', 0.15), color: '#64b5f6', label: 'Sent' },
  Accepted: { bg: alpha('#4caf50', 0.15), color: '#66bb6a', label: 'Accepted' },
  Declined: { bg: alpha('#f44336', 0.15), color: '#ef5350', label: 'Declined' },
};

export function ProposalDetailScreen() {
  const params = useParams();
  const router = useRouter();
  const { currentBrand } = useBrand();
  const queryClient = useQueryClient();
  const inquiryId = Number(params.id);
  const proposalId = Number(params.proposalId);
  const brandId = currentBrand?.id ?? null;
  const { copyShareUrl, getShareToken } = useProposalShareLink();
  const { proposal, isLoading, error } = useProposalDetail(inquiryId, proposalId);

  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' | 'info' } | null>(null);

  const handleSend = async () => {
    if (!proposal) return;

    try {
      const updated = await proposalsApi.sendProposal(inquiryId, proposal.id);
      queryClient.setQueryData(proposalKeys.detail(brandId, inquiryId, proposal.id), updated);
      await queryClient.invalidateQueries({ queryKey: proposalKeys.byInquiry(brandId, inquiryId) });
      setNotification({ message: 'Proposal sent!', severity: 'success' });
    } catch {
      setNotification({ message: 'Failed to send proposal.', severity: 'error' });
    }
  };

  const handleCopyLink = async () => {
    if (!proposal) return;

    try {
      const share = await copyShareUrl(inquiryId, proposal);
      if (!proposal.share_token) {
        queryClient.setQueryData(proposalKeys.detail(brandId, inquiryId, proposal.id), {
          ...proposal,
          share_token: share.token,
        });
        await queryClient.invalidateQueries({ queryKey: proposalKeys.byInquiry(brandId, inquiryId) });
      }
      setNotification({ message: 'Share link copied!', severity: 'success' });
    } catch {
      setNotification({ message: 'Failed to copy link.', severity: 'error' });
    }
  };

  const handlePreview = async () => {
    if (!proposal) return;

    try {
      const token = await getShareToken(inquiryId, proposal);
      if (!proposal.share_token) {
        queryClient.setQueryData(proposalKeys.detail(brandId, inquiryId, proposal.id), {
          ...proposal,
          share_token: token,
        });
        await queryClient.invalidateQueries({ queryKey: proposalKeys.byInquiry(brandId, inquiryId) });
      }
      window.open(`/proposals/${token}`, '_blank');
    } catch {
      setNotification({ message: 'Failed to generate preview link.', severity: 'error' });
    }
  };

  const handleRegenerate = async () => {
    if (!proposal) return;

    try {
      await proposalsApi.delete(inquiryId, proposal.id);
      const nextProposal = await proposalsApi.create(inquiryId, {});
      await queryClient.invalidateQueries({ queryKey: proposalKeys.byInquiry(brandId, inquiryId) });
      await queryClient.removeQueries({ queryKey: proposalKeys.detail(brandId, inquiryId, proposal.id) });
      queryClient.setQueryData(proposalKeys.detail(brandId, inquiryId, nextProposal.id), nextProposal);
      router.replace(`/sales/inquiries/${inquiryId}/proposals/${nextProposal.id}`);
      setNotification({ message: 'Proposal regenerated from current settings!', severity: 'success' });
    } catch {
      setNotification({ message: 'Failed to regenerate.', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!proposal || !confirm('Delete this proposal? This cannot be undone.')) return;

    try {
      await proposalsApi.delete(inquiryId, proposal.id);
      await queryClient.invalidateQueries({ queryKey: proposalKeys.byInquiry(brandId, inquiryId) });
      await queryClient.removeQueries({ queryKey: proposalKeys.detail(brandId, inquiryId, proposal.id) });
      router.push(`/sales/inquiries/${inquiryId}/proposals`);
    } catch {
      setNotification({ message: 'Failed to delete.', severity: 'error' });
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!proposal) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">Proposal not found.</Typography>
        {error && <Typography variant="body2" sx={{ mt: 1, color: '#94a3b8' }}>{error}</Typography>}
        <Button sx={{ mt: 2 }} onClick={() => router.back()}>
          Go Back
        </Button>
      </Box>
    );
  }

  const status = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.Draft;
  const contactName = proposal.inquiry
    ? `${proposal.inquiry.contact.first_name} ${proposal.inquiry.contact.last_name}`
    : '';

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(`/sales/inquiries/${inquiryId}/proposals`)}
        sx={{ mb: 3, textTransform: 'none', color: '#94a3b8' }}
      >
        Back to Proposals
      </Button>

      <Paper sx={{ p: 3, mb: 3, bgcolor: '#161b22', border: '1px solid #1e1e1e', borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#f1f5f9' }}>
            {proposal.title}
          </Typography>
          <Chip label={status.label} size="small" sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700 }} />
        </Stack>

        {contactName && (
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
            For {contactName}
          </Typography>
        )}

        <Stack direction="row" spacing={2} sx={{ color: '#64748b', fontSize: '0.8rem' }}>
          <Typography variant="caption">Created {proposal.created_at.toLocaleDateString()}</Typography>
          {proposal.sent_at && <Typography variant="caption">Sent {proposal.sent_at.toLocaleDateString()}</Typography>}
          {proposal.client_response && (
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
              label={proposal.client_response}
              size="small"
              color={proposal.client_response === 'Accepted' ? 'success' : 'warning'}
              variant="outlined"
              sx={{ height: 22 }}
            />
          )}
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

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
          This proposal was auto-generated from your Proposal Settings and the inquiry&apos;s data. To change the template,
          update your <strong>Settings {'>'} Proposal Defaults</strong>.
        </Typography>
      </Paper>

      <Stack spacing={1.5}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<OpenInNewIcon />}
          onClick={() => void handlePreview()}
          sx={{
            textTransform: 'none',
            borderColor: '#333',
            color: '#e0e0e0',
            justifyContent: 'flex-start',
            '&:hover': { borderColor: '#7c4dff', bgcolor: alpha('#7c4dff', 0.06) },
          }}
        >
          Preview Proposal
        </Button>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<LinkIcon />}
          onClick={() => void handleCopyLink()}
          sx={{
            textTransform: 'none',
            borderColor: '#333',
            color: '#e0e0e0',
            justifyContent: 'flex-start',
            '&:hover': { borderColor: '#7c4dff', bgcolor: alpha('#7c4dff', 0.06) },
          }}
        >
          Copy Share Link
        </Button>

        {proposal.status === 'Draft' && (
          <Button
            fullWidth
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => void handleSend()}
            sx={{ textTransform: 'none', bgcolor: '#7c4dff', fontWeight: 600, '&:hover': { bgcolor: '#651fff' } }}
          >
            Send Proposal
          </Button>
        )}

        <Button
          fullWidth
          variant="outlined"
          startIcon={<AutorenewIcon />}
          onClick={() => void handleRegenerate()}
          sx={{
            textTransform: 'none',
            borderColor: '#333',
            color: '#94a3b8',
            justifyContent: 'flex-start',
            '&:hover': { borderColor: '#ff9800', bgcolor: alpha('#ff9800', 0.06) },
          }}
        >
          Regenerate from Settings
        </Button>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<DeleteIcon />}
          color="error"
          onClick={() => void handleDelete()}
          sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
        >
          Delete Proposal
        </Button>
      </Stack>

      <Snackbar open={!!notification} autoHideDuration={4000} onClose={() => setNotification(null)}>
        <Alert onClose={() => setNotification(null)} severity={notification?.severity || 'info'} sx={{ width: '100%' }}>
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}