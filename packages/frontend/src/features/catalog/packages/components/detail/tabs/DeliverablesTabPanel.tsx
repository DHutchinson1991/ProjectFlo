'use client';

import React from 'react';
import { Box } from '@mui/material';
import { EmptyState } from '@/shared/ui';
import { tabPanelPadding } from '../detail-tokens';

export function DeliverablesTabPanel() {
    return (
        <Box sx={tabPanelPadding}>
            <EmptyState
                message="Deliverables"
                description="USB drives, RAW footage, and other deliverables — coming soon."
            />
        </Box>
    );
}
