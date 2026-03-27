'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, TextField, Button, CircularProgress,
    IconButton, Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckIcon from '@mui/icons-material/Check';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { packageSetsApi, servicePackageCategoriesApi } from '@/features/catalog/packages/api';

// ─── Constants ───────────────────────────────────────────────────────

const EMOJI_OPTIONS = ['📦', '💒', '🎉', '🎥', '🎵', '🏢', '🪷', '💍', '🎬', '🌿', '✨', '🎊'];
const MAX_SLOTS = 5;
const MIN_SLOTS = 1;
const TIER_LABELS = ['Budget', 'Basic', 'Standard', 'Premium', 'Ultimate'] as const;

// ─── Types ───────────────────────────────────────────────────────────

type DialogStep = 'edit' | 'confirm-category' | 'confirm-slots';
type CategoryAction = 'migrate' | 'remove-assignments';

interface PackageSetSlot {
    id: number;
    slot_label: string;
    order_index: number;
    service_package_id: number | null;
    service_package?: { id: number; name?: string; category?: string | null; category_id?: number | null } | null;
}

interface PackageSet {
    id: number;
    name: string;
    emoji: string;
    category_id: number | null;
    category?: { id: number; name: string } | null;
    slots: PackageSetSlot[];
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
    // Form fields
    const [name, setName] = useState('');
    const [emoji, setEmoji] = useState('📦');
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [slotCount, setSlotCount] = useState(3);

    // Multi-step state
    const [step, setStep] = useState<DialogStep>('edit');
    const [categoryAction, setCategoryAction] = useState<CategoryAction>('migrate');

    // Loading / error
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Local categories (synced from prop, edited inline)
    const [localCategories, setLocalCategories] = useState<{ id: number; name: string }[]>([]);

    // Inline category creation
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [addingCategorySaving, setAddingCategorySaving] = useState(false);

    // Inline category renaming
    const [renamingCategoryId, setRenamingCategoryId] = useState<number | null>(null);
    const [renameCategoryName, setRenameCategoryName] = useState('');
    const [renamingSaving, setRenamingSaving] = useState(false);

    // Sync categories from prop
    useEffect(() => {
        setLocalCategories(categoriesProp);
    }, [categoriesProp]);

    // Preload current set values when dialog opens
    useEffect(() => {
        if (open && set) {
            setName(set.name);
            setEmoji(set.emoji || '📦');
            setCategoryId(set.category_id);
            setSlotCount(set.slots.length);
            setStep('edit');
            setCategoryAction('migrate');
            setError('');
            setIsAddingCategory(false);
            setNewCategoryName('');
            setRenamingCategoryId(null);
            setRenameCategoryName('');
        }
    }, [open, set]);

    // ── Derived values ──

    const categoryChanged = set ? categoryId !== set.category_id : false;
    const packagesInSlots = set?.slots.filter(s => s.service_package_id !== null).length ?? 0;
    const selectedCategoryName = localCategories.find(c => c.id === categoryId)?.name;

    // Sort slots by order_index: highest-order slots will be removed first
    const sortedSlots: PackageSetSlot[] = set
        ? [...set.slots].sort((a, b) => a.order_index - b.order_index)
        : [];
    const currentSlotCount = set?.slots.length ?? 0;
    const slotsToRemove: PackageSetSlot[] = slotCount < currentSlotCount
        ? sortedSlots.slice(slotCount)
        : [];
    const occupiedSlotsToRemove = slotsToRemove.filter(s => s.service_package_id !== null);

    const hasChanged = set
        ? name.trim() !== set.name
            || emoji !== (set.emoji || '📦')
            || categoryId !== set.category_id
            || slotCount !== set.slots.length
        : false;

    // ── Shared input style ──

    const inputSx = {
        '& .MuiOutlinedInput-root': {
            bgcolor: 'rgba(255,255,255,0.03)',
            color: '#e2e8f0',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
            '&.Mui-focused fieldset': { borderColor: '#648CFF' },
        },
        '& .MuiInputLabel-root': { color: '#64748b' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#648CFF' },
    };

    // ── Category inline CRUD ──

    const handleAddCategory = async () => {
        const trimmed = newCategoryName.trim();
        if (!trimmed) return;
        if (localCategories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
            setError('Category already exists');
            return;
        }
        setAddingCategorySaving(true);
        try {
            const created = await servicePackageCategoriesApi.create(brandId, { name: trimmed });
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

    const handleRenameCategory = async (catId: number) => {
        const trimmed = renameCategoryName.trim();
        if (!trimmed) return;
        if (localCategories.some(c => c.id !== catId && c.name.toLowerCase() === trimmed.toLowerCase())) {
            setError('Category name already exists');
            return;
        }
        setRenamingSaving(true);
        try {
            await servicePackageCategoriesApi.update(brandId, catId, { name: trimmed });
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

    const handleDeleteCategory = async (catId: number) => {
        try {
            await servicePackageCategoriesApi.delete(brandId, catId);
            setLocalCategories(prev => prev.filter(c => c.id !== catId));
            if (categoryId === catId) setCategoryId(null);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err?.message || 'Cannot delete — category may be in use');
        }
    };

    // ── Save flow ──

    const handleSaveAttempt = () => {
        if (!set) return;
        if (!name.trim()) { setError('Name is required'); return; }

        // Category changed to a specific category with assigned packages → require confirmation
        if (categoryChanged && packagesInSlots > 0 && categoryId !== null) {
            setStep('confirm-category');
            return;
        }
        // Slot reduction removing occupied slots → require confirmation
        if (occupiedSlotsToRemove.length > 0) {
            setStep('confirm-slots');
            return;
        }
        executeSave('none');
    };

    const handleCategoryOption = (action: CategoryAction) => {
        setCategoryAction(action);
        if (occupiedSlotsToRemove.length > 0) {
            setStep('confirm-slots');
        } else {
            executeSave(action);
        }
    };

    const executeSave = async (catAction: CategoryAction | 'none') => {
        if (!set) return;
        setSaving(true);
        setError('');
        try {
            // 1. Patch metadata (only changed fields)
            const payload: { name?: string; emoji?: string; category_id?: number } = {};
            if (name.trim() !== set.name) payload.name = name.trim();
            if (emoji !== (set.emoji || '📦')) payload.emoji = emoji;
            if (categoryId !== set.category_id && categoryId != null) payload.category_id = categoryId;
            if (Object.keys(payload).length > 0) {
                await packageSetsApi.update(set.id, payload);
            }

            // 2. Handle assigned-package category action
            if (categoryChanged && categoryId !== null && catAction !== 'none') {
                if (catAction === 'migrate') {
                    await packageSetsApi.migratePackagesCategory(set.id, categoryId);
                } else if (catAction === 'remove-assignments') {
                    await packageSetsApi.clearAllSlotAssignments(set.id);
                }
            }

            // 3. Resize slot count
            if (slotCount > currentSlotCount) {
                for (let i = currentSlotCount; i < slotCount; i++) {
                    await packageSetsApi.addSlot(set.id);
                }
            } else if (slotCount < currentSlotCount) {
                for (const slot of slotsToRemove) {
                    await packageSetsApi.removeSlot(slot.id);
                }
            }

            onUpdated();
            onClose();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err?.message || 'Failed to update set');
            setStep('edit');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        if (!saving) {
            setStep('edit');
            onClose();
        }
    };

    // ─────────────────────────────────────────────────────────────────
    // Render: edit form
    // ─────────────────────────────────────────────────────────────────

    const renderEditForm = () => (
        <>
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
                onChange={e => { setName(e.target.value); if (error === 'Name is required') setError(''); }}
                error={error === 'Name is required'}
                helperText={error === 'Name is required' ? error : ''}
                sx={{ mb: 2.5, ...inputSx }}
            />

            {/* Slot Tiles */}
            <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, mb: 1.25 }}>
                    Slots
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    {Array.from({ length: MAX_SLOTS }).map((_, i) => {
                        const isActive = i < slotCount;
                        const existingSlot = sortedSlots[i];
                        const hasPackage = !!(existingSlot?.service_package_id);
                        const willBeRemoved = i >= slotCount && i < currentSlotCount;
                        const isNew = i >= currentSlotCount && i < slotCount;
                        const tierLabel = TIER_LABELS[i];

                        let borderColor: string;
                        let bgColor: string;
                        let hoverBorderColor: string;
                        let hoverBgColor: string;
                        let labelColor: string;

                        if (willBeRemoved) {
                            borderColor = 'rgba(239,68,68,0.35)'; bgColor = 'rgba(239,68,68,0.05)';
                            hoverBorderColor = 'rgba(239,68,68,0.6)'; hoverBgColor = 'rgba(239,68,68,0.1)';
                            labelColor = '#ef4444';
                        } else if (isNew) {
                            borderColor = 'rgba(34,197,94,0.35)'; bgColor = 'rgba(34,197,94,0.05)';
                            hoverBorderColor = 'rgba(34,197,94,0.6)'; hoverBgColor = 'rgba(34,197,94,0.1)';
                            labelColor = '#22c55e';
                        } else if (isActive) {
                            borderColor = 'rgba(100,140,255,0.35)'; bgColor = 'rgba(100,140,255,0.08)';
                            hoverBorderColor = 'rgba(239,68,68,0.5)'; hoverBgColor = 'rgba(239,68,68,0.08)';
                            labelColor = '#94a3b8';
                        } else {
                            borderColor = 'rgba(255,255,255,0.06)'; bgColor = 'rgba(255,255,255,0.02)';
                            hoverBorderColor = 'rgba(100,140,255,0.4)'; hoverBgColor = 'rgba(100,140,255,0.06)';
                            labelColor = '#334155';
                        }

                        return (
                            <Box
                                key={i}
                                onClick={() => {
                                    if (i + 1 === slotCount && slotCount > MIN_SLOTS) {
                                        setSlotCount(i);
                                    } else {
                                        setSlotCount(i + 1);
                                    }
                                }}
                                sx={{
                                    flex: 1,
                                    py: 1.25, px: 0.5,
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    bgcolor: bgColor,
                                    border: `1px ${willBeRemoved || isNew ? 'dashed' : 'solid'} ${borderColor}`,
                                    transition: 'all 0.15s',
                                    '&:hover': { bgcolor: hoverBgColor, borderColor: hoverBorderColor },
                                }}
                            >
                                {/* Circle indicator */}
                                <Box sx={{
                                    width: 24, height: 24, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    bgcolor: isActive
                                        ? (isNew ? 'rgba(34,197,94,0.15)' : 'rgba(100,140,255,0.15)')
                                        : 'rgba(255,255,255,0.03)',
                                    border: isActive
                                        ? (isNew ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(100,140,255,0.3)')
                                        : '1px solid rgba(255,255,255,0.08)',
                                }}>
                                    {hasPackage
                                        ? <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: isActive ? '#648CFF' : '#334155' }} />
                                        : <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: isActive ? '#648CFF' : '#334155', lineHeight: 1 }}>
                                            {i + 1}
                                        </Typography>
                                    }
                                </Box>

                                {/* Tier label */}
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: labelColor, lineHeight: 1.2 }}>
                                    {tierLabel}
                                </Typography>

                                {/* Filled indicator */}
                                {hasPackage && (
                                    <Typography sx={{ fontSize: '0.55rem', color: isActive ? '#475569' : '#2d3748', lineHeight: 1 }}>
                                        filled
                                    </Typography>
                                )}
                            </Box>
                        );
                    })}
                </Box>
                {occupiedSlotsToRemove.length > 0 && (
                    <Typography sx={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 600, mt: 0.5 }}>
                        ⚠ {occupiedSlotsToRemove.length} occupied slot{occupiedSlotsToRemove.length !== 1 ? 's' : ''} will be removed
                    </Typography>
                )}
            </Box>

            {/* Category */}
            <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, mb: 1 }}>
                    Category
                </Typography>

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
                                height: 32, px: 1.5, borderRadius: 2, cursor: 'pointer',
                                border: '1px dashed rgba(245, 158, 11, 0.35)',
                                bgcolor: 'rgba(245, 158, 11, 0.04)',
                                transition: 'all 0.15s',
                                '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.55)' },
                            }}
                        >
                            <AddIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                            <Typography sx={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>New</Typography>
                        </Box>
                    )}
                </Box>

                {(error === 'Category already exists' || error === 'Category name already exists' || error.includes('Cannot delete')) && (
                    <Typography sx={{ color: '#ef4444', fontSize: '0.7rem', mt: 0.5 }}>{error}</Typography>
                )}
            </Box>

            {/* General error */}
            {error && !['Name is required', 'Category already exists', 'Category name already exists'].includes(error) && !error.includes('Cannot delete') && (
                <Typography sx={{ color: '#ef4444', fontSize: '0.7rem', mb: 1 }}>{error}</Typography>
            )}
        </>
    );

    // ─────────────────────────────────────────────────────────────────
    // Render: confirm category change step
    // ─────────────────────────────────────────────────────────────────

    const renderConfirmCategory = () => (
        <Box>
            <Box sx={{
                p: 2.5, borderRadius: 2, mb: 3,
                bgcolor: 'rgba(245, 158, 11, 0.06)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <WarningAmberIcon sx={{ fontSize: 22, color: '#f59e0b', mt: 0.1, flexShrink: 0 }} />
                    <Box>
                        <Typography sx={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: 700, mb: 0.5 }}>
                            Category change affects assigned packages
                        </Typography>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.6 }}>
                            This set has{' '}
                            <Box component="span" sx={{ color: '#f1f5f9', fontWeight: 700 }}>
                                {packagesInSlots} package{packagesInSlots !== 1 ? 's' : ''}
                            </Box>{' '}
                            assigned. Changing the category to{' '}
                            <Box component="span" sx={{ color: '#f1f5f9', fontWeight: 700 }}>
                                &ldquo;{selectedCategoryName}&rdquo;
                            </Box>{' '}
                            affects them.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.5 }}>
                How should we handle the affected packages?
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* Option 1: migrate */}
                <Box
                    onClick={() => setCategoryAction('migrate')}
                    sx={{
                        p: 2, borderRadius: 2, cursor: 'pointer',
                        bgcolor: categoryAction === 'migrate' ? 'rgba(100, 140, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: categoryAction === 'migrate' ? '1px solid rgba(100, 140, 255, 0.35)' : '1px solid rgba(52, 58, 68, 0.4)',
                        transition: 'all 0.15s',
                        '&:hover': { bgcolor: categoryAction === 'migrate' ? 'rgba(100, 140, 255, 0.1)' : 'rgba(255,255,255,0.04)' },
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Box sx={{
                            width: 18, height: 18, borderRadius: '50%', flexShrink: 0, mt: 0.1,
                            border: categoryAction === 'migrate' ? '5px solid #648CFF' : '2px solid rgba(100,140,255,0.35)',
                            transition: 'all 0.15s',
                        }} />
                        <Box>
                            <Typography sx={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 700 }}>
                                Change package categories to match the set
                            </Typography>
                            <Typography sx={{ color: '#64748b', fontSize: '0.72rem', mt: 0.3 }}>
                                Updates all {packagesInSlots} package{packagesInSlots !== 1 ? 's' : ''} to &ldquo;{selectedCategoryName}&rdquo; and keeps them in their slots
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Option 2: remove assignments */}
                <Box
                    onClick={() => setCategoryAction('remove-assignments')}
                    sx={{
                        p: 2, borderRadius: 2, cursor: 'pointer',
                        bgcolor: categoryAction === 'remove-assignments' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(255,255,255,0.02)',
                        border: categoryAction === 'remove-assignments' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(52, 58, 68, 0.4)',
                        transition: 'all 0.15s',
                        '&:hover': { bgcolor: categoryAction === 'remove-assignments' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.04)' },
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Box sx={{
                            width: 18, height: 18, borderRadius: '50%', flexShrink: 0, mt: 0.1,
                            border: categoryAction === 'remove-assignments' ? '5px solid #ef4444' : '2px solid rgba(239,68,68,0.3)',
                            transition: 'all 0.15s',
                        }} />
                        <Box>
                            <Typography sx={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 700 }}>
                                Keep package categories unchanged and remove affected packages from this set
                            </Typography>
                            <Typography sx={{ color: '#64748b', fontSize: '0.72rem', mt: 0.3 }}>
                                Clears {packagesInSlots} slot{packagesInSlots !== 1 ? 's' : ''} — packages remain in your library unchanged
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );

    // ─────────────────────────────────────────────────────────────────
    // Render: confirm slot removal step
    // ─────────────────────────────────────────────────────────────────

    const renderConfirmSlots = () => (
        <Box>
            <Box sx={{
                p: 2.5, borderRadius: 2, mb: 3,
                bgcolor: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <WarningAmberIcon sx={{ fontSize: 22, color: '#ef4444', mt: 0.1, flexShrink: 0 }} />
                    <Box>
                        <Typography sx={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 700, mb: 0.5 }}>
                            Reducing slots will remove {occupiedSlotsToRemove.length} occupied slot{occupiedSlotsToRemove.length !== 1 ? 's' : ''}
                        </Typography>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.6 }}>
                            The packages will remain in your library — only their slot assignments in this set will be lost.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.25 }}>
                Slots being removed ({slotsToRemove.length})
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {slotsToRemove.map(slot => {
                    const isOccupied = slot.service_package_id !== null;
                    return (
                        <Box key={slot.id} sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5,
                            px: 2, py: 1.25, borderRadius: 2,
                            bgcolor: isOccupied ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)',
                            border: isOccupied ? '1px solid rgba(239, 68, 68, 0.18)' : '1px solid rgba(52, 58, 68, 0.3)',
                        }}>
                            <Box sx={{
                                minWidth: 60, height: 22, borderRadius: 1, px: 1,
                                bgcolor: isOccupied ? 'rgba(239, 68, 68, 0.12)' : 'rgba(52, 58, 68, 0.3)',
                                border: isOccupied ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(52, 58, 68, 0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Typography sx={{ fontSize: '0.6rem', color: isOccupied ? '#fca5a5' : '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                                    {slot.slot_label}
                                </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: isOccupied ? 600 : 400, color: isOccupied ? '#e2e8f0' : '#64748b', fontStyle: isOccupied ? 'normal' : 'italic' }}>
                                {isOccupied
                                    ? (slot.service_package?.name ?? `Package #${slot.service_package_id}`)
                                    : 'Empty slot'}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );

    // ─────────────────────────────────────────────────────────────────
    // Actions per step
    // ─────────────────────────────────────────────────────────────────

    const renderActions = () => {
        if (step === 'confirm-category') {
            return (
                <>
                    <Button onClick={() => setStep('edit')} sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                        Back
                    </Button>
                    <Button
                        onClick={() => handleCategoryOption(categoryAction)}
                        disabled={saving}
                        sx={{
                            bgcolor: '#648CFF', color: '#fff', fontWeight: 700,
                            textTransform: 'none', px: 3, fontSize: '0.8rem', borderRadius: 2,
                            '&:hover': { bgcolor: '#5174e0' },
                            '&:disabled': { bgcolor: 'rgba(100,140,255,0.3)', color: '#64748b' },
                        }}
                    >
                        {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Continue'}
                    </Button>
                </>
            );
        }

        if (step === 'confirm-slots') {
            const backStep: DialogStep = (categoryChanged && packagesInSlots > 0 && categoryId !== null)
                ? 'confirm-category'
                : 'edit';
            return (
                <>
                    <Button onClick={() => setStep(backStep)} sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                        Back
                    </Button>
                    <Button
                        onClick={() => executeSave(categoryAction)}
                        disabled={saving}
                        sx={{
                            bgcolor: '#ef4444', color: '#fff', fontWeight: 700,
                            textTransform: 'none', px: 3, fontSize: '0.8rem', borderRadius: 2,
                            '&:hover': { bgcolor: '#dc2626' },
                            '&:disabled': { bgcolor: 'rgba(239,68,68,0.3)', color: '#64748b' },
                        }}
                    >
                        {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Confirm & Save'}
                    </Button>
                </>
            );
        }

        // 'edit' step
        return (
            <>
                <Button onClick={handleClose} sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSaveAttempt}
                    disabled={saving || !name.trim() || !hasChanged}
                    sx={{
                        bgcolor: '#648CFF', color: '#fff', fontWeight: 700,
                        textTransform: 'none', px: 3, fontSize: '0.8rem', borderRadius: 2,
                        '&:hover': { bgcolor: '#5174e0' },
                        '&:disabled': { bgcolor: 'rgba(100,140,255,0.3)', color: '#64748b' },
                    }}
                >
                    {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save Changes'}
                </Button>
            </>
        );
    };

    const stepTitle: Record<DialogStep, string> = {
        edit: 'Edit Package Set',
        'confirm-category': 'Confirm Category Change',
        'confirm-slots': 'Confirm Slot Removal',
    };

    // ─────────────────────────────────────────────────────────────────
    // Main render
    // ─────────────────────────────────────────────────────────────────

    return (
        <Dialog
            open={open}
            onClose={handleClose}
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
                    {stepTitle[step]}
                </Typography>
                <IconButton onClick={handleClose} disabled={saving} sx={{ color: '#64748b' }}>
                    <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: '20px !important' }}>
                {step === 'edit' && renderEditForm()}
                {step === 'confirm-category' && renderConfirmCategory()}
                {step === 'confirm-slots' && renderConfirmSlots()}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: '1px solid rgba(52, 58, 68, 0.3)' }}>
                {renderActions()}
            </DialogActions>
        </Dialog>
    );
}
