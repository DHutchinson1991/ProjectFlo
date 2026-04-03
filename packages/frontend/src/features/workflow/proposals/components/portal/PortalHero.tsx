"use client";

import React from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    CalendarToday as CalendarIcon,
    Place as PlaceIcon,
    Assignment as FormIcon,
} from '@mui/icons-material';
import {
    float, gradientShift, subtleFloat, revealSx, useReveal,
} from '@/features/workflow/proposals/utils/portal/animations';
import type { PortalDashboardColors } from '@/features/workflow/proposals/utils/portal/themes';
import type { PortalBrand } from '@/features/workflow/proposals/types/portal';

interface PortalHeroProps {
    contactLastName: string | null;
    eventDate: string | null;
    eventType: string | null;
    venue: string | null;
    brand: PortalBrand | null;
    colors: PortalDashboardColors;
}

export function PortalHero({ contactLastName, eventDate, eventType, venue, brand, colors }: PortalHeroProps) {
    const r = useReveal();
    const brandName = brand?.display_name || brand?.name || '';
    const brandInitial = brandName.charAt(0).toUpperCase();

    const coupleName = contactLastName ? `Mr & Mrs ${contactLastName}` : 'Your Portal';

    return (
        <Box
            ref={r.ref}
            sx={{
                position: 'relative', py: { xs: 6, md: 9 }, px: 3, textAlign: 'center',
                background: `
                    radial-gradient(ellipse 120% 80% at 50% -20%, ${alpha(colors.gradient1, 0.18)} 0%, transparent 50%),
                    radial-gradient(ellipse 80% 50% at 80% 20%, ${alpha(colors.gradient2, 0.10)} 0%, transparent 50%),
                    ${colors.bg}
                `,
                overflow: 'hidden',
            }}
        >
            {/* Floating orbs */}
            <Box sx={{ position: 'absolute', top: '5%', right: '8%', width: { xs: 160, md: 280 }, height: { xs: 160, md: 280 }, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(colors.gradient1, 0.12)} 0%, transparent 70%)`, filter: 'blur(60px)', animation: `${float} 8s ease-in-out infinite`, pointerEvents: 'none' }} />
            <Box sx={{ position: 'absolute', bottom: '0%', left: '5%', width: { xs: 120, md: 200 }, height: { xs: 120, md: 200 }, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(colors.gradient2, 0.1)} 0%, transparent 70%)`, filter: 'blur(50px)', animation: `${float} 10s ease-in-out 1s infinite`, pointerEvents: 'none' }} />

            {/* Gradient overlay */}
            <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${alpha(colors.gradient1, 0.03)}, transparent 40%, ${alpha(colors.gradient2, 0.03)})`, backgroundSize: '400% 400%', animation: `${gradientShift} 15s ease infinite`, pointerEvents: 'none' }} />

            {/* Brand monogram */}
            {brandInitial && (
                <Box sx={{
                    width: { xs: 64, md: 76 }, height: { xs: 64, md: 76 }, borderRadius: '50%',
                    border: `2px solid ${alpha(colors.accent, 0.2)}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mx: 'auto', mb: 3, position: 'relative', zIndex: 1,
                    animation: `${subtleFloat} 6s ease-in-out infinite`,
                    opacity: r.visible ? 1 : 0,
                    transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1) 0.05s',
                    '&::before': { content: '""', position: 'absolute', inset: -5, borderRadius: '50%', border: `1px solid ${alpha(colors.accent, 0.08)}` },
                }}>
                    {brand?.logo_url ? (
                        <Box component="img" src={brand.logo_url} alt={brandName} sx={{ width: '55%', height: '55%', objectFit: 'contain' }} />
                    ) : (
                        <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.8rem' }, fontWeight: 300, background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {brandInitial}
                        </Typography>
                    )}
                </Box>
            )}

            {/* Couple name */}
            <Typography
                variant="h1"
                sx={{
                    fontWeight: 200, letterSpacing: '-0.03em', position: 'relative', zIndex: 1,
                    fontSize: { xs: '1.85rem', sm: '2.5rem', md: '3rem' }, lineHeight: 1.08,
                    background: `linear-gradient(135deg, ${colors.text} 0%, ${alpha(colors.text, 0.6)} 50%, ${colors.text} 100%)`,
                    backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    ...revealSx(r.visible, 0.1),
                }}
            >
                {coupleName}
            </Typography>

            <Typography sx={{
                color: colors.muted, fontWeight: 400, fontSize: { xs: '0.85rem', md: '0.95rem' },
                letterSpacing: '0.02em', mt: 2, position: 'relative', zIndex: 1,
                ...revealSx(r.visible, 0.2),
            }}>
                Everything about your {eventType ? eventType.toLowerCase() : 'event'} in one place
            </Typography>

            {/* Event info pills */}
            {(eventDate || venue) && (
                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mt: 3, flexWrap: 'wrap',
                    position: 'relative', zIndex: 1,
                    ...revealSx(r.visible, 0.3),
                }}>
                    {eventDate && (
                        <InfoPill icon={<CalendarIcon sx={{ fontSize: 14, color: colors.accent }} />} colors={colors}>
                            {new Date(eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </InfoPill>
                    )}
                    {venue && (
                        <InfoPill icon={<PlaceIcon sx={{ fontSize: 14, color: '#6366f1' }} />} colors={colors}>
                            {venue}
                        </InfoPill>
                    )}
                    {eventType && (
                        <InfoPill icon={<FormIcon sx={{ fontSize: 14, color: '#a855f7' }} />} colors={colors}>
                            {eventType}
                        </InfoPill>
                    )}
                </Box>
            )}
        </Box>
    );
}

function InfoPill({ icon, children, colors }: { icon: React.ReactNode; children: React.ReactNode; colors: PortalDashboardColors }) {
    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.5, borderRadius: '10px', bgcolor: alpha(colors.card, 0.6), border: `1px solid ${alpha(colors.border, 0.5)}`, backdropFilter: 'blur(8px)' }}>
            {icon}
            <Typography sx={{ color: colors.text, fontSize: '0.78rem', fontWeight: 500 }}>
                {children}
            </Typography>
        </Box>
    );
}
