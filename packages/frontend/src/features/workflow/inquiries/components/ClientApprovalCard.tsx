import React from 'react';
import { Box, Typography, CardContent, Button, Stack } from '@mui/material';
import { CheckCircle, EmojiEvents } from '@mui/icons-material';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { InquiryStatus } from '@/features/workflow/inquiries/types';
import type { WorkflowCardProps } from '../lib';
import { WorkflowCard } from './WorkflowCard';

const ClientApprovalCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const handleMarkApproved = async () => {
        try {
            await inquiriesApi.update(inquiry.id, {
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
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleMarkApproved}
                        fullWidth
                        startIcon={<EmojiEvents />}
                        sx={{
                            py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: '0.85rem',
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
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
