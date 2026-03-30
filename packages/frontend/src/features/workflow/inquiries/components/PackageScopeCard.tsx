'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    CardContent,
    Chip,
    Alert,
    Stack,
    Checkbox,
    FormControlLabel,
    CircularProgress,
    FormControl,
    Select,
    MenuItem,
    ListSubheader,
    Button,
} from '@mui/material';
import {
    Videocam,
    WarningAmber,
    CheckCircle,
    ErrorOutline,
    Build,
    SwapHoriz,
} from '@mui/icons-material';
import MovieIcon from '@mui/icons-material/Movie';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MicIcon from '@mui/icons-material/Mic';
import EventIcon from '@mui/icons-material/Event';
import PlaceIcon from '@mui/icons-material/Place';
import PeopleIcon from '@mui/icons-material/People';
import { Inquiry, NeedsAssessmentSubmission } from '@/features/workflow/inquiries/types';
import { packageSetsApi, servicePackagesApi } from '@/features/catalog/packages/api';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { scheduleApi } from '@/features/workflow/scheduling/instance';
import { useBrand } from '@/features/platform/brand';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { computeTaxBreakdown } from '@/shared/utils/pricing';
import { getPackageStats, getCategoryColor, getTierColor } from '@/features/catalog/packages/components/listing/listing-helpers';
import { formatCurrency } from '@/features/workflow/proposals/utils/portal/formatting';

/** Metadata about which set/tier a package belongs to */
interface PackageSetInfo {
    setName: string;
    setEmoji: string;
    tierLabel: string;
}

interface InquiryFilmRecord {
    id: number;
    film_id?: number;
    film?: {
        id: number;
        name?: string | null;
    } | null;
}

interface PackageScopeCardProps {
    inquiry: Inquiry & { activity_logs?: unknown[] };
    onRefresh?: () => Promise<void>;
    isActive?: boolean;
    activeColor?: string;
    submission?: NeedsAssessmentSubmission | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WorkflowCard: React.ComponentType<any>;
    onPackageDetailsClick?: () => void;
}

const PackageScopeCard: React.FC<PackageScopeCardProps> = ({
    inquiry,
    onRefresh,
    isActive,
    activeColor,
    submission,
    WorkflowCard,
    onPackageDetailsClick,
}) => {
    const { currentBrand } = useBrand();
    const currencyCode = currentBrand?.currency ?? DEFAULT_CURRENCY;

    // NA response data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responses = (submission?.responses ?? {}) as Record<string, any>;
    const packagePath = responses.package_path as string | undefined;
    const budgetRange = responses.budget_range as string | undefined;
    const builderActivities = responses.builder_activities as number[] | undefined;
    const builderFilms = responses.builder_films as { type: string; activityName?: string }[] | undefined;
    const naCrewCount = responses.operator_count as number | undefined;
    const naCameraCount = responses.camera_count as number | undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [availablePackages, setAvailablePackages] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [packageSets, setPackageSets] = useState<any[]>([]);
    const [liveFilms, setLiveFilms] = useState<InquiryFilmRecord[]>([]);
    const [hasLoadedLiveFilms, setHasLoadedLiveFilms] = useState(false);

    // Inline package assignment / swap
    const [assignPackageId, setAssignPackageId] = useState<number | ''>('');
    const [assigning, setAssigning] = useState(false);
    const [showSwapSelector, setShowSwapSelector] = useState(false);
    // Fetch both service packages and package sets
    useEffect(() => {
        if (inquiry.brand_id) {
            servicePackagesApi.getAll().then(setAvailablePackages).catch(console.error);
            packageSetsApi.getAll().then(setPackageSets).catch(console.error);
        }
    }, [inquiry.brand_id]);

    useEffect(() => {
        let cancelled = false;

        scheduleApi.inquiryFilms.getAll(inquiry.id)
            .then((films) => {
                if (cancelled) return;
                setLiveFilms(films || []);
                setHasLoadedLiveFilms(true);
            })
            .catch((err: any) => {
                if (cancelled) return;
                const isNotFound = err?.status === 404 || err?.message?.includes?.('404');
                if (isNotFound) {
                    setLiveFilms([]);
                    setHasLoadedLiveFilms(false);
                    return;
                }

                console.warn('Failed to load inquiry films for package scope card:', err);
                setLiveFilms([]);
                setHasLoadedLiveFilms(false);
            });

        return () => {
            cancelled = true;
        };
    }, [inquiry.id]);

    // Build a map of packageId → set/tier info
    const packageSetInfoMap = useMemo(() => {
        const infoMap = new Map<number, PackageSetInfo>();

        for (const set of packageSets) {
            for (const slot of (set.slots ?? [])) {
                if (slot.service_package_id != null) {
                    infoMap.set(slot.service_package_id, {
                        setName: set.name,
                        setEmoji: set.emoji ?? '📦',
                        tierLabel: slot.slot_label ?? '',
                    });
                }
            }
        }
        return infoMap;
    }, [packageSets]);

    const selectedPkg = availablePackages.find((p) => p.id === Number(inquiry.selected_package_id));
    const selectedSetInfo = inquiry.selected_package_id
        ? packageSetInfoMap.get(Number(inquiry.selected_package_id))
        : null;

    const noPackageSelected = !inquiry.selected_package_id;

    // Package stats (matches the FilledSlot card layout)
    const stats = selectedPkg ? getPackageStats(selectedPkg) : null;

    // Pricing — computeTaxBreakdown from @/shared/utils/pricing
    const est = inquiry.estimates?.find(e => e.is_primary) ?? inquiry.estimates?.[0];
    const subtotal = Number(est?.total_amount ?? 0);
    const brandTaxRate = Number(currentBrand?.default_tax_rate ?? 0);
    const pricing = subtotal > 0 ? computeTaxBreakdown(subtotal, brandTaxRate) : null;
    const displayCost = pricing?.total ?? 0;
    const displaySubtotal: number | null = subtotal > 0 ? subtotal : null;
    const displayTax = pricing && brandTaxRate > 0 ? { rate: pricing.taxRate, amount: pricing.taxAmount, totalWithTax: pricing.total } : null;

    const catColor = selectedPkg ? getCategoryColor(selectedPkg.category) : '#64748b';
    const tierColor = selectedSetInfo ? getTierColor(selectedSetInfo.tierLabel) : '#648CFF';
    const packageFilmItems = selectedPkg
        ? ((selectedPkg.contents?.items || []).filter((i: { type: string }) => i.type === 'film'))
        : [];

    // ── Stale estimate indicator: compare estimate total vs live package cost ──
    const livePackageCost = selectedPkg ? Number(selectedPkg._totalCost ?? 0) : 0;
    const livePricingWithTax = livePackageCost > 0
        ? computeTaxBreakdown(livePackageCost, brandTaxRate).total
        : 0;
    const estimateBelowLive = displayCost > 0 && livePricingWithTax > 0 && displayCost < livePricingWithTax;
    const estimateDiffPct = estimateBelowLive
        ? Math.round(((livePricingWithTax - displayCost) / livePricingWithTax) * 100)
        : 0;
    const displayFilms = hasLoadedLiveFilms
        ? liveFilms.map((filmRecord) => ({
            id: filmRecord.id,
            description: filmRecord.film?.name || `Film #${filmRecord.film_id}`,
        }))
        : packageFilmItems;

    // ── Picker price helper: use live computed cost ──
    const getEffectivePrice = (pkg: { _totalCost?: number | string | null }) => Number(pkg._totalCost ?? 0);

    // ── Active packages grouped by set (for selector dropdown) ──
    const { activePackageIds, groupedBySet } = useMemo(() => {
        const ids = new Set<number>();
        for (const set of packageSets) {
            for (const slot of (set.slots ?? [])) {
                if (slot.service_package_id != null) ids.add(slot.service_package_id);
            }
        }
        const active = availablePackages.filter((pkg) => ids.has(pkg.id));
        const groupMap = new Map<string, typeof active>();
        for (const pkg of active) {
            const info = packageSetInfoMap.get(pkg.id);
            const key = info ? `${info.setEmoji} ${info.setName}` : '📦 Other';
            if (!groupMap.has(key)) groupMap.set(key, []);
            groupMap.get(key)!.push(pkg);
        }
        const groups: { setName: string; setEmoji: string; packages: typeof active }[] = [];
        for (const [label, pkgs] of groupMap) {
            const emoji = label.split(' ')[0];
            const name = label.slice(emoji.length + 1);
            groups.push({ setName: name, setEmoji: emoji, packages: pkgs });
        }
        return { activePackageIds: ids, groupedBySet: groups };
    }, [availablePackages, packageSets, packageSetInfoMap]);

    // ── Budget-aware suggestion ──
    const suggestedPackage = useMemo(() => {
        if (!budgetRange || !availablePackages.length) return null;
        const matches = budgetRange.match(/[\d,]+/g);
        if (!matches || matches.length < 2) return null;
        const min = parseInt(matches[0].replace(/,/g, ''));
        const max = parseInt(matches[1].replace(/,/g, ''));
        if (isNaN(min) || isNaN(max)) return null;
        const inRange = availablePackages
            .filter((p) => activePackageIds.has(p.id))
            .filter((p) => {
                const price = getEffectivePrice(p);
                return price >= min && price <= max;
            })
            .sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
        return inRange[0] ?? null;
    }, [budgetRange, availablePackages, activePackageIds]);

    // ── Assign / Swap handler ──
    const handleAssignPackage = async () => {
        if (!assignPackageId || assigning) return;
        try {
            setAssigning(true);
            await inquiriesApi.update(inquiry.id, {
                selected_package_id: Number(assignPackageId),
            });
            setAssignPackageId('');
            setShowSwapSelector(false);
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Failed to assign package:', err);
        } finally {
            setAssigning(false);
        }
    };

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent sx={{ p: '0 !important' }}>
                {/* Header — matches Availability card style */}
                <Box sx={{
                    px: 2.5, pt: 2, pb: 1.5,
                    display: 'flex', alignItems: 'center', gap: 1.25,
                    borderBottom: '1px solid rgba(52,58,68,0.3)',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), transparent)',
                }}>
                    <Videocam sx={{ color: '#f59e0b', fontSize: 20 }} />
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                        Package
                    </Typography>
                </Box>

                {/* ── Status strip: picked / budget / swap ── */}
                {(budgetRange || packagePath || selectedPkg) && (
                    <Box sx={{
                        px: 2.5, py: 0.8,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(52, 58, 68, 0.2)',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {packagePath && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {packagePath === 'build'
                                        ? <Build sx={{ fontSize: 13, color: '#f59e0b' }} />
                                        : <CheckCircle sx={{ fontSize: 13, color: '#10b981' }} />}
                                    <Typography sx={{
                                        fontSize: '0.72rem', fontWeight: 600,
                                        color: packagePath === 'build' ? '#f59e0b' : '#10b981',
                                    }}>
                                        {packagePath === 'build' ? 'Custom Build' : 'Picked'}
                                    </Typography>
                                </Box>
                            )}
                            {budgetRange && (
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>
                                    Budget: {budgetRange}
                                </Typography>
                            )}
                        </Box>
                        {selectedPkg && (
                            <Button
                                size="small"
                                startIcon={<SwapHoriz sx={{ fontSize: 13 }} />}
                                onClick={() => { setShowSwapSelector(!showSwapSelector); setAssignPackageId(''); }}
                                sx={{
                                    color: showSwapSelector ? '#f59e0b' : '#526077',
                                    textTransform: 'none', fontSize: '0.68rem',
                                    fontWeight: 600, px: 1, py: 0.25, borderRadius: 1,
                                    minWidth: 'auto',
                                    bgcolor: showSwapSelector ? 'rgba(245,158,11,0.08)' : 'transparent',
                                    border: showSwapSelector
                                        ? '1px solid rgba(245,158,11,0.2)'
                                        : '1px solid transparent',
                                    '&:hover': {
                                        color: '#f59e0b',
                                        bgcolor: 'rgba(245,158,11,0.06)',
                                    },
                                }}
                            >
                                Swap
                            </Button>
                        )}
                    </Box>
                )}

                {/* Swap selector panel (expands below status bar) */}
                {showSwapSelector && selectedPkg && (
                    <Box sx={{
                        px: 2, py: 1.5,
                        bgcolor: 'rgba(245,158,11,0.03)',
                        borderBottom: '1px solid rgba(245,158,11,0.12)',
                    }}>
                        <Typography sx={{ fontSize: '0.6rem', color: '#64748b', mb: 1, lineHeight: 1.4 }}>
                            Subject names, locations, and crew assignments will be preserved where roles match.
                        </Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                value={assignPackageId}
                                displayEmpty
                                onChange={(e) => setAssignPackageId(e.target.value as number | '')}
                                renderValue={(val) => {
                                    if (!val) return <Typography sx={{ color: '#475569', fontSize: '0.75rem' }}>Select new package…</Typography>;
                                    const pkg = availablePackages.find(p => p.id === Number(val));
                                    return <Typography sx={{ fontSize: '0.75rem', color: '#e2e8f0' }}>{pkg?.name ?? 'Unknown'}</Typography>;
                                }}
                                sx={{
                                    color: '#e2e8f0',
                                    bgcolor: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 1.5,
                                    '& .MuiSelect-icon': { color: '#64748b' },
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, maxHeight: 300 },
                                    },
                                }}
                            >
                                {groupedBySet.flatMap((group) => [
                                    <ListSubheader
                                        key={`swap-${group.setName}`}
                                        sx={{ bgcolor: '#1a1d24', color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem', lineHeight: '24px', textTransform: 'uppercase' }}
                                    >
                                        {group.setEmoji} {group.setName}
                                    </ListSubheader>,
                                    ...group.packages
                                        .filter((pkg) => pkg.id !== inquiry.selected_package_id)
                                        .map((pkg) => {
                                            const info = packageSetInfoMap.get(pkg.id);
                                            return (
                                                <MenuItem key={pkg.id} value={pkg.id}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                        <Typography variant="body2">{pkg.name}</Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            {info?.tierLabel && (
                                                                <Chip label={info.tierLabel} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem', borderRadius: 0.5 }} />
                                                            )}
                                                            <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                                                                {formatCurrency(getEffectivePrice(pkg), currencyCode)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </MenuItem>
                                            );
                                        }),
                                ])}
                            </Select>
                        </FormControl>
                        {assignPackageId && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Button
                                    size="small"
                                    onClick={() => { setShowSwapSelector(false); setAssignPackageId(''); }}
                                    sx={{ color: '#64748b', textTransform: 'none', fontSize: '0.7rem', flex: 1, borderRadius: 1 }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={handleAssignPackage}
                                    disabled={assigning}
                                    startIcon={assigning ? <CircularProgress size={12} color="inherit" /> : <SwapHoriz sx={{ fontSize: 14 }} />}
                                    sx={{
                                        bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' },
                                        textTransform: 'none', fontSize: '0.7rem', fontWeight: 600, flex: 1, borderRadius: 1,
                                    }}
                                >
                                    Confirm Swap
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Builder summary (custom build path) */}
                {packagePath === 'build' && (builderActivities?.length || builderFilms?.length || naCrewCount) && (
                    <Box sx={{
                        px: 2.5, py: 1, display: 'flex', gap: 1.5, flexWrap: 'wrap',
                        borderBottom: '1px solid rgba(52, 58, 68, 0.2)',
                    }}>
                        {builderActivities && builderActivities.length > 0 && (
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                {builderActivities.length} activities
                            </Typography>
                        )}
                        {builderFilms && builderFilms.length > 0 && (
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                {builderFilms.length} films
                            </Typography>
                        )}
                        {naCrewCount && (
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                {naCrewCount} crew slots
                            </Typography>
                        )}
                        {naCameraCount && (
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                {naCameraCount} cameras
                            </Typography>
                        )}
                    </Box>
                )}

                {/* No-package: inline assignment selector */}
                {noPackageSelected && (
                    <Box sx={{ px: 2.5, py: 2 }}>
                        <Alert
                            severity="warning"
                            icon={<WarningAmber />}
                            sx={{ borderRadius: 1, mb: 2 }}
                        >
                            No package selected
                        </Alert>

                        {/* Package selector dropdown */}
                        <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                            <Select
                                value={assignPackageId}
                                displayEmpty
                                onChange={(e) => setAssignPackageId(e.target.value as number | '')}
                                renderValue={(val) => {
                                    if (!val) return <Typography sx={{ color: '#475569', fontSize: '0.8rem' }}>Select a package…</Typography>;
                                    const pkg = availablePackages.find(p => p.id === Number(val));
                                    return <Typography sx={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{pkg?.name ?? 'Unknown'}</Typography>;
                                }}
                                sx={{
                                    color: '#e2e8f0',
                                    bgcolor: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 1.5,
                                    '& .MuiSelect-icon': { color: '#64748b' },
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, maxHeight: 300 },
                                    },
                                }}
                            >
                                {groupedBySet.length > 0 ? (
                                    groupedBySet.flatMap((group) => [
                                        <ListSubheader
                                            key={`header-${group.setName}`}
                                            sx={{ bgcolor: '#1a1d24', color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem', lineHeight: '24px', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                                        >
                                            {group.setEmoji} {group.setName}
                                        </ListSubheader>,
                                        ...group.packages.map((pkg) => {
                                            const info = packageSetInfoMap.get(pkg.id);
                                            return (
                                                <MenuItem key={pkg.id} value={pkg.id}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                        <Typography variant="body2">{pkg.name}</Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            {info?.tierLabel && (
                                                                <Chip label={info.tierLabel} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem', borderRadius: 0.5 }} />
                                                            )}
                                                            <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace', ml: 0.5 }}>
                                                                {formatCurrency(getEffectivePrice(pkg), currencyCode)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </MenuItem>
                                            );
                                        }),
                                    ])
                                ) : (
                                    <MenuItem disabled>
                                        <Typography variant="body2" color="text.secondary">No active packages</Typography>
                                    </MenuItem>
                                )}
                            </Select>
                        </FormControl>

                        {/* Budget-based suggestion */}
                        {suggestedPackage && !assignPackageId && (
                            <Box
                                onClick={() => setAssignPackageId(suggestedPackage.id)}
                                sx={{
                                    px: 1.5, py: 1, mb: 1.5, borderRadius: 1.5, cursor: 'pointer',
                                    bgcolor: 'rgba(100,140,255,0.06)', border: '1px solid rgba(100,140,255,0.15)',
                                    '&:hover': { bgcolor: 'rgba(100,140,255,0.1)' },
                                    display: 'flex', alignItems: 'center', gap: 1,
                                }}
                            >
                                <Typography sx={{ fontSize: '0.68rem', color: '#818cf8' }}>💡</Typography>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontSize: '0.68rem', color: '#818cf8', fontWeight: 600 }}>
                                        Suggested: {suggestedPackage.name}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#64748b' }}>
                                        {formatCurrency(getEffectivePrice(suggestedPackage), currencyCode)} — fits {budgetRange} budget
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Assign button */}
                        {assignPackageId && (
                            <Button
                                variant="contained"
                                size="small"
                                fullWidth
                                onClick={handleAssignPackage}
                                disabled={assigning}
                                startIcon={assigning ? <CircularProgress size={14} color="inherit" /> : undefined}
                                sx={{
                                    bgcolor: '#648CFF', '&:hover': { bgcolor: '#5A7BF0' },
                                    borderRadius: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
                                }}
                            >
                                Assign Package
                            </Button>
                        )}
                    </Box>
                )}

                {/* Package info — matching FilledSlot layout */}
                {selectedPkg && stats && (
                    <Box>
                        {/* Tier label bar */}
                        {selectedSetInfo && (
                            <Box sx={{
                                px: 2.5, py: 0.6,
                                bgcolor: `${tierColor}0F`,
                                borderTop: '1px solid rgba(52, 58, 68, 0.2)',
                                borderBottom: '1px solid rgba(52, 58, 68, 0.2)',
                            }}>
                                <Typography sx={{
                                    fontSize: '0.6rem', fontWeight: 700, color: tierColor,
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}>
                                    {selectedSetInfo.tierLabel}
                                </Typography>
                            </Box>
                        )}

                        {/* Tier color accent */}
                        {selectedSetInfo && (
                            <Box sx={{ height: 3, background: `linear-gradient(90deg, ${tierColor}, ${tierColor}80)` }} />
                        )}

                        {/* Category chip + price */}
                        <Box sx={{ px: 2.5, pt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Chip
                                label={selectedPkg.category || 'General'}
                                size="small"
                                sx={{
                                    height: 22, fontSize: '0.6rem', fontWeight: 700,
                                    bgcolor: `${catColor}15`, color: catColor,
                                    border: `1px solid ${catColor}30`,
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}
                            />
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography sx={{
                                    fontWeight: 800, color: '#f59e0b', fontSize: '1.1rem', fontFamily: 'monospace',
                                }}>
                                    {formatCurrency(displayCost, currencyCode)}
                                </Typography>
                                {displayTax && displayTax.rate > 0 && (
                                    <Typography sx={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 500, mt: -0.25 }}>
                                        incl. {displayTax.rate}% tax
                                    </Typography>
                                )}
                                {estimateBelowLive && estimateDiffPct > 0 && (
                                    <Typography sx={{
                                        fontSize: '0.6rem', color: '#f59e0b', fontWeight: 600, mt: 0.25,
                                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.4,
                                    }}>
                                        <ErrorOutline sx={{ fontSize: 12 }} />
                                        {estimateDiffPct}% below current package cost
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {/* Name + Description */}
                        <Box sx={{ px: 2.5, pt: 1.5, pb: 2 }}>
                            <Typography sx={{
                                fontWeight: 800, color: '#f1f5f9', fontSize: '1.05rem', lineHeight: 1.3, mb: 0.5,
                            }}>
                                {selectedPkg.name}
                            </Typography>
                            {selectedPkg.description && (
                                <Typography sx={{
                                    color: '#64748b', fontSize: '0.72rem', lineHeight: 1.5,
                                    display: '-webkit-box', WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                }}>
                                    {selectedPkg.description}
                                </Typography>
                            )}
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

                        {/* Films list */}
                        <Box sx={{ px: 2.5, py: 2 }}>
                            <Typography sx={{
                                fontSize: '0.6rem', fontWeight: 700, color: '#475569',
                                textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.25,
                            }}>
                                Films
                            </Typography>
                            {displayFilms.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                    {displayFilms.map((item: { id?: number; description?: string }, idx: number) => (
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


                    </Box>
                )}

            </CardContent>
        </WorkflowCard>
    );
};

export default PackageScopeCard;
