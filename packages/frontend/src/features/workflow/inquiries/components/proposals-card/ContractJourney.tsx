'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Gavel } from '@mui/icons-material';
import { colors } from '@/shared/theme/tokens';
import { timeAgo } from '@/shared/utils/dateTime';
import type { ContractJourneyProps } from './types';

const ContractJourney: React.FC<ContractJourneyProps> = ({ contract }) => {
    const signer = contract.signers[0];
    const contractViewed = !!signer?.viewed_at;
    const contractSigned = !!signer?.signed_at;

    let statusText: string;
    let statusColor: string;
    if (contractSigned) {
        statusText = `Signed ${signer?.signed_at ? timeAgo(signer.signed_at) : ''}`;
        statusColor = colors.success;
    } else if (contractViewed) {
        statusText = `Viewed ${signer?.viewed_at ? timeAgo(signer.viewed_at) : ''} · Not yet signed`;
        statusColor = colors.accent;
    } else if (contract.status === 'Sent') {
        statusText = 'Sent · Not yet viewed';
        statusColor = '#94a3b8';
    } else {
        statusText = contract.status === 'Draft' ? 'Draft' : contract.status;
        statusColor = '#64748b';
    }

    return (
        <Box sx={{ mb: 2, py: 1, px: 1.5, borderRadius: 2, bgcolor: 'rgba(100, 116, 139, 0.04)', border: '1px solid rgba(100, 116, 139, 0.1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Gavel sx={{ fontSize: 13, color: statusColor }} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8' }}>
                    Contract
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: statusColor, ml: 0.5 }}>
                    {statusText}
                </Typography>
            </Box>
        </Box>
    );
};

export default ContractJourney;
