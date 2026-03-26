'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, Dialog, Backdrop, Chip, IconButton, InputBase,
    CircularProgress, Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import InventoryIcon from '@mui/icons-material/Inventory';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MicIcon from '@mui/icons-material/Mic';
import PlaceIcon from '@mui/icons-material/Place';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ServicePackage } from '@/lib/types/domains/sales';
import { formatCurrency } from '@/lib/utils/formatUtils';

// ─── Helpers ─────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
    'Wedding': '#EC4899',
    'Elopement': '#a855f7',
    'Corporate': '#3b82f6',
    'Event': '#f59e0b',
    'Music Video': '#10b981',
    'Commercial': '#0ea5e9',
    'Birthday': '#f59e0b',
    'Engagement': '#a855f7',
    'Uncategorized': '#64748b',
};

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
    const crewCount = typeof data?._crewCount === 'number' ? data._crewCount : 0;
    const cameraCount = (data?._equipmentCounts || {}).cameras || 0;
    const audioCount = (data?._equipmentCounts || {}).audio || 0;
    const locationCount = typeof counts.package_event_day_locations === 'number'
        ? counts.package_event_day_locations : 0;
    return { dayCount, crewCount, cameraCount, audioCount, locationCount };
}

/** Sort packages by price — ascending for lower tiers, descending for upper tiers. */
function sortByPriceForTier(list: ServicePackage[], slotLabel: string | null): ServicePackage[] {
    const lowerTiers = ['budget', 'basic'];
    const asc = slotLabel ? lowerTiers.includes(slotLabel.toLowerCase()) : true;
    return [...list].sort((a, b) => {
        const pa = Number(a.base_price ?? 0);
        const pb = Number(b.base_price ?? 0);
        return asc ? pa - pb : pb - pa;
    });
}

type WizardStep = 'choose-action' | 'pick-from-library';

// ─── Props ───────────────────────────────────────────────────────────

interface PackagePickerDialogProps {
    open: boolean;
    onClose: () => void;
    packages: ServicePackage[];
    loading: boolean;
    currencyCode: string;
    /** IDs already assigned to a slot */
    assignedIds: number[];
    onSelect: (pkg: ServicePackage) => void;
    /** Pre-filter to this category (from the set's linked event type name) */
    filterCategory?: string | null;
    /** Slot ID to assign the new package to after creation */
    slotId?: number | null;
    /** Slot tier label, e.g. "Basic", "Premium" */
    slotLabel?: string | null;
    /** Set name, e.g. "Wedding Packages" */
    setName?: string | null;
    /** Callback when user chooses "Create new package" instead of picking */
    onCreateNew?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────

export default function PackagePickerDialog({
    open, onClose, packages, loading, currencyCode, assignedIds, onSelect,
    filterCategory, slotId, slotLabel, setName, onCreateNew,
}: PackagePickerDialogProps) {
    const [step, setStep] = useState<WizardStep>('choose-action');
    const [search, setSearch] = useState('');
    const [showAllCategories, setShowAllCategories] = useState(false);

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (open) {
            setStep('choose-action');
            setSearch('');
            setShowAllCategories(false);
        }
    }, [open]);

    // Count packages matching the event type category for display
    const matchingCount = useMemo(() => {
        if (!filterCategory) return packages.length;
        return packages.filter(p => (p.category || 'Uncategorized') === filterCategory).length;
    }, [packages, filterCategory]);

    const otherCount = packages.length - matchingCount;

    // Filtered + sorted list for "pick from library" step
    const filtered = useMemo(() => {
        let list = packages;
        // Auto-filter by event type unless user chose "show all"
        if (filterCategory && !showAllCategories) {
            list = list.filter(p => (p.category || 'Uncategorized') === filterCategory);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.name?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q)
            );
        }
        return sortByPriceForTier(list, slotLabel ?? null);
    }, [packages, filterCategory, showAllCategories, search, slotLabel]);

    const handleClose = () => {
        onClose();
    };

    const handleBack = () => {
        setStep('choose-action');
        setSearch('');
        setShowAllCategories(false);
    };

    const catColor = getCategoryColor(filterCategory ?? null);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            slots={{ backdrop: Backdrop }}
            slotProps={{
                backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0, 0, 0, 0.5)' } },
            }}
            PaperProps={{
                sx: {
                    backgroundColor: 'rgba(15, 20, 25, 0.97)',
                    backdropFilter: 'blur(12px)',
                    backgroundImage:
                        'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)',
                    borderRadius: 2.5,
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.5)',
                    maxHeight: '80vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            {/* ── Header ── */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 3, pt: 2.5, pb: 1.5,
                flexShrink: 0,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {step !== 'choose-action' && (
                        <IconButton onClick={handleBack} sx={{ color: '#64748b', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' }, mr: -0.5 }}>
                            <ArrowBackIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    )}
                    <Box>
                        <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1.15rem' }}>
                            {step === 'choose-action' && 'Fill Slot'}
                            {step === 'pick-from-library' && 'Choose a Package'}
                        </Typography>
                        {/* Context line: show which slot in which set */}
                        <Typography sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                            {slotLabel && setName
                                ? <>{slotLabel} slot in <Box component="span" sx={{ color: catColor, fontWeight: 600 }}>{setName}</Box></>
                                : slotLabel
                                    ? `${slotLabel} slot`
                                    : setName
                                        ? setName
                                        : 'Select a package for this slot'}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={handleClose} sx={{ color: '#64748b', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ height: '1px', mx: 3, bgcolor: 'rgba(148,163,184,0.1)' }} />

            {/* ════════════════════════════════════════════════════════════════
                STEP 1: Choose Action
               ════════════════════════════════════════════════════════════════ */}
            {step === 'choose-action' && (
                <Box sx={{ px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Pick from library */}
                    <ActionCard
                        icon={<InventoryIcon sx={{ fontSize: 22 }} />}
                        iconColor="#648CFF"
                        title="Pick from library"
                        subtitle={filterCategory
                            ? `${matchingCount} ${filterCategory} package${matchingCount !== 1 ? 's' : ''} available`
                            : `${packages.length} package${packages.length !== 1 ? 's' : ''} available`}
                        onClick={() => setStep('pick-from-library')}
                        disabled={packages.length === 0}
                    />

                    {/* Create new */}
                    <ActionCard
                        icon={<AddIcon sx={{ fontSize: 22 }} />}
                        iconColor="#10b981"
                        title="Create new package"
                        subtitle="Start from scratch with a blank package"
                        onClick={() => {
                            handleClose();
                            onCreateNew?.();
                        }}
                    />
                </Box>
            )}

            {/* ════════════════════════════════════════════════════════════════
                STEP 2a: Pick from Library
               ════════════════════════════════════════════════════════════════ */}
            {step === 'pick-from-library' && (
                <>
                    {/* Search Bar */}
                    <Box sx={{ px: 3, pt: 2, pb: 1, flexShrink: 0 }}>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 1,
                            px: 1.5, py: 0.75,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                        }}>
                            <SearchIcon sx={{ fontSize: 18, color: '#475569' }} />
                            <InputBase
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search packages..."
                                autoFocus
                                sx={{
                                    flex: 1, fontSize: '0.8rem', color: '#e2e8f0',
                                    '& ::placeholder': { color: '#475569' },
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Filter context — show which category is active */}
                    {filterCategory && (
                        <Box sx={{ px: 3, py: 1, display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                            <Chip
                                label={filterCategory}
                                size="small"
                                sx={{
                                    height: 22, fontSize: '0.65rem', fontWeight: 700, borderRadius: 1.5,
                                    bgcolor: `${catColor}18`, color: catColor,
                                    border: `1px solid ${catColor}40`,
                                }}
                            />
                            {!showAllCategories && otherCount > 0 && (
                                <Typography
                                    onClick={() => setShowAllCategories(true)}
                                    sx={{
                                        color: '#648CFF', fontSize: '0.7rem', cursor: 'pointer',
                                        '&:hover': { textDecoration: 'underline' },
                                    }}
                                >
                                    + {otherCount} other package{otherCount !== 1 ? 's' : ''}
                                </Typography>
                            )}
                            {showAllCategories && (
                                <Typography
                                    onClick={() => setShowAllCategories(false)}
                                    sx={{
                                        color: '#648CFF', fontSize: '0.7rem', cursor: 'pointer',
                                        '&:hover': { textDecoration: 'underline' },
                                    }}
                                >
                                    Show only {filterCategory}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Package Grid */}
                    <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 1.5 }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                                <CircularProgress size={24} sx={{ color: '#648CFF' }} />
                            </Box>
                        ) : filtered.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <InventoryIcon sx={{ fontSize: 40, color: '#334155', mb: 1.5 }} />
                                <Typography sx={{ color: '#475569', fontSize: '0.8rem' }}>
                                    {search
                                        ? 'No packages match your search'
                                        : filterCategory && !showAllCategories
                                            ? `No ${filterCategory} packages yet`
                                            : 'No packages in your library yet'}
                                </Typography>
                                {filterCategory && !showAllCategories && !search && otherCount > 0 && (
                                    <Typography
                                        onClick={() => setShowAllCategories(true)}
                                        sx={{
                                            color: '#648CFF', fontSize: '0.75rem', mt: 1,
                                            cursor: 'pointer', '&:hover': { textDecoration: 'underline' },
                                        }}
                                    >
                                        Show all {packages.length} packages
                                    </Typography>
                                )}
                            </Box>
                        ) : (
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                                {filtered.map(pkg => {
                                    const isAssigned = assignedIds.includes(pkg.id);
                                    const isClickable = !isAssigned;
                                    const stats = getPackageStats(pkg);
                                    const pkgCatColor = getCategoryColor(pkg.category);

                                    return (
                                        <Box
                                            key={pkg.id}
                                            onClick={() => {
                                                if (!isClickable) return;
                                                onSelect(pkg);
                                                handleClose();
                                            }}
                                            sx={{
                                                borderRadius: 2,
                                                bgcolor: (!isClickable)
                                                    ? 'rgba(255,255,255,0.01)'
                                                    : 'rgba(255,255,255,0.02)',
                                                border: (!isClickable)
                                                    ? '1px solid rgba(100, 140, 255, 0.25)'
                                                    : '1px solid rgba(148,163,184,0.12)',
                                                overflow: 'hidden',
                                                cursor: isClickable ? 'pointer' : 'default',
                                                opacity: isClickable ? 1 : 0.6,
                                                transition: 'all 0.2s ease',
                                                ...(isClickable && {
                                                    '&:hover': {
                                                        borderColor: 'rgba(148,163,184,0.25)',
                                                        bgcolor: 'rgba(255,255,255,0.04)',
                                                        transform: 'translateY(-1px)',
                                                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                                    },
                                                }),
                                            }}
                                        >
                                            {/* Top accent */}
                                            <Box sx={{ height: 2, background: `linear-gradient(90deg, ${pkgCatColor}, ${pkgCatColor}80)` }} />

                                            <Box sx={{ px: 2, py: 1.5 }}>
                                                {/* Category + Price + Status */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                    <Chip
                                                        label={pkg.category || 'General'}
                                                        size="small"
                                                        sx={{
                                                            height: 20, fontSize: '0.55rem', fontWeight: 700,
                                                            bgcolor: `${pkgCatColor}15`, color: pkgCatColor,
                                                            border: `1px solid ${pkgCatColor}30`,
                                                            textTransform: 'uppercase', letterSpacing: '0.5px',
                                                        }}
                                                    />
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        {isAssigned && (
                                                            <Chip
                                                                icon={<CheckCircleIcon sx={{ fontSize: '12px !important', color: '#10b981 !important' }} />}
                                                                label="Active"
                                                                size="small"
                                                                sx={{
                                                                    height: 20, fontSize: '0.55rem', fontWeight: 700,
                                                                    bgcolor: 'rgba(16, 185, 129, 0.1)',
                                                                    color: '#10b981',
                                                                    border: '1px solid rgba(16, 185, 129, 0.25)',
                                                                }}
                                                            />
                                                        )}
                                                        <Typography sx={{
                                                            fontWeight: 800, color: '#f59e0b', fontSize: '0.9rem',
                                                            fontFamily: 'monospace',
                                                        }}>
                                                            {formatCurrency(Number(pkg.base_price ?? 0), currencyCode || 'USD')}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                {/* Name */}
                                                <Typography sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem', lineHeight: 1.3, mb: 0.25 }}>
                                                    {pkg.name}
                                                </Typography>
                                                {pkg.description && (
                                                    <Typography sx={{
                                                        color: '#64748b', fontSize: '0.68rem', lineHeight: 1.4,
                                                        display: '-webkit-box', WebkitLineClamp: 1,
                                                        WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 1,
                                                    }}>
                                                        {pkg.description}
                                                    </Typography>
                                                )}

                                                {/* Compact Stats Row */}
                                                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                                    {[
                                                        { icon: <EventIcon sx={{ fontSize: 11 }} />, value: stats.dayCount, color: '#f59e0b', label: 'days' },
                                                        { icon: <PeopleIcon sx={{ fontSize: 11 }} />, value: stats.crewCount, color: '#648CFF', label: 'crew' },
                                                        { icon: <CameraAltIcon sx={{ fontSize: 11 }} />, value: stats.cameraCount, color: '#10b981', label: 'cam' },
                                                        { icon: <MicIcon sx={{ fontSize: 11 }} />, value: stats.audioCount, color: '#0ea5e9', label: 'audio' },
                                                        { icon: <PlaceIcon sx={{ fontSize: 11 }} />, value: stats.locationCount, color: '#a855f7', label: 'loc' },
                                                    ].map(s => (
                                                        <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                                            <Box sx={{ color: s.color, display: 'flex' }}>{s.icon}</Box>
                                                            <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, fontFamily: 'monospace' }}>
                                                                {s.value}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                </>
            )}
        </Dialog>
    );
}

// ─── Action Card (Step 1 option) ─────────────────────────────────────

function ActionCard({ icon, iconColor, title, subtitle, onClick, disabled }: {
    icon: React.ReactNode;
    iconColor: string;
    title: string;
    subtitle: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <Box
            onClick={disabled ? undefined : onClick}
            sx={{
                display: 'flex', alignItems: 'center', gap: 2,
                px: 2.5, py: 2,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(148,163,184,0.12)',
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                transition: 'all 0.2s ease',
                ...(!disabled && {
                    '&:hover': {
                        borderColor: `${iconColor}50`,
                        bgcolor: `${iconColor}08`,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 20px ${iconColor}15`,
                    },
                }),
            }}
        >
            <Box sx={{
                width: 42, height: 42, borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: `${iconColor}12`, border: `1px solid ${iconColor}25`,
                color: iconColor, flexShrink: 0,
            }}>
                {icon}
            </Box>
            <Box>
                <Typography sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem', lineHeight: 1.3 }}>
                    {title}
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.72rem', lineHeight: 1.4 }}>
                    {subtitle}
                </Typography>
            </Box>
        </Box>
    );
}
