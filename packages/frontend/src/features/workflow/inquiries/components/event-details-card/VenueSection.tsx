'use client';

import React from 'react';
import { Box, Typography, Stack, Chip } from '@mui/material';
import { Place, NearMe, LocationOff } from '@mui/icons-material';
import type { VenueSectionProps } from './types';

/** Renders venue name, structured address, and optional distance chip. */
const VenueSection: React.FC<VenueSectionProps> = ({
    venueShortName,
    venueLabel,
    structuredAddress,
    distance,
    hasVenueCoords,
}) => {
    return (
        <Box sx={{
            display: 'flex', alignItems: 'flex-start', gap: 1.5,
            borderLeft: '2px solid rgba(100,116,139,0.2)',
            pl: 1.5,
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.15, flexShrink: 0 }}>
                {venueShortName
                    ? <Place sx={{ fontSize: 14, color: '#64748b' }} />
                    : <LocationOff sx={{ fontSize: 14, color: '#475569' }} />}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.25 }}>
                    {venueLabel}
                </Typography>
                {venueShortName ? (
                    <>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3 }}>
                            {venueShortName}
                        </Typography>
                        {structuredAddress.length > 0 && (
                            <Stack spacing={0.2} sx={{ mt: 0.5 }}>
                                {structuredAddress.map((field, i) => (
                                    <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                                        {field.label && (
                                            <Typography sx={{ fontSize: '0.62rem', color: '#475569', fontWeight: 600, minWidth: 52, flexShrink: 0 }}>
                                                {field.label}
                                            </Typography>
                                        )}
                                        <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4 }}>
                                            {field.value}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </>
                ) : (
                    <Typography sx={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500, fontStyle: 'italic' }}>
                        Location unknown
                    </Typography>
                )}
                {hasVenueCoords && distance && (
                    <Chip
                        icon={<NearMe sx={{ fontSize: 12 }} />}
                        label={distance}
                        size="small"
                        sx={{
                            mt: 1,
                            height: 22,
                            bgcolor: 'rgba(59, 130, 246, 0.08)',
                            border: '1px solid rgba(59, 130, 246, 0.15)',
                            color: '#60a5fa',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            '& .MuiChip-icon': { color: '#60a5fa' },
                        }}
                    />
                )}
            </Box>
        </Box>
    );
};

export default VenueSection;
