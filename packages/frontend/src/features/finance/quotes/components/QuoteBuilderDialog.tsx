'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, Dialog, Chip,
    Button, IconButton, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import {
    ReceiptLong, Close, Save, Send as SendIcon,
    Star, StarBorder, Delete,
    ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { useQuoteMutations } from '@/features/finance/quotes/hooks';
import { useInquiryEstimates } from '@/features/finance/estimates/hooks/use-estimates-api';
import { paymentSchedulesApi, usePaymentScheduleTemplates } from '@/features/finance/payment-schedules';
import { useBrand } from '@/features/platform/brand';
import { FinanceSummarySidebar } from '@/features/finance/shared';
import { computeTaxBreakdown, computeLineTotal } from '@/shared/utils/pricing';
import { formatCurrency, DEFAULT_CURRENCY } from '@projectflo/shared';
import LineItemEditor, { LineItem } from '@/features/workflow/inquiries/components/LineItemEditor';
import type { Quote, QuoteItem, QuotePaymentMilestone } from '../types';
import type { Estimate, EstimateItem } from '@/features/finance/estimates/types';
import type { FinanceMilestone } from '@/features/finance/shared/types';
import type { Inquiry } from '@/features/workflow/inquiries/types';

export interface QuoteBuilderDialogProps {
    open: boolean;
    onClose: () => void;
    inquiry: Inquiry;
    quote?: Quote | null;
    onSaved: (quoteId: number) => void;
    onDelete?: (quoteId: number) => void;
}

const ACCENT = '#ef4444';

const QuoteBuilderDialog: React.FC<QuoteBuilderDialogProps> = ({
    open, onClose, inquiry, quote, onSaved, onDelete,
}) => {
    const { currentBrand } = useBrand();
    const currency = currentBrand?.currency ?? DEFAULT_CURRENCY;

    const { createQuote, updateQuote } = useQuoteMutations(inquiry?.id);
    const { estimates: availableEstimates } = useInquiryEstimates(inquiry?.id);

    // Payment schedule
    const { data: allTemplates = [] } = usePaymentScheduleTemplates();
    const defaultTemplate = (() => {
        const prefId = inquiry.preferred_payment_schedule_template_id;
        const preferred = prefId ? allTemplates.find((t) => t.id === prefId) : null;
        return preferred ?? allTemplates.find((t) => t.is_default) ?? allTemplates[0] ?? null;
    })();

    // ── Form state ────────────────────────────────────────────────────────────
    const [editingQuote, setEditingQuote] = useState<Partial<Quote> | null>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [taxRate, setTaxRate] = useState<number>(0);
    const [depositRequired, setDepositRequired] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
    const [installments, setInstallments] = useState<number>(1);
    const [milestones, setMilestones] = useState<QuotePaymentMilestone[]>([]);
    const [consultationNotes, setConsultationNotes] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedEstimateId, setSelectedEstimateId] = useState<string>('');

    useEffect(() => {
        if (!open) return;

        if (quote) {
            // Edit mode
            setEditingQuote(quote);
            setConsultationNotes(quote.consultation_notes || '');
            setNotes(quote.notes || '');
            setTaxRate(Number(quote.tax_rate) || 0);
            setDepositRequired(Number(quote.deposit_required) || 0);
            setPaymentMethod(quote.payment_method || 'Bank Transfer');
            setInstallments(quote.installments || 1);
            setSelectedEstimateId('');
            const items = quote.items?.map((item: QuoteItem) => ({
                ...item,
                tempId: `item-${item.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                description: item.description || '',
                category: item.category || '',
                unit: item.unit || 'Qty',
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
                total: computeLineTotal(item.quantity, item.unit_price),
            })) || [];
            if (items.length === 0) {
                items.push({ tempId: `item-${Date.now()}`, description: '', category: '', quantity: 1, unit: 'Qty', unit_price: 0, total: 0 });
            }
            setLineItems(items);
            setMilestones([]);
            // Load milestones
            paymentSchedulesApi.getQuoteMilestones(quote.id)
                .then((ms) => setMilestones(ms || []))
                .catch(() => setMilestones([]));
        } else {
            // Create mode
            setEditingQuote(null);
            setConsultationNotes('');
            setNotes('');
            setTaxRate(Number(currentBrand?.default_tax_rate) || 0);
            setDepositRequired(0);
            setPaymentMethod(currentBrand?.default_payment_method || 'Bank Transfer');
            setInstallments(1);
            setSelectedEstimateId('');
            setMilestones([]);
            setLineItems([{ tempId: `item-${Date.now()}`, description: '', quantity: 1, unit: 'Qty', unit_price: 0, total: 0 }]);

            // Auto-import from primary estimate
            if (availableEstimates.length > 0) {
                const primaryEstimate = availableEstimates.find((e) => e.is_primary);
                if (primaryEstimate) {
                    setTimeout(() => {
                        setSelectedEstimateId(primaryEstimate.id.toString());
                        applyEstimate(primaryEstimate);
                        setEditingQuote({ title: `Quote from ${primaryEstimate.title || 'Estimate'}` });
                    }, 100);
                }
            }
        }
    }, [open, quote]);

    const applyEstimate = (estimate: Estimate) => {
        const newItems = estimate.items?.map((item: EstimateItem) => ({
            tempId: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            description: item.description || '',
            category: item.category || '',
            unit: item.unit || 'Qty',
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unit_price) || 0,
            total: computeLineTotal(item.quantity, item.unit_price),
        })) || [];
        setLineItems(newItems);
        setTaxRate(Number(estimate.tax_rate) || 0);
        setDepositRequired(Number(estimate.deposit_required) || 0);
        setPaymentMethod(estimate.payment_method || 'Bank Transfer');
        setInstallments(Number(estimate.installments) || 1);
        setNotes(estimate.notes || '');
        if (!editingQuote?.id) {
            setEditingQuote(prev => prev ? { ...prev, title: `Quote from ${estimate.title || 'Estimate'}` } : { title: `Quote from ${estimate.title || 'Estimate'}` });
        }
    };

    const handleApplyEstimate = (val: string | number) => {
        const estimateId = val?.toString() || '';
        if (!estimateId) {
            setLineItems([{ tempId: `item-${Date.now()}`, description: '', quantity: 1, unit: 'Qty', unit_price: 0, total: 0 }]);
            setTaxRate(0);
            setDepositRequired(0);
            setPaymentMethod('Bank Transfer');
            setInstallments(1);
            setNotes('');
            if (!editingQuote?.id) setEditingQuote(prev => prev ? { ...prev, title: '' } : prev);
            return;
        }
        const estimate = availableEstimates.find(e => e.id.toString() === estimateId);
        if (estimate) applyEstimate(estimate);
    };

    const subtotal = lineItems.reduce((acc, item) => acc + (item.total || 0), 0);
    const { total: totalAmount } = computeTaxBreakdown(subtotal, taxRate);

    const scheduleLabel = (() => {
        const tpl = allTemplates.find((t) => t.id === (defaultTemplate?.id ?? null));
        if (!tpl) return null;
        return `${tpl.name}${tpl.is_default ? ' (default)' : ''}`;
    })();

    const milestonesAsFinance: FinanceMilestone[] = milestones.map(m => ({
        label: m.label,
        amount: Number(m.amount),
        due_date: m.due_date ? new Date(m.due_date).toISOString() : undefined,
        status: m.status,
    }));

    const handleSave = async (statusOverride?: string) => {
        try {
            const currentStatus = typeof statusOverride === 'string' ? statusOverride : (editingQuote?.status || 'Draft');
            const quoteData = {
                quote_number: editingQuote?.quote_number || `QUO-${Date.now()}`,
                title: editingQuote?.title || 'New Quote',
                issue_date: editingQuote?.issue_date
                    ? new Date(editingQuote.issue_date).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                expiry_date: editingQuote?.expiry_date
                    ? new Date(editingQuote.expiry_date).toISOString().split('T')[0]
                    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tax_rate: taxRate,
                deposit_required: depositRequired,
                payment_method: paymentMethod,
                installments,
                status: currentStatus,
                consultation_notes: consultationNotes,
                notes,
                items: lineItems.map(item => ({
                    description: item.description,
                    category: item.category,
                    unit: item.unit,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                })),
            };

            let savedId: number | undefined;
            const isNew = !editingQuote?.id;

            if (editingQuote?.id) {
                await updateQuote.mutateAsync({ quoteId: editingQuote.id, data: quoteData });
                savedId = editingQuote.id;
            } else {
                const created = await createQuote.mutateAsync(quoteData);
                savedId = created?.id;
            }

            // Auto-apply default payment schedule template to new quotes
            if (isNew && savedId && defaultTemplate && inquiry.event_date) {
                try {
                    const eventDateStr = inquiry.event_date instanceof Date
                        ? inquiry.event_date.toISOString().split('T')[0]
                        : String(inquiry.event_date).split('T')[0];
                    const ms = await paymentSchedulesApi.applyToQuote(savedId, {
                        template_id: defaultTemplate.id,
                        booking_date: new Date().toISOString().split('T')[0],
                        event_date: eventDateStr,
                        total_amount: totalAmount,
                    });
                    setMilestones(ms || []);
                } catch { /* schedule apply is non-critical */ }
            }

            if (savedId) onSaved(savedId);
        } catch (err) {
            console.error('Error saving quote:', err);
            alert(`Failed to save quote: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleDuplicate = async () => {
        try {
            const quoteData = {
                quote_number: `QUO-${Date.now()}`,
                title: `${editingQuote?.title || 'Quote'} (Copy)`,
                issue_date: new Date().toISOString().split('T')[0],
                expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tax_rate: taxRate,
                deposit_required: depositRequired,
                payment_method: paymentMethod,
                installments,
                status: 'Draft',
                notes,
                consultation_notes: consultationNotes,
                items: lineItems.map(item => ({
                    description: item.description,
                    category: item.category,
                    unit: item.unit,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                })),
            };
            const created = await createQuote.mutateAsync(quoteData);
            if (created?.id) onSaved(created.id);
        } catch (err) {
            console.error('Error duplicating quote:', err);
            alert(`Failed to duplicate: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleDelete = () => {
        if (editingQuote?.id && onDelete) {
            onDelete(editingQuote.id);
        }
    };

    const handleSetPrimary = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!editingQuote?.id) return;
        try {
            await updateQuote.mutateAsync({ quoteId: editingQuote.id, data: { is_primary: true } });
        } catch (err) {
            console.error('Error setting primary:', err);
            alert(`Failed to set primary: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

            {/* Dialog Header */}
            <Box sx={{
                px: 3, py: 2,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                bgcolor: '#0d1629',
                borderBottom: '1px solid rgba(148,163,184,0.08)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <ReceiptLong sx={{ fontSize: 18, color: ACCENT }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#f1f5f9', lineHeight: 1.2 }}>
                            {editingQuote?.id ? 'Edit Quote' : 'Quote Builder'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                            {editingQuote?.title && <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>{editingQuote.title}</Typography>}
                            {editingQuote?.quote_number && <Chip label={editingQuote.quote_number} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: 'rgba(148,163,184,0.08)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.15)' }} />}
                            {editingQuote?.created_at && (
                                <Typography sx={{ fontSize: '0.65rem', color: '#334155' }}>
                                    Created {new Date(editingQuote.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    {editingQuote?.status && (
                        <Chip
                            label={editingQuote.status}
                            size="small"
                            sx={{
                                height: 22, fontSize: '0.65rem', fontWeight: 700,
                                bgcolor: editingQuote.status === 'Sent' ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.1)',
                                color: editingQuote.status === 'Sent' ? '#60a5fa' : '#94a3b8',
                                border: 'none',
                            }}
                        />
                    )}
                    {/* Import from Estimate dropdown (only for new quotes) */}
                    {!editingQuote?.id && availableEstimates.length > 0 && (
                        <Box sx={{ ml: 1, minWidth: 220 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel sx={{ fontSize: '0.78rem', color: '#475569 !important' }}>Import from Estimate...</InputLabel>
                                <Select
                                    value={selectedEstimateId}
                                    label="Import from Estimate..."
                                    onChange={(e) => {
                                        setSelectedEstimateId(e.target.value);
                                        handleApplyEstimate(e.target.value);
                                    }}
                                    renderValue={(selected) => {
                                        const est = availableEstimates.find(e => e.id.toString() === selected.toString());
                                        if (!est) return <em style={{ color: '#64748b' }}>None (Start Blank)</em>;
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {est.is_primary && <Star fontSize="small" sx={{ color: '#f59e0b', mr: 0.5, fontSize: 14 }} />}
                                                <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8' }}>{est.title || `Estimate #${est.estimate_number}`}</Typography>
                                            </Box>
                                        );
                                    }}
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.03)', fontSize: '0.82rem', color: '#94a3b8',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.1)' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT },
                                    }}
                                >
                                    <MenuItem value=""><em>None (Start Blank)</em></MenuItem>
                                    {availableEstimates.map(est => (
                                        <MenuItem key={est.id} value={est.id.toString()}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                {est.is_primary ? <Star fontSize="small" color="warning" /> : <Box sx={{ width: 20 }} />}
                                                <Box sx={{ flex: 1 }}>{est.title || `Estimate #${est.estimate_number}`}</Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatCurrency(Number(est.total_amount), currency, 0)}
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: '#475569', '&:hover': { color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                    <Close sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>

            {/* Main body */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, flex: 1, overflow: 'hidden' }}>
                {/* Left — Line items */}
                <Box sx={{ flex: 1, p: 3, overflowY: 'auto', bgcolor: '#090f1c' }}>
                    {/* Title field */}
                    <Box sx={{ mb: 3 }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.7px', mb: 0.75 }}>Title / Reference</Typography>
                        <TextField
                            placeholder='e.g. "Full Day Wedding Coverage"'
                            fullWidth
                            variant="standard"
                            value={editingQuote?.title || ''}
                            onChange={(e) => setEditingQuote({ ...editingQuote, title: e.target.value })}
                            InputProps={{ disableUnderline: false }}
                            sx={{
                                '& input': { fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9', pb: 0.75 },
                                '& .MuiInput-underline:before': { borderBottomColor: 'rgba(148,163,184,0.15)' },
                                '& .MuiInput-underline:hover:before': { borderBottomColor: 'rgba(148,163,184,0.3) !important' },
                                '& .MuiInput-underline:after': { borderBottomColor: ACCENT },
                            }}
                        />
                    </Box>

                    {/* Consultation Notes */}
                    <Box sx={{ mb: 3 }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.7px', mb: 0.75 }}>Consultation Notes</Typography>
                        <TextField
                            value={consultationNotes}
                            onChange={(e) => setConsultationNotes(e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Key requirements from consultation..."
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

                    {/* Section label */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Cost Breakdown</Typography>
                        <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(148,163,184,0.07)' }} />
                    </Box>

                    <LineItemEditor items={lineItems} onChange={setLineItems} currency={currency} />

                    {/* Notes */}
                    <Box sx={{ mt: 4 }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.7px', mb: 0.75 }}>Internal Notes</Typography>
                        <TextField
                            multiline
                            rows={3}
                            fullWidth
                            placeholder="Payment terms, special requirements, etc..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
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
                    depositRequired={depositRequired}
                    onDepositRequiredChange={setDepositRequired}
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                    installments={installments}
                    onInstallmentsChange={setInstallments}
                    currency={currency}
                    accentColor={ACCENT}
                    milestones={milestonesAsFinance}
                    previewTemplate={milestones.length === 0 ? defaultTemplate : undefined}
                    scheduleLabel={scheduleLabel ?? undefined}
                    scheduleEmptyMessage="No schedule configured — add one in Settings"
                />
            </Box>

            {/* Footer */}
            <Box sx={{
                px: 3, py: 2,
                borderTop: '1px solid rgba(148,163,184,0.08)',
                display: 'flex', alignItems: 'center', gap: 1.5,
                bgcolor: '#0a1020',
            }}>
                {editingQuote?.id && (
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
                        {!editingQuote?.is_primary ? (
                            <Button
                                onClick={handleSetPrimary}
                                startIcon={<StarBorder sx={{ fontSize: '0.85rem !important' }} />}
                                size="small"
                                sx={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'none', '&:hover': { color: '#f59e0b', bgcolor: 'rgba(245,158,11,0.06)' } }}
                            >
                                Make Primary
                            </Button>
                        ) : (
                            <Chip icon={<Star sx={{ fontSize: '0.8rem !important', color: '#f59e0b !important' }} />} label="Primary" size="small"
                                sx={{ height: 24, fontSize: '0.65rem', bgcolor: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }} />
                        )}
                    </Box>
                )}
                <Box sx={{ flex: 1 }} />
                <Button
                    onClick={onClose}
                    size="small"
                    sx={{ color: '#475569', fontSize: '0.78rem', textTransform: 'none', '&:hover': { color: '#64748b', bgcolor: 'rgba(255,255,255,0.04)' } }}
                >
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
                        '&:hover': { bgcolor: '#dc2626' },
                        boxShadow: `0 0 20px ${ACCENT}40`,
                    }}
                >
                    Send Quote
                </Button>
            </Box>
        </Dialog>
    );
};

export default QuoteBuilderDialog;
