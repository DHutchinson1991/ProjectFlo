'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, CardContent, Button, Stack, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Snackbar, Alert,
} from '@mui/material';
import { AttachMoney, Add } from '@mui/icons-material';
import { useInquiryQuotes, useQuoteMutations } from '@/features/finance/quotes/hooks';
import { useBrand } from '@/features/platform/brand';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import type { Quote } from '@/features/finance/quotes/types';
import type { WorkflowCardProps } from '@/features/workflow/inquiries/lib';
import { WorkflowCard } from '@/features/workflow/inquiries/components/WorkflowCard';
import QuoteListItem from './QuoteListItem';
import QuoteBuilderDialog from './QuoteBuilderDialog';

const QuotesCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const { currentBrand } = useBrand();
    const currency = currentBrand?.currency ?? DEFAULT_CURRENCY;

    const { quotes } = useInquiryQuotes(inquiry.id);
    const { updateQuote, deleteQuote } = useQuoteMutations(inquiry.id);

    // Accordion state
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const autoExpandIdRef = useRef<number | null>(null);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

    // Delete confirmation
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // Snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('error');
    const showSnackbar = (msg: string, severity: 'success' | 'error' = 'error') => {
        setSnackbarMessage(msg);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    // Auto-expand primary or recently-saved quote
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
            if (primary) setExpandedId(primary.id);
        }
    }, [quotes]);

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleCreate = () => {
        setEditingQuote(null);
        setDialogOpen(true);
    };

    const handleEdit = (quote: Quote) => {
        setEditingQuote(quote);
        setDialogOpen(true);
    };

    const handleSaved = (quoteId: number) => {
        setDialogOpen(false);
        autoExpandIdRef.current = quoteId;
        if (onRefresh) onRefresh();
    };

    const handleDeleteRequest = (quoteId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmId(quoteId);
    };

    const handleDeleteFromDialog = (quoteId: number) => {
        setDeleteConfirmId(quoteId);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirmId) return;
        try {
            await deleteQuote.mutateAsync(deleteConfirmId);
            setDeleteConfirmId(null);
            setDialogOpen(false);
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error deleting quote:', err);
            showSnackbar(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setDeleteConfirmId(null);
        }
    };

    const handleSetPrimary = async (quoteId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await updateQuote.mutateAsync({ quoteId, data: { is_primary: true } });
            setExpandedId(quoteId);
        } catch (err) {
            console.error('Error setting primary:', err);
            showSnackbar(`Failed to set primary: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    return (
        <>
            {/* Delete confirmation dialog */}
            <Dialog open={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { bgcolor: '#0d1629', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 2 } }}>
                <DialogTitle sx={{ color: '#f1f5f9', fontSize: '0.95rem', fontWeight: 700 }}>Delete Quote</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Are you sure you want to delete this quote? This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2 }}>
                    <Button onClick={() => setDeleteConfirmId(null)} size="small" sx={{ color: '#64748b', textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} size="small" variant="contained" sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' }, textTransform: 'none' }}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Error / success snackbar */}
            <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <WorkflowCard isActive={isActive} activeColor={activeColor}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                                <AttachMoney sx={{ fontSize: 18, color: '#ef4444' }} />
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>Quotes</Typography>
                            {quotes.length > 0 && (
                                <Chip label={quotes.length} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} />
                            )}
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
                                <QuoteListItem
                                    key={quote.id}
                                    quote={quote}
                                    isExpanded={expandedId === quote.id}
                                    currency={currency}
                                    onToggleExpand={toggleExpand}
                                    onEdit={handleEdit}
                                    onDelete={handleDeleteRequest}
                                    onSetPrimary={handleSetPrimary}
                                />
                            ))}
                        </Stack>
                    )}
                </CardContent>
            </WorkflowCard>

            <QuoteBuilderDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                inquiry={inquiry}
                quote={editingQuote}
                onSaved={handleSaved}
                onDelete={handleDeleteFromDialog}
            />
        </>
    );
};

export { QuotesCard };
