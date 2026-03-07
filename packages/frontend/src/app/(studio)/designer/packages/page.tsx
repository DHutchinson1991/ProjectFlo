'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Button, IconButton, Chip, CircularProgress,
    Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import InventoryIcon from '@mui/icons-material/Inventory';
import MovieIcon from '@mui/icons-material/Movie';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MicIcon from '@mui/icons-material/Mic';
import EventIcon from '@mui/icons-material/Event';
import PlaceIcon from '@mui/icons-material/Place';
import PeopleIcon from '@mui/icons-material/People';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useRouter } from 'next/navigation';
import {
    DndContext, closestCenter, PointerSensor, KeyboardSensor,
    useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent,
    useDraggable, useDroppable,
} from '@dnd-kit/core';
import { api } from '@/lib/api';
import { ServicePackage } from '@/lib/types/domains/sales';
import { useBrand } from '@/app/providers/BrandProvider';
import { formatCurrency } from '@/lib/utils/formatUtils';
import PackagePickerDialog from './components/PackagePickerDialog';
import CreatePackageSetDialog from './components/CreatePackageSetDialog';

// ─── Types ───────────────────────────────────────────────────────────

interface PackageSetSlot {
    id: number;
    package_set_id: number;
    service_package_id: number | null;
    slot_label: string;
    order_index: number;
    service_package?: ServicePackage | null;
}

interface PackageSet {
    id: number;
    brand_id: number;
    name: string;
    description: string | null;
    emoji: string;
    category_id: number | null;
    order_index: number;
    is_active: boolean;
    category?: { id: number; name: string } | null;
    slots: PackageSetSlot[];
}

// ─── Constants ───────────────────────────────────────────────────────

const MAX_SLOTS = 5;
const TIER_LABELS = ['Budget', 'Basic', 'Standard', 'Premium', 'Ultimate'] as const;

/** Color-psychology tier palette optimised for dark theme */
const TIER_COLORS: Record<string, string> = {
    Budget:   '#F97316',   // Value Orange — affordability & friendliness
    Basic:    '#3B82F6',   // Trust Blue — reliability & solid foundation
    Standard: '#EC4899',   // Quality Magenta — creativity & popular sweet-spot
    Premium:  '#EAB308',   // Luxury Gold — exclusivity & top-tier
    Ultimate: '#22D3EE',   // Platinum Ice Cyan — elite & bespoke
};

function getTierColor(tier: string): string {
    return TIER_COLORS[tier] ?? '#648CFF';
}


// ─── Helpers ─────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
    'Wedding': '#EC4899', 'Elopement': '#a855f7', 'Corporate': '#3b82f6',
    'Event': '#f59e0b', 'Music Video': '#10b981', 'Commercial': '#0ea5e9',
    'Uncategorized': '#64748b',
};

/**
 * Resolve tier labels for all slots in a set, ensuring no duplicates.
 * Slots with valid tier labels keep theirs; slots with invalid labels (e.g. "Package")
 * get the next unassigned tier.
 */
function resolveSlotTiers(slots: PackageSetSlot[]): Map<number, string> {
    const result = new Map<number, string>();
    const usedTiers = new Set<string>();
    const validTiers: readonly string[] = TIER_LABELS;

    // First pass: honour slots that already have a valid tier label
    for (const slot of slots) {
        if (validTiers.includes(slot.slot_label) && !usedTiers.has(slot.slot_label)) {
            result.set(slot.id, slot.slot_label);
            usedTiers.add(slot.slot_label);
        }
    }

    // Second pass: assign remaining tiers to slots without a valid label
    const remainingTiers = TIER_LABELS.filter(t => !usedTiers.has(t));
    let tierIdx = 0;
    for (const slot of slots) {
        if (!result.has(slot.id)) {
            result.set(slot.id, remainingTiers[tierIdx] ?? TIER_LABELS[TIER_LABELS.length - 1]);
            tierIdx++;
        }
    }

    return result;
}

function getCategoryColor(cat: string | null): string {
    if (!cat) return '#64748b';
    for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
        if (cat.toLowerCase().includes(key.toLowerCase())) return color;
    }
    const hash = cat.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const palette = ['#648CFF', '#EC4899', '#10b981', '#f59e0b', '#a855f7', '#0ea5e9'];
    return palette[hash % palette.length];
}

function getPackageStats(pkg: ServicePackage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = pkg as any;
    const counts = data?._count || {};
    const dayCount = typeof counts.package_event_days === 'number'
        ? counts.package_event_days
        : (pkg.contents?.day_coverage ? Object.keys(pkg.contents.day_coverage).length : 0);
    const locationCount = typeof counts.package_location_slots === 'number'
        ? counts.package_location_slots : 0;
    const crewCount = typeof data?._crewCount === 'number' ? data._crewCount : 0;
    const eqCounts = data?._equipmentCounts || {};
    const cameraCount = eqCounts.cameras || 0;
    const audioCount = eqCounts.audio || 0;
    const totalCost = typeof data?._totalCost === 'number' ? data._totalCost : 0;
    return { dayCount, locationCount, crewCount, cameraCount, audioCount, totalCost };
}

// ─── Main Component ──────────────────────────────────────────────────

export default function PackageLibraryPage() {
    const router = useRouter();
    const { currentBrand } = useBrand();
    const currencyCode = currentBrand?.currency || 'USD';
    const safeBrandId = currentBrand?.id || 1;

    // Data
    const [sets, setSets] = useState<PackageSet[]>([]);
    const [allPackages, setAllPackages] = useState<ServicePackage[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Dialogs / drawers
    const [isCreateSetOpen, setIsCreateSetOpen] = useState(false);

    // Picker dialog state – which slot we're selecting a package for
    const [pickerSlotId, setPickerSlotId] = useState<number | null>(null);
    // The category name of the set whose slot triggered the picker (for strict filtering)
    const [pickerSetCategory, setPickerSetCategory] = useState<string | null>(null);

    // Edit-mode per-set (inline rename)
    const [editingSetId, setEditingSetId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');

    // ── Data loading ──

    const loadData = useCallback(async () => {
        try {
            const [setsData, pkgs, cats] = await Promise.all([
                api.packageSets.getAll(safeBrandId),
                api.servicePackages.getAll(safeBrandId),
                api.servicePackageCategories.getAll(safeBrandId),
            ]);
            setSets(setsData);
            setAllPackages(pkgs);
            setCategories(cats);
        } catch (err) {
            console.error('Failed to load data', err);
        } finally {
            setIsLoading(false);
        }
    }, [safeBrandId]);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Auto-create a default set if user has none ──
    const autoInitRef = useRef(false);
    useEffect(() => {
        if (!isLoading && sets.length === 0 && !autoInitRef.current) {
            autoInitRef.current = true;
            (async () => {
                try {
                    await api.packageSets.create(safeBrandId, {
                        name: 'My Packages',
                        emoji: '📦',
                        tier_labels: ['Basic', 'Standard', 'Premium'],
                    });
                    await loadData();
                } catch (err) {
                    console.error('Failed to auto-create default set', err);
                }
            })();
        }
    }, [isLoading, sets.length, safeBrandId, loadData]);

    // ── All assigned package IDs across all sets ──
    const assignedIds = sets.flatMap(s => s.slots)
        .filter(slot => slot.service_package_id !== null)
        .map(slot => slot.service_package_id!);

    // ── Handlers ──

    const handleSelectPackage = async (pkg: ServicePackage) => {
        if (pickerSlotId === null) return;
        try {
            await api.packageSets.assignPackage(safeBrandId, pickerSlotId, pkg.id);
            await loadData();
        } catch (err) {
            console.error('Failed to assign package', err);
        }
        setPickerSlotId(null);
    };

    const handleOpenPickerForSlot = (slotId: number, setCategoryName: string | null) => {
        setPickerSlotId(slotId);
        setPickerSetCategory(setCategoryName ?? null);
    };

    const handleClearSlot = async (slotId: number) => {
        try {
            await api.packageSets.clearSlot(safeBrandId, slotId);
            await loadData();
        } catch (err) {
            console.error('Failed to clear slot', err);
        }
    };

    const handleAddSlot = async (setId: number) => {
        try {
            // Determine the next missing tier for this set
            const set = sets.find(s => s.id === setId);
            const existingLabels = set?.slots.map(s => s.slot_label) || [];
            const nextTier = TIER_LABELS.find(t => !existingLabels.includes(t));
            if (!nextTier) return; // All 5 tiers already exist
            await api.packageSets.addSlot(safeBrandId, setId, nextTier);
            await loadData();
        } catch (err) {
            console.error('Failed to add slot', err);
        }
    };

    const handleRemoveSlot = async (slotId: number) => {
        try {
            await api.packageSets.removeSlot(safeBrandId, slotId);
            await loadData();
        } catch (err) {
            console.error('Failed to remove slot', err);
        }
    };

    const handleSwapPackages = async (sourceSlotId: number, targetSlotId: number) => {
        // Find the two slots across all sets
        let sourcePkgId: number | null = null;
        let targetPkgId: number | null = null;
        for (const s of sets) {
            for (const sl of s.slots) {
                if (sl.id === sourceSlotId) sourcePkgId = sl.service_package_id;
                if (sl.id === targetSlotId) targetPkgId = sl.service_package_id;
            }
        }
        // Optimistic update
        setSets(prev => prev.map(s => ({
            ...s,
            slots: s.slots.map(sl => {
                if (sl.id === sourceSlotId) return { ...sl, service_package_id: targetPkgId, service_package: s.slots.find(x => x.id === targetSlotId)?.service_package ?? null };
                if (sl.id === targetSlotId) return { ...sl, service_package_id: sourcePkgId, service_package: s.slots.find(x => x.id === sourceSlotId)?.service_package ?? null };
                return sl;
            }),
        })));
        try {
            // Swap by updating both slots
            await Promise.all([
                api.packageSets.updateSlot(safeBrandId, sourceSlotId, { service_package_id: targetPkgId }),
                api.packageSets.updateSlot(safeBrandId, targetSlotId, { service_package_id: sourcePkgId }),
            ]);
        } catch (err) {
            console.error('Failed to swap packages', err);
            await loadData(); // rollback
        }
    };

    const handleDeleteSet = async (setId: number) => {
        try {
            await api.packageSets.delete(safeBrandId, setId);
            await loadData();
        } catch (err) {
            console.error('Failed to delete set', err);
        }
    };

    const handleRenameSet = async (setId: number) => {
        if (!editName.trim()) { setEditingSetId(null); return; }
        try {
            await api.packageSets.update(safeBrandId, setId, { name: editName.trim() });
            await loadData();
        } catch (err) {
            console.error('Failed to rename set', err);
        }
        setEditingSetId(null);
    };

    const totalSlotsFilled = sets.reduce((n, s) => n + s.slots.filter(sl => sl.service_package_id).length, 0);
    const totalSlots = sets.reduce((n, s) => n + s.slots.length, 0);

    // ── Loading ──

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 12 }}>
                <CircularProgress size={28} sx={{ color: '#648CFF' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1800, mx: 'auto' }}>
            {/* ── Header ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        width: 44, height: 44, borderRadius: 2.5,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)',
                    }}>
                        <InventoryIcon sx={{ fontSize: 22, color: '#f59e0b' }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.5rem' }}>
                            Active Packages
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                            {totalSlotsFilled} of {totalSlots} slots filled · {sets.length} set{sets.length !== 1 ? 's' : ''} · {allPackages.length} in library
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Empty state is auto-handled: if 0 sets after load, auto-create a default set */}

            {/* ═══ Package Sets — scrolling sections ═══ */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {sets.map(set => (
                    <PackageSetSection
                        key={set.id}
                        set={set}
                        currencyCode={currencyCode}
                        allPackages={allPackages}
                        isEditing={editingSetId === set.id}
                        editName={editName}
                        onStartEdit={() => { setEditingSetId(set.id); setEditName(set.name); }}
                        onEditNameChange={setEditName}
                        onFinishEdit={() => handleRenameSet(set.id)}
                        onCancelEdit={() => setEditingSetId(null)}
                        onDeleteSet={() => handleDeleteSet(set.id)}
                        onSlotClick={(slotId) => handleOpenPickerForSlot(slotId, set.category?.name ?? null)}
                        onClearSlot={handleClearSlot}
                        onAddSlot={() => handleAddSlot(set.id)}
                        onRemoveSlot={handleRemoveSlot}
                        onSwapPackages={handleSwapPackages}
                        onOpenPackage={(pkgId) => router.push(`/designer/packages/${pkgId}`)}
                        setCategoryName={set.category?.name ?? null}
                        onCreateNew={(slotId) => {
                            const params = new URLSearchParams();
                            if (slotId) params.set('slotId', String(slotId));
                            if (set.category?.name) params.set('category', set.category.name);
                            if (set.category_id) params.set('category_id', String(set.category_id));
                            const qs = params.toString();
                            router.push(`/designer/packages/new${qs ? `?${qs}` : ''}`);
                        }}
                        hasLibraryPackages={allPackages.length > 0}
                    />
                ))}
            </Box>

            {/* ── Library summary footer ── */}
            {sets.length > 0 && (
                <Box sx={{
                    mt: 5, borderRadius: 2.5, px: 3, py: 2,
                    bgcolor: 'rgba(16, 18, 22, 0.4)',
                    border: '1px solid rgba(52, 58, 68, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <InventoryIcon sx={{ fontSize: 18, color: '#475569' }} />
                        <Typography sx={{ color: '#64748b', fontSize: '0.78rem' }}>
                            <Box component="span" sx={{ color: '#94a3b8', fontWeight: 700 }}>{allPackages.length}</Box> package{allPackages.length !== 1 ? 's' : ''} in your library
                        </Typography>
                    </Box>
                    <Button
                        size="small"
                        startIcon={<AddIcon sx={{ fontSize: '14px !important' }} />}
                        onClick={() => setIsCreateSetOpen(true)}
                        sx={{
                            color: '#648CFF', fontSize: '0.72rem', fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': { bgcolor: 'rgba(100, 140, 255, 0.08)' },
                        }}
                    >
                        Add Another Set
                    </Button>
                </Box>
            )}

            {/* ── Package Picker Dialog ── */}
            <PackagePickerDialog
                open={pickerSlotId !== null}
                onClose={() => { setPickerSlotId(null); setPickerSetCategory(null); }}
                packages={allPackages}
                loading={isLoading}
                currencyCode={currencyCode}
                assignedIds={assignedIds}
                onSelect={handleSelectPackage}
                slotId={pickerSlotId}
                filterCategory={pickerSetCategory}
                lockedCategory={pickerSetCategory}
            />

            <CreatePackageSetDialog
                open={isCreateSetOpen}
                onClose={() => setIsCreateSetOpen(false)}
                onCreated={loadData}
                brandId={safeBrandId}
                categories={categories}
            />
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// ── Package Set Section
// ═══════════════════════════════════════════════════════════════════════

function PackageSetSection({
    set, currencyCode, allPackages,
    isEditing, editName, onStartEdit, onEditNameChange, onFinishEdit, onCancelEdit,
    onDeleteSet, onSlotClick, onClearSlot, onAddSlot, onRemoveSlot, onSwapPackages,
    onOpenPackage, onCreateNew, hasLibraryPackages, setCategoryName,
}: {
    set: PackageSet;
    currencyCode: string;
    allPackages: ServicePackage[];
    isEditing: boolean;
    editName: string;
    onStartEdit: () => void;
    onEditNameChange: (v: string) => void;
    onFinishEdit: () => void;
    onCancelEdit: () => void;
    onDeleteSet: () => void;
    onSlotClick: (slotId: number) => void;
    onClearSlot: (slotId: number) => void;
    onAddSlot: () => void;
    onRemoveSlot: (slotId: number) => void;
    onSwapPackages: (sourceSlotId: number, targetSlotId: number) => void;
    onOpenPackage: (pkgId: number) => void;
    onCreateNew: (slotId?: number) => void;
    hasLibraryPackages: boolean;
    setCategoryName: string | null;
}) {
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [draggingSlotId, setDraggingSlotId] = useState<number | null>(null);
    const tierMap = resolveSlotTiers(set.slots);
    const sortedSlots = [...set.slots].sort((a, b) => {
        const tierOrder = (label: string) => {
            const idx = TIER_LABELS.indexOf(label as typeof TIER_LABELS[number]);
            return idx >= 0 ? idx : 999;
        };
        return tierOrder(tierMap.get(a.id) || a.slot_label) - tierOrder(tierMap.get(b.id) || b.slot_label);
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor),
    );

    const handleDragStart = (event: DragStartEvent) => {
        setDraggingSlotId(Number(event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setDraggingSlotId(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const sourceSlotId = Number(active.id);
        const targetSlotId = Number(over.id);
        // Only swap if the source slot has a package
        const sourceSlot = sortedSlots.find(s => s.id === sourceSlotId);
        if (!sourceSlot?.service_package_id) return;
        onSwapPackages(sourceSlotId, targetSlotId);
    };

    const draggingSlot = draggingSlotId ? sortedSlots.find(s => s.id === draggingSlotId) : null;

    return (
        <Box>
            {/* ── Set Header ── */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                mb: 2.5, pb: 1.5, borderBottom: '1px solid rgba(52, 58, 68, 0.2)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {/* Emoji */}
                    <Box sx={{
                        width: 40, height: 40, borderRadius: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52, 58, 68, 0.3)',
                        fontSize: '1.3rem',
                    }}>
                        {set.emoji || '📦'}
                    </Box>

                    {/* Name / Edit */}
                    {isEditing ? (
                        <TextField
                            size="small"
                            autoFocus
                            value={editName}
                            onChange={e => onEditNameChange(e.target.value)}
                            onBlur={onFinishEdit}
                            onKeyDown={e => {
                                if (e.key === 'Enter') onFinishEdit();
                                if (e.key === 'Escape') onCancelEdit();
                            }}
                            sx={{
                                width: 220,
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'rgba(255,255,255,0.03)', color: '#e2e8f0',
                                    fontSize: '1.1rem', fontWeight: 700,
                                    '& fieldset': { borderColor: 'rgba(100,140,255,0.3)' },
                                },
                            }}
                        />
                    ) : (
                        <Box>
                            <Typography sx={{
                                fontWeight: 800, color: '#f1f5f9', fontSize: '1.15rem', lineHeight: 1.3,
                                cursor: 'pointer',
                                '&:hover': { color: '#648CFF' },
                            }} onClick={onStartEdit}>
                                {set.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                                {setCategoryName && (
                                    <Chip
                                        label={setCategoryName}
                                        size="small"
                                        sx={{
                                            height: 18, fontSize: '0.65rem', fontWeight: 600,
                                            bgcolor: 'rgba(100,140,255,0.12)', color: '#648CFF',
                                            '& .MuiChip-label': { px: 0.8 },
                                        }}
                                    />
                                )}
                                <Typography sx={{ color: '#475569', fontSize: '0.7rem' }}>
                                    {sortedSlots.filter(s => s.service_package_id).length} of {sortedSlots.length} slots filled
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {sortedSlots.length < MAX_SLOTS && (
                        <Tooltip title="Add slot">
                            <IconButton onClick={onAddSlot} sx={{ color: '#64748b', '&:hover': { color: '#648CFF' } }}>
                                <AddIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                    <IconButton onClick={e => setMenuAnchor(e.currentTarget)} sx={{ color: '#64748b' }}>
                        <MoreVertIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Menu
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        onClose={() => setMenuAnchor(null)}
                        PaperProps={{
                            sx: {
                                bgcolor: '#1a1d26', border: '1px solid rgba(52,58,68,0.4)',
                                borderRadius: 2, minWidth: 160,
                            },
                        }}
                    >
                        <MenuItem onClick={() => { setMenuAnchor(null); onStartEdit(); }}>
                            <ListItemIcon><EditIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></ListItemIcon>
                            <ListItemText primaryTypographyProps={{ fontSize: '0.8rem', color: '#e2e8f0' }}>Rename</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => { setMenuAnchor(null); onDeleteSet(); }}>
                            <ListItemIcon><DeleteOutlineIcon sx={{ fontSize: 16, color: '#ef4444' }} /></ListItemIcon>
                            <ListItemText primaryTypographyProps={{ fontSize: '0.8rem', color: '#ef4444' }}>Delete Set</ListItemText>
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            {/* ── Slots Grid ── */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: `repeat(${MAX_SLOTS}, minmax(0, 1fr))`,
                        lg: `repeat(${MAX_SLOTS}, minmax(0, 1fr))`,
                        xl: `repeat(${MAX_SLOTS}, minmax(0, 1fr))`,
                    },
                    gap: 2.5,
                }}>
                    {sortedSlots.map(slot => (
                        <DroppableSlotWrapper key={slot.id} id={slot.id} isOver={draggingSlotId !== null && draggingSlotId !== slot.id}>
                            {slot.service_package ? (
                                <DraggableFilledSlot slotId={slot.id}>
                                    <FilledSlot
                                        pkg={allPackages.find(p => p.id === slot.service_package!.id) || slot.service_package}
                                        slotLabel={tierMap.get(slot.id) || slot.slot_label}
                                        currencyCode={currencyCode}
                                        onOpen={() => onOpenPackage(slot.service_package!.id)}
                                        onSwap={() => onSlotClick(slot.id)}
                                        onRemove={() => onClearSlot(slot.id)}
                                        onRemoveSlot={() => onRemoveSlot(slot.id)}
                                        canRemoveSlot={sortedSlots.length > 1}
                                    />
                                </DraggableFilledSlot>
                            ) : (
                                <EmptySlot
                                    slotLabel={tierMap.get(slot.id) || slot.slot_label}
                                    onAdd={() => onSlotClick(slot.id)}
                                    hasLibraryPackages={hasLibraryPackages}
                                    onCreateNew={() => onCreateNew(slot.id)}
                                    onRemoveSlot={() => onRemoveSlot(slot.id)}
                                    canRemoveSlot={sortedSlots.length > 1}
                                />
                            )}
                        </DroppableSlotWrapper>
                    ))}

                    {/* Add-slot ghost card */}
                    {sortedSlots.length < MAX_SLOTS && (
                        <Box
                            onClick={onAddSlot}
                            sx={{
                                borderRadius: 3,
                                border: '2px dashed rgba(52, 58, 68, 0.25)',
                                bgcolor: 'rgba(16, 18, 22, 0.15)',
                                minHeight: 200,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: 1,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: 'rgba(100, 140, 255, 0.3)',
                                    bgcolor: 'rgba(16, 18, 22, 0.3)',
                                },
                            }}
                        >
                            <AddIcon sx={{ fontSize: 28, color: '#334155' }} />
                            <Typography sx={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                                Add Slot
                            </Typography>
                            <Typography sx={{ fontSize: '0.6rem', color: '#334155' }}>
                                {sortedSlots.length} / {MAX_SLOTS}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Drag overlay — shows a ghost of the package being dragged */}
                <DragOverlay>
                    {draggingSlot?.service_package ? (
                        <Box sx={{
                            px: 2, py: 1.5, borderRadius: 2,
                            bgcolor: 'rgba(100, 140, 255, 0.12)',
                            border: '1px solid rgba(100, 140, 255, 0.35)',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                            maxWidth: 220,
                        }}>
                            <Typography sx={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.85rem' }}>
                                {draggingSlot.service_package.name}
                            </Typography>
                            <Typography sx={{ color: '#648CFF', fontSize: '0.65rem', mt: 0.25 }}>
                                Drop on another slot to swap
                            </Typography>
                        </Box>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// ── Droppable Slot Wrapper (drop target for package swap)
// ═══════════════════════════════════════════════════════════════════════

function DroppableSlotWrapper({ id, isOver: isDragActive, children }: { id: number; isOver: boolean; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <Box
            ref={setNodeRef}
            sx={{
                position: 'relative',
                borderRadius: 3,
                transition: 'box-shadow 0.2s, outline 0.2s',
                outline: isOver ? '2px solid rgba(100, 140, 255, 0.5)' : '2px solid transparent',
                boxShadow: isOver ? '0 0 20px rgba(100, 140, 255, 0.15)' : 'none',
            }}
        >
            {/* Drop hint overlay */}
            {isDragActive && isOver && (
                <Box sx={{
                    position: 'absolute', inset: 0, zIndex: 5,
                    borderRadius: 3, pointerEvents: 'none',
                    bgcolor: 'rgba(100, 140, 255, 0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <SwapHorizIcon sx={{ fontSize: 32, color: '#648CFF', opacity: 0.6 }} />
                </Box>
            )}
            {children}
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// ── Draggable Filled Slot (only packages with content can be dragged)
// ═══════════════════════════════════════════════════════════════════════

function DraggableFilledSlot({ slotId, children }: { slotId: number; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: slotId });

    return (
        <Box ref={setNodeRef} sx={{ position: 'relative', opacity: isDragging ? 0.35 : 1, transition: 'opacity 0.15s' }}>
            {/* Drag handle */}
            <Box
                {...attributes}
                {...listeners}
                sx={{
                    position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 10, cursor: 'grab',
                    display: 'flex', alignItems: 'center', gap: 0.25,
                    px: 1, py: 0.25, borderRadius: 1,
                    bgcolor: 'rgba(16, 18, 22, 0.7)',
                    border: '1px solid rgba(52, 58, 68, 0.3)',
                    opacity: 0, transition: 'opacity 0.15s',
                    '&:hover': { opacity: 1, bgcolor: 'rgba(100, 140, 255, 0.12)', borderColor: 'rgba(100, 140, 255, 0.3)' },
                    '.MuiBox-root:hover > &': { opacity: 0.6 },
                    '&:active': { cursor: 'grabbing' },
                }}
            >
                <DragIndicatorIcon sx={{ fontSize: 14, color: '#648CFF' }} />
            </Box>
            {children}
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// ── Empty Slot Component
// ═══════════════════════════════════════════════════════════════════════

function EmptySlot({
    slotLabel, onAdd, hasLibraryPackages, onCreateNew,
    onRemoveSlot, canRemoveSlot,
}: {
    slotLabel: string;
    onAdd: () => void;
    hasLibraryPackages: boolean;
    onCreateNew: () => void;
    onRemoveSlot: () => void;
    canRemoveSlot: boolean;
}) {
    const tierColor = getTierColor(slotLabel);
    return (
        <Box
            sx={{
                borderRadius: 3,
                border: '2px dashed rgba(52, 58, 68, 0.4)',
                bgcolor: 'rgba(16, 18, 22, 0.3)',
                minHeight: 320,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                cursor: hasLibraryPackages ? 'pointer' : 'default',
                transition: 'all 0.25s ease',
                position: 'relative', overflow: 'hidden',
                '&:hover': hasLibraryPackages ? {
                    borderColor: `${tierColor}55`,
                    bgcolor: 'rgba(16, 18, 22, 0.45)',
                    '& .slot-plus': {
                        transform: 'scale(1.1)',
                        bgcolor: `${tierColor}20`,
                        borderColor: `${tierColor}60`,
                        color: tierColor,
                    },
                    '& .ghost-card': { opacity: 0.07 },
                    '& .remove-btn': { opacity: 1 },
                } : {},
            }}
            onClick={hasLibraryPackages ? onAdd : undefined}
        >
            {/* Ghost card outline */}
            <Box className="ghost-card" sx={{
                position: 'absolute', inset: 16, borderRadius: 2.5,
                border: '1px solid rgba(52, 58, 68, 0.2)',
                bgcolor: 'rgba(16, 18, 22, 0.3)', opacity: 0.04,
                transition: 'opacity 0.3s ease', pointerEvents: 'none',
            }}>
                <Box sx={{ height: 3, bgcolor: 'rgba(100, 140, 255, 0.15)', borderRadius: '10px 10px 0 0' }} />
                <Box sx={{ px: 2, pt: 2 }}>
                    <Box sx={{ width: 60, height: 10, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.08)', mb: 1.5 }} />
                    <Box sx={{ width: '80%', height: 14, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.06)', mb: 1 }} />
                    <Box sx={{ width: '60%', height: 8, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.04)' }} />
                </Box>
                <Box sx={{ px: 2, pt: 3 }}>
                    {[1, 2, 3].map(i => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.04)' }} />
                            <Box sx={{ width: `${40 + i * 8}%`, height: 8, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)' }} />
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Remove slot button */}
            {canRemoveSlot && (
                <Tooltip title="Remove this slot">
                    <IconButton
                        className="remove-btn"
                        size="small"
                        onClick={e => { e.stopPropagation(); onRemoveSlot(); }}
                        sx={{
                            position: 'absolute', top: 8, right: 8, zIndex: 2,
                            opacity: 0, transition: 'opacity 0.2s',
                            color: '#475569', p: 0.5,
                            '&:hover': { color: '#ef4444' },
                        }}
                    >
                        <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </Tooltip>
            )}

            {/* Slot label */}
            <Typography sx={{
                fontSize: '0.65rem', fontWeight: 700, color: tierColor,
                textTransform: 'uppercase', letterSpacing: '1px',
                position: 'relative', zIndex: 1,
            }}>
                {slotLabel}
            </Typography>

            {/* Plus button */}
            <Box className="slot-plus" sx={{
                width: 56, height: 56, borderRadius: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: `${tierColor}12`,
                border: `2px dashed ${tierColor}40`,
                color: `${tierColor}90`, transition: 'all 0.25s ease',
                position: 'relative', zIndex: 1,
            }}>
                <AddIcon sx={{ fontSize: 28 }} />
            </Box>

            {/* Instruction */}
            <Typography sx={{
                fontSize: '0.72rem', color: '#475569', textAlign: 'center',
                maxWidth: 200, lineHeight: 1.5, position: 'relative', zIndex: 1,
            }}>
                {hasLibraryPackages
                    ? 'Click to browse your package library'
                    : 'No packages in your library yet'}
            </Typography>

            {!hasLibraryPackages && (
                <Button
                    size="small"
                    startIcon={<AddIcon sx={{ fontSize: '14px !important' }} />}
                    onClick={e => { e.stopPropagation(); onCreateNew(); }}
                    sx={{
                        color: '#0f172a', fontSize: '0.7rem', fontWeight: 700,
                        textTransform: 'none', px: 2, py: 0.5,
                        bgcolor: '#f59e0b', borderRadius: 2,
                        position: 'relative', zIndex: 1,
                        '&:hover': { bgcolor: '#d97706' },
                    }}
                >
                    Create First Package
                </Button>
            )}
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// ── Filled Slot Component
// ═══════════════════════════════════════════════════════════════════════

function FilledSlot({
    pkg, slotLabel, currencyCode,
    onOpen, onSwap, onRemove, onRemoveSlot, canRemoveSlot,
}: {
    pkg: ServicePackage;
    slotLabel: string;
    currencyCode: string;
    onOpen: () => void;
    onSwap: () => void;
    onRemove: () => void;
    onRemoveSlot: () => void;
    canRemoveSlot: boolean;
}) {
    const stats = getPackageStats(pkg);
    const catColor = getCategoryColor(pkg.category);
    const tierColor = getTierColor(slotLabel);
    const filmItems = (pkg.contents?.items || []).filter(i => i.type === 'film');

    return (
        <Box sx={{
            borderRadius: 3,
            bgcolor: 'rgba(16, 18, 22, 0.85)',
            border: '1px solid rgba(52, 58, 68, 0.3)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            transition: 'all 0.2s ease',
            '&:hover': {
                border: '1px solid rgba(100, 140, 255, 0.25)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                '& .slot-actions': { opacity: 1 },
            },
        }}>
            {/* Slot label bar */}
            <Box sx={{
                px: 2, py: 0.75,
                bgcolor: `${tierColor}0F`,
                borderBottom: '1px solid rgba(52, 58, 68, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Typography sx={{
                    fontSize: '0.6rem', fontWeight: 700, color: tierColor,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                    {slotLabel}
                </Typography>
                <Box className="slot-actions" sx={{ display: 'flex', gap: 0.25, opacity: 0, transition: 'opacity 0.2s' }}>
                    <Tooltip title="Swap package" arrow>
                        <IconButton size="small" onClick={e => { e.stopPropagation(); onSwap(); }} sx={{ p: 0.3, color: '#648CFF' }}>
                            <SwapHorizIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Clear slot" arrow>
                        <IconButton size="small" onClick={e => { e.stopPropagation(); onRemove(); }} sx={{ p: 0.3, color: '#475569', '&:hover': { color: '#ef4444' } }}>
                            <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Tooltip>
                    {canRemoveSlot && (
                        <Tooltip title="Remove slot entirely" arrow>
                            <IconButton size="small" onClick={e => { e.stopPropagation(); onRemoveSlot(); }} sx={{ p: 0.3, color: '#475569', '&:hover': { color: '#ef4444' } }}>
                                <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* Top accent — tier-colored */}
            <Box sx={{ height: 3, background: `linear-gradient(90deg, ${tierColor}, ${tierColor}80)` }} />

            {/* ── Header container: fixed height so stats align across cards ── */}
            <Box sx={{ height: 170, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header: category + price */}
                <Box sx={{ px: 2.5, pt: 2, pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <Chip
                        label={pkg.category || 'General'}
                        size="small"
                        sx={{
                            height: 22, fontSize: '0.6rem', fontWeight: 700,
                            bgcolor: `${catColor}15`, color: catColor,
                            border: `1px solid ${catColor}30`,
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}
                    />
                    <Typography sx={{
                        fontWeight: 800, color: '#f59e0b', fontSize: '1.1rem', fontFamily: 'monospace',
                    }}>
                        {formatCurrency(stats.totalCost > 0 ? stats.totalCost : Number(pkg.base_price ?? 0), currencyCode || 'USD')}
                    </Typography>
                </Box>

                {/* Name + Description */}
                <Box sx={{ px: 2.5, pt: 1.5, pb: 2, overflow: 'hidden' }}>
                    <Typography sx={{
                        fontWeight: 800, color: '#f1f5f9', fontSize: '1.05rem', lineHeight: 1.3, mb: 0.5,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                        {pkg.name}
                    </Typography>
                    <Typography sx={{
                        color: '#64748b', fontSize: '0.72rem', lineHeight: 1.5,
                        height: '3em',
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                        {pkg.description || '\u00A0'}
                    </Typography>
                </Box>
            </Box>

            {/* Divider */}
            <Box sx={{ mx: 2.5, height: '1px', bgcolor: 'rgba(52, 58, 68, 0.3)' }} />

            {/* Stats */}
            <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                    { icon: <EventIcon sx={{ fontSize: 14, color: '#f59e0b' }} />, label: 'Event Days', value: stats.dayCount, color: '#f59e0b' },
                    { icon: <PeopleIcon sx={{ fontSize: 14, color: '#648CFF' }} />, label: 'Crew', value: stats.crewCount, color: '#648CFF' },
                    { icon: <CameraAltIcon sx={{ fontSize: 14, color: '#10b981' }} />, label: 'Cameras', value: stats.cameraCount, color: '#10b981' },
                    { icon: <MicIcon sx={{ fontSize: 14, color: '#0ea5e9' }} />, label: 'Audio', value: stats.audioCount, color: '#0ea5e9' },
                    { icon: <PlaceIcon sx={{ fontSize: 14, color: '#a855f7' }} />, label: 'Locations', value: stats.locationCount, color: '#a855f7' },
                ].map(stat => (
                    <Box key={stat.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                                width: 26, height: 26, borderRadius: 1.5,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: `${stat.color}10`, border: `1px solid ${stat.color}20`,
                            }}>
                                {stat.icon}
                            </Box>
                            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
                                {stat.label}
                            </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 700, fontFamily: 'monospace' }}>
                            {stat.value}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Divider */}
            <Box sx={{ mx: 2.5, height: '1px', bgcolor: 'rgba(52, 58, 68, 0.3)' }} />

            {/* Films List */}
            <Box sx={{ px: 2.5, py: 2, flex: 1 }}>
                <Typography sx={{
                    fontSize: '0.6rem', fontWeight: 700, color: '#475569',
                    textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.25,
                }}>
                    Films
                </Typography>
                {filmItems.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        {filmItems.map((item, idx) => (
                            <Box key={item.id || idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MovieIcon sx={{ fontSize: 13, color: '#648CFF', opacity: 0.7 }} />
                                <Typography sx={{
                                    fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 500,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {item.description || 'Untitled Film'}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                ) : (
                    <Typography sx={{ fontSize: '0.72rem', color: '#334155', fontStyle: 'italic' }}>
                        No films added
                    </Typography>
                )}
            </Box>

            {/* Footer: Open button */}
            <Box sx={{
                px: 2.5, py: 1.5,
                borderTop: '1px solid rgba(52, 58, 68, 0.2)',
                display: 'flex', justifyContent: 'center',
            }}>
                <Button
                    size="small"
                    onClick={onOpen}
                    endIcon={<ArrowForwardIcon sx={{ fontSize: '14px !important' }} />}
                    sx={{
                        color: '#648CFF', fontSize: '0.7rem', fontWeight: 700,
                        textTransform: 'none', width: '100%',
                        borderRadius: 1.5, py: 0.5,
                        '&:hover': { bgcolor: 'rgba(100, 140, 255, 0.08)' },
                    }}
                >
                    Open Package
                </Button>
            </Box>
        </Box>
    );
}
