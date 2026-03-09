import React, { useState, useEffect } from 'react';
import { Box, Typography, CardContent, Button, Chip, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Description, Add, Edit } from '@mui/icons-material';
import { proposalsService } from '@/lib/api';
import type { WorkflowCardProps } from '../_lib';
import { WorkflowCard } from './WorkflowCard';

const ProposalsCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const [proposals, setProposals] = useState<any[]>([]);

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
            const newProposal = await proposalsService.create(inquiry.id, {
                title: `Proposal for ${inquiry.contact?.first_name} ${inquiry.contact?.last_name}`,
                content: { blocks: [] }
            });

            try {
                const updatedProposals = await proposalsService.getAllByInquiry(inquiry.id);
                setProposals(updatedProposals || []);
            } catch (error) {
                console.error('Error refreshing proposals:', error);
            }

            if (onRefresh) onRefresh();

            if (newProposal?.id) {
                window.open(`/inquiries/${inquiry.id}/proposals/${newProposal.id}`, '_blank');
            }
        } catch (error) {
            console.error('Error creating proposal:', error);
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
                        New Proposal
                    </Button>
                </Box>

                {proposals.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Box sx={{ width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.12)' }}>
                            <Description sx={{ fontSize: 22, color: '#8b5cf6' }} />
                        </Box>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>No proposals yet</Typography>
                        <Typography sx={{ color: '#475569', fontSize: '0.72rem', mt: 0.5 }}>Craft a compelling proposal to win this client</Typography>
                    </Box>
                ) : (
                    <List>
                        {proposals.map((proposal: { id: number; title: string; status: string; version: number }) => (
                            <ListItem key={proposal.id} divider>
                                <ListItemText
                                    primary={proposal.title}
                                    secondary={`Status: ${proposal.status} - Version: ${proposal.version}`}
                                />
                                <IconButton
                                    onClick={() => window.open(`/inquiries/${inquiry.id}/proposals/${proposal.id}`, '_blank')}
                                    title="Edit proposal"
                                >
                                    <Edit />
                                </IconButton>
                            </ListItem>
                        ))}
                    </List>
                )}
            </CardContent>
        </WorkflowCard>
    );
};

export { ProposalsCard };
