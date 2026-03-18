'use client';

import React from 'react';
import {
    Box, Typography, Button, IconButton,
    Chip, Tooltip, SxProps, Theme,
} from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import InventoryIcon from '@mui/icons-material/Inventory';
import LinkIcon from '@mui/icons-material/Link';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import type { ServicePackageItem } from '@/lib/types/domains/sales';
import { getFilmStats } from '../_lib/helpers';
import type { FilmData, PackageActivityRecord } from '../_lib/types';

// ─── Props ──────────────────────────────────────────────────────────
export interface PackageContentsCardProps {
    items: ServicePackageItem[];
    films: FilmData[];
    packageActivities: PackageActivityRecord[];
    onConfigureItem: (item: ServicePackageItem) => void;
    onRemoveItem: (index: number) => void;
    onAddFilm: () => void;
    onAddService: () => void;
    cardSx: SxProps<Theme>;
}

// ─── Component ──────────────────────────────────────────────────────
export function PackageContentsCard({
    items,
    films,
    packageActivities,
    onConfigureItem,
    onRemoveItem,
    onAddFilm,
    onAddService,
    cardSx,
}: PackageContentsCardProps) {
    return (
        <Box sx={{ ...(cardSx as object), overflow: 'hidden' }}>
            {/* Card Header */}
            <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: items.length > 0 ? '1px solid rgba(52, 58, 68, 0.25)' : 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(100, 140, 255, 0.1)', border: '1px solid rgba(100, 140, 255, 0.2)' }}>
                            <VideoLibraryIcon sx={{ fontSize: 14, color: '#648CFF' }} />
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Package Contents</Typography>
                    </Box>
                    {items.length > 0 && (
                        <Chip label={`${items.length}`} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(100, 140, 255, 0.1)', color: '#648CFF', border: '1px solid rgba(100, 140, 255, 0.2)', '& .MuiChip-label': { px: 0.6 } }} />
                    )}
                </Box>
            </Box>

            {/* Items listing */}
            <Box>
                {items.length > 0 ? (
                    <>
                        {/* ── Column header row ── */}
                        <Box sx={{
                            display: 'flex', alignItems: 'center',
                            px: 2.5, py: 0.75,
                            borderBottom: '1px solid rgba(52,58,68,0.35)',
                            bgcolor: 'rgba(255,255,255,0.015)',
                        }}>
                            <Typography sx={{ width: 54, flexShrink: 0, fontSize: '0.58rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Type</Typography>
                            <Typography sx={{ flex: '0 0 110px', fontSize: '0.58rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Name</Typography>
                            <Typography sx={{ flex: 1, minWidth: 0, fontSize: '0.58rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Scenes</Typography>
                            <Typography sx={{ width: 40, flexShrink: 0, fontSize: '0.58rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'right' }}>Equip</Typography>
                            <Typography sx={{ width: 44, flexShrink: 0, fontSize: '0.58rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'right' }}>Dur.</Typography>
                            <Box sx={{ width: 24, flexShrink: 0 }} />
                        </Box>

                        {items.map((item, idx) => {
                            const film = item.type === 'film' ? films.find(f => f.id === item.referenceId) : null;
                            const linkedActivity = item.config?.activity_id
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                ? packageActivities.find((a: any) => a.id === item.config?.activity_id)
                                : null;

                            if (item.type === 'film' && film) {
                                const stats = getFilmStats(films, item.referenceId || 0);
                                return (
                                    <Box
                                        key={item.id || idx}
                                        onClick={() => onConfigureItem(item)}
                                        sx={{
                                            display: 'flex', alignItems: 'center',
                                            pl: 1.5, pr: 2.5, py: 1.25, gap: 0,
                                            cursor: 'pointer',
                                            borderBottom: '1px solid rgba(52,58,68,0.22)',
                                            borderLeft: '3px solid rgba(100,140,255,0.4)',
                                            bgcolor: 'rgba(100,140,255,0.025)',
                                            transition: 'background 0.15s ease, border-color 0.15s ease',
                                            '&:last-of-type': { borderBottom: 'none' },
                                            '&:hover': {
                                                bgcolor: 'rgba(100,140,255,0.07)',
                                                borderLeftColor: '#648CFF',
                                                '& .cnt-del': { opacity: 1 },
                                            },
                                        }}
                                    >
                                        {/* Type badge */}
                                        <Box sx={{ width: 54, flexShrink: 0 }}>
                                            <Box sx={{
                                                display: 'inline-flex', alignItems: 'center', gap: 0.4,
                                                px: 0.75, py: 0.2, borderRadius: 0.75,
                                                bgcolor: 'rgba(100,140,255,0.12)',
                                                border: '1px solid rgba(100,140,255,0.3)',
                                            }}>
                                                <VideoLibraryIcon sx={{ fontSize: 8, color: '#648CFF' }} />
                                                <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#648CFF', lineHeight: 1, letterSpacing: '0.2px' }}>Film</Typography>
                                            </Box>
                                        </Box>

                                        {/* Film name */}
                                        <Typography sx={{ flex: '0 0 110px', fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pr: 1.5 }}>
                                            {item.description}
                                        </Typography>

                                        {/* Scenes column */}
                                        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.35, pr: 1 }}>
                                            {film.scenes?.slice(0, 3).map((scene: { id: number; name: string; mode?: string }) => (
                                                <Box key={scene.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    {linkedActivity
                                                        ? <Tooltip title={`Linked to: ${linkedActivity.name}`} placement="top">
                                                            <LinkIcon sx={{ fontSize: 13, color: '#a855f7', flexShrink: 0 }} />
                                                          </Tooltip>
                                                        : <Box sx={{ width: 13, flexShrink: 0 }} />
                                                    }
                                                    <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                                        {scene.name}
                                                    </Typography>
                                                </Box>
                                            ))}
                                            {(film.scenes?.length || 0) > 3 && (
                                                <Typography sx={{ fontSize: '0.55rem', color: '#475569', pl: 2.25 }}>+{film.scenes!.length - 3} more</Typography>
                                            )}
                                        </Box>

                                        {/* Equipment count */}
                                        <Box sx={{ width: 40, flexShrink: 0, textAlign: 'right' }}>
                                            {(() => {
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                const equipCount = film.scenes?.reduce((total: number, s: any) => total + (Array.isArray(s.equipment) ? s.equipment.length : 0), 0) ?? 0;
                                                return equipCount > 0 ? (
                                                    <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{equipCount}</Typography>
                                                ) : (
                                                    <Typography sx={{ fontSize: '0.62rem', color: '#334155' }}>—</Typography>
                                                );
                                            })()}
                                        </Box>

                                        {/* Duration */}
                                        <Box sx={{ width: 44, flexShrink: 0, textAlign: 'right' }}>
                                            {stats.totalDuration !== '0:00' ? (
                                                <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                                    {stats.totalDuration}
                                                </Typography>
                                            ) : (
                                                <Typography sx={{ fontSize: '0.62rem', color: '#334155' }}>—</Typography>
                                            )}
                                        </Box>

                                        {/* Delete */}
                                        <Box className="cnt-del" sx={{ width: 24, flexShrink: 0, opacity: 0, transition: 'opacity 0.15s', display: 'flex', justifyContent: 'flex-end' }}>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => { e.stopPropagation(); onRemoveItem(idx); }}
                                                sx={{ p: 0.25, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}
                                            >
                                                <DeleteIcon sx={{ fontSize: 11 }} />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                );
                            }

                            // Service item — compact row
                            return (
                                <Box
                                    key={item.id || idx}
                                    sx={{
                                        display: 'flex', alignItems: 'center',
                                        pl: 1.5, pr: 2.5, py: 1.25,
                                        borderBottom: '1px solid rgba(52,58,68,0.22)',
                                        borderLeft: '3px solid rgba(245,158,11,0.3)',
                                        bgcolor: 'rgba(245,158,11,0.018)',
                                        transition: 'background 0.15s ease, border-color 0.15s ease',
                                        '&:last-of-type': { borderBottom: 'none' },
                                        '&:hover': {
                                            bgcolor: 'rgba(245,158,11,0.05)',
                                            borderLeftColor: '#f59e0b',
                                            '& .cnt-del': { opacity: 1 },
                                        },
                                    }}
                                >
                                    {/* Type badge */}
                                    <Box sx={{ width: 54, flexShrink: 0 }}>
                                        <Box sx={{
                                            display: 'inline-flex', alignItems: 'center', gap: 0.4,
                                            px: 0.75, py: 0.2, borderRadius: 0.75,
                                            bgcolor: 'rgba(245,158,11,0.1)',
                                            border: '1px solid rgba(245,158,11,0.25)',
                                        }}>
                                            <InventoryIcon sx={{ fontSize: 8, color: '#f59e0b' }} />
                                            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#f59e0b', lineHeight: 1, letterSpacing: '0.2px' }}>Service</Typography>
                                        </Box>
                                    </Box>
                                    <Typography sx={{ flex: '0 0 110px', fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pr: 1.5 }}>
                                        {item.description}
                                    </Typography>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontSize: '0.6rem', color: '#475569', fontStyle: 'italic' }}>—</Typography>
                                    </Box>
                                    <Box sx={{ width: 40, flexShrink: 0 }} />
                                    <Box sx={{ width: 44, flexShrink: 0, textAlign: 'right' }}>
                                        <Typography sx={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                            ${item.price.toFixed(2)}
                                        </Typography>
                                    </Box>
                                    <Box className="cnt-del" sx={{ width: 24, flexShrink: 0, opacity: 0, transition: 'opacity 0.15s', display: 'flex', justifyContent: 'flex-end' }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => onRemoveItem(idx)}
                                            sx={{ p: 0.25, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}
                                        >
                                            <DeleteIcon sx={{ fontSize: 11 }} />
                                        </IconButton>
                                    </Box>
                                </Box>
                            );
                        })}
                    </>
                ) : (
                    <Typography sx={{ fontSize: '0.65rem', color: '#475569', py: 1.5, textAlign: 'center', fontStyle: 'italic', px: 2.5 }}>
                        No items yet
                    </Typography>
                )}

                {/* Footer: Add Item buttons */}
                <Box sx={{ mt: items.length > 0 ? 1 : 0.5, display: 'flex', justifyContent: 'center', gap: 0.5, px: 2.5, pb: 1 }}>
                    <Button
                        size="small"
                        startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                        onClick={onAddFilm}
                        sx={{ fontSize: '0.6rem', color: '#648CFF', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(100, 140, 255, 0.06)' } }}
                    >
                        Add Film
                    </Button>
                    <Button
                        size="small"
                        startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                        onClick={onAddService}
                        sx={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', color: '#94a3b8' } }}
                    >
                        Add Service
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
