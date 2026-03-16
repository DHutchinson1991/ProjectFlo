'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Box, Typography, CircularProgress, Button,
    Snackbar, Alert, Chip, Stack, Paper, alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import LinkIcon from '@mui/icons-material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteIcon from '@mui/icons-material/Delete';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { proposalsService } from '@/lib/api';
import type { Proposal } from '@/lib/types/domains/sales';
import { useBrand } from '@/app/providers/BrandProvider';

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
    Draft: { bg: alpha('#ff9800', 0.15), color: '#ffb74d', label: 'Draft' },
    Sent: { bg: alpha('#2196f3', 0.15), color: '#64b5f6', label: 'Sent' },
    Accepted: { bg: alpha('#4caf50', 0.15), color: '#66bb6a', label: 'Accepted' },
    Declined: { bg: alpha('#f44336', 0.15), color: '#ef5350', label: 'Declined' },
};

export default function ProposalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { currentBrand } = useBrand();
    const inquiryId = Number(Array.isArray(params.inquiryId) ? params.inquiryId[0] : params.inquiryId);
    const proposalId = Number(Array.isArray(params.proposalId) ? params.proposalId[0] : params.proposalId);

    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        if (!currentBrand || isNaN(inquiryId) || isNaN(proposalId)) return;
        (async () => {
            try {
                const data = await proposalsService.getOne(inquiryId, proposalId);
                setProposal(data as Proposal);
            } catch {
                setNotification({ message: 'Failed to load proposal.', severity: 'error' });
            } finally {
                setIsLoading(false);
            }
        })();
    }, [currentBrand, inquiryId, proposalId]);

    const handleSend = async () => {
        if (!proposal) return;
        try {
            const updated = await proposalsService.sendProposal(inquiryId, proposal.id);
            setProposal(updated as Proposal);
            setNotification({ message: 'Proposal sent!', severity: 'success' });
        } catch {
            setNotification({ message: 'Failed to send proposal.', severity: 'error' });
        }
    };

    const handleCopyLink = async () => {
        if (!proposal) return;
        try {
            const token = proposal.share_token || await proposalsService.generateShareToken(inquiryId, proposal.id);
            const shareUrl = `${window.location.origin}/proposals/${token}`;
            await navigator.clipboard.writeText(shareUrl);
            if (!proposal.share_token) setProposal(prev => prev ? { ...prev, share_token: token } : prev);
            setNotification({ message: 'Share link copied!', severity: 'success' });
        } catch {
            setNotification({ message: 'Failed to copy link.', severity: 'error' });
        }
    };

    const handlePreview = () => {
        if (!proposal?.share_token) return;
        window.open(`/proposals/${proposal.share_token}`, '_blank');
    };

    const handleRegenerate = async () => {
        if (!proposal) return;
        try {
            await proposalsService.delete(inquiryId, proposal.id);
            const newProp = await proposalsService.create(inquiryId, {});
            setProposal(newProp as Proposal);
            setNotification({ message: 'Proposal regenerated from current settings!', severity: 'success' });
        } catch {
            setNotification({ message: 'Failed to regenerate.', severity: 'error' });
        }
    };

    const handleDelete = async () => {
        if (!proposal || !confirm('Delete this proposal? This cannot be undone.')) return;
        try {
            await proposalsService.delete(inquiryId, proposal.id);
            router.push(`/inquiries/${inquiryId}/proposals`);
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
                <Button sx={{ mt: 2 }} onClick={() => router.back()}>Go Back</Button>
            </Box>
        );
    }

    const status = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.Draft;
    const contactName = proposal.inquiry
        ? `${proposal.inquiry.contact.first_name} ${proposal.inquiry.contact.last_name}`
        : '';

    return (
        <Box sx={{ maxWidth: 720, mx: 'auto', p: { xs: 2, md: 4 } }}>
            {/* Back */}
            <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/inquiries/${inquiryId}/proposals`)} sx={{ mb: 3, textTransform: 'none', color: '#94a3b8' }}>
                Back to Proposals
            </Button>

            {/* Header */}
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
                        <Chip icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} label={proposal.client_response} size="small" color={proposal.client_response === 'Accepted' ? 'success' : 'warning'} variant="outlined" sx={{ height: 22 }} />
                    )}
                </Stack>
            </Paper>

            {/* Auto-generated notice */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: alpha('#7c4dff', 0.06), border: '1px solid', borderColor: alpha('#7c4dff', 0.15), borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: '#a78bfa' }}>
                    This proposal was auto-generated from your Proposal Settings and the inquiry&rsquo;s data. To change the template, update your <strong>Settings &gt; Proposal Defaults</strong>.
                </Typography>
            </Paper>

            {/* Actions */}
            <Stack spacing={1.5}>
                {proposal.share_token && (
                    <Button fullWidth variant="outlined" startIcon={<OpenInNewIcon />} onClick={handlePreview} sx={{ textTransform: 'none', borderColor: '#333', color: '#e0e0e0', justifyContent: 'flex-start', '&:hover': { borderColor: '#7c4dff', bgcolor: alpha('#7c4dff', 0.06) } }}>
                        Preview Proposal
                    </Button>
                )}

                <Button fullWidth variant="outlined" startIcon={<LinkIcon />} onClick={handleCopyLink} sx={{ textTransform: 'none', borderColor: '#333', color: '#e0e0e0', justifyContent: 'flex-start', '&:hover': { borderColor: '#7c4dff', bgcolor: alpha('#7c4dff', 0.06) } }}>
                    Copy Share Link
                </Button>

                {proposal.status === 'Draft' && (
                    <Button fullWidth variant="contained" startIcon={<SendIcon />} onClick={handleSend} sx={{ textTransform: 'none', bgcolor: '#7c4dff', fontWeight: 600, '&:hover': { bgcolor: '#651fff' } }}>
                        Send Proposal
                    </Button>
                )}

                <Button fullWidth variant="outlined" startIcon={<AutorenewIcon />} onClick={handleRegenerate} sx={{ textTransform: 'none', borderColor: '#333', color: '#94a3b8', justifyContent: 'flex-start', '&:hover': { borderColor: '#ff9800', bgcolor: alpha('#ff9800', 0.06) } }}>
                    Regenerate from Settings
                </Button>

                <Button fullWidth variant="outlined" startIcon={<DeleteIcon />} color="error" onClick={handleDelete} sx={{ textTransform: 'none', justifyContent: 'flex-start' }}>
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
