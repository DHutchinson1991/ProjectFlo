'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

export interface TaskColumnHeadersProps {
    /** Column definitions: label + grid column CSS */
    columns: string[];
    /** CSS grid-template-columns value */
    gridCols: string;
}

export function TaskColumnHeaders({ columns, gridCols }: TaskColumnHeadersProps) {
    return (
        <Box sx={{
            display: 'grid', gridTemplateColumns: gridCols,
            bgcolor: 'rgba(255,255,255,0.022)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
            {columns.map((h) => (
                <Typography key={h} sx={{
                    fontSize: '0.625rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)',
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                    px: 1.5, py: 1,
                }}>
                    {h}
                </Typography>
            ))}
        </Box>
    );
}
