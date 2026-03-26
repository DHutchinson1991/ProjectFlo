'use client';
import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { PortalColors } from '../../constants/public-wizard-theme';
import type { PublicPackageData } from '../../types';

interface Props {
    packages: PublicPackageData[];
    selectedPackageId: number | null;
    onSelect: (id: number | null) => void;
    currencySymbol: string;
    selectedEventType: string | null;
    colors: PortalColors;
    cardSx: object;
}

export default function PortalPackageStep({ packages, selectedPackageId, onSelect, currencySymbol, selectedEventType, colors, cardSx }: Props) {
    return (
        <Stack spacing={2.5}>
            {selectedEventType && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography sx={{ color: colors.muted, fontSize: '0.78rem' }}>Showing packages for</Typography>
                    <Box sx={{ px: 1.25, py: 0.3, borderRadius: '8px', bgcolor: alpha(colors.accent, 0.12), border: `1px solid ${alpha(colors.accent, 0.3)}` }}>
                        <Typography sx={{ color: colors.text, fontSize: '0.75rem', fontWeight: 600 }}>{selectedEventType}</Typography>
                    </Box>
                </Box>
            )}

            {/* Decide later */}
            <Box onClick={() => onSelect(null)} sx={{
                ...cardSx, p: 3, cursor: 'pointer',
                borderColor: selectedPackageId === null ? alpha(colors.accent, 0.3) : undefined,
                bgcolor: selectedPackageId === null ? alpha(colors.accent, 0.08) : alpha(colors.card, 0.7),
                display: 'flex', alignItems: 'center', gap: 2,
            }}>
                <Box sx={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${selectedPackageId === null ? colors.accent : colors.border}`,
                    bgcolor: selectedPackageId === null ? colors.accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {selectedPackageId === null && <Box sx={{ width: 8, height: 8, bgcolor: '#fff', borderRadius: '50%' }} />}
                </Box>
                <Box>
                    <Typography sx={{ color: alpha(colors.text, 0.9), fontSize: '0.875rem', fontWeight: 500 }}>Decide later</Typography>
                    <Typography sx={{ color: colors.muted, fontSize: '0.72rem', mt: 0.2 }}>Skip for now — you can discuss packages with us directly</Typography>
                </Box>
            </Box>

            {packages.length === 0 ? (
                <Box sx={{ ...cardSx, p: 3, textAlign: 'center' }}>
                    <Typography sx={{ color: colors.muted, fontSize: '0.875rem' }}>
                        {selectedEventType ? `No packages available for ${selectedEventType} events` : 'No packages available at the moment'}
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                    {packages.map((pkg) => {
                        const isSelected = selectedPackageId === pkg.id;
                        const price = pkg.base_price ?? pkg.price;
                        const items = pkg.contents?.items ?? [];
                        return (
                            <Box key={pkg.id} onClick={() => onSelect(pkg.id)} sx={{
                                ...cardSx, p: 3, cursor: 'pointer',
                                borderColor: isSelected ? alpha(colors.accent, 0.3) : undefined,
                                bgcolor: isSelected ? alpha(colors.accent, 0.08) : alpha(colors.card, 0.7),
                                display: 'flex', flexDirection: 'column', gap: 1.5, position: 'relative', overflow: 'hidden',
                            }}>
                                {isSelected && <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${colors.gradient1}, ${colors.gradient2})` }} />}

                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                                    <Typography sx={{ color: isSelected ? colors.text : alpha(colors.text, 0.9), fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.3, flex: 1 }}>
                                        {pkg.name}
                                    </Typography>
                                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, mt: 0.15, border: `2px solid ${isSelected ? colors.accent : colors.border}`, bgcolor: isSelected ? colors.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {isSelected && <Box sx={{ width: 7, height: 7, bgcolor: '#fff', borderRadius: '50%' }} />}
                                    </Box>
                                </Box>

                                {price != null && (
                                    <Typography sx={{ background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1 }}>
                                        {currencySymbol}{Number(price).toLocaleString()}
                                    </Typography>
                                )}

                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                    {pkg.category && <Box sx={{ px: 1, py: 0.3, borderRadius: '6px', bgcolor: alpha('#a855f7', 0.1), border: `1px solid ${alpha('#a855f7', 0.3)}` }}><Typography sx={{ color: '#c084fc', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{pkg.category}</Typography></Box>}
                                    {items.length > 0 && <Box sx={{ px: 1, py: 0.3, borderRadius: '6px', bgcolor: alpha('#22c55e', 0.08), border: `1px solid ${alpha('#22c55e', 0.25)}` }}><Typography sx={{ color: '#34d399', fontSize: '0.68rem', fontWeight: 600 }}>{items.length} {items.length === 1 ? 'item' : 'items'} included</Typography></Box>}
                                </Box>

                                {pkg.description && <Typography sx={{ color: colors.muted, fontSize: '0.775rem', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{pkg.description}</Typography>}

                                {items.length > 0 && (
                                    <Stack spacing={0.4} sx={{ mt: 0.5 }}>
                                        {items.slice(0, 3).map((item, i) => (
                                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: isSelected ? colors.accent : alpha(colors.border, 0.8), flexShrink: 0 }} />
                                                <Typography sx={{ color: colors.muted, fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</Typography>
                                            </Box>
                                        ))}
                                        {items.length > 3 && <Typography sx={{ color: colors.muted, fontSize: '0.68rem', opacity: 0.6, pl: 1.5 }}>+ {items.length - 3} more</Typography>}
                                    </Stack>
                                )}
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Stack>
    );
}
