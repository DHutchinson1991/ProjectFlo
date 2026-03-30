'use client';

import React, { useMemo, useState } from 'react';
import {
    Box, Typography, CircularProgress, IconButton, Chip, Tooltip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TableSortLabel, InputBase, Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions, Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InventoryIcon from '@mui/icons-material/Inventory';
import LinkIcon from '@mui/icons-material/Link';
import { useRouter } from 'next/navigation';

import { useDeleteServicePackage, usePackageLibraryData } from '@/features/catalog/packages/hooks';
import { ServicePackage } from '@/features/catalog/packages/types/service-package.types';
import { useBrand } from '@/features/platform/brand';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { formatCurrency } from '@/shared/utils/formatUtils';
import { type PackageSet, CATEGORY_COLORS, getCategoryEmoji } from '../components/listing';

function getCategoryColor(cat: string | null): string {
    if (!cat) return '#64748b';
    for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
        if (cat.toLowerCase().includes(key.toLowerCase())) return color;
    }
    return '#64748b';
}

type SortKey = 'name' | 'category' | 'price' | 'is_active' | 'set' | 'created_at';
type SortDir = 'asc' | 'desc';

export function PackagesListScreen() {
    const router = useRouter();
    const { currentBrand } = useBrand();
    const currencyCode = currentBrand?.currency ?? DEFAULT_CURRENCY;
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [deleteTarget, setDeleteTarget] = useState<ServicePackage | null>(null);
    const packageLibraryQuery = usePackageLibraryData(currentBrand?.id);
    const deletePackageMutation = useDeleteServicePackage(currentBrand?.id);
    const packages = packageLibraryQuery.data?.packages ?? [];
    const sets = packageLibraryQuery.data?.packageSets ?? [];
    const isLoading = packageLibraryQuery.isLoading;

    const packageSetMap = useMemo(() => {
        const map = new Map<number, { setName: string; slotLabel: string; emoji: string }[]>();
        for (const set of sets) {
            for (const slot of set.slots) {
                if (slot.service_package_id) {
                    const existing = map.get(slot.service_package_id) || [];
                    existing.push({ setName: set.name, slotLabel: slot.slot_label, emoji: set.emoji });
                    map.set(slot.service_package_id, existing);
                }
            }
        }
        return map;
    }, [sets]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const rows = useMemo(() => {
        let list = packages;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.name?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q)
            );
        }
        const sorted = [...list].sort((a, b) => {
            let cmp = 0;
            switch (sortKey) {
                case 'name':
                    cmp = (a.name || '').localeCompare(b.name || '');
                    break;
                case 'category':
                    cmp = (a.category || '').localeCompare(b.category || '');
                    break;
                case 'price':
                    cmp = Number(a._totalCost ?? 0) - Number(b._totalCost ?? 0);
                    break;
                case 'is_active':
                    cmp = (a.is_active ? 1 : 0) - (b.is_active ? 1 : 0);
                    break;
                case 'set': {
                    const aInSet = packageSetMap.has(a.id) ? 1 : 0;
                    const bInSet = packageSetMap.has(b.id) ? 1 : 0;
                    cmp = aInSet - bInSet;
                    break;
                }
                case 'created_at':
                    cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return sorted;
    }, [packages, search, sortKey, sortDir, packageSetMap]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deletePackageMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
        } catch (err) {
            console.error('Failed to delete package', err);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 12 }}>
                <CircularProgress size={28} sx={{ color: '#648CFF' }} />
            </Box>
        );
    }

    const headCellSx = {
        color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' as const,
        letterSpacing: '0.5px', borderBottom: '1px solid rgba(148,163,184,0.1)',
        whiteSpace: 'nowrap' as const, py: 1.5,
    };

    const bodyCellSx = {
        borderBottom: '1px solid rgba(148,163,184,0.06)', py: 1.5,
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        width: 44, height: 44, borderRadius: 2.5,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(100, 140, 255, 0.1)', border: '1px solid rgba(100, 140, 255, 0.2)',
                    }}>
                        <InventoryIcon sx={{ fontSize: 22, color: '#648CFF' }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.5rem' }}>
                            All Packages
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                            {packages.length} package{packages.length !== 1 ? 's' : ''} in library
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    px: 1.5, py: 0.75, borderRadius: 2, minWidth: 260,
                    bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                    <SearchIcon sx={{ fontSize: 18, color: '#475569' }} />
                    <InputBase
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search packages…"
                        sx={{
                            flex: 1, fontSize: '0.8rem', color: '#e2e8f0',
                            '& ::placeholder': { color: '#475569' },
                        }}
                    />
                </Box>
            </Box>

            <TableContainer sx={{
                borderRadius: 2.5,
                bgcolor: 'rgba(15, 20, 25, 0.6)',
                border: '1px solid rgba(148,163,184,0.1)',
            }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {(['name', 'category'] as SortKey[]).map(key => (
                                <TableCell key={key} sx={headCellSx}>
                                    <TableSortLabel
                                        active={sortKey === key}
                                        direction={sortKey === key ? sortDir : 'asc'}
                                        onClick={() => handleSort(key)}
                                        sx={{ '& .MuiTableSortLabel-icon': { color: '#648CFF !important' } }}
                                    >
                                        {key === 'name' ? 'Name' : 'Category'}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                            <TableCell sx={headCellSx} align="right">
                                <TableSortLabel active={sortKey === 'price'} direction={sortKey === 'price' ? sortDir : 'asc'} onClick={() => handleSort('price')} sx={{ '& .MuiTableSortLabel-icon': { color: '#648CFF !important' } }}>Price</TableSortLabel>
                            </TableCell>
                            <TableCell sx={headCellSx} align="center">
                                <TableSortLabel active={sortKey === 'is_active'} direction={sortKey === 'is_active' ? sortDir : 'asc'} onClick={() => handleSort('is_active')} sx={{ '& .MuiTableSortLabel-icon': { color: '#648CFF !important' } }}>Active</TableSortLabel>
                            </TableCell>
                            <TableCell sx={headCellSx}>
                                <TableSortLabel active={sortKey === 'set'} direction={sortKey === 'set' ? sortDir : 'asc'} onClick={() => handleSort('set')} sx={{ '& .MuiTableSortLabel-icon': { color: '#648CFF !important' } }}>In Set</TableSortLabel>
                            </TableCell>
                            <TableCell sx={headCellSx}>
                                <TableSortLabel active={sortKey === 'created_at'} direction={sortKey === 'created_at' ? sortDir : 'asc'} onClick={() => handleSort('created_at')} sx={{ '& .MuiTableSortLabel-icon': { color: '#648CFF !important' } }}>Created</TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ ...headCellSx, width: 48 }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8, borderBottom: 'none' }}>
                                    <InventoryIcon sx={{ fontSize: 40, color: '#334155', mb: 1.5 }} />
                                    <Typography sx={{ color: '#475569', fontSize: '0.85rem' }}>
                                        {search ? 'No packages match your search' : 'No packages in your library yet'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : rows.map(pkg => {
                            const inSets = packageSetMap.get(pkg.id);
                            const catColor = getCategoryColor(pkg.category);

                            return (
                                <TableRow
                                    key={pkg.id}
                                    hover
                                    onClick={() => router.push(`/packages/${pkg.id}`)}
                                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' }, transition: 'background-color 0.15s ease' }}
                                >
                                    <TableCell sx={bodyCellSx}>
                                        <Typography sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.85rem', lineHeight: 1.3 }}>{pkg.name}</Typography>
                                        {pkg.description && (
                                            <Typography sx={{ color: '#64748b', fontSize: '0.7rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 320 }}>{pkg.description}</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={bodyCellSx}>
                                        {pkg.category ? (
                                            <Chip label={`${getCategoryEmoji(pkg.category)} ${pkg.category}`} size="small" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30`, borderRadius: 1.5, textTransform: 'uppercase', letterSpacing: '0.3px' }} />
                                        ) : (
                                            <Typography sx={{ color: '#475569', fontSize: '0.75rem' }}>—</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={bodyCellSx} align="right">
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography sx={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.85rem', fontFamily: 'monospace' }}>{formatCurrency(Number(pkg._tax?.totalWithTax ?? pkg._totalCost ?? 0), currencyCode)}</Typography>
                                            {(pkg._tax?.rate ?? 0) > 0 && <Typography sx={{ fontSize: '0.6rem', color: '#475569', fontFamily: 'monospace' }}>incl. {pkg._tax!.rate}% tax</Typography>}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={bodyCellSx} align="center">
                                        {pkg.is_active ? <CheckCircleIcon sx={{ fontSize: 18, color: '#10b981' }} /> : <CancelIcon sx={{ fontSize: 18, color: '#475569' }} />}
                                    </TableCell>
                                    <TableCell sx={bodyCellSx}>
                                        {inSets && inSets.length > 0 ? (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {inSets.map((s, i) => (
                                                    <Tooltip key={i} title={`${s.slotLabel} slot in ${s.setName}`} arrow>
                                                        <Chip icon={<LinkIcon sx={{ fontSize: '12px !important' }} />} label={`${s.emoji} ${s.slotLabel}`} size="small" sx={{ height: 22, fontSize: '0.6rem', fontWeight: 600, bgcolor: 'rgba(100, 140, 255, 0.08)', color: '#94a3b8', border: '1px solid rgba(100, 140, 255, 0.15)', borderRadius: 1.5, '& .MuiChip-icon': { color: '#648CFF' } }} />
                                                    </Tooltip>
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography sx={{ color: '#334155', fontSize: '0.75rem' }}>—</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={bodyCellSx}>
                                        <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>{new Date(pkg.created_at).toLocaleDateString()}</Typography>
                                    </TableCell>
                                    <TableCell sx={bodyCellSx} align="center">
                                        <Tooltip title="Delete package" arrow>
                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteTarget(pkg); }} sx={{ color: '#475569', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.08)' } }}>
                                                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={deleteTarget !== null} onClose={() => !deletePackageMutation.isPending && setDeleteTarget(null)} PaperProps={{ sx: { bgcolor: 'rgba(15, 20, 25, 0.97)', backgroundImage: 'none', border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: 2.5 } }}>
                <DialogTitle sx={{ color: '#f1f5f9', fontWeight: 700 }}>Delete Package</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        Are you sure you want to delete <strong style={{ color: '#f1f5f9' }}>{deleteTarget?.name}</strong>?
                        {packageSetMap.has(deleteTarget?.id ?? -1) && (
                            <Box component="span" sx={{ display: 'block', mt: 1, color: '#f59e0b', fontSize: '0.8rem' }}>
                                ⚠️ This package is currently assigned to a set slot. The slot will be cleared.
                            </Box>
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteTarget(null)} disabled={deletePackageMutation.isPending} sx={{ color: '#64748b', textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleDelete} disabled={deletePackageMutation.isPending} variant="contained" sx={{ bgcolor: '#ef4444', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#dc2626' } }}>
                        {deletePackageMutation.isPending ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
