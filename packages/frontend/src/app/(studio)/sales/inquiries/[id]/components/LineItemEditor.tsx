// packages/frontend/src/app/(studio)/sales/inquiries/[id]/components/LineItemEditor.tsx
'use client';

import React from 'react';
import {
    Box,
    Button,
    IconButton,
    TextField,
    Typography,
    Paper,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    InputAdornment,
    Tooltip,
} from '@mui/material';
import { 
    Add as AddIcon, 
    Delete as DeleteIcon, 
    DragIndicator as DragIndicatorIcon,
    Percent as PercentIcon,
    AttachMoney as MoneyIcon
} from '@mui/icons-material';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface LineItem {
    id?: number; // Database ID (optional for new items)
    tempId: string; // Frontend ID for DnD
    category?: string;
    description: string;
    // service_date, start_time, end_time removed from UI but kept optional for compatibility if needed
    service_date?: string; 
    start_time?: string;   
    end_time?: string;     
    quantity: number;
    unit?: string;         
    unit_price: number;
    total: number;
    type?: 'service' | 'product' | 'discount'; // Optional type helper
}

interface LineItemEditorProps {
    items: LineItem[];
    onChange: (items: LineItem[]) => void;
    currencySymbol?: string;
}

const UNIT_TYPES = ['Qty', 'Hours', 'Days', 'Flat Rate', 'Service', 'Event', 'Fixed'];

// Sortable Row Component
const SortableLineItem = ({ 
    item, 
    index, 
    onChange, 
    onRemove,
    currencySymbol = '$',
}: { 
    item: LineItem, 
    index: number, 
    onChange: (index: number, field: keyof LineItem, value: any) => void,
    onRemove: (index: number) => void,
    currencySymbol?: string,
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
                                        <MenuItem value="Photography">Photography</MenuItem>
                                        <MenuItem value="Videography">Videography</MenuItem>
                                        <MenuItem value="Editing">Editing</MenuItem>
                                        <MenuItem value="Travel">Travel</MenuItem>
                                        <MenuItem value="Equipment">Equipment</MenuItem>
                                        <MenuItem value="Adjustment">Adjustment</MenuItem>
                                        <MenuItem value="Discount">Discount</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
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
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
                                    }}
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
                                        {currencySymbol}{(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

const LineItemEditor: React.FC<LineItemEditorProps> = ({ items, onChange, currencySymbol = '$' }) => {
    // Sensors for DnD
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.tempId === active.id);
            const newIndex = items.findIndex((item) => item.tempId === over.id);
            onChange(arrayMove(items, oldIndex, newIndex));
        }
    };

    const calculateTotal = (qty: number, price: number) => {
        const total = qty * price;
        return isNaN(total) ? 0 : Number(total.toFixed(2));
    };

    const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index] };

        if (field === 'quantity' || field === 'unit_price') {
            const numVal = parseFloat(value);
            // @ts-ignore
            item[field] = isNaN(numVal) ? 0 : numVal;
            item.total = calculateTotal(item.quantity, item.unit_price);
        } else {
            // @ts-ignore
            item[field] = value;
        }

        newItems[index] = item;
        onChange(newItems);
    };

    const handleAddItem = (isDiscount = false) => {
        const newItem: LineItem = {
            tempId: `item-${Date.now()}`,
            description: isDiscount ? 'Discount' : '',
            quantity: 1,
            unit: 'Fixed',
            unit_price: isDiscount ? -100 : 0,
            total: isDiscount ? -100 : 0,
            category: isDiscount ? 'Adjustment' : 'Photography'
        };
        onChange([...items, newItem]);
    };

    const handleRemoveItem = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

    return (
        <Box>
            <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between', px: 2, mb: 1 }}>
                    <span>Items & Services</span>
                    <span>Total Amount</span>
                </Typography>
                
                <DndContext 
                    sensors={sensors} 
                    collisionDetection={closestCenter} 
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext 
                        items={items.map(i => i.tempId)} // Use tempId for DnD key
                        strategy={verticalListSortingStrategy}
                    >
                        {items.length === 0 ? (
                             <Paper 
                                variant="outlined" 
                                sx={{ 
                                    p: 4, 
                                    textAlign: 'center', 
                                    borderStyle: 'dashed', 
                                    bgcolor: 'transparent' 
                                }}
                            >
                                <Typography color="text.secondary">No items added yet.</Typography>
                                <Button startIcon={<AddIcon />} onClick={() => handleAddItem(false)} sx={{ mt: 1 }}>
                                    Add First Item
                                </Button>
                             </Paper>
                        ) : (
                            items.map((item, index) => (
                                <SortableLineItem
                                    key={item.tempId}
                                    item={item}
                                    index={index}
                                    onChange={handleItemChange}
                                    onRemove={handleRemoveItem}
                                    currencySymbol={currencySymbol}
                                />
                            ))
                        )}
                    </SortableContext>
                </DndContext>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                        startIcon={<AddIcon />} 
                        onClick={() => handleAddItem(false)} 
                        variant="outlined" 
                        size="small"
                    >
                        Add Item
                    </Button>
                    <Button 
                        startIcon={<PercentIcon />} 
                        onClick={() => handleAddItem(true)} 
                        color="error"
                        variant="text" 
                        size="small"
                    >
                        Add Discount
                    </Button>
                </Box>
                
                <Typography variant="h5" color="secondary.main" fontWeight="bold">
                    {currencySymbol}{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
            </Box>
        </Box>
    );
};

export default LineItemEditor;
