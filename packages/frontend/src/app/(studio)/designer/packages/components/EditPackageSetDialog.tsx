'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, TextField, Button, CircularProgress,
    IconButton, Checkbox, FormControlLabel, Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckIcon from '@mui/icons-material/Check';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { api } from '@/lib/api';

// ─── Emoji Presets ───────────────────────────────────────────────────

const EMOJI_OPTIONS = ['📦', '💒', '🎉', '🎥', '🎵', '🏢', '🪷', '💍', '🎬', '🌿', '✨', '🎊'];

// ─── Types ───────────────────────────────────────────────────────────

interface PackageSet {
    id: number;
    name: string;
    emoji: string;
    category_id: number | null;
    category?: { id: number; name: string } | null;
    slots: { id: number; service_package_id: number | null; service_package?: { id: number; category?: string | null; category_id?: number | null } | null }[];
}

interface EditPackageSetDialogProps {
    open: boolean;
    onClose: () => void;
    onUpdated: () => void;
    brandId: number;
    categories: { id: number; name: string }[];
    set: PackageSet | null;
}

// ─── Component ───────────────────────────────────────────────────────

export default function EditPackageSetDialog({
    open, onClose, onUpdated, brandId, categories: categoriesProp, set,
}: EditPackageSetDialogProps) {
    const [name, setName] = useState('');
    const [emoji, setEmoji] = useState('📦');
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [migratePackages, setMigratePackages] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Local categories list (synced from prop, updated inline)
    const [localCategories, setLocalCategories] = useState<{ id: number; name: string }[]>([]);

    // Inline category creation
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [addingCategorySaving, setAddingCategorySaving] = useState(false);

    // Inline category renaming
    const [renamingCategoryId, setRenamingCategoryId] = useState<number | null>(null);
    const [renameCategoryName, setRenameCategoryName] = useState('');
    const [renamingSaving, setRenamingSaving] = useState(false);

    // Sync from prop
    useEffect(() => {
        setLocalCategories(categoriesProp);
    }, [categoriesProp]);

    // Load current set values when dialog opens
    useEffect(() => {
        if (open && set) {
            setName(set.name);
            setEmoji(set.emoji || '📦');
            setCategoryId(set.category_id);
            setMigratePackages(true);
            setError('');
            setIsAddingCategory(false);
            setNewCategoryName('');
            setRenamingCategoryId(null);
            setRenameCategoryName('');
        }
    }, [open, set]);

    // Detect if category actually changed
    const categoryChanged = set ? categoryId !== set.category_id : false;
    // Count packages that would be migrated (those in slots with a different category)
    const packagesInSlots = set?.slots.filter(s => s.service_package_id).length ?? 0;

    // ── Add category inline ──
    const handleAddCategory = async () => {
        const trimmed = newCategoryName.trim();
        if (!trimmed) return;
        if (localCategories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
            setError('Category already exists');
            return;
        }
        setAddingCategorySaving(true);
        try {
            const created = await api.servicePackageCategories.create(brandId, { name: trimmed });
            setLocalCategories(prev => [...prev, { id: created.id, name: created.name }]);
            setCategoryId(created.id);
            setNewCategoryName('');
            setIsAddingCategory(false);
            setError('');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err?.message || 'Failed to create category');
        } finally {
            setAddingCategorySaving(false);
        }
    };

    // ── Rename category inline ──
    const handleRenameCategory = async (catId: number) => {
        const trimmed = renameCategoryName.trim();
        if (!trimmed) return;
        if (localCategories.some(c => c.id !== catId && c.name.toLowerCase() === trimmed.toLowerCase())) {
            setError('Category name already exists');
            return;
        }
        setRenamingSaving(true);
        try {
            await api.servicePackageCategories.update(brandId, catId, { name: trimmed });
            setLocalCategories(prev => prev.map(c => c.id === catId ? { ...c, name: trimmed } : c));
            setRenamingCategoryId(null);
            setRenameCategoryName('');
            setError('');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err?.message || 'Failed to rename category');
        } finally {
            setRenamingSaving(false);
        }
    };

    // ── Delete category inline ──
    const handleDeleteCategory = async (catId: number) => {
        try {
            await api.servicePackageCategories.delete(brandId, catId);
            setLocalCategories(prev => prev.filter(c => c.id !== catId));
            if (categoryId === catId) setCategoryId(null);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err?.message || 'Cannot delete — category may be in use');
        }
    };

    const handleSave = async () => {
        if (!set) return;
        if (!name.trim()) { setError('Name is required'); return; }
        setSaving(true);
        setError('');
        try {
            // Build update payload — only send changed fields
            const payload: { name?: string; emoji?: string; category_id?: number } = {};
            if (name.trim() !== set.name) payload.name = name.trim();
            if (emoji !== (set.emoji || '📦')) payload.emoji = emoji;
            if (categoryId !== set.category_id && categoryId) payload.category_id = categoryId;

            if (Object.keys(payload).length > 0) {
                await api.packageSets.update(brandId, set.id, payload);
            }

            // Migrate packages to new category if selected
            if (categoryChanged && migratePackages && categoryId && packagesInSlots > 0) {
                await api.packageSets.migratePackagesCategory(brandId, set.id, categoryId);
            }

            onUpdated();
            onClose();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err?.message || 'Failed to update set');
        } finally {
            setSaving(false);
        }
    };

    const selectedCategoryName = localCategories.find(c => c.id === categoryId)?.name;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: '#0f1117',
                    border: '1px solid rgba(52, 58, 68, 0.4)',
                    borderRadius: 3,
                },
            }}
        >
            <DialogTitle sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                pb: 1, borderBottom: '1px solid rgba(52, 58, 68, 0.3)',
            }}>
                <Typography sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.1rem' }}>
                    Edit Package Set
                </Typography>
                <IconButton onClick={onClose} sx={{ color: '#64748b' }}>
                    <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: '20px !important' }}>
                {/* Emoji Picker */}
                <Box sx={{ mb: 3 }}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, mb: 1 }}>
                        Icon
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        {EMOJI_OPTIONS.map(e => (
                            <Box
                                key={e}
                                onClick={() => setEmoji(e)}
                                sx={{
                                    width: 40, height: 40, borderRadius: 2,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.3rem', cursor: 'pointer',
                                    bgcolor: emoji === e ? 'rgba(100, 140, 255, 0.12)' : 'rgba(255,255,255,0.03)',
                                    border: emoji === e ? '1px solid rgba(100, 140, 255, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                                    transition: 'all 0.15s',
                                    '&:hover': { bgcolor: 'rgba(100, 140, 255, 0.08)' },
                                }}
                            >
                                {e}
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Name */}
                <TextField
                    fullWidth
                    label="Set Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    error={error === 'Name is required'}
                    helperText={error === 'Name is required' ? error : ''}
                    sx={{
                        mb: 2.5,
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255,255,255,0.03)',
                            color: '#e2e8f0',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&.Mui-focused fieldset': { borderColor: '#648CFF' },
                        },
                        '& .MuiInputLabel-root': { color: '#64748b' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#648CFF' },
                    }}
                />

                {/* ── Category ── */}
                <Box sx={{ mb: 2.5 }}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, mb: 1 }}>
                        Category
                    </Typography>

                    {/* Category chips */}
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
                        {localCategories.map(cat => {
                            const isSelected = categoryId === cat.id;
                            const isRenaming = renamingCategoryId === cat.id;

                            if (isRenaming) {
                                return (
                                    <Box key={cat.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <TextField
                                            size="small"
                                            autoFocus
                                            value={renameCategoryName}
                                            onChange={e => setRenameCategoryName(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleRenameCategory(cat.id);
                                                if (e.key === 'Escape') { setRenamingCategoryId(null); setRenameCategoryName(''); }
                                            }}
                                            sx={{
                                                width: 140,
                                                '& .MuiOutlinedInput-root': {
                                                    bgcolor: 'rgba(255,255,255,0.05)', color: '#e2e8f0',
                                                    fontSize: '0.75rem', height: 32,
                                                    '& fieldset': { borderColor: 'rgba(100,140,255,0.4)' },
                                                },
                                            }}
                                        />
                                        <IconButton size="small" onClick={() => handleRenameCategory(cat.id)} disabled={renamingSaving} sx={{ color: '#22c55e', p: 0.5 }}>
                                            {renamingSaving ? <CircularProgress size={14} /> : <CheckIcon sx={{ fontSize: 16 }} />}
                                        </IconButton>
                                        <IconButton size="small" onClick={() => { setRenamingCategoryId(null); setRenameCategoryName(''); }} sx={{ color: '#64748b', p: 0.5 }}>
                                            <CloseIcon sx={{ fontSize: 14 }} />
                                        </IconButton>
                                    </Box>
                                );
                            }

                            return (
                                <Box
                                    key={cat.id}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 0.25,
                                        height: 32, pl: 1.5, pr: 0.5, borderRadius: 2,
                                        cursor: 'pointer',
                                        bgcolor: isSelected ? 'rgba(100, 140, 255, 0.12)' : 'rgba(255,255,255,0.03)',
                                        border: isSelected ? '1px solid rgba(100, 140, 255, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                                        transition: 'all 0.15s',
                                        '&:hover': { bgcolor: isSelected ? 'rgba(100, 140, 255, 0.18)' : 'rgba(255,255,255,0.06)' },
                                    }}
                                    onClick={() => { setCategoryId(cat.id); setError(''); }}
                                >
                                    <Typography sx={{
                                        fontSize: '0.78rem', fontWeight: isSelected ? 700 : 500,
                                        color: isSelected ? '#648CFF' : '#94a3b8',
                                    }}>
                                        {cat.name}
                                    </Typography>
                                    {isSelected && (
                                        <>
                                            <Tooltip title="Rename">
                                                <IconButton
                                                    size="small"
                                                    onClick={e => { e.stopPropagation(); setRenamingCategoryId(cat.id); setRenameCategoryName(cat.name); }}
                                                    sx={{ color: '#64748b', p: 0.25, ml: 0.5, '&:hover': { color: '#648CFF' } }}
                                                >
                                                    <EditIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete category">
                                                <IconButton
                                                    size="small"
                                                    onClick={e => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                                                    sx={{ color: '#64748b', p: 0.25, '&:hover': { color: '#ef4444' } }}
                                                >
                                                    <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    )}
                                </Box>
                            );
                        })}

                        {/* Add-new chip / inline input */}
                        {isAddingCategory ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TextField
                                    size="small"
                                    autoFocus
                                    placeholder="Category name"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleAddCategory();
                                        if (e.key === 'Escape') { setIsAddingCategory(false); setNewCategoryName(''); }
                                    }}
                                    sx={{
                                        width: 150,
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255,255,255,0.05)', color: '#e2e8f0',
                                            fontSize: '0.75rem', height: 32,
                                            '& fieldset': { borderColor: 'rgba(245,158,11,0.4)' },
                                            '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
                                        },
                                        '& ::placeholder': { color: '#475569', opacity: 1 },
                                    }}
                                />
                                <IconButton size="small" onClick={handleAddCategory} disabled={addingCategorySaving || !newCategoryName.trim()} sx={{ color: '#22c55e', p: 0.5 }}>
                                    {addingCategorySaving ? <CircularProgress size={14} /> : <CheckIcon sx={{ fontSize: 16 }} />}
                                </IconButton>
                                <IconButton size="small" onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }} sx={{ color: '#64748b', p: 0.5 }}>
                                    <CloseIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                            </Box>
                        ) : (
                            <Box
                                onClick={() => setIsAddingCategory(true)}
                                sx={{
                                    display: 'flex', alignItems: 'center', gap: 0.5,
                                    height: 32, px: 1.5, borderRadius: 2,
                                    cursor: 'pointer',
                                    border: '1px dashed rgba(245, 158, 11, 0.35)',
                                    bgcolor: 'rgba(245, 158, 11, 0.04)',
                                    transition: 'all 0.15s',
                                    '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.55)' },
                                }}
                            >
                                <AddIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                                <Typography sx={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>
                                    New
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {(error === 'Category already exists' || error === 'Category name already exists' || error.includes('Cannot delete')) && (
                        <Typography sx={{ color: '#ef4444', fontSize: '0.7rem', mt: 0.5 }}>
                            {error}
                        </Typography>
                    )}
                </Box>

                {/* ── Migrate packages warning ── */}
                {categoryChanged && packagesInSlots > 0 && (
                    <Box sx={{
                        mb: 2, p: 2, borderRadius: 2,
                        bgcolor: 'rgba(245, 158, 11, 0.06)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
                            <WarningAmberIcon sx={{ fontSize: 20, color: '#f59e0b', mt: 0.25 }} />
                            <Box>
                                <Typography sx={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700 }}>
                                    Category Change
                                </Typography>
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem', mt: 0.25 }}>
                                    This set has {packagesInSlots} package{packagesInSlots !== 1 ? 's' : ''} assigned.
                                    {selectedCategoryName ? ` Would you like to also update them to "${selectedCategoryName}"?` : ''}
                                </Typography>
                            </Box>
                        </Box>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={migratePackages}
                                    onChange={e => setMigratePackages(e.target.checked)}
                                    size="small"
                                    sx={{
                                        color: 'rgba(245,158,11,0.4)',
                                        '&.Mui-checked': { color: '#f59e0b' },
                                        p: 0.5, ml: 0.5,
                                    }}
                                />
                            }
                            label={
                                <Typography sx={{ fontSize: '0.75rem', color: '#e2e8f0', fontWeight: 600 }}>
                                    Update all {packagesInSlots} package{packagesInSlots !== 1 ? 's' : ''} to the new category
                                </Typography>
                            }
                        />
                    </Box>
                )}

                {/* General error */}
                {error && !['Name is required', 'Category already exists', 'Category name already exists'].includes(error) && !error.includes('Cannot delete') && (
                    <Typography sx={{ color: '#ef4444', fontSize: '0.7rem', mb: 1 }}>
                        {error}
                    </Typography>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: '1px solid rgba(52, 58, 68, 0.3)' }}>
                <Button onClick={onClose} sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={saving || !name.trim()}
                    sx={{
                        bgcolor: '#648CFF', color: '#fff', fontWeight: 700,
                        textTransform: 'none', px: 3, fontSize: '0.8rem',
                        borderRadius: 2,
                        '&:hover': { bgcolor: '#5174e0' },
                        '&:disabled': { bgcolor: 'rgba(100,140,255,0.3)', color: '#64748b' },
                    }}
                >
                    {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
