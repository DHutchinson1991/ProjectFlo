import React from 'react';
import { Grid } from '@mui/material';

interface ScheduleCardGridProps {
    /** Activities card (left) */
    col1: React.ReactNode;
    /** Right panel content (tabs + context card) */
    col2: React.ReactNode;
    /** Legacy col3 — unused in 2-col mode */
    col3?: React.ReactNode;
    /** Legacy col4 — unused in 2-col mode, use col2 instead */
    col4?: React.ReactNode;
    /** Dialogs / wizards that need to be rendered in the tree but don't affect layout */
    children?: React.ReactNode;
}

/**
 * Shared schedule card grid used by both PackageDetailScreen
 * and InstanceScheduleEditor.
 *
 * 2-column widths: 45% | 55%
 * 4-column widths: 3.4 | 2 | 3 | 3.6  (sum = 12) — legacy
 */
export function ScheduleCardGrid({ col1, col2, col3, col4, children }: ScheduleCardGridProps) {
    // Legacy 4-column mode for InstanceScheduleEditor
    if (col3 || (col4 && !col2)) {
        return (
            <Grid container spacing={2.5}>
                <Grid item xs={12} md={3.4}>{col1}</Grid>
                <Grid item xs={12} md={2}>{col2}</Grid>
                {col3 && <Grid item xs={12} md={3}>{col3}</Grid>}
                <Grid item xs={12} md={3.6}>{col4}</Grid>
                {children}
            </Grid>
        );
    }
    // 2-column mode (PackageDetailScreen)
    return (
        <Grid container spacing={2.5}>
            <Grid item xs={12} md={5.4}>
                {col1}
            </Grid>
            <Grid item xs={12} md={6.6}>
                {col2}
            </Grid>
            {children}
        </Grid>
    );
}
