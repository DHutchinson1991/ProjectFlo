'use client';

import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import {
    Add as AddIcon,
    Percent as PercentIcon,
} from '@mui/icons-material';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { computeLineTotal } from '@/shared/utils/pricing';
import { formatCurrency } from '@projectflo/shared';
import type { LineItem, LineItemEditorProps } from './types';
import { CATEGORY_COLORS } from './types';
import SortableLineItem from './SortableLineItem';

const LineItemEditor: React.FC<LineItemEditorProps> = ({ items, onChange, currency, readOnly = false }) => {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index] };

        if (field === 'quantity' || field === 'unit_price') {
            const numVal = parseFloat(value);
            item[field] = isNaN(numVal) ? 0 : numVal;
            item.total = computeLineTotal(item.quantity, item.unit_price);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item as any)[field] = value;
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

    // ── Read-only display mode ──
    if (readOnly) {
        const categoryOrder = ['Equipment', 'Planning', 'Coverage', 'Post-Production', 'Travel', 'Discount', 'Other'];
        const postProdPrefix = 'Post-Production:';

        const grouped = items.reduce((acc: Record<string, LineItem[]>, item) => {
            const cat = item.category || 'Other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
        }, {});

        const filmSubCats = Object.keys(grouped)
            .filter(c => c.startsWith(postProdPrefix))
            .sort();

        const orderedCategories: string[] = [];
        for (const c of categoryOrder) {
            if (grouped[c] || (c === 'Post-Production' && filmSubCats.length > 0)) {
                orderedCategories.push(c);
            }
        }
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
                    {formatCurrency(Number(item.unit_price), currency)}
                </Typography>
                <Typography sx={{ color: '#334155', fontSize: '0.7rem', minWidth: 72, textAlign: 'center' }}>
                    × {item.quantity} {item.unit || ''}
                </Typography>
                <Typography sx={{
                    fontWeight: 700, fontSize: '0.82rem', minWidth: 90, textAlign: 'right',
                    fontFamily: 'monospace',
                    color: (item.unit_price < 0) ? '#ef4444' : '#f1f5f9',
                }}>
                    {formatCurrency(item.total || 0, currency)}
                </Typography>
            </Box>
        );

        return (
            <Box>
                {orderedCategories.map(category => {
                    const color = CATEGORY_COLORS[category] || '#94a3b8';

                    if (category === 'Post-Production') {
                        const generalItems = grouped['Post-Production'] || [];
                        const allPostProdItems = [
                            ...generalItems,
                            ...filmSubCats.flatMap(sc => grouped[sc] || []),
                        ];
                        const totalPostProd = allPostProdItems.reduce((s, i) => s + (i.total || 0), 0);

                        return (
                            <Box key={category} sx={{ mb: 2 }}>
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
                                        {formatCurrency(totalPostProd, currency)}
                                    </Typography>
                                </Box>

                                {generalItems.map(item => renderItem(item, color))}

                                {filmSubCats.map(sc => {
                                    const filmName = sc.slice(postProdPrefix.length);
                                    const filmItems = grouped[sc] || [];
                                    const filmSubtotal = filmItems.reduce((s, i) => s + (i.total || 0), 0);
                                    return (
                                        <Box key={sc}>
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
                                                    {formatCurrency(filmSubtotal, currency)}
                                                </Typography>
                                            </Box>
                                            {filmItems.map(item => renderItem(item, color))}
                                        </Box>
                                    );
                                })}
                            </Box>
                        );
                    }

                    const catItems = grouped[category];
                    const catSubtotal = catItems.reduce((s, i) => s + (i.total || 0), 0);
                    return (
                        <Box key={category} sx={{ mb: 2 }}>
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
                                    {formatCurrency(catSubtotal, currency)}
                                </Typography>
                            </Box>
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
                        items={items.map(i => i.tempId)}
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
                                    currency={currency}
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
                    {formatCurrency(grandTotal, currency)}
                </Typography>
            </Box>
        </Box>
    );
};

export default LineItemEditor;
