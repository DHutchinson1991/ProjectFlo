'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    AppBar,
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    InputLabel,
    FormControl,
    MenuItem,
    Select,
    Stack,
    TextField,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    ArrowBack,
    Save,
    Preview,
    History,
    Add,
    Delete,
    ArrowUpward,
    ArrowDownward,
    ContentCopy,
    OpenInNew,
    Send,
    Download,
    Gavel,
} from '@mui/icons-material';
import { api, contractsService } from '../../../../../../../lib/api';
import { ContractStatus } from '../../../../../../../lib/types';
import type { ContractClauseCategory, ContractPreview, ContractSigner, UpdateContractData } from '../../../../../../../lib/types';

type ContractSection = {
    title: string;
    body: string;
};

type ContractContentShape = {
    sections?: Array<{ title?: string; body?: string }>;
    text?: string;
};

interface LocalContract {
    id: number;
    title: string;
    content?: unknown;
    status: string;
    template_id?: number | null;
    rendered_html?: string | null;
    signers?: ContractSigner[];
    created_at: string;
    updated_at: string;
    inquiry_id: number;
}

const VARIABLE_REGEX = /\{\{\s*[\w.]+\s*\}\}/g;

function normalizeContractStatus(status: string | undefined): ContractStatus {
    const s = (status || '').toLowerCase();
    if (s === 'sent') return ContractStatus.SENT;
    if (s === 'signed') return ContractStatus.SIGNED;
    if (s === 'cancelled') return ContractStatus.CANCELLED;
    return ContractStatus.DRAFT;
}

function extractVariables(text: string): string[] {
    const vars = text.match(VARIABLE_REGEX) || [];
    return Array.from(new Set(vars.map((v) => v.replace(/[{}\s]/g, ''))));
}

type TextSegment = {
    text: string;
    isVariable: boolean;
    missing?: boolean;
};

type VariableResolution = {
    name: string;
    value: string;
    missing: boolean;
};

function highlightPlaceholderText(text: string): TextSegment[] {
    const parts = text.split(/(\{\{\s*[\w.]+\s*\}\})/g);
    return parts
        .filter((part) => part.length > 0)
        .map((part) => ({
            text: part,
            isVariable: /^\{\{\s*[\w.]+\s*\}\}$/.test(part),
        }));
}

function nextLiteralPart(parts: string[], startIndex: number): string {
    for (let i = startIndex; i < parts.length; i += 1) {
        const p = parts[i];
        if (!/^\{\{\s*[\w.]+\s*\}\}$/.test(p) && p.length > 0) {
            return p;
        }
    }
    return '';
}

function extractVariableName(part: string): string {
    const match = part.match(/^\{\{\s*([\w.]+)\s*\}\}$/);
    return match?.[1] || part.replace(/[{}\s]/g, '');
}

function resolveVariablesFromTemplate(templateText: string, renderedText: string): VariableResolution[] {
    if (!templateText || !renderedText) return [];

    const templateParts = templateText.split(/(\{\{\s*[\w.]+\s*\}\})/g);
    const hasVars = templateParts.some((p) => /^\{\{\s*[\w.]+\s*\}\}$/.test(p));
    if (!hasVars) return [];

    const resolutions: VariableResolution[] = [];
    let cursor = 0;

    for (let i = 0; i < templateParts.length; i += 1) {
        const part = templateParts[i];
        const isVar = /^\{\{\s*[\w.]+\s*\}\}$/.test(part);

        if (!isVar) {
            if (!part) continue;
            if (renderedText.slice(cursor, cursor + part.length) !== part) return [];
            cursor += part.length;
            continue;
        }

        const varName = extractVariableName(part);
        const nextLiteral = nextLiteralPart(templateParts, i + 1);
        if (!nextLiteral) {
            const value = renderedText.slice(cursor);
            resolutions.push({ name: varName, value, missing: value.trim().length === 0 });
            cursor = renderedText.length;
            continue;
        }

        const nextLiteralIdx = renderedText.indexOf(nextLiteral, cursor);
        if (nextLiteralIdx === -1) return [];

        const value = renderedText.slice(cursor, nextLiteralIdx);
        resolutions.push({ name: varName, value, missing: value.trim().length === 0 });
        cursor = nextLiteralIdx;
    }

    return resolutions;
}

function buildHighlightedSegments(displayText: string, templateText?: string): TextSegment[] {
    if (!displayText) return [];

    const hasDisplayPlaceholders = VARIABLE_REGEX.test(displayText);
    VARIABLE_REGEX.lastIndex = 0;

    if (!templateText || templateText.length === 0 || hasDisplayPlaceholders) {
        return highlightPlaceholderText(displayText);
    }

    const templateParts = templateText.split(/(\{\{\s*[\w.]+\s*\}\})/g);
    if (!templateParts.some((p) => /^\{\{\s*[\w.]+\s*\}\}$/.test(p))) {
        return highlightPlaceholderText(displayText);
    }

    const segments: TextSegment[] = [];
    let cursor = 0;

    for (let i = 0; i < templateParts.length; i += 1) {
        const part = templateParts[i];
        const isVar = /^\{\{\s*[\w.]+\s*\}\}$/.test(part);

        if (!isVar) {
            if (!part) continue;
            if (displayText.slice(cursor, cursor + part.length) !== part) {
                return highlightPlaceholderText(displayText);
            }
            segments.push({ text: part, isVariable: false });
            cursor += part.length;
            continue;
        }

        const nextLiteral = nextLiteralPart(templateParts, i + 1);
        const varName = extractVariableName(part);
        if (!nextLiteral) {
            const tail = displayText.slice(cursor);
            if (tail) {
                segments.push({ text: tail, isVariable: true, missing: false });
            } else {
                segments.push({ text: `{{${varName}}}`, isVariable: true, missing: true });
            }
            cursor = displayText.length;
            continue;
        }

        const nextLiteralIdx = displayText.indexOf(nextLiteral, cursor);
        if (nextLiteralIdx === -1) {
            return highlightPlaceholderText(displayText);
        }

        const varValue = displayText.slice(cursor, nextLiteralIdx);
        if (varValue) {
            segments.push({ text: varValue, isVariable: true, missing: false });
        } else {
            segments.push({ text: `{{${varName}}}`, isVariable: true, missing: true });
        }
        cursor = nextLiteralIdx;
    }

    if (cursor < displayText.length) {
        segments.push({ text: displayText.slice(cursor), isVariable: false });
    }

    return segments;
}

function toKey(text: string): string {
    return text.trim().toLowerCase();
}

function buildRenderedBodyMap(preview: ContractPreview | null): Record<string, string> {
    const map: Record<string, string> = {};
    if (!preview?.sections?.length) return map;
    preview.sections.forEach((s) => {
        map[toKey(s.title)] = s.body || '';
    });
    return map;
}

export default function ContractDetailPage() {
    const params = useParams();
    const router = useRouter();

    const inquiryId = parseInt(params.id as string, 10);
    const contractId = parseInt(params.contractId as string, 10);

    const [contract, setContract] = useState<LocalContract | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const [title, setTitle] = useState('');
    const [status, setStatus] = useState<ContractStatus>(ContractStatus.DRAFT);
    const [sections, setSections] = useState<ContractSection[]>([]);
    const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
    const [renderedBodyByTitle, setRenderedBodyByTitle] = useState<Record<string, string>>({});
    const [contractViewMode, setContractViewMode] = useState<'actual' | 'variables'>('actual');

    const [clauseCategories, setClauseCategories] = useState<ContractClauseCategory[]>([]);

    const [previewOpen, setPreviewOpen] = useState(false);

    const [sendOpen, setSendOpen] = useState(false);
    const [signerRows, setSignerRows] = useState([{ name: '', email: '', role: 'client' }]);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError('');

                const [data, categories] = await Promise.all([
                    contractsService.getById(inquiryId, contractId),
                    api.contractClauses.getCategories(),
                ]);

                const preview = data.template_id
                    ? await api.contractTemplates.preview(data.template_id, inquiryId)
                    : null;

                const localContract: LocalContract = {
                    id: data.id,
                    title: data.title || '',
                    content: data.content || {},
                    status: normalizeContractStatus(data.status),
                    template_id: data.template_id ?? null,
                    rendered_html: data.rendered_html ?? null,
                    signers: data.signers || [],
                    created_at: new Date(data.created_at).toISOString(),
                    updated_at: new Date(data.updated_at).toISOString(),
                    inquiry_id: data.inquiry_id,
                };

                setContract(localContract);
                setTitle(localContract.title);
                setStatus(normalizeContractStatus(localContract.status));
                setClauseCategories(categories || []);
                setRenderedBodyByTitle(buildRenderedBodyMap(preview));

                const contentData = (data.content || {}) as ContractContentShape;
                if (contentData?.sections?.length) {
                    setSections(
                        contentData.sections.map((s) => ({
                            title: s.title || '',
                            body: s.body || '',
                        })),
                    );
                } else if (contentData?.text) {
                    setSections([{ title: 'Contract', body: String(contentData.text) }]);
                } else {
                    setSections([]);
                }
            } catch (err) {
                console.error('Error loading contract:', err);
                setError('Failed to load contract details');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [inquiryId, contractId]);

    const flatClauses = useMemo(
        () =>
            clauseCategories.flatMap((cat) =>
                (cat.clauses || [])
                    .filter((c) => c.is_active)
                    .map((c) => ({ ...c, categoryName: cat.name })),
            ),
        [clauseCategories],
    );

    const sourceClauseByTitle = useMemo(() => {
        const map = new Map<string, { body: string; categoryName: string }>();
        flatClauses.forEach((c) => {
            map.set(c.title.trim().toLowerCase(), {
                body: c.body,
                categoryName: c.categoryName,
            });
        });
        return map;
    }, [flatClauses]);

    const getStatusColor = (value: string): 'default' | 'warning' | 'info' | 'success' | 'error' => {
        switch ((value || '').toLowerCase()) {
            case 'draft':
                return 'default';
            case 'sent':
                return 'info';
            case 'signed':
                return 'success';
            default:
                return 'default';
        }
    };

    const handleSectionChange = (index: number, patch: Partial<ContractSection>) => {
        setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    };

    const addBlankSection = () => {
        setSections((prev) => [...prev, { title: 'New Clause', body: '' }]);
    };

    const addSectionFromClause = (titleText: string, bodyText: string) => {
        setSections((prev) => [...prev, { title: titleText, body: bodyText }]);
    };

    const applyModeToAllClauses = (mode: 'actual' | 'variables') => {
        setSections((prev) =>
            prev.map((section) => {
                const key = toKey(section.title);
                if (mode === 'variables') {
                    const templateBody = sourceClauseByTitle.get(key)?.body;
                    return templateBody ? { ...section, body: templateBody } : section;
                }
                const renderedBody = renderedBodyByTitle[key];
                return renderedBody ? { ...section, body: renderedBody } : section;
            }),
        );
        setContractViewMode(mode);
    };

    const removeSection = (index: number) => {
        setSections((prev) => prev.filter((_, i) => i !== index));
    };

    const moveSection = (index: number, dir: -1 | 1) => {
        setSections((prev) => {
            const target = index + dir;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            const [item] = next.splice(index, 1);
            next.splice(target, 0, item);
            return next;
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updateData: UpdateContractData = {
                title,
                status,
                content: {
                    time: Date.now(),
                    version: '2.0.0',
                    blocks: [],
                    sections,
                    text: sections.map((s) => `${s.title}\n${s.body}`).join('\n\n'),
                    updated_at: new Date().toISOString(),
                } as unknown as UpdateContractData['content'],
            };

            await contractsService.update(inquiryId, contractId, updateData);
            const refreshed = await contractsService.getById(inquiryId, contractId);
            setContract((prev) =>
                prev
                    ? {
                          ...prev,
                          title: refreshed.title,
                          status: refreshed.status,
                          signers: refreshed.signers || prev.signers,
                          updated_at: new Date(refreshed.updated_at).toISOString(),
                      }
                    : prev,
            );
            setStatus(normalizeContractStatus(refreshed.status));
        } catch (err) {
            console.error('Error saving contract:', err);
            setError('Failed to save contract');
        } finally {
            setSaving(false);
        }
    };

    const handleSyncFromTemplate = async () => {
        try {
            setSyncing(true);
            await contractsService.syncTemplate(inquiryId, contractId);
            const refreshed = await contractsService.getById(inquiryId, contractId);
                const contentData = (refreshed.content || {}) as ContractContentShape;
            setSections(
                contentData?.sections?.length
                    ? contentData.sections.map((s) => ({ title: s.title || '', body: s.body || '' }))
                    : [],
            );
            setContract((prev) =>
                prev
                    ? {
                          ...prev,
                          status: refreshed.status,
                          signers: refreshed.signers || prev.signers,
                          rendered_html: refreshed.rendered_html || null,
                          updated_at: new Date(refreshed.updated_at).toISOString(),
                      }
                    : prev,
            );
            setStatus(normalizeContractStatus(refreshed.status));
            setContractViewMode('actual');
        } catch (err) {
            console.error('Error syncing contract:', err);
            setError('Failed to sync contract from template');
        } finally {
            setSyncing(false);
        }
    };

    const handleOpenSend = () => {
        setSignerRows([
            {
                name: '',
                email: '',
                role: 'client',
            },
        ]);
        setSendOpen(true);
    };

    const handleAddSigner = () => setSignerRows((prev) => [...prev, { name: '', email: '', role: 'client' }]);
    const handleRemoveSigner = (idx: number) => setSignerRows((prev) => prev.filter((_, i) => i !== idx));
    const handleSignerChange = (idx: number, field: 'name' | 'email' | 'role', value: string) => {
        setSignerRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
    };

    const handleSend = async () => {
        const validSigners = signerRows.filter((s) => s.name && s.email);
        if (validSigners.length === 0) {
            setError('Add at least one signer with name and email');
            return;
        }

        try {
            setSending(true);
            await contractsService.send(inquiryId, contractId, { signers: validSigners });
            setSendOpen(false);
            const refreshed = await contractsService.getById(inquiryId, contractId);
            setStatus(normalizeContractStatus(refreshed.status));
            setContract((prev) =>
                prev
                    ? {
                          ...prev,
                          status: refreshed.status,
                          signers: refreshed.signers || [],
                      }
                    : prev,
            );
        } catch (err) {
            console.error('Error sending contract:', err);
            setError('Failed to send contract');
        } finally {
            setSending(false);
        }
    };

    const handleCopySigningLink = async (signer: ContractSigner) => {
        if (!signer.token) return;
        await navigator.clipboard.writeText(`${window.location.origin}/sign/${signer.token}`);
    };

    const handleOpenSigningPage = (signer: ContractSigner) => {
        if (!signer.token) return;
        window.open(`${window.location.origin}/sign/${signer.token}`, '_blank');
    };

    const previewHtml = useMemo(() => {
        if (contract?.rendered_html) return contract.rendered_html;
        const htmlSections = sections.map(
            (s) =>
                `<section style="margin-bottom:20px;">` +
                `<h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:0 0 8px 0;">${s.title}</h3>` +
                `<p style="font-family:Inter,Arial,sans-serif;line-height:1.65;white-space:pre-wrap;margin:0;">${s.body}</p>` +
                `</section>`,
        );
        return `<div style="padding:24px;max-width:900px;margin:auto;">${htmlSections.join('')}</div>`;
    }, [contract?.rendered_html, sections]);

    const handleDownloadPreviewHtml = () => {
        const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title || 'contract'}-preview.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrintToPdf = () => {
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(previewHtml);
        win.document.close();
        win.focus();
        win.print();
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="360px">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
            </Container>
        );
    }

    if (!contract) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="warning">Contract not found</Alert>
            </Container>
        );
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    <IconButton edge="start" onClick={() => router.back()} sx={{ mr: 2 }}>
                        <ArrowBack />
                    </IconButton>

                    <Gavel sx={{ mr: 1 }} />
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Bespoke Contract Editor
                    </Typography>

                    <Chip
                        label={status}
                        color={getStatusColor(status)}
                        variant="outlined"
                        sx={{ mr: 2 }}
                    />

                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<History />}
                            onClick={handleSyncFromTemplate}
                            disabled={syncing || !contract.template_id || status === 'Signed'}
                            size="small"
                        >
                            {syncing ? 'Syncing...' : 'Sync Template'}
                        </Button>
                        <Button variant="outlined" startIcon={<Preview />} onClick={() => setPreviewOpen(true)} size="small">
                            Preview Workspace
                        </Button>
                        <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving} size="small">
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ py: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Stack spacing={2}>
                                    <TextField
                                        label="Contract Title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        fullWidth
                                    />

                                    <FormControl fullWidth size="small">
                                        <InputLabel>Status</InputLabel>
                                        <Select value={status} onChange={(e) => setStatus(e.target.value as ContractStatus)} label="Status">
                                            <MenuItem value="Draft">Draft</MenuItem>
                                            <MenuItem value="Sent">Sent</MenuItem>
                                            <MenuItem value="Signed">Signed</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <Divider />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="h6">Clause Overrides (Inquiry-specific)</Typography>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                variant={contractViewMode === 'actual' ? 'contained' : 'outlined'}
                                                onClick={() => applyModeToAllClauses('actual')}
                                                sx={{
                                                    textTransform: 'none',
                                                    bgcolor: contractViewMode === 'actual' ? 'rgba(34,197,94,0.22)' : undefined,
                                                    borderColor: 'rgba(34,197,94,0.45)',
                                                    color: contractViewMode === 'actual' ? '#86efac' : '#bbf7d0',
                                                }}
                                            >
                                                Actual Details
                                            </Button>
                                            <Button
                                                size="small"
                                                variant={contractViewMode === 'variables' ? 'contained' : 'outlined'}
                                                onClick={() => applyModeToAllClauses('variables')}
                                                sx={{
                                                    textTransform: 'none',
                                                    bgcolor: contractViewMode === 'variables' ? 'rgba(59,130,246,0.22)' : undefined,
                                                    borderColor: 'rgba(59,130,246,0.45)',
                                                    color: contractViewMode === 'variables' ? '#93c5fd' : '#bfdbfe',
                                                }}
                                            >
                                                Variables
                                            </Button>
                                            <Button size="small" startIcon={<Add />} variant="outlined" onClick={addBlankSection}>
                                                Add Clause
                                            </Button>
                                        </Stack>
                                    </Box>

                                    <Stack direction="row" spacing={1} sx={{ mt: -0.5 }}>
                                        <Chip
                                            size="small"
                                            label={contractViewMode === 'actual' ? 'Now showing actual inquiry details' : 'Now showing template variables'}
                                            sx={{
                                                bgcolor: contractViewMode === 'actual' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
                                                color: contractViewMode === 'actual' ? '#86efac' : '#93c5fd',
                                                border: '1px solid',
                                                borderColor: contractViewMode === 'actual' ? 'rgba(34,197,94,0.35)' : 'rgba(59,130,246,0.35)',
                                            }}
                                        />
                                        <Chip
                                            size="small"
                                            label='Example: {{brand.name}} vs Moonrise Films'
                                            sx={{
                                                bgcolor: 'rgba(148,163,184,0.12)',
                                                color: '#cbd5e1',
                                                border: '1px solid rgba(148,163,184,0.25)',
                                            }}
                                        />
                                    </Stack>

                                    {sections.length === 0 && (
                                        <Alert severity="info">No clauses in this contract yet. Add one from the Clause Library on the right.</Alert>
                                    )}

                                    <Stack spacing={2}>
                                        {sections.map((section, index) => {
                                            const directVars = extractVariables(section.body);
                                            const sourceClause = sourceClauseByTitle.get(toKey(section.title));
                                            const sourceVars = sourceClause ? extractVariables(sourceClause.body) : [];
                                            const usedVars = directVars.length > 0 ? directVars : sourceVars;
                                            const usingSourceVars = directVars.length === 0 && sourceVars.length > 0;
                                            const isVariableModeCard = directVars.length > 0;
                                            const displayText = section.body || '';
                                            const highlightSegments = buildHighlightedSegments(displayText, sourceClause?.body);
                                            const variableResolutions = sourceClause
                                                ? resolveVariablesFromTemplate(sourceClause.body, displayText)
                                                : [];
                                            const missingVars = variableResolutions.filter((v) => v.missing);
                                            const isEditing = editingSectionIndex === index;
                                            return (
                                                <Card
                                                    key={`${section.title}-${index}`}
                                                    variant="outlined"
                                                    sx={{
                                                        borderRadius: 2,
                                                        borderLeft: '3px solid',
                                                        borderLeftColor: isVariableModeCard ? 'rgba(59,130,246,0.7)' : 'rgba(34,197,94,0.65)',
                                                    }}
                                                >
                                                    <CardContent>
                                                        <Stack spacing={1.2}>
                                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                                <TextField
                                                                    label="Clause title"
                                                                    value={section.title}
                                                                    onChange={(e) => handleSectionChange(index, { title: e.target.value })}
                                                                    size="small"
                                                                    fullWidth
                                                                />
                                                                <Tooltip title="Move up">
                                                                    <span>
                                                                        <IconButton size="small" onClick={() => moveSection(index, -1)} disabled={index === 0}>
                                                                            <ArrowUpward fontSize="small" />
                                                                        </IconButton>
                                                                    </span>
                                                                </Tooltip>
                                                                <Tooltip title="Move down">
                                                                    <span>
                                                                        <IconButton size="small" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1}>
                                                                            <ArrowDownward fontSize="small" />
                                                                        </IconButton>
                                                                    </span>
                                                                </Tooltip>
                                                                <Tooltip title="Remove clause">
                                                                    <IconButton size="small" color="error" onClick={() => removeSection(index)}>
                                                                        <Delete fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Button
                                                                    size="small"
                                                                    variant="text"
                                                                    sx={{ textTransform: 'none', minWidth: 84 }}
                                                                    onClick={() => setEditingSectionIndex(isEditing ? null : index)}
                                                                >
                                                                    {isEditing ? 'Done' : 'Edit text'}
                                                                </Button>
                                                            </Box>

                                                            {isEditing ? (
                                                                <TextField
                                                                    label="Clause text"
                                                                    value={section.body}
                                                                    onChange={(e) => handleSectionChange(index, { body: e.target.value })}
                                                                    multiline
                                                                    rows={5}
                                                                    fullWidth
                                                                    placeholder="Edit text directly. Use the top mode buttons to switch entire contract view."
                                                                />
                                                            ) : (
                                                                <Box
                                                                    sx={{
                                                                        border: '1px solid rgba(148,163,184,0.28)',
                                                                        borderRadius: 1,
                                                                        px: 1.5,
                                                                        py: 1.25,
                                                                        minHeight: 128,
                                                                        whiteSpace: 'pre-wrap',
                                                                        lineHeight: 1.6,
                                                                        fontSize: 16,
                                                                    }}
                                                                >
                                                                    {highlightSegments.map((seg, segIdx) => (
                                                                        <Box
                                                                            key={`${segIdx}-${seg.text.slice(0, 16)}`}
                                                                            component="span"
                                                                            sx={
                                                                                seg.isVariable
                                                                                    ? {
                                                                                          color: seg.missing ? '#fca5a5' : '#93c5fd',
                                                                                          fontWeight: 700,
                                                                                          textDecoration: 'underline',
                                                                                          textDecorationColor: seg.missing
                                                                                              ? 'rgba(239,68,68,0.55)'
                                                                                              : 'rgba(59,130,246,0.45)',
                                                                                          textUnderlineOffset: '2px',
                                                                                      }
                                                                                    : undefined
                                                                            }
                                                                        >
                                                                            {seg.text}
                                                                        </Box>
                                                                    ))}
                                                                </Box>
                                                            )}

                                                            {missingVars.length > 0 && (
                                                                <Alert severity="warning" sx={{ py: 0.5 }}>
                                                                    Missing variable values:{' '}
                                                                    {missingVars.map((v) => `{{${v.name}}}`).join(', ')}
                                                                </Alert>
                                                            )}

                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                                    Variables used
                                                                </Typography>
                                                                {usedVars.length === 0 ? (
                                                                    <Typography variant="caption" color="text.disabled">No variables in this clause.</Typography>
                                                                ) : (
                                                                    <>
                                                                        {usingSourceVars && (
                                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                                                From source clause template (placeholders already rendered in this override)
                                                                            </Typography>
                                                                        )}
                                                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                                                            {usedVars.map((v) => (
                                                                                <Chip
                                                                                    key={v}
                                                                                    label={`{{${v}}}`}
                                                                                    size="small"
                                                                                    variant={contractViewMode === 'variables' ? 'filled' : 'outlined'}
                                                                                    sx={{
                                                                                        fontFamily: 'monospace',
                                                                                        bgcolor: contractViewMode === 'variables' ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.10)',
                                                                                        color: '#93c5fd',
                                                                                        borderColor: 'rgba(59,130,246,0.4)',
                                                                                    }}
                                                                                />
                                                                            ))}
                                                                        </Stack>
                                                                    </>
                                                                )}
                                                            </Box>

                                                            <Typography variant="caption" color="text.secondary" sx={{ mt: -0.25 }}>
                                                                {directVars.length > 0
                                                                    ? 'Currently showing template variables in text.'
                                                                    : 'Currently showing inquiry-rendered text.'}
                                                            </Typography>
                                                        </Stack>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Stack spacing={2}>
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                        Contract Information
                                    </Typography>
                                    <Stack spacing={1}>
                                        <Typography variant="body2"><strong>Created:</strong> {new Date(contract.created_at).toLocaleString()}</Typography>
                                        <Typography variant="body2"><strong>Updated:</strong> {new Date(contract.updated_at).toLocaleString()}</Typography>
                                        <Typography variant="body2"><strong>Contract ID:</strong> #{contract.id}</Typography>
                                        <Typography variant="body2"><strong>Template-linked:</strong> {contract.template_id ? 'Yes' : 'No'}</Typography>
                                    </Stack>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                        Clause Library
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                                        Bring clauses in from your settings library, then tailor wording for this inquiry.
                                    </Typography>

                                    <Box sx={{ maxHeight: 520, overflowY: 'auto', pr: 0.5 }}>
                                        <Stack spacing={1.25}>
                                            {clauseCategories.map((cat) => (
                                                <Box key={cat.id} sx={{ border: '1px solid rgba(148,163,184,0.2)', borderRadius: 1.5, p: 1 }}>
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                                                        {cat.name}
                                                    </Typography>
                                                    <Stack spacing={0.6} sx={{ mt: 0.75 }}>
                                                        {(cat.clauses || []).filter((c) => c.is_active).map((c) => (
                                                            <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                                <Typography variant="caption" sx={{ color: '#e2e8f0' }} noWrap>
                                                                    {c.title}
                                                                </Typography>
                                                                <Button
                                                                    size="small"
                                                                    variant="text"
                                                                    sx={{ minWidth: 0, textTransform: 'none' }}
                                                                    onClick={() => addSectionFromClause(c.title, c.body)}
                                                                >
                                                                    Add
                                                                </Button>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            ))}
                                            {flatClauses.length === 0 && (
                                                <Typography variant="caption" color="text.secondary">No active clauses available.</Typography>
                                            )}
                                        </Stack>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Stack>
                    </Grid>
                </Grid>
            </Container>

            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { height: '88vh' } }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography fontWeight={700}>Preview Workspace</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Real contract view and signing/export actions
                            </Typography>
                        </Box>
                        <Chip label={status} color={getStatusColor(status)} variant="outlined" />
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', gap: 2, minHeight: 0 }}>
                    <Box sx={{ flex: 1, minHeight: 0, border: '1px solid rgba(148,163,184,0.25)', borderRadius: 1.5, overflow: 'hidden' }}>
                        <iframe title="Contract Preview" srcDoc={previewHtml} style={{ width: '100%', height: '100%', border: 0, background: 'white' }} />
                    </Box>

                    <Box sx={{ width: 310, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                        <Button
                            variant="contained"
                            startIcon={<Send />}
                            onClick={handleOpenSend}
                            disabled={status === 'Signed'}
                            sx={{ textTransform: 'none' }}
                        >
                            Send for Signing
                        </Button>
                        <Button variant="outlined" startIcon={<Download />} onClick={handleDownloadPreviewHtml} sx={{ textTransform: 'none' }}>
                            Download HTML
                        </Button>
                        <Button variant="outlined" startIcon={<Download />} onClick={handlePrintToPdf} sx={{ textTransform: 'none' }}>
                            Create PDF (Print)
                        </Button>

                        <Divider sx={{ my: 0.5 }} />

                        <Typography variant="subtitle2" fontWeight={700}>
                            Signing Links
                        </Typography>
                        {!contract.signers || contract.signers.length === 0 ? (
                            <Typography variant="caption" color="text.secondary">
                                No signers yet. Use &quot;Send for Signing&quot; to create links.
                            </Typography>
                        ) : (
                            <Stack spacing={0.8} sx={{ overflowY: 'auto' }}>
                                {contract.signers.map((s) => (
                                    <Box key={s.id} sx={{ border: '1px solid rgba(148,163,184,0.25)', borderRadius: 1.25, p: 1 }}>
                                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700 }}>
                                            {s.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                            {s.role} - {s.status}
                                        </Typography>
                                        <Stack direction="row" spacing={0.5}>
                                            <Tooltip title="Copy link">
                                                <IconButton size="small" onClick={() => handleCopySigningLink(s)}>
                                                    <ContentCopy fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Open signing page">
                                                <IconButton size="small" onClick={() => handleOpenSigningPage(s)}>
                                                    <OpenInNew fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={sendOpen} onClose={() => setSendOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Send Contract for Signing</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Add signers for this contract. Each signer receives a unique signing link.
                    </Typography>
                    <Stack spacing={1.25}>
                        {signerRows.map((row, idx) => (
                            <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField size="small" label="Name" value={row.name} onChange={(e) => handleSignerChange(idx, 'name', e.target.value)} sx={{ flex: 1 }} />
                                <TextField size="small" label="Email" value={row.email} onChange={(e) => handleSignerChange(idx, 'email', e.target.value)} sx={{ flex: 1 }} />
                                <FormControl size="small" sx={{ minWidth: 110 }}>
                                    <InputLabel>Role</InputLabel>
                                    <Select value={row.role} label="Role" onChange={(e) => handleSignerChange(idx, 'role', e.target.value)}>
                                        <MenuItem value="client">Client</MenuItem>
                                        <MenuItem value="talent">Talent</MenuItem>
                                        <MenuItem value="property_owner">Property Owner</MenuItem>
                                        <MenuItem value="witness">Witness</MenuItem>
                                    </Select>
                                </FormControl>
                                {signerRows.length > 1 && (
                                    <IconButton color="error" onClick={() => handleRemoveSigner(idx)}>
                                        <Delete fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                        ))}
                        <Button variant="text" size="small" startIcon={<Add />} onClick={handleAddSigner} sx={{ alignSelf: 'flex-start' }}>
                            Add signer
                        </Button>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSendOpen(false)}>Cancel</Button>
                    <Button variant="contained" startIcon={<Send />} onClick={handleSend} disabled={sending}>
                        {sending ? 'Sending...' : 'Send'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
