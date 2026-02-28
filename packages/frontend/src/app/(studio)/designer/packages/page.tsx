'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Button, IconButton, Chip, CircularProgress,
    Stack, Tooltip, Menu, MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import InventoryIcon from '@mui/icons-material/Inventory';
import MovieIcon from '@mui/icons-material/Movie';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VideocamIcon from '@mui/icons-material/Videocam';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ServicePackage } from '@/lib/types/domains/sales';
import { useBrand } from '@/app/providers/BrandProvider';
import CategoryManagementDialog from './components/CategoryManagementDialog';

// ─── Shared Styling ──────────────────────────────────────────────────

const cardSx = {
    background: 'rgba(16, 18, 22, 0.85)',
    borderRadius: 3,
    border: '1px solid rgba(52, 58, 68, 0.3)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    '&:hover': {
        border: '1px solid rgba(100, 140, 255, 0.25)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
        transform: 'translateY(-2px)',
        '& .card-arrow': { opacity: 1, transform: 'translateX(0px)' },
        '& .card-actions': { opacity: 1 },
    },
};

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

    // ─── Helpers ─────────────────────────────────────────────────

    function getPackageStats(pkg: ServicePackage) {
        const items = pkg.contents?.items || [];
        const filmCount = items.filter(i => i.type === 'film').length;
        const serviceCount = items.filter(i => i.type === 'service').length;
        // Prefer actual PackageEventDay count from backend, fallback to day_coverage keys
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const backendDayCount = (pkg as any)?._count?.package_event_days;
        const dayCount = typeof backendDayCount === 'number'
            ? backendDayCount
            : (pkg.contents?.day_coverage ? Object.keys(pkg.contents.day_coverage).length : 0);
        const equipCounts = pkg.contents?.equipment_counts;
        const cameraCount = equipCounts?.cameras || 0;
        const audioCount = equipCounts?.audio || 0;
        const extraEquip = pkg.contents?.extra_equipment?.length || 0;
        const totalEquip = cameraCount + audioCount + extraEquip;

        let totalHours = 0;
        if (pkg.contents?.day_coverage) {
            for (const dc of Object.values(pkg.contents.day_coverage)) {
                if (dc.mode === 'hours' && dc.hours) totalHours += dc.hours;
            }
        }
        if (totalHours === 0 && pkg.contents?.coverage_hours) {
            totalHours = pkg.contents.coverage_hours;
        }

        return { filmCount, serviceCount, dayCount, cameraCount, audioCount, totalEquip, totalHours };
    }

    // ─── Render ──────────────────────────────────────────────────

    if (isLoading) {
        return (
            <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: 'auto', display: 'flex', justifyContent: 'center', pt: 12 }}>
                <CircularProgress size={28} sx={{ color: '#648CFF' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: 'auto' }}>
            {/* ── Header ── */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                            width: 40, height: 40, borderRadius: 2,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)',
                        }}>
                            <InventoryIcon sx={{ fontSize: 20, color: '#f59e0b' }} />
                        </Box>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#f1f5f9', fontSize: { xs: '1.5rem', md: '1.75rem' } }}>
                                Package Library
                            </Typography>
                            <Typography sx={{ color: '#64748b', fontSize: '0.8rem', mt: 0.25 }}>
                                {packages.length} package{packages.length !== 1 ? 's' : ''} designed for your clients
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button
                            size="small"
                            startIcon={<SettingsIcon sx={{ fontSize: '14px !important' }} />}
                            onClick={() => setIsCategoryDialogOpen(true)}
                            sx={{
                                color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600,
                                textTransform: 'none', px: 1.5, py: 0.75,
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 2,
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.15)' },
                            }}
                        >
                            Categories
                        </Button>
                        <Button
                            size="small"
                            startIcon={<AddIcon sx={{ fontSize: '14px !important' }} />}
                            onClick={() => router.push('/designer/packages/new')}
                            sx={{
                                color: '#0f172a', fontSize: '0.7rem', fontWeight: 700,
                                textTransform: 'none', px: 2, py: 0.75,
                                bgcolor: '#f59e0b', borderRadius: 2,
                                '&:hover': { bgcolor: '#d97706' },
                            }}
                        >
                            New Package
                        </Button>
                    </Box>
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
                            height: 26, fontSize: '0.65rem', fontWeight: 700, borderRadius: 2,
                            bgcolor: !selectedCategory ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.03)',
                            color: !selectedCategory ? '#f59e0b' : '#94a3b8',
                            border: !selectedCategory ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255,255,255,0.06)',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.08)' },
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
                                    height: 26, fontSize: '0.65rem', fontWeight: 600, borderRadius: 2,
                                    bgcolor: isActive ? `${catColor}18` : 'rgba(255,255,255,0.03)',
                                    color: isActive ? catColor : '#94a3b8',
                                    border: isActive ? `1px solid ${catColor}40` : '1px solid rgba(255,255,255,0.06)',
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: `${catColor}10` },
                                }}
                            />
                        );
                    })}
                </Box>
            )}

            {/* ── Package Grid ── */}
            {filteredPackages.length === 0 ? (
                <Box sx={{
                    ...cardSx,
                    cursor: 'default', height: 'auto',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    py: 8, px: 4, mt: 2,
                    '&:hover': { transform: 'none', border: '1px solid rgba(52, 58, 68, 0.3)', boxShadow: cardSx.boxShadow },
                }}>
                    <Box sx={{ width: 56, height: 56, borderRadius: 3, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52, 58, 68, 0.3)' }}>
                        <InventoryIcon sx={{ fontSize: 24, color: '#334155' }} />
                    </Box>
                    <Typography sx={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600, mb: 0.5 }}>
                        {selectedCategory ? 'No packages in this category' : 'No packages yet'}
                    </Typography>
                    <Typography sx={{ color: '#334155', fontSize: '0.7rem', mb: 2.5 }}>
                        Create your first package to get started
                    </Typography>
                    <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => router.push('/designer/packages/new')}
                        sx={{
                            color: '#0f172a', fontWeight: 700, fontSize: '0.7rem',
                            bgcolor: '#f59e0b', borderRadius: 2, px: 2.5,
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
                        xl: 'repeat(5, 1fr)',
                    },
                    gap: 2.5,
                }}>
                    {filteredPackages.map((pkg) => {
                        const stats = getPackageStats(pkg);
                        const catColor = getCategoryColor(pkg.category);
                        const items = pkg.contents?.items || [];
                        const filmItems = items.filter(i => i.type === 'film');
                        const serviceItems = items.filter(i => i.type === 'service');

                        return (
                            <Box
                                key={pkg.id}
                                sx={cardSx}
                                onClick={() => router.push(`/designer/packages/${pkg.id}`)}
                            >
                                {/* ── Top accent bar ── */}
                                <Box sx={{
                                    height: 3,
                                    background: `linear-gradient(90deg, ${catColor}, ${catColor}80)`,
                                }} />

                                {/* ── Card Body ── */}
                                <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    {/* Category + Price row */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                        <Chip
                                            label={pkg.category || 'General'}
                                            size="small"
                                            sx={{
                                                height: 20, fontSize: '0.55rem', fontWeight: 700,
                                                bgcolor: `${catColor}12`, color: catColor,
                                                border: `1px solid ${catColor}25`,
                                                textTransform: 'uppercase', letterSpacing: '0.5px',
                                                '& .MuiChip-label': { px: 0.75 },
                                            }}
                                        />
                                        <Typography sx={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.95rem', fontFamily: 'monospace' }}>
                                            ${Number(pkg.base_price || 0).toLocaleString()}
                                        </Typography>
                                    </Box>

                                    {/* Name */}
                                    <Typography sx={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1rem', lineHeight: 1.3, mb: 0.75 }}>
                                        {pkg.name}
                                    </Typography>

                                    {/* Description */}
                                    {pkg.description && (
                                        <Typography sx={{
                                            color: '#64748b', fontSize: '0.7rem', lineHeight: 1.5,
                                            mb: 2, display: '-webkit-box', WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                        }}>
                                            {pkg.description}
                                        </Typography>
                                    )}

                                    {/* ── What's Included ── */}
                                    <Box sx={{ mt: 'auto' }}>
                                        {/* Stat chips row */}
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                                            {stats.filmCount > 0 && (
                                                <Chip
                                                    icon={<MovieIcon sx={{ fontSize: '10px !important', color: '#648CFF !important' }} />}
                                                    label={`${stats.filmCount} film${stats.filmCount !== 1 ? 's' : ''}`}
                                                    size="small"
                                                    sx={{ height: 20, fontSize: '0.55rem', fontWeight: 600, bgcolor: 'rgba(100, 140, 255, 0.08)', color: '#648CFF', border: 'none', '& .MuiChip-icon': { ml: '4px' } }}
                                                />
                                            )}
                                            {stats.dayCount > 0 && (
                                                <Chip
                                                    icon={<CalendarTodayIcon sx={{ fontSize: '10px !important', color: '#f59e0b !important' }} />}
                                                    label={`${stats.dayCount} day${stats.dayCount !== 1 ? 's' : ''}`}
                                                    size="small"
                                                    sx={{ height: 20, fontSize: '0.55rem', fontWeight: 600, bgcolor: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', border: 'none', '& .MuiChip-icon': { ml: '4px' } }}
                                                />
                                            )}
                                            {stats.totalHours > 0 && (
                                                <Chip
                                                    icon={<AccessTimeIcon sx={{ fontSize: '10px !important', color: '#a855f7 !important' }} />}
                                                    label={`${stats.totalHours}h`}
                                                    size="small"
                                                    sx={{ height: 20, fontSize: '0.55rem', fontWeight: 600, bgcolor: 'rgba(168, 85, 247, 0.08)', color: '#a855f7', border: 'none', '& .MuiChip-icon': { ml: '4px' } }}
                                                />
                                            )}
                                            {stats.totalEquip > 0 && (
                                                <Chip
                                                    icon={<VideocamIcon sx={{ fontSize: '10px !important', color: '#10b981 !important' }} />}
                                                    label={`${stats.totalEquip} gear`}
                                                    size="small"
                                                    sx={{ height: 20, fontSize: '0.55rem', fontWeight: 600, bgcolor: 'rgba(16, 185, 129, 0.08)', color: '#10b981', border: 'none', '& .MuiChip-icon': { ml: '4px' } }}
                                                />
                                            )}
                                        </Box>

                                        {/* Divider */}
                                        <Box sx={{ height: '1px', bgcolor: 'rgba(52, 58, 68, 0.25)', mb: 1.5 }} />

                                        {/* Included items list */}
                                        <Stack spacing={0.5}>
                                            {filmItems.slice(0, 3).map((item, idx) => (
                                                <Box key={item.id || idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                    <CheckCircleIcon sx={{ fontSize: 12, color: '#648CFF', opacity: 0.7 }} />
                                                    <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.description || 'Film'}
                                                    </Typography>
                                                </Box>
                                            ))}
                                            {serviceItems.slice(0, 2).map((item, idx) => (
                                                <Box key={`svc-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                    <CheckCircleIcon sx={{ fontSize: 12, color: '#10b981', opacity: 0.7 }} />
                                                    <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.description || 'Service'}
                                                    </Typography>
                                                </Box>
                                            ))}
                                            {items.length === 0 && (
                                                <Typography sx={{ fontSize: '0.6rem', color: '#334155', fontStyle: 'italic' }}>
                                                    No items configured yet
                                                </Typography>
                                            )}
                                            {items.length > 5 && (
                                                <Typography sx={{ fontSize: '0.55rem', color: '#475569', fontWeight: 600, pl: 2.25 }}>
                                                    + {items.length - 5} more
                                                </Typography>
                                            )}
                                        </Stack>
                                    </Box>
                                </Box>

                                {/* ── Card Footer ── */}
                                <Box sx={{
                                    px: 2.5, py: 1.25,
                                    borderTop: '1px solid rgba(52, 58, 68, 0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <Box className="card-actions" sx={{ opacity: 0, transition: 'opacity 0.2s', display: 'flex', gap: 0.25 }}>
                                        <Tooltip title="Edit" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => { e.stopPropagation(); router.push(`/designer/packages/${pkg.id}`); }}
                                                sx={{ p: 0.4, color: '#64748b', '&:hover': { color: '#648CFF' } }}
                                            >
                                                <EditIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => { e.stopPropagation(); setDeleteTarget(pkg.id); setDeleteMenuAnchor(e.currentTarget); }}
                                                sx={{ p: 0.4, color: '#64748b', '&:hover': { color: '#ef4444' } }}
                                            >
                                                <DeleteIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    <Box className="card-arrow" sx={{ opacity: 0, transform: 'translateX(-4px)', transition: 'all 0.25s', display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                                        <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: '#648CFF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Open
                                        </Typography>
                                        <ArrowForwardIcon sx={{ fontSize: 12, color: '#648CFF' }} />
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
                    sx={{ fontSize: '0.7rem', color: '#ef4444', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
                >
                    <DeleteIcon sx={{ fontSize: 14, mr: 1 }} />
                    Confirm Delete
                </MenuItem>
                <MenuItem
                    onClick={() => { setDeleteMenuAnchor(null); setDeleteTarget(null); }}
                    sx={{ fontSize: '0.7rem', color: '#94a3b8', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
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
