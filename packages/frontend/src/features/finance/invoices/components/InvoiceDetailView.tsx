'use client';

import React from 'react';
import { Box, Typography, Stack, Divider } from '@mui/material';
import { CheckCircle, AccountBalance } from '@mui/icons-material';
import { formatCurrency } from '@projectflo/shared';
import type { Invoice } from '../types';

interface InvoiceDetailViewProps {
    invoice: Invoice;
    currency: string;
    showBranding?: boolean;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    Draft: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', label: 'DRAFT' },
    Sent: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', label: 'AWAITING PAYMENT' },
    Paid: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', label: 'PAID' },
    Overdue: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', label: 'OVERDUE' },
    'Partially Paid': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', label: 'PARTIALLY PAID' },
};

function fmtDate(dateStr: string | null | undefined) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function fmtShortDate(dateStr: string | null | undefined) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function InvoiceDetailView({ invoice, currency, showBranding = true }: InvoiceDetailViewProps) {
    const statusCfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.Draft;
    const subtotal = Number(invoice.subtotal ?? invoice.amount);
    const taxRate = Number(invoice.tax_rate ?? 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = Number(invoice.amount);
    const amountPaid = Number(invoice.amount_paid ?? 0);
    const balanceDue = total - amountPaid;
    const brand = invoice.brand;
    const contact = invoice.inquiry?.contact;

    return (
        <Box sx={{
            bgcolor: '#0d1117',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(148, 163, 184, 0.08)',
        }}>
            {/* Status Banner */}
            <Box sx={{
                py: 0.75, px: 3, textAlign: 'center',
                bgcolor: statusCfg.bg,
                borderBottom: `2px solid ${statusCfg.color}40`,
            }}>
                <Typography sx={{
                    color: statusCfg.color, fontSize: '0.65rem', fontWeight: 800,
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                }}>
                    {statusCfg.label}
                </Typography>
            </Box>

            {/* Invoice Header */}
            <Box sx={{ px: { xs: 2.5, md: 4 }, pt: 3, pb: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    {/* Brand Info */}
                    <Box>
                        {showBranding && brand?.logo_url && (
                            <Box
                                component="img"
                                src={brand.logo_url}
                                alt={brand.display_name || brand.name}
                                sx={{ height: 40, width: 'auto', objectFit: 'contain', mb: 1.5 }}
                            />
                        )}
                        {showBranding && brand && (
                            <Box>
                                <Typography sx={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1rem' }}>
                                    {brand.display_name || brand.name}
                                </Typography>
                                {brand.address_line1 && (
                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.5 }}>
                                        {brand.address_line1}
                                        {brand.city && `, ${brand.city}`}
                                        {brand.state && `, ${brand.state}`}
                                        {brand.postal_code && ` ${brand.postal_code}`}
                                    </Typography>
                                )}
                                {brand.email && (
                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>{brand.email}</Typography>
                                )}
                                {brand.phone && (
                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>{brand.phone}</Typography>
                                )}
                                {brand.tax_number && (
                                    <Typography sx={{ color: '#64748b', fontSize: '0.68rem', mt: 0.5 }}>
                                        Tax ID: {brand.tax_number}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>

                    {/* Invoice identifier */}
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{
                            color: '#f1f5f9', fontWeight: 200, fontSize: '1.8rem',
                            letterSpacing: '-0.02em', lineHeight: 1,
                        }}>
                            INVOICE
                        </Typography>
                        <Typography sx={{ color: '#ec4899', fontSize: '0.85rem', fontWeight: 700, mt: 0.5 }}>
                            {invoice.invoice_number}
                        </Typography>
                    </Box>
                </Box>

                {/* Bill To + Invoice Details */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, mb: 3 }}>
                    {/* Bill To */}
                    {contact && (
                        <Box>
                            <Typography sx={{
                                color: '#64748b', fontSize: '0.58rem', fontWeight: 700,
                                letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.75,
                            }}>
                                Bill To
                            </Typography>
                            <Typography sx={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600 }}>
                                {[contact.first_name, contact.last_name].filter(Boolean).join(' ')}
                            </Typography>
                            {contact.email && (
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>{contact.email}</Typography>
                            )}
                            {contact.phone_number && (
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>{contact.phone_number}</Typography>
                            )}
                        </Box>
                    )}

                    {/* Invoice Meta */}
                    <Box sx={{ textAlign: 'right' }}>
                        <Stack spacing={0.75}>
                            <Box>
                                <Typography sx={{ color: '#64748b', fontSize: '0.62rem', fontWeight: 600 }}>Issue Date</Typography>
                                <Typography sx={{ color: '#f1f5f9', fontSize: '0.82rem', fontWeight: 500 }}>
                                    {fmtDate(invoice.issue_date)}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography sx={{ color: '#64748b', fontSize: '0.62rem', fontWeight: 600 }}>Due Date</Typography>
                                <Typography sx={{
                                    color: invoice.status === 'Overdue' ? '#ef4444' : '#f1f5f9',
                                    fontSize: '0.82rem', fontWeight: 600,
                                }}>
                                    {fmtDate(invoice.due_date)}
                                </Typography>
                            </Box>
                            {invoice.payment_method && (
                                <Box>
                                    <Typography sx={{ color: '#64748b', fontSize: '0.62rem', fontWeight: 600 }}>Payment Method</Typography>
                                    <Typography sx={{ color: '#f1f5f9', fontSize: '0.82rem', fontWeight: 500 }}>
                                        {invoice.payment_method}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </Box>
                </Box>

                {/* Description / Title */}
                {invoice.title && (
                    <Box sx={{
                        px: 2, py: 1.25, mb: 2.5, borderRadius: '10px',
                        bgcolor: 'rgba(236, 72, 153, 0.06)',
                        border: '1px solid rgba(236, 72, 153, 0.12)',
                    }}>
                        <Typography sx={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 600 }}>
                            {invoice.title}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Line Items Table */}
            <Box sx={{ px: { xs: 2.5, md: 4 } }}>
                {/* Table Header */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 100px 100px',
                    gap: 1.5,
                    px: 1.5, py: 1,
                    borderRadius: '8px 8px 0 0',
                    bgcolor: 'rgba(148, 163, 184, 0.06)',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                }}>
                    {['Description', 'Qty', 'Unit Price', 'Amount'].map((h, i) => (
                        <Typography key={h} sx={{
                            color: '#64748b', fontSize: '0.6rem', fontWeight: 700,
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            textAlign: i > 0 ? 'right' : 'left',
                        }}>
                            {h}
                        </Typography>
                    ))}
                </Box>

                {/* Table Rows */}
                {invoice.items.map((item, idx) => {
                    const qty = Number(item.quantity);
                    const price = Number(item.unit_price);
                    const lineTotal = qty * price;
                    return (
                        <Box key={idx} sx={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 80px 100px 100px',
                            gap: 1.5,
                            px: 1.5, py: 1.25,
                            borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
                            '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.03)' },
                            transition: 'background 0.15s',
                        }}>
                            <Box>
                                <Typography sx={{ color: '#f1f5f9', fontSize: '0.82rem', fontWeight: 500 }}>
                                    {item.description}
                                </Typography>
                                {item.category && (
                                    <Typography sx={{ color: '#64748b', fontSize: '0.65rem', mt: 0.25 }}>
                                        {item.category}
                                    </Typography>
                                )}
                            </Box>
                            <Typography sx={{ color: '#cbd5e1', fontSize: '0.82rem', textAlign: 'right' }}>
                                {qty % 1 === 0 ? qty : qty.toFixed(2)}
                            </Typography>
                            <Typography sx={{ color: '#cbd5e1', fontSize: '0.82rem', textAlign: 'right' }}>
                                {formatCurrency(price, currency)}
                            </Typography>
                            <Typography sx={{ color: '#f1f5f9', fontSize: '0.82rem', fontWeight: 600, textAlign: 'right' }}>
                                {formatCurrency(lineTotal, currency)}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>

            {/* Totals */}
            <Box sx={{ px: { xs: 2.5, md: 4 }, py: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Box sx={{ width: 280 }}>
                        <Stack spacing={0.75}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem' }}>Subtotal</Typography>
                                <Typography sx={{ color: '#f1f5f9', fontSize: '0.78rem', fontWeight: 600 }}>
                                    {formatCurrency(subtotal, currency)}
                                </Typography>
                            </Box>
                            {taxRate > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                                        Tax ({taxRate}%)
                                    </Typography>
                                    <Typography sx={{ color: '#f1f5f9', fontSize: '0.78rem', fontWeight: 600 }}>
                                        {formatCurrency(taxAmount, currency)}
                                    </Typography>
                                </Box>
                            )}

                            <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.15)', my: 0.5 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography sx={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 700 }}>Total</Typography>
                                <Typography sx={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 700 }}>
                                    {formatCurrency(total, currency)}
                                </Typography>
                            </Box>

                            {amountPaid > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography sx={{ color: '#22c55e', fontSize: '0.78rem' }}>Paid</Typography>
                                    <Typography sx={{ color: '#22c55e', fontSize: '0.78rem', fontWeight: 600 }}>
                                        −{formatCurrency(amountPaid, currency)}
                                    </Typography>
                                </Box>
                            )}

                            {/* Balance Due — hero section */}
                            <Box sx={{
                                mt: 1, pt: 1.5, borderTop: '2px solid rgba(236, 72, 153, 0.3)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                            }}>
                                <Typography sx={{ color: '#ec4899', fontSize: '0.82rem', fontWeight: 700 }}>
                                    Balance Due
                                </Typography>
                                <Typography sx={{
                                    color: balanceDue > 0 ? '#ec4899' : '#22c55e',
                                    fontSize: '1.3rem', fontWeight: 800,
                                }}>
                                    {formatCurrency(balanceDue, currency)}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>
                </Box>
            </Box>

            {/* Payment History */}
            {invoice.payments && invoice.payments.length > 0 && (
                <Box sx={{ px: { xs: 2.5, md: 4 }, pb: 2.5 }}>
                    <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.08)', mb: 2 }} />
                    <Typography sx={{
                        color: '#64748b', fontSize: '0.58rem', fontWeight: 700,
                        letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1,
                    }}>
                        Payment History
                    </Typography>
                    <Stack spacing={0.75}>
                        {invoice.payments.map((payment) => (
                            <Box key={payment.id} sx={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                px: 1.5, py: 1, borderRadius: '8px',
                                bgcolor: 'rgba(34, 197, 94, 0.06)',
                                border: '1px solid rgba(34, 197, 94, 0.1)',
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircle sx={{ fontSize: 14, color: '#22c55e' }} />
                                    <Box>
                                        <Typography sx={{ color: '#f1f5f9', fontSize: '0.78rem', fontWeight: 500 }}>
                                            {payment.payment_method || 'Payment'}
                                        </Typography>
                                        <Typography sx={{ color: '#64748b', fontSize: '0.65rem' }}>
                                            {fmtShortDate(payment.payment_date)}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography sx={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: 700 }}>
                                    {formatCurrency(Number(payment.amount), currency)}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* Notes & Terms */}
            {(invoice.notes || invoice.terms) && (
                <Box sx={{ px: { xs: 2.5, md: 4 }, pb: 2.5 }}>
                    <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.08)', mb: 2 }} />
                    {invoice.notes && (
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{
                                color: '#64748b', fontSize: '0.58rem', fontWeight: 700,
                                letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5,
                            }}>
                                Notes
                            </Typography>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.6 }}>
                                {invoice.notes}
                            </Typography>
                        </Box>
                    )}
                    {invoice.terms && (
                        <Box>
                            <Typography sx={{
                                color: '#64748b', fontSize: '0.58rem', fontWeight: 700,
                                letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5,
                            }}>
                                Terms & Conditions
                            </Typography>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.6 }}>
                                {invoice.terms}
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* Bank Details */}
            {showBranding && brand && (brand.bank_name || brand.bank_account_number) && (
                <Box sx={{ px: { xs: 2.5, md: 4 }, pb: 3 }}>
                    <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.08)', mb: 2 }} />
                    <Box sx={{
                        px: 2, py: 1.5, borderRadius: '10px',
                        bgcolor: 'rgba(99, 102, 241, 0.06)',
                        border: '1px solid rgba(99, 102, 241, 0.12)',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AccountBalance sx={{ fontSize: 16, color: '#6366f1' }} />
                            <Typography sx={{
                                color: '#6366f1', fontSize: '0.62rem', fontWeight: 700,
                                letterSpacing: '0.1em', textTransform: 'uppercase',
                            }}>
                                Payment Details
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                            {brand.bank_name && (
                                <Box>
                                    <Typography sx={{ color: '#64748b', fontSize: '0.65rem' }}>Bank</Typography>
                                    <Typography sx={{ color: '#f1f5f9', fontSize: '0.78rem', fontWeight: 500 }}>
                                        {brand.bank_name}
                                    </Typography>
                                </Box>
                            )}
                            {brand.bank_account_name && (
                                <Box>
                                    <Typography sx={{ color: '#64748b', fontSize: '0.65rem' }}>Account Name</Typography>
                                    <Typography sx={{ color: '#f1f5f9', fontSize: '0.78rem', fontWeight: 500 }}>
                                        {brand.bank_account_name}
                                    </Typography>
                                </Box>
                            )}
                            {brand.bank_sort_code && (
                                <Box>
                                    <Typography sx={{ color: '#64748b', fontSize: '0.65rem' }}>Sort Code</Typography>
                                    <Typography sx={{ color: '#f1f5f9', fontSize: '0.78rem', fontWeight: 500 }}>
                                        {brand.bank_sort_code}
                                    </Typography>
                                </Box>
                            )}
                            {brand.bank_account_number && (
                                <Box>
                                    <Typography sx={{ color: '#64748b', fontSize: '0.65rem' }}>Account No.</Typography>
                                    <Typography sx={{ color: '#f1f5f9', fontSize: '0.78rem', fontWeight: 500 }}>
                                        {brand.bank_account_number}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Footer */}
            <Box sx={{
                px: { xs: 2.5, md: 4 }, py: 2,
                bgcolor: 'rgba(148, 163, 184, 0.03)',
                borderTop: '1px solid rgba(148, 163, 184, 0.06)',
                textAlign: 'center',
            }}>
                <Typography sx={{ color: '#475569', fontSize: '0.65rem' }}>
                    Thank you for your business
                    {brand?.display_name || brand?.name ? ` — ${brand.display_name || brand.name}` : ''}
                </Typography>
            </Box>
        </Box>
    );
}
