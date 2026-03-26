'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { PublicWizardTemplate } from '../../types';
import { getColors, fadeInUp, float, subtleFloat, gradientShift, revealSx } from '../../constants/public-wizard-theme';

interface Props {
    template: PublicWizardTemplate;
    visible: boolean;
}

export default function PortalWizardHero({ template, visible }: Props) {
    const colors = getColors();
    const brand = template.brand;
    const brandName = brand?.display_name || brand?.name || '';
    const brandInitial = brandName.charAt(0).toUpperCase();

    return (
        <Box sx={{
            position: 'relative', py: { xs: 10, md: 14 }, px: 3, textAlign: 'center',
            background: `
                radial-gradient(ellipse 120% 80% at 50% -20%, ${alpha(colors.gradient1, 0.2)} 0%, transparent 50%),
                radial-gradient(ellipse 80% 50% at 80% 20%, ${alpha(colors.gradient2, 0.12)} 0%, transparent 50%),
                ${colors.bg}`,
            overflow: 'hidden',
        }}>
            {/* Decorative orbs */}
            <Box sx={{ position: 'absolute', top: '5%', right: '8%', width: { xs: 180, md: 320 }, height: { xs: 180, md: 320 }, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(colors.gradient1, 0.15)} 0%, transparent 70%)`, filter: 'blur(60px)', animation: `${float} 8s ease-in-out infinite`, pointerEvents: 'none' }} />
            <Box sx={{ position: 'absolute', bottom: '0%', left: '5%', width: { xs: 140, md: 240 }, height: { xs: 140, md: 240 }, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(colors.gradient2, 0.12)} 0%, transparent 70%)`, filter: 'blur(50px)', animation: `${float} 10s ease-in-out 1s infinite`, pointerEvents: 'none' }} />
            <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${alpha(colors.gradient1, 0.04)}, transparent 40%, ${alpha(colors.gradient2, 0.04)})`, backgroundSize: '400% 400%', animation: `${gradientShift} 15s ease infinite`, pointerEvents: 'none' }} />

            {/* Ornamental line */}
            <Box sx={{ width: 64, height: 2, background: `linear-gradient(90deg, transparent, ${alpha(colors.accent, 0.5)}, transparent)`, borderRadius: 1, mx: 'auto', mb: 5, position: 'relative', zIndex: 1, ...revealSx(visible, 0) }} />

            {/* Brand monogram */}
            {brandInitial && (
                <Box sx={{
                    width: { xs: 72, md: 88 }, height: { xs: 72, md: 88 }, borderRadius: '50%',
                    border: `2px solid ${alpha(colors.accent, 0.2)}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mx: 'auto', mb: 5, position: 'relative', zIndex: 1,
                    animation: `${subtleFloat} 6s ease-in-out infinite`,
                    opacity: visible ? 1 : 0, transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.05s',
                    '&::before': { content: '""', position: 'absolute', inset: -6, borderRadius: '50%', border: `1px solid ${alpha(colors.accent, 0.08)}` },
                }}>
                    {brand?.logo_url ? (
                        <Box component="img" src={brand.logo_url} alt={brandName} sx={{ width: '55%', height: '55%', objectFit: 'contain' }} />
                    ) : (
                        <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 300, background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {brandInitial}
                        </Typography>
                    )}
                </Box>
            )}

            <Typography variant="h1" sx={{ fontWeight: 200, letterSpacing: '-0.03em', position: 'relative', zIndex: 1, fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' }, lineHeight: 1.08, background: `linear-gradient(135deg, ${colors.text} 0%, ${alpha(colors.text, 0.6)} 50%, ${colors.text} 100%)`, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', ...revealSx(visible, 0.1) }}>
                {template.name}
            </Typography>

            {template.description && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 3, mb: 4, position: 'relative', zIndex: 1, ...revealSx(visible, 0.2) }}>
                    <Box sx={{ width: 32, height: 1, background: `linear-gradient(90deg, transparent, ${alpha(colors.muted, 0.3)})` }} />
                    <Typography sx={{ color: colors.muted, fontWeight: 400, fontSize: { xs: '0.9rem', md: '1.05rem' }, letterSpacing: '0.02em', maxWidth: 480 }}>
                        {template.description}
                    </Typography>
                    <Box sx={{ width: 32, height: 1, background: `linear-gradient(90deg, ${alpha(colors.muted, 0.3)}, transparent)` }} />
                </Box>
            )}
            <Box sx={{ width: 48, height: 1, background: `linear-gradient(90deg, transparent, ${alpha(colors.accent, 0.25)}, transparent)`, borderRadius: 1, mx: 'auto', mt: 4, position: 'relative', zIndex: 1, ...revealSx(visible, 0.3) }} />
        </Box>
    );
}
