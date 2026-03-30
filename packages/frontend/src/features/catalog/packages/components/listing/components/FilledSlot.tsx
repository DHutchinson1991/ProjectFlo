'use client';

import React from 'react';
import {
    Box, Typography, Button, IconButton, Chip, Tooltip,
} from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MicIcon from '@mui/icons-material/Mic';
import EventIcon from '@mui/icons-material/Event';
import PlaceIcon from '@mui/icons-material/Place';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';

import type { ServicePackage } from '@/features/catalog/packages/types/service-package.types';
import { formatCurrency } from '@/shared/utils/formatUtils';
import { DEFAULT_CURRENCY } from '@projectflo/shared';

import { getTierColor, getCategoryColor, getPackageStats } from '../listing-helpers';

// ═══════════════════════════════════════════════════════════════════════
// ── Filled Slot Component
// ═══════════════════════════════════════════════════════════════════════

export function FilledSlot({
    pkg, slotLabel, currencyCode,
    onOpen, onSwap, onRemove, onRemoveSlot, canRemoveSlot,
}: {
    pkg: ServicePackage;
    slotLabel: string;
    currencyCode: string;
    onOpen: () => void;
    onSwap: () => void;
    onRemove: () => void;
    onRemoveSlot: () => void;
    canRemoveSlot: boolean;
}) {
    const stats = getPackageStats(pkg);
    const catColor = getCategoryColor(pkg.category);
    const tierColor = getTierColor(slotLabel);
    const filmItems = (pkg.contents?.items || []).filter(i => i.type === 'film');

    const displayCost = Number(pkg._tax?.totalWithTax ?? pkg._totalCost ?? 0);
    const hasTax = (pkg._tax?.rate ?? 0) > 0;

    return (
        <Box sx={{
            borderRadius: 3,
            bgcolor: 'rgba(16, 18, 22, 0.85)',
            border: '1px solid rgba(52, 58, 68, 0.3)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            transition: 'all 0.2s ease',
            '&:hover': {
                border: '1px solid rgba(100, 140, 255, 0.25)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                '& .slot-actions': { opacity: 1 },
            },
        }}>
            {/* Slot label bar */}
            <Box sx={{
                px: 2, py: 0.75,
                bgcolor: `${tierColor}0F`,
                borderBottom: '1px solid rgba(52, 58, 68, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Typography sx={{
                    fontSize: '0.6rem', fontWeight: 700, color: tierColor,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                    {slotLabel}
                </Typography>
                <Box className="slot-actions" sx={{ display: 'flex', gap: 0.25, opacity: 0, transition: 'opacity 0.2s' }}>
                    <Tooltip title="Swap package" arrow>
                        <IconButton size="small" onClick={e => { e.stopPropagation(); onSwap(); }} sx={{ p: 0.3, color: '#648CFF' }}>
                            <SwapHorizIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Clear slot" arrow>
                        <IconButton size="small" onClick={e => { e.stopPropagation(); onRemove(); }} sx={{ p: 0.3, color: '#475569', '&:hover': { color: '#ef4444' } }}>
                            <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Tooltip>
                    {canRemoveSlot && (
                        <Tooltip title="Remove slot entirely" arrow>
                            <IconButton size="small" onClick={e => { e.stopPropagation(); onRemoveSlot(); }} sx={{ p: 0.3, color: '#475569', '&:hover': { color: '#ef4444' } }}>
                                <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* Top accent — tier-colored */}
            <Box sx={{ height: 3, background: `linear-gradient(90deg, ${tierColor}, ${tierColor}80)` }} />

            {/* ── Header container: fixed height so stats align across cards ── */}
            <Box sx={{ height: 170, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header: category + price */}
                <Box sx={{ px: 2.5, pt: 2, pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <Chip
                        label={pkg.category || 'General'}
                        size="small"
                        sx={{
                            height: 22, fontSize: '0.6rem', fontWeight: 700,
                            bgcolor: `${catColor}15`, color: catColor,
                            border: `1px solid ${catColor}30`,
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{
                            fontWeight: 800, color: '#f59e0b', fontSize: '1.1rem', fontFamily: 'monospace',
                        }}>
                            {formatCurrency(displayCost, currencyCode ?? DEFAULT_CURRENCY)}
                        </Typography>
                        {hasTax && <Typography sx={{ fontSize: '0.55rem', color: '#475569', fontFamily: 'monospace' }}>incl. {pkg._tax!.rate}% tax</Typography>}
                    </Box>
                </Box>

                {/* Name + Description */}
                <Box sx={{ px: 2.5, pt: 1.5, pb: 2, overflow: 'hidden' }}>
                    <Typography sx={{
                        fontWeight: 800, color: '#f1f5f9', fontSize: '1.05rem', lineHeight: 1.3, mb: 0.5,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                        {pkg.name}
                    </Typography>
                    <Typography sx={{
                        color: '#64748b', fontSize: '0.72rem', lineHeight: 1.5,
                        height: '3em',
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                        {pkg.description || '\u00A0'}
                    </Typography>
                </Box>
            </Box>

            {/* Divider */}
            <Box sx={{ mx: 2.5, height: '1px', bgcolor: 'rgba(52, 58, 68, 0.3)' }} />

            {/* Stats */}
            <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                    { icon: <EventIcon sx={{ fontSize: 14, color: '#f59e0b' }} />, label: 'Event Days', value: stats.dayCount, color: '#f59e0b' },
                    { icon: <PeopleIcon sx={{ fontSize: 14, color: '#648CFF' }} />, label: 'Crew', value: stats.crewCount, color: '#648CFF' },
                    { icon: <CameraAltIcon sx={{ fontSize: 14, color: '#10b981' }} />, label: 'Cameras', value: stats.cameraCount, color: '#10b981' },
                    { icon: <MicIcon sx={{ fontSize: 14, color: '#0ea5e9' }} />, label: 'Audio', value: stats.audioCount, color: '#0ea5e9' },
                    { icon: <PlaceIcon sx={{ fontSize: 14, color: '#a855f7' }} />, label: 'Locations', value: stats.locationCount, color: '#a855f7' },
                    ...(stats.typicalGuestCount != null ? [{ icon: <GroupsIcon sx={{ fontSize: 14, color: '#f472b6' }} />, label: 'Guests', value: stats.typicalGuestCount, color: '#f472b6' }] : []),
                ].map(stat => (
                    <Box key={stat.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                                width: 26, height: 26, borderRadius: 1.5,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: `${stat.color}10`, border: `1px solid ${stat.color}20`,
                            }}>
                                {stat.icon}
                            </Box>
                            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
                                {stat.label}
                            </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 700, fontFamily: 'monospace' }}>
                            {stat.value}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Divider */}
            <Box sx={{ mx: 2.5, height: '1px', bgcolor: 'rgba(52, 58, 68, 0.3)' }} />

            {/* Films List */}
            <Box sx={{ px: 2.5, py: 2, flex: 1 }}>
                <Typography sx={{
                    fontSize: '0.6rem', fontWeight: 700, color: '#475569',
                    textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.25,
                }}>
                    Films
                </Typography>
                {filmItems.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        {filmItems.map((item, idx) => (
                            <Box key={item.id || idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MovieIcon sx={{ fontSize: 13, color: '#648CFF', opacity: 0.7 }} />
                                <Typography sx={{
                                    fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 500,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {item.description || 'Untitled Film'}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                ) : (
                    <Typography sx={{ fontSize: '0.72rem', color: '#334155', fontStyle: 'italic' }}>
                        No films added
                    </Typography>
                )}
            </Box>

            {/* Footer: Open button */}
            <Box sx={{
                px: 2.5, py: 1.5,
                borderTop: '1px solid rgba(52, 58, 68, 0.2)',
                display: 'flex', justifyContent: 'center',
            }}>
                <Button
                    size="small"
                    onClick={onOpen}
                    endIcon={<ArrowForwardIcon sx={{ fontSize: '14px !important' }} />}
                    sx={{
                        color: '#648CFF', fontSize: '0.7rem', fontWeight: 700,
                        textTransform: 'none', width: '100%',
                        borderRadius: 1.5, py: 0.5,
                        '&:hover': { bgcolor: 'rgba(100, 140, 255, 0.08)' },
                    }}
                >
                    Open Package
                </Button>
            </Box>
        </Box>
    );
}
