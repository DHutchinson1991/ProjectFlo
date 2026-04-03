'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, CardContent, Button, Stack, Chip,
} from '@mui/material';
import { AttachMoney, Add } from '@mui/icons-material';
import { estimatesApi, useInquiryEstimates, useDeleteEstimate, useSendEstimate, useRefreshEstimateCosts, useReviseEstimate, useUpdateEstimate } from '@/features/finance/estimates';
import { useBrand } from '@/features/platform/brand';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import type { Estimate, EstimateSnapshot } from '@/features/finance/estimates/types';
import type { WorkflowCardProps } from '@/features/workflow/inquiries/lib';
import { WorkflowCard } from '@/shared/ui/WorkflowCard';
import { useEstimateAutoGen } from '../hooks/useEstimateAutoGen';
import EstimateListItem from './EstimateListItem';
import EstimateVersionPopover from './EstimateVersionPopover';
import EstimateBuilderDialog from './EstimateBuilderDialog';
import type { LineItem } from '@/features/finance/shared/components/line-item-editor';

interface EstimatesCardProps extends WorkflowCardProps {
    collapsedByDefault?: boolean;
}

const EstimatesCard: React.FC<EstimatesCardProps> = ({
    inquiry,
    onRefresh,
    isActive,
    activeColor,
    collapsedByDefault = false,
}) => {
    const { currentBrand } = useBrand();
    const currency = currentBrand?.currency ?? DEFAULT_CURRENCY;

    const { estimates } = useInquiryEstimates(inquiry?.id);
    const deleteEstimateMutation = useDeleteEstimate(inquiry?.id);
    const sendEstimateMutation = useSendEstimate(inquiry?.id);
    const refreshCostsMutation = useRefreshEstimateCosts(inquiry?.id);
    const reviseEstimateMutation = useReviseEstimate(inquiry?.id);
    const updateEstimateMutation = useUpdateEstimate(inquiry?.id);

    const deleteEstimate = deleteEstimateMutation.mutateAsync;
    const sendEstimate = sendEstimateMutation.mutateAsync;
    const refreshEstimate = refreshCostsMutation.mutateAsync;
    const reviseEstimate = reviseEstimateMutation.mutateAsync;
    const updateEstimate = (estimateId: number, data: Parameters<typeof estimatesApi.update>[2]) =>
        updateEstimateMutation.mutateAsync({ estimateId, data });

    const { generateInitialItems } = useEstimateAutoGen(inquiry);

    // Accordion state
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [snapshots, setSnapshots] = useState<Record<number, EstimateSnapshot[]>>({});
    const [loadingSnapshots, setLoadingSnapshots] = useState<Record<number, boolean>>({});

    // Version popover state
    const [versionAnchor, setVersionAnchor] = useState<HTMLElement | null>(null);
    const [versionEstimateId, setVersionEstimateId] = useState<number | null>(null);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null);
    const [createPayload, setCreatePayload] = useState<{ initialLineItems: LineItem[]; initialTitle: string } | null>(null);
    const autoExpandIdRef = useRef<number | null>(null);

    // Auto-expand primary or recently-saved estimate
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
            if (collapsedByDefault) return;
            const primary = estimates.find((e) => e.is_primary);
            if (primary) setExpandedId(primary.id);
        }
    }, [collapsedByDefault, estimates]);

    // Load snapshots when accordion expands
    useEffect(() => {
        if (expandedId && !snapshots[expandedId]) {
            setLoadingSnapshots(prev => ({ ...prev, [expandedId]: true }));
            estimatesApi.getSnapshots(inquiry.id, expandedId)
                .then(data => setSnapshots(prev => ({ ...prev, [expandedId]: data })))
                .catch(() => setSnapshots(prev => ({ ...prev, [expandedId]: [] })))
                .finally(() => setLoadingSnapshots(prev => ({ ...prev, [expandedId]: false })));
        }
    }, [expandedId]);

    const toggleExpand = (id: number) => {
        const next = expandedId === id ? null : id;
        setExpandedId(next);
        if (next && !snapshots[id]) {
            setLoadingSnapshots(prev => ({ ...prev, [id]: true }));
            estimatesApi.getSnapshots(inquiry.id, id)
                .then(data => setSnapshots(prev => ({ ...prev, [id]: data })))
                .catch(() => setSnapshots(prev => ({ ...prev, [id]: [] })))
                .finally(() => setLoadingSnapshots(prev => ({ ...prev, [id]: false })));
        }
    };

    const handleVersionClick = (id: number, anchor: HTMLElement) => {
        setVersionEstimateId(id);
        setVersionAnchor(anchor);
        if (!snapshots[id]) {
            setLoadingSnapshots(prev => ({ ...prev, [id]: true }));
            estimatesApi.getSnapshots(inquiry.id, id)
                .then(data => setSnapshots(prev => ({ ...prev, [id]: data })))
                .catch(() => setSnapshots(prev => ({ ...prev, [id]: [] })))
                .finally(() => setLoadingSnapshots(prev => ({ ...prev, [id]: false })));
        }
    };

    const handleCreate = async () => {
        try {
            const { initialItems, pkgTitle } = await generateInitialItems();
            setEditingEstimate(null);
            setCreatePayload({ initialLineItems: initialItems, initialTitle: pkgTitle });
            setDialogOpen(true);
        } catch (err) {
            console.error('Error generating estimate items:', err);
        }
    };

    const handleEdit = (estimate: Estimate) => {
        setCreatePayload(null);
        setEditingEstimate(estimate);
        setDialogOpen(true);
    };

    const handleSaved = (estimateId: number) => {
        setDialogOpen(false);
        autoExpandIdRef.current = estimateId;
        if (onRefresh) onRefresh();
    };

    const handleDelete = async (estimateId: number): Promise<void> => {
        if (!confirm('Are you sure you want to delete this estimate? This action cannot be undone.')) return;
        try {
            await deleteEstimate(estimateId);
            setDialogOpen(false);
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error deleting estimate:', err);
            alert(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleDeleteFromList = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        handleDelete(id).catch(console.error);
    };

    const handleSetPrimary = async (estimateId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await updateEstimate(estimateId, { is_primary: true });
            setExpandedId(estimateId);
        } catch (err) {
            console.error('Error setting primary:', err);
            alert(`Failed to set primary: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleRefreshCosts = async (estimateId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await refreshEstimate(estimateId);
            const updated = await estimatesApi.getSnapshots(inquiry.id, estimateId);
            setSnapshots(prev => ({ ...prev, [estimateId]: updated }));
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error refreshing costs:', err);
            alert(`Failed to refresh costs: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleRevise = async (estimateId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await reviseEstimate(estimateId);
            const updated = await estimatesApi.getSnapshots(inquiry.id, estimateId);
            setSnapshots(prev => ({ ...prev, [estimateId]: updated }));
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error revising estimate:', err);
            alert(`Failed to revise estimate: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleSend = async (estimateId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await sendEstimate(estimateId);
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error sending estimate:', err);
            alert(`Failed to send estimate: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

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
                            {estimates.length > 0 && (
                                <Chip label={estimates.length} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }} />
                            )}
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
                        <Stack spacing={1.5}>
                            {estimates.map((estimate) => (
                                <EstimateListItem
                                    key={estimate.id}
                                    estimate={estimate}
                                    isExpanded={expandedId === estimate.id}
                                    currency={currency}
                                    onToggleExpand={toggleExpand}
                                    onEdit={handleEdit}
                                    onDelete={handleDeleteFromList}
                                    onSetPrimary={handleSetPrimary}
                                    onRefreshCosts={handleRefreshCosts}
                                    onRevise={handleRevise}
                                    onSend={handleSend}
                                    onVersionClick={handleVersionClick}
                                />
                            ))}
                        </Stack>
                    )}
                </CardContent>
            </WorkflowCard>

            <EstimateVersionPopover
                anchorEl={versionAnchor}
                onClose={() => setVersionAnchor(null)}
                estimate={estimates.find(e => e.id === versionEstimateId) ?? null}
                snapshots={versionEstimateId ? (snapshots[versionEstimateId] ?? []) : []}
                loading={versionEstimateId ? (loadingSnapshots[versionEstimateId] ?? false) : false}
                currency={currency}
            />

            <EstimateBuilderDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                inquiry={inquiry}
                estimate={editingEstimate}
                createPayload={createPayload}
                onSaved={handleSaved}
                onDelete={handleDelete}
                onRefresh={onRefresh}
            />
        </>
    );
};

export { EstimatesCard };
