'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Card, CardContent, Button, Stack, TextField, Dialog,
    IconButton, Divider, FormControl, InputLabel, Select, MenuItem,
    Paper, Chip, Collapse, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, InputAdornment, Tooltip,
} from '@mui/material';
import {
    AttachMoney, Add, Edit, Save, Send as SendIcon, Delete,
    Star, StarBorder, ExpandLess, ExpandMore,
    ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { estimatesService, quotesService } from '@/lib/api';
import { Estimate, EstimateItem, Quote, QuoteItem } from '@/lib/types';
import LineItemEditor, { LineItem } from '../../components/LineItemEditor';
import type { WorkflowCardProps } from '../_lib';
import { WorkflowCard } from './WorkflowCard';

const QuotesCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    // Existing State
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const autoExpandIdRef = useRef<number | null>(null);

    // Dialog & editor state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<Partial<Quote> | null>(null);

    // Import Sources State
    const [availableEstimates, setAvailableEstimates] = useState<Estimate[]>([]);
    const [selectedEstimateId, setSelectedEstimateId] = useState<string>('');

    // Editor Form State
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [consultationNotes, setConsultationNotes] = useState('');
    const [taxRate, setTaxRate] = useState(0);
    const [depositRequired, setDepositRequired] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
    const [installments, setInstallments] = useState(1);
    const [notes, setNotes] = useState('');

    const fetchEstimates = async () => {
        if (!inquiry?.id) return;
        try {
            const estimates = await estimatesService.getAllByInquiry(inquiry.id);
            setAvailableEstimates(estimates || []);
            return estimates;
        } catch (error) {
            console.error('Error fetching estimates for import:', error);
            return [];
        }
    };

    useEffect(() => {
        const fetchQuotes = async () => {
            if (inquiry?.id) {
                try {
                    const quotesData = await quotesService.getAllByInquiry(inquiry.id);
                    setQuotes(quotesData || []);

                    if (autoExpandIdRef.current) {
                        setExpandedId(autoExpandIdRef.current);
                        autoExpandIdRef.current = null;
                    } else if (quotesData && quotesData.length > 0) {
                        const primary = quotesData.find((q) => q.is_primary);
                        if (primary) {
                            setExpandedId(primary.id);
                        } else if (!expandedId) {
                            setExpandedId(quotesData[0].id);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching quotes:', error);
                    setQuotes([]);
                }
            }
        };
        fetchQuotes();
    }, [inquiry?.id]);

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
        setTaxRate(0);
        setDepositRequired(0);
        setPaymentMethod('Bank Transfer');
        setInstallments(1);
        setSelectedEstimateId('');
        setDialogOpen(true);

        const estimates = await fetchEstimates();
        if (estimates && estimates.length > 0) {
            const primaryEstimate = estimates.find((e) => e.is_primary);
            if (primaryEstimate) {
                setTimeout(() => {
                    setSelectedEstimateId(primaryEstimate.id.toString());
                    handleApplyEstimate(primaryEstimate.id.toString());

                    const newItems = primaryEstimate.items?.map((item: EstimateItem) => ({
                        tempId: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        description: item.description || '',
                        category: item.category || '',
                        unit: item.unit || 'Qty',
                        quantity: Number(item.quantity) || 1,
                        unit_price: Number(item.unit_price) || 0,
                        total: (Number(item.quantity) * Number(item.unit_price))
                    })) || [];

                    setLineItems(newItems);
                    setTaxRate(Number(primaryEstimate.tax_rate) || 0);
                    setDepositRequired(Number(primaryEstimate.deposit_required) || 0);
                    setPaymentMethod(primaryEstimate.payment_method || 'Bank Transfer');
                    setInstallments(Number(primaryEstimate.installments) || 1);
                    setNotes(primaryEstimate.notes || '');
                    setEditingQuote({ title: `Quote from ${primaryEstimate.title || 'Estimate'}` });
                }, 100);
            }
        }
    };

    const handleEdit = (quote: Quote) => {
        setEditingQuote(quote);
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
        setDialogOpen(true);
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

    const handleSave = async (statusOverride?: string) => {
        try {
            const statusToSave = statusOverride || editingQuote?.status || 'Draft';

            const quoteData = {
                quote_number: editingQuote?.quote_number || `QUO-${Date.now()}`,
                title: editingQuote?.title || 'New Quote',
                issue_date: new Date().toISOString().split('T')[0],
                expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                consultation_notes: consultationNotes,
                notes: notes,
                status: statusToSave,
                tax_rate: taxRate,
                deposit_required: depositRequired,
                payment_method: paymentMethod,
                installments: installments,
                items: lineItems.map(item => ({
                    description: item.description,
                    category: item.category,
                    unit: item.unit,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price)
                }))
            };

            if (editingQuote && editingQuote.id) {
                await quotesService.update(inquiry.id, editingQuote.id, quoteData);
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                await quotesService.create(inquiry.id, quoteData);
            }

            setDialogOpen(false);

            try {
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

    // Calculation helpers
    const calculateSubtotal = () => lineItems.reduce((acc, item) => acc + (item.total || 0), 0);
    const subtotal = calculateSubtotal();
    const taxAmount = (subtotal * (taxRate / 100));
    const totalAmount = subtotal + taxAmount;
    const remainingAfterDeposit = Math.max(0, totalAmount - depositRequired);
    const installmentAmount = installments > 0 ? remainingAfterDeposit / installments : 0;

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
                        <Stack spacing={2}>
                            {quotes.map((quote) => (
                                <Card key={quote.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                                    <Box
                                        sx={{
                                            p: 2,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            bgcolor: 'action.hover',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => toggleExpand(quote.id)}
                                    >
                                        <Box>
                                            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                                                {quote.title || `Quote #${quote.quote_number}`}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(quote.issue_date).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Tooltip title={quote.is_primary ? "Primary Quote" : "Set as Primary"}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleSetFocus(quote.id, e)}
                                                    color={quote.is_primary ? "warning" : "default"}
                                                >
                                                    {quote.is_primary ? <Star /> : <StarBorder />}
                                                </IconButton>
                                            </Tooltip>

                                            <Chip
                                                label={quote.status}
                                                size="small"
                                                color={quote.status === 'Accepted' ? 'success' : 'default'}
                                            />
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                ${Number(quote.total_amount || 0).toLocaleString()}
                                            </Typography>

                                            <Tooltip title="Delete Quote">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(quote.id); }}
                                                    sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Edit Quote">
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(quote); }}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            <IconButton size="small">
                                                {expandedId === quote.id ? <ExpandLess /> : <ExpandMore />}
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <Collapse in={expandedId === quote.id}>
                                        <Box sx={{ p: 2 }}>
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Description</TableCell>
                                                            <TableCell align="right">Rate</TableCell>
                                                            <TableCell align="right">Qty</TableCell>
                                                            <TableCell align="right">Total</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {quote.items?.map((item: QuoteItem, idx: number) => (
                                                            <TableRow key={idx}>
                                                                <TableCell>
                                                                    <Typography variant="body2">{item.description}</Typography>
                                                                    {item.category && (
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {item.category}
                                                                        </Typography>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell align="right">${Number(item.unit_price).toFixed(2)}</TableCell>
                                                                <TableCell align="right">
                                                                    {item.quantity} {item.unit}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    ${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {Number(quote.tax_rate) > 0 && (
                                                            <TableRow>
                                                                <TableCell colSpan={3} align="right">Tax ({Number(quote.tax_rate)}%)</TableCell>
                                                                <TableCell align="right">
                                                                    ${(Number(quote.total_amount) - (Number(quote.total_amount) / (1 + Number(quote.tax_rate) / 100))).toFixed(2)}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                        <TableRow>
                                                            <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                                ${Number(quote.total_amount).toLocaleString()}
                                                            </TableCell>
                                                        </TableRow>
                                                        {Number(quote.deposit_required) > 0 && (
                                                            <TableRow>
                                                                <TableCell colSpan={3} align="right" sx={{ color: 'text.secondary' }}>Deposit Required</TableCell>
                                                                <TableCell align="right" sx={{ color: 'text.secondary' }}>
                                                                    ${Number(quote.deposit_required).toLocaleString()}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>

                                            {(quote.notes || quote.terms || quote.consultation_notes) && (
                                                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                                    {quote.consultation_notes && (
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>CONSULTATION NOTES</Typography>
                                                            <Typography variant="body2">{quote.consultation_notes}</Typography>
                                                        </Box>
                                                    )}
                                                    {quote.notes && (
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>NOTES</Typography>
                                                            <Typography variant="body2">{quote.notes}</Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    </Collapse>
                                </Card>
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
                    sx: { maxHeight: '85vh', height: 'auto', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }
                }}
            >
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" fontWeight="bold">
                            {editingQuote?.id ? 'Edit Quote' : 'Quote Builder'}
                        </Typography>
                        {editingQuote?.status && (
                            <Chip
                                label={editingQuote.status}
                                size="small"
                                color={editingQuote.status === 'Sent' ? 'success' : 'default'}
                                variant="outlined"
                            />
                        )}
                        {!editingQuote?.id && availableEstimates.length > 0 && (
                            <Box sx={{ ml: 2, minWidth: 250 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Import from Estimate...</InputLabel>
                                    <Select
                                        value={selectedEstimateId}
                                        label="Import from Estimate..."
                                        onChange={(e) => {
                                            setSelectedEstimateId(e.target.value);
                                            handleApplyEstimate(e.target.value);
                                        }}
                                        renderValue={(selected) => {
                                            const est = availableEstimates.find(e => e.id.toString() === selected.toString());
                                            if (!est) return <em>None (Start Blank)</em>;
                                            return (
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {est.is_primary && <Star fontSize="small" color="warning" sx={{ mr: 1 }} />}
                                                    {est.title || `Estimate #${est.estimate_number}`}
                                                </Box>
                                            );
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
                                                        ${Number(est.total_amount).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}
                    </Box>
                    <IconButton onClick={() => setDialogOpen(false)}>
                        <ExpandMore sx={{ transform: 'rotate(90deg)' }} />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, minHeight: '50vh', flex: 1, overflow: 'hidden' }}>
                    {/* Main Content - Editor */}
                    <Box sx={{ flex: 1, p: 3, bgcolor: 'background.paper', overflowY: 'auto' }}>
                        <TextField
                            label="Title / Reference"
                            placeholder='e.g. "Full Day Wedding Coverage"'
                            fullWidth
                            variant="outlined"
                            sx={{ mb: 4 }}
                            value={editingQuote?.title || ''}
                            onChange={(e) => setEditingQuote({ ...editingQuote, title: e.target.value })}
                        />

                        <TextField
                            label="Consultation Notes"
                            value={consultationNotes}
                            onChange={(e) => setConsultationNotes(e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Key requirements from consultation..."
                            sx={{ mb: 3 }}
                        />

                        <LineItemEditor
                            items={lineItems}
                            onChange={setLineItems}
                        />

                        <Box sx={{ mt: 6 }}>
                            <Typography variant="subtitle2" gutterBottom>Internal Notes & Payment Instructions</Typography>
                            <TextField
                                multiline
                                rows={4}
                                fullWidth
                                placeholder="Add notes about specific requirements, payment terms, etc..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                sx={{ bgcolor: 'action.hover' }}
                            />
                        </Box>
                    </Box>

                    {/* Sidebar - Financial Summary */}
                    <Box sx={{
                        width: { xs: '100%', lg: 380 },
                        borderLeft: { lg: 1 },
                        borderColor: 'divider',
                        bgcolor: 'background.default',
                        p: 3,
                        overflowY: 'auto'
                    }}>
                        <Box sx={{ position: 'sticky', top: 0 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold" color="text.primary">
                                Financial Summary
                            </Typography>

                            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography color="text.secondary">Subtotal</Typography>
                                    <Typography variant="subtitle1">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography color="text.secondary">Tax</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: 100 }}>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={taxRate}
                                            onChange={(e) => setTaxRate(Number(e.target.value))}
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                                sx: { py: 0 }
                                            }}
                                            sx={{ '& input': { py: 0.5 } }}
                                        />
                                    </Box>
                                </Box>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">Total</Typography>
                                    <Typography variant="h5" fontWeight="bold" color="primary.main">
                                        ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </Typography>
                                </Box>
                            </Paper>

                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Payment Breakdown</Typography>

                            <Stack spacing={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Payment Method</InputLabel>
                                    <Select
                                        value={paymentMethod}
                                        label="Payment Method"
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                        <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                                        <MenuItem value="Credit Card">Credit Card</MenuItem>
                                        <MenuItem value="Cash">Cash</MenuItem>
                                        <MenuItem value="Check">Check</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Required Deposit"
                                    size="small"
                                    fullWidth
                                    type="number"
                                    value={depositRequired}
                                    onChange={(e) => setDepositRequired(Number(e.target.value))}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                                    }}
                                />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">Installments:</Typography>
                                    <TextField
                                        size="small"
                                        type="number"
                                        value={installments}
                                        onChange={(e) => setInstallments(Math.max(1, Number(e.target.value)))}
                                        sx={{ width: 80 }}
                                        InputProps={{ inputProps: { min: 1 } }}
                                    />
                                </Box>

                                {installments > 0 && (
                                    <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, border: 1, borderColor: 'divider' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Deposit</Typography>
                                            <Typography variant="body2" fontWeight="medium">${depositRequired.toLocaleString()}</Typography>
                                        </Box>
                                        {remainingAfterDeposit > 0 && Array.from({ length: installments }).map((_, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, pl: 1, borderLeft: 2, borderColor: 'primary.main' }}>
                                                <Typography variant="body2" color="text.secondary">Payment {idx + 1}</Typography>
                                                <Typography variant="body2" fontWeight="medium">${installmentAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Stack>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: 'background.paper', zIndex: 10 }}>
                    {editingQuote?.id && (
                        <>
                            <Button
                                onClick={handleDuplicate}
                                startIcon={<ContentCopyIcon />}
                                color="inherit"
                            >
                                Duplicate
                            </Button>
                            <Button
                                onClick={() => handleDelete(editingQuote.id!)}
                                startIcon={<Delete />}
                                color="error"
                            >
                                Delete
                            </Button>
                            {!editingQuote?.is_primary && (
                                <Button
                                    onClick={(e) => handleSetFocus(editingQuote.id!, e)}
                                    startIcon={<StarBorder />}
                                    color="warning"
                                >
                                    Make Primary
                                </Button>
                            )}
                            {editingQuote?.is_primary && (
                                <Chip
                                    icon={<Star style={{ color: 'inherit' }} />}
                                    label="Primary"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ alignSelf: 'center' }}
                                />
                            )}
                        </>
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={() => handleSave('Draft')}
                        variant="outlined"
                        startIcon={<Save />}
                    >
                        Save Draft
                    </Button>
                    <Button
                        onClick={() => handleSave('Sent')}
                        variant="contained"
                        endIcon={<SendIcon />}
                        color="primary"
                    >
                        Send Quote
                    </Button>
                </Box>
            </Dialog>
        </>
    );
};

export { QuotesCard };
