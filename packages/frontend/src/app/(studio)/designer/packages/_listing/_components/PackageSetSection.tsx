'use client';

import React, { useState } from 'react';
import {
    Box, Typography, IconButton, Chip, Tooltip,
    Menu, MenuItem, ListItemIcon, ListItemText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
    DndContext, closestCenter, PointerSensor, KeyboardSensor,
    useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent,
} from '@dnd-kit/core';

import type { ServicePackage } from '@/lib/types/domains/sales';

import type { PackageSet } from '../_lib/types';
import {
    MAX_SLOTS, TIER_LABELS,
    resolveSlotTiers,
} from '../_lib/helpers';
import { DroppableSlotWrapper, DraggableFilledSlot } from './DndSlotWrappers';
import { EmptySlot } from './EmptySlot';
import { FilledSlot } from './FilledSlot';

// ═══════════════════════════════════════════════════════════════════════
// ── Package Set Section
// ═══════════════════════════════════════════════════════════════════════

export function PackageSetSection({
    set, currencyCode, allPackages,
    onEditSet,
    onDeleteSet, onSlotClick, onClearSlot, onAddSlot, onRemoveSlot, onSwapPackages,
    onOpenPackage, onCreateNew, hasLibraryPackages, setCategoryName,
}: {
    set: PackageSet;
    currencyCode: string;
    allPackages: ServicePackage[];
    onEditSet: () => void;
    onDeleteSet: () => void;
    onSlotClick: (slotId: number) => void;
    onClearSlot: (slotId: number) => void;
    onAddSlot: () => void;
    onRemoveSlot: (slotId: number) => void;
    onSwapPackages: (sourceSlotId: number, targetSlotId: number) => void;
    onOpenPackage: (pkgId: number) => void;
    onCreateNew: (slotId?: number) => void;
    hasLibraryPackages: boolean;
    setCategoryName: string | null;
}) {
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [draggingSlotId, setDraggingSlotId] = useState<number | null>(null);
    const tierMap = resolveSlotTiers(set.slots);
    const sortedSlots = [...set.slots].sort((a, b) => {
        const tierOrder = (label: string) => {
            const idx = TIER_LABELS.indexOf(label as typeof TIER_LABELS[number]);
            return idx >= 0 ? idx : 999;
        };
        return tierOrder(tierMap.get(a.id) || a.slot_label) - tierOrder(tierMap.get(b.id) || b.slot_label);
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor),
    );

    const handleDragStart = (event: DragStartEvent) => {
        setDraggingSlotId(Number(event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setDraggingSlotId(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const sourceSlotId = Number(active.id);
        const targetSlotId = Number(over.id);
        // Only swap if the source slot has a package
        const sourceSlot = sortedSlots.find(s => s.id === sourceSlotId);
        if (!sourceSlot?.service_package_id) return;
        onSwapPackages(sourceSlotId, targetSlotId);
    };

    const draggingSlot = draggingSlotId ? sortedSlots.find(s => s.id === draggingSlotId) : null;

    return (
        <Box>
            {/* ── Set Header ── */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                mb: 2.5, pb: 1.5, borderBottom: '1px solid rgba(52, 58, 68, 0.2)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {/* Emoji */}
                    <Box sx={{
                        width: 40, height: 40, borderRadius: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52, 58, 68, 0.3)',
                        fontSize: '1.3rem',
                    }}>
                        {set.emoji || '📦'}
                    </Box>

                    {/* Name */}
                    <Box>
                        <Typography sx={{
                                fontWeight: 800, color: '#f1f5f9', fontSize: '1.15rem', lineHeight: 1.3,
                                cursor: 'pointer',
                                '&:hover': { color: '#648CFF' },
                            }} onClick={onEditSet}>
                                {set.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                                {setCategoryName && (
                                    <Chip
                                        label={setCategoryName}
                                        size="small"
                                        sx={{
                                            height: 18, fontSize: '0.65rem', fontWeight: 600,
                                            bgcolor: 'rgba(100,140,255,0.12)', color: '#648CFF',
                                            '& .MuiChip-label': { px: 0.8 },
                                        }}
                                    />
                                )}
                                <Typography sx={{ color: '#475569', fontSize: '0.7rem' }}>
                                    {sortedSlots.filter(s => s.service_package_id).length} of {sortedSlots.length} slots filled
                                </Typography>
                    </Box>
                </Box>
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {sortedSlots.length < MAX_SLOTS && (
                        <Tooltip title="Add slot">
                            <IconButton onClick={onAddSlot} sx={{ color: '#64748b', '&:hover': { color: '#648CFF' } }}>
                                <AddIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                    <IconButton onClick={e => setMenuAnchor(e.currentTarget)} sx={{ color: '#64748b' }}>
                        <MoreVertIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Menu
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        onClose={() => setMenuAnchor(null)}
                        PaperProps={{
                            sx: {
                                bgcolor: '#1a1d26', border: '1px solid rgba(52,58,68,0.4)',
                                borderRadius: 2, minWidth: 160,
                            },
                        }}
                    >
                        <MenuItem onClick={() => { setMenuAnchor(null); onEditSet(); }}>
                            <ListItemIcon><EditIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></ListItemIcon>
                            <ListItemText primaryTypographyProps={{ fontSize: '0.8rem', color: '#e2e8f0' }}>Edit Set</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => { setMenuAnchor(null); onDeleteSet(); }}>
                            <ListItemIcon><DeleteOutlineIcon sx={{ fontSize: 16, color: '#ef4444' }} /></ListItemIcon>
                            <ListItemText primaryTypographyProps={{ fontSize: '0.8rem', color: '#ef4444' }}>Delete Set</ListItemText>
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            {/* ── Slots Grid ── */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: `repeat(${MAX_SLOTS}, minmax(0, 1fr))`,
                        lg: `repeat(${MAX_SLOTS}, minmax(0, 1fr))`,
                        xl: `repeat(${MAX_SLOTS}, minmax(0, 1fr))`,
                    },
                    gap: 2.5,
                }}>
                    {sortedSlots.map(slot => (
                        <DroppableSlotWrapper key={slot.id} id={slot.id} isOver={draggingSlotId !== null && draggingSlotId !== slot.id}>
                            {slot.service_package ? (
                                <DraggableFilledSlot slotId={slot.id}>
                                    <FilledSlot
                                        pkg={allPackages.find(p => p.id === slot.service_package!.id) || slot.service_package}
                                        slotLabel={tierMap.get(slot.id) || slot.slot_label}
                                        currencyCode={currencyCode}
                                        onOpen={() => onOpenPackage(slot.service_package!.id)}
                                        onSwap={() => onSlotClick(slot.id)}
                                        onRemove={() => onClearSlot(slot.id)}
                                        onRemoveSlot={() => onRemoveSlot(slot.id)}
                                        canRemoveSlot={sortedSlots.length > 1}
                                    />
                                </DraggableFilledSlot>
                            ) : (
                                <EmptySlot
                                    slotLabel={tierMap.get(slot.id) || slot.slot_label}
                                    onAdd={() => onSlotClick(slot.id)}
                                    hasLibraryPackages={hasLibraryPackages}
                                    onCreateNew={() => onCreateNew(slot.id)}
                                    onRemoveSlot={() => onRemoveSlot(slot.id)}
                                    canRemoveSlot={sortedSlots.length > 1}
                                />
                            )}
                        </DroppableSlotWrapper>
                    ))}

                    {/* Add-slot ghost card */}
                    {sortedSlots.length < MAX_SLOTS && (
                        <Box
                            onClick={onAddSlot}
                            sx={{
                                borderRadius: 3,
                                border: '2px dashed rgba(52, 58, 68, 0.25)',
                                bgcolor: 'rgba(16, 18, 22, 0.15)',
                                minHeight: 200,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: 1,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: 'rgba(100, 140, 255, 0.3)',
                                    bgcolor: 'rgba(16, 18, 22, 0.3)',
                                },
                            }}
                        >
                            <AddIcon sx={{ fontSize: 28, color: '#334155' }} />
                            <Typography sx={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                                Add Slot
                            </Typography>
                            <Typography sx={{ fontSize: '0.6rem', color: '#334155' }}>
                                {sortedSlots.length} / {MAX_SLOTS}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Drag overlay — shows a ghost of the package being dragged */}
                <DragOverlay>
                    {draggingSlot?.service_package ? (
                        <Box sx={{
                            px: 2, py: 1.5, borderRadius: 2,
                            bgcolor: 'rgba(100, 140, 255, 0.12)',
                            border: '1px solid rgba(100, 140, 255, 0.35)',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                            maxWidth: 220,
                        }}>
                            <Typography sx={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.85rem' }}>
                                {draggingSlot.service_package.name}
                            </Typography>
                            <Typography sx={{ color: '#648CFF', fontSize: '0.65rem', mt: 0.25 }}>
                                Drop on another slot to swap
                            </Typography>
                        </Box>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </Box>
    );
}
