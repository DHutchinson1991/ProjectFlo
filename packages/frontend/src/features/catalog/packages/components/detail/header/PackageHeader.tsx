'use client';

import React from 'react';
import {
    Box, Typography,
    IconButton, Breadcrumbs, Link, CircularProgress, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';

// ─── Props ───────────────────────────────────────────────────────────

export interface PackageHeaderProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    isSaving: boolean;
    onBack: () => void;
    onVersionHistory: () => void;
}

// ─── Component ───────────────────────────────────────────────────────

export function PackageHeader({
    formData,
    setFormData,
    isSaving,
    onBack,
    onVersionHistory,
}: PackageHeaderProps) {
    return (
        <Box>
            <Breadcrumbs sx={{ mb: 0.75, '& .MuiBreadcrumbs-separator': { color: '#475569' } }}>
                <Link underline="hover" sx={{ color: '#64748b' }} href="/packages">Packages</Link>
                <Typography sx={{ color: '#94a3b8' }}>{formData.name || 'New Package'}</Typography>
            </Breadcrumbs>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={onBack} sx={{ color: '#94a3b8' }}><ArrowBackIcon /></IconButton>

                {/* Inline-editable package name */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                            component="input"
                            value={formData.name || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Package Name"
                            size={Math.max(8, (formData.name || 'Package Name').length + 1)}
                            sx={{
                                background: 'none', border: 'none', outline: 'none',
                                fontWeight: 800, color: '#f1f5f9', fontSize: '1.8rem',
                                fontFamily: 'inherit', lineHeight: 1.2,
                                p: 0, m: 0,
                                borderBottom: '2px solid transparent',
                                transition: 'border-color 0.2s ease',
                                '&:hover': { borderColor: 'rgba(255,255,255,0.08)' },
                                '&:focus': { borderColor: '#648CFF' },
                                '&::placeholder': { color: '#334155' },
                            }}
                        />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                    {isSaving && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <CircularProgress size={13} sx={{ color: '#64748b' }} />
                            <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>Saving…</Typography>
                        </Box>
                    )}

                    {/* Version History Button */}
                    <Tooltip title="Version History">
                        <IconButton
                            onClick={onVersionHistory}
                            sx={{
                                color: '#8b5cf6',
                                bgcolor: 'rgba(139, 92, 246, 0.08)',
                                border: '1px solid rgba(139, 92, 246, 0.25)',
                                borderRadius: 2,
                                width: 44, height: 44,
                                '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.45)' },
                            }}
                        >
                            <HistoryIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        </Box>
    );
}
