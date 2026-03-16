'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, CardContent, Button, Stack, TextField, Dialog,
    IconButton, FormControl, InputLabel, Select, MenuItem,
    Chip, Collapse, InputAdornment, Tooltip,
} from '@mui/material';
import {
    AttachMoney, Add, Edit, Save, Send as SendIcon, Delete,
    Star, StarBorder, ExpandLess, ExpandMore,
    ContentCopy as ContentCopyIcon, Close, ReceiptLong,
} from '@mui/icons-material';
import { estimatesService, quotesService, api } from '@/lib/api';
import { useBrand } from '@/app/providers/BrandProvider';
import { Estimate, EstimateItem, Quote, QuoteItem } from '@/lib/types';
import type { PaymentScheduleTemplate, QuotePaymentMilestone } from '@/lib/types';
import { getCurrencySymbol } from '@/lib/utils/formatUtils';
import LineItemEditor, { LineItem } from '../../components/LineItemEditor';
import type { WorkflowCardProps } from '../_lib';
import { WorkflowCard } from './WorkflowCard';

const QuotesCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const { currentBrand } = useBrand();

    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<Partial<Quote> | null>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);

    // Payment schedule state
    const [defaultTemplate, setDefaultTemplate] = useState<PaymentScheduleTemplate | null>(null);
    const [milestones, setMilestones] = useState<QuotePaymentMilestone[]>([]);

    // Import sources
    const [availableEstimates, setAvailableEstimates] = useState<Estimate[]>([]);
    const [selectedEstimateId, setSelectedEstimateId] = useState<string>('');

    // Financial State
    const [taxRate, setTaxRate] = useState<number>(0);
    const [depositRequired, setDepositRequired] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
    const [installments, setInstallments] = useState<number>(1);
    const [currencySymbol, setCurrencySymbol] = useState<string>('$');
    const [consultationNotes, setConsultationNotes] = useState('');
    const [notes, setNotes] = useState('');

    // Sync currency symbol whenever the brand changes
    useEffect(() => {
        if (currentBrand?.currency) {
            setCurrencySymbol(getCurrencySymbol(currentBrand.currency));
        }
    }, [currentBrand?.currency]);

    // Load default payment schedule template for the brand
    useEffect(() => {
        if (!currentBrand?.id) return;
        api.paymentSchedules.getDefault(currentBrand.id)
            .then(setDefaultTemplate)
            .catch(() => { /* no default template set */ });
    }, [currentBrand?.id]);

    const loadMilestones = async (quoteId: number) => {
        try {
            const ms = await api.paymentSchedules.getQuoteMilestones(quoteId);
            setMilestones(ms || []);
        } catch {
            setMilestones([]);
        }
    };

    // Accordion state
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const autoExpandIdRef = useRef<number | null>(null);

    // Auto-expand effect
    useEffect(() => {
        if (quotes.length > 0) {
            if (autoExpandIdRef.current) {
                const targetId = autoExpandIdRef.current;
                const exists = quotes.find(q => q.id === targetId);
                if (exists) {
                    setExpandedId(targetId);
                    autoExpandIdRef.current = null;
                    return;
                }
            }
            const primary = quotes.find((q) => q.is_primary);
            if (primary) {
                setExpandedId(primary.id);
            }
        }
    }, [quotes]);

    useEffect(() => {
        const fetchQuotes = async () => {
            if (inquiry?.id) {
                try {
                    const quotesData = await quotesService.getAllByInquiry(inquiry.id);
                    setQuotes(quotesData || []);
                } catch (error) {
                    console.error('Error fetching quotes:', error);
                    setQuotes([]);
                }
            }
        };
        fetchQuotes();
    }, [inquiry?.id]);

    const fetchEstimates = async () => {
        if (!inquiry?.id) return [];
        try {
            const estimates = await estimatesService.getAllByInquiry(inquiry.id);
            setAvailableEstimates(estimates || []);
            return estimates;
        } catch (error) {
            console.error('Error fetching estimates for import:', error);
            return [];
        }
    };

    const handleApplyEstimate = (val: string | number) => {
        const estimateId = val?.toString() || '';

        if (!estimateId) {
            setLineItems([{
                tempId: `item-${Date.now()}`,
                description: '',
                quantity: 1,
                unit: 'Qty',
                unit_price: 0,
                total: 0
            }]);
            setTaxRate(0);
            setDepositRequired(0);
            setPaymentMethod('Bank Transfer');
            setInstallments(1);
            setNotes('');
            if (!editingQuote?.id) {
                setEditingQuote(prev => prev ? { ...prev, title: '' } : prev);
            }
            return;
        }

        const estimate = availableEstimates.find(e => e.id.toString() === estimateId);
        if (estimate) {
            const newItems = estimate.items?.map((item: EstimateItem) => ({
                tempId: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                description: item.description || '',
                category: item.category || '',
                unit: item.unit || 'Qty',
                quantity: Number(item.quantity) || 1,
                unit_price: Number(item.unit_price) || 0,
                total: (Number(item.quantity) * Number(item.unit_price))
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
        }
    };

    const handleCreate = async () => {
        setEditingQuote(null);
        setLineItems([{
            tempId: `item-${Date.now()}`,
            description: '',
            quantity: 1,
            unit: 'Qty',
            unit_price: 0,
            total: 0
        }]);
        setConsultationNotes('');
        setNotes('');
        setTaxRate(Number(currentBrand?.default_tax_rate) || 0);
        setDepositRequired(0);
        setPaymentMethod(currentBrand?.default_payment_method || 'Bank Transfer');
        setInstallments(1);
        setSelectedEstimateId('');
        setMilestones([]);
        setDialogOpen(true);

        const estimates = await fetchEstimates();
        if (estimates && estimates.length > 0) {
            const primaryEstimate = estimates.find((e) => e.is_primary);
            if (primaryEstimate) {
                setTimeout(() => {
                    setSelectedEstimateId(primaryEstimate.id.toString());
                    handleApplyEstimate(primaryEstimate.id.toString());
                    setEditingQuote({ title: `Quote from ${primaryEstimate.title || 'Estimate'}` });
                }, 100);
            }
        }
    };

    const handleEdit = (quote: Quote) => {
        setEditingQuote(quote);
        setCurrencySymbol(getCurrencySymbol(currentBrand?.currency || 'USD'));
        setConsultationNotes(quote.consultation_notes || '');
        setNotes(quote.notes || '');
        setTaxRate(Number(quote.tax_rate) || 0);
        setDepositRequired(Number(quote.deposit_required) || 0);
        setPaymentMethod(quote.payment_method || 'Bank Transfer');
        setInstallments(quote.installments || 1);

        const items = quote.items?.map((item: QuoteItem) => ({
            ...item,
            tempId: `item-${item.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            description: item.description || '',
            category: item.category || '',
            unit: item.unit || 'Qty',
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            total: (Number(item.quantity) * Number(item.unit_price))
        })) || [];

        if (items.length === 0) {
            items.push({
                tempId: `item-${Date.now()}`,
                description: '',
                category: '',
                quantity: 1,
                unit: 'Qty',
                unit_price: 0,
                total: 0
            });
        }

        setLineItems(items);
        setMilestones([]);
        setDialogOpen(true);
        loadMilestones(quote.id);
    };

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
                installments: installments,
                status: currentStatus,
                consultation_notes: consultationNotes,
                notes: notes,
                items: lineItems.map(item => ({
                    description: item.description,
                    category: item.category,
                    unit: item.unit,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price)
                }))
            };

            let savedId: number | undefined;
            const isNew = !editingQuote?.id;

            if (editingQuote && editingQuote.id) {
                await quotesService.update(inquiry.id, editingQuote.id, quoteData);
                savedId = editingQuote.id;
            } else {
                const created = await quotesService.create(inquiry.id, quoteData);
                savedId = created?.id;
            }

            // Auto-apply default payment schedule template to new quotes
            if (isNew && savedId && defaultTemplate && inquiry.event_date) {
                try {
                    const ms = await api.paymentSchedules.applyToQuote(savedId, {
                        template_id: defaultTemplate.id,
                        booking_date: new Date().toISOString().split('T')[0],
                        event_date: typeof inquiry.event_date === 'string'
                            ? inquiry.event_date.split('T')[0]
                            : new Date(inquiry.event_date as unknown as string).toISOString().split('T')[0],
                        total_amount: totalAmount,
                    });
                    setMilestones(ms || []);
                } catch { /* schedule apply is non-critical */ }
            }

            setDialogOpen(false);

            try {
                if (savedId) {
                    autoExpandIdRef.current = Number(savedId);
                }
                const updatedQuotes = await quotesService.getAllByInquiry(inquiry.id);
                setQuotes(updatedQuotes || []);
            } catch (error) {
                console.error('Error refreshing quotes:', error);
            }

            if (onRefresh) await onRefresh();
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
                installments: installments,
                status: 'Draft',
                notes: notes,
                consultation_notes: consultationNotes,
                items: lineItems.map(item => ({
                    description: item.description,
                    category: item.category,
                    unit: item.unit,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price)
                }))
            };

            const created = await quotesService.create(inquiry.id, quoteData);
            setDialogOpen(false);

            if (created?.id) {
                autoExpandIdRef.current = Number(created.id);
            }

            const updatedQuotes = await quotesService.getAllByInquiry(inquiry.id);
            setQuotes(updatedQuotes || []);

            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error duplicating quote:', err);
            alert(`Failed to duplicate: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleDelete = async (quoteId: number) => {
        if (!confirm('Are you sure you want to delete this quote? This action cannot be undone.')) return;
        try {
            await quotesService.delete(inquiry.id, quoteId);
            setDialogOpen(false);

            const updatedQuotes = await quotesService.getAllByInquiry(inquiry.id);
            setQuotes(updatedQuotes || []);

            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error deleting quote:', err);
            alert(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleSetFocus = async (quoteId: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            await quotesService.update(inquiry.id, quoteId, { is_primary: true });

            const updatedQuotes = await quotesService.getAllByInquiry(inquiry.id);
            setQuotes(updatedQuotes || []);

            setExpandedId(quoteId);
        } catch (err) {
            console.error('Error setting focus:', err);
            alert(`Failed to set focus: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // Calculation helpers
    const calculateSubtotal = () => lineItems.reduce((acc, item) => acc + (item.total || 0), 0);
    const subtotal = calculateSubtotal();
    const taxAmount = (subtotal * (taxRate / 100));
    const totalAmount = subtotal + taxAmount;

    return (
        <>
            <WorkflowCard isActive={isActive} activeColor={activeColor}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                                <AttachMoney sx={{ fontSize: 18, color: '#ef4444' }} />
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>Quotes</Typography>
                            {quotes.length > 0 && <Chip label={quotes.length} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} />}
                        </Box>
                        <Button size="small" startIcon={<Add />} onClick={handleCreate} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}>
                            New Quote
                        </Button>
                    </Box>

                    {quotes.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.12)' }}>
                                <AttachMoney sx={{ fontSize: 22, color: '#ef4444' }} />
                            </Box>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>No quotes yet</Typography>
                            <Typography sx={{ color: '#475569', fontSize: '0.72rem', mt: 0.5 }}>Generate a detailed quote from your estimate</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={1.5}>
                            {quotes.map((quote) => (
                                <Box
                                    key={quote.id}
                                    sx={{
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: quote.is_primary ? 'rgba(239,68,68,0.3)' : 'rgba(148,163,184,0.08)',
                                        overflow: 'hidden',
                                        bgcolor: 'rgba(255,255,255,0.02)',
                                        transition: 'border-color 0.15s',
                                        '&:hover': { borderColor: quote.is_primary ? 'rgba(239,68,68,0.5)' : 'rgba(148,163,184,0.18)' },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            px: 2, py: 1.5,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            borderBottom: expandedId === quote.id ? '1px solid rgba(148,163,184,0.08)' : 'none',
                                        }}
                                        onClick={() => toggleExpand(quote.id)}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            {quote.is_primary && (
                                                <Star sx={{ fontSize: 14, color: '#f59e0b' }} />
                                            )}
                                            <Box>
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#f1f5f9', lineHeight: 1.2 }}>
                                                    {quote.title || `Quote #${quote.quote_number}`}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                                                    <Typography sx={{ fontSize: '0.68rem', color: '#475569' }}>
                                                        {quote.quote_number}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.62rem', color: '#334155' }}>
                                                        {new Date(quote.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip
                                                label={quote.status}
                                                size="small"
                                                sx={{
                                                    height: 20, fontSize: '0.6rem', fontWeight: 700,
                                                    bgcolor: quote.status === 'Accepted' ? 'rgba(16,185,129,0.15)' : quote.status === 'Sent' ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.1)',
                                                    color: quote.status === 'Accepted' ? '#10b981' : quote.status === 'Sent' ? '#60a5fa' : '#94a3b8',
                                                    border: 'none',
                                                }}
                                            />
                                            <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#f59e0b', fontFamily: 'monospace', minWidth: 70, textAlign: 'right' }}>
                                                {currencySymbol}{Number(quote.total_amount || 0).toLocaleString()}
                                            </Typography>
                                            <Box sx={{ display: 'flex', ml: 0.5 }}>
                                                <Tooltip title={quote.is_primary ? 'Primary' : 'Set as Primary'}>
                                                    <IconButton size="small" onClick={(e) => handleSetFocus(quote.id, e)} sx={{ p: 0.5, color: quote.is_primary ? '#f59e0b' : '#334155', '&:hover': { color: '#f59e0b' } }}>
                                                        {quote.is_primary ? <Star sx={{ fontSize: 15 }} /> : <StarBorder sx={{ fontSize: 15 }} />}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(quote); }} sx={{ p: 0.5, color: '#334155', '&:hover': { color: '#94a3b8' } }}>
                                                        <Edit sx={{ fontSize: 15 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(quote.id); }} sx={{ p: 0.5, color: '#334155', '&:hover': { color: '#ef4444' } }}>
                                                        <Delete sx={{ fontSize: 15 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <IconButton size="small" sx={{ p: 0.5, color: '#334155' }}>
                                                    {expandedId === quote.id ? <ExpandLess sx={{ fontSize: 15 }} /> : <ExpandMore sx={{ fontSize: 15 }} />}
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Compact category-subtotal preview (visible when collapsed) */}
                                    {(quote.items?.length ?? 0) > 0 && expandedId !== quote.id && (() => {
                                        const catColors: Record<string, string> = { Coverage: '#648CFF', Planning: '#a855f7', 'Post-Production': '#f97316', Travel: '#06b6d4', Equipment: '#10b981', Discount: '#ef4444', Other: '#94a3b8' };
                                        const grouped = (quote.items || []).reduce((acc: Record<string, number>, item: QuoteItem) => {
                                            const raw = item.category || 'Other';
                                            const cat = raw.startsWith('Post-Production') ? 'Post-Production' : raw;
                                            acc[cat] = (acc[cat] || 0) + Number(item.quantity) * Number(item.unit_price);
                                            return acc;
                                        }, {});
                                        const qSubtotal = Object.values(grouped).reduce((s, v) => s + v, 0);
                                        return (
                                            <Box sx={{ px: 2, pt: 0.75, pb: 1.25 }}>
                                                <Box sx={{ display: 'flex', gap: 0.5, mb: 1, height: 4, borderRadius: 2, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.04)' }}>
                                                    {Object.entries(grouped).map(([cat, total]) => (
                                                        <Tooltip key={cat} title={`${cat}: ${currencySymbol}${total.toFixed(2)}`} arrow placement="top">
                                                            <Box sx={{ flex: total / qSubtotal, bgcolor: catColors[cat] || '#94a3b8', borderRadius: 1, minWidth: 4, transition: 'flex 0.3s' }} />
                                                        </Tooltip>
                                                    ))}
                                                </Box>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, rowGap: 0.5 }}>
                                                    {Object.entries(grouped).map(([cat, total]) => (
                                                        <Box key={cat} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: catColors[cat] || '#94a3b8', flexShrink: 0 }} />
                                                            <Typography sx={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                                {cat}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 700 }}>
                                                                {currencySymbol}{total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Box>
                                        );
                                    })()}

                                    <Collapse in={expandedId === quote.id}>
                                        <Box sx={{ px: 2, py: 1.5 }}>
                                            {/* Group items by category in expanded view */}
                                            {(() => {
                                                const catColors: Record<string, string> = { Coverage: '#648CFF', Planning: '#a855f7', 'Post-Production': '#f97316', Travel: '#06b6d4', Equipment: '#10b981', Discount: '#ef4444', Other: '#94a3b8' };
                                                const grouped = (quote.items || []).reduce((acc: Record<string, QuoteItem[]>, item: QuoteItem) => {
                                                    const c = item.category || 'Other';
                                                    if (!acc[c]) acc[c] = [];
                                                    acc[c].push(item);
                                                    return acc;
                                                }, {});
                                                return Object.entries(grouped).map(([cat, catItems]) => {
                                                    const colorKey = cat.startsWith('Post-Production') ? 'Post-Production' : cat;
                                                    const catColor = catColors[colorKey] || '#94a3b8';
                                                    const catTotal = (catItems as QuoteItem[]).reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0);
                                                    return (
                                                        <Box key={cat} sx={{ mb: 1.5 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, pl: 0.5 }}>
                                                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: catColor, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                                                                    {cat}
                                                                </Typography>
                                                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: catColor, fontFamily: 'monospace' }}>
                                                                    {currencySymbol}{catTotal.toFixed(2)}
                                                                </Typography>
                                                            </Box>
                                                            {(catItems as QuoteItem[]).map((item: QuoteItem, idx: number) => (
                                                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 0.5, px: 0.5, borderLeft: `2px solid ${catColor}30` }}>
                                                                    <Typography sx={{ flex: 1, fontSize: '0.78rem', color: '#cbd5e1' }}>{item.description}</Typography>
                                                                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>{currencySymbol}{Number(item.unit_price).toFixed(2)} × {item.quantity}</Typography>
                                                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'monospace', color: '#f1f5f9', minWidth: 70, textAlign: 'right' }}>{currencySymbol}{(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</Typography>
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    );
                                                });
                                            })()}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, mt: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                {Number(quote.deposit_required) > 0 && (
                                                    <Typography sx={{ fontSize: '0.72rem', color: '#475569' }}>Deposit: <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{currencySymbol}{Number(quote.deposit_required).toLocaleString()}</span></Typography>
                                                )}
                                                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    {Number(quote.tax_rate) > 0 && <Typography sx={{ fontSize: '0.7rem', color: '#475569' }}>+{quote.tax_rate}% tax</Typography>}
                                                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'monospace', color: '#f59e0b' }}>{currencySymbol}{Number(quote.total_amount).toLocaleString()}</Typography>
                                                </Box>
                                            </Box>
                                            {(quote.consultation_notes || quote.notes) && (
                                                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                    {quote.consultation_notes && (
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', mb: 0.5 }}>Consultation Notes</Typography>
                                                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{quote.consultation_notes}</Typography>
                                                        </Box>
                                                    )}
                                                    {quote.notes && (
                                                        <Box>
                                                            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', mb: 0.5 }}>Notes</Typography>
                                                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{quote.notes}</Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    </Collapse>
                                </Box>
                            ))}
                        </Stack>
                    )}
                </CardContent>
            </WorkflowCard>

            {/* Quote Builder Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
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
                    }
                }}
            >
                {/* Top accent bar */}
                <Box sx={{ height: 3, background: 'linear-gradient(90deg, #ef4444, #ef444460)' }} />

                {/* Dialog Header */}
                <Box sx={{
                    px: 3, py: 2,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    bgcolor: '#0d1629',
                    borderBottom: '1px solid rgba(148,163,184,0.08)',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 34, height: 34, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <ReceiptLong sx={{ fontSize: 18, color: '#ef4444' }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#f1f5f9', lineHeight: 1.2 }}>
                                {editingQuote?.id ? 'Edit Quote' : 'Quote Builder'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                                {editingQuote?.title && (
                                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>{editingQuote.title}</Typography>
                                )}
                                {editingQuote?.quote_number && (
                                    <Chip label={editingQuote.quote_number} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: 'rgba(148,163,184,0.08)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.15)' }} />
                                )}
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
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ef4444' },
                                        }}
                                    >
                                        <MenuItem value="">
                                            <em>None (Start Blank)</em>
                                        </MenuItem>
                                        {availableEstimates.map(est => (
                                            <MenuItem key={est.id} value={est.id.toString()}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                    {est.is_primary ? <Star fontSize="small" color="warning" /> : <Box sx={{ width: 20 }} />}
                                                    <Box sx={{ flex: 1 }}>
                                                        {est.title || `Estimate #${est.estimate_number}`}
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {currencySymbol}{Number(est.total_amount).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}
                    </Box>
                    <IconButton onClick={() => setDialogOpen(false)} size="small" sx={{ color: '#475569', '&:hover': { color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.05)' } }}>
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
                                    '& .MuiInput-underline:after': { borderBottomColor: '#ef4444' },
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
                                        bgcolor: 'rgba(255,255,255,0.02)',
                                        fontSize: '0.82rem',
                                        '& fieldset': { borderColor: 'rgba(148,163,184,0.1)' },
                                        '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.2)' },
                                        '&.Mui-focused fieldset': { borderColor: '#ef4444' },
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

                        <LineItemEditor
                            items={lineItems}
                            onChange={setLineItems}
                            currencySymbol={currencySymbol}
                        />

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
                                        bgcolor: 'rgba(255,255,255,0.02)',
                                        fontSize: '0.82rem',
                                        '& fieldset': { borderColor: 'rgba(148,163,184,0.1)' },
                                        '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.2)' },
                                        '&.Mui-focused fieldset': { borderColor: '#ef4444' },
                                    },
                                    '& textarea': { color: '#94a3b8' },
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Right — Financial Summary sidebar */}
                    <Box sx={{
                        width: { xs: '100%', lg: 340 },
                        borderLeft: { lg: '1px solid rgba(148,163,184,0.08)' },
                        bgcolor: '#060b14',
                        display: 'flex', flexDirection: 'column',
                        overflowY: 'auto',
                    }}>
                        {/* Total hero */}
                        <Box sx={{ p: 3, borderBottom: '1px solid rgba(148,163,184,0.08)', textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.8px', mb: 1 }}>Total Amount</Typography>
                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '2.2rem', color: '#f59e0b', lineHeight: 1 }}>
                                {currencySymbol}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </Typography>
                            {taxRate > 0 && (
                                <Typography sx={{ fontSize: '0.7rem', color: '#475569', mt: 0.75 }}>
                                    {currencySymbol}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} + {taxRate}% tax
                                </Typography>
                            )}
                        </Box>

                        {/* Tax + subtotal */}
                        <Box sx={{ p: 3, borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>Subtotal</Typography>
                                <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 600 }}>
                                    {currencySymbol}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>Tax rate</Typography>
                                <TextField
                                    size="small"
                                    type="number"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(Number(e.target.value))}
                                    InputProps={{ endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: '0.75rem', color: '#475569' }}>%</Typography></InputAdornment> }}
                                    sx={{
                                        width: 90,
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255,255,255,0.03)', fontSize: '0.82rem',
                                            '& fieldset': { borderColor: 'rgba(148,163,184,0.1)' },
                                            '&.Mui-focused fieldset': { borderColor: '#ef4444' },
                                        },
                                        '& input': { py: 0.6, color: '#94a3b8', textAlign: 'right' },
                                    }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>Deposit</Typography>
                                <TextField
                                    size="small"
                                    type="number"
                                    value={depositRequired}
                                    onChange={(e) => setDepositRequired(Number(e.target.value))}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.75rem', color: '#475569' }}>{currencySymbol}</Typography></InputAdornment> }}
                                    sx={{
                                        width: 120,
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255,255,255,0.03)', fontSize: '0.82rem',
                                            '& fieldset': { borderColor: 'rgba(148,163,184,0.1)' },
                                            '&.Mui-focused fieldset': { borderColor: '#ef4444' },
                                        },
                                        '& input': { py: 0.6, color: '#94a3b8' },
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Payment settings */}
                        <Box sx={{ p: 3, borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.8px', mb: 2 }}>Payment</Typography>

                            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                <InputLabel sx={{ fontSize: '0.78rem', color: '#475569 !important' }}>Payment Method</InputLabel>
                                <Select
                                    value={paymentMethod}
                                    label="Payment Method"
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.03)', fontSize: '0.82rem', color: '#94a3b8',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.1)' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ef4444' },
                                    }}
                                >
                                    <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                                    <MenuItem value="Credit Card">Credit Card</MenuItem>
                                    <MenuItem value="Cash">Cash</MenuItem>
                                    <MenuItem value="Check">Check</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </Select>
                            </FormControl>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>Installments</Typography>
                                <TextField
                                    size="small"
                                    type="number"
                                    value={installments}
                                    onChange={(e) => setInstallments(Math.max(1, Number(e.target.value)))}
                                    sx={{
                                        width: 80,
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255,255,255,0.03)', fontSize: '0.82rem',
                                            '& fieldset': { borderColor: 'rgba(148,163,184,0.1)' },
                                            '&.Mui-focused fieldset': { borderColor: '#ef4444' },
                                        },
                                        '& input': { py: 0.6, color: '#94a3b8', textAlign: 'center' },
                                    }}
                                    inputProps={{ min: 1 }}
                                />
                            </Box>
                        </Box>

                        {/* Payment Schedule */}
                        <Box sx={{ p: 3, flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Payment Schedule</Typography>
                                {defaultTemplate && (
                                    <Chip label={defaultTemplate.name} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: 'none' }} />
                                )}
                            </Box>
                            {milestones.length > 0 ? (
                                <Stack spacing={0.75}>
                                    {milestones.map((m, i) => {
                                        const pct = totalAmount > 0 ? Math.round((Number(m.amount) / totalAmount) * 100) : 0;
                                        return (
                                            <Box key={i} sx={{ py: 0.75, px: 1.25, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(148,163,184,0.06)' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                    <Typography sx={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>{m.label}</Typography>
                                                    <Chip label={m.status} size="small" sx={{
                                                        height: 16, fontSize: '0.55rem',
                                                        bgcolor: m.status === 'PAID' ? 'rgba(16,185,129,0.15)' : m.status === 'OVERDUE' ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.08)',
                                                        color: m.status === 'PAID' ? '#10b981' : m.status === 'OVERDUE' ? '#ef4444' : '#64748b',
                                                        border: 'none',
                                                    }} />
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                    <Typography sx={{ fontSize: '0.68rem', color: '#475569' }}>
                                                        {m.due_date ? new Date(m.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'monospace', color: '#f59e0b' }}>
                                                        {currencySymbol}{Number(m.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        <Typography component="span" sx={{ fontSize: '0.62rem', color: '#475569', ml: 0.5 }}>({pct}%)</Typography>
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ mt: 0.75, height: 3, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.08)', overflow: 'hidden' }}>
                                                    <Box sx={{ height: '100%', width: `${pct}%`, borderRadius: 2, bgcolor: m.status === 'PAID' ? '#10b981' : '#f59e0b', transition: 'width 0.3s' }} />
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            ) : defaultTemplate?.rules?.length ? (
                                <Stack spacing={0.75}>
                                    {defaultTemplate.rules
                                        .slice()
                                        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                                        .map((rule, i) => {
                                            const amount = rule.amount_type === 'PERCENT'
                                                ? (Number(rule.amount_value) / 100) * totalAmount
                                                : Number(rule.amount_value);
                                            const pct = rule.amount_type === 'PERCENT'
                                                ? Math.round(Number(rule.amount_value))
                                                : (totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0);
                                            const triggerLabel =
                                                rule.trigger_type === 'AFTER_BOOKING' ? `${rule.trigger_days ?? 0}d after booking` :
                                                rule.trigger_type === 'BEFORE_EVENT' ? `${rule.trigger_days ?? 0}d before event` :
                                                rule.trigger_type === 'AFTER_EVENT' ? `${rule.trigger_days ?? 0}d after event` :
                                                'On date';
                                            return (
                                                <Box key={i} sx={{ py: 0.75, px: 1.25, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(148,163,184,0.06)' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                        <Typography sx={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>{rule.label}</Typography>
                                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'monospace', color: '#f59e0b' }}>
                                                            {currencySymbol}{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography sx={{ fontSize: '0.62rem', color: '#475569' }}>{triggerLabel}</Typography>
                                                        <Typography sx={{ fontSize: '0.62rem', color: '#475569' }}>{pct}%</Typography>
                                                    </Box>
                                                    <Box sx={{ mt: 0.5, height: 3, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.08)', overflow: 'hidden' }}>
                                                        <Box sx={{ height: '100%', width: `${pct}%`, borderRadius: 2, bgcolor: '#f59e0b40' }} />
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                </Stack>
                            ) : (
                                <Typography sx={{ fontSize: '0.75rem', color: '#334155', fontStyle: 'italic' }}>
                                    No schedule configured — add one in Settings
                                </Typography>
                            )}
                        </Box>
                    </Box>
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
                                onClick={() => handleDelete(editingQuote.id!)}
                                startIcon={<Delete sx={{ fontSize: '0.85rem !important' }} />}
                                size="small"
                                sx={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'none', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.06)' } }}
                            >
                                Delete
                            </Button>
                            {!editingQuote?.is_primary ? (
                                <Button
                                    onClick={(e) => handleSetFocus(editingQuote.id!, e)}
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
                        onClick={() => setDialogOpen(false)}
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
                            bgcolor: '#ef4444', color: '#fff', fontSize: '0.78rem', textTransform: 'none', fontWeight: 700,
                            '&:hover': { bgcolor: '#dc2626' },
                            boxShadow: '0 0 20px rgba(239,68,68,0.25)',
                        }}
                    >
                        Send Quote
                    </Button>
                </Box>
            </Dialog>
        </>
    );
};

export { QuotesCard };
