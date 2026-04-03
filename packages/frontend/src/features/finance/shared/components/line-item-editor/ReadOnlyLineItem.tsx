import React from 'react';
import { Paper, Typography } from '@mui/material';
import { formatCurrency } from '@projectflo/shared';
import type { LineItem } from './types';

interface ReadOnlyLineItemProps {
    item: LineItem;
    currency: string;
}

const ReadOnlyLineItem: React.FC<ReadOnlyLineItemProps> = ({ item, currency }) => {
    const isDiscount = item.unit_price < 0;
    return (
        <Paper
            elevation={0}
            variant="outlined"
            sx={{
                p: 1.5,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                backgroundColor: isDiscount ? 'rgba(255, 0, 0, 0.02)' : 'background.paper',
                borderLeft: isDiscount ? '4px solid #ef5350' : '4px solid transparent',
            }}
        >
            {item.category && (
                <Typography
                    variant="caption"
                    sx={{
                        minWidth: 110,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: 'action.hover',
                        color: 'text.secondary',
                        fontWeight: 600,
                        flexShrink: 0,
                    }}
                >
                    {item.category}
                </Typography>
            )}
            <Typography variant="body2" sx={{ flex: 1, color: 'text.primary' }}>
                {item.description || <span style={{ color: '#64748b', fontStyle: 'italic' }}>No description</span>}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, textAlign: 'right' }}>
                {formatCurrency(Number(item.unit_price), currency)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 70, textAlign: 'center' }}>
                {item.quantity} {item.unit || 'Qty'}
            </Typography>
            <Typography
                variant="body2"
                fontWeight="bold"
                sx={{ minWidth: 90, textAlign: 'right', color: isDiscount ? 'error.main' : 'text.primary' }}
            >
                {formatCurrency(item.total || 0, currency)}
            </Typography>
        </Paper>
    );
};

export default ReadOnlyLineItem;
