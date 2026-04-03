import React, { useState, useMemo } from 'react';
import {
    Box, Typography, CardContent, Button, Chip,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Select, MenuItem, FormControl, InputLabel, Stack, Alert, Tooltip,
    CircularProgress, Snackbar, Divider,
} from '@mui/material';
import {
    Gavel, Edit, Send, ContentCopy, CheckCircle, Visibility, OpenInNew,
    HourglassEmpty, Close, PersonAdd, Delete,
    Sync, CalendarMonth, Warning, Payment, Cancel, Security, Handshake,
    Description, Schedule, CameraAlt, LocalShipping, VerifiedUser,
    Add, Remove, Article,
} from '@mui/icons-material';
import type { Contract, ContractSigner, ContractClause, ContractClauseCategory } from '@/features/finance/contracts/types';
import type { WorkflowCardProps } from '@/features/workflow/inquiries/lib';
import { WorkflowCard } from '@/shared/ui/WorkflowCard';
import { useInquiryContracts, useContractListMutations, useContractClauseCategories, useContractDetailMutations } from '../hooks';

/* ── Helpers ─────────────────────────────────────────────────────── */

/** Parse contract content JSON to extract clause/section titles */
function extractSections(contract: Contract): Array<{ clause_id?: number; title: string; category?: string; body?: string }> {
    const content = contract.content as any;
    if (!content?.sections?.length) return [];
    return content.sections.map((s: any) => ({
        clause_id: s.clause_id,
        title: s.title || 'Untitled',
        category: s.category || '',
        body: s.body || '',
    }));
}

/** Format relative time string */
function timeAgo(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

/** Format a date for display */
function fmtDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Clause category → icon map */
const clauseIconMap: Record<string, React.ReactNode> = {
    'Payment Terms': <Payment sx={{ fontSize: 16 }} />,
    'Cancellation Policy': <Cancel sx={{ fontSize: 16 }} />,
    'Cancellation': <Cancel sx={{ fontSize: 16 }} />,
    'Liability': <Security sx={{ fontSize: 16 }} />,
    'Limitation of Liability': <Security sx={{ fontSize: 16 }} />,
    'Deliverables': <LocalShipping sx={{ fontSize: 16 }} />,
    'Usage Rights': <VerifiedUser sx={{ fontSize: 16 }} />,
    'Image Rights': <CameraAlt sx={{ fontSize: 16 }} />,
    'Confidentiality': <Security sx={{ fontSize: 16 }} />,
    'Force Majeure': <Warning sx={{ fontSize: 16 }} />,
    'Governing Law': <Gavel sx={{ fontSize: 16 }} />,
    'Agreement': <Handshake sx={{ fontSize: 16 }} />,
    'Schedule': <Schedule sx={{ fontSize: 16 }} />,
    'Scope of Work': <Description sx={{ fontSize: 16 }} />,
};

function getClauseIcon(title: string, category?: string): React.ReactNode {
    // Check title first, then category
    for (const [key, icon] of Object.entries(clauseIconMap)) {
        if (title.toLowerCase().includes(key.toLowerCase()) || category?.toLowerCase().includes(key.toLowerCase())) {
            return icon;
        }
    }
    return <Article sx={{ fontSize: 16 }} />;
}

/** Category → color palette (indigo/violet/blue variations for contract theme) */
const categoryColors: Record<string, { bg: string; icon: string; border: string }> = {
    'Payment Terms': { bg: 'rgba(99,102,241,0.08)', icon: '#818cf8', border: 'rgba(99,102,241,0.2)' },
    'Cancellation & Rescheduling': { bg: 'rgba(244,63,94,0.07)', icon: '#fb7185', border: 'rgba(244,63,94,0.18)' },
    'Cancellation': { bg: 'rgba(244,63,94,0.07)', icon: '#fb7185', border: 'rgba(244,63,94,0.18)' },
    'Liability & Insurance': { bg: 'rgba(245,158,11,0.07)', icon: '#fbbf24', border: 'rgba(245,158,11,0.18)' },
    'Intellectual Property': { bg: 'rgba(139,92,246,0.08)', icon: '#a78bfa', border: 'rgba(139,92,246,0.2)' },
    'Confidentiality': { bg: 'rgba(20,184,166,0.07)', icon: '#2dd4bf', border: 'rgba(20,184,166,0.18)' },
    'Force Majeure': { bg: 'rgba(245,158,11,0.07)', icon: '#fbbf24', border: 'rgba(245,158,11,0.18)' },
    'General Provisions': { bg: 'rgba(148,163,184,0.06)', icon: '#94a3b8', border: 'rgba(148,163,184,0.15)' },
    'Scope of Work': { bg: 'rgba(59,130,246,0.07)', icon: '#60a5fa', border: 'rgba(59,130,246,0.18)' },
};
const defaultCatColor = { bg: 'rgba(99,102,241,0.06)', icon: '#818cf8', border: 'rgba(99,102,241,0.15)' };

function getCatColor(category?: string) {
    if (!category) return defaultCatColor;
    return categoryColors[category] || defaultCatColor;
}

const statusConfig: Record<string, { color: 'default' | 'info' | 'success' | 'warning'; icon: React.ReactNode; label?: string }> = {
    Draft: { color: 'default', icon: <Edit sx={{ fontSize: 14 }} /> },
    Sent: { color: 'info', icon: <Visibility sx={{ fontSize: 14 }} />, label: 'Published' },
    Signed: { color: 'success', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
};

/* ── Component ───────────────────────────────────────────────────── */

const ContractsCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const { contracts, isLoading } = useInquiryContracts(inquiry?.id);
    const { sendContract, deleteContract } = useContractListMutations(inquiry?.id);
    const { data: clauseCategories } = useContractClauseCategories();

    // Send dialog state
    const [sendOpen, setSendOpen] = useState(false);
    const [sendContractId, setSendContractId] = useState<number | null>(null);
    const [signerRows, setSignerRows] = useState([{ name: '', email: '', role: 'client' }]);
    // Preview/signing modal state
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewContract, setPreviewContract] = useState<Contract | null>(null);
    // Add clause dialog
    const [addClauseOpen, setAddClauseOpen] = useState(false);
    const [addClauseContractId, setAddClauseContractId] = useState<number | null>(null);
    // Inline clause quick-edit
    const [editingClause, setEditingClause] = useState<{ contractId: number; sectionIdx: number } | null>(null);
    const [editClauseBody, setEditClauseBody] = useState('');
    // Signing date edit
    const [editDateContractId, setEditDateContractId] = useState<number | null>(null);
    const [editDateValue, setEditDateValue] = useState('');

    // Snackbar
    const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success',
    });

    /** All available clauses flat list from categories */
    const allClauses = useMemo(() => {
        if (!clauseCategories) return [];
        return clauseCategories.flatMap((cat: ContractClauseCategory) =>
            cat.clauses.map((c: ContractClause) => ({ ...c, categoryName: cat.name }))
        );
    }, [clauseCategories]);

    /** Get clauses currently in a contract's content */
    function getContractClauseIds(contract: Contract): number[] {
        return extractSections(contract).map(s => s.clause_id).filter((id): id is number => !!id);
    }

    /* ── Clause management helpers ──────────────────────────────────── */

    /** Remove a section from contract content by index */
    const handleRemoveClause = async (contract: Contract, sectionIdx: number) => {
        const sections = extractSections(contract);
        const updated = sections.filter((_, i) => i !== sectionIdx);
        try {
            const { updateContract } = getDetailMutations(contract);
            await updateContract.mutateAsync({ content: { sections: updated } as any });
            if (onRefresh) onRefresh();
            setSnack({ open: true, message: 'Clause removed', severity: 'success' });
        } catch {
            setSnack({ open: true, message: 'Failed to remove clause', severity: 'error' });
        }
    };

    /** Add a clause from the library to a contract's content */
    const handleAddClause = async (contract: Contract, clause: ContractClause & { categoryName: string }) => {
        const sections = extractSections(contract);
        sections.push({
            clause_id: clause.id,
            title: clause.title,
            category: clause.categoryName,
            body: clause.body,
        });
        try {
            const { updateContract } = getDetailMutations(contract);
            await updateContract.mutateAsync({ content: { sections } as any });
            if (onRefresh) onRefresh();
            setSnack({ open: true, message: `Added: ${clause.title}`, severity: 'success' });
        } catch {
            setSnack({ open: true, message: 'Failed to add clause', severity: 'error' });
        }
    };

    /** Inline quick-edit: save updated clause body */
    const handleSaveClauseEdit = async (contract: Contract, sectionIdx: number, newBody: string) => {
        const sections = extractSections(contract);
        sections[sectionIdx] = { ...sections[sectionIdx], body: newBody };
        try {
            const { updateContract } = getDetailMutations(contract);
            await updateContract.mutateAsync({ content: { sections } as any });
            setEditingClause(null);
            if (onRefresh) onRefresh();
            setSnack({ open: true, message: 'Clause updated', severity: 'success' });
        } catch {
            setSnack({ open: true, message: 'Failed to update clause', severity: 'error' });
        }
    };

    /** Save signed_date */
    const handleSaveSignedDate = async (contract: Contract, dateStr: string) => {
        try {
            const { updateContract } = getDetailMutations(contract);
            await updateContract.mutateAsync({ signed_date: dateStr ? new Date(dateStr) : null });
            setEditDateContractId(null);
            if (onRefresh) onRefresh();
            setSnack({ open: true, message: 'Signing date updated', severity: 'success' });
        } catch {
            setSnack({ open: true, message: 'Failed to update signing date', severity: 'error' });
        }
    };

    /** Sync contract with its template */
    const handleSyncTemplate = async (contract: Contract) => {
        try {
            const { syncTemplate } = getDetailMutations(contract);
            await syncTemplate.mutateAsync();
            if (onRefresh) onRefresh();
            setSnack({ open: true, message: 'Contract synced with template', severity: 'success' });
        } catch {
            setSnack({ open: true, message: 'Failed to sync template', severity: 'error' });
        }
    };

    /** Get detail mutations for a specific contract (memoize-friendly inline) */
    function getDetailMutations(contract: Contract) {
        // We use the hook at top level but need per-contract — call the API directly
        return {
            updateContract: {
                mutateAsync: async (data: any) => {
                    const { contractsApi } = await import('../api');
                    const result = await contractsApi.update(inquiry.id, contract.id, data);
                    return result;
                },
            },
            syncTemplate: {
                mutateAsync: async () => {
                    const { contractsApi } = await import('../api');
                    return contractsApi.syncTemplate(inquiry.id, contract.id);
                },
            },
        };
    }

    /* ── Send contract ──────────────────────────────────────────────── */

    const handleOpenSend = (contractId: number) => {
        const contract = contracts.find((c) => c.id === contractId);
        setSendContractId(contractId);
        // Pre-fill with contact info
        setSignerRows([{
            name: `${inquiry.contact?.first_name || ''} ${inquiry.contact?.last_name || ''}`.trim(),
            email: inquiry.contact?.email || '',
            role: 'client',
        }]);
        setSendOpen(true);
    };

    const handleAddSigner = () => {
        setSignerRows((prev) => [...prev, { name: '', email: '', role: 'client' }]);
    };

    const handleRemoveSigner = (idx: number) => {
        setSignerRows((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSignerChange = (idx: number, field: 'name' | 'email' | 'role', value: string) => {
        setSignerRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
    };

    const handleSend = async () => {
        if (!sendContractId) return;
        const validSigners = signerRows.filter((s) => s.name && s.email);
        if (validSigners.length === 0) {
            setSnack({ open: true, message: 'Add at least one signer with name and email', severity: 'error' });
            return;
        }
        try {
            await sendContract.mutateAsync({ contractId: sendContractId, data: { signers: validSigners } });
            setSendOpen(false);
            if (onRefresh) onRefresh();
            setSnack({ open: true, message: 'Contract published to proposal!', severity: 'success' });
        } catch {
            setSnack({ open: true, message: 'Failed to send contract', severity: 'error' });
        }
    };

    /* ── Copy signing link ──────────────────────────────────────────── */

    const handleCopySigningLink = (signer: ContractSigner) => {
        const link = `${window.location.origin}/sign/${signer.token}`;
        navigator.clipboard.writeText(link);
        setSnack({ open: true, message: `Signing link copied for ${signer.name}`, severity: 'success' });
    };

    const handleOpenSigningPage = (signer: ContractSigner) => {
        const link = `${window.location.origin}/sign/${signer.token}`;
        window.open(link, '_blank');
    };

    const getPreviewHtml = (contract: Contract): string => {
        if (contract.rendered_html) return contract.rendered_html;

        const contentData = contract.content as any;
        if (contentData?.sections?.length) {
            const htmlSections = contentData.sections.map((s: any) => (
                `<div class="contract-section">` +
                `<h3>${String(s.title || '')}</h3>` +
                `<p>${String(s.body || '').replace(/\n/g, '<br/>')}</p>` +
                `</div>`
            ));
            return `<div class="contract-document">${htmlSections.join('\n')}</div>`;
        }

        return '<div style="padding:16px;color:#94a3b8;">No rendered preview available yet.</div>';
    };

    const handleOpenPreview = (contract: Contract) => {
        setPreviewContract(contract);
        setPreviewOpen(true);
    };

    /* ── Render ─────────────────────────────────────────────────────── */

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                            <Gavel sx={{ fontSize: 18, color: '#6366f1' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>Contracts</Typography>
                        {contracts.length > 0 && <Chip label={contracts.length} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }} />}
                    </Box>
                </Box>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : contracts.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Box sx={{ width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.12)' }}>
                            <Gavel sx={{ fontSize: 22, color: '#6366f1' }} />
                        </Box>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>No contracts yet</Typography>
                        <Typography sx={{ color: '#475569', fontSize: '0.72rem', mt: 0.5 }}>
                            A Professional Services Agreement will be created automatically when the proposal is generated
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {contracts.map((contract) => {
                            const cfg = statusConfig[contract.status] || statusConfig.Draft;
                            const signerTotal = contract.signers?.length || 0;
                            const signerSigned = contract.signers?.filter((s) => s.status === 'signed').length || 0;
                            const sections = extractSections(contract);

                            // Stale warning
                            const sentAt = contract.sent_at ? new Date(contract.sent_at) : null;
                            const daysSinceSent = sentAt ? Math.floor((Date.now() - sentAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                            const isStale = contract.status === 'Sent' && daysSinceSent > 7 && signerSigned < signerTotal;

                            return (
                                <Box key={contract.id}>
                                    {/* ── Contract header ── */}
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4, flexWrap: 'wrap' }}>
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>
                                                    {contract.title}
                                                </Typography>
                                                <Chip
                                                    icon={cfg.icon as React.ReactElement}
                                                    label={cfg.label || contract.status}
                                                    size="small" color={cfg.color} variant="outlined"
                                                    sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600 }}
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                                <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                                                    Created {fmtDate(contract.created_at)}
                                                </Typography>
                                                {contract.sent_at && (
                                                    <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>· Sent {timeAgo(contract.sent_at)}</Typography>
                                                )}
                                                {contract.signed_date ? (
                                                    <Tooltip title="Click to edit signing deadline">
                                                        <Typography
                                                            onClick={() => { setEditDateContractId(contract.id); setEditDateValue(new Date(contract.signed_date!).toISOString().split('T')[0]); }}
                                                            sx={{ fontSize: '0.68rem', color: contract.status === 'Signed' ? '#22c55e' : '#f59e0b', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                                                            · {contract.status === 'Signed' ? 'Signed' : 'Sign by'} {fmtDate(contract.signed_date)}
                                                        </Typography>
                                                    </Tooltip>
                                                ) : contract.status !== 'Draft' ? (
                                                    <Chip icon={<CalendarMonth sx={{ fontSize: 10 }} />} label="Set signing deadline" size="small" variant="outlined"
                                                        onClick={() => { setEditDateContractId(contract.id); setEditDateValue(''); }}
                                                        sx={{ height: 18, fontSize: '0.58rem', color: '#94a3b8', borderColor: 'rgba(148,163,184,0.2)', cursor: 'pointer' }} />
                                                ) : null}
                                            </Box>
                                        </Box>
                                        <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
                                            <Tooltip title="Preview"><IconButton size="small" onClick={() => handleOpenPreview(contract)} sx={{ color: '#475569', '&:hover': { color: '#3b82f6' } }}><Visibility sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                                            {contract.status === 'Draft' && (
                                                <Tooltip title="Publish"><IconButton size="small" onClick={() => handleOpenSend(contract.id)} sx={{ color: '#475569', '&:hover': { color: '#6366f1' } }}><Send sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                                            )}
                                            {contract.template_id && contract.status === 'Draft' && (
                                                <Tooltip title="Sync template"><IconButton size="small" onClick={() => handleSyncTemplate(contract)} sx={{ color: '#475569', '&:hover': { color: '#a78bfa' } }}><Sync sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                                            )}
                                            <Tooltip title="Edit"><IconButton size="small" onClick={() => window.open(`/inquiries/${inquiry.id}/contracts/${contract.id}`, '_blank')} sx={{ color: '#475569', '&:hover': { color: '#e2e8f0' } }}><Edit sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                                            <Tooltip title="Delete"><IconButton size="small" onClick={async () => {
                                                try { await deleteContract.mutateAsync(contract.id); if (onRefresh) onRefresh(); setSnack({ open: true, message: 'Contract deleted', severity: 'success' }); }
                                                catch { setSnack({ open: true, message: 'Failed to delete', severity: 'error' }); }
                                            }} sx={{ color: '#475569', '&:hover': { color: '#ef4444' } }}><Delete sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                                        </Stack>
                                    </Box>

                                    {/* ── Inline date editor ── */}
                                    {editDateContractId === contract.id && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1, borderRadius: 1.5, bgcolor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                                            <CalendarMonth sx={{ fontSize: 16, color: '#a78bfa' }} />
                                            <TextField type="date" size="small" value={editDateValue} onChange={(e) => setEditDateValue(e.target.value)}
                                                sx={{ flex: 1, '& input': { color: '#e2e8f0', fontSize: '0.78rem', py: 0.5 } }} InputLabelProps={{ shrink: true }} />
                                            <Button size="small" variant="contained" onClick={() => handleSaveSignedDate(contract, editDateValue)}
                                                sx={{ minWidth: 0, px: 1.5, py: 0.25, fontSize: '0.7rem', textTransform: 'none', bgcolor: '#6366f1' }}>Save</Button>
                                            <IconButton size="small" onClick={() => setEditDateContractId(null)} sx={{ p: 0.25 }}>
                                                <Close sx={{ fontSize: 14, color: '#94a3b8' }} />
                                            </IconButton>
                                        </Box>
                                    )}

                                    {/* ── Stale warning ── */}
                                    {isStale && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1, py: 0.5, px: 1, borderRadius: 1.5, bgcolor: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}>
                                            <Warning sx={{ fontSize: 13, color: '#f59e0b' }} />
                                            <Typography sx={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 500 }}>Awaiting signature for {daysSinceSent} days</Typography>
                                        </Box>
                                    )}

                                    {/* ── Signers ── */}
                                    {signerTotal > 0 && (
                                        <Box sx={{ mb: 1.25, p: 1, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.03)', border: '1px solid rgba(148,163,184,0.07)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                    Signatures
                                                </Typography>
                                                <Chip
                                                    label={signerSigned === signerTotal ? 'All signed' : `${signerSigned}/${signerTotal}`}
                                                    size="small"
                                                    sx={{
                                                        height: 18, fontSize: '0.58rem', fontWeight: 700,
                                                        bgcolor: signerSigned === signerTotal ? 'rgba(34,197,94,0.08)' : 'transparent',
                                                        color: signerSigned === signerTotal ? '#22c55e' : '#64748b',
                                                        border: `1px solid ${signerSigned === signerTotal ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.12)'}`,
                                                    }}
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: '3px', mb: 0.75 }}>
                                                {contract.signers?.map((s) => (
                                                    <Tooltip key={s.id} title={`${s.name} — ${s.status}`}>
                                                        <Box sx={{ flex: 1, height: 3, borderRadius: 1,
                                                            bgcolor: s.status === 'signed' ? '#22c55e' : s.status === 'viewed' ? '#3b82f6' : 'rgba(148,163,184,0.12)',
                                                        }} />
                                                    </Tooltip>
                                                ))}
                                            </Box>
                                            {contract.signers?.map((s) => (
                                                <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.3 }}>
                                                    <Box sx={{
                                                        width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                        bgcolor: s.status === 'signed' ? 'rgba(34,197,94,0.1)' : s.status === 'viewed' ? 'rgba(59,130,246,0.1)' : 'rgba(148,163,184,0.06)',
                                                    }}>
                                                        {s.status === 'signed' ? <CheckCircle sx={{ fontSize: 11, color: '#22c55e' }} />
                                                            : s.status === 'viewed' ? <Visibility sx={{ fontSize: 11, color: '#3b82f6' }} />
                                                                : <HourglassEmpty sx={{ fontSize: 11, color: '#64748b' }} />}
                                                    </Box>
                                                    <Typography sx={{ fontSize: '0.68rem', color: '#cbd5e1', flex: 1 }}>{s.name}</Typography>
                                                    <Typography sx={{ fontSize: '0.58rem', color: '#475569' }}>{s.role}</Typography>
                                                    <Tooltip title="Copy signing link">
                                                        <IconButton size="small" onClick={() => handleCopySigningLink(s)} sx={{ p: 0.25, color: '#475569', '&:hover': { color: '#94a3b8' } }}>
                                                            <ContentCopy sx={{ fontSize: 11 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}

                                    {/* ── Clauses ── */}
                                    {sections.length > 0 && (
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                    {sections.length} Clauses
                                                </Typography>
                                                {contract.status === 'Draft' && (
                                                    <Chip icon={<Add sx={{ fontSize: 11 }} />} label="Add" size="small" variant="outlined"
                                                        onClick={() => { setAddClauseContractId(contract.id); setAddClauseOpen(true); }}
                                                        sx={{ height: 20, fontSize: '0.58rem', fontWeight: 600, color: '#6366f1', borderColor: 'rgba(99,102,241,0.25)', cursor: 'pointer' }} />
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: 0.75 }}>
                                                {sections.map((section, idx) => {
                                                    const isEditing = editingClause?.contractId === contract.id && editingClause.sectionIdx === idx;
                                                    const bodyPreview = (section.body || '').replace(/\{\{[^}]+\}\}/g, '___').slice(0, 65);
                                                    const cc = getCatColor(section.category);
                                                    return (
                                                        <Box key={idx}>
                                                            <Box
                                                                onClick={() => {
                                                                    if (contract.status === 'Draft') {
                                                                        setEditingClause({ contractId: contract.id, sectionIdx: idx });
                                                                        setEditClauseBody(section.body || '');
                                                                    }
                                                                }}
                                                                sx={{
                                                                    p: 1, borderRadius: 2,
                                                                    bgcolor: cc.bg,
                                                                    border: `1px solid ${isEditing ? cc.icon : cc.border}`,
                                                                    cursor: contract.status === 'Draft' ? 'pointer' : 'default',
                                                                    position: 'relative', transition: 'all 0.15s',
                                                                    '&:hover': contract.status === 'Draft' ? {
                                                                        borderColor: cc.icon,
                                                                        boxShadow: `0 0 12px ${cc.bg}`,
                                                                        '& .clause-remove': { opacity: 1 },
                                                                    } : {},
                                                                }}
                                                            >
                                                                {contract.status === 'Draft' && (
                                                                    <IconButton className="clause-remove" size="small"
                                                                        onClick={(e) => { e.stopPropagation(); handleRemoveClause(contract, idx); }}
                                                                        sx={{ position: 'absolute', top: 3, right: 3, p: 0.25, opacity: 0, transition: 'opacity 0.15s', color: '#ef4444', borderRadius: 1, '&:hover': { bgcolor: 'rgba(239,68,68,0.12)' } }}>
                                                                        <Remove sx={{ fontSize: 11 }} />
                                                                    </IconButton>
                                                                )}
                                                                <Box sx={{ width: 22, height: 22, borderRadius: 1.25, mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${cc.icon}15`, color: cc.icon }}>
                                                                    {getClauseIcon(section.title, section.category)}
                                                                </Box>
                                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.25, mb: 0.15,
                                                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                    {section.title}
                                                                </Typography>
                                                                {section.category && (
                                                                    <Typography sx={{ fontSize: '0.52rem', color: cc.icon, fontWeight: 500, mb: 0.25, opacity: 0.8 }}>
                                                                        {section.category}
                                                                    </Typography>
                                                                )}
                                                                {bodyPreview && (
                                                                    <Typography sx={{ fontSize: '0.52rem', color: '#475569', lineHeight: 1.35,
                                                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                        {bodyPreview}{(section.body || '').length > 65 ? '…' : ''}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                            {isEditing && (
                                                                <Box sx={{ mt: 0.75, p: 0.75, borderRadius: 1.5, bgcolor: 'rgba(15,23,42,0.4)', border: `1px solid ${cc.border}` }}>
                                                                    <TextField multiline minRows={2} maxRows={6} fullWidth size="small" value={editClauseBody}
                                                                        onChange={(e) => setEditClauseBody(e.target.value)}
                                                                        sx={{ '& textarea': { color: '#e2e8f0', fontSize: '0.72rem' }, '& .MuiOutlinedInput-root': { borderColor: cc.border } }} />
                                                                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, justifyContent: 'flex-end' }}>
                                                                        <Button size="small" onClick={() => setEditingClause(null)}
                                                                            sx={{ fontSize: '0.65rem', textTransform: 'none', color: '#94a3b8', minWidth: 0, px: 1 }}>Cancel</Button>
                                                                        <Button size="small" variant="contained" onClick={() => handleSaveClauseEdit(contract, idx, editClauseBody)}
                                                                            sx={{ fontSize: '0.65rem', textTransform: 'none', bgcolor: '#6366f1', minWidth: 0, px: 1.5 }}>Save</Button>
                                                                    </Stack>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </CardContent>

            {/* ── Preview & Signing Dialog ─────────────────────────────── */}
            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { bgcolor: '#1e293b', borderRadius: 3, border: '1px solid rgba(148,163,184,0.12)', height: '85vh' } }}
            >
                <DialogTitle sx={{ color: '#f1f5f9', fontWeight: 700, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography sx={{ fontWeight: 700, color: '#f1f5f9' }}>Contract Preview</Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                {previewContract?.title || 'Untitled Contract'}
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setPreviewOpen(false)} size="small" sx={{ color: '#94a3b8' }}>
                            <Close fontSize="small" />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}>
                    <Stack direction="row" spacing={1}>
                        {previewContract?.status === 'Draft' && (
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<Send />}
                                onClick={() => {
                                    if (previewContract) {
                                        setPreviewOpen(false);
                                        handleOpenSend(previewContract.id);
                                    }
                                }}
                                sx={{ textTransform: 'none', borderRadius: 2 }}
                            >
                                Publish to Proposal
                            </Button>
                        )}
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => previewContract && window.open(`/inquiries/${inquiry.id}/contracts/${previewContract.id}`, '_blank')}
                            sx={{ textTransform: 'none', borderRadius: 2, color: '#94a3b8', borderColor: 'rgba(148,163,184,0.35)' }}
                        >
                            Edit Contract
                        </Button>
                    </Stack>

                    <Box sx={{ flex: 1, minHeight: 240, borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.25)', bgcolor: '#0f172a' }}>
                        {previewContract && (
                            <iframe
                                title="Contract Preview"
                                srcDoc={getPreviewHtml(previewContract)}
                                style={{ width: '100%', height: '100%', border: 0, background: 'white' }}
                            />
                        )}
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(148,163,184,0.2)' }} />

                    <Box>
                        <Typography sx={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 700, mb: 1 }}>
                            Signing Links
                        </Typography>
                        {!previewContract?.signers || previewContract.signers.length === 0 ? (
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                                No signers added yet. Publish the contract to add signers and make it viewable in the proposal.
                            </Typography>
                        ) : (
                            <Stack spacing={1}>
                                {previewContract.signers.map((s) => (
                                    <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, p: 1, borderRadius: 1.5, border: '1px solid rgba(148,163,184,0.25)' }}>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography sx={{ color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 600 }}>
                                                {s.name} ({s.role})
                                            </Typography>
                                            <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                                                {s.email} - {s.status}
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={0.5}>
                                            <Tooltip title="Copy signing link">
                                                <IconButton size="small" onClick={() => handleCopySigningLink(s)} sx={{ color: '#94a3b8' }}>
                                                    <ContentCopy sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Open signing page">
                                                <IconButton size="small" onClick={() => handleOpenSigningPage(s)} sx={{ color: '#60a5fa' }}>
                                                    <OpenInNew sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setPreviewOpen(false)} sx={{ color: '#94a3b8' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* ── Send for Signing Dialog ─────────────────────────────────── */}
            <Dialog open={sendOpen} onClose={() => setSendOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { bgcolor: '#1e293b', borderRadius: 3, border: '1px solid rgba(148,163,184,0.12)' } }}>
                <DialogTitle sx={{ color: '#f1f5f9', fontWeight: 700, pb: 0 }}>Publish Contract to Proposal</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.82rem', mb: 2 }}>
                        The contract will be viewable in the client proposal. Add the signers who need to sign.
                        Signers with role <strong style={{ color: '#a5b4fc' }}>Studio</strong> are counter-signed automatically on publish.
                    </Typography>
                    <Stack spacing={2}>
                        {signerRows.map((row, idx) => (
                            <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField size="small" label="Full Name" value={row.name}
                                    onChange={(e) => handleSignerChange(idx, 'name', e.target.value)}
                                    sx={{ flex: 1 }}
                                    InputProps={{ sx: { color: '#e2e8f0' } }} InputLabelProps={{ sx: { color: '#94a3b8' } }} />
                                <TextField size="small" label="Email" value={row.email}
                                    onChange={(e) => handleSignerChange(idx, 'email', e.target.value)}
                                    sx={{ flex: 1 }}
                                    InputProps={{ sx: { color: '#e2e8f0' } }} InputLabelProps={{ sx: { color: '#94a3b8' } }} />
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel sx={{ color: '#94a3b8' }}>Role</InputLabel>
                                    <Select value={row.role} onChange={(e) => handleSignerChange(idx, 'role', e.target.value)}
                                        label="Role" sx={{ color: '#e2e8f0' }}>
                                        <MenuItem value="client">Client</MenuItem>
                                        <MenuItem value="studio">
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                Studio
                                                <Chip label="Auto-signs" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(99,102,241,0.15)', color: '#a5b4fc', ml: 0.5 }} />
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="talent">Talent</MenuItem>
                                        <MenuItem value="property_owner">Property Owner</MenuItem>
                                        <MenuItem value="witness">Witness</MenuItem>
                                    </Select>
                                </FormControl>
                                {signerRows.length > 1 && (
                                    <IconButton size="small" onClick={() => handleRemoveSigner(idx)} sx={{ color: '#ef4444' }}>
                                        <Delete sx={{ fontSize: 18 }} />
                                    </IconButton>
                                )}
                            </Box>
                        ))}
                        <Button size="small" startIcon={<PersonAdd />} onClick={handleAddSigner}
                            sx={{ alignSelf: 'flex-start', textTransform: 'none', color: '#6366f1' }}>
                            Add Signer
                        </Button>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setSendOpen(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
                    <Button variant="contained" disabled={sendContract.isPending} onClick={handleSend}
                        startIcon={sendContract.isPending ? <CircularProgress size={16} /> : <Send />}
                        sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
                        {sendContract.isPending ? 'Publishing...' : 'Publish'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Add Clause Dialog ───────────────────────────────────────── */}
            <Dialog
                open={addClauseOpen}
                onClose={() => setAddClauseOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { bgcolor: '#1e293b', borderRadius: 3, border: '1px solid rgba(148,163,184,0.12)', maxHeight: '70vh' } }}
            >
                <DialogTitle sx={{ color: '#f1f5f9', fontWeight: 700, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontWeight: 700, color: '#f1f5f9' }}>Add Clause</Typography>
                        <IconButton onClick={() => setAddClauseOpen(false)} size="small" sx={{ color: '#94a3b8' }}>
                            <Close fontSize="small" />
                        </IconButton>
                    </Box>
                    <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Select clauses from your library to add to this contract
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    {(() => {
                        const targetContract = contracts.find(c => c.id === addClauseContractId);
                        const existingClauseIds = targetContract ? getContractClauseIds(targetContract) : [];
                        return (
                            <Stack spacing={2}>
                                {clauseCategories?.map((cat: ContractClauseCategory) => (
                                    <Box key={cat.id}>
                                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', mb: 0.75 }}>
                                            {cat.name}
                                        </Typography>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 0.75 }}>
                                            {cat.clauses.filter((c: ContractClause) => c.is_active).map((clause: ContractClause) => {
                                                const alreadyAdded = existingClauseIds.includes(clause.id);
                                                return (
                                                    <Box
                                                        key={clause.id}
                                                        onClick={() => {
                                                            if (!alreadyAdded && targetContract) {
                                                                handleAddClause(targetContract, { ...clause, categoryName: cat.name });
                                                            }
                                                        }}
                                                        sx={{
                                                            p: 1,
                                                            borderRadius: 1.5,
                                                            border: alreadyAdded
                                                                ? '1px solid rgba(34,197,94,0.3)'
                                                                : '1px solid rgba(148,163,184,0.15)',
                                                            bgcolor: alreadyAdded
                                                                ? 'rgba(34,197,94,0.06)'
                                                                : 'rgba(99,102,241,0.04)',
                                                            cursor: alreadyAdded ? 'default' : 'pointer',
                                                            opacity: alreadyAdded ? 0.6 : 1,
                                                            transition: 'all 0.15s',
                                                            '&:hover': alreadyAdded ? {} : {
                                                                bgcolor: 'rgba(99,102,241,0.1)',
                                                                border: '1px solid rgba(99,102,241,0.3)',
                                                            },
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: alreadyAdded ? '#22c55e' : '#a78bfa' }}>
                                                            {alreadyAdded ? <CheckCircle sx={{ fontSize: 16 }} /> : getClauseIcon(clause.title, cat.name)}
                                                        </Box>
                                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#e2e8f0', mt: 0.5, lineHeight: 1.3 }}>
                                                            {clause.title}
                                                        </Typography>
                                                        {alreadyAdded && (
                                                            <Typography sx={{ fontSize: '0.55rem', color: '#22c55e', mt: 0.25 }}>
                                                                Already added
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    </Box>
                                ))}
                                {(!clauseCategories || clauseCategories.length === 0) && (
                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', py: 2 }}>
                                        No clause categories found. Set up your clause library in Settings first.
                                    </Typography>
                                )}
                            </Stack>
                        );
                    })()}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setAddClauseOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>Done</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
                <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}
                    sx={{ width: '100%' }} variant="filled">
                    {snack.message}
                </Alert>
            </Snackbar>
        </WorkflowCard>
    );
};

export { ContractsCard };
