'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    TextField,
    Paper,
    Chip,
    Tab,
    Tabs,
    Select,
    MenuItem,
    FormControl,
    Checkbox,
    FormControlLabel,
    FormGroup,
    CircularProgress,
    Divider,
    Alert,
} from '@mui/material';
import {
    Close,
    LightbulbOutlined,
    Send,
    NavigateNext,
    NavigateBefore,
    Check,
    MicNone,
} from '@mui/icons-material';
import { api } from '@/lib/api';
import {
    DiscoveryQuestionnaireTemplate,
    DiscoveryQuestionnaireSubmission,
    DiscoveryQuestion,
} from '@/lib/types';

// ─── Section icon colours ──────────────────────────────────────────────────────
const SECTION_COLORS: Record<string, string> = {
    'Rapport & Opening': '#3b82f6',
    'The Wedding Day Vision': '#a855f7',
    'Logistics & Timeline': '#10b981',
    'Coverage & Deliverables': '#f59e0b',
    'Budget & Decision': '#ef4444',
    'Concerns & Questions': '#06b6d4',
    'Next Steps': '#6366f1',
};

function getSectionColor(section: string) {
    return SECTION_COLORS[section] ?? '#64748b';
}

// ─── Single question renderer ─────────────────────────────────────────────────

interface QuestionFieldProps {
    question: DiscoveryQuestion;
    value: string | string[];
    onChange: (val: string | string[]) => void;
}

function QuestionField({ question, value, onChange }: QuestionFieldProps) {
    const opts: string[] =
        question.options && 'values' in (question.options as object)
            ? ((question.options as { values: string[] }).values ?? [])
            : [];

    const strVal = typeof value === 'string' ? value : '';
    const arrVal = Array.isArray(value) ? value : [];

    switch (question.field_type) {
        case 'select':
            return (
                <FormControl fullWidth size="small">
                    <Select
                        value={strVal}
                        displayEmpty
                        onChange={(e) => onChange(e.target.value as string)}
                        sx={{ bgcolor: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.85rem', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.3)' } }}
                        MenuProps={{ PaperProps: { sx: { bgcolor: '#1e2330' } } }}
                    >
                        <MenuItem value="" disabled sx={{ color: '#64748b', fontSize: '0.82rem' }}>
                            Choose an option…
                        </MenuItem>
                        {opts.map((o) => (
                            <MenuItem key={o} value={o} sx={{ color: '#e2e8f0', fontSize: '0.82rem' }}>{o}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            );

        case 'multiselect':
            return (
                <FormGroup sx={{ flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
                    {opts.map((o) => (
                        <FormControlLabel
                            key={o}
                            control={
                                <Checkbox
                                    size="small"
                                    checked={arrVal.includes(o)}
                                    onChange={(e) => {
                                        if (e.target.checked) onChange([...arrVal, o]);
                                        else onChange(arrVal.filter((v) => v !== o));
                                    }}
                                    sx={{ color: '#64748b', '&.Mui-checked': { color: '#3b82f6' } }}
                                />
                            }
                            label={o}
                            sx={{ '& .MuiFormControlLabel-label': { color: '#94a3b8', fontSize: '0.8rem' } }}
                        />
                    ))}
                </FormGroup>
            );

        case 'textarea':
            return (
                <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    maxRows={6}
                    size="small"
                    value={strVal}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Type your notes here…"
                    sx={{
                        '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.85rem' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.3)' },
                    }}
                />
            );

        case 'number':
            return (
                <TextField
                    size="small"
                    type="number"
                    value={strVal}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="e.g. 120"
                    sx={{
                        width: 160,
                        '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.85rem' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.3)' },
                    }}
                />
            );

        default:
            return (
                <TextField
                    fullWidth
                    size="small"
                    value={strVal}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Type your answer…"
                    sx={{
                        '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.85rem' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.3)' },
                    }}
                />
            );
    }
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DiscoveryQuestionnaireFormDialogProps {
    open: boolean;
    onClose: () => void;
    inquiryId: number;
    brandId: number;
    existingSubmission?: DiscoveryQuestionnaireSubmission | null;
    onSubmitted?: (submission: DiscoveryQuestionnaireSubmission) => void;
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

export default function DiscoveryQuestionnaireFormDialog({
    open,
    onClose,
    inquiryId,
    existingSubmission,
    onSubmitted,
}: DiscoveryQuestionnaireFormDialogProps) {
    const [template, setTemplate] = useState<DiscoveryQuestionnaireTemplate | null>(null);
    const [responses, setResponses] = useState<Record<string, string | string[]>>({});
    const [callNotes, setCallNotes] = useState('');
    const [transcript, setTranscript] = useState('');
    const [sectionIndex, setSectionIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    // Load template
    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setError(null);
        api.discoveryQuestionnaireTemplates
            .getActive()
            .then((t) => {
                setTemplate(t);
                // Pre-populate from existing submission
                if (existingSubmission?.responses) {
                    setResponses(existingSubmission.responses as Record<string, string | string[]>);
                    setCallNotes(existingSubmission.call_notes ?? '');
                    setTranscript(existingSubmission.transcript ?? '');
                } else {
                    setResponses({});
                    setCallNotes('');
                    setTranscript('');
                }
                setSectionIndex(0);
                setSubmitted(false);
            })
            .catch(() => setError('Failed to load questionnaire template.'))
            .finally(() => setLoading(false));
    }, [open, existingSubmission]);

    // Group questions by section
    const sections = React.useMemo(() => {
        if (!template) return [];
        const map = new Map<string, DiscoveryQuestion[]>();
        for (const q of template.questions) {
            const key = q.section ?? 'Other';
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(q);
        }
        return Array.from(map.entries()).map(([name, questions]) => ({ name, questions }));
    }, [template]);

    const currentSection = sections[sectionIndex];

    const handleChange = (fieldKey: string, val: string | string[]) => {
        setResponses((prev) => ({ ...prev, [fieldKey]: val }));
    };

    const handleSubmit = async () => {
        if (!template) return;
        setSaving(true);
        setError(null);
        try {
            const submission = await api.discoveryQuestionnaireSubmissions.create({
                template_id: template.id,
                inquiry_id: inquiryId,
                responses,
                call_notes: callNotes || undefined,
                transcript: transcript || undefined,
            });
            setSubmitted(true);
            onSubmitted?.(submission);
        } catch {
            setError('Failed to save questionnaire. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        if (!saving) onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="md"
            PaperProps={{
                sx: {
                    bgcolor: '#0f1117',
                    background: 'linear-gradient(145deg, #0f1117, #141820)',
                    border: '1px solid rgba(59,130,246,0.15)',
                    borderRadius: 3,
                    color: '#e2e8f0',
                    minHeight: 540,
                },
            }}
        >
            {/* Header */}
            <DialogTitle sx={{ p: 3, pb: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <MicNone sx={{ color: '#3b82f6', fontSize: 22 }} />
                        <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.05rem' }}>
                            Discovery Call Notes
                        </Typography>
                    </Box>
                    <Typography sx={{ color: '#64748b', fontSize: '0.78rem' }}>
                        {existingSubmission ? 'Viewing submitted call notes' : 'Use this guide during or immediately after the discovery call'}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={handleClose} sx={{ color: '#64748b', mt: -0.5 }}>
                    <Close sx={{ fontSize: 18 }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, pt: 2 }}>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress size={36} sx={{ color: '#3b82f6' }} />
                    </Box>
                )}

                {error && !loading && (
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                )}

                {submitted && (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Check sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
                        <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.1rem', mb: 1 }}>
                            Discovery Notes Saved!
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mb: 3 }}>
                            The Discovery Call task has been automatically completed.
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={handleClose}
                            size="small"
                            sx={{ color: '#3b82f6', borderColor: '#3b82f6', textTransform: 'none' }}
                        >
                            Close
                        </Button>
                    </Box>
                )}

                {!loading && !submitted && template && sections.length > 0 && (
                    <>
                        {/* Section tabs */}
                        <Tabs
                            value={sectionIndex}
                            onChange={(_, v) => setSectionIndex(v as number)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                mb: 2.5,
                                borderBottom: '1px solid rgba(100,116,139,0.2)',
                                '& .MuiTab-root': { color: '#64748b', fontSize: '0.73rem', fontWeight: 600, textTransform: 'none', minHeight: 36, py: 0, px: 1.5 },
                                '& .Mui-selected': { color: '#e2e8f0' },
                                '& .MuiTabs-indicator': { bgcolor: getSectionColor(sections[sectionIndex]?.name ?? '') },
                            }}
                        >
                            {sections.map((s, i) => (
                                <Tab
                                    key={s.name}
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {Object.keys(responses).some((k) =>
                                                s.questions.some((q) => q.field_key === k && responses[k] && (Array.isArray(responses[k]) ? (responses[k] as string[]).length > 0 : String(responses[k]).trim() !== ''))
                                            ) && (
                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: getSectionColor(s.name), flexShrink: 0 }} />
                                            )}
                                            {s.name}
                                        </Box>
                                    }
                                    value={i}
                                />
                            ))}
                        </Tabs>

                        {/* Current section */}
                        {currentSection && (
                            <Stack spacing={2.5}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 3, height: 20, borderRadius: 2, bgcolor: getSectionColor(currentSection.name) }} />
                                    <Typography sx={{ color: getSectionColor(currentSection.name), fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        {currentSection.name}
                                    </Typography>
                                </Box>

                                {currentSection.questions.map((q) => (
                                    <Box key={q.id}>
                                        {/* Script hint callout */}
                                        {q.script_hint && (
                                            <Paper sx={{ p: 1.5, mb: 1.5, bgcolor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 2 }}>
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                                    <LightbulbOutlined sx={{ color: '#3b82f6', fontSize: 15, mt: 0.2, flexShrink: 0 }} />
                                                    <Typography sx={{ color: '#93c5fd', fontSize: '0.78rem', lineHeight: 1.5, fontStyle: 'italic' }}>
                                                        {q.script_hint}
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        )}

                                        {/* Prompt */}
                                        <Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, mb: 0.75 }}>
                                            {q.prompt}
                                            {q.required && <Box component="span" sx={{ color: '#ef4444', ml: 0.5 }}>*</Box>}
                                        </Typography>

                                        {/* Field */}
                                        <QuestionField
                                            question={q}
                                            value={responses[q.field_key ?? q.id.toString()] ?? (q.field_type === 'multiselect' ? [] : '')}
                                            onChange={(v) => handleChange(q.field_key ?? String(q.id), v)}
                                        />
                                    </Box>
                                ))}

                                                {/* Call notes + transcript on last section */}
                                {sectionIndex === sections.length - 1 && (
                                    <>
                                        <Divider sx={{ borderColor: 'rgba(100,116,139,0.2)', my: 1 }} />
                                        <Box>
                                            <Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, mb: 0.75 }}>
                                                Call Transcript
                                            </Typography>
                                            <Typography sx={{ color: '#64748b', fontSize: '0.75rem', mb: 1 }}>
                                                Paste the full call transcript here (optional).
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                multiline
                                                minRows={4}
                                                maxRows={12}
                                                size="small"
                                                value={transcript}
                                                onChange={(e) => setTranscript(e.target.value)}
                                                placeholder="Paste transcript here…"
                                                sx={{
                                                    '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.82rem', fontFamily: 'monospace' },
                                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.3)' },
                                                }}
                                            />
                                        </Box>
                                        <Box>
                                            <Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, mb: 0.75 }}>
                                                Overall Call Notes
                                            </Typography>
                                            <Typography sx={{ color: '#64748b', fontSize: '0.75rem', mb: 1 }}>
                                                Quick summary — tone, enthusiasm, objections, overall vibe.
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                multiline
                                                minRows={3}
                                                size="small"
                                                value={callNotes}
                                                onChange={(e) => setCallNotes(e.target.value)}
                                                placeholder="e.g. Very excited, clear vision, budget tight but flexible. Decision by end of month. Send proposal Monday."
                                                sx={{
                                                    '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.85rem' },
                                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.3)' },
                                                }}
                                            />
                                        </Box>
                                    </>
                                )}
                            </Stack>
                        )}

                        {/* Section progress chips */}
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 3, mb: 0.5, flexWrap: 'wrap' }}>
                            {sections.map((s, i) => (
                                <Chip
                                    key={s.name}
                                    size="small"
                                    label={i === sectionIndex ? s.name : `${i + 1}`}
                                    onClick={() => setSectionIndex(i)}
                                    sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        bgcolor: i === sectionIndex
                                            ? getSectionColor(s.name)
                                            : 'rgba(100,116,139,0.15)',
                                        color: i === sectionIndex ? '#fff' : '#64748b',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                />
                            ))}
                        </Box>
                    </>
                )}
            </DialogContent>

            {!loading && !submitted && (
                <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(100,116,139,0.15)', gap: 1 }}>
                    <Button
                        size="small"
                        disabled={sectionIndex === 0}
                        onClick={() => setSectionIndex((i) => i - 1)}
                        startIcon={<NavigateBefore sx={{ fontSize: 16 }} />}
                        sx={{ color: '#64748b', textTransform: 'none', fontSize: '0.8rem' }}
                    >
                        Back
                    </Button>

                    <Box sx={{ flex: 1 }} />

                    {sectionIndex < sections.length - 1 ? (
                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => setSectionIndex((i) => i + 1)}
                            endIcon={<NavigateNext sx={{ fontSize: 16 }} />}
                            sx={{ bgcolor: '#1e40af', textTransform: 'none', fontSize: '0.8rem', '&:hover': { bgcolor: '#1d4ed8' } }}
                        >
                            Next Section
                        </Button>
                    ) : (
                        <Button
                            size="small"
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={saving || !!existingSubmission}
                            startIcon={saving ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : <Send sx={{ fontSize: 15 }} />}
                            sx={{ bgcolor: '#10b981', textTransform: 'none', fontSize: '0.8rem', '&:hover': { bgcolor: '#059669' }, '&:disabled': { bgcolor: 'rgba(16,185,129,0.3)' } }}
                        >
                            {saving ? 'Saving…' : existingSubmission ? 'Already Submitted' : 'Save Call Notes'}
                        </Button>
                    )}
                </DialogActions>
            )}
        </Dialog>
    );
}
