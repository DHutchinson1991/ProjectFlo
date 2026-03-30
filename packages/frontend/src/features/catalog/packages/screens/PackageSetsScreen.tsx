'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
    Box, Typography, CircularProgress, Stack, Chip, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, Divider, Alert,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import InventoryIcon from '@mui/icons-material/Inventory';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/navigation';
import { brandsApi } from '@/features/platform/brand/api';

import {
    useAddPackageSetSlot,
    useAssignPackageSetSlot,
    useClearPackageSetSlot,
    useCreatePackageSet,
    usePackageLibraryData,
    useRemovePackageSetSlot,
    useUpdatePackageSetSlot,
} from '@/features/catalog/packages/hooks';
import { useEventTypes } from '@/features/catalog/event-types/hooks';
import { ServicePackage } from '@/features/catalog/packages/types/service-package.types';
import { useBrand } from '@/features/platform/brand';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import PackageCreationWizard from '../components/creation/PackageCreationWizard';
import {
    type PackageSet,
    TIER_LABELS,
    PackageSetSection,
    PackagePickerDialog,
} from '../components/listing';

const SERVICE_TYPE_OPTIONS = [
    { key: 'WEDDING',    label: 'Weddings',    icon: '💒', color: '#ec4899', description: 'Full wedding day coverage — ceremony, reception, portraits and more.' },
    { key: 'BIRTHDAY',   label: 'Birthdays',   icon: '🎂', color: '#f59e0b', description: 'Birthday celebrations — cake, speeches, dancing and party coverage.' },
    { key: 'ENGAGEMENT', label: 'Engagements', icon: '💍', color: '#8b5cf6', description: 'Engagement shoots and parties — portraits, golden hour, and celebrations.' },
];

export function PackageSetsScreen() {
    const router = useRouter();
    const { currentBrand, refreshBrands } = useBrand();
    const currencyCode = currentBrand?.currency ?? DEFAULT_CURRENCY;

    const [serviceTypes, setServiceTypes] = useState<string[]>(currentBrand?.service_types ?? []);
    const [confirmingServiceType, setConfirmingServiceType] = useState<{ key: string; label: string; icon: string; color: string } | null>(null);
    const [provisioningType, setProvisioningType] = useState<string | null>(null);
    const [disablingType, setDisablingType] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [addServicePickerOpen, setAddServicePickerOpen] = useState(false);

    useEffect(() => {
        setServiceTypes(currentBrand?.service_types ?? []);
    }, [currentBrand?.service_types]);

    const handleConfirmEnableServiceType = async () => {
        if (!currentBrand || !confirmingServiceType) return;
        const key = confirmingServiceType.key;
        setConfirmingServiceType(null);
        setProvisioningType(key);
        try {
            const newTypes = [...serviceTypes, key];
            const updated = await brandsApi.update(currentBrand.id, { service_types: newTypes } as any);
            setServiceTypes(updated.service_types ?? newTypes);
            await refreshBrands();
        } catch {
            // silent — brand context will reflect existing state
        } finally {
            setProvisioningType(null);
        }
    };

    const handleDisableServiceType = async (key: string) => {
        if (!currentBrand) return;
        setDisablingType(key);
        try {
            const newTypes = serviceTypes.filter(t => t !== key);
            const updated = await brandsApi.update(currentBrand.id, { service_types: newTypes } as any);
            setServiceTypes(updated.service_types ?? newTypes);
            if (activeFilter === key) setActiveFilter(null);
            await refreshBrands();
        } catch {
            // silent
        } finally {
            setDisablingType(null);
        }
    };
    const [pickerSlotId, setPickerSlotId] = useState<number | null>(null);
    const [pickerSetCategory, setPickerSetCategory] = useState<string | null>(null);
    const [pickerSlotLabel, setPickerSlotLabel] = useState<string | null>(null);
    const [pickerSetName, setPickerSetName] = useState<string | null>(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardEventTypeName, setWizardEventTypeName] = useState<string | null>(null);
    const [wizardSlotId, setWizardSlotId] = useState<number | null>(null);
    const packageLibraryQuery = usePackageLibraryData(currentBrand?.id);
    const createSetMutation = useCreatePackageSet(currentBrand?.id);
    const eventTypesQuery = useEventTypes();
    const eventTypes = eventTypesQuery.data ?? [];
    const syncedRef = useRef<Set<number>>(new Set());
    const assignPackageMutation = useAssignPackageSetSlot(currentBrand?.id);
    const clearSlotMutation = useClearPackageSetSlot(currentBrand?.id);
    const addSlotMutation = useAddPackageSetSlot(currentBrand?.id);
    const removeSlotMutation = useRemovePackageSetSlot(currentBrand?.id);
    const updateSlotMutation = useUpdatePackageSetSlot(currentBrand?.id);
    const sets = packageLibraryQuery.data?.packageSets ?? [];
    const allPackages = packageLibraryQuery.data?.packages ?? [];
    const isLoading = packageLibraryQuery.isLoading || eventTypesQuery.isLoading;

    useEffect(() => {
        if (packageLibraryQuery.isLoading || eventTypesQuery.isLoading || !currentBrand?.id) return;
        const existingEventTypeIds = new Set(sets.map(s => s.event_type_id).filter(Boolean));
        for (const et of eventTypes) {
            if (!existingEventTypeIds.has(et.id) && !syncedRef.current.has(et.id)) {
                syncedRef.current.add(et.id);
                createSetMutation.mutateAsync({
                    name: `${et.name} Packages`,
                    event_type_id: et.id,
                    emoji: et.icon ?? '📦',
                }).catch(err => {
                    syncedRef.current.delete(et.id);
                    console.error('Failed to auto-create package set', err);
                });
            }
        }
    }, [sets, eventTypes, packageLibraryQuery.isLoading, eventTypesQuery.isLoading, currentBrand?.id]);

    const assignedIds = useMemo(
        () => sets.flatMap(s => s.slots).filter(slot => slot.service_package_id !== null).map(slot => slot.service_package_id!),
        [sets],
    );

    const handleSelectPackage = async (pkg: ServicePackage) => {
        if (pickerSlotId === null) return;
        try {
            await assignPackageMutation.mutateAsync({ slotId: pickerSlotId, servicePackageId: pkg.id });
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
            await clearSlotMutation.mutateAsync(slotId);
        } catch (err) {
            console.error('Failed to clear slot', err);
        }
    };

    const handleAddSlot = async (setId: number) => {
        try {
            const set = sets.find(s => s.id === setId);
            const existingLabels = set?.slots.map(s => s.slot_label) || [];
            const nextTier = TIER_LABELS.find(t => !existingLabels.includes(t));
            if (!nextTier) return;
            await addSlotMutation.mutateAsync({ setId, slotLabel: nextTier });
        } catch (err) {
            console.error('Failed to add slot', err);
        }
    };

    const handleRemoveSlot = async (slotId: number) => {
        try {
            await removeSlotMutation.mutateAsync(slotId);
        } catch (err) {
            console.error('Failed to remove slot', err);
        }
    };

    const handleSwapPackages = async (sourceSlotId: number, targetSlotId: number) => {
        let sourcePkgId: number | null = null;
        let targetPkgId: number | null = null;
        for (const s of sets) {
            for (const sl of s.slots) {
                if (sl.id === sourceSlotId) sourcePkgId = sl.service_package_id;
                if (sl.id === targetSlotId) targetPkgId = sl.service_package_id;
            }
        }
        try {
            await Promise.all([
                updateSlotMutation.mutateAsync({ slotId: sourceSlotId, data: { service_package_id: targetPkgId } }),
                updateSlotMutation.mutateAsync({ slotId: targetSlotId, data: { service_package_id: sourcePkgId } }),
            ]);
        } catch (err) {
            console.error('Failed to swap packages', err);
            await packageLibraryQuery.refetch();
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 12 }}>
                <CircularProgress size={28} sx={{ color: '#648CFF' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1800, mx: 'auto' }}>

            {/* ── Page header ──────────────────────────────────────────────────── */}
            <Box sx={{ mb: 4 }}>
                <Typography sx={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.75rem' }}>Services</Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mt: 0.5 }}>
                    Manage the services your brand offers and configure your package sets.
                </Typography>
            </Box>

            {/* ── Services Offered ─────────────────────────────────────────────── */}
            <Box sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Services Offered
                    </Typography>
                    {SERVICE_TYPE_OPTIONS.some(o => !serviceTypes.includes(o.key)) && (
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => setAddServicePickerOpen(true)}
                            sx={{ borderRadius: 2, fontWeight: 600, fontSize: '0.75rem', py: 0.5 }}
                        >
                            Add Service
                        </Button>
                    )}
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                    {SERVICE_TYPE_OPTIONS.filter(o => serviceTypes.includes(o.key)).map((opt) => {
                        const isSelected = activeFilter === opt.key;
                        const isDisabling = disablingType === opt.key;
                        return (
                            <Box
                                key={opt.key}
                                onClick={() => setActiveFilter(prev => prev === opt.key ? null : opt.key)}
                                sx={{
                                    display: 'flex', flexDirection: 'column', gap: 1.5,
                                    p: 2.5, borderRadius: 2.5, cursor: 'pointer',
                                    border: '1px solid',
                                    borderColor: isSelected ? opt.color : alpha(opt.color, 0.35),
                                    bgcolor: isSelected ? alpha(opt.color, 0.1) : alpha(opt.color, 0.04),
                                    boxShadow: isSelected ? `0 0 0 1px ${opt.color}` : 'none',
                                    transition: 'all 0.15s ease',
                                    '&:hover': { borderColor: opt.color, bgcolor: alpha(opt.color, 0.08) },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <Typography sx={{ fontSize: '1.75rem', lineHeight: 1 }}>{opt.icon}</Typography>
                                    {isSelected && (
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: opt.color, mt: 0.5 }} />
                                    )}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', mb: 0.5 }}>{opt.label}</Typography>
                                    <Typography sx={{ fontSize: '0.775rem', color: '#64748b', lineHeight: 1.5 }}>{opt.description}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Chip
                                        label="Enabled"
                                        size="small"
                                        sx={{ height: 24, fontWeight: 700, fontSize: '0.7rem', bgcolor: alpha(opt.color, 0.15), color: opt.color, border: 'none' }}
                                    />
                                    <Button
                                        size="small"
                                        variant="text"
                                        disabled={isDisabling}
                                        onClick={(e) => { e.stopPropagation(); handleDisableServiceType(opt.key); }}
                                        sx={{ fontSize: '0.7rem', color: '#475569', minWidth: 0, px: 1, '&:hover': { color: '#ef4444' } }}
                                    >
                                        {isDisabling ? <CircularProgress size={10} /> : 'Disable'}
                                    </Button>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
                {activeFilter && (
                    <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>Showing packages for</Typography>
                        <Chip
                            label={SERVICE_TYPE_OPTIONS.find(o => o.key === activeFilter)?.label ?? activeFilter}
                            size="small"
                            onDelete={() => setActiveFilter(null)}
                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                        />
                    </Box>
                )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {sets.filter(set => {
                    if (!activeFilter) return true;
                    const keywords: Record<string, string> = { WEDDING: 'wedding', BIRTHDAY: 'birthday', ENGAGEMENT: 'engag' };
                    const kw = keywords[activeFilter] ?? activeFilter.toLowerCase();
                    const name = (set.event_type?.name ?? set.name).toLowerCase();
                    return name.includes(kw);
                }).map(set => (
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
                        onOpenPackage={(pkgId) => router.push(`/packages/${pkgId}`)}
                        onCreateNew={(slotId) => {
                            const params = new URLSearchParams();
                            if (slotId) params.set('slotId', String(slotId));
                            if (set.event_type?.name) params.set('category', set.event_type.name);
                            if (set.event_type_id) params.set('category_id', String(set.event_type_id));
                            const qs = params.toString();
                            router.push(`/packages/new${qs ? `?${qs}` : ''}`);
                        }}
                        hasLibraryPackages={allPackages.length > 0}
                    />
                ))}
            </Box>

            {sets.length > 0 && (
                <Box sx={{
                    mt: 5, borderRadius: 2.5, px: 3, py: 2,
                    bgcolor: 'rgba(16, 18, 22, 0.4)',
                    border: '1px solid rgba(52, 58, 68, 0.2)',
                    display: 'flex', alignItems: 'center',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <InventoryIcon sx={{ fontSize: 18, color: '#475569' }} />
                        <Typography sx={{ color: '#64748b', fontSize: '0.78rem' }}>
                            <Box component="span" sx={{ color: '#94a3b8', fontWeight: 700 }}>{allPackages.length}</Box> package{allPackages.length !== 1 ? 's' : ''} in your library
                        </Typography>
                    </Box>
                </Box>
            )}

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
                    const slotId = pickerSlotId;
                    const category = pickerSetCategory;
                    setPickerSlotId(null);
                    setPickerSetCategory(null);
                    setPickerSlotLabel(null);
                    setPickerSetName(null);
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
                    if (wizardSlotId) {
                        try {
                            await assignPackageMutation.mutateAsync({ slotId: wizardSlotId, servicePackageId: packageId });
                        } catch (err) {
                            console.warn('Failed to assign package to slot:', err);
                        }
                    }
                    setIsWizardOpen(false);
                    setWizardEventTypeName(null);
                    setWizardSlotId(null);
                    router.push(`/packages/${packageId}`);
                }}
            />

            {/* Add Service Picker Dialog */}
            <Dialog open={addServicePickerOpen} onClose={() => setAddServicePickerOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Add a Service</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <Stack spacing={1.5}>
                        {SERVICE_TYPE_OPTIONS.filter(o => !serviceTypes.includes(o.key)).map(opt => (
                            <Box key={opt.key} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, border: '1px solid rgba(52,58,68,0.5)', bgcolor: 'rgba(16,18,22,0.3)' }}>
                                <Typography sx={{ fontSize: '1.5rem', lineHeight: 1 }}>{opt.icon}</Typography>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#f1f5f9' }}>{opt.label}</Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{opt.description}</Typography>
                                </Box>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    disabled={provisioningType === opt.key}
                                    onClick={() => { setAddServicePickerOpen(false); setConfirmingServiceType(opt); }}
                                    startIcon={provisioningType === opt.key ? <CircularProgress size={12} /> : <AddIcon />}
                                    sx={{ borderRadius: 2, fontWeight: 600, flexShrink: 0 }}
                                >
                                    Enable
                                </Button>
                            </Box>
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setAddServicePickerOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Enable Service Type Confirmation Dialog */}
            <Dialog open={!!confirmingServiceType} onClose={() => setConfirmingServiceType(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography sx={{ fontSize: '1.8rem', lineHeight: 1 }}>{confirmingServiceType?.icon}</Typography>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700}>Enable {confirmingServiceType?.label}?</Typography>
                            <Typography variant="caption" color="text.secondary">This will create templates, activities, and subjects for this service type.</Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>The following will be automatically created for your brand:</Typography>
                    <Stack spacing={1}>
                        {[
                            { icon: '📅', label: 'Event days (e.g. Ceremony Day, Getting Ready)' },
                            { icon: '🎬', label: 'Activities with key moment markers' },
                            { icon: '👥', label: 'Subject types with standard roles' },
                            { icon: '📦', label: 'Package category and default package set' },
                        ].map((item) => (
                            <Box key={item.label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <Typography sx={{ fontSize: '1rem', mt: 0.1 }}>{item.icon}</Typography>
                                <Typography variant="body2">{item.label}</Typography>
                            </Box>
                        ))}
                    </Stack>
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>Enabling a service doesn&apos;t affect existing data. You can customise everything after it&apos;s created.</Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setConfirmingServiceType(null)} sx={{ borderRadius: 2 }}>Cancel</Button>
                    <Button variant="contained" onClick={handleConfirmEnableServiceType} disableElevation startIcon={provisioningType ? <CircularProgress size={14} /> : <AutoAwesomeIcon />} disabled={!!provisioningType} sx={{ fontWeight: 600, borderRadius: 2 }}>
                        {provisioningType ? 'Enabling…' : `Enable ${confirmingServiceType?.label ?? ''}`}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}
