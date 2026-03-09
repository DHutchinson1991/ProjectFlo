import React, { useState } from 'react';
import { Box, Typography, CardContent, Button, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { CheckCircle, EmojiEvents } from '@mui/icons-material';
import { inquiriesService } from '@/lib/api';
import { InquiryStatus } from '@/lib/types';
import type { WorkflowCardProps } from '../_lib';
import { WorkflowCard } from './WorkflowCard';

const ClientApprovalCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const [selectedDocument, setSelectedDocument] = useState('');

    const handleMarkApproved = async () => {
        try {
            await inquiriesService.update(inquiry.id, {
                status: InquiryStatus.WON,
            });
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error updating approval:', error);
        }
    };

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.15)' }}>
                        <CheckCircle sx={{ fontSize: 18, color: '#14b8a6' }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>Client Approval</Typography>
                </Box>

                <Stack spacing={3}>
                    <FormControl fullWidth>
                        <InputLabel>Select Final Document</InputLabel>
                        <Select
                            value={selectedDocument}
                            onChange={(e) => setSelectedDocument(e.target.value)}
                        >
                            {inquiry?.proposals?.map((proposal: { id: number; title: string }) => (
                                <MenuItem key={`proposal-${proposal.id}`} value={`proposal-${proposal.id}`}>
                                    {proposal.title} (Proposal)
                                </MenuItem>
                            ))}
                            {inquiry?.estimates?.map((estimate: { id: number; estimate_number: string }) => (
                                <MenuItem key={`estimate-${estimate.id}`} value={`estimate-${estimate.id}`}>
                                    Estimate #{estimate.estimate_number}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleMarkApproved}
                        disabled={!selectedDocument}
                        fullWidth
                        startIcon={<EmojiEvents />}
                        sx={{
                            py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: '0.85rem',
                            textTransform: 'none',
                            background: !selectedDocument ? undefined : 'linear-gradient(135deg, #10b981, #14b8a6)',
                            boxShadow: !selectedDocument ? undefined : '0 4px 16px rgba(16, 185, 129, 0.3)',
                            '&:hover': { background: 'linear-gradient(135deg, #059669, #0d9488)', boxShadow: '0 6px 24px rgba(16, 185, 129, 0.4)' },
                        }}
                    >
                        Approve & Book Project
                    </Button>
                </Stack>
            </CardContent>
        </WorkflowCard>
    );
};

export { ClientApprovalCard };
