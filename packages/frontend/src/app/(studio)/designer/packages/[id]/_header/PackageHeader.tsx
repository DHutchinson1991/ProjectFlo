'use client';

import React from 'react';
import {
    Box, Typography, Button, FormControl, Select, MenuItem,
    IconButton, Breadcrumbs, Link, CircularProgress, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HistoryIcon from '@mui/icons-material/History';

import type { SubjectType } from '../_lib/types';

// ─── Props ───────────────────────────────────────────────────────────

export interface PackageHeaderProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    categories: Array<{ id: number; name: string }>;
    subjectTemplates: SubjectType[];
    isSaving: boolean;
    onBack: () => void;
    onSave: () => void;
    onPreview: () => void;
    onVersionHistory: () => void;
    onNewPackage: () => void;
}

// ─── Component ───────────────────────────────────────────────────────

export function PackageHeader({
    formData,
    setFormData,
    categories,
    subjectTemplates,
    isSaving,
    onBack,
    onSave,
    onPreview,
    onVersionHistory,
    onNewPackage,
}: PackageHeaderProps) {
    return (
        <Box sx={{ mb: 3 }}>
            <Breadcrumbs sx={{ mb: 1.5, '& .MuiBreadcrumbs-separator': { color: '#475569' } }}>
                <Link underline="hover" sx={{ color: '#64748b' }} href="/designer/packages">Packages</Link>
                <Typography sx={{ color: '#94a3b8' }}>{formData.name || 'New Package'}</Typography>
            </Breadcrumbs>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 0.5 }}>
                <IconButton onClick={onBack} sx={{ color: '#94a3b8', mt: 0.5 }}><ArrowBackIcon /></IconButton>

                {/* Inline-editable package name */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, maxWidth: '100%' }}>
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
                        {/* Category — minimal inline select */}
                        <FormControl size="small" variant="standard" sx={{ minWidth: 0, flexShrink: 0 }}>
                            <Select
                                value={formData.category || ''}
                                displayEmpty
                                onChange={(e) => {
                                    const newCategory = e.target.value as string;
                                    setFormData((prev: typeof formData) => {
                                        const updated = { ...prev, category: newCategory };
                                        const matchedSubject = subjectTemplates.find(t =>
                                            t.role_name?.toLowerCase().includes(newCategory.toLowerCase().split(' ')[0])
                                        );
                                        if (matchedSubject) {
                                            updated.contents = {
                                                ...updated.contents,
                                                items: updated.contents?.items || [],
                                                subject_template_id: matchedSubject.id,
                                            };
                                        }
                                        return updated;
                                    });
                                }}
                                disableUnderline
                                renderValue={(val) => (
                                    <Typography sx={{
                                        fontSize: '0.85rem', fontWeight: 600,
                                        color: val ? '#94a3b8' : '#475569',
                                        display: 'flex', alignItems: 'center', gap: 0.5,
                                    }}>
                                        {val || 'Add category…'}
                                    </Typography>
                                )}
                                sx={{
                                    color: '#94a3b8', fontSize: '0.85rem',
                                    px: 1, py: 0.25, borderRadius: 1.5,
                                    bgcolor: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    transition: 'all 0.15s ease',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' },
                                    '& .MuiSelect-icon': { color: '#475569', fontSize: '1.1rem' },
                                    '& .MuiSelect-select': { p: '2px 24px 2px 0 !important' },
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 },
                                    },
                                }}
                            >
                                {/* Include current category as option if not in the fetched list */}
                                {formData.category && !categories.some((cat) => cat.name === formData.category) && (
                                    <MenuItem value={formData.category} sx={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                                        {formData.category}
                                    </MenuItem>
                                )}
                                {categories.map((cat) => (
                                    <MenuItem key={cat.id} value={cat.name} sx={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                                        {cat.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Description — inline editable text underneath */}
                    <Box
                        component="input"
                        value={formData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Add a description…"
                        sx={{
                            display: 'block', width: '100%',
                            background: 'none', border: 'none', outline: 'none',
                            fontSize: '0.85rem', color: '#64748b', fontFamily: 'inherit',
                            fontWeight: 400, lineHeight: 1.5, p: 0, mt: 0.5,
                            borderBottom: '1px solid transparent',
                            transition: 'all 0.2s ease',
                            '&:hover': { color: '#94a3b8', borderColor: 'rgba(255,255,255,0.06)' },
                            '&:focus': { color: '#e2e8f0', borderColor: 'rgba(100, 140, 255, 0.3)' },
                            '&::placeholder': { color: '#334155', fontStyle: 'italic' },
                        }}
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                    {/* Create Related Package Button */}
                    <Button
                        variant="outlined"
                        size="large"
                        startIcon={<AddIcon />}
                        onClick={onNewPackage}
                        sx={{
                            borderColor: 'rgba(245, 158, 11, 0.35)',
                            color: '#f59e0b',
                            '&:hover': { borderColor: 'rgba(245, 158, 11, 0.6)', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                            borderRadius: 2, px: 2.5, fontWeight: 700, textTransform: 'none', fontSize: '0.85rem',
                        }}
                    >
                        New Package
                    </Button>

                    {/* Preview Button */}
                    <Button
                        variant="outlined"
                        size="large"
                        startIcon={<VisibilityIcon />}
                        onClick={onPreview}
                        sx={{
                            borderColor: 'rgba(16, 185, 129, 0.35)',
                            color: '#10b981',
                            '&:hover': { borderColor: 'rgba(16, 185, 129, 0.6)', bgcolor: 'rgba(16, 185, 129, 0.08)' },
                            borderRadius: 2, px: 2.5, fontWeight: 700, textTransform: 'none', fontSize: '0.85rem',
                        }}
                    >
                        Preview
                    </Button>

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

                    {/* Save Button */}
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={onSave}
                        disabled={isSaving}
                        sx={{ bgcolor: '#648CFF', '&:hover': { bgcolor: '#5A7BF0' }, borderRadius: 2, px: 3, fontWeight: 700, textTransform: 'none', fontSize: '0.9rem' }}
                    >
                        Save Changes
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
