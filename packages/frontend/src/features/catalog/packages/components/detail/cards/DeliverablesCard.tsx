'use client';

import React from 'react';
import {
    Box, Typography, IconButton,
    Table, TableHead, TableBody, TableRow, TableCell,
    Tooltip, SxProps, Theme, LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import type { ServicePackageItem } from '@/features/catalog/packages/types/service-package.types';
import { getFilmStats } from '../../../utils/package-helpers';
import type { FilmData, PackageActivityRecord } from '../../../types';
import type { UsePlanningProgressReturn } from '../../../hooks/usePlanningProgress';
import { detailGlassCardSx, detailHeaderCellSx, detailBodyCellSx } from '../detail-tokens';
import { FilmBuildProgressRow } from './FilmBuildProgressRow';
import { colors } from '@/shared/theme/tokens';

// ─── Props ──────────────────────────────────────────────────────────
export interface DeliverablesCardProps {
    items: ServicePackageItem[];
    films: FilmData[];
    packageActivities: PackageActivityRecord[];
    onConfigureItem: (item: ServicePackageItem) => void;
    onRemoveItem: (index: number) => void;
    onAddFilm: () => void;
    onAddService: () => void;
    cardSx?: SxProps<Theme>;
    buildingFilmIds?: Set<number>;
    planning?: UsePlanningProgressReturn;
    filmCreationProgress?: { label: string; progress: number } | null;
}

// ─── Component ──────────────────────────────────────────────────────
export function DeliverablesCard({
    items,
    films,
    packageActivities,
    onConfigureItem,
    onRemoveItem,
    onAddFilm,
    buildingFilmIds,
    filmCreationProgress,
}: DeliverablesCardProps) {
    const contentItems = items.filter(i => i.type === 'film');
    const isCreatingFilm = filmCreationProgress != null;

    const hCellSx = detailHeaderCellSx;
    const bCellSx = detailBodyCellSx;

    return (
            <Box sx={detailGlassCardSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.01em' }}>
                        Content
                    </Typography>
                    <Box sx={{ ml: 'auto' }}>
                        <IconButton
                            size="small"
                            onClick={onAddFilm}
                            sx={{ p: 0.25, color: '#64748b', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                        >
                            <AddIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Box>
                </Box>

                <Table size="small" sx={{ tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: '30%' }} />
                        <col style={{ width: '30%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '6%' }} />
                    </colgroup>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={hCellSx}>Film</TableCell>
                            <TableCell sx={hCellSx}>Scenes</TableCell>
                            <TableCell sx={{ ...hCellSx, textAlign: 'center' }}>Equipment</TableCell>
                            <TableCell sx={{ ...hCellSx, textAlign: 'center' }}>Activity</TableCell>
                            <TableCell sx={{ ...hCellSx, textAlign: 'right' }}>Duration</TableCell>
                            <TableCell sx={{ ...hCellSx, textAlign: 'center' }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {contentItems.length > 0 ? contentItems.map((item, _idx) => {
                            const realIdx = items.indexOf(item);
                            const film = films.find(f => f.id === item.referenceId);
                            const isBuilding = buildingFilmIds?.has(item.referenceId || 0) ?? false;
                            const canOpenFilm = !isBuilding;
                            const progressLabel = isBuilding ? 'Building film...' : 'Preparing film...';

                            /* Film data not loaded yet — show placeholder row with progress bar */
                            if (!film) {
                                if (!isBuilding) return null;
                                return (
                                    <React.Fragment key={item.id || realIdx}>
                                        <TableRow sx={{ opacity: 0.6, cursor: 'default' }}>
                                            <TableCell sx={bCellSx}>
                                                <Typography sx={{ fontSize: '0.73rem', fontWeight: 600, color: '#f1f5f9' }}>
                                                    {item.description}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={bCellSx} />
                                            <TableCell sx={bCellSx} />
                                            <TableCell sx={bCellSx} />
                                            <TableCell sx={bCellSx} />
                                            <TableCell sx={bCellSx} />
                                        </TableRow>
                                        <FilmBuildProgressRow
                                            filmId={item.referenceId || 0}
                                            enabled={isBuilding}
                                            fallbackLabel="Building film..."
                                        />
                                    </React.Fragment>
                                );
                            }

                            const stats = getFilmStats(films, item.referenceId || 0);
                            const linkedActivity = item.config?.activity_id
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                ? packageActivities.find((a: any) => a.id === item.config?.activity_id)
                                : null;
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const equipCount = film.scenes?.reduce((total: number, s: any) => total + (Array.isArray(s.equipment) ? s.equipment.length : 0), 0) ?? 0;
                            const sceneNames = film.scenes?.slice(0, 3).map((s: { id: number; name: string }) => s.name) || [];
                            const moreScenes = (film.scenes?.length || 0) - 3;

                            return (
                                <React.Fragment key={item.id || realIdx}>
                                <TableRow
                                    onClick={() => { if (canOpenFilm) onConfigureItem(item); }}
                                    sx={{
                                        cursor: canOpenFilm ? 'pointer' : 'default',
                                        opacity: isBuilding ? 0.6 : 1,
                                        transition: 'all 0.15s ease',
                                        '&:hover': canOpenFilm ? {
                                            bgcolor: 'rgba(100, 140, 255, 0.04)',
                                            '& .cnt-del': { opacity: 1 },
                                        } : {},
                                    }}
                                >
                                    <TableCell sx={bCellSx}>
                                        <Typography sx={{ fontSize: '0.73rem', fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.description}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={bCellSx}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                            {sceneNames.map((name, i) => (
                                                <Typography key={i} sx={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {name}
                                                </Typography>
                                            ))}
                                            {moreScenes > 0 && (
                                                <Typography sx={{ fontSize: '0.55rem', color: '#475569' }}>+{moreScenes} more</Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ ...bCellSx, textAlign: 'center' }}>
                                        <Typography sx={{ fontSize: '0.7rem', color: equipCount > 0 ? '#e2e8f0' : '#334155', fontFamily: 'monospace' }}>
                                            {equipCount || '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ ...bCellSx, textAlign: 'center' }}>
                                        {linkedActivity ? (
                                            <Tooltip title={`Linked to: ${linkedActivity.name}`} placement="top">
                                                <Typography sx={{ fontSize: '0.62rem', color: colors.accentLight, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {linkedActivity.name}
                                                </Typography>
                                            </Tooltip>
                                        ) : (
                                            <Typography sx={{ fontSize: '0.62rem', color: '#334155' }}>—</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ ...bCellSx, textAlign: 'right' }}>
                                        <Typography sx={{ fontSize: '0.7rem', color: stats.totalDuration !== '0:00' ? '#94a3b8' : '#334155', fontFamily: 'monospace' }}>
                                            {stats.totalDuration !== '0:00' ? stats.totalDuration : '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ ...bCellSx, textAlign: 'center' }}>
                                        <IconButton
                                            className="cnt-del"
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); onRemoveItem(realIdx); }}
                                            sx={{ p: 0.25, opacity: 0, transition: 'opacity 0.15s', color: 'rgba(255,255,255,0.2)', '&:hover': { color: colors.error } }}
                                        >
                                            <DeleteIcon sx={{ fontSize: 12 }} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                                {item.referenceId != null && (
                                    <FilmBuildProgressRow
                                        filmId={item.referenceId}
                                        enabled={isBuilding}
                                        fallbackLabel={progressLabel}
                                    />
                                )}
                                </React.Fragment>
                            );
                        }) : (
                            <TableRow>
                                <TableCell colSpan={6} sx={{ ...bCellSx, borderBottom: 'none' }}>
                                    <Typography sx={{ fontSize: '0.65rem', color: '#475569', fontStyle: 'italic', textAlign: 'center', py: 1 }}>
                                        No content yet
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                        {isCreatingFilm && (
                            <>
                                <TableRow sx={{ opacity: 0.5, cursor: 'default' }}>
                                    <TableCell sx={bCellSx}>
                                        <Typography sx={{ fontSize: '0.73rem', fontWeight: 600, color: '#f1f5f9' }}>
                                            New Film
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={bCellSx} />
                                    <TableCell sx={bCellSx} />
                                    <TableCell sx={bCellSx} />
                                    <TableCell sx={bCellSx} />
                                    <TableCell sx={bCellSx} />
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ p: 0, border: 'none' }}>
                                        <Box sx={{ mx: 1.5, my: 0.5, borderRadius: 1, overflow: 'hidden', bgcolor: 'rgba(100, 140, 255, 0.04)' }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={filmCreationProgress.progress * 100}
                                                sx={{
                                                    height: 3,
                                                    bgcolor: 'rgba(100, 140, 255, 0.08)',
                                                    '& .MuiLinearProgress-bar': {
                                                        background: 'linear-gradient(90deg, rgba(100,140,255,0.5), #648CFF)',
                                                        transition: 'transform 0.4s ease',
                                                    },
                                                }}
                                            />
                                            <Box sx={{ px: 1, py: 0.25, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Box
                                                    sx={{
                                                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                                                        border: '1.5px solid rgba(100,140,255,0.6)',
                                                        borderTopColor: 'transparent',
                                                        animation: 'filmBuildSpin 0.8s linear infinite',
                                                        '@keyframes filmBuildSpin': { to: { transform: 'rotate(360deg)' } },
                                                    }}
                                                />
                                                <Typography sx={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.2px' }}>
                                                    {filmCreationProgress.label}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            </>
                        )}
                    </TableBody>
                </Table>
            </Box>
    );
}
