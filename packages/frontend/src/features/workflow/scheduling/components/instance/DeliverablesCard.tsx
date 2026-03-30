'use client';

import React from 'react';
import {
    Box, Typography, Button, IconButton,
    Chip, Stack, SxProps, Theme,
} from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import VideocamIcon from '@mui/icons-material/Videocam';
import { ScheduleCardShell } from '@/features/catalog/packages/components/detail/cards';

// ─── Props ──────────────────────────────────────────────────────────
export interface InstanceDeliverablesCardProps {
    /** PackageFilm / ProjectFilm junction records */
    packageFilms: any[];
    onFilmClick: (pf: any) => void;
    onDeleteFilm: (filmRecordId: number) => void;
    onAddFilm: () => void;
    onAddService?: () => void;
    /** Disable Add Film when no activities exist yet */
    hasActivities: boolean;
    cardSx: SxProps<Theme>;
}

// ─── Component ──────────────────────────────────────────────────────
export function DeliverablesCard({
    packageFilms,
    onFilmClick,
    onDeleteFilm,
    onAddFilm,
    onAddService,
    hasActivities,
    cardSx,
}: InstanceDeliverablesCardProps) {
    return (
        <ScheduleCardShell
            title="Deliverables"
            icon={<VideoLibraryIcon />}
            accentColor="#648CFF"
            showHeaderBorder={packageFilms.length > 0}
            headerRight={packageFilms.length > 0
                ? <Chip label={`${packageFilms.length}`} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(100, 140, 255, 0.1)', color: '#648CFF', border: '1px solid rgba(100, 140, 255, 0.2)', '& .MuiChip-label': { px: 0.6 } }} />
                : undefined
            }
            cardSx={cardSx}
        >

            {/* Film list */}
            <Box sx={{ px: 2.5, py: packageFilms.length > 0 ? 1.5 : 0 }}>
                {packageFilms.length > 0 ? (
                    <Stack spacing={0.5}>
                        {packageFilms.map((pf: any) => {
                            const film = pf.film;
                            const sceneCount = pf.scene_schedules?.length || film?.scenes?.length || 0;
                            return (
                                <Box
                                    key={pf.id}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 1,
                                        py: 0.75, px: 1.5, mx: -1, borderRadius: 1.5,
                                        borderLeft: '3px solid rgba(100,140,255,0.4)',
                                        bgcolor: 'rgba(100,140,255,0.025)',
                                        transition: 'background 0.15s ease',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            bgcolor: 'rgba(100,140,255,0.07)',
                                            '& .dlv-del': { opacity: 1 },
                                        },
                                    }}
                                    onClick={() => onFilmClick(pf)}
                                >
                                    {/* Type badge */}
                                    <Box sx={{ flexShrink: 0 }}>
                                        <Box sx={{
                                            display: 'inline-flex', alignItems: 'center', gap: 0.4,
                                            px: 0.75, py: 0.2, borderRadius: 0.75,
                                            bgcolor: 'rgba(100,140,255,0.12)',
                                            border: '1px solid rgba(100,140,255,0.3)',
                                        }}>
                                            <VideocamIcon sx={{ fontSize: 8, color: '#648CFF' }} />
                                            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#648CFF', lineHeight: 1, letterSpacing: '0.2px' }}>Film</Typography>
                                        </Box>
                                    </Box>

                                    {/* Film name */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {film?.name || `Film #${pf.film_id}`}
                                        </Typography>
                                        {sceneCount > 0 && (
                                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
                                                <Chip
                                                    icon={<ContentCutIcon sx={{ fontSize: '10px !important', color: '#94a3b8 !important' }} />}
                                                    label={`${sceneCount} scene${sceneCount !== 1 ? 's' : ''}`}
                                                    size="small"
                                                    sx={{ height: 18, fontSize: '0.55rem', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: 'none' }}
                                                />
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Delete */}
                                    <Box className="dlv-del" sx={{ opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); onDeleteFilm(pf.id); }}
                                            sx={{ p: 0.25, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}
                                        >
                                            <DeleteIcon sx={{ fontSize: 12 }} />
                                        </IconButton>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Stack>
                ) : (
                    <Box sx={{ py: 2, textAlign: 'center' }}>
                        <VideoLibraryIcon sx={{ fontSize: 32, color: '#475569', mb: 0.5, opacity: 0.3 }} />
                        <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>No films linked</Typography>
                    </Box>
                )}
            </Box>

            {/* Footer: Add buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, px: 2.5, pb: 1.5 }}>
                <Button
                    size="small"
                    startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                    onClick={onAddFilm}
                    disabled={!hasActivities}
                    sx={{ fontSize: '0.6rem', color: '#648CFF', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(100, 140, 255, 0.06)' } }}
                >
                    Add Film
                </Button>
                {onAddService && (
                    <Button
                        size="small"
                        startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                        onClick={onAddService}
                        sx={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', color: '#94a3b8' } }}
                    >
                        Add Service
                    </Button>
                )}
            </Box>
        </ScheduleCardShell>
    );
}
