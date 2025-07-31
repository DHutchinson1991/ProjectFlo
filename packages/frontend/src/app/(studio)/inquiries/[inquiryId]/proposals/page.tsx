"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Alert,
    Snackbar,
    Chip,
    Paper,
    CircularProgress,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Send as SendIcon,
    Visibility as ViewIcon,
    ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { proposalsService, inquiriesService } from '@/lib/api';
import { Proposal, Inquiry, CreateProposalData } from '@/lib/types';
import { useBrand } from '../../../../providers/BrandProvider';

export default function ProposalsPage() {
    // Brand context
    const { currentBrand } = useBrand();

    // Router and params
    const router = useRouter();
    const params = useParams();
    const inquiryId = parseInt(params.inquiryId as string);

    // State
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [inquiry, setInquiry] = useState<Inquiry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Load data
    useEffect(() => {
        if (!currentBrand || isNaN(inquiryId)) return;
        loadData();
    }, [currentBrand, inquiryId]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            // Load inquiry details and proposals
            const [inquiryData, proposalsData] = await Promise.all([
                inquiriesService.getById(inquiryId),
                proposalsService.getAllByInquiry(inquiryId)
            ]);
            setInquiry(inquiryData);
            setProposals(proposalsData);
        } catch (error) {
            console.error('Failed to load data:', error);
            showNotification('Failed to load proposals data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
        setNotification({ open: true, message, severity });
    };

    const handleCloseNotification = () => {
        setNotification(prev => ({ ...prev, open: false }));
    };

    const handleCreateProposal = async () => {
        try {
            const proposalData: CreateProposalData = {
                title: `Proposal for ${inquiry?.contact.first_name} ${inquiry?.contact.last_name}`,
                content: {
                    blocks: [
                        {
                            type: "header",
                            data: {
                                text: "Wedding Video Proposal",
                                level: 1
                            }
                        },
                        {
                            type: "paragraph",
                            data: {
                                text: "Thank you for considering us for your special day. We're excited to create a beautiful video that captures your wedding memories."
                            }
                        }
                    ]
                }
            };

            const newProposal = await proposalsService.create(inquiryId, proposalData);
            showNotification('Proposal created successfully!', 'success');

            // Navigate to the new proposal editor
            router.push(`/inquiries/${inquiryId}/proposals/${newProposal.id}`);
        } catch (error) {
            console.error('Failed to create proposal:', error);
            showNotification('Failed to create proposal', 'error');
        }
    };

    const handleViewProposal = (proposalId: number) => {
        router.push(`/inquiries/${inquiryId}/proposals/${proposalId}`);
    };

    const handleDeleteProposal = async (proposalId: number) => {
        if (!confirm('Are you sure you want to delete this proposal?')) return;

        try {
            await proposalsService.delete(inquiryId, proposalId);
            setProposals(prev => prev.filter(p => p.id !== proposalId));
            showNotification('Proposal deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete proposal:', error);
            showNotification('Failed to delete proposal', 'error');
        }
    };

    const handleSendProposal = async (proposalId: number) => {
        try {
            await proposalsService.sendProposal(inquiryId, proposalId);
            showNotification('Proposal sent successfully!', 'success');
            await loadData(); // Refresh to update status
        } catch (error) {
            console.error('Failed to send proposal:', error);
            showNotification('Failed to send proposal', 'error');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Draft': return 'default';
            case 'Sent': return 'primary';
            case 'Accepted': return 'success';
            case 'Rejected': return 'error';
            default: return 'default';
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => router.back()}>
                    <BackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Proposals
                    </Typography>
                    {inquiry && (
                        <Typography variant="subtitle1" color="text.secondary">
                            For {inquiry.contact.first_name} {inquiry.contact.last_name} • {inquiry.contact.email}
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Create Proposal Button */}
            <Box sx={{ mb: 3 }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateProposal}
                >
                    Create New Proposal
                </Button>
            </Box>

            {/* Proposals List */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Proposals ({proposals.length})
                    </Typography>

                    {proposals.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                                No proposals created yet.
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={handleCreateProposal}
                                sx={{ mt: 2 }}
                            >
                                Create First Proposal
                            </Button>
                        </Box>
                    ) : (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Title</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Version</TableCell>
                                        <TableCell>Created</TableCell>
                                        <TableCell>Sent</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {proposals.map((proposal) => (
                                        <TableRow key={proposal.id}>
                                            <TableCell>
                                                <Typography variant="subtitle2">
                                                    {proposal.title}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={proposal.status}
                                                    size="small"
                                                    color={getStatusColor(proposal.status)}
                                                />
                                            </TableCell>
                                            <TableCell>v{proposal.version}</TableCell>
                                            <TableCell>
                                                {proposal.created_at.toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {proposal.sent_at ? proposal.sent_at.toLocaleDateString() : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <IconButton
                                                    onClick={() => handleViewProposal(proposal.id)}
                                                    size="small"
                                                    color="primary"
                                                    title="View/Edit Proposal"
                                                >
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                                {proposal.status === 'Draft' && (
                                                    <IconButton
                                                        onClick={() => handleSendProposal(proposal.id)}
                                                        size="small"
                                                        color="success"
                                                        title="Send Proposal"
                                                    >
                                                        <SendIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                                <IconButton
                                                    onClick={() => handleDeleteProposal(proposal.id)}
                                                    size="small"
                                                    color="error"
                                                    title="Delete Proposal"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Notification Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
