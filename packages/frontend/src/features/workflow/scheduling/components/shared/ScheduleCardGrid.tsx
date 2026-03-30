import React from 'react';
import { Grid } from '@mui/material';

interface ScheduleCardGridProps {
    /** Activities + below-fold card (e.g. Deliverables) */
    col1: React.ReactNode;
    /** Subjects + Locations */
    col2: React.ReactNode;
    /** Crew + Equipment */
    col3: React.ReactNode;
    /** Task Auto-Generation */
    col4: React.ReactNode;
    /** Dialogs / wizards that need to be rendered in the tree but don't affect layout */
    children?: React.ReactNode;
}

/**
 * Shared 4-column schedule card grid used by both PackageDetailScreen
 * and InstanceScheduleEditor.
 *
 * Column widths: 3.4 | 2 | 3 | 3.6  (sum = 12)
 */
export function ScheduleCardGrid({ col1, col2, col3, col4, children }: ScheduleCardGridProps) {
    return (
        <Grid container spacing={2.5}>
            <Grid item xs={12} md={3.4}>
                {col1}
            </Grid>
            <Grid item xs={12} md={2}>
                {col2}
            </Grid>
            <Grid item xs={12} md={3}>
                {col3}
            </Grid>
            <Grid item xs={12} md={3.6}>
                {col4}
            </Grid>
            {/* Dialogs/wizards rendered in-tree without affecting grid layout */}
            {children}
        </Grid>
    );
}
