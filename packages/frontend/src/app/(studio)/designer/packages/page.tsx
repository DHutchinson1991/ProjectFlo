'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { ServicePackage } from '@/lib/types/domains/sales';
import { useBrand } from '@/app/providers/BrandProvider';
import PackageCreationWizard from './components/PackageCreationWizard';

// ─── Local listing submodules ─────────────────────────────────────────
import {
    type PackageSet,
    TIER_LABELS,
    PackageSetSection,
    PackagePickerDialog,
    CreatePackageSetDialog,
} from './_listing';

// ─── Main Component ──────────────────────────────────────────────────

export default function PackageLibraryPage() {
    const router = useRouter();
    const { currentBrand } = useBrand();
    const currencyCode = currentBrand?.currency || 'USD';
    const safeBrandId = currentBrand?.id || 1;

    // Data
    const [sets, setSets] = useState<PackageSet[]>([]);
    const [allPackages, setAllPackages] = useState<ServicePackage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Dialogs / drawers
    const [isCreateSetOpen, setIsCreateSetOpen] = useState(false);

    // Picker dialog state – which slot we're selecting a package for
    const [pickerSlotId, setPickerSlotId] = useState<number | null>(null);
    // The category name of the set whose slot triggered the picker (for strict filtering)
    const [pickerSetCategory, setPickerSetCategory] = useState<string | null>(null);
    const [pickerSlotLabel, setPickerSlotLabel] = useState<string | null>(null);
    const [pickerSetName, setPickerSetName] = useState<string | null>(null);

    // Creation wizard state
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardEventTypeName, setWizardEventTypeName] = useState<string | null>(null);
    const [wizardSlotId, setWizardSlotId] = useState<number | null>(null);

    // ── Data loading ──

    const loadData = useCallback(async () => {
        try {
            const [setsData, pkgs] = await Promise.all([
                api.packageSets.getAll(safeBrandId),
                api.servicePackages.getAll(safeBrandId),
            ]);
            setSets(setsData);
            setAllPackages(pkgs);
        } catch (err) {
            console.error('Failed to load data', err);
        } finally {
            setIsLoading(false);
        }
    }, [safeBrandId]);

    useEffect(() => { loadData(); }, [loadData]);

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

    const handleOpenPickerForSlot = (slotId: number, setCategoryName: string | null, slotLabel: string | null, setName: string | null) => {
        setPickerSlotId(slotId);
        setPickerSetCategory(setCategoryName ?? null);
        setPickerSlotLabel(slotLabel ?? null);
        setPickerSetName(setName ?? null);
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
                        onSlotClick={(slotId) => {
                            const slot = set.slots.find(s => s.id === slotId);
                            handleOpenPickerForSlot(slotId, set.event_type?.name ?? null, slot?.slot_label ?? null, set.name);
                        }}
                        onClearSlot={handleClearSlot}
                        onAddSlot={() => handleAddSlot(set.id)}
                        onRemoveSlot={handleRemoveSlot}
                        onSwapPackages={handleSwapPackages}
                        onOpenPackage={(pkgId) => router.push(`/designer/packages/${pkgId}`)}
                        onCreateNew={(slotId) => {
                            const params = new URLSearchParams();
                            if (slotId) params.set('slotId', String(slotId));
                            if (set.event_type?.name) params.set('category', set.event_type.name);
                            if (set.event_type_id) params.set('category_id', String(set.event_type_id));
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
                onClose={() => {
                    setPickerSlotId(null);
                    setPickerSetCategory(null);
                    setPickerSlotLabel(null);
                    setPickerSetName(null);
                }}
                packages={allPackages}
                loading={isLoading}
                currencyCode={currencyCode}
                assignedIds={assignedIds}
                onSelect={handleSelectPackage}
                slotId={pickerSlotId}
                filterCategory={pickerSetCategory}
                slotLabel={pickerSlotLabel}
                setName={pickerSetName}
                onCreateNew={() => {
                    // Capture picker state before closing
                    const slotId = pickerSlotId;
                    const category = pickerSetCategory;
                    // Close picker
                    setPickerSlotId(null);
                    setPickerSetCategory(null);
                    setPickerSlotLabel(null);
                    setPickerSetName(null);
                    // Open creation wizard
                    setWizardSlotId(slotId);
                    setWizardEventTypeName(category);
                    setIsWizardOpen(true);
                }}
            />

            <PackageCreationWizard
                open={isWizardOpen}
                initialEventTypeName={wizardEventTypeName}
                onClose={() => {
                    setIsWizardOpen(false);
                    setWizardEventTypeName(null);
                    setWizardSlotId(null);
                }}
                onPackageCreated={async (packageId) => {
                    // Assign to slot if one was active
                    if (wizardSlotId) {
                        try {
                            await api.packageSets.assignPackage(safeBrandId, wizardSlotId, packageId);
                        } catch (err) {
                            console.warn('Failed to assign package to slot:', err);
                        }
                    }
                    setIsWizardOpen(false);
                    setWizardEventTypeName(null);
                    setWizardSlotId(null);
                    await loadData();
                    router.push(`/designer/packages/${packageId}`);
                }}
            />

            <CreatePackageSetDialog
                open={isCreateSetOpen}
                onClose={() => setIsCreateSetOpen(false)}
                onCreated={loadData}
                brandId={safeBrandId}
            />
        </Box>
    );
}
