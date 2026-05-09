'use client';

import React from 'react';
import { Box } from '@mui/material';
import { TasksCard } from '../cards';
import { tabPanelPadding } from '../detail-tokens';

export interface TasksTabPanelProps {
    packageId: number | null;
    safeBrandId: number | undefined;
}

export function TasksTabPanel({ packageId, safeBrandId }: TasksTabPanelProps) {
    return (
        <Box sx={tabPanelPadding}>
            {safeBrandId && packageId && (
                <TasksCard packageId={packageId} brandId={safeBrandId} />
            )}
        </Box>
    );
}
