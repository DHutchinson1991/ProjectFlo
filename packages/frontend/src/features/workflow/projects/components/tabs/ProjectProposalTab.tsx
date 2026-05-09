'use client';

import React from 'react';
import { Box, Grid, Stack, Typography } from '@mui/material';
import type { Project } from '../../types/project.types';
import { projectToInquiryAdapter } from '../../lib/projectToInquiryAdapter';
import type { Inquiry } from '@/features/workflow/inquiries/types';

// Reuse financial cards from inquiry (they fetch via inquiry.id hooks)
import { ProposalsCard } from '@/features/workflow/inquiries/components';
import { ContractsCard } from '@/features/finance/contracts/components/ContractsCard';
import { QuotesCard } from '@/features/finance/quotes/components/QuotesCard';
import { InvoicesCard } from '@/features/finance/invoices/components/InvoicesCard';
import PaymentTermsCard from '@/features/finance/payment-schedules/components/PaymentTermsCard';

interface ProjectProposalTabProps {
    project: Project;
    onRefresh: () => Promise<void>;
}

/**
 * Proposal tab for projects — mirrors the inquiry ProposalTab layout.
 * Reuses financial cards by passing an inquiry-shaped adapter object.
 */
export function ProjectProposalTab({ project, onRefresh }: ProjectProposalTabProps) {
    const inquiryLike = projectToInquiryAdapter(project);

    if (!inquiryLike) {
        return (
            <Box
                sx={{
                    py: 6,
                    textAlign: 'center',
                    borderRadius: 2,
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    border: '1px dashed rgba(148, 163, 184, 0.12)',
                }}
            >
                <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                    No linked inquiry — financial data unavailable.
                </Typography>
            </Box>
        );
    }

    // The financial cards accept Inquiry typed props but only use .id for hooks.
    // Cast to Inquiry so the type system is satisfied.
    const inquiry = inquiryLike as unknown as Inquiry;

    return (
        <Grid container spacing={3} columns={16}>
            <Grid item xs={16} md={6}>
                <Stack spacing={3}>
                    <ProposalsCard
                        inquiry={inquiry}
                        onRefresh={onRefresh}
                    />
                </Stack>
            </Grid>

            <Grid item xs={16} md={5}>
                <Stack spacing={3}>
                    <PaymentTermsCard
                        inquiry={inquiry}
                        onRefresh={onRefresh}
                    />
                    <ContractsCard
                        inquiry={inquiry}
                        onRefresh={onRefresh}
                    />
                </Stack>
            </Grid>

            <Grid item xs={16} md={5}>
                <Stack spacing={3}>
                    <QuotesCard
                        inquiry={inquiry}
                        onRefresh={onRefresh}
                    />
                    <InvoicesCard
                        inquiry={inquiry}
                        onRefresh={onRefresh}
                    />
                </Stack>
            </Grid>
        </Grid>
    );
}
