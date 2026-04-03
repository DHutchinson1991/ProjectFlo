'use client';

import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Typography, Box, IconButton, InputAdornment,
} from '@mui/material';
import { Close as CloseIcon, Payment as PaymentIcon } from '@mui/icons-material';
import type { Invoice, RecordPaymentData } from '../types';

interface RecordPaymentDialogProps {
    open: boolean;
    onClose: () => void;
    invoice: Invoice;
    currency: string;
    onSubmit: (data: RecordPaymentData) => Promise<void>;
    isPending?: boolean;
}

const PAYMENT_METHODS = [
    'Bank Transfer',
    'Cash',
    'Check',
    'Wire Transfer',
    'PayPal',
    'Venmo',
    'Zelle',
    'Other',
];

function formatCurrencySymbol(currency: string): string {
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 })
            .format(0).replace(/[\d,.\s]/g, '').trim();
    } catch {
        return '$';
    }
}

export default function RecordPaymentDialog({
    open, onClose, invoice, currency, onSubmit, isPending,
}: RecordPaymentDialogProps) {
    const balance = Number(invoice.amount) - Number(invoice.amount_paid ?? 0);
    const symbol = formatCurrencySymbol(currency);

    const [amount, setAmount] = useState(balance.toFixed(2));
    const [method, setMethod] = useState('Bank Transfer');
    const [transactionId, setTransactionId] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        const parsed = parseFloat(amount);
        if (!amount || isNaN(parsed) || parsed <= 0) {
            errs.amount = 'Enter a valid amount greater than zero';
        } else if (parsed > balance + 0.01) {
            errs.amount = `Amount exceeds remaining balance (${balance.toFixed(2)})`;
        }
        if (!paymentDate) {
            errs.paymentDate = 'Payment date is required';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        await onSubmit({
            amount: parseFloat(amount),
            payment_method: method,
            transaction_id: transactionId || undefined,
            payment_date: new Date(paymentDate).toISOString(),
            notes: notes || undefined,
        });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: '#0a0f1e',
                    border: '1px solid rgba(148,163,184,0.1)',
                    borderRadius: 3,
                },
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaymentIcon sx={{ fontSize: 20, color: '#22c55e' }} />
                    <Typography sx={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.95rem' }}>
                        Record Payment
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: '#64748b' }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 1.5 }}>
                {/* Invoice context */}
                <Box sx={{
                    px: 2, py: 1.25, mb: 2.5, borderRadius: '10px',
                    bgcolor: 'rgba(236, 72, 153, 0.06)',
                    border: '1px solid rgba(236, 72, 153, 0.12)',
                }}>
                    <Typography sx={{ color: '#f1f5f9', fontSize: '0.82rem', fontWeight: 600 }}>
                        {invoice.invoice_number}
                        {invoice.title ? ` — ${invoice.title}` : ''}
                    </Typography>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem', mt: 0.25 }}>
                        Balance due: <strong style={{ color: '#ec4899' }}>{symbol}{balance.toFixed(2)}</strong>
                    </Typography>
                </Box>

                {/* Amount */}
                <TextField
                    label="Amount"
                    fullWidth
                    size="small"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    error={!!errors.amount}
                    helperText={errors.amount}
                    InputProps={{
                        startAdornment: <InputAdornment position="start">{symbol}</InputAdornment>,
                    }}
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#f1f5f9', bgcolor: 'rgba(15,23,42,0.6)' } }}
                />

                {/* Payment Method */}
                <TextField
                    label="Payment Method"
                    fullWidth
                    size="small"
                    select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#f1f5f9', bgcolor: 'rgba(15,23,42,0.6)' } }}
                >
                    {PAYMENT_METHODS.map((m) => (
                        <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                </TextField>

                {/* Payment Date */}
                <TextField
                    label="Payment Date"
                    fullWidth
                    size="small"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    error={!!errors.paymentDate}
                    helperText={errors.paymentDate}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#f1f5f9', bgcolor: 'rgba(15,23,42,0.6)' } }}
                />

                {/* Transaction Reference */}
                <TextField
                    label="Transaction Reference (optional)"
                    fullWidth
                    size="small"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. bank ref, check number"
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#f1f5f9', bgcolor: 'rgba(15,23,42,0.6)' } }}
                />

                {/* Notes */}
                <TextField
                    label="Notes (optional)"
                    fullWidth
                    size="small"
                    multiline
                    minRows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { color: '#f1f5f9', bgcolor: 'rgba(15,23,42,0.6)' } }}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ color: '#94a3b8', textTransform: 'none' }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isPending}
                    sx={{
                        textTransform: 'none', fontWeight: 700,
                        bgcolor: '#22c55e', color: '#fff',
                        '&:hover': { bgcolor: '#16a34a' },
                    }}
                >
                    {isPending ? 'Recording…' : 'Record Payment'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
