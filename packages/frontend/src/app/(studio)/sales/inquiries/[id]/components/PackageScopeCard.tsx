'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    CardContent,
    Chip,
    Alert,
    Button,
} from '@mui/material';
import {
    Videocam,
    WarningAmber,
    OpenInNew,
} from '@mui/icons-material';
import MovieIcon from '@mui/icons-material/Movie';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MicIcon from '@mui/icons-material/Mic';
import EventIcon from '@mui/icons-material/Event';
import PlaceIcon from '@mui/icons-material/Place';
import PeopleIcon from '@mui/icons-material/People';
import { useRouter } from 'next/navigation';
import { Inquiry, NeedsAssessmentSubmission } from '@/lib/types';
import { api } from '@/lib/api';
import { useBrand } from '@/app/providers/BrandProvider';
import { getPackageStats, getCategoryColor, getTierColor } from '@/app/(studio)/designer/packages/_listing/_lib/helpers';
import { computeCrewCost, computeEquipmentCost } from '@/app/(studio)/designer/packages/[id]/_lib/selectors';
import { formatCurrency } from '@/lib/utils/formatUtils';

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
}

const PackageScopeCard: React.FC<PackageScopeCardProps> = ({
    inquiry,
    isActive,
    activeColor,
    submission,
    WorkflowCard,
}) => {
    const router = useRouter();
    const { currentBrand } = useBrand();
    const currencyCode = currentBrand?.currency || 'GBP';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [availablePackages, setAvailablePackages] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [packageSets, setPackageSets] = useState<any[]>([]);
    const [liveFilms, setLiveFilms] = useState<InquiryFilmRecord[]>([]);
    const [hasLoadedLiveFilms, setHasLoadedLiveFilms] = useState(false);
    // Instance-accurate cost data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [instanceOperators, setInstanceOperators] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [instanceEquipment, setInstanceEquipment] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [instanceTaskPreview, setInstanceTaskPreview] = useState<any>(null);
    const [instanceCostLoaded, setInstanceCostLoaded] = useState(false);

    // Fetch both service packages and package sets
    useEffect(() => {
        if (inquiry.brand_id) {
            api.servicePackages.getAll(inquiry.brand_id).then(setAvailablePackages).catch(console.error);
            api.packageSets.getAll(inquiry.brand_id).then(setPackageSets).catch(console.error);
        }
    }, [inquiry.brand_id]);

    useEffect(() => {
        let cancelled = false;

        api.schedule.inquiryFilms.getAll(inquiry.id)
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

    // Fetch instance operators + equipment + task preview to compute accurate cost
    useEffect(() => {
        if (!inquiry.selected_package_id || !currentBrand?.id) return;
        let cancelled = false;

        Promise.all([
            api.schedule.instanceOperators.getForInquiry(inquiry.id),
            api.equipment.getGroupedByCategory(),
            api.taskLibrary.previewAutoGeneration(inquiry.selected_package_id, currentBrand.id, inquiry.id),
        ]).then(([ops, grouped, preview]) => {
            if (cancelled) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const flat: any[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Object.values(grouped as Record<string, any>).forEach((group: any) => {
                if (group && Array.isArray(group.equipment)) flat.push(...group.equipment);
            });

            console.log('[PackageScopeCard] RAW ops from getForInquiry:', JSON.stringify(ops, null, 2));
            console.log('[PackageScopeCard] ops count:', (ops || []).length);
            if (ops && ops.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ops.forEach((op: any, i: number) => {
                    console.log(`[PackageScopeCard] op[${i}]:`, {
                        id: op.id,
                        contributor_id: op.contributor_id,
                        job_role_id: op.job_role_id,
                        hours: op.hours,
                        hourly_rate: op.hourly_rate,
                        day_rate: op.day_rate,
                        rate_type: op.rate_type,
                        rate_bracket: op.rate_bracket,
                        equipment: op.equipment,
                    });
                });
            }
            console.log('[PackageScopeCard] flat equipment count:', flat.length);
            console.log('[PackageScopeCard] taskPreview tasks count:', (preview?.tasks ?? []).length);

            setInstanceOperators(ops || []);
            setInstanceEquipment(flat);
            setInstanceTaskPreview(preview ?? null);
            setInstanceCostLoaded(true);
        }).catch(err => {
            console.warn('Failed to load instance cost data for PackageScopeCard:', err);
        });

        return () => { cancelled = true; };
    }, [inquiry.id, inquiry.selected_package_id, currentBrand?.id]);

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

    // Instance-accurate cost: computed from real inquiry crew + equipment + task preview (mirrors SummaryCard on review page)
    const instanceCrewCost = computeCrewCost(instanceOperators, instanceTaskPreview);
    const instanceEquipCost = computeEquipmentCost(null, instanceOperators, instanceEquipment);
    const instanceTotalCost = instanceCrewCost + instanceEquipCost;
    // Use instance cost if loaded, otherwise fall back to package template cost
    const displayCost = instanceCostLoaded
        ? instanceTotalCost
        : (stats && stats.totalCost > 0 ? stats.totalCost : Number(selectedPkg?.base_price ?? 0));

    console.log('[PackageScopeCard] RENDER STATE:', {
        instanceCostLoaded,
        instanceOperators_count: instanceOperators.length,
        instanceEquipment_count: instanceEquipment.length,
        instanceTaskPreview_tasks_count: instanceTaskPreview?.tasks?.length ?? 0,
        instanceCrewCost,
        instanceEquipCost,
        instanceTotalCost,
        statsTotalCost: stats?.totalCost,
        displayCost,
        selected_package_id: inquiry.selected_package_id,
    });
    if (instanceCostLoaded && instanceOperators.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        instanceOperators.forEach((op: any, i: number) => {
            const c = op.contributor;
            const roles = c?.contributor_job_roles || [];
            const matchingRole = roles.find((r: any) => r.job_role_id === op.job_role_id);
            console.log(`[PackageScopeCard] op[${i}] rate breakdown:`, {
                position_name: op.position_name,
                job_role_id: op.job_role_id,
                contributor_id: op.contributor_id,
                hours: op.hours,
                has_contributor: !!c,
                contributor_job_roles_count: roles.length,
                matching_role_bracket: matchingRole?.payment_bracket ?? null,
                hourly_rate_resolved: matchingRole?.payment_bracket?.hourly_rate ?? c?.default_hourly_rate ?? 0,
                day_rate_resolved: matchingRole?.payment_bracket?.day_rate ?? 0,
            });
        });
    }

    const catColor = selectedPkg ? getCategoryColor(selectedPkg.category) : '#64748b';
    const tierColor = selectedSetInfo ? getTierColor(selectedSetInfo.tierLabel) : '#648CFF';
    const packageFilmItems = selectedPkg
        ? ((selectedPkg.contents?.items || []).filter((i: { type: string }) => i.type === 'film'))
        : [];
    const displayFilms = hasLoadedLiveFilms
        ? liveFilms.map((filmRecord) => ({
            id: filmRecord.id,
            description: filmRecord.film?.name || `Film #${filmRecord.film_id}`,
        }))
        : packageFilmItems;

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent sx={{ p: '0 !important' }}>
                {/* Header */}
                <Box sx={{ px: 2.5, pt: 2, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Videocam /> Package
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                        onClick={() => router.push(`/sales/inquiries/${inquiry.id}/package`)}
                        sx={{ textTransform: 'none', borderRadius: 1, fontSize: '0.8rem' }}
                    >
                        {noPackageSelected ? 'Select Package' : 'Review'}
                    </Button>
                </Box>

                {/* No-package warning */}
                {noPackageSelected && (
                    <Box sx={{ px: 2.5, pb: 2 }}>
                        <Alert
                            severity="warning"
                            icon={<WarningAmber />}
                            sx={{ borderRadius: 1 }}
                        >
                            No package selected — open the package review to choose one.
                        </Alert>
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
                            <Typography sx={{
                                fontWeight: 800, color: '#f59e0b', fontSize: '1.1rem', fontFamily: 'monospace',
                            }}>
                                {formatCurrency(displayCost, currencyCode)}
                            </Typography>
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
