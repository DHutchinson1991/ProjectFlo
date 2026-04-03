'use client';

import React from 'react';
import { Grid, Stack } from '@mui/material';
import { ProposalsCard, ContractsCard, QuotesCard, InvoicesCard, PaymentTermsCard } from '..';
import type { InquiryTabProps } from './types';

interface ProposalTabProps extends InquiryTabProps {
    currentPhase: string;
    phaseColor: (id: string) => string | undefined;
}

export default function ProposalTab({
    inquiry,
    onRefresh,
    currentPhase,
    phaseColor,
}: ProposalTabProps) {
    return (
        <Grid container spacing={3} columns={16}>
            <Grid item xs={16} md={6}>
                <Stack spacing={3}>
                    <div id="proposals-section">
                        <ProposalsCard
                            inquiry={inquiry}
                            onRefresh={onRefresh}
                            isActive={currentPhase === 'proposals'}
                            activeColor={phaseColor('proposals')}
                        />
                    </div>
                </Stack>
            </Grid>

            <Grid item xs={16} md={5}>
                <Stack spacing={3}>
                    <div id="payment-terms-section">
                        <PaymentTermsCard
                            inquiry={inquiry}
                            onRefresh={onRefresh}
                            isActive={currentPhase === 'estimates'}
                            activeColor={phaseColor('estimates')}
                        />
                    </div>
                    <div id="contracts-section">
                        <ContractsCard
                            inquiry={inquiry}
                            onRefresh={onRefresh}
                            isActive={currentPhase === 'contracts'}
                            activeColor={phaseColor('contracts')}
                        />
                    </div>
                </Stack>
            </Grid>

            <Grid item xs={16} md={5}>
                <Stack spacing={3}>
                    <div id="quotes-section">
                        <QuotesCard
                            inquiry={inquiry}
                            onRefresh={onRefresh}
                            isActive={currentPhase === 'quotes'}
                            activeColor={phaseColor('quotes')}
                            collapsedByDefault
                        />
                    </div>
                    <div id="invoices-section">
                        <InvoicesCard
                            inquiry={inquiry}
                            onRefresh={onRefresh}
                        />
                    </div>
                </Stack>
            </Grid>
        </Grid>
    );
}
