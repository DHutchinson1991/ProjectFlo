'use client';

import React from 'react';
import {
    Box, Typography, Button, IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

import { getTierColor } from '../lib/helpers';

// ═══════════════════════════════════════════════════════════════════════
// ── Empty Slot Component
// ═══════════════════════════════════════════════════════════════════════

export function EmptySlot({
    slotLabel, onAdd, hasLibraryPackages, onCreateNew,
    onRemoveSlot, canRemoveSlot,
}: {
    slotLabel: string;
    onAdd: () => void;
    hasLibraryPackages: boolean;
    onCreateNew: () => void;
    onRemoveSlot: () => void;
    canRemoveSlot: boolean;
}) {
    const tierColor = getTierColor(slotLabel);
    return (
        <Box
            sx={{
                borderRadius: 3,
                border: '2px dashed rgba(52, 58, 68, 0.4)',
                bgcolor: 'rgba(16, 18, 22, 0.3)',
                minHeight: 320,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                cursor: hasLibraryPackages ? 'pointer' : 'default',
                transition: 'all 0.25s ease',
                position: 'relative', overflow: 'hidden',
                '&:hover': hasLibraryPackages ? {
                    borderColor: `${tierColor}55`,
                    bgcolor: 'rgba(16, 18, 22, 0.45)',
                    '& .slot-plus': {
                        transform: 'scale(1.1)',
                        bgcolor: `${tierColor}20`,
                        borderColor: `${tierColor}60`,
                        color: tierColor,
                    },
                    '& .ghost-card': { opacity: 0.07 },
                    '& .remove-btn': { opacity: 1 },
                } : {},
            }}
            onClick={hasLibraryPackages ? onAdd : undefined}
        >
            {/* Ghost card outline */}
            <Box className="ghost-card" sx={{
                position: 'absolute', inset: 16, borderRadius: 2.5,
                border: '1px solid rgba(52, 58, 68, 0.2)',
                bgcolor: 'rgba(16, 18, 22, 0.3)', opacity: 0.04,
                transition: 'opacity 0.3s ease', pointerEvents: 'none',
            }}>
                <Box sx={{ height: 3, bgcolor: 'rgba(100, 140, 255, 0.15)', borderRadius: '10px 10px 0 0' }} />
                <Box sx={{ px: 2, pt: 2 }}>
                    <Box sx={{ width: 60, height: 10, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.08)', mb: 1.5 }} />
                    <Box sx={{ width: '80%', height: 14, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.06)', mb: 1 }} />
                    <Box sx={{ width: '60%', height: 8, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.04)' }} />
                </Box>
                <Box sx={{ px: 2, pt: 3 }}>
                    {[1, 2, 3].map(i => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.04)' }} />
                            <Box sx={{ width: `${40 + i * 8}%`, height: 8, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)' }} />
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Remove slot button */}
            {canRemoveSlot && (
                <Tooltip title="Remove this slot">
                    <IconButton
                        className="remove-btn"
                        size="small"
                        onClick={e => { e.stopPropagation(); onRemoveSlot(); }}
                        sx={{
                            position: 'absolute', top: 8, right: 8, zIndex: 2,
                            opacity: 0, transition: 'opacity 0.2s',
                            color: '#475569', p: 0.5,
                            '&:hover': { color: '#ef4444' },
                        }}
                    >
                        <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </Tooltip>
            )}

            {/* Slot label */}
            <Typography sx={{
                fontSize: '0.65rem', fontWeight: 700, color: tierColor,
                textTransform: 'uppercase', letterSpacing: '1px',
                position: 'relative', zIndex: 1,
            }}>
                {slotLabel}
            </Typography>

            {/* Plus button */}
            <Box className="slot-plus" sx={{
                width: 56, height: 56, borderRadius: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: `${tierColor}12`,
                border: `2px dashed ${tierColor}40`,
                color: `${tierColor}90`, transition: 'all 0.25s ease',
                position: 'relative', zIndex: 1,
            }}>
                <AddIcon sx={{ fontSize: 28 }} />
            </Box>

            {/* Instruction */}
            <Typography sx={{
                fontSize: '0.72rem', color: '#475569', textAlign: 'center',
                maxWidth: 200, lineHeight: 1.5, position: 'relative', zIndex: 1,
            }}>
                {hasLibraryPackages
                    ? 'Click to browse your package library'
                    : 'No packages in your library yet'}
            </Typography>

            {!hasLibraryPackages && (
                <Button
                    size="small"
                    startIcon={<AddIcon sx={{ fontSize: '14px !important' }} />}
                    onClick={e => { e.stopPropagation(); onCreateNew(); }}
                    sx={{
                        color: '#0f172a', fontSize: '0.7rem', fontWeight: 700,
                        textTransform: 'none', px: 2, py: 0.5,
                        bgcolor: '#f59e0b', borderRadius: 2,
                        position: 'relative', zIndex: 1,
                        '&:hover': { bgcolor: '#d97706' },
                    }}
                >
                    Create First Package
                </Button>
            )}
        </Box>
    );
}
