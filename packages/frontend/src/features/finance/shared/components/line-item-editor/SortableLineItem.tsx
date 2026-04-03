import React from 'react';
import {
    Box,
    IconButton,
    TextField,
    Typography,
    Paper,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatCurrency } from '@projectflo/shared';
import type { LineItem } from './types';
import { UNIT_TYPES, ITEM_CATEGORIES } from './types';

interface SortableLineItemProps {
    item: LineItem;
    index: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (index: number, field: keyof LineItem, value: any) => void;
    onRemove: (index: number) => void;
    currency: string;
}

const SortableLineItem: React.FC<SortableLineItemProps> = ({
    item,
    index,
    onChange,
    onRemove,
    currency,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: item.tempId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isDiscount = item.unit_price < 0;

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            elevation={0}
            variant="outlined"
            sx={{
                p: 2,
                mb: 1,
                backgroundColor: isDiscount ? 'rgba(255, 0, 0, 0.02)' : 'background.paper',
                borderLeft: isDiscount ? '4px solid #ef5350' : '4px solid transparent',
                '&:hover': {
                    borderColor: isDiscount ? '#ef5350' : 'primary.main',
                    bgcolor: 'action.hover'
                }
            }}
        >
            <Grid container spacing={2} alignItems="center">
                {/* Drag Handle */}
                <Grid item xs="auto">
                    <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: 'grab', color: 'text.disabled' }}>
                        <DragIndicatorIcon />
                    </IconButton>
                </Grid>

                {/* Main Content */}
                <Grid item xs>
                    <Grid container spacing={2}>
                        {/* Row 1: Category & Description */}
                        <Grid item xs={12} md={5}>
                             <Box sx={{ display: 'flex', gap: 1 }}>
                                <FormControl variant="standard" sx={{ minWidth: 120 }}>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={item.category || ''}
                                        onChange={(e) => onChange(index, 'category', e.target.value)}
                                        label="Category"
                                    >
                                        {ITEM_CATEGORIES.map(cat => (
                                            <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    variant="standard"
                                    label="Description"
                                    value={item.description}
                                    onChange={(e) => onChange(index, 'description', e.target.value)}
                                    placeholder="Item details..."
                                />
                             </Box>
                        </Grid>

                        {/* Row 1 Cont: Pricing & Quantity */}
                        <Grid item xs={12} md={7}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                {/* Unit Price */}
                                <TextField
                                    label="Rate"
                                    type="number"
                                    variant="standard"
                                    value={item.unit_price}
                                    onChange={(e) => onChange(index, 'unit_price', e.target.value)}
                                    sx={{ width: 100 }}
                                />

                                {/* Quantity & Unit */}
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                                    <TextField
                                        label="Qty"
                                        type="number"
                                        variant="standard"
                                        value={item.quantity}
                                        onChange={(e) => onChange(index, 'quantity', e.target.value)}
                                        sx={{ width: 60 }}
                                    />
                                    <FormControl variant="standard" sx={{ minWidth: 90 }}>
                                        <InputLabel>Unit</InputLabel>
                                        <Select
                                            value={item.unit || 'Qty'}
                                            onChange={(e) => onChange(index, 'unit', e.target.value)}
                                            label="Unit"
                                        >
                                            {UNIT_TYPES.map(type => (
                                                <MenuItem key={type} value={type}>{type}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>

                                {/* Total */}
                                <Box sx={{ minWidth: 100, textAlign: 'right', pb: 0.5 }}>
                                    <Typography variant="caption" display="block" color="text.secondary">Total</Typography>
                                    <Typography variant="subtitle1" fontWeight="bold" color={isDiscount ? 'error.main' : 'text.primary'}>
                                        {formatCurrency(item.total || 0, currency)}
                                    </Typography>
                                </Box>

                                {/* Delete */}
                                <IconButton size="small" color="error" onClick={() => onRemove(index)}>
                                    <DeleteIcon fontSize='small' />
                                </IconButton>
                            </Box>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default SortableLineItem;
