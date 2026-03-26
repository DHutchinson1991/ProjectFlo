'use client';

import React from 'react';
import { Box } from '@mui/material';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

// ═══════════════════════════════════════════════════════════════════════
// ── Droppable Slot Wrapper (drop target for package swap)
// ═══════════════════════════════════════════════════════════════════════

import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

export function DroppableSlotWrapper({ id, isOver: isDragActive, children }: { id: number; isOver: boolean; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <Box
            ref={setNodeRef}
            sx={{
                position: 'relative',
                borderRadius: 3,
                transition: 'box-shadow 0.2s, outline 0.2s',
                outline: isOver ? '2px solid rgba(100, 140, 255, 0.5)' : '2px solid transparent',
                boxShadow: isOver ? '0 0 20px rgba(100, 140, 255, 0.15)' : 'none',
            }}
        >
            {/* Drop hint overlay */}
            {isDragActive && isOver && (
                <Box sx={{
                    position: 'absolute', inset: 0, zIndex: 5,
                    borderRadius: 3, pointerEvents: 'none',
                    bgcolor: 'rgba(100, 140, 255, 0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <SwapHorizIcon sx={{ fontSize: 32, color: '#648CFF', opacity: 0.6 }} />
                </Box>
            )}
            {children}
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// ── Draggable Filled Slot (only packages with content can be dragged)
// ═══════════════════════════════════════════════════════════════════════

export function DraggableFilledSlot({ slotId, children }: { slotId: number; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: slotId });

    return (
        <Box ref={setNodeRef} sx={{ position: 'relative', opacity: isDragging ? 0.35 : 1, transition: 'opacity 0.15s' }}>
            {/* Drag handle */}
            <Box
                {...attributes}
                {...listeners}
                sx={{
                    position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 10, cursor: 'grab',
                    display: 'flex', alignItems: 'center', gap: 0.25,
                    px: 1, py: 0.25, borderRadius: 1,
                    bgcolor: 'rgba(16, 18, 22, 0.7)',
                    border: '1px solid rgba(52, 58, 68, 0.3)',
                    opacity: 0, transition: 'opacity 0.15s',
                    '&:hover': { opacity: 1, bgcolor: 'rgba(100, 140, 255, 0.12)', borderColor: 'rgba(100, 140, 255, 0.3)' },
                    '.MuiBox-root:hover > &': { opacity: 0.6 },
                    '&:active': { cursor: 'grabbing' },
                }}
            >
                <DragIndicatorIcon sx={{ fontSize: 14, color: '#648CFF' }} />
            </Box>
            {children}
        </Box>
    );
}
