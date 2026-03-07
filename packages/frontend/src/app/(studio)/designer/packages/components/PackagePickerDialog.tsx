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
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MicIcon from '@mui/icons-material/Mic';
import PlaceIcon from '@mui/icons-material/Place';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useRouter } from 'next/navigation';
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
    /** Pre-filter to this category (from the set's linked category) */
    filterCategory?: string | null;
    /** Slot ID to assign the new package to after creation */
    slotId?: number | null;
}

// ─── Component ───────────────────────────────────────────────────────

export default function PackagePickerDialog({
    open, onClose, packages, loading, currencyCode, assignedIds, onSelect,
    filterCategory, slotId,
}: PackagePickerDialogProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        if (open && filterCategory) {
            setSelectedCategory(filterCategory);
        } else if (!open) {
            setSelectedCategory(null);
            setSearch('');
        }
    }, [open, filterCategory]);

    const categories = useMemo(() => {
        const cats = new Set<string>();
        packages.forEach(p => cats.add(p.category || 'Uncategorized'));
        return Array.from(cats).sort();
    }, [packages]);

    const filtered = useMemo(() => {
        let list = packages;
        if (selectedCategory) {
            list = list.filter(p => (p.category || 'Uncategorized') === selectedCategory);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.name?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [packages, selectedCategory, search]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
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
                <Box>
                    <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1.25rem' }}>
                        Choose a Package
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                        {packages.length} package{packages.length !== 1 ? 's' : ''} in your library
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#64748b', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ height: '1px', mx: 3, bgcolor: 'rgba(148,163,184,0.1)' }} />

            {/* ── Search + Filters ── */}
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

            {/* ── Category Chips ── */}
            {categories.length > 1 && (
                <Box sx={{ px: 3, py: 1.5, display: 'flex', gap: 0.5, flexWrap: 'wrap', flexShrink: 0 }}>
                    <Chip
                        label="All"
                        size="small"
                        onClick={() => setSelectedCategory(null)}
                        sx={{
                            height: 24, fontSize: '0.65rem', fontWeight: 700, borderRadius: 1.5,
                            bgcolor: !selectedCategory ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
                            color: !selectedCategory ? '#f59e0b' : '#94a3b8',
                            border: !selectedCategory ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)',
                            cursor: 'pointer',
                        }}
                    />
                    {categories.map(cat => {
                        const isActive = selectedCategory === cat;
                        const catColor = getCategoryColor(cat);
                        return (
                            <Chip
                                key={cat}
                                label={cat}
                                size="small"
                                onClick={() => setSelectedCategory(isActive ? null : cat)}
                                sx={{
                                    height: 24, fontSize: '0.65rem', fontWeight: 600, borderRadius: 1.5,
                                    bgcolor: isActive ? `${catColor}18` : 'rgba(255,255,255,0.03)',
                                    color: isActive ? catColor : '#94a3b8',
                                    border: isActive ? `1px solid ${catColor}40` : '1px solid rgba(255,255,255,0.06)',
                                    cursor: 'pointer',
                                }}
                            />
                        );
                    })}
                </Box>
            )}

            {/* ── Create New ── */}
            <Box sx={{ px: 3, pb: 1.5, flexShrink: 0 }}>
                <Button
                    fullWidth
                    startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
                    onClick={() => { onClose(); router.push(`/designer/packages/new${slotId ? `?slotId=${slotId}` : ''}`); }}
                    sx={{
                        color: '#f59e0b', fontSize: '0.78rem', fontWeight: 600,
                        textTransform: 'none', py: 1.25, borderRadius: 2,
                        border: '1px dashed rgba(245, 158, 11, 0.35)',
                        bgcolor: 'rgba(245, 158, 11, 0.04)',
                        '&:hover': {
                            bgcolor: 'rgba(245, 158, 11, 0.1)',
                            borderColor: 'rgba(245, 158, 11, 0.55)',
                        },
                    }}
                >
                    Create New Package
                </Button>
            </Box>

            {/* ── Package Grid ── */}
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
                                : selectedCategory
                                    ? `No packages in "${selectedCategory}" category`
                                    : 'No packages in your library yet'}
                        </Typography>
                        {selectedCategory && !search && packages.length > 0 && (
                            <Typography
                                onClick={() => setSelectedCategory(null)}
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
                            const stats = getPackageStats(pkg);
                            const catColor = getCategoryColor(pkg.category);

                            return (
                                <Box
                                    key={pkg.id}
                                    onClick={() => { if (!isAssigned) { onSelect(pkg); onClose(); } }}
                                    sx={{
                                        borderRadius: 2,
                                        bgcolor: isAssigned
                                            ? 'rgba(255,255,255,0.01)'
                                            : 'rgba(255,255,255,0.02)',
                                        border: isAssigned
                                            ? '1px solid rgba(100, 140, 255, 0.25)'
                                            : '1px solid rgba(148,163,184,0.12)',
                                        overflow: 'hidden',
                                        cursor: isAssigned ? 'default' : 'pointer',
                                        opacity: isAssigned ? 0.6 : 1,
                                        transition: 'all 0.2s ease',
                                        ...(!isAssigned && {
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
                                    <Box sx={{ height: 2, background: `linear-gradient(90deg, ${catColor}, ${catColor}80)` }} />

                                    <Box sx={{ px: 2, py: 1.5 }}>
                                        {/* Category + Price + Status */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Chip
                                                label={pkg.category || 'General'}
                                                size="small"
                                                sx={{
                                                    height: 20, fontSize: '0.55rem', fontWeight: 700,
                                                    bgcolor: `${catColor}15`, color: catColor,
                                                    border: `1px solid ${catColor}30`,
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
        </Dialog>
    );
}
