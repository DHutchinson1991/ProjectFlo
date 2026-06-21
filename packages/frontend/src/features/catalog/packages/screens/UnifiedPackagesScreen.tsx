"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    Box, Typography, CircularProgress, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, Stack, Divider, Paper, FormControl,
    Select, MenuItem, TextField, InputAdornment, IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { Circle as CircleIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { brandsApi } from "@/features/platform/brand/api";
import { useBrand } from "@/features/platform/brand";
import { DEFAULT_CURRENCY } from "@projectflo/shared";
import { usePackageLibraryData, useDeleteServicePackage } from "../hooks";
import { servicePackagesApi } from "../api";
import { useEventTypes } from "@/features/catalog/package-templates/hooks";
import type { EventType } from "@/features/catalog/package-templates";
import type { ServicePackage } from "../types/service-package.types";
import PackageCreationWizard from "../components/creation/PackageCreationWizard";
import {
    ServiceCardsGrid,
    PackageListPanel,
    PackageDetailPanel,
} from "../components/unified";
import type { ServiceCardStat } from "../components/unified";

// ─── Service type metadata ───────────────────────────────────────────
const SERVICE_TYPE_OPTIONS = [
    { key: "WEDDING", label: "Weddings", icon: "💒", color: "#ec4899", description: "Full wedding day coverage" },
    { key: "BIRTHDAY", label: "Birthdays", icon: "🎂", color: "#f59e0b", description: "Birthday celebrations" },
    { key: "ENGAGEMENT", label: "Engagements", icon: "💍", color: "#8b5cf6", description: "Engagement shoots and parties" },
];

const SERVICE_ICON_OPTIONS = [
    "🎉", "🎊", "🎈", "🥂", "🍾", "🎵", "🎶", "🎤",
    "📸", "🎬", "🎥", "🎞️", "📹", "🖼️", "🌟", "✨",
    "💐", "🌸", "🌺", "🌹", "💒", "💍", "🎂", "🎁",
    "🏢", "🏠", "🏖️", "⛪", "🏰", "🎪", "🎭", "🎨",
    "👶", "👫", "👨‍👩‍👧‍👦", "🐾", "🎓", "💼", "🏆", "🏅",
    "🍽️", "☕", "🍰", "🎃", "🎄", "❤️", "💝", "🪩",
];

const SERVICE_KEYWORDS: Record<string, string> = {
    WEDDING: "wedding",
    BIRTHDAY: "birthday",
    ENGAGEMENT: "engag",
};

function matchServiceType(category: string | null, serviceKey: string): boolean {
    if (!category) return false;
    const kw = SERVICE_KEYWORDS[serviceKey];
    return kw ? category.toLowerCase().includes(kw) : false;
}

// ─── Main Screen ─────────────────────────────────────────────────────

export function UnifiedPackagesScreen() {
    const router = useRouter();
    const { currentBrand, refreshBrands } = useBrand();
    const currencyCode = currentBrand?.currency ?? DEFAULT_CURRENCY;

    // ── Service type state ──
    const [serviceTypes, setServiceTypes] = useState<string[]>(currentBrand?.service_types ?? []);
    const [activeServiceKey, setActiveServiceKey] = useState<string | null>(null);
    const [togglingKey, setTogglingKey] = useState<string | null>(null);
    const [addServicePickerOpen, setAddServicePickerOpen] = useState(false);
    const [confirmingServiceType, setConfirmingServiceType] = useState<typeof SERVICE_TYPE_OPTIONS[0] | null>(null);
    const [provisioningType, setProvisioningType] = useState<string | null>(null);
    const [disablingKey, setDisablingKey] = useState<string | null>(null);
    const [customServiceOpen, setCustomServiceOpen] = useState(false);
    const [customName, setCustomName] = useState("");
    const [customIcon, setCustomIcon] = useState("🎉");
    const [customColor, setCustomColor] = useState("#6366f1");
    const [customDescription, setCustomDescription] = useState("");
    const [creatingCustom, setCreatingCustom] = useState(false);

    // ── Package selection state ──
    const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
    const [hoveredPackageId, setHoveredPackageId] = useState<number | null>(null);

    // ── Filter state ──
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");

    // ── Wizard state ──
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardEventTypeName, setWizardEventTypeName] = useState<string | null>(null);

    // ── Delete state ──
    const [deleteTarget, setDeleteTarget] = useState<ServicePackage | null>(null);

    // ── Data hooks ──
    const packageLibraryQuery = usePackageLibraryData(currentBrand?.id);
    const eventTypesQuery = useEventTypes();
    const deletePackageMutation = useDeleteServicePackage(currentBrand?.id);

    const allPackages: ServicePackage[] = packageLibraryQuery.data?.packages ?? [];
    const eventTypes = (eventTypesQuery.data ?? []) as EventType[];
    const isLoading = packageLibraryQuery.isLoading || eventTypesQuery.isLoading;

    useEffect(() => {
        setServiceTypes(currentBrand?.service_types ?? []);
    }, [currentBrand?.service_types]);

    // ── Derived data ──

    // Filter packages by currently selected service, status, and search
    const filteredPackages = useMemo(() => {
        let result = allPackages;
        if (activeServiceKey) {
            result = result.filter(pkg => matchServiceType(pkg.category, activeServiceKey));
        }
        if (statusFilter === "active") {
            result = result.filter(pkg => pkg.is_active);
        } else if (statusFilter === "inactive") {
            result = result.filter(pkg => !pkg.is_active);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            result = result.filter(pkg => pkg.name.toLowerCase().includes(q));
        }
        return result;
    }, [allPackages, activeServiceKey, statusFilter, searchQuery]);

    // Build service card stats
    const serviceCards: ServiceCardStat[] = useMemo(() => {
        const hardcodedKeys = SERVICE_TYPE_OPTIONS.map(o => o.key);
        const hardcoded = SERVICE_TYPE_OPTIONS
            .filter(opt => serviceTypes.includes(opt.key))
            .map(opt => {
                const matching = allPackages.filter(pkg => matchServiceType(pkg.category, opt.key));
                const totalValue = matching.reduce((sum, p) => sum + (p._totalCost ?? 0), 0);
                return {
                    key: opt.key,
                    label: opt.label,
                    icon: opt.icon,
                    color: opt.color,
                    description: opt.description,
                    activeCount: matching.filter(p => p.is_active).length,
                    inactiveCount: matching.filter(p => !p.is_active).length,
                    totalValue,
                };
            });

        // Custom event types (not in hardcoded list)
        const custom = eventTypes
            .filter(et => !hardcodedKeys.some(k => SERVICE_KEYWORDS[k] && et.name.toLowerCase().includes(SERVICE_KEYWORDS[k])))
            .map(et => {
                const key = et.name.toUpperCase().replace(/\s+/g, "_");
                const matching = allPackages.filter(pkg => pkg.category?.toLowerCase().includes(et.name.toLowerCase()));
                const totalValue = matching.reduce((sum, p) => sum + (p._totalCost ?? 0), 0);
                return {
                    key,
                    label: et.name + "s",
                    icon: et.icon || "🎉",
                    color: et.color || "#6366f1",
                    description: et.description || "",
                    activeCount: matching.filter(p => p.is_active).length,
                    inactiveCount: matching.filter(p => !p.is_active).length,
                    totalValue,
                };
            });

        return [...hardcoded, ...custom];
    }, [serviceTypes, allPackages, eventTypes]);

    // Find the event type matching the currently selected service
    const activeEventType = useMemo<EventType | null>(() => {
        if (!activeServiceKey) return null;
        const kw = SERVICE_KEYWORDS[activeServiceKey]?.toLowerCase();
        if (kw) return eventTypes.find(et => et.name.toLowerCase().includes(kw)) ?? null;
        // Custom: match by derived key
        return eventTypes.find(et => et.name.toUpperCase().replace(/\s+/g, "_") === activeServiceKey) ?? null;
        return eventTypes.find(et => et.name.toLowerCase().includes(kw)) ?? null;
    }, [activeServiceKey, eventTypes]);

    // Resolve detail panel package
    const selectedPkg = selectedPackageId ? allPackages.find(p => p.id === selectedPackageId) ?? null : null;
    const hoveredPkg = hoveredPackageId ? allPackages.find(p => p.id === hoveredPackageId) ?? null : null;
    const detailPkg = selectedPkg ?? hoveredPkg;

    const disabledServiceTypes = SERVICE_TYPE_OPTIONS.filter(o => !serviceTypes.includes(o.key));

    // ── Service type toggle handlers ──
    const handleDisableServiceType = async (key: string) => {
        if (!currentBrand) return;
        setTogglingKey(key);
        try {
            const newTypes = serviceTypes.filter(t => t !== key);
            const updated = await brandsApi.update(currentBrand.id, { service_types: newTypes } as unknown as Parameters<typeof brandsApi.update>[1]);
            setServiceTypes(updated.service_types ?? newTypes);
            if (activeServiceKey === key) setActiveServiceKey(null);
            await refreshBrands();
        } finally {
            setTogglingKey(null);
        }
    };

    const handleConfirmEnableServiceType = async () => {
        if (!currentBrand || !confirmingServiceType) return;
        const key = confirmingServiceType.key;
        setConfirmingServiceType(null);
        setProvisioningType(key);
        try {
            const newTypes = [...serviceTypes, key];
            const updated = await brandsApi.update(currentBrand.id, { service_types: newTypes } as unknown as Parameters<typeof brandsApi.update>[1]);
            setServiceTypes(updated.service_types ?? newTypes);
            await Promise.all([refreshBrands(), eventTypesQuery.refetch()]);
        } finally {
            setProvisioningType(null);
        }
    };

    const handleServiceCardClick = (key: string) => {
        setActiveServiceKey(prev => prev === key ? null : key);
        setSelectedPackageId(null);
        setHoveredPackageId(null);
    };

    const handleConfirmDisable = async () => {
        if (!disablingKey) return;
        await handleDisableServiceType(disablingKey);
        setDisablingKey(null);
    };

    const handleCreateCustomService = async () => {
        if (!currentBrand || !customName.trim()) return;
        setCreatingCustom(true);
        try {
            // Custom package templates are created via brand provisioning; this UI
            // path only records the service type on the brand.
            const customKey = customName.trim().toUpperCase().replace(/\s+/g, "_");
            const newTypes = [...serviceTypes, customKey];
            await brandsApi.update(currentBrand.id, { service_types: newTypes } as unknown as Parameters<typeof brandsApi.update>[1]);
            setServiceTypes(newTypes);
            await Promise.all([refreshBrands(), eventTypesQuery.refetch(), packageLibraryQuery.refetch()]);
            setCustomServiceOpen(false);
            setCustomName("");
            setCustomIcon("🎉");
            setCustomColor("#6366f1");
            setCustomDescription("");
        } finally {
            setCreatingCustom(false);
        }
    };

    // ── Package handlers ──
    const handleRowClick = (pkg: ServicePackage) => {
        setSelectedPackageId(prev => prev === pkg.id ? null : pkg.id);
    };

    const handleRowHover = (pkg: ServicePackage | null) => {
        setHoveredPackageId(pkg?.id ?? null);
    };

    const handleDeletePackage = async () => {
        if (!deleteTarget) return;
        await deletePackageMutation.mutateAsync(deleteTarget.id);
        if (selectedPackageId === deleteTarget.id) setSelectedPackageId(null);
        setDeleteTarget(null);
    };

    const handlePackageUpdated = () => {
        packageLibraryQuery.refetch();
    };

    // ── Loading ──
    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", pt: 12 }}>
                <CircularProgress size={28} sx={{ color: "#648CFF" }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* ── Page header ─── */}
            <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 800, color: "#f1f5f9", fontSize: "1.625rem", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
                    Services
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.8125rem", mt: 0.5, ml: 0.25 }}>
                    Manage your services, packages, and event type templates in one place.
                </Typography>
            </Box>

            {/* ── Services empty state ─── */}
            {serviceTypes.length === 0 ? (
                <Box sx={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    py: 8, px: 3, borderRadius: 3,
                    border: "2px dashed rgba(52, 58, 68, 0.3)",
                    bgcolor: "rgba(16, 18, 22, 0.3)",
                }}>
                    <Typography sx={{ fontSize: "2.5rem", mb: 2 }}>📦</Typography>
                    <Typography sx={{ fontWeight: 700, color: "#f1f5f9", fontSize: "1.1rem", mb: 1 }}>
                        No services enabled yet
                    </Typography>
                    <Typography sx={{ color: "#64748b", fontSize: "0.85rem", mb: 3, textAlign: "center", maxWidth: 400 }}>
                        Enable a service type to start building packages.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setAddServicePickerOpen(true)}
                        disableElevation
                        sx={{ borderRadius: 2, fontWeight: 600, textTransform: "none" }}
                    >
                        Add Your First Service
                    </Button>
                </Box>
            ) : (
                <>
                    {/* ── Service cards grid ─── */}
                    <ServiceCardsGrid
                        cards={serviceCards}
                        selectedKey={activeServiceKey}
                        onCardClick={handleServiceCardClick}
                        onDisable={(key) => setDisablingKey(key)}
                        showAddCard
                        onAddService={() => setAddServicePickerOpen(true)}
                        currencyCode={currencyCode}
                    />

                    {/* ── 2-column layout: list (58%) + detail (42%) ─── */}
                    <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                        {/* Left — package list */}
                        <Box sx={{ flex: "0 0 58%", minWidth: 0 }}>
                            {/* ── Filter toolbar ─── */}
                            <Paper
                                elevation={0}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    p: 0.875,
                                    px: 1.25,
                                    mb: 2,
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: 2,
                                    bgcolor: "rgba(255,255,255,0.02)",
                                    flexWrap: "wrap",
                                }}
                    >
                        {/* Title */}
                        <Typography component="div" sx={{ fontWeight: 700, fontSize: "1rem", mr: "auto" }}>
                            Packages ({filteredPackages.length})
                        </Typography>

                        {/* Status filter */}
                        <FormControl size="small" sx={{ minWidth: 130 }}>
                            <Select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                                sx={{
                                    borderRadius: 1.5,
                                    fontSize: "0.75rem",
                                    height: 32,
                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                }}
                            >
                                <MenuItem value="all" sx={{ fontSize: "0.8125rem" }}>All Statuses</MenuItem>
                                <MenuItem value="active" sx={{ fontSize: "0.8125rem" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <CircleIcon sx={{ fontSize: 9, color: "#00C875" }} />
                                        Active
                                    </Box>
                                </MenuItem>
                                <MenuItem value="inactive" sx={{ fontSize: "0.8125rem" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <CircleIcon sx={{ fontSize: 9, color: "#C4C4C4" }} />
                                        Inactive
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>

                        {/* Search */}
                        <TextField
                            size="small"
                            placeholder="Search packages…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ fontSize: 15, color: "rgba(255,255,255,0.3)" }} />
                                    </InputAdornment>
                                ),
                                endAdornment: searchQuery ? (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchQuery("")} sx={{ p: 0.25 }}>
                                            <CloseIcon sx={{ fontSize: 14 }} />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            }}
                            sx={{
                                ml: "auto",
                                minWidth: 220,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 1.5,
                                    fontSize: "0.8125rem",
                                    height: 32,
                                    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                                },
                            }}
                        />

                        <Divider orientation="vertical" flexItem sx={{ mx: 0.375, borderColor: "rgba(255,255,255,0.07)" }} />

                        {/* New Package button */}
                        {(() => {
                            const activeCard = activeServiceKey ? serviceCards.find(c => c.key === activeServiceKey) : null;
                            const btnColor = activeCard?.color;
                            return (
                                <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    disableElevation
                                    onClick={() => {
                                        const category = activeServiceKey
                                            ? (SERVICE_TYPE_OPTIONS.find(o => o.key === activeServiceKey)?.label?.replace(/s$/, "") ??
                                               serviceCards.find(c => c.key === activeServiceKey)?.label?.replace(/s$/, "") ?? null)
                                            : null;
                                        setWizardEventTypeName(category);
                                        setIsWizardOpen(true);
                                    }}
                                    sx={{
                                        borderRadius: 1.5, fontWeight: 600, fontSize: "0.75rem", textTransform: "none",
                                        px: 1.5, height: 32, flexShrink: 0,
                                        ...(btnColor ? {
                                            bgcolor: btnColor,
                                            color: "#fff",
                                            "&:hover": { bgcolor: btnColor, filter: "brightness(1.15)" },
                                        } : {}),
                                    }}
                                >
                                    {activeCard ? `New ${activeCard.label.replace(/s$/, "")} Package` : "New Package"}
                                </Button>
                            );
                        })()}
                    </Paper>

                            <PackageListPanel
                                packages={filteredPackages}
                                selectedPackageId={selectedPackageId}
                                hoveredPackageId={hoveredPackageId}
                                onRowClick={handleRowClick}
                                onRowHover={handleRowHover}
                                onToggleActive={async (pkg: ServicePackage) => {
                                    await servicePackagesApi.update(pkg.id, { is_active: !pkg.is_active });
                                    packageLibraryQuery.refetch();
                                }}
                                currencyCode={currencyCode}
                                isLoading={isLoading}
                            />
                        </Box>

                        {/* Right — sticky detail panel */}
                        <Box sx={{ flex: "1 1 0", minWidth: 0, position: "sticky", top: 80 }}>
                            {detailPkg ? (
                                <PackageDetailPanel
                                    pkg={detailPkg}
                                    isSelected={selectedPackageId !== null}
                                    onClose={() => setSelectedPackageId(null)}
                                    currencyCode={currencyCode}
                                    onPackageUpdated={handlePackageUpdated}
                                    onDelete={() => setDeleteTarget(detailPkg)}
                                />
                            ) : null}
                        </Box>
                    </Box>
                </>
            )}

            {/* ── Package Creation Wizard ─── */}
            <PackageCreationWizard
                open={isWizardOpen}
                initialEventTypeName={wizardEventTypeName}
                onClose={() => {
                    setIsWizardOpen(false);
                    setWizardEventTypeName(null);
                }}
                onPackageCreated={async (packageId: number) => {
                    setIsWizardOpen(false);
                    setWizardEventTypeName(null);
                    router.push(`/packages/${packageId}?mode=edit&tab=blueprint`);
                }}
            />

            {/* ── Delete Confirmation Dialog ─── */}
            <Dialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Delete Package?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeletePackage}
                        disableElevation
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Add Service Picker Dialog ─── */}
            <Dialog
                open={addServicePickerOpen}
                onClose={() => setAddServicePickerOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Add a Service</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <Stack spacing={1.5}>
                        {disabledServiceTypes.map(opt => (
                            <Box key={opt.key} sx={{
                                display: "flex", alignItems: "center", gap: 2,
                                p: 2, borderRadius: 2,
                                border: "1px solid rgba(52,58,68,0.5)",
                                bgcolor: "rgba(16,18,22,0.3)",
                            }}>
                                <Typography sx={{ fontSize: "1.5rem", lineHeight: 1 }}>{opt.icon}</Typography>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#f1f5f9" }}>{opt.label}</Typography>
                                    <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>{opt.description}</Typography>
                                </Box>
                                <Button
                                    size="small" variant="outlined"
                                    disabled={provisioningType === opt.key}
                                    onClick={() => { setAddServicePickerOpen(false); setConfirmingServiceType(opt as typeof SERVICE_TYPE_OPTIONS[0]); }}
                                    startIcon={provisioningType === opt.key ? <CircularProgress size={12} /> : <AddIcon />}
                                    sx={{ borderRadius: 2, fontWeight: 600, flexShrink: 0 }}
                                >
                                    Enable
                                </Button>
                            </Box>
                        ))}
                        {disabledServiceTypes.length > 0 && <Divider sx={{ my: 1 }} />}
                        <Box
                            onClick={() => { setAddServicePickerOpen(false); setCustomServiceOpen(true); }}
                            sx={{
                                display: "flex", alignItems: "center", gap: 2,
                                p: 2, borderRadius: 2, cursor: "pointer",
                                border: "1px dashed rgba(52,58,68,0.5)",
                                bgcolor: "rgba(16,18,22,0.15)",
                                "&:hover": { borderColor: "primary.main", bgcolor: "rgba(99,102,241,0.05)" },
                            }}
                        >
                            <Box sx={{
                                width: 32, height: 32, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center",
                                bgcolor: "rgba(99,102,241,0.15)", color: "primary.main",
                            }}>
                                <AddIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#f1f5f9" }}>Create Custom Service</Typography>
                                <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>Define your own service type from scratch</Typography>
                            </Box>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setAddServicePickerOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* ── Enable Service Confirmation Dialog ─── */}
            <Dialog
                open={!!confirmingServiceType}
                onClose={() => setConfirmingServiceType(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Typography sx={{ fontSize: "1.8rem", lineHeight: 1 }}>{confirmingServiceType?.icon}</Typography>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700}>Enable {confirmingServiceType?.label}?</Typography>
                            <Typography variant="caption" color="text.secondary">
                                This will create templates, activities, and subjects for this service type.
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        The following will be automatically created for your brand:
                    </Typography>
                    <Stack spacing={1}>
                        {[
                            { icon: "📅", label: "Event days (e.g. Ceremony Day, Getting Ready)" },
                            { icon: "🎬", label: "Activities with key moment markers" },
                            { icon: "👥", label: "Subject types with standard roles" },
                            { icon: "📦", label: "Package category and default package set" },
                        ].map((item) => (
                            <Box key={item.label} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                <Typography sx={{ fontSize: "1rem", mt: 0.1 }}>{item.icon}</Typography>
                                <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                            </Box>
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setConfirmingServiceType(null)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmEnableServiceType}
                        disableElevation
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                    >
                        Enable
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Disable Service Confirmation Dialog ─── */}
            <Dialog
                open={!!disablingKey}
                onClose={() => setDisablingKey(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Disable Service?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        This will remove the service type from your brand. Your existing packages and event type data will be preserved, but the card won't appear on this page.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDisablingKey(null)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmDisable}
                        disableElevation
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                    >
                        Disable
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Create Custom Service Dialog ─── */}
            <Dialog
                open={customServiceOpen}
                onClose={() => setCustomServiceOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Create Custom Service</DialogTitle>
                <DialogContent sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Define a new service type. You can add event days, subjects, and packages later.
                    </Typography>
                    <TextField
                        label="Service Name"
                        placeholder="e.g. Corporate Event"
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        fullWidth
                        size="small"
                        autoFocus
                    />
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: "block" }}>Icon</Typography>
                        <Box sx={{
                            display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 0.5,
                            p: 1, borderRadius: 1.5, border: "1px solid rgba(52,58,68,0.5)",
                            bgcolor: "rgba(16,18,22,0.3)", maxHeight: 160, overflowY: "auto",
                        }}>
                            {SERVICE_ICON_OPTIONS.map(icon => (
                                <Box
                                    key={icon}
                                    onClick={() => setCustomIcon(icon)}
                                    sx={{
                                        width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                                        borderRadius: 1, cursor: "pointer", fontSize: "1.25rem",
                                        border: customIcon === icon ? "2px solid" : "2px solid transparent",
                                        borderColor: customIcon === icon ? "primary.main" : "transparent",
                                        bgcolor: customIcon === icon ? "rgba(99,102,241,0.15)" : "transparent",
                                        "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                                    }}
                                >
                                    {icon}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">Color</Typography>
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <Box
                                    component="input"
                                    type="color"
                                    value={customColor}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomColor(e.target.value)}
                                    sx={{
                                        width: 36, height: 36, p: 0, border: "none", borderRadius: 1,
                                        cursor: "pointer", bgcolor: "transparent",
                                    }}
                                />
                                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                                    {customColor}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{
                            ml: "auto", width: 48, height: 48, borderRadius: 2, display: "flex",
                            alignItems: "center", justifyContent: "center", fontSize: "1.5rem",
                            background: `linear-gradient(135deg, ${customColor}, ${customColor}88)`,
                        }}>
                            {customIcon}
                        </Box>
                    </Box>
                    <TextField
                        label="Description"
                        placeholder="Brief description of this service type"
                        value={customDescription}
                        onChange={e => setCustomDescription(e.target.value)}
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setCustomServiceOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateCustomService}
                        disabled={!customName.trim() || creatingCustom}
                        disableElevation
                        startIcon={creatingCustom ? <CircularProgress size={14} /> : undefined}
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
