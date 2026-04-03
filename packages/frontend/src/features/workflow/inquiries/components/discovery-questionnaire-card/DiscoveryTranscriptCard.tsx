'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    CardContent,
    Chip,
    Button,
    TextField,
    CircularProgress,
} from '@mui/material';
import {
    MicNone,
    MicOff,
    AutoAwesome,
    EditOutlined,
    CloseOutlined,
    SaveOutlined,
} from '@mui/icons-material';
import { WorkflowCard } from '@/shared/ui/WorkflowCard';
import { discoveryQuestionnaireSubmissionsApi } from '@/features/workflow/inquiries/api';
import type { DiscoveryQuestionnaireSubmission } from '@/features/workflow/inquiries/types';

const ACCENT = '#818cf8';

interface DiscoveryTranscriptCardProps {
    submission: DiscoveryQuestionnaireSubmission;
    onRefreshSubmission: () => Promise<void>;
}

export default function DiscoveryTranscriptCard({
    submission,
    onRefreshSubmission,
}: DiscoveryTranscriptCardProps) {
    const responses = (submission.responses ?? {}) as Record<string, unknown>;
    const recordingEnabled = responses['recording_consent'] === 'yes';
    const savedTranscript = submission.transcript ?? '';

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);

    // ─── Derived ────────────────────────────────────────────────────────────
    const hasTranscript = !!savedTranscript;

    // ─── AI Summary section (always shown when recording enabled) ───────────
    const AiSummarySection = (
        <Box
            sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(129,140,248,0.04)',
                border: '1px solid rgba(129,140,248,0.12)',
                flexShrink: 0,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AutoAwesome sx={{ fontSize: 13, color: ACCENT }} />
                <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>
                    AI Summary
                </Typography>
                <Chip
                    size="small"
                    label="Coming soon"
                    sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: 'rgba(129,140,248,0.08)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.15)' }}
                />
            </Box>
            {hasTranscript ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ color: '#475569', fontSize: '0.75rem', flex: 1 }}>
                        Transcript ready — AI summary generation coming soon.
                    </Typography>
                    <Button
                        size="small"
                        disabled
                        startIcon={<AutoAwesome sx={{ fontSize: 12 }} />}
                        sx={{
                            flexShrink: 0,
                            color: ACCENT,
                            textTransform: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 1.5,
                            bgcolor: 'rgba(129,140,248,0.06)',
                            border: '1px solid rgba(129,140,248,0.2)',
                            '&:disabled': { color: ACCENT, opacity: 0.6 },
                        }}
                    >
                        Generate
                    </Button>
                </Box>
            ) : (
                <Typography sx={{ color: '#475569', fontSize: '0.75rem', lineHeight: 1.5 }}>
                    Paste a call transcript to generate an AI summary.
                </Typography>
            )}
        </Box>
    );

    const handleStartEdit = () => {
        setDraft(savedTranscript);
        setEditing(true);
    };

    const handleCancel = () => {
        setEditing(false);
        setDraft('');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await discoveryQuestionnaireSubmissionsApi.update(submission.id, {
                transcript: draft,
            });
            await onRefreshSubmission();
            setEditing(false);
            setDraft('');
        } finally {
            setSaving(false);
        }
    };

    return (
        <WorkflowCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexShrink: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: recordingEnabled ? 'rgba(129,140,248,0.1)' : 'rgba(100,116,139,0.06)',
                                border: `1px solid ${recordingEnabled ? 'rgba(129,140,248,0.2)' : 'rgba(100,116,139,0.1)'}`,
                            }}
                        >
                            {recordingEnabled
                                ? <MicNone sx={{ fontSize: 16, color: ACCENT }} />
                                : <MicOff sx={{ fontSize: 16, color: '#475569' }} />
                            }
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                            Transcript
                        </Typography>
                    </Box>

                    {recordingEnabled ? (
                        <Chip
                            size="small"
                            label="Recording enabled"
                            sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                bgcolor: 'rgba(16,185,129,0.08)',
                                color: '#10b981',
                                border: '1px solid rgba(16,185,129,0.15)',
                            }}
                        />
                    ) : (
                        <Chip
                            size="small"
                            label="Not enabled"
                            sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                bgcolor: 'rgba(100,116,139,0.06)',
                                color: '#475569',
                                border: '1px solid rgba(100,116,139,0.1)',
                            }}
                        />
                    )}
                </Box>

                {/* Not enabled state */}
                {!recordingEnabled && (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', py: 3, gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(100,116,139,0.06)',
                                border: '1px dashed rgba(100,116,139,0.15)',
                            }}
                        >
                            <MicOff sx={{ fontSize: 22, color: '#334155' }} />
                        </Box>
                        <Typography sx={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>
                            Recording not enabled
                        </Typography>
                        <Typography sx={{ color: '#475569', fontSize: '0.75rem', lineHeight: 1.6, maxWidth: 200 }}>
                            Toggle recording consent in the questionnaire to unlock transcript paste.
                        </Typography>
                    </Box>
                )}

                {/* Enabled — no transcript yet */}
                {recordingEnabled && !savedTranscript && !editing && (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        {AiSummarySection}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'rgba(129,140,248,0.06)',
                                    border: '1px dashed rgba(129,140,248,0.2)',
                                }}
                            >
                                <MicNone sx={{ fontSize: 22, color: '#475569' }} />
                            </Box>
                            <Typography sx={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>
                                No transcript yet
                            </Typography>
                            <Typography sx={{ color: '#475569', fontSize: '0.75rem', lineHeight: 1.6, maxWidth: 220 }}>
                                Paste your call notes transcript once the recording is available.
                            </Typography>
                            <Button
                                size="small"
                                onClick={handleStartEdit}
                                sx={{
                                    mt: 0.5,
                                    color: ACCENT,
                                    textTransform: 'none',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    px: 2,
                                    bgcolor: 'rgba(129,140,248,0.06)',
                                    border: '1px solid rgba(129,140,248,0.18)',
                                    '&:hover': { bgcolor: 'rgba(129,140,248,0.12)', borderColor: ACCENT },
                                }}
                            >
                                Paste transcript
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* Editing */}
                {recordingEnabled && editing && (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0 }}>
                        <TextField
                            fullWidth
                            multiline
                            autoFocus
                            minRows={20}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder="Paste transcript from Google Call Notes or Otter.ai..."
                            sx={{
                                flex: 1,
                                '& .MuiInputBase-root': {
                                    bgcolor: 'rgba(255,255,255,0.02)',
                                    color: '#e2e8f0',
                                    fontSize: '0.75rem',
                                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                                    alignItems: 'flex-start',
                                    height: '100%',
                                    borderRadius: 2,
                                },
                                '& .MuiInputBase-input': { height: '100% !important', overflow: 'auto !important' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.1)' },
                                '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.2)' },
                                '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT, borderWidth: 1.5 },
                            }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={handleCancel}
                                disabled={saving}
                                startIcon={<CloseOutlined sx={{ fontSize: 14 }} />}
                                sx={{
                                    flex: 1,
                                    color: '#64748b',
                                    textTransform: 'none',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    borderColor: 'rgba(100,116,139,0.2)',
                                    '&:hover': { borderColor: 'rgba(100,116,139,0.4)', bgcolor: 'rgba(100,116,139,0.06)' },
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="small"
                                onClick={handleSave}
                                disabled={saving || !draft.trim()}
                                startIcon={saving ? <CircularProgress size={12} sx={{ color: ACCENT }} /> : <SaveOutlined sx={{ fontSize: 14 }} />}
                                sx={{
                                    flex: 2,
                                    color: ACCENT,
                                    textTransform: 'none',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(129,140,248,0.06)',
                                    border: '1px solid rgba(129,140,248,0.2)',
                                    '&:hover': { bgcolor: 'rgba(129,140,248,0.12)', borderColor: ACCENT },
                                    '&:disabled': { opacity: 0.5 },
                                }}
                            >
                                Save
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* Has transcript — read view */}
                {recordingEnabled && savedTranscript && !editing && (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0 }}>
                        {AiSummarySection}
                        {/* AI button */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <Typography sx={{ color: '#475569', fontSize: '0.7rem', fontWeight: 500 }}>
                                {savedTranscript.length.toLocaleString()} chars
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.75 }}>
                                <Button
                                    size="small"
                                    onClick={handleStartEdit}
                                    startIcon={<EditOutlined sx={{ fontSize: 13 }} />}
                                    sx={{
                                        color: '#64748b',
                                        textTransform: 'none',
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        px: 1.5,
                                        bgcolor: 'rgba(100,116,139,0.05)',
                                        border: '1px solid rgba(100,116,139,0.1)',
                                        '&:hover': { bgcolor: 'rgba(100,116,139,0.1)' },
                                    }}
                                >
                                    Edit
                                </Button>
                                <Button
                                    size="small"
                                    disabled
                                    startIcon={<AutoAwesome sx={{ fontSize: 13 }} />}
                                    sx={{
                                        color: savedTranscript.length >= 200 ? ACCENT : '#334155',
                                        textTransform: 'none',
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        px: 1.5,
                                        bgcolor: savedTranscript.length >= 200 ? 'rgba(129,140,248,0.06)' : 'transparent',
                                        border: '1px solid',
                                        borderColor: savedTranscript.length >= 200 ? 'rgba(129,140,248,0.2)' : 'rgba(100,116,139,0.08)',
                                        '&:disabled': { color: savedTranscript.length >= 200 ? ACCENT : '#334155', opacity: 0.7 },
                                    }}
                                    title="AI summary — coming soon"
                                >
                                    AI Summary
                                </Button>
                            </Box>
                        </Box>

                        {/* Transcript text */}
                        <Box
                            sx={{
                                flex: 1,
                                overflowY: 'auto',
                                bgcolor: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(100,116,139,0.08)',
                                borderRadius: 2,
                                p: 1.5,
                                '&::-webkit-scrollbar': { width: 4 },
                                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(100,116,139,0.15)', borderRadius: 3 },
                            }}
                        >
                            <Typography
                                sx={{
                                    color: '#94a3b8',
                                    fontSize: '0.73rem',
                                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                                    lineHeight: 1.7,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {savedTranscript}
                            </Typography>
                        </Box>
                    </Box>
                )}
            </CardContent>
        </WorkflowCard>
    );
}
