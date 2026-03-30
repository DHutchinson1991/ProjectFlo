'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, Dialog, Chip,
    Button, IconButton, Tooltip,
} from '@mui/material';
import {
    ReceiptLong, Close, Save, Send as SendIcon,
    Star, StarBorder, Delete,
    ContentCopy as ContentCopyIcon, Sync,
} from '@mui/icons-material';
import { useCreateEstimate, useUpdateEstimate, useRefreshEstimateCosts } from '@/features/finance/estimates';
import { paymentSchedulesApi, usePaymentScheduleTemplates } from '@/features/finance/payment-schedules';
import { useBrand } from '@/features/platform/brand';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { FinanceSummarySidebar } from '@/features/finance/shared';
import { computeTaxBreakdown, computeLineTotal } from '@/shared/utils/pricing';
import LineItemEditor, { LineItem } from '@/features/workflow/inquiries/components/LineItemEditor';
import type { Estimate, EstimateItem, EstimatePaymentMilestone } from '../types';
import type { Inquiry } from '@/features/workflow/inquiries/types';

export interface EstimateBuilderDialogProps {
    open: boolean;
    onClose: () => void;
    inquiry: Inquiry;
    /** Edit mode: pass an existing estimate. Create mode: pass null. */
    estimate?: Estimate | null;
    /** Pre-computed items + title for new estimates (from useEstimateAutoGen). */
    createPayload?: { initialLineItems: LineItem[]; initialTitle: string } | null;
    onSaved: (estimateId: number) => void;
    onDelete?: (estimateId: number) => Promise<void>;
    onRefresh?: () => Promise<void>;
}

const ACCENT = '#10b981';

const EstimateBuilderDialog: React.FC<EstimateBuilderDialogProps> = ({
    open, onClose, inquiry, estimate, createPayload, onSaved, onDelete, onRefresh,
}) => {
    const { currentBrand } = useBrand();
    const currency = currentBrand?.currency ?? DEFAULT_CURRENCY;

    const createMutation = useCreateEstimate(inquiry?.id);
    const updateMutation = useUpdateEstimate(inquiry?.id);
    const refreshMutation = useRefreshEstimateCosts(inquiry?.id);

    // Payment schedule
    const { data: allTemplates = [] } = usePaymentScheduleTemplates();
    const defaultTemplate = (() => {
        const prefId = inquiry.preferred_payment_schedule_template_id;
        const preferred = prefId ? allTemplates.find((t) => t.id === prefId) : null;
        return preferred ?? allTemplates.find((t) => t.is_default) ?? allTemplates[0] ?? null;
    })();

    // ── Form state (initialised/reset when dialog opens) ──────────────────────
    const [editingEstimate, setEditingEstimate] = useState<Partial<Estimate> | null>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [taxRate, setTaxRate] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
    const [milestones, setMilestones] = useState<EstimatePaymentMilestone[]>([]);
    const [dialTemplateId, setDialTemplateId] = useState<number | null>(null);

    useEffect(() => {
        if (!open) return;

        if (estimate) {
            // Edit mode
            setEditingEstimate(estimate);
            const items = (estimate.items || []).map((item) => ({
                ...item,
                tempId: `item-${item.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                service_date: item.service_date ? new Date(item.service_date).toISOString().split('T')[0] : '',
                start_time: item.start_time || '',
                end_time: item.end_time || '',
                category: item.category || '',
                unit: item.unit || 'Qty',
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
                total: computeLineTotal(item.quantity, item.unit_price),
            }));
            setLineItems(items.length > 0 ? items : [{ tempId: `item-${Date.now()}`, description: '', service_date: '', start_time: '', end_time: '', category: '', quantity: 1, unit: 'Qty', unit_price: 0, total: 0 }]);
            setTaxRate(Number(estimate.tax_rate) || 0);
            setPaymentMethod(estimate.payment_method || 'Bank Transfer');
            setMilestones([]);
            setDialTemplateId(
                estimate.schedule_template_id
                ?? inquiry.preferred_payment_schedule_template_id
                ?? defaultTemplate?.id
                ?? null,
            );
            // Load existing milestones
            paymentSchedulesApi.getMilestones(estimate.id)
                .then((ms) => setMilestones(ms || []))
                .catch(() => setMilestones([]));
        } else {
            // Create mode
            setEditingEstimate(createPayload?.initialTitle ? { title: createPayload.initialTitle } : null);
            setLineItems(createPayload?.initialLineItems ?? [{ tempId: `item-${Date.now()}`, description: '', quantity: 1, unit: 'Qty', unit_price: 0, total: 0 }]);
            setTaxRate(Number(currentBrand?.default_tax_rate) || 0);
            setPaymentMethod(currentBrand?.default_payment_method || 'Bank Transfer');
            setMilestones([]);
            setDialTemplateId(
                inquiry.preferred_payment_schedule_template_id
                ?? defaultTemplate?.id
                ?? null,
            );
        }
    }, [open, estimate, createPayload]);  

    const subtotal = lineItems.reduce((acc, item) => acc + (item.total || 0), 0);
    const { total: totalAmount } = computeTaxBreakdown(subtotal, taxRate);

    const scheduleLabel = (() => {
        const tpl = allTemplates.find((t) => t.id === dialTemplateId);
        if (!tpl) return null;
        return `${tpl.name}${tpl.is_default ? ' (default)' : ''}`;
    })();

    const handleSave = async (statusOverride?: string) => {
        try {
            const currentStatus = typeof statusOverride === 'string' ? statusOverride : (editingEstimate?.status || 'Draft');
            const estimateData = {
                estimate_number: editingEstimate?.estimate_number || undefined,
                title: editingEstimate?.title || undefined,
                issue_date: editingEstimate?.issue_date
                    ? new Date(editingEstimate.issue_date).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                expiry_date: editingEstimate?.expiry_date
                    ? new Date(editingEstimate.expiry_date).toISOString().split('T')[0]
                    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tax_rate: taxRate,
                deposit_required: 0,
                payment_method: paymentMethod,
                installments: 1,
                status: currentStatus,
                notes: editingEstimate?.notes,
                terms: editingEstimate?.terms,
                items: lineItems.map((item) => ({
                    description: item.description,
                    category: item.category,
                    service_date: item.service_date ? new Date(item.service_date) : undefined,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    unit: item.unit,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                })),
            };

            let savedId: number | undefined;
            if (editingEstimate?.id) {
                await updateMutation.mutateAsync({ estimateId: editingEstimate.id, data: estimateData });
                savedId = editingEstimate.id;
            } else {
                const created = await createMutation.mutateAsync(estimateData);
                savedId = created?.id;
            }

            if (savedId && dialTemplateId && inquiry.event_date) {
                try {
                    const eventDateStr = inquiry.event_date instanceof Date
                        ? inquiry.event_date.toISOString().split('T')[0]
                        : String(inquiry.event_date).split('T')[0];
                    const ms = await paymentSchedulesApi.applyToEstimate(savedId, {
                        template_id: dialTemplateId,
                        booking_date: new Date().toISOString().split('T')[0],
                        event_date: eventDateStr,
                        total_amount: totalAmount,
                    });
                    setMilestones(ms || []);
                } catch { /* schedule apply is non-critical */ }
            }

            onClose();
            if (savedId) onSaved(savedId);
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error saving estimate:', err);
            alert(`Failed to save estimate: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleDuplicate = async () => {
        try {
            const estimateData = {
                title: `${editingEstimate?.title || 'Estimate'} (Copy)`,
                issue_date: new Date().toISOString().split('T')[0],
                expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tax_rate: taxRate,
                deposit_required: 0,
                payment_method: paymentMethod,
                installments: 1,
                status: 'Draft',
                notes: editingEstimate?.notes,
                items: lineItems.map((item) => ({
                    description: item.description, category: item.category,
                    service_date: item.service_date ? new Date(item.service_date) : undefined,
                    start_time: item.start_time, end_time: item.end_time,
                    unit: item.unit, quantity: Number(item.quantity), unit_price: Number(item.unit_price),
                })),
            };
            const created = await createMutation.mutateAsync(estimateData);
            onClose();
            if (created?.id) onSaved(created.id);
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error duplicating estimate:', err);
            alert(`Failed to duplicate: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleDelete = async () => {
        if (!editingEstimate?.id || !onDelete) return;
        if (!confirm('Are you sure you want to delete this estimate? This action cannot be undone.')) return;
        try {
            await onDelete(editingEstimate.id);
            onClose();
        } catch (err) {
            console.error('Error deleting estimate:', err);
            alert(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleSetPrimary = async (estimateId: number) => {
        try {
            await updateMutation.mutateAsync({ estimateId, data: { is_primary: true } });
            setEditingEstimate((prev) => prev ? { ...prev, is_primary: true } : prev);
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error setting primary:', err);
            alert(`Failed to set primary: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleRefreshInDialog = async () => {
        if (!editingEstimate?.id) return;
        try {
            const refreshed = await refreshMutation.mutateAsync(editingEstimate.id);
            setEditingEstimate((prev) => ({
                ...prev,
                version: refreshed.version,
                title: refreshed.title || prev?.title,
                total_amount: refreshed.total_amount,
                is_stale: false,
            }));
            const items = (refreshed.items || []).map((item: EstimateItem) => ({
                ...item,
                tempId: `item-${item.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                service_date: item.service_date ? new Date(item.service_date).toISOString().split('T')[0] : '',
                start_time: item.start_time || '',
                end_time: item.end_time || '',
                category: item.category || '',
                unit: item.unit || 'Qty',
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
                total: computeLineTotal(item.quantity, item.unit_price),
            }));
            setLineItems(items.length > 0 ? items : [{ tempId: `item-${Date.now()}`, description: '', quantity: 1, unit: 'Qty', unit_price: 0, total: 0 }]);
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error refreshing costs:', err);
            alert(`Failed to refresh costs: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: {
                    maxHeight: '90vh', height: 'auto',
                    bgcolor: '#090f1c',
                    display: 'flex', flexDirection: 'column',
                    border: '1px solid rgba(148,163,184,0.1)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                },
            }}
        >
            {/* Top accent bar */}
            <Box sx={{ height: 3, background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT}60)` }} />

            {/* Header */}
            <Box sx={{
                px: 3, py: 2,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                bgcolor: '#0d1629',
                borderBottom: '1px solid rgba(148,163,184,0.08)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <ReceiptLong sx={{ fontSize: 18, color: ACCENT }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#f1f5f9', lineHeight: 1.2 }}>
                            {editingEstimate?.id ? 'Edit Estimate' : 'Estimate Builder'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                            {editingEstimate?.title && (
                                <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>{editingEstimate.title}</Typography>
                            )}
                            {editingEstimate?.estimate_number && (
                                <Chip label={editingEstimate.estimate_number} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: 'rgba(148,163,184,0.08)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.15)' }} />
                            )}
                            {editingEstimate?.id && (editingEstimate?.version ?? 1) > 1 && (
                                <Chip label={`v${editingEstimate.version}`} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: 'none' }} />
                            )}
                            {editingEstimate?.created_at && (
                                <Typography sx={{ fontSize: '0.65rem', color: '#334155' }}>
                                    Created {new Date(editingEstimate.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    {editingEstimate?.status && (
                        <Chip
                            label={editingEstimate.status}
                            size="small"
                            sx={{
                                height: 22, fontSize: '0.65rem', fontWeight: 700,
                                bgcolor: editingEstimate.status === 'Sent' ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.1)',
                                color: editingEstimate.status === 'Sent' ? '#60a5fa' : '#94a3b8',
                                border: 'none',
                            }}
                        />
                    )}
                    {editingEstimate?.id && editingEstimate?.status === 'Draft' && (
                        <Tooltip title={editingEstimate.is_stale ? '⚠ Package updated — costs may be stale. Click to sync.' : 'Refresh costs from current package'}>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <IconButton size="small" onClick={handleRefreshInDialog} sx={{ p: 0.5, color: editingEstimate.is_stale ? '#f59e0b' : '#475569', '&:hover': { color: editingEstimate.is_stale ? '#f97316' : '#06b6d4' } }}>
                                    <Sync sx={{ fontSize: 17 }} />
                                </IconButton>
                                {editingEstimate.is_stale && (
                                    <Box sx={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, backgroundColor: '#f59e0b', borderRadius: '50%', border: '1px solid white' }} />
                                )}
                            </Box>
                        </Tooltip>
                    )}
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: '#475569', '&:hover': { color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                    <Close sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>

            {/* Body */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, flex: 1, overflow: 'hidden' }}>
                {/* Left — Line items */}
                <Box sx={{ flex: 1, p: 3, overflowY: 'auto', bgcolor: '#090f1c' }}>
                    {/* Title */}
                    <Box sx={{ mb: 3 }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.7px', mb: 0.75 }}>Title / Reference</Typography>
                        <TextField
                            placeholder='e.g. "Full Day Wedding Coverage"'
                            fullWidth variant="standard"
                            value={editingEstimate?.title || ''}
                            onChange={(e) => setEditingEstimate({ ...editingEstimate, title: e.target.value })}
                            InputProps={{ disableUnderline: false }}
                            sx={{
                                '& input': { fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9', pb: 0.75 },
                                '& .MuiInput-underline:before': { borderBottomColor: 'rgba(148,163,184,0.15)' },
                                '& .MuiInput-underline:hover:before': { borderBottomColor: 'rgba(148,163,184,0.3) !important' },
                                '& .MuiInput-underline:after': { borderBottomColor: ACCENT },
                            }}
                        />
                    </Box>

                    {/* Section label */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Cost Breakdown</Typography>
                        <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(148,163,184,0.07)' }} />
                        <Typography sx={{ fontSize: '0.6rem', color: '#334155', fontStyle: 'italic' }}>auto-generated from package</Typography>
                    </Box>

                    <LineItemEditor items={lineItems} onChange={setLineItems} currency={currency} readOnly={true} />

                    {/* Notes */}
                    <Box sx={{ mt: 4 }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.7px', mb: 0.75 }}>Internal Notes</Typography>
                        <TextField
                            multiline rows={3} fullWidth
                            placeholder="Payment terms, special requirements, etc..."
                            value={editingEstimate?.notes || ''}
                            onChange={(e) => setEditingEstimate({ ...editingEstimate, notes: e.target.value })}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'rgba(255,255,255,0.02)', fontSize: '0.82rem',
                                    '& fieldset': { borderColor: 'rgba(148,163,184,0.1)' },
                                    '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.2)' },
                                    '&.Mui-focused fieldset': { borderColor: ACCENT },
                                },
                                '& textarea': { color: '#94a3b8' },
                            }}
                        />
                    </Box>
                </Box>

                {/* Right — Financial Summary sidebar */}
                <FinanceSummarySidebar
                    subtotal={subtotal}
                    totalAmount={totalAmount}
                    taxRate={taxRate}
                    onTaxRateChange={setTaxRate}
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                    currency={currency}
                    accentColor={ACCENT}
                    milestones={milestones}
                    previewTemplate={allTemplates.find((t) => t.id === dialTemplateId) ?? null}
                    scheduleLabel={scheduleLabel}
                    scheduleEmptyMessage={dialTemplateId ? 'No rules defined for this template.' : 'No schedule selected.'}
                />
            </Box>

            {/* Footer */}
            <Box sx={{
                px: 3, py: 2,
                borderTop: '1px solid rgba(148,163,184,0.08)',
                display: 'flex', alignItems: 'center', gap: 1.5,
                bgcolor: '#0a1020',
            }}>
                {editingEstimate?.id && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            onClick={handleDuplicate}
                            startIcon={<ContentCopyIcon sx={{ fontSize: '0.85rem !important' }} />}
                            size="small"
                            sx={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'none', '&:hover': { color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.04)' } }}
                        >
                            Duplicate
                        </Button>
                        <Button
                            onClick={handleDelete}
                            startIcon={<Delete sx={{ fontSize: '0.85rem !important' }} />}
                            size="small"
                            sx={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'none', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.06)' } }}
                        >
                            Delete
                        </Button>
                        {!editingEstimate?.is_primary ? (
                            <Button
                                onClick={() => handleSetPrimary(editingEstimate.id!)}
                                startIcon={<StarBorder sx={{ fontSize: '0.85rem !important' }} />}
                                size="small"
                                sx={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'none', '&:hover': { color: '#f59e0b', bgcolor: 'rgba(245,158,11,0.06)' } }}
                            >
                                Make Primary
                            </Button>
                        ) : (
                            <Chip
                                icon={<Star sx={{ fontSize: '0.8rem !important', color: '#f59e0b !important' }} />}
                                label="Primary" size="small"
                                sx={{ height: 24, fontSize: '0.65rem', bgcolor: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
                            />
                        )}
                    </Box>
                )}
                <Box sx={{ flex: 1 }} />
                <Button onClick={onClose} size="small" sx={{ color: '#475569', fontSize: '0.78rem', textTransform: 'none', '&:hover': { color: '#64748b', bgcolor: 'rgba(255,255,255,0.04)' } }}>
                    Cancel
                </Button>
                <Button
                    onClick={() => handleSave('Draft')}
                    variant="outlined"
                    startIcon={<Save sx={{ fontSize: '0.9rem !important' }} />}
                    size="small"
                    sx={{
                        borderColor: 'rgba(148,163,184,0.2)', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'none',
                        '&:hover': { borderColor: 'rgba(148,163,184,0.35)', bgcolor: 'rgba(255,255,255,0.04)' },
                    }}
                >
                    Save Draft
                </Button>
                <Button
                    onClick={() => handleSave('Sent')}
                    variant="contained"
                    endIcon={<SendIcon sx={{ fontSize: '0.9rem !important' }} />}
                    size="small"
                    sx={{
                        bgcolor: ACCENT, color: '#fff', fontSize: '0.78rem', textTransform: 'none', fontWeight: 700,
                        '&:hover': { bgcolor: '#059669' },
                        boxShadow: `0 0 20px ${ACCENT}40`,
                    }}
                >
                    Send Estimate
                </Button>
            </Box>
        </Dialog>
    );
};

export default EstimateBuilderDialog;
