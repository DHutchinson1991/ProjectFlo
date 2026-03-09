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
import { estimatesService, api } from '@/lib/api';
import { Estimate, EstimateItem } from '@/lib/types';
import { getCurrencySymbol } from '@/lib/utils/formatUtils';
import LineItemEditor, { LineItem } from '../../components/LineItemEditor';
import type { WorkflowCardProps } from '../_lib';
import { WorkflowCard } from './WorkflowCard';

const EstimatesCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEstimate, setEditingEstimate] = useState<Partial<Estimate> | null>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);

    // Financial State
    const [taxRate, setTaxRate] = useState<number>(0);
    const [depositRequired, setDepositRequired] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
    const [installments, setInstallments] = useState<number>(1);
    const [currencySymbol, setCurrencySymbol] = useState<string>('$');

    // Accordion state
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const autoExpandIdRef = useRef<number | null>(null);

    // Auto-expand effect
    useEffect(() => {
        if (estimates.length > 0) {
            if (autoExpandIdRef.current) {
                const targetId = autoExpandIdRef.current;
                const exists = estimates.find(e => e.id === targetId);
                if (exists) {
                    setExpandedId(targetId);
                    autoExpandIdRef.current = null;
                    return;
                }
            }
            const primary = estimates.find((e) => e.is_primary);
            if (primary) {
                setExpandedId(primary.id);
            }
        }
    }, [estimates]);

    useEffect(() => {
        const fetchEstimates = async () => {
            if (inquiry?.id) {
                try {
                    const estimatesData = await estimatesService.getAllByInquiry(inquiry.id);
                    setEstimates(estimatesData || []);
                } catch (error) {
                    console.error('Error fetching estimates:', error);
                    setEstimates([]);
                }
            }
        };
        fetchEstimates();
    }, [inquiry?.id]);

    const handleCreate = async () => {
        setEditingEstimate(null);

        let initialItems: LineItem[] = [];
        let pkgTitle = '';

        // Auto-populate from selected package if available
        if (inquiry.selected_package_id && inquiry.brand_id) {
            try {
                const pkg = await api.servicePackages.getOne(inquiry.brand_id, inquiry.selected_package_id);
                if (pkg) {
                    if (pkg.currency) {
                        setCurrencySymbol(getCurrencySymbol(pkg.currency));
                    }
                    pkgTitle = pkg.name || '';

                    if (pkg.contents && pkg.contents.items) {
                        const makeTempId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        let totalOperators = 0;

                        for (const pItem of pkg.contents.items) {
                            const isFilm = pItem.type === 'film';
                            const operatorCount = pItem.config?.operator_count || 0;
                            if (isFilm) totalOperators += operatorCount;

                            initialItems.push({
                                tempId: makeTempId(),
                                description: pItem.description,
                                category: isFilm ? 'Film' : 'Service',
                                quantity: 1,
                                unit: 'Qty',
                                unit_price: pItem.price,
                                total: pItem.price,
                                service_date: '',
                                start_time: '',
                                end_time: '',
                            });
                        }

                        if (totalOperators > 0) {
                            initialItems.push({
                                tempId: makeTempId(),
                                description: `Camera Operator${totalOperators > 1 ? 's' : ''}`,
                                category: 'Crew',
                                quantity: totalOperators,
                                unit: 'Qty',
                                unit_price: 0,
                                total: 0,
                                service_date: '',
                                start_time: '',
                                end_time: '',
                            });
                        }

                        const eqCounts = pkg.contents.equipment_counts;
                        if (eqCounts) {
                            if ((eqCounts.cameras ?? 0) > 0) {
                                initialItems.push({
                                    tempId: makeTempId(),
                                    description: `Camera${(eqCounts.cameras ?? 0) > 1 ? 's' : ''}`,
                                    category: 'Equipment',
                                    quantity: eqCounts.cameras ?? 1,
                                    unit: 'Qty',
                                    unit_price: 0,
                                    total: 0,
                                    service_date: '',
                                    start_time: '',
                                    end_time: '',
                                });
                            }
                            if ((eqCounts.audio ?? 0) > 0) {
                                initialItems.push({
                                    tempId: makeTempId(),
                                    description: `Audio Kit${(eqCounts.audio ?? 0) > 1 ? 's' : ''}`,
                                    category: 'Equipment',
                                    quantity: eqCounts.audio ?? 1,
                                    unit: 'Qty',
                                    unit_price: 0,
                                    total: 0,
                                    service_date: '',
                                    start_time: '',
                                    end_time: '',
                                });
                            }
                        }

                        const coverage = pkg.contents;
                        if (coverage.coverage_hours && coverage.coverage_hours > 0) {
                            initialItems.push({
                                tempId: makeTempId(),
                                description: 'Event Coverage',
                                category: 'Coverage',
                                quantity: coverage.coverage_hours,
                                unit: 'Hours',
                                unit_price: 0,
                                total: 0,
                                service_date: '',
                                start_time: '',
                                end_time: '',
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load package details for estimate:', error);
            }
        }

        if (initialItems.length === 0) {
            initialItems = [{
                tempId: `item-${Date.now()}`,
                description: '',
                quantity: 1,
                unit: 'Qty',
                unit_price: 0,
                total: 0
            }];
        }

        setLineItems(initialItems);
        setTaxRate(0);
        setDepositRequired(0);
        setPaymentMethod('Bank Transfer');
        setInstallments(1);
        setEditingEstimate(pkgTitle ? { title: pkgTitle } : null);
        setDialogOpen(true);
    };

    const handleEdit = (estimate: Estimate) => {
        setEditingEstimate(estimate);
        const items = estimate.items?.map((item: EstimateItem) => ({
            ...item,
            tempId: `item-${item.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            service_date: item.service_date ? new Date(item.service_date).toISOString().split('T')[0] : (item.service_date || ''),
            start_time: item.start_time || '',
            end_time: item.end_time || '',
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
                service_date: '',
                start_time: '',
                end_time: '',
                category: '',
                quantity: 1,
                unit: 'Qty',
                unit_price: 0,
                total: 0
            });
        }

        setLineItems(items);
        setTaxRate(Number(estimate.tax_rate) || 0);
        setDepositRequired(Number(estimate.deposit_required) || 0);
        setPaymentMethod(estimate.payment_method || 'Bank Transfer');
        setInstallments(estimate.installments || 1);
        setDialogOpen(true);
    };

    const handleSave = async (statusOverride?: string) => {
        try {
            const currentStatus = typeof statusOverride === 'string' ? statusOverride : (editingEstimate?.status || 'Draft');

            const estimateData = {
                estimate_number: editingEstimate?.estimate_number || `EST-${Date.now()}`,
                title: editingEstimate?.title || undefined,
                issue_date: editingEstimate?.issue_date
                    ? new Date(editingEstimate.issue_date).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                expiry_date: editingEstimate?.expiry_date
                    ? new Date(editingEstimate.expiry_date).toISOString().split('T')[0]
                    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tax_rate: taxRate,
                deposit_required: depositRequired,
                payment_method: paymentMethod,
                installments: installments,
                status: currentStatus,
                notes: editingEstimate?.notes,
                terms: editingEstimate?.terms,
                items: lineItems.map(item => ({
                    description: item.description,
                    category: item.category,
                    service_date: item.service_date ? new Date(item.service_date) : undefined,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    unit: item.unit,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price)
                }))
            };

            let savedId: number | undefined;

            if (editingEstimate && editingEstimate.id) {
                await estimatesService.update(inquiry.id, editingEstimate.id, estimateData);
                savedId = editingEstimate.id;
            } else {
                const created = await estimatesService.create(inquiry.id, estimateData);
                savedId = created?.id;
            }

            setDialogOpen(false);

            try {
                if (savedId) {
                    autoExpandIdRef.current = Number(savedId);
                }
                const updatedEstimates = await estimatesService.getAllByInquiry(inquiry.id);
                setEstimates(updatedEstimates || []);

                if (!savedId && updatedEstimates && updatedEstimates.length > 0) {
                    const lastId = Number(updatedEstimates[updatedEstimates.length - 1].id);
                    autoExpandIdRef.current = lastId;
                }
            } catch (error) {
                console.error('Error refreshing estimates:', error);
            }

            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error saving estimate:', err);
            alert(`Failed to save estimate: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleDuplicate = async () => {
        try {
            const estimateData = {
                estimate_number: `EST-${Date.now()}`,
                title: `${editingEstimate?.title || 'Estimate'} (Copy)`,
                issue_date: new Date().toISOString().split('T')[0],
                expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tax_rate: taxRate,
                deposit_required: depositRequired,
                payment_method: paymentMethod,
                installments: installments,
                status: 'Draft',
                notes: editingEstimate?.notes,
                items: lineItems.map(item => ({
                    description: item.description,
                    category: item.category,
                    service_date: item.service_date ? new Date(item.service_date) : undefined,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    unit: item.unit,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price)
                }))
            };

            const created = await estimatesService.create(inquiry.id, estimateData);
            setDialogOpen(false);

            if (created?.id) {
                autoExpandIdRef.current = Number(created.id);
            }

            const updatedEstimates = await estimatesService.getAllByInquiry(inquiry.id);
            setEstimates(updatedEstimates || []);

            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error duplicating estimate:', err);
            alert(`Failed to duplicate: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleDelete = async (estimateId: number) => {
        if (!confirm('Are you sure you want to delete this estimate? This action cannot be undone.')) return;
        try {
            await estimatesService.delete(inquiry.id, estimateId);
            setDialogOpen(false);

            const updatedEstimates = await estimatesService.getAllByInquiry(inquiry.id);
            setEstimates(updatedEstimates || []);

            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error deleting estimate:', err);
            alert(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleSetFocus = async (estimateId: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            await estimatesService.update(inquiry.id, estimateId, { is_primary: true });

            const updatedEstimates = await estimatesService.getAllByInquiry(inquiry.id);
            setEstimates(updatedEstimates || []);

            setExpandedId(estimateId);
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
    const remainingAfterDeposit = Math.max(0, totalAmount - depositRequired);
    const installmentAmount = installments > 0 ? remainingAfterDeposit / installments : 0;

    return (
        <>
            <WorkflowCard isActive={isActive} activeColor={activeColor}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                                <AttachMoney sx={{ fontSize: 18, color: '#10b981' }} />
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>Estimates</Typography>
                            {estimates.length > 0 && <Chip label={estimates.length} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }} />}
                        </Box>
                        <Button size="small" startIcon={<Add />} onClick={handleCreate} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}>
                            New Estimate
                        </Button>
                    </Box>

                    {estimates.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.12)' }}>
                                <AttachMoney sx={{ fontSize: 22, color: '#10b981' }} />
                            </Box>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>No estimates yet</Typography>
                            <Typography sx={{ color: '#475569', fontSize: '0.72rem', mt: 0.5 }}>Create your first estimate to show the client pricing</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={2}>
                            {estimates.map((estimate) => (
                                <Card key={estimate.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                                    <Box
                                        sx={{
                                            p: 2,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            bgcolor: 'action.hover',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => toggleExpand(estimate.id)}
                                    >
                                        <Box>
                                            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                                                {estimate.title || `Estimate #${estimate.estimate_number}`}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(estimate.issue_date).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Tooltip title={estimate.is_primary ? "Primary Estimate" : "Set as Primary"}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleSetFocus(estimate.id, e)}
                                                    color={estimate.is_primary ? "warning" : "default"}
                                                >
                                                    {estimate.is_primary ? <Star /> : <StarBorder />}
                                                </IconButton>
                                            </Tooltip>

                                            <Chip
                                                label={estimate.status}
                                                size="small"
                                                color={estimate.status === 'Accepted' ? 'success' : 'default'}
                                            />
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                {currencySymbol}{Number(estimate.total_amount || 0).toLocaleString()}
                                            </Typography>

                                            <Tooltip title="Delete Estimate">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(estimate.id); }}
                                                    sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Edit Estimate">
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(estimate); }}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            <IconButton size="small">
                                                {expandedId === estimate.id ? <ExpandLess /> : <ExpandMore />}
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <Collapse in={expandedId === estimate.id}>
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
                                                        {estimate.items?.map((item: EstimateItem, idx: number) => (
                                                            <TableRow key={idx}>
                                                                <TableCell>
                                                                    <Typography variant="body2">{item.description}</Typography>
                                                                    {item.category && (
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {item.category}
                                                                        </Typography>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell align="right">{currencySymbol}{Number(item.unit_price).toFixed(2)}</TableCell>
                                                                <TableCell align="right">
                                                                    {item.quantity} {item.unit}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    {currencySymbol}{(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {Number(estimate.tax_rate) > 0 && (
                                                            <TableRow>
                                                                <TableCell colSpan={3} align="right">Tax ({Number(estimate.tax_rate)}%)</TableCell>
                                                                <TableCell align="right">
                                                                    {currencySymbol}{(Number(estimate.total_amount) - (Number(estimate.total_amount) / (1 + Number(estimate.tax_rate) / 100))).toFixed(2)}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                        <TableRow>
                                                            <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                                {currencySymbol}{Number(estimate.total_amount).toLocaleString()}
                                                            </TableCell>
                                                        </TableRow>
                                                        {Number(estimate.deposit_required) > 0 && (
                                                            <TableRow>
                                                                <TableCell colSpan={3} align="right" sx={{ color: 'text.secondary' }}>Deposit Required</TableCell>
                                                                <TableCell align="right" sx={{ color: 'text.secondary' }}>
                                                                    {currencySymbol}{Number(estimate.deposit_required).toLocaleString()}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>

                                            {(estimate.notes || estimate.terms) && (
                                                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                                    {estimate.notes && (
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>NOTES</Typography>
                                                            <Typography variant="body2">{estimate.notes}</Typography>
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

            {/* Estimate Builder Dialog */}
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
                            {editingEstimate?.id ? 'Edit Estimate' : 'Estimate Builder'}
                        </Typography>
                        {editingEstimate?.status && (
                            <Chip
                                label={editingEstimate.status}
                                size="small"
                                color={editingEstimate.status === 'Sent' ? 'success' : 'default'}
                                variant="outlined"
                            />
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
                            value={editingEstimate?.title || ''}
                            onChange={(e) => setEditingEstimate({ ...editingEstimate, title: e.target.value })}
                        />

                        <LineItemEditor
                            items={lineItems}
                            onChange={setLineItems}
                            currencySymbol={currencySymbol}
                        />

                        <Box sx={{ mt: 6 }}>
                            <Typography variant="subtitle2" gutterBottom>Internal Notes & Payment Instructions</Typography>
                            <TextField
                                multiline
                                rows={4}
                                fullWidth
                                placeholder="Add notes about specific requirements, payment terms, etc..."
                                value={editingEstimate?.notes || ''}
                                onChange={(e) => setEditingEstimate({ ...editingEstimate, notes: e.target.value })}
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
                                    <Typography variant="subtitle1">{currencySymbol}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
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
                                        {currencySymbol}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                                        startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>
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
                                            <Typography variant="body2" fontWeight="medium">{currencySymbol}{depositRequired.toLocaleString()}</Typography>
                                        </Box>
                                        {remainingAfterDeposit > 0 && Array.from({ length: installments }).map((_, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, pl: 1, borderLeft: 2, borderColor: 'primary.main' }}>
                                                <Typography variant="body2" color="text.secondary">Payment {idx + 1}</Typography>
                                                <Typography variant="body2" fontWeight="medium">{currencySymbol}{installmentAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Stack>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: 'background.paper', zIndex: 10 }}>
                    {editingEstimate?.id && (
                        <>
                            <Button
                                onClick={handleDuplicate}
                                startIcon={<ContentCopyIcon />}
                                color="inherit"
                            >
                                Duplicate
                            </Button>
                            <Button
                                onClick={() => handleDelete(editingEstimate.id!)}
                                startIcon={<Delete />}
                                color="error"
                            >
                                Delete
                            </Button>
                            {!editingEstimate?.is_primary && (
                                <Button
                                    onClick={(e) => handleSetFocus(editingEstimate.id!, e)}
                                    startIcon={<StarBorder />}
                                    color="warning"
                                >
                                    Make Primary
                                </Button>
                            )}
                            {editingEstimate?.is_primary && (
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
                        Send Estimate
                    </Button>
                </Box>
            </Dialog>
        </>
    );
};

export { EstimatesCard };
