'use client';

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import {
    ErrorOutline,
} from '@mui/icons-material';
import MovieIcon from '@mui/icons-material/Movie';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MicIcon from '@mui/icons-material/Mic';
import EventIcon from '@mui/icons-material/Event';
import PlaceIcon from '@mui/icons-material/Place';
import PeopleIcon from '@mui/icons-material/People';
import { formatCurrency } from '@/features/workflow/proposals/utils/portal/formatting';
import type { PackageDetailsProps } from './types';

const PackageDetails: React.FC<PackageDetailsProps> = ({
    selectedPkg,
    stats,
    selectedSetInfo,
    displayCost,
    displayTax,
    estimateBelowLive,
    estimateDiffPct,
    displayFilms,
    currencyCode,
    catColor,
    tierColor,
}) => {
    return (
        <Box>
            {/* Tier label bar */}
            {selectedSetInfo && (
                <Box sx={{
                    px: 2.5, py: 0.6,
                    bgcolor: `${tierColor}0F`,
                    borderTop: '1px solid rgba(52, 58, 68, 0.2)',
                    borderBottom: '1px solid rgba(52, 58, 68, 0.2)',
                }}>
                    <Typography sx={{
                        fontSize: '0.6rem', fontWeight: 700, color: tierColor,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                        {selectedSetInfo.tierLabel}
                    </Typography>
                </Box>
            )}

            {/* Tier color accent */}
            {selectedSetInfo && (
                <Box sx={{ height: 3, background: `linear-gradient(90deg, ${tierColor}, ${tierColor}80)` }} />
            )}

            {/* Category chip + price */}
            <Box sx={{ px: 2.5, pt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Chip
                    label={selectedPkg.category || 'General'}
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
                        {formatCurrency(displayCost, currencyCode)}
                    </Typography>
                    {displayTax && displayTax.rate > 0 && (
                        <Typography sx={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 500, mt: -0.25 }}>
                            incl. {displayTax.rate}% tax
                        </Typography>
                    )}
                    {estimateBelowLive && estimateDiffPct > 0 && (
                        <Typography sx={{
                            fontSize: '0.6rem', color: '#f59e0b', fontWeight: 600, mt: 0.25,
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.4,
                        }}>
                            <ErrorOutline sx={{ fontSize: 12 }} />
                            {estimateDiffPct}% below current package cost
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Name + Description */}
            <Box sx={{ px: 2.5, pt: 1.5, pb: 2 }}>
                <Typography sx={{
                    fontWeight: 800, color: '#f1f5f9', fontSize: '1.05rem', lineHeight: 1.3, mb: 0.5,
                }}>
                    {selectedPkg.name}
                </Typography>
                {selectedPkg.description && (
                    <Typography sx={{
                        color: '#64748b', fontSize: '0.72rem', lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                        {selectedPkg.description}
                    </Typography>
                )}
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

            {/* Films list */}
            <Box sx={{ px: 2.5, py: 2 }}>
                <Typography sx={{
                    fontSize: '0.6rem', fontWeight: 700, color: '#475569',
                    textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.25,
                }}>
                    Films
                </Typography>
                {displayFilms.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        {displayFilms.map((item, idx) => (
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
        </Box>
    );
};

export default PackageDetails;
