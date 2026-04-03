"use client";

import React from 'react';
import { Box, Typography, Divider, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { formatDate, formatCurrency } from '@/features/workflow/proposals/utils/portal/formatting';
import type { PortalDashboardColors } from '@/features/workflow/proposals/utils/portal/themes';
import type { InvoiceData } from './PortalSectionContent';

export function InvoicesContent({ data, colors, currency }: { data: InvoiceData[]; colors: PortalDashboardColors; currency: string }) {
    const invoices = data;
    const totalAmount = invoices.reduce((s, i) => s + Number(i.total_amount), 0);
    const totalPaid = invoices.reduce((s, i) => s + Number(i.amount_paid ?? 0), 0);
    const outstanding = totalAmount - totalPaid;
    const progressPct = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
    const sortedInvoices = [...invoices].sort((a, b) => {
        const milestoneA = a.milestone?.order_index ?? 999;
        const milestoneB = b.milestone?.order_index ?? 999;
        return milestoneA - milestoneB;
    });

    return (
        <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5 }}>
            {/* Payment Progress Overview */}
            <PaymentProgressBar colors={colors} currency={currency}
                totalPaid={totalPaid} outstanding={outstanding} totalAmount={totalAmount} progressPct={progressPct} />

            {/* Payment Plan Timeline */}
            {sortedInvoices.length > 1 && (
                <PaymentTimeline invoices={sortedInvoices} colors={colors} currency={currency} />
            )}

            {/* Individual Invoice Details */}
            {sortedInvoices.map((inv) => (
                <InvoiceDetail key={inv.id} inv={inv} colors={colors} currency={currency} />
            ))}

            {/* Payment Terms */}
            {sortedInvoices.some(i => i.terms) && (
                <Box sx={{ mt: 1, p: 2, borderRadius: '10px', bgcolor: alpha(colors.border, 0.04), border: `1px solid ${alpha(colors.border, 0.08)}` }}>
                    <Typography sx={{ color: colors.muted, fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.75 }}>
                        Payment Terms
                    </Typography>
                    <Typography sx={{ color: colors.muted, fontSize: '0.72rem', lineHeight: 1.6 }}>
                        {sortedInvoices.find(i => i.terms)?.terms}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

/* ── Progress Bar ───────────────────────────────────────── */

function PaymentProgressBar({ colors, currency, totalPaid, outstanding, totalAmount, progressPct }: {
    colors: PortalDashboardColors; currency: string;
    totalPaid: number; outstanding: number; totalAmount: number; progressPct: number;
}) {
    return (
        <Box sx={{ p: 2.5, mb: 3, borderRadius: '14px', bgcolor: alpha(colors.card, 0.6), border: `1px solid ${alpha(colors.border, 0.3)}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}>
                <Typography sx={{ color: colors.muted, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Payment Progress
                </Typography>
                <Typography sx={{ color: colors.text, fontSize: '0.78rem', fontWeight: 600 }}>
                    {Math.round(progressPct)}% Complete
                </Typography>
            </Box>
            <Box sx={{ position: 'relative', height: 8, borderRadius: 4, bgcolor: alpha(colors.border, 0.2), overflow: 'hidden', mb: 2 }}>
                <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progressPct}%`, borderRadius: 4, background: 'linear-gradient(90deg, #ec4899, #8b5cf6)', transition: 'width 0.6s ease' }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1, px: 1.5, py: 1, borderRadius: '10px', bgcolor: alpha(colors.green, 0.06), border: `1px solid ${alpha(colors.green, 0.12)}` }}>
                    <Typography sx={{ color: colors.muted, fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Paid</Typography>
                    <Typography sx={{ color: colors.green, fontSize: '1rem', fontWeight: 700 }}>{formatCurrency(totalPaid, currency)}</Typography>
                </Box>
                <Box sx={{ flex: 1, px: 1.5, py: 1, borderRadius: '10px', bgcolor: alpha('#ec4899', 0.06), border: `1px solid ${alpha('#ec4899', 0.12)}` }}>
                    <Typography sx={{ color: colors.muted, fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Outstanding</Typography>
                    <Typography sx={{ color: outstanding > 0 ? '#ec4899' : colors.green, fontSize: '1rem', fontWeight: 700 }}>{formatCurrency(outstanding, currency)}</Typography>
                </Box>
                <Box sx={{ flex: 1, px: 1.5, py: 1, borderRadius: '10px', bgcolor: alpha(colors.border, 0.06), border: `1px solid ${alpha(colors.border, 0.08)}` }}>
                    <Typography sx={{ color: colors.muted, fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Total</Typography>
                    <Typography sx={{ color: colors.text, fontSize: '1rem', fontWeight: 700 }}>{formatCurrency(totalAmount, currency)}</Typography>
                </Box>
            </Box>
        </Box>
    );
}

/* ── Payment Timeline ───────────────────────────────────── */

function PaymentTimeline({ invoices, colors, currency }: { invoices: InvoiceData[]; colors: PortalDashboardColors; currency: string }) {
    return (
        <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ color: colors.muted, fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5 }}>
                Payment Schedule
            </Typography>
            {invoices.map((inv, idx) => {
                const isPaid = inv.status === 'Paid';
                const isOverdue = inv.status === 'Overdue';
                const isCurrent = !isPaid && idx === invoices.findIndex(i => i.status !== 'Paid');
                const dotColor = isPaid ? colors.green : isOverdue ? '#ef4444' : isCurrent ? '#ec4899' : colors.muted;
                const isLast = idx === invoices.length - 1;

                return (
                    <Box key={inv.id} sx={{ display: 'flex', gap: 2, mb: isLast ? 0 : 0.5 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.25 }}>
                            <Box sx={{
                                width: isCurrent ? 14 : 10, height: isCurrent ? 14 : 10,
                                borderRadius: '50%', flexShrink: 0,
                                bgcolor: isPaid ? dotColor : 'transparent',
                                border: `2px solid ${dotColor}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                ...(isCurrent && { boxShadow: `0 0 8px ${alpha('#ec4899', 0.4)}` }),
                            }}>
                                {isPaid && <CheckCircleIcon sx={{ fontSize: 8, color: colors.card }} />}
                            </Box>
                            {!isLast && (
                                <Box sx={{ width: 1.5, flexGrow: 1, minHeight: 32, bgcolor: isPaid ? alpha(colors.green, 0.3) : alpha(colors.border, 0.2) }} />
                            )}
                        </Box>
                        <Box sx={{
                            flex: 1, px: 2, py: 1.25, mb: isLast ? 0 : 0.5,
                            borderRadius: '10px',
                            bgcolor: isCurrent ? alpha('#ec4899', 0.06) : alpha(colors.card, 0.4),
                            border: `1px solid ${isCurrent ? alpha('#ec4899', 0.2) : alpha(colors.border, 0.15)}`,
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography sx={{ color: colors.text, fontSize: '0.82rem', fontWeight: 600 }}>
                                        {inv.title || inv.milestone?.label || inv.invoice_number}
                                    </Typography>
                                    <Typography sx={{ color: colors.muted, fontSize: '0.68rem' }}>
                                        {isPaid ? `Paid ${formatDate(inv.paid_date)}` : `Due ${formatDate(inv.due_date)}`}
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography sx={{ color: colors.text, fontSize: '0.9rem', fontWeight: 700 }}>
                                        {formatCurrency(inv.total_amount, currency)}
                                    </Typography>
                                    <Chip label={inv.status} size="small" sx={{
                                        height: 18, fontSize: '0.55rem', fontWeight: 700, mt: 0.25,
                                        bgcolor: isPaid ? alpha(colors.green, 0.12) : isOverdue ? alpha('#ef4444', 0.12) : alpha('#f59e0b', 0.12),
                                        color: isPaid ? colors.green : isOverdue ? '#ef4444' : '#f59e0b',
                                        '& .MuiChip-label': { px: 0.75 },
                                    }} />
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
}

/* ── Single Invoice Detail ──────────────────────────────── */

function InvoiceDetail({ inv, colors, currency }: { inv: InvoiceData; colors: PortalDashboardColors; currency: string }) {
    const invSubtotal = Number(inv.subtotal ?? inv.total_amount);
    const invTaxRate = Number(inv.tax_rate ?? 0);
    const invTax = invSubtotal * (invTaxRate / 100);
    const invTotal = Number(inv.total_amount);
    const invPaid = Number(inv.amount_paid ?? 0);
    const invBalance = invTotal - invPaid;
    const isPaid = inv.status === 'Paid';

    return (
        <Box sx={{ mb: 2, borderRadius: '12px', overflow: 'hidden', bgcolor: alpha(colors.card, 0.5), border: `1px solid ${alpha(colors.border, 0.2)}` }}>
            {/* Header Bar */}
            <Box sx={{
                px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                bgcolor: isPaid ? alpha(colors.green, 0.05) : alpha(colors.border, 0.04),
                borderBottom: `1px solid ${alpha(colors.border, 0.1)}`,
            }}>
                <Box>
                    <Typography sx={{ color: colors.text, fontSize: '0.85rem', fontWeight: 700 }}>
                        {inv.title || inv.invoice_number}
                    </Typography>
                    <Typography sx={{ color: colors.muted, fontSize: '0.68rem' }}>
                        {inv.invoice_number} · Issued {formatDate(inv.issued_date)}
                    </Typography>
                </Box>
                <Chip label={isPaid ? 'PAID' : inv.status.toUpperCase()} size="small" sx={{
                    height: 22, fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.05em',
                    bgcolor: isPaid ? alpha(colors.green, 0.12) : inv.status === 'Overdue' ? alpha('#ef4444', 0.12) : alpha('#f59e0b', 0.12),
                    color: isPaid ? colors.green : inv.status === 'Overdue' ? '#ef4444' : '#f59e0b',
                }} />
            </Box>

            {/* Line Items */}
            {inv.items.length > 0 && (
                <Box sx={{ px: 2.5, pt: 1.5, pb: 1 }}>
                    {inv.items.map((item, idx) => {
                        const qty = Number(item.quantity);
                        const price = Number(item.unit_price);
                        return (
                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Box>
                                    <Typography sx={{ color: colors.heading, fontSize: '0.78rem' }}>{item.description}</Typography>
                                    {item.category && <Typography sx={{ color: colors.muted, fontSize: '0.62rem' }}>{item.category}</Typography>}
                                </Box>
                                <Typography sx={{ color: colors.text, fontSize: '0.78rem', fontWeight: 600 }}>
                                    {formatCurrency(qty * price, currency)}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            )}

            {/* Totals */}
            <Box sx={{ px: 2.5, py: 1.5 }}>
                <Divider sx={{ borderColor: alpha(colors.border, 0.1), mb: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Box sx={{ width: 220 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography sx={{ color: colors.muted, fontSize: '0.72rem' }}>Subtotal</Typography>
                            <Typography sx={{ color: colors.text, fontSize: '0.72rem', fontWeight: 600 }}>{formatCurrency(invSubtotal, currency)}</Typography>
                        </Box>
                        {invTaxRate > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography sx={{ color: colors.muted, fontSize: '0.72rem' }}>Tax ({invTaxRate}%)</Typography>
                                <Typography sx={{ color: colors.text, fontSize: '0.72rem', fontWeight: 600 }}>{formatCurrency(invTax, currency)}</Typography>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.75, borderTop: `1px solid ${alpha(colors.border, 0.15)}` }}>
                            <Typography sx={{ color: colors.text, fontSize: '0.82rem', fontWeight: 700 }}>
                                {isPaid ? 'Total Paid' : 'Balance Due'}
                            </Typography>
                            <Typography sx={{ color: isPaid ? colors.green : '#ec4899', fontSize: '0.95rem', fontWeight: 800 }}>
                                {formatCurrency(isPaid ? invTotal : invBalance, currency)}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Payment History */}
            {inv.payments.length > 0 && (
                <Box sx={{ px: 2.5, pb: 1.5 }}>
                    <Typography sx={{ color: colors.muted, fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.75 }}>
                        Payments Received
                    </Typography>
                    {inv.payments.map((p) => (
                        <Box key={p.id} sx={{
                            display: 'flex', justifyContent: 'space-between', px: 1.5, py: 0.75,
                            borderRadius: '8px', mb: 0.5,
                            bgcolor: alpha(colors.green, 0.04), border: `1px solid ${alpha(colors.green, 0.08)}`,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircleIcon sx={{ fontSize: 12, color: colors.green }} />
                                <Typography sx={{ color: colors.muted, fontSize: '0.72rem' }}>
                                    {formatDate(p.payment_date)}{p.payment_method ? ` · ${p.payment_method}` : ''}
                                </Typography>
                            </Box>
                            <Typography sx={{ color: colors.green, fontSize: '0.72rem', fontWeight: 600 }}>
                                {formatCurrency(p.amount, currency)}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Notes */}
            {inv.notes && (
                <Box sx={{ px: 2.5, pb: 1.5 }}>
                    <Typography sx={{ color: colors.muted, fontSize: '0.72rem', fontStyle: 'italic', lineHeight: 1.5 }}>
                        {inv.notes}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
