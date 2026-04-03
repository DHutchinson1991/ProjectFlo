'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, CardContent, Alert, Button } from '@mui/material';
import {
    Videocam,
    WarningAmber,
    CheckCircle,
    Build,
    SwapHoriz,
} from '@mui/icons-material';
import { packageSetsApi, servicePackagesApi } from '@/features/catalog/packages/api';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { scheduleApi } from '@/features/workflow/scheduling/instance';
import { useBrand } from '@/features/platform/brand';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { computeTaxBreakdown } from '@/shared/utils/pricing';
import { getPackageStats, getCategoryColor, getTierColor } from '@/features/catalog/packages/components/listing/listing-helpers';
import PackageSelector from './PackageSelector';
import PackageDetails from './PackageDetails';
import type { PackageScopeCardProps, PackageSetInfo, InquiryFilmRecord } from './types';

const PackageScopeCard: React.FC<PackageScopeCardProps> = ({
    inquiry,
    onRefresh,
    isActive,
    activeColor,
    submission,
    WorkflowCard,
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        return () => { cancelled = true; };
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
        ? packageSetInfoMap.get(Number(inquiry.selected_package_id)) ?? null
        : null;
    const noPackageSelected = !inquiry.selected_package_id;
    const stats = selectedPkg ? getPackageStats(selectedPkg) : null;

    // Pricing
    const est = inquiry.estimates?.find(e => e.is_primary) ?? inquiry.estimates?.[0];
    const subtotal = Number(est?.total_amount ?? 0);
    const brandTaxRate = Number(currentBrand?.default_tax_rate ?? 0);
    const pricing = subtotal > 0 ? computeTaxBreakdown(subtotal, brandTaxRate) : null;
    const displayCost = pricing?.total ?? 0;
    const displayTax = pricing && brandTaxRate > 0 ? { rate: pricing.taxRate, amount: pricing.taxAmount, totalWithTax: pricing.total } : null;

    const catColor = selectedPkg ? getCategoryColor(selectedPkg.category) : '#64748b';
    const tierColor = selectedSetInfo ? getTierColor(selectedSetInfo.tierLabel) : '#648CFF';
    const packageFilmItems = selectedPkg
        ? ((selectedPkg.contents?.items || []).filter((i: { type: string }) => i.type === 'film'))
        : [];

    // Stale estimate indicator
    const livePackageCost = selectedPkg ? Number(selectedPkg._totalCost ?? 0) : 0;
    const livePricingWithTax = livePackageCost > 0 ? computeTaxBreakdown(livePackageCost, brandTaxRate).total : 0;
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

    const getEffectivePrice = (pkg: { _totalCost?: number | string | null }) => Number(pkg._totalCost ?? 0);

    // Active packages grouped by set (for selector dropdown)
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

    // Budget-aware suggestion
    const suggestedPackage = useMemo(() => {
        if (!budgetRange || !availablePackages.length) return null;
        const matches = budgetRange.match(/[\d,]+/g);
        if (!matches || matches.length < 2) return null;
        const min = parseInt(matches[0].replace(/,/g, ''));
        const max = parseInt(matches[1].replace(/,/g, ''));
        if (isNaN(min) || isNaN(max)) return null;
        const inRange = availablePackages
            .filter((p) => activePackageIds.has(p.id))
            .filter((p) => { const price = getEffectivePrice(p); return price >= min && price <= max; })
            .sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
        return inRange[0] ?? null;
    }, [budgetRange, availablePackages, activePackageIds]);

    // Assign / Swap handler
    const handleAssignPackage = async () => {
        if (!assignPackageId || assigning) return;
        try {
            setAssigning(true);
            await inquiriesApi.update(inquiry.id, { selected_package_id: Number(assignPackageId) });
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
                {/* Header */}
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

                {/* Status strip: picked / budget / swap */}
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
                                    border: showSwapSelector ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
                                    '&:hover': { color: '#f59e0b', bgcolor: 'rgba(245,158,11,0.06)' },
                                }}
                            >
                                Swap
                            </Button>
                        )}
                    </Box>
                )}

                {/* Swap selector panel */}
                {showSwapSelector && selectedPkg && (
                    <PackageSelector
                        availablePackages={availablePackages}
                        groupedBySet={groupedBySet}
                        packageSetInfoMap={packageSetInfoMap}
                        assignPackageId={assignPackageId}
                        setAssignPackageId={setAssignPackageId}
                        assigning={assigning}
                        onAssign={handleAssignPackage}
                        currencyCode={currencyCode}
                        getEffectivePrice={getEffectivePrice}
                        excludePackageId={inquiry.selected_package_id}
                        variant="swap"
                        onCancel={() => { setShowSwapSelector(false); setAssignPackageId(''); }}
                    />
                )}

                {/* Builder summary (custom build path) */}
                {packagePath === 'build' && (builderActivities?.length || builderFilms?.length || naCrewCount) && (
                    <Box sx={{
                        px: 2.5, py: 1, display: 'flex', gap: 1.5, flexWrap: 'wrap',
                        borderBottom: '1px solid rgba(52, 58, 68, 0.2)',
                    }}>
                        {builderActivities && builderActivities.length > 0 && (
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{builderActivities.length} activities</Typography>
                        )}
                        {builderFilms && builderFilms.length > 0 && (
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{builderFilms.length} films</Typography>
                        )}
                        {naCrewCount && (
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{naCrewCount} crew slots</Typography>
                        )}
                        {naCameraCount && (
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{naCameraCount} cameras</Typography>
                        )}
                    </Box>
                )}

                {/* No-package: inline assignment selector */}
                {noPackageSelected && (
                    <Box>
                        <Box sx={{ px: 2.5, pt: 2 }}>
                            <Alert severity="warning" icon={<WarningAmber />} sx={{ borderRadius: 1, mb: 2 }}>
                                No package selected
                            </Alert>
                        </Box>
                        <PackageSelector
                            availablePackages={availablePackages}
                            groupedBySet={groupedBySet}
                            packageSetInfoMap={packageSetInfoMap}
                            assignPackageId={assignPackageId}
                            setAssignPackageId={setAssignPackageId}
                            assigning={assigning}
                            onAssign={handleAssignPackage}
                            currencyCode={currencyCode}
                            getEffectivePrice={getEffectivePrice}
                            suggestedPackage={suggestedPackage}
                            budgetRange={budgetRange}
                            variant="assign"
                        />
                    </Box>
                )}

                {/* Package info */}
                {selectedPkg && stats && (
                    <PackageDetails
                        selectedPkg={selectedPkg}
                        stats={stats}
                        selectedSetInfo={selectedSetInfo}
                        displayCost={displayCost}
                        displayTax={displayTax}
                        estimateBelowLive={estimateBelowLive}
                        estimateDiffPct={estimateDiffPct}
                        displayFilms={displayFilms}
                        currencyCode={currencyCode}
                        catColor={catColor}
                        tierColor={tierColor}
                    />
                )}
            </CardContent>
        </WorkflowCard>
    );
};

export default PackageScopeCard;
