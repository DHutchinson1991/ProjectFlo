import React from 'react';
import { Box, Typography, Chip, LinearProgress } from '@mui/material';
import { TrendingUp, AccessTime, LocalFireDepartment, EmojiEvents } from '@mui/icons-material';
import { DEFAULT_CURRENCY, formatCurrency } from '@projectflo/shared';
import type { ConversionData } from '../lib';

interface KpiMetricsStripProps {
    dealValue: number;
    taxRate?: number;
    currency: string;
    daysInPipeline: number;
    conversionData: ConversionData;
    completedCount: number;
    totalPhases: number;
}

const KpiMetricsStrip: React.FC<KpiMetricsStripProps> = ({
    dealValue,
    taxRate,
    currency,
    daysInPipeline,
    conversionData,
    completedCount,
    totalPhases,
}) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2.5 }}>
        {/* Deal Value */}
        <Box sx={{
            p: 2, borderRadius: 2.5,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))',
            border: '1px solid rgba(16, 185, 129, 0.12)',
            transition: 'all 0.3s ease',
            '&:hover': { border: '1px solid rgba(16, 185, 129, 0.25)', transform: 'translateY(-1px)', boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)' },
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                <TrendingUp sx={{ fontSize: 15, color: '#10b981' }} />
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deal Value</Typography>
            </Box>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em' }}>
                {dealValue > 0 ? formatCurrency(dealValue, currency || DEFAULT_CURRENCY) : '\u2014'}
            </Typography>
            {dealValue > 0 && (taxRate ?? 0) > 0 && (
                <Typography sx={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 500 }}>incl. {taxRate}% tax</Typography>
            )}
            {dealValue === 0 && <Typography sx={{ fontSize: '0.65rem', color: '#475569', mt: 0.25 }}>Create an estimate</Typography>}
        </Box>

        {/* Pipeline Age */}
        <Box sx={{
            p: 2, borderRadius: 2.5,
            background: daysInPipeline > 14
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.02))',
            border: `1px solid ${daysInPipeline > 14 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)'}`,
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                <AccessTime sx={{ fontSize: 15, color: daysInPipeline > 14 ? '#ef4444' : '#3b82f6' }} />
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pipeline Age</Typography>
            </Box>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: daysInPipeline > 14 ? '#ef4444' : '#3b82f6', letterSpacing: '-0.02em' }}>
                {daysInPipeline}d
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: '#475569', mt: 0.25 }}>
                {daysInPipeline === 0 ? 'Just created' : daysInPipeline <= 7 ? 'Fresh lead' : daysInPipeline <= 14 ? 'Follow up soon' : 'Needs attention!'}
            </Typography>
        </Box>

        {/* Conversion Score */}
        <Box sx={{
            p: 2, borderRadius: 2.5,
            background: `linear-gradient(135deg, ${conversionData.color}0D, ${conversionData.color}05)`,
            border: `1px solid ${conversionData.color}1A`,
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-1px)', boxShadow: `0 4px 16px ${conversionData.color}08` },
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                <LocalFireDepartment sx={{ fontSize: 15, color: conversionData.color }} />
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deal Health</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: conversionData.color, letterSpacing: '-0.02em' }}>
                    {conversionData.score}%
                </Typography>
                <Chip label={conversionData.label} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 800, bgcolor: `${conversionData.color}15`, color: conversionData.color, border: `1px solid ${conversionData.color}20` }} />
            </Box>
            <LinearProgress variant="determinate" value={conversionData.score} sx={{
                mt: 1, height: 4, borderRadius: 2, bgcolor: 'rgba(52, 58, 68, 0.15)',
                '& .MuiLinearProgress-bar': { borderRadius: 2, background: `linear-gradient(90deg, ${conversionData.color}80, ${conversionData.color})` },
            }} />
        </Box>

        {/* Progress */}
        <Box sx={{
            p: 2, borderRadius: 2.5,
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(139, 92, 246, 0.02))',
            border: '1px solid rgba(139, 92, 246, 0.12)',
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 16px rgba(139, 92, 246, 0.08)' },
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                <EmojiEvents sx={{ fontSize: 15, color: '#8b5cf6' }} />
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progress</Typography>
            </Box>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#8b5cf6', letterSpacing: '-0.02em' }}>
                {completedCount}/{totalPhases}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: '#475569', mt: 0.25 }}>
                {completedCount === 0 ? 'Get started!' : completedCount < 4 ? 'Great progress' : completedCount < 7 ? 'Almost there!' : 'Nearly done!'}
            </Typography>
        </Box>
    </Box>
);

export { KpiMetricsStrip };
