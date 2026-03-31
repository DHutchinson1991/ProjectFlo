import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import { CheckCircle, WarningAmber } from '@mui/icons-material';

export interface StatusBannerProps {
    crewConflicts: number;
    equipmentConflicts: number;
    crewTotal: number;
    equipmentTotal: number;
    crewReady: number;
    equipmentReady: number;
}

export function StatusBanner({ crewConflicts, equipmentConflicts, crewTotal, equipmentTotal, crewReady, equipmentReady }: StatusBannerProps) {
    const totalConflicts = crewConflicts + equipmentConflicts;
    const isAllClear = totalConflicts === 0;
    const accentColor = isAllClear ? '#10b981' : '#f59e0b';
    const totalReady = crewReady + equipmentReady;
    const totalItems = crewTotal + equipmentTotal;
    const progress = totalItems > 0 ? (totalReady / totalItems) * 100 : 0;

    return (
        <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', border: `1px solid ${isAllClear ? 'rgba(16,185,129,0.16)' : 'rgba(245,158,11,0.16)'}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.8, bgcolor: isAllClear ? 'rgba(16,185,129,0.07)' : 'rgba(245,158,11,0.07)' }}>
                {isAllClear ? (
                    <CheckCircle sx={{ fontSize: 15, color: '#10b981', flexShrink: 0 }} />
                ) : (
                    <WarningAmber sx={{ fontSize: 15, color: '#f59e0b', flexShrink: 0 }} />
                )}
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: accentColor }}>
                    {isAllClear ? 'All clear' : `${totalConflicts} conflict${totalConflicts !== 1 ? 's' : ''}`}
                </Typography>
                <Typography sx={{ fontSize: '0.67rem', color: '#64748b', ml: 'auto' }}>
                    {crewReady}/{crewTotal} crew · {equipmentReady}/{equipmentTotal} gear
                </Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                    height: 2,
                    bgcolor: 'rgba(15,23,42,0.5)',
                    '& .MuiLinearProgress-bar': { bgcolor: progress === 100 ? '#10b981' : progress > 0 ? '#3b82f6' : '#334155' },
                }}
            />
        </Box>
    );
}
