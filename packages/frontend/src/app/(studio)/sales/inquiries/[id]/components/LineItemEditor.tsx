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
    readOnly?: boolean;
}

const UNIT_TYPES = ['Qty', 'Hours', 'Days', 'Flat Rate', 'Service', 'Event', 'Fixed'];

// Read-only row — no inputs, no drag handle, no delete
const ReadOnlyLineItem = ({
    item,
    currencySymbol = '$',
}: {
    item: LineItem;
    currencySymbol?: string;
}) => {
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
                {currencySymbol}{Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 70, textAlign: 'center' }}>
                {item.quantity} {item.unit || 'Qty'}
            </Typography>
            <Typography
                variant="body2"
                fontWeight="bold"
                sx={{ minWidth: 90, textAlign: 'right', color: isDiscount ? 'error.main' : 'text.primary' }}
            >
                {currencySymbol}{(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
        </Paper>
    );
};

const ITEM_CATEGORIES = [
    { value: 'Coverage',         label: 'Coverage' },       // On-day filming time
    { value: 'Films',            label: 'Films' },           // Deliverable films (wedding film, reel, SDE)
    { value: 'Post-Production',  label: 'Post-Production' }, // Editing / colour grading
    { value: 'Travel',           label: 'Travel' },
    { value: 'Equipment',        label: 'Equipment' },
    { value: 'Discount',         label: 'Discount' },
    { value: 'Other',            label: 'Other' },
];

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

const LineItemEditor: React.FC<LineItemEditorProps> = ({ items, onChange, currencySymbol = '$', readOnly = false }) => {
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
            category: isDiscount ? 'Discount' : 'Coverage'
        };
        onChange([...items, newItem]);
    };

    const handleRemoveItem = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

    // ── Read-only display mode (estimates are auto-generated; adjust the package to change costs) ──
    if (readOnly) {
        const categoryColors: Record<string, string> = {
            Equipment: '#10b981',
            Planning: '#a855f7',
            Coverage: '#648CFF',
            'Post-Production': '#f97316',
            Travel: '#06b6d4',
            Discount: '#ef4444',
            Other: '#94a3b8',
        };
        const categoryOrder = ['Equipment', 'Planning', 'Coverage', 'Post-Production', 'Travel', 'Discount', 'Other'];

        // Merge Post-Production:* sub-categories into the parent Post-Production bucket
        const postProdPrefix = 'Post-Production:';
        const grouped = items.reduce((acc: Record<string, LineItem[]>, item) => {
            const cat = item.category || 'Other';
            // Film sub-categories stay separate for sub-group rendering but live under Post-Production
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
        }, {});

        // Collect film sub-groups and build the ordered list
        const filmSubCats = Object.keys(grouped)
            .filter(c => c.startsWith(postProdPrefix))
            .sort();
        // For ordering, treat all Post-Production:* as part of Post-Production
        const orderedCategories: string[] = [];
        for (const c of categoryOrder) {
            if (grouped[c] || (c === 'Post-Production' && filmSubCats.length > 0)) {
                orderedCategories.push(c);
            }
        }
        // Append any remaining unknown categories
        const known = new Set([...categoryOrder, ...filmSubCats]);
        for (const c of Object.keys(grouped)) {
            if (!known.has(c)) orderedCategories.push(c);
        }

        if (orderedCategories.length === 0 && filmSubCats.length === 0) {
            return (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography sx={{ color: '#334155', fontSize: '0.82rem' }}>No items — package not yet assigned.</Typography>
                </Box>
            );
        }

        // Renders a row of line items
        const renderItem = (item: LineItem, color: string) => (
            <Box key={item.tempId} sx={{
                display: 'flex', alignItems: 'center', gap: 2,
                py: 0.85, px: 1.5,
                borderLeft: `3px solid ${color}22`,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.02)', borderLeftColor: `${color}55` },
                transition: 'background 0.1s',
            }}>
                <Typography sx={{ flex: 1, color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.3 }}>
                    {item.description || <em style={{ color: '#334155' }}>No description</em>}
                </Typography>
                <Typography sx={{ color: '#475569', fontSize: '0.72rem', minWidth: 85, textAlign: 'right', fontFamily: 'monospace' }}>
                    {currencySymbol}{Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
                <Typography sx={{ color: '#334155', fontSize: '0.7rem', minWidth: 72, textAlign: 'center' }}>
                    × {item.quantity} {item.unit || ''}
                </Typography>
                <Typography sx={{
                    fontWeight: 700, fontSize: '0.82rem', minWidth: 90, textAlign: 'right',
                    fontFamily: 'monospace',
                    color: (item.unit_price < 0) ? '#ef4444' : '#f1f5f9',
                }}>
                    {currencySymbol}{(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
            </Box>
        );

        return (
            <Box>
                {orderedCategories.map(category => {
                    const color = categoryColors[category] || '#94a3b8';

                    // Post-Production: render parent header + general items + per-film sub-groups
                    if (category === 'Post-Production') {
                        const generalItems = grouped['Post-Production'] || [];
                        const allPostProdItems = [
                            ...generalItems,
                            ...filmSubCats.flatMap(sc => grouped[sc] || []),
                        ];
                        const totalPostProd = allPostProdItems.reduce((s, i) => s + (i.total || 0), 0);

                        return (
                            <Box key={category} sx={{ mb: 2 }}>
                                {/* Parent header */}
                                <Box sx={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    px: 1.5, py: 0.65,
                                    borderLeft: `3px solid ${color}`,
                                    bgcolor: `${color}10`,
                                    borderRadius: '0 4px 4px 0',
                                    mb: 0.5,
                                }}>
                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                        Post-Production
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color, fontFamily: 'monospace' }}>
                                        {currencySymbol}{totalPostProd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </Typography>
                                </Box>

                                {/* General editing items */}
                                {generalItems.map(item => renderItem(item, color))}

                                {/* Per-film sub-groups */}
                                {filmSubCats.map(sc => {
                                    const filmName = sc.slice(postProdPrefix.length);
                                    const filmItems = grouped[sc] || [];
                                    const filmSubtotal = filmItems.reduce((s, i) => s + (i.total || 0), 0);
                                    return (
                                        <Box key={sc}>
                                            {/* Film sub-header — lighter, indented feel */}
                                            <Box sx={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                px: 1.5, py: 0.4, mt: 0.75,
                                                borderLeft: `3px solid ${color}40`,
                                                mb: 0.25,
                                            }}>
                                                <Typography sx={{
                                                    fontSize: '0.55rem', fontWeight: 600, color: `${color}cc`,
                                                    textTransform: 'uppercase', letterSpacing: '0.6px',
                                                }}>
                                                    {filmName}
                                                </Typography>
                                                <Typography sx={{
                                                    fontSize: '0.62rem', fontWeight: 600, color: `${color}99`,
                                                    fontFamily: 'monospace',
                                                }}>
                                                    {currencySymbol}{filmSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>
                                            {filmItems.map(item => renderItem(item, color))}
                                        </Box>
                                    );
                                })}
                            </Box>
                        );
                    }

                    // Standard flat category
                    const catItems = grouped[category];
                    const catSubtotal = catItems.reduce((s, i) => s + (i.total || 0), 0);
                    return (
                        <Box key={category} sx={{ mb: 2 }}>
                            {/* Category header */}
                            <Box sx={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                px: 1.5, py: 0.65,
                                borderLeft: `3px solid ${color}`,
                                bgcolor: `${color}10`,
                                borderRadius: '0 4px 4px 0',
                                mb: 0.5,
                            }}>
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                    {category}
                                </Typography>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color, fontFamily: 'monospace' }}>
                                    {currencySymbol}{catSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </Typography>
                            </Box>
                            {/* Items in category */}
                            {catItems.map((item) => renderItem(item, color))}
                        </Box>
                    );
                })}
            </Box>
        );
    }

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
