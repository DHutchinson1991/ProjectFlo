'use client';

import React from 'react';
import {
    Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem,
    InputAdornment,
} from '@mui/material';
import type { FinanceMilestone } from '../types';
import type { PaymentScheduleTemplate } from '@/features/finance/payment-schedules/types';
import { formatCurrency } from '@projectflo/shared';
import PaymentScheduleRows from './PaymentScheduleRows';

interface FinanceSummarySidebarProps {
    subtotal: number;
    totalAmount: number;
    taxRate: number;
    onTaxRateChange: (v: number) => void;
    /** Quotes-only: deposit field */
    depositRequired?: number;
    onDepositRequiredChange?: (v: number) => void;
    paymentMethod: string;
    onPaymentMethodChange: (v: string) => void;
    /** Quotes-only: installments field */
    installments?: number;
    onInstallmentsChange?: (v: number) => void;
    currency: string;
    /** Accent color for focused borders and highlights. Green for estimates, red for quotes. */
    accentColor: string;
    milestones: FinanceMilestone[];
    previewTemplate?: PaymentScheduleTemplate | null;
    /** Optional label shown above the payment schedule rows (e.g. template name) */
    scheduleLabel?: string | null;
    scheduleEmptyMessage?: string;
}

const FinanceSummarySidebar: React.FC<FinanceSummarySidebarProps> = ({
    subtotal,
    totalAmount,
    taxRate,
    onTaxRateChange,
    depositRequired,
    onDepositRequiredChange,
    paymentMethod,
    onPaymentMethodChange,
    installments,
    onInstallmentsChange,
    currency,
    accentColor,
    milestones,
    previewTemplate,
    scheduleLabel,
    scheduleEmptyMessage,
}) => {
    const focusedBorder = { '&.Mui-focused fieldset': { borderColor: accentColor } };
    const focusedNotchedBorder = { '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: accentColor } };

    return (
        <Box sx={{
            width: { xs: '100%', lg: 340 },
            borderLeft: { lg: '1px solid rgba(148,163,184,0.08)' },
            bgcolor: '#060b14',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
        }}>
            {/* Total hero */}
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(148,163,184,0.08)', textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.8px', mb: 1 }}>
                    Total Amount
                </Typography>
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '2.2rem', color: '#f59e0b', lineHeight: 1 }}>
                    {formatCurrency(totalAmount, currency)}
                </Typography>
                {taxRate > 0 && (
                    <Typography sx={{ fontSize: '0.7rem', color: '#475569', mt: 0.75 }}>
                        {formatCurrency(subtotal, currency)} + {taxRate}% tax
                    </Typography>
                )}
            </Box>

            {/* Subtotal + Tax + optional Deposit */}
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>Subtotal</Typography>
                    <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 600 }}>
                        {formatCurrency(subtotal, currency)}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: depositRequired !== undefined ? 2 : 0 }}>
                    <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>Tax rate</Typography>
                    <TextField
                        size="small" type="number"
                        value={taxRate}
                        onChange={(e) => onTaxRateChange(Number(e.target.value))}
                        InputProps={{ endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: '0.75rem', color: '#475569' }}>%</Typography></InputAdornment> }}
                        sx={{
                            width: 90,
                            '& .MuiOutlinedInput-root': {
                                bgcolor: 'rgba(255,255,255,0.03)', fontSize: '0.82rem',
                                '& fieldset': { borderColor: 'rgba(148,163,184,0.1)' },
                                '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.2)' },
                                ...focusedBorder,
                            },
                            '& input': { py: 0.6, color: '#94a3b8', textAlign: 'right' },
                        }}
                    />
                </Box>
                {depositRequired !== undefined && onDepositRequiredChange && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>Deposit</Typography>
                        <TextField
                            size="small" type="number"
                            value={depositRequired}
                            onChange={(e) => onDepositRequiredChange(Number(e.target.value))}
                            sx={{
                                width: 120,
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'rgba(255,255,255,0.03)', fontSize: '0.82rem',
                                    '& fieldset': { borderColor: 'rgba(148,163,184,0.1)' },
                                    '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.2)' },
                                    ...focusedBorder,
                                },
                                '& input': { py: 0.6, color: '#94a3b8' },
                            }}
                        />
                    </Box>
                )}
            </Box>

            {/* Payment settings */}
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.8px', mb: 2 }}>
                    Payment
                </Typography>
                <FormControl fullWidth size="small" sx={{ mb: installments !== undefined ? 2 : 0 }}>
                    <InputLabel sx={{ fontSize: '0.78rem', color: '#475569 !important' }}>Payment Method</InputLabel>
                    <Select
                        value={paymentMethod}
                        label="Payment Method"
                        onChange={(e) => onPaymentMethodChange(e.target.value)}
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.03)', fontSize: '0.82rem', color: '#94a3b8',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.1)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.2)' },
                            ...focusedNotchedBorder,
                        }}
                    >
                        <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                        <MenuItem value="Credit Card">Credit Card</MenuItem>
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="Check">Check</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                    </Select>
                </FormControl>
                {installments !== undefined && onInstallmentsChange && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>Installments</Typography>
                        <TextField
                            size="small" type="number"
                            value={installments}
                            onChange={(e) => onInstallmentsChange(Math.max(1, Number(e.target.value)))}
                            sx={{
                                width: 80,
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'rgba(255,255,255,0.03)', fontSize: '0.82rem',
                                    '& fieldset': { borderColor: 'rgba(148,163,184,0.1)' },
                                    ...focusedBorder,
                                },
                                '& input': { py: 0.6, color: '#94a3b8', textAlign: 'center' },
                            }}
                            inputProps={{ min: 1 }}
                        />
                    </Box>
                )}
            </Box>

            {/* Payment Schedule */}
            <Box sx={{ p: 3, flex: 1 }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.8px', mb: 1.5 }}>
                    Payment Schedule
                </Typography>
                {scheduleLabel !== undefined && (
                    <Typography sx={{ fontSize: '0.78rem', color: scheduleLabel ? '#94a3b8' : '#334155', fontStyle: scheduleLabel ? 'normal' : 'italic', mb: 1.5 }}>
                        {scheduleLabel ?? 'No schedule set — change in Payment Terms.'}
                    </Typography>
                )}
                <PaymentScheduleRows
                    milestones={milestones}
                    previewTemplate={previewTemplate}
                    totalAmount={totalAmount}
                    currency={currency}
                    emptyMessage={scheduleEmptyMessage}
                />
            </Box>
        </Box>
    );
};

export default FinanceSummarySidebar;
