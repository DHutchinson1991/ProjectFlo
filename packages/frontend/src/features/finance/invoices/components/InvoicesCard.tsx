'use client';

import React, { useState } from 'react';
import {
    Box, Typography, CardContent, Stack, Chip, Button,
    Dialog, DialogTitle, DialogContent, IconButton,
    Collapse, Divider,
} from '@mui/material';
import {
    Receipt, ExpandMore, ExpandLess, Close,
    CheckCircle, Schedule, Warning, Send, DeleteOutline,
    PublishedWithChanges, OpenInNew, Payment, Email,
} from '@mui/icons-material';
import { useInquiryInvoices, useInvoiceMutations } from '@/features/finance/invoices/hooks';
import { useBrand } from '@/features/platform/brand';
import { clientPortalApi } from '@/features/workflow/client-portal/api';
import { DEFAULT_CURRENCY, formatCurrency } from '@projectflo/shared';
import type { Invoice } from '@/features/finance/invoices/types';
import type { WorkflowCardProps } from '@/features/workflow/inquiries/lib';
import { WorkflowCard } from '@/shared/ui/WorkflowCard';
import InvoiceDetailView from './InvoiceDetailView';
import RecordPaymentDialog from './RecordPaymentDialog';

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
    Draft: { color: '#64748b', icon: <Schedule sx={{ fontSize: 12 }} /> },
    Sent: { color: '#3b82f6', icon: <Send sx={{ fontSize: 12 }} /> },
    Paid: { color: '#22c55e', icon: <CheckCircle sx={{ fontSize: 12 }} /> },
    Overdue: { color: '#ef4444', icon: <Warning sx={{ fontSize: 12 }} /> },
    'Partially Paid': { color: '#f59e0b', icon: <Schedule sx={{ fontSize: 12 }} /> },
};

function getStatusConfig(status: string) {
    return STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
}

function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const InvoicesCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const { currentBrand } = useBrand();
    const currency = currentBrand?.currency ?? DEFAULT_CURRENCY;
    const { invoices } = useInquiryInvoices(inquiry.id);
    const { updateInvoice, deleteInvoice, regenerateInvoices, recordPayment } = useInvoiceMutations(inquiry.id);

    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
    const [recordingInvoice, setRecordingInvoice] = useState<Invoice | null>(null);

    const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.amount_paid ?? 0), 0);
    const totalOutstanding = totalAmount - totalPaid;
    const paidCount = invoices.filter(inv => inv.status === 'Paid').length;
    const overdueCount = invoices.filter(inv => inv.status === 'Overdue').length;

    // Get the portal share token from the inquiry's proposal
    const hasInvoices = invoices.length > 0;

    const handlePreviewPayments = async () => {
        try {
            const { portal_token } = await clientPortalApi.generateToken(inquiry.id);
            window.open(`/portal/${portal_token}/payments?preview=true`, '_blank');
        } catch (err) {
            console.error('Failed to generate portal token:', err);
        }
    };

    const handlePublishToPortal = async (invoiceId: number) => {
        try {
            await updateInvoice.mutateAsync({ invoiceId, data: { status: 'Sent' as never } });
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Failed to publish invoice:', err);
        }
    };

    const handleSendInvoice = async (invoiceId: number) => {
        try {
            await updateInvoice.mutateAsync({ invoiceId, data: { status: 'Sent' as never } });
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Failed to send invoice:', err);
        }
    };

    const handleSendReceipt = async (invoice: Invoice) => {
        try {
            const payments = [...(invoice.payments ?? [])];
            if (!payments.length) {
                window.alert('No payments recorded yet for this invoice.');
                return;
            }

            const latestPayment = payments.sort((a, b) => {
                const aTime = a.payment_date ? new Date(a.payment_date).getTime() : 0;
                const bTime = b.payment_date ? new Date(b.payment_date).getTime() : 0;
                return bTime - aTime;
            })[0];

            let receiptLink = latestPayment.receipt_url || '';
            if (!receiptLink) {
                const { portal_token } = await clientPortalApi.generateToken(inquiry.id);
                receiptLink = `${window.location.origin}/portal/${portal_token}/payments`;
            }

            const recipient = invoice.inquiry?.contact?.email ?? '';
            const amount = formatCurrency(Number(latestPayment.amount), currency);
            const paymentDate = latestPayment.payment_date
                ? new Date(latestPayment.payment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : 'recently';
            const method = latestPayment.payment_method || 'Bank Transfer';

            const subject = `Receipt for ${invoice.invoice_number}`;
            const body = [
                'Hi,',
                '',
                `Thanks for your payment of ${amount} for invoice ${invoice.invoice_number}.`,
                `Payment method: ${method}`,
                `Payment date: ${paymentDate}`,
                '',
                `View receipt/payment details: ${receiptLink}`,
                '',
                'Thank you.',
            ].join('\n');

            const mailto = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailto;
            await navigator.clipboard.writeText(body);
        } catch (err) {
            console.error('Failed to prepare receipt email:', err);
            window.alert('Could not prepare receipt email. Please try again.');
        }
    };

    return (
        <>
            {/* Invoice Detail Dialog */}
            <Dialog
                open={!!viewingInvoice}
                onClose={() => setViewingInvoice(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#0a0f1e',
                        border: '1px solid rgba(148,163,184,0.1)',
                        borderRadius: 3,
                        maxHeight: '90vh',
                    },
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
                    <Typography sx={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1rem' }}>
                        Invoice {viewingInvoice?.invoice_number}
                    </Typography>
                    <IconButton onClick={() => setViewingInvoice(null)} size="small" sx={{ color: '#64748b' }}>
                        <Close fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {viewingInvoice && (
                        <InvoiceDetailView invoice={viewingInvoice} currency={currency} />
                    )}
                </DialogContent>
            </Dialog>

            {/* Record Payment Dialog */}
            {recordingInvoice && (
                <RecordPaymentDialog
                    open
                    onClose={() => setRecordingInvoice(null)}
                    invoice={recordingInvoice}
                    currency={currency}
                    isPending={recordPayment.isPending}
                    onSubmit={async (data) => {
                        await recordPayment.mutateAsync({ invoiceId: recordingInvoice.id, data });
                        setRecordingInvoice(null);
                        if (onRefresh) await onRefresh();
                    }}
                />
            )}

            <WorkflowCard isActive={isActive} activeColor={activeColor}>
                <CardContent>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                                width: 32, height: 32, borderRadius: 2,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: 'rgba(236, 72, 153, 0.1)',
                                border: '1px solid rgba(236, 72, 153, 0.15)',
                            }}>
                                <Receipt sx={{ fontSize: 18, color: '#ec4899' }} />
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                                Invoices
                            </Typography>
                            {invoices.length > 0 && (
                                <Chip
                                    label={invoices.length}
                                    size="small"
                                    sx={{
                                        height: 20, fontSize: '0.65rem', fontWeight: 700,
                                        bgcolor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899',
                                    }}
                                />
                            )}
                        </Box>
                        {hasInvoices && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    size="small"
                                    startIcon={<PublishedWithChanges sx={{ fontSize: 14 }} />}
                                    onClick={() => regenerateInvoices.mutate()}
                                    disabled={regenerateInvoices.isPending}
                                    sx={{
                                        textTransform: 'none', fontWeight: 600, fontSize: '0.68rem',
                                        color: '#94a3b8', borderRadius: '8px',
                                        border: '1px solid rgba(148, 163, 184, 0.15)',
                                        px: 1.5, py: 0.5,
                                        '&:hover': { color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)', bgcolor: 'rgba(245, 158, 11, 0.06)' },
                                    }}
                                >
                                    {regenerateInvoices.isPending ? 'Regenerating…' : 'Regenerate'}
                                </Button>
                                <Button
                                    size="small"
                                    startIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                                    onClick={handlePreviewPayments}
                                    sx={{
                                        textTransform: 'none', fontWeight: 600, fontSize: '0.68rem',
                                        color: '#94a3b8', borderRadius: '8px',
                                        border: '1px solid rgba(148, 163, 184, 0.15)',
                                        px: 1.5, py: 0.5,
                                        '&:hover': { color: '#ec4899', borderColor: 'rgba(236, 72, 153, 0.3)', bgcolor: 'rgba(236, 72, 153, 0.06)' },
                                    }}
                                >
                                    Preview Payments
                                </Button>
                            </Box>
                        )}
                    </Box>

                    {invoices.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Box sx={{
                                width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.5,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: 'rgba(236, 72, 153, 0.08)',
                                border: '1px solid rgba(236, 72, 153, 0.12)',
                            }}>
                                <Receipt sx={{ fontSize: 22, color: '#ec4899' }} />
                            </Box>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>
                                No invoices yet
                            </Typography>
                            <Typography sx={{ color: '#475569', fontSize: '0.72rem', mt: 0.5 }}>
                                Invoices will auto-generate when you create a proposal
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {/* Summary Strip */}
                            <Box sx={{
                                display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap',
                            }}>
                                <Box sx={{
                                    flex: 1, minWidth: 80, px: 1.5, py: 1, borderRadius: '10px',
                                    bgcolor: 'rgba(236, 72, 153, 0.06)',
                                    border: '1px solid rgba(236, 72, 153, 0.12)',
                                }}>
                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        Total
                                    </Typography>
                                    <Typography sx={{ color: '#f1f5f9', fontSize: '0.95rem', fontWeight: 700 }}>
                                        {formatCurrency(totalAmount, currency)}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    flex: 1, minWidth: 80, px: 1.5, py: 1, borderRadius: '10px',
                                    bgcolor: 'rgba(34, 197, 94, 0.06)',
                                    border: '1px solid rgba(34, 197, 94, 0.12)',
                                }}>
                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        Paid
                                    </Typography>
                                    <Typography sx={{ color: '#22c55e', fontSize: '0.95rem', fontWeight: 700 }}>
                                        {formatCurrency(totalPaid, currency)}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    flex: 1, minWidth: 80, px: 1.5, py: 1, borderRadius: '10px',
                                    bgcolor: totalOutstanding > 0 ? 'rgba(239, 68, 68, 0.06)' : 'rgba(34, 197, 94, 0.06)',
                                    border: `1px solid ${totalOutstanding > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)'}`,
                                }}>
                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        Outstanding
                                    </Typography>
                                    <Typography sx={{
                                        color: totalOutstanding > 0 ? '#ef4444' : '#22c55e',
                                        fontSize: '0.95rem', fontWeight: 700,
                                    }}>
                                        {formatCurrency(totalOutstanding, currency)}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Invoice List */}
                            <Stack spacing={1}>
                                {invoices.map((invoice) => {
                                    const config = getStatusConfig(invoice.status);
                                    const isExpanded = expandedId === invoice.id;
                                    const balance = Number(invoice.amount) - Number(invoice.amount_paid ?? 0);

                                    return (
                                        <Box key={invoice.id}>
                                            <Box
                                                onClick={() => setExpandedId(isExpanded ? null : invoice.id)}
                                                sx={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    px: 2, py: 1.25, borderRadius: '10px', cursor: 'pointer',
                                                    bgcolor: 'rgba(15, 23, 42, 0.6)',
                                                    border: `1px solid ${isExpanded ? 'rgba(236, 72, 153, 0.25)' : 'rgba(148, 163, 184, 0.08)'}`,
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        borderColor: 'rgba(236, 72, 153, 0.2)',
                                                        bgcolor: 'rgba(15, 23, 42, 0.8)',
                                                    },
                                                }}
                                            >
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography sx={{ color: '#f1f5f9', fontSize: '0.82rem', fontWeight: 600 }}>
                                                            {invoice.title || invoice.invoice_number}
                                                        </Typography>
                                                        <Chip
                                                            icon={config.icon as React.ReactElement}
                                                            label={invoice.status}
                                                            size="small"
                                                            sx={{
                                                                height: 20, fontSize: '0.58rem', fontWeight: 700,
                                                                bgcolor: `${config.color}15`,
                                                                color: config.color,
                                                                '& .MuiChip-icon': { color: config.color, ml: 0.5 },
                                                                '& .MuiChip-label': { px: 0.75 },
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography sx={{ color: '#64748b', fontSize: '0.68rem', mt: 0.25 }}>
                                                        {invoice.invoice_number} · Due {formatDate(invoice.due_date)}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography sx={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 700 }}>
                                                        {formatCurrency(invoice.amount, currency)}
                                                    </Typography>
                                                    {isExpanded ? (
                                                        <ExpandLess sx={{ fontSize: 18, color: '#64748b' }} />
                                                    ) : (
                                                        <ExpandMore sx={{ fontSize: 18, color: '#64748b' }} />
                                                    )}
                                                </Box>
                                            </Box>

                                            {/* Expanded detail */}
                                            <Collapse in={isExpanded}>
                                                <Box sx={{
                                                    mt: 0.5, px: 2, py: 1.5, borderRadius: '10px',
                                                    bgcolor: 'rgba(15, 23, 42, 0.4)',
                                                    border: '1px solid rgba(148, 163, 184, 0.06)',
                                                }}>
                                                    {/* Items */}
                                                    {invoice.items.length > 0 && (
                                                        <Box sx={{ mb: 1.5 }}>
                                                            <Typography sx={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.75 }}>
                                                                Line Items
                                                            </Typography>
                                                            {invoice.items.map((item, idx) => (
                                                                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                                                    <Typography sx={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                                                                        {item.description}
                                                                    </Typography>
                                                                    <Typography sx={{ color: '#f1f5f9', fontSize: '0.75rem', fontWeight: 600 }}>
                                                                        {formatCurrency(Number(item.quantity) * Number(item.unit_price), currency)}
                                                                    </Typography>
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    )}

                                                    <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.08)', my: 1 }} />

                                                    {/* Balance */}
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>Balance Due</Typography>
                                                        <Typography sx={{ color: balance > 0 ? '#f59e0b' : '#22c55e', fontSize: '0.82rem', fontWeight: 700 }}>
                                                            {formatCurrency(balance, currency)}
                                                        </Typography>
                                                    </Box>

                                                    {/* Actions */}
                                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                                                        {invoice.status === 'Draft' && (
                                                            <Button
                                                                size="small"
                                                                startIcon={<PublishedWithChanges sx={{ fontSize: 14 }} />}
                                                                onClick={(e) => { e.stopPropagation(); handlePublishToPortal(invoice.id); }}
                                                                sx={{
                                                                    textTransform: 'none', fontWeight: 600, fontSize: '0.72rem',
                                                                    color: '#22c55e', borderRadius: '8px',
                                                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                                                    '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.08)' },
                                                                }}
                                                            >
                                                                Publish to Portal
                                                            </Button>
                                                        )}
                                                        {invoice.status === 'Draft' && (
                                                            <Button
                                                                size="small"
                                                                startIcon={<Send sx={{ fontSize: 14 }} />}
                                                                onClick={(e) => { e.stopPropagation(); handleSendInvoice(invoice.id); }}
                                                                sx={{
                                                                    textTransform: 'none', fontWeight: 600, fontSize: '0.72rem',
                                                                    color: '#3b82f6', borderRadius: '8px',
                                                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                                                    '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.08)' },
                                                                }}
                                                            >
                                                                Send
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="small"
                                                            onClick={(e) => { e.stopPropagation(); setViewingInvoice(invoice); }}
                                                            sx={{
                                                                textTransform: 'none', fontWeight: 600, fontSize: '0.72rem',
                                                                color: '#ec4899', borderRadius: '8px',
                                                                border: '1px solid rgba(236, 72, 153, 0.3)',
                                                                '&:hover': { bgcolor: 'rgba(236, 72, 153, 0.08)' },
                                                            }}
                                                        >
                                                            View Invoice
                                                        </Button>
                                                        {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && invoice.status !== 'Voided' && (
                                                            <Button
                                                                size="small"
                                                                startIcon={<Payment sx={{ fontSize: 14 }} />}
                                                                onClick={(e) => { e.stopPropagation(); setRecordingInvoice(invoice); }}
                                                                sx={{
                                                                    textTransform: 'none', fontWeight: 600, fontSize: '0.72rem',
                                                                    color: '#22c55e', borderRadius: '8px',
                                                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                                                    '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.08)' },
                                                                }}
                                                            >
                                                                Record Payment
                                                            </Button>
                                                        )}
                                                        {invoice.payments && invoice.payments.length > 0 && (
                                                            <Button
                                                                size="small"
                                                                startIcon={<Email sx={{ fontSize: 14 }} />}
                                                                onClick={(e) => { e.stopPropagation(); void handleSendReceipt(invoice); }}
                                                                sx={{
                                                                    textTransform: 'none', fontWeight: 600, fontSize: '0.72rem',
                                                                    color: '#a78bfa', borderRadius: '8px',
                                                                    border: '1px solid rgba(167, 139, 250, 0.3)',
                                                                    '&:hover': { bgcolor: 'rgba(167, 139, 250, 0.08)' },
                                                                }}
                                                            >
                                                                Send Receipt
                                                            </Button>
                                                        )}
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteInvoice.mutate(invoice.id);
                                                            }}
                                                            sx={{
                                                                color: '#64748b', borderRadius: '8px',
                                                                border: '1px solid rgba(148, 163, 184, 0.15)',
                                                                '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)' },
                                                            }}
                                                        >
                                                            <DeleteOutline sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            </Collapse>
                                        </Box>
                                    );
                                })}
                            </Stack>

                            {/* Footer summary */}
                            {paidCount > 0 || overdueCount > 0 ? (
                                <Box sx={{ display: 'flex', gap: 1, mt: 1.5, justifyContent: 'center' }}>
                                    {paidCount > 0 && (
                                        <Chip
                                            icon={<CheckCircle sx={{ fontSize: 12 }} />}
                                            label={`${paidCount} Paid`}
                                            size="small"
                                            sx={{
                                                height: 22, fontSize: '0.6rem', fontWeight: 700,
                                                bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e',
                                                '& .MuiChip-icon': { color: '#22c55e' },
                                            }}
                                        />
                                    )}
                                    {overdueCount > 0 && (
                                        <Chip
                                            icon={<Warning sx={{ fontSize: 12 }} />}
                                            label={`${overdueCount} Overdue`}
                                            size="small"
                                            sx={{
                                                height: 22, fontSize: '0.6rem', fontWeight: 700,
                                                bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                                                '& .MuiChip-icon': { color: '#ef4444' },
                                            }}
                                        />
                                    )}
                                </Box>
                            ) : null}
                        </>
                    )}
                </CardContent>
            </WorkflowCard>
        </>
    );
};

export { InvoicesCard };
