import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, CardContent, Button, Chip, List, ListItem, ListItemText,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Select, MenuItem, FormControl, InputLabel, Stack, Alert, Tooltip,
    CircularProgress, Snackbar, Divider,
} from '@mui/material';
import {
    Gavel, Edit, Send, ContentCopy, CheckCircle, Visibility, OpenInNew,
    HourglassEmpty, Close, PersonAdd, Delete,
} from '@mui/icons-material';
import { contractsService } from '@/lib/api';
import type { Contract, ContractSigner } from '@/lib/types';
import type { WorkflowCardProps } from '../_lib';
import { WorkflowCard } from './WorkflowCard';

/* ── Status chip helper ──────────────────────────────────────────── */

const statusConfig: Record<string, { color: 'default' | 'info' | 'success' | 'warning'; icon: React.ReactNode }> = {
    Draft: { color: 'default', icon: <Edit sx={{ fontSize: 14 }} /> },
    Sent: { color: 'info', icon: <Send sx={{ fontSize: 14 }} /> },
    Signed: { color: 'success', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
};

/* ── Component ───────────────────────────────────────────────────── */

const ContractsCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(false);

    // Send dialog state
    const [sendOpen, setSendOpen] = useState(false);
    const [sendContractId, setSendContractId] = useState<number | null>(null);
    const [signerRows, setSignerRows] = useState([{ name: '', email: '', role: 'client' }]);
    const [sending, setSending] = useState(false);

    // Preview/signing modal state
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewContract, setPreviewContract] = useState<Contract | null>(null);

    // Snackbar
    const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success',
    });

    /* ── Load data ──────────────────────────────────────────────────── */

    const loadContracts = useCallback(async () => {
        if (!inquiry?.id) return;
        try {
            const data = await contractsService.getAllByInquiry(inquiry.id);
            setContracts(data || []);
        } catch (err) {
            console.error('Error fetching contracts:', err);
        }
    }, [inquiry?.id]);

    useEffect(() => { loadContracts(); }, [loadContracts]);

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
            setSending(true);
            await contractsService.send(inquiry.id, sendContractId, {
                signers: validSigners,
            });
            setSendOpen(false);
            await loadContracts();
            if (onRefresh) onRefresh();
            setSnack({ open: true, message: 'Contract sent for signing!', severity: 'success' });
        } catch (err) {
            console.error('Error sending contract:', err);
            setSnack({ open: true, message: 'Failed to send contract', severity: 'error' });
        } finally {
            setSending(false);
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

                {/* Contract list */}
                {contracts.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Box sx={{ width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.12)' }}>
                            <Gavel sx={{ fontSize: 22, color: '#6366f1' }} />
                        </Box>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>No contracts yet</Typography>
                        <Typography sx={{ color: '#475569', fontSize: '0.72rem', mt: 0.5 }}>
                            A Professional Services Agreement will be created automatically when the inquiry is qualified
                        </Typography>
                    </Box>
                ) : (
                    <List disablePadding>
                        {contracts.map((contract) => {
                            const cfg = statusConfig[contract.status] || statusConfig.Draft;
                            const signerTotal = contract.signers?.length || 0;
                            const signerSigned = contract.signers?.filter((s) => s.status === 'signed').length || 0;
                            return (
                                <ListItem key={contract.id} divider sx={{ px: 0, py: 1, gap: 1, alignItems: 'flex-start' }}>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#e2e8f0' }}>{contract.title}</Typography>
                                                <Chip icon={cfg.icon as React.ReactElement} label={contract.status} size="small" color={cfg.color} variant="outlined"
                                                    sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600 }} />
                                                {signerTotal > 0 && (
                                                    <Chip
                                                        label={`${signerSigned}/${signerTotal} signed`}
                                                        size="small"
                                                        color={signerSigned === signerTotal ? 'success' : 'default'}
                                                        variant="outlined"
                                                        sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600 }}
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            contract.signers && contract.signers.length > 0 ? (
                                                <Box sx={{ mt: 0.5 }}>
                                                    {contract.signers.map((s) => (
                                                        <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                                            {s.status === 'signed' ? (
                                                                <CheckCircle sx={{ fontSize: 12, color: '#22c55e' }} />
                                                            ) : s.status === 'viewed' ? (
                                                                <Visibility sx={{ fontSize: 12, color: '#3b82f6' }} />
                                                            ) : (
                                                                <HourglassEmpty sx={{ fontSize: 12, color: '#94a3b8' }} />
                                                            )}
                                                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                                {s.name} ({s.role}) — {s.status}
                                                            </Typography>
                                                            <Tooltip title="Copy signing link">
                                                                <IconButton size="small" onClick={() => handleCopySigningLink(s)} sx={{ p: 0.25 }}>
                                                                    <ContentCopy sx={{ fontSize: 12, color: '#64748b' }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            ) : null
                                        }
                                    />
                                    <Stack direction="row" spacing={0.25} sx={{ mt: 0.5 }}>
                                        <Tooltip title="Preview & Signing">
                                            <IconButton size="small" onClick={() => handleOpenPreview(contract)}>
                                                <Visibility sx={{ fontSize: 16, color: '#3b82f6' }} />
                                            </IconButton>
                                        </Tooltip>
                                        {contract.status === 'Draft' && (
                                            <Tooltip title="Send for signing">
                                                <IconButton size="small" onClick={() => handleOpenSend(contract.id)}>
                                                    <Send sx={{ fontSize: 16, color: '#6366f1' }} />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Edit contract">
                                            <IconButton size="small" onClick={() => window.open(`/sales/inquiries/${inquiry.id}/contracts/${contract.id}`, '_blank')}>
                                                <Edit sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </ListItem>
                            );
                        })}
                    </List>
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
                                Send for Signing
                            </Button>
                        )}
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => previewContract && window.open(`/sales/inquiries/${inquiry.id}/contracts/${previewContract.id}`, '_blank')}
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
                                No signers added yet. Click "Send for Signing" to add recipients and generate links.
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
                <DialogTitle sx={{ color: '#f1f5f9', fontWeight: 700, pb: 0 }}>Send Contract for Signing</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.82rem', mb: 2 }}>
                        Add signers who need to sign this contract. Each signer will receive a unique signing link.
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
                                <FormControl size="small" sx={{ minWidth: 100 }}>
                                    <InputLabel sx={{ color: '#94a3b8' }}>Role</InputLabel>
                                    <Select value={row.role} onChange={(e) => handleSignerChange(idx, 'role', e.target.value)}
                                        label="Role" sx={{ color: '#e2e8f0' }}>
                                        <MenuItem value="client">Client</MenuItem>
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
                    <Button variant="contained" disabled={sending} onClick={handleSend}
                        startIcon={sending ? <CircularProgress size={16} /> : <Send />}
                        sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
                        {sending ? 'Sending...' : 'Send for Signing'}
                    </Button>
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
