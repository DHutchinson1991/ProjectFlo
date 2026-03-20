'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    IconButton,
    Chip,
    Alert,
    FormControl,
    Select,
    MenuItem,
    ListSubheader,
    Stack,
    Button,
    CircularProgress,
    Snackbar,
    Breadcrumbs,
    Link,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    ArrowBack,
    Videocam,
    Save,
    SwapHoriz,
    CheckCircle,
    WarningAmber,
} from '@mui/icons-material';
import { Inquiry } from '@/lib/types';
import { inquiriesService, api } from '@/lib/api';
import { getPackageStats } from '@/app/(studio)/designer/packages/_listing/_lib/helpers';
import { formatCurrency } from '@/lib/utils/formatUtils';
import InquirySchedulePreview from '../components/InquirySchedulePreview';

// ─── Types ───────────────────────────────────────────────────────────

interface PackageSetInfo {
    setName: string;
    setEmoji: string;
    tierLabel: string;
}

// ─── Page Component ──────────────────────────────────────────────────

export default function PackageReviewPage() {
    const params = useParams();
    const router = useRouter();
    const inquiryId = Number(params.id);

    // Data state
    const [inquiry, setInquiry] = useState<Inquiry | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Package selection state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [availablePackages, setAvailablePackages] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [packageSets, setPackageSets] = useState<any[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState<number | ''>('');
    const [saving, setSaving] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [packageSummary, setPackageSummary] = useState<any>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });
    const [swapDialogOpen, setSwapDialogOpen] = useState(false);

    // ─── Load inquiry ─────────────────────────────────────────────────

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await inquiriesService.getById(inquiryId);
            setInquiry(data);
            setSelectedPackageId(data.selected_package_id || '');
        } catch {
            setError('Failed to load inquiry details.');
        } finally {
            setLoading(false);
        }
    }, [inquiryId]);

    useEffect(() => {
        if (inquiryId) loadData();
    }, [inquiryId, loadData]);

    // ─── Load packages + package sets ────────────────────────────────

    useEffect(() => {
        if (inquiry?.brand_id) {
            api.servicePackages.getAll(inquiry.brand_id).then(setAvailablePackages).catch(console.error);
            api.packageSets.getAll(inquiry.brand_id).then(setPackageSets).catch(console.error);
        }
    }, [inquiry?.brand_id]);

    // Fetch package schedule summary whenever the dropdown selection changes (for live preview)
    useEffect(() => {
        if (!selectedPackageId) {
            setPackageSummary(null);
            return;
        }
        setSummaryLoading(true);
        api.schedule.packageSummary.get(Number(selectedPackageId))
            .then(setPackageSummary)
            .catch(() => setPackageSummary(null))
            .finally(() => setSummaryLoading(false));
    }, [selectedPackageId]);

    // ─── Derive active packages & grouping ───────────────────────────

    const { activePackageIds, packageSetInfoMap } = useMemo(() => {
        const ids = new Set<number>();
        const infoMap = new Map<number, PackageSetInfo>();

        for (const set of packageSets) {
            for (const slot of (set.slots ?? [])) {
                if (slot.service_package_id != null) {
                    ids.add(slot.service_package_id);
                    infoMap.set(slot.service_package_id, {
                        setName: set.name,
                        setEmoji: set.emoji ?? '📦',
                        tierLabel: slot.slot_label ?? '',
                    });
                }
            }
        }
        return { activePackageIds: ids, packageSetInfoMap: infoMap };
    }, [packageSets]);

    const activePackages = useMemo(
        () => availablePackages.filter((pkg) => activePackageIds.has(pkg.id)),
        [availablePackages, activePackageIds],
    );

    const groupedBySet = useMemo(() => {
        const groups: { setName: string; setEmoji: string; packages: typeof activePackages }[] = [];
        const groupMap = new Map<string, typeof activePackages>();

        for (const pkg of activePackages) {
            const info = packageSetInfoMap.get(pkg.id);
            const key = info ? `${info.setEmoji} ${info.setName}` : '📦 Other';
            if (!groupMap.has(key)) groupMap.set(key, []);
            groupMap.get(key)!.push(pkg);
        }

        for (const [label, pkgs] of groupMap) {
            const emoji = label.split(' ')[0];
            const name = label.slice(emoji.length + 1);
            groups.push({ setName: name, setEmoji: emoji, packages: pkgs });
        }
        return groups;
    }, [activePackages, packageSetInfoMap]);

    // ─── Derived data ────────────────────────────────────────────────

    const selectedPkg = activePackages.find((p) => p.id === Number(selectedPackageId))
        ?? availablePackages.find((p) => p.id === Number(selectedPackageId));
    const selectedSetInfo = selectedPackageId ? packageSetInfoMap.get(Number(selectedPackageId)) : null;

    const hasUnsavedChanges = inquiry
        ? (selectedPackageId || null) !== (inquiry.selected_package_id || null)
        : false;

    // ─── Save handler ────────────────────────────────────────────────

    const isSwap = !!inquiry?.source_package_id && !!selectedPackageId && selectedPackageId !== inquiry.selected_package_id;

    const handleSaveClick = () => {
        if (isSwap) {
            setSwapDialogOpen(true);
        } else {
            executeSave();
        }
    };

    const executeSave = async () => {
        if (!inquiry) return;
        setSwapDialogOpen(false);
        try {
            setSaving(true);
            await inquiriesService.update(inquiry.id, {
                selected_package_id: selectedPackageId ? Number(selectedPackageId) : null,
            });
            await loadData();
            setSnackbar({ open: true, message: isSwap ? 'Package swapped — user data preserved where roles matched' : 'Package updated successfully', severity: 'success' });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            setSnackbar({ open: true, message: `Failed to save: ${msg}`, severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // ─── Loading / Error ─────────────────────────────────────────────

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !inquiry) {
        return (
            <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
                <Alert severity="error">{error || 'Inquiry not found.'}</Alert>
                <Button sx={{ mt: 2 }} onClick={() => router.back()}>Go Back</Button>
            </Box>
        );
    }

    // ─── Render ──────────────────────────────────────────────────────

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1920, mx: 'auto' }}>
            {/* ── Header (matches designer packages page pattern) ── */}
            <Box sx={{ mb: 3 }}>
                <Breadcrumbs sx={{ mb: 1.5, '& .MuiBreadcrumbs-separator': { color: '#475569' } }}>
                    <Link underline="hover" sx={{ color: '#64748b' }} href={`/sales/inquiries/${inquiry.id}`}>
                        Inquiry
                    </Link>
                    <Typography sx={{ color: '#94a3b8' }}>Package Review</Typography>
                </Breadcrumbs>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton
                        onClick={() => router.push(`/sales/inquiries/${inquiry.id}`)}
                        sx={{ color: '#94a3b8' }}
                    >
                        <ArrowBack />
                    </IconButton>

                    {/* Title + set info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography
                                variant="h5"
                                sx={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.5rem', lineHeight: 1.2 }}
                            >
                                Package Review
                            </Typography>
                            {selectedSetInfo && (
                                <Chip
                                    label={`${selectedSetInfo.setEmoji} ${selectedSetInfo.setName} · ${selectedSetInfo.tierLabel}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ borderRadius: 1.5, height: 24, fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.12)' }}
                                />
                            )}
                        </Box>
                        {selectedPkg && (() => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const tax = (selectedPkg as any)._tax as { totalWithTax: number } | null | undefined;
                            const s = getPackageStats(selectedPkg);
                            const price = tax?.totalWithTax ?? (s.totalCost > 0 ? s.totalCost : Number(selectedPkg.base_price ?? 0));
                            return (
                                <Typography sx={{ fontSize: '0.85rem', color: '#64748b', mt: 0.25 }}>
                                    {selectedPkg.name}
                                    {price > 0 && ` · ${formatCurrency(price, selectedPkg.currency || 'GBP')}`}
                                </Typography>
                            );
                        })()}
                    </Box>

                    {/* Inline package selector */}
                    <FormControl size="small" sx={{ minWidth: 240 }}>
                        <Select
                            value={selectedPackageId}
                            displayEmpty
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onChange={(e) => setSelectedPackageId(e.target.value as any)}
                            renderValue={(val) => {
                                if (!val) return <Typography sx={{ color: '#475569', fontSize: '0.85rem' }}>Select package…</Typography>;
                                const pkg = activePackages.find(p => p.id === Number(val)) ?? availablePackages.find(p => p.id === Number(val));
                                return <Typography sx={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{pkg?.name ?? 'Unknown'}</Typography>;
                            }}
                            sx={{
                                color: '#e2e8f0',
                                bgcolor: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 2,
                                '&:hover': { borderColor: 'rgba(255,255,255,0.15)' },
                                '& .MuiSelect-icon': { color: '#64748b' },
                            }}
                            MenuProps={{
                                PaperProps: {
                                    sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 },
                                },
                            }}
                        >
                            <MenuItem value="">
                                <em style={{ color: '#64748b' }}>None</em>
                            </MenuItem>
                            {groupedBySet.length > 0 ? (
                                groupedBySet.flatMap((group) => [
                                    <ListSubheader
                                        key={`header-${group.setName}`}
                                        sx={{
                                            bgcolor: '#1a1d24',
                                            color: 'text.secondary',
                                            fontWeight: 600,
                                            fontSize: '0.7rem',
                                            lineHeight: '28px',
                                            letterSpacing: '0.05em',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {group.setEmoji} {group.setName}
                                    </ListSubheader>,
                                    ...group.packages.map((pkg) => {
                                        const info = packageSetInfoMap.get(pkg.id);
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        const tax = (pkg as any)._tax as { totalWithTax: number } | null | undefined;
                                        const pkgStats = getPackageStats(pkg);
                                        const pkgPrice = tax?.totalWithTax ?? (pkgStats.totalCost > 0 ? pkgStats.totalCost : Number(pkg.base_price ?? 0));
                                        return (
                                            <MenuItem key={pkg.id} value={pkg.id}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                    <Typography variant="body2">{pkg.name}</Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        {info?.tierLabel && (
                                                            <Chip
                                                                label={info.tierLabel}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ height: 20, fontSize: '0.7rem', borderRadius: 0.5 }}
                                                            />
                                                        )}
                                                        {pkgPrice > 0 && (
                                                            <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace', ml: 0.5 }}>
                                                                {formatCurrency(pkgPrice, pkg.currency || 'GBP')}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                        );
                                    }),
                                ])
                            ) : (
                                <MenuItem disabled>
                                    <Typography variant="body2" color="text.secondary">
                                        No active packages
                                    </Typography>
                                </MenuItem>
                            )}
                        </Select>
                    </FormControl>

                    {/* Save / Swap button */}
                    {hasUnsavedChanges && (
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : isSwap ? <SwapHoriz /> : <Save />}
                            onClick={handleSaveClick}
                            disabled={saving}
                            sx={{
                                bgcolor: isSwap ? '#f59e0b' : '#648CFF',
                                '&:hover': { bgcolor: isSwap ? '#d97706' : '#5A7BF0' },
                                borderRadius: 2,
                                px: 3,
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '0.9rem',
                            }}
                        >
                            {isSwap ? 'Swap Package' : 'Save'}
                        </Button>
                    )}
                </Box>
            </Box>

            {/* ── Package Schedule Preview (shown for unsaved draft selection) ── */}
            {selectedPackageId !== '' && hasUnsavedChanges && (
                <Box sx={{ mb: 2, px: 2.5, py: 1.75, borderRadius: 2, bgcolor: 'rgba(100,140,255,0.04)', border: '1px solid rgba(100,140,255,0.1)', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', minHeight: 42 }}>
                    {summaryLoading ? (
                        <CircularProgress size={14} sx={{ color: '#648CFF' }} />
                    ) : packageSummary?.has_schedule_data ? (
                        <>
                            {(packageSummary.event_day_names as string[]).map((name: string) => (
                                <Chip
                                    key={name}
                                    label={name}
                                    size="small"
                                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: 'rgba(100,140,255,0.1)', color: '#818cf8', border: '1px solid rgba(100,140,255,0.2)', borderRadius: 1 }}
                                />
                            ))}
                            <Box sx={{ width: '1px', height: 16, bgcolor: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
                            {[
                                { count: packageSummary.counts?.activities ?? 0, label: 'activities' },
                                { count: packageSummary.counts?.operators ?? 0, label: 'crew' },
                                { count: packageSummary.counts?.films ?? 0, label: 'films' },
                            ].filter((s) => s.count > 0).map(({ count, label }) => (
                                <Typography key={label} sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    <Box component="span" sx={{ color: '#94a3b8', fontWeight: 700, fontFamily: 'monospace' }}>{count}</Box>
                                    {' '}{label}
                                </Typography>
                            ))}
                        </>
                    ) : packageSummary && !packageSummary.has_schedule_data ? (
                        <Typography sx={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic' }}>
                            No schedule configured for this package
                        </Typography>
                    ) : null}
                </Box>
            )}

            {/* ── Schedule Editor (full width) ── */}
            {inquiry.selected_package_id ? (
                <InquirySchedulePreview inquiryId={inquiry.id} sourcePackageId={inquiry.selected_package_id} />
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 400,
                        borderRadius: 3,
                        border: '1px dashed rgba(52, 58, 68, 0.5)',
                        background: 'rgba(16, 18, 22, 0.4)',
                    }}
                >
                    <Stack alignItems="center" spacing={1.5} sx={{ color: 'text.secondary' }}>
                        <Videocam sx={{ fontSize: 48, opacity: 0.2 }} />
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            Select a package to view the schedule
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#475569' }}>
                            Choose a package from the dropdown above, then save to load the schedule editor.
                        </Typography>
                    </Stack>
                </Box>
            )}

            {/* Swap Confirmation Dialog */}
            <Dialog
                open={swapDialogOpen}
                onClose={() => setSwapDialogOpen(false)}
                PaperProps={{ sx: { bgcolor: '#1a1d23', borderRadius: 3, border: '1px solid rgba(100,140,255,0.15)', maxWidth: 440 } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 0.5 }}>
                    <SwapHoriz sx={{ color: '#f59e0b' }} />
                    Swap Package?
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                        This will replace the current schedule with the new package&apos;s template.
                    </Typography>
                    <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <CheckCircle sx={{ fontSize: 14 }} /> Preserved
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.8rem', pl: 2.5 }}>
                            Subject names, location details, crew assignments (matched by role), estimates, quotes, contracts, and calendar events.
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <WarningAmber sx={{ fontSize: 14 }} /> May change
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.8rem', pl: 2.5 }}>
                            Event days, activities, films, and operator slots will be recreated from the new package. Data is restored by matching role/position names — unmatched items will be lost.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setSwapDialogOpen(false)} sx={{ color: '#64748b', textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={executeSave}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SwapHoriz />}
                        sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, textTransform: 'none', fontWeight: 700 }}
                    >
                        Confirm Swap
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                message={snackbar.message}
            />
        </Box>
    );
}
