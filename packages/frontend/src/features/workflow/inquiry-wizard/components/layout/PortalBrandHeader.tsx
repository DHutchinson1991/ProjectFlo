'use client';
import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Print as PrintIcon } from '@mui/icons-material';
import type { PublicBrand } from '../../types';
import { getColors, fadeIn } from '../../constants/public-wizard-theme';

interface Props {
    brand: PublicBrand | null;
}

export default function PortalBrandHeader({ brand }: Props) {
    const colors = getColors();
    const brandName = brand?.display_name || brand?.name || '';
    const brandInitial = brandName.charAt(0).toUpperCase();

    return (
        <Box sx={{
            position: 'sticky', top: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', gap: 1.5,
            py: 1.5, px: 3,
            backdropFilter: 'blur(16px) saturate(1.8)',
            bgcolor: alpha(colors.card, 0.7),
            borderBottom: `1px solid ${alpha(colors.border, 0.6)}`,
            animation: `${fadeIn} 0.5s ease both`,
            '@media print': { display: 'none' },
        }}>
            {brand?.logo_url ? (
                <Box component="img" src={brand.logo_url} alt={brandName}
                    sx={{ height: 28, width: 'auto', objectFit: 'contain', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }} />
            ) : brandInitial ? (
                <Box sx={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})` }}>
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem', lineHeight: 1 }}>{brandInitial}</Typography>
                </Box>
            ) : null}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colors.text, letterSpacing: 1, fontSize: '0.8rem', textTransform: 'uppercase', flex: 1 }}>
                {brandName}
            </Typography>
            <IconButton size="small" onClick={() => window.print()}
                sx={{ color: colors.muted, '&:hover': { color: colors.text }, '@media print': { display: 'none' } }}
                aria-label="Save as PDF">
                <PrintIcon sx={{ fontSize: 18 }} />
            </IconButton>
        </Box>
    );
}
