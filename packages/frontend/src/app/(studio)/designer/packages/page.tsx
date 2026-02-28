'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Button, IconButton, Chip, CircularProgress,
    Tooltip, Menu, MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import InventoryIcon from '@mui/icons-material/Inventory';
import MovieIcon from '@mui/icons-material/Movie';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MicIcon from '@mui/icons-material/Mic';
import EventIcon from '@mui/icons-material/Event';
import PlaceIcon from '@mui/icons-material/Place';
import PeopleIcon from '@mui/icons-material/People';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ServicePackage } from '@/lib/types/domains/sales';
import { useBrand } from '@/app/providers/BrandProvider';
import CategoryManagementDialog from './components/CategoryManagementDialog';

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
    const locationCount = typeof counts.package_event_day_locations === 'number'
        ? counts.package_event_day_locations : 0;
    const crewCount = typeof data?._crewCount === 'number'
        ? data._crewCount : 0;
    const eqCounts = data?._equipmentCounts || {};
    const cameraCount = eqCounts.cameras || 0;
    const audioCount = eqCounts.audio || 0;

    return { dayCount, locationCount, crewCount, cameraCount, audioCount };
}

// ─── Component ───────────────────────────────────────────────────────

export default function PackageLibraryPage() {
    const router = useRouter();
    const { currentBrand } = useBrand();
    const safeBrandId = currentBrand?.id || 1;

    const [packages, setPackages] = useState<ServicePackage[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [deleteMenuAnchor, setDeleteMenuAnchor] = useState<null | HTMLElement>(null);
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

    const loadData = async () => {
        try {
            const [pkgs, cats] = await Promise.all([
                api.servicePackages.getAll(safeBrandId),
                api.servicePackageCategories.getAll(safeBrandId),
            ]);
            setPackages(pkgs);
            setCategories(cats);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [safeBrandId]);
    useEffect(() => { if (!isCategoryDialogOpen) loadData(); }, [isCategoryDialogOpen]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.servicePackages.delete(safeBrandId, deleteTarget);
            setDeleteMenuAnchor(null);
            setDeleteTarget(null);
            loadData();
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    const categoryCounts = useMemo(() => {
        return packages.reduce((acc, pkg) => {
            const cat = pkg.category || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [packages]);

    const filteredPackages = selectedCategory
        ? packages.filter(p => (p.category || 'Uncategorized') === selectedCategory)
        : packages;

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 12 }}>
                <CircularProgress size={28} sx={{ color: '#648CFF' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
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
                            Package Library
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                            {packages.length} package{packages.length !== 1 ? 's' : ''} designed for your clients
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                        size="small"
                        startIcon={<SettingsIcon sx={{ fontSize: '16px !important' }} />}
                        onClick={() => setIsCategoryDialogOpen(true)}
                        sx={{
                            color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600,
                            textTransform: 'none', px: 2, py: 0.75,
                            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.15)' },
                        }}
                    >
                        Categories
                    </Button>
                    <Button
                        size="small"
                        startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
                        onClick={() => router.push('/designer/packages/new')}
                        sx={{
                            color: '#0f172a', fontSize: '0.75rem', fontWeight: 700,
                            textTransform: 'none', px: 2.5, py: 0.75,
                            bgcolor: '#f59e0b', borderRadius: 2,
                            '&:hover': { bgcolor: '#d97706' },
                        }}
                    >
                        New Package
                    </Button>
                </Box>
            </Box>

            {/* ── Category Filters ── */}
            {categories.length > 0 && (
                <Box sx={{ mb: 3, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    <Chip
                        label={`All ${packages.length}`}
                        size="small"
                        onClick={() => setSelectedCategory(null)}
                        sx={{
                            height: 28, fontSize: '0.7rem', fontWeight: 700, borderRadius: 2,
                            bgcolor: !selectedCategory ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.03)',
                            color: !selectedCategory ? '#f59e0b' : '#94a3b8',
                            border: !selectedCategory ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255,255,255,0.06)',
                            cursor: 'pointer',
                        }}
                    />
                    {categories.map(cat => {
                        const isActive = selectedCategory === cat.name;
                        const catColor = getCategoryColor(cat.name);
                        return (
                            <Chip
                                key={cat.id}
                                label={`${cat.name} ${categoryCounts[cat.name] || 0}`}
                                size="small"
                                onClick={() => setSelectedCategory(isActive ? null : cat.name)}
                                sx={{
                                    height: 28, fontSize: '0.7rem', fontWeight: 600, borderRadius: 2,
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

            {/* ── Package Cards (Vertical) ── */}
            {filteredPackages.length === 0 ? (
                <Box sx={{
                    borderRadius: 3, py: 8, px: 4,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    bgcolor: 'rgba(16, 18, 22, 0.6)',
                    border: '1px solid rgba(52, 58, 68, 0.3)',
                }}>
                    <InventoryIcon sx={{ fontSize: 48, color: '#334155', mb: 2 }} />
                    <Typography sx={{ color: '#475569', fontSize: '0.9rem', fontWeight: 600, mb: 0.5 }}>
                        {selectedCategory ? 'No packages in this category' : 'No packages yet'}
                    </Typography>
                    <Typography sx={{ color: '#334155', fontSize: '0.75rem', mb: 3 }}>
                        Create your first package to get started
                    </Typography>
                    <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => router.push('/designer/packages/new')}
                        sx={{
                            color: '#0f172a', fontWeight: 700, fontSize: '0.75rem',
                            bgcolor: '#f59e0b', borderRadius: 2, px: 3,
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#d97706' },
                        }}
                    >
                        Create Package
                    </Button>
                </Box>
            ) : (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(4, 1fr)',
                    },
                    gap: 2.5,
                }}>
                    {filteredPackages.map((pkg) => {
                        const stats = getPackageStats(pkg);
                        const catColor = getCategoryColor(pkg.category);
                        const filmItems = (pkg.contents?.items || []).filter(i => i.type === 'film');

                        return (
                            <Box
                                key={pkg.id}
                                onClick={() => router.push(`/designer/packages/${pkg.id}`)}
                                sx={{
                                    borderRadius: 3,
                                    bgcolor: 'rgba(16, 18, 22, 0.85)',
                                    border: '1px solid rgba(52, 58, 68, 0.3)',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        border: '1px solid rgba(100, 140, 255, 0.25)',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                                        transform: 'translateY(-2px)',
                                        '& .open-arrow': { opacity: 1, transform: 'translateX(0)' },
                                    },
                                }}
                            >
                                {/* Top accent */}
                                <Box sx={{ height: 3, background: `linear-gradient(90deg, ${catColor}, ${catColor}80)` }} />

                                {/* Header: category + price */}
                                <Box sx={{ px: 2.5, pt: 2.5, pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                                        fontWeight: 800, color: '#f59e0b', fontSize: '1.1rem',
                                        fontFamily: 'monospace',
                                    }}>
                                        £{Number(pkg.base_price || 0).toLocaleString()}
                                    </Typography>
                                </Box>

                                {/* Name + Description */}
                                <Box sx={{ px: 2.5, pt: 1.5, pb: 2 }}>
                                    <Typography sx={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.1rem', lineHeight: 1.3, mb: 0.5 }}>
                                        {pkg.name}
                                    </Typography>
                                    {pkg.description && (
                                        <Typography sx={{
                                            color: '#64748b', fontSize: '0.72rem', lineHeight: 1.5,
                                            display: '-webkit-box', WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                        }}>
                                            {pkg.description}
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
                                    ].map((stat) => (
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
                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.25 }}>
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

                                {/* Footer */}
                                <Box sx={{
                                    px: 2.5, py: 1.5,
                                    borderTop: '1px solid rgba(52, 58, 68, 0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <Tooltip title="Delete" arrow>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(pkg.id); setDeleteMenuAnchor(e.currentTarget); }}
                                            sx={{ p: 0.5, color: '#334155', '&:hover': { color: '#ef4444' } }}
                                        >
                                            <DeleteIcon sx={{ fontSize: 15 }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Box className="open-arrow" sx={{
                                        opacity: 0, transform: 'translateX(-4px)',
                                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 0.5,
                                    }}>
                                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#648CFF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Open
                                        </Typography>
                                        <ArrowForwardIcon sx={{ fontSize: 13, color: '#648CFF' }} />
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            )}

            {/* Delete confirmation menu */}
            <Menu
                anchorEl={deleteMenuAnchor}
                open={Boolean(deleteMenuAnchor)}
                onClose={() => { setDeleteMenuAnchor(null); setDeleteTarget(null); }}
                PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 160 } }}
            >
                <MenuItem
                    onClick={handleDelete}
                    sx={{ fontSize: '0.75rem', color: '#ef4444', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
                >
                    <DeleteIcon sx={{ fontSize: 14, mr: 1 }} />
                    Confirm Delete
                </MenuItem>
                <MenuItem
                    onClick={() => { setDeleteMenuAnchor(null); setDeleteTarget(null); }}
                    sx={{ fontSize: '0.75rem', color: '#94a3b8', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
                >
                    Cancel
                </MenuItem>
            </Menu>

            <CategoryManagementDialog
                open={isCategoryDialogOpen}
                onClose={() => setIsCategoryDialogOpen(false)}
                brandId={safeBrandId}
            />
        </Box>
    );
}
