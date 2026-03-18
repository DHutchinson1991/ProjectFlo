import React, { useState, useEffect } from 'react';
import { Box, Typography, CardContent, Button, Chip, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { Description, Add, Edit, DeleteOutline, OpenInNew } from '@mui/icons-material';
import { proposalsService } from '@/lib/api';
import type { WorkflowCardProps } from '../_lib';
import { WorkflowCard } from './WorkflowCard';

const ProposalsCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const [proposals, setProposals] = useState<any[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchProposals = async () => {
            if (inquiry?.id) {
                try {
                    const proposalsData = await proposalsService.getAllByInquiry(inquiry.id);
                    setProposals(proposalsData || []);
                } catch (error) {
                    console.error('Error fetching proposals:', error);
                    setProposals([]);
                }
            }
        };

        fetchProposals();
    }, [inquiry?.id]);

    const handleCreate = async () => {
        try {
            const newProposal = await proposalsService.create(inquiry.id, {});

            try {
                const updatedProposals = await proposalsService.getAllByInquiry(inquiry.id);
                setProposals(updatedProposals || []);
            } catch (error) {
                console.error('Error refreshing proposals:', error);
            }

            if (onRefresh) onRefresh();

            // Open the preview via share token (auto-generated on creation)
            if (newProposal?.share_token) {
                window.open(`/proposals/${newProposal.share_token}`, '_blank');
            }
        } catch (error) {
            console.error('Error creating proposal:', error);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await proposalsService.delete(inquiry.id, deleteTarget.id);
            setProposals((prev) => prev.filter((p) => p.id !== deleteTarget.id));
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error deleting proposal:', error);
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                            <Description sx={{ fontSize: 18, color: '#8b5cf6' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>Proposals</Typography>
                        {proposals.length > 0 && <Chip label={proposals.length} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }} />}
                    </Box>
                    <Button size="small" startIcon={<Add />} onClick={handleCreate} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}>
                        Generate Proposal
                    </Button>
                </Box>

                {proposals.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Box sx={{ width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.12)' }}>
                            <Description sx={{ fontSize: 22, color: '#8b5cf6' }} />
                        </Box>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>No proposals yet</Typography>
                        <Typography sx={{ color: '#475569', fontSize: '0.72rem', mt: 0.5 }}>Auto-generated from your proposal settings</Typography>
                    </Box>
                ) : (
                    <List>
                        {proposals.map((proposal: { id: number; title: string; status: string; version: number }) => (
                            <ListItem key={proposal.id} divider secondaryAction={
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton
                                        onClick={async () => {
                                            try {
                                                const token = proposal.share_token || await proposalsService.generateShareToken(inquiry.id, proposal.id);
                                                window.open(`/proposals/${token}`, '_blank');
                                            } catch { /* ignore */ }
                                        }}
                                        title="Preview proposal"
                                        size="small"
                                    >
                                        <OpenInNew fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => setDeleteTarget({ id: proposal.id, title: proposal.title })}
                                        title="Delete proposal"
                                        size="small"
                                        sx={{ color: '#ef4444', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
                                    >
                                        <DeleteOutline fontSize="small" />
                                    </IconButton>
                                </Box>
                            }>
                                <ListItemText
                                    primary={proposal.title}
                                    secondary={`Status: ${proposal.status} - Version: ${proposal.version}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </CardContent>

            <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)}>
                <DialogTitle>Delete Proposal</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </WorkflowCard>
    );
};

export { ProposalsCard };
