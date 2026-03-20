'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    CardContent,
    Chip,
    Stack,
    Tooltip,
    LinearProgress,
} from '@mui/material';
import {
    MicNone,
    CheckCircle,
    EditNote,
    PlayArrow,
    GraphicEq,
    NoteAltOutlined,
    AccessTime,
    DescriptionOutlined,
    VideocamOff,
    LocalFireDepartment,
    AccountBalanceWallet,
    ThumbUpAlt,
    FlagOutlined,
} from '@mui/icons-material';
import { api } from '@/lib/api';
import { useBrand } from '@/app/providers/BrandProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { DiscoveryQuestionnaireSubmission } from '@/lib/types';
import { WorkflowCard } from './WorkflowCard';
import DiscoveryQuestionnaireFormDialog from './DiscoveryQuestionnaireFormDialog';
import type { WorkflowCardProps } from '../_lib';

// ─── Accent colour ────────────────────────────────────────────────────────────
const ACCENT = '#3b82f6';

// ─── Key response fields to highlight ─────────────────────────────────────────
const KEY_FIELDS: Array<{ key: string; label: string }> = [
    { key: 'film_vibe', label: 'Vibe' },
    { key: 'style_preferences', label: 'Style' },
    { key: 'camera_comfort', label: 'Camera Comfort' },
    { key: 'desired_products', label: 'Products' },
    { key: 'highlight_length', label: 'Film Length' },
    { key: 'budget_fit', label: 'Budget Fit' },
    { key: 'decision_timeline', label: 'Decision' },
    { key: 'ready_for_proposal', label: 'Proposal?' },
];

// Keys that aren't real questionnaire answers (metadata / internal)
const META_KEYS = new Set(['recording_consent', 'opening_notes', 'closing_notes', 'payment_terms_confirmed']);

// ─── Sentiment definitions (match dialog) ─────────────────────────────────────
const SENTIMENT_DEFS = [
    {
        key: 'excitement',
        label: 'Excitement',
        icon: LocalFireDepartment,
        colors: { High: '#10b981', Moderate: '#f59e0b', Low: '#ef4444' } as Record<string, string>,
    },
    {
        key: 'budget_comfort',
        label: 'Budget',
        icon: AccountBalanceWallet,
        colors: { Comfortable: '#10b981', Stretching: '#f59e0b', Concerned: '#ef4444' } as Record<string, string>,
    },
    {
        key: 'decision_readiness',
        label: 'Decision',
        icon: ThumbUpAlt,
        colors: { Ready: '#10b981', Warm: '#f59e0b', 'Early Stage': '#64748b' } as Record<string, string>,
    },
    {
        key: 'red_flags',
        label: 'Red Flags',
        icon: FlagOutlined,
        colors: { None: '#10b981', Minor: '#f59e0b', Significant: '#ef4444' } as Record<string, string>,
    },
];

function fmtVal(v: unknown): string {
    if (!v) return '';
    if (Array.isArray(v)) return v.join(', ');
    return String(v).trim();
}

function countFilledResponses(responses: Record<string, unknown>): number {
    return Object.entries(responses).filter(
        ([k, v]) => !META_KEYS.has(k) && fmtVal(v) !== '',
    ).length;
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const DiscoveryQuestionnaireCard: React.FC<WorkflowCardProps> = ({
    inquiry,
    onRefresh,
    isActive,
    activeColor,
}) => {
    const { currentBrand } = useBrand();
    const { user } = useAuth();
    const [submission, setSubmission] = useState<DiscoveryQuestionnaireSubmission | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        if (!inquiry?.id) return;
        api.discoveryQuestionnaireSubmissions
            .getByInquiryId(inquiry.id)
            .then((s) => {
                if (s && typeof s === 'object' && 'id' in s) {
                    setSubmission(s);
                } else {
                    setSubmission(null);
                }
            })
            .catch(() => setSubmission(null));
    }, [inquiry?.id]);

    const handleSubmitted = async (s: DiscoveryQuestionnaireSubmission) => {
        setSubmission(s);
        setDialogOpen(false);
        if (onRefresh) await onRefresh();
    };

    const responses = (submission?.responses ?? {}) as Record<string, unknown>;
    const sentiment = (submission?.sentiment ?? {}) as Record<string, string>;
    const visibleFields = KEY_FIELDS.filter(({ key }) => fmtVal(responses[key]));

    const totalQuestions = useMemo(() => {
        const questions = submission?.template?.questions;
        if (!questions || !Array.isArray(questions)) return 22;
        return questions.filter(
            (q) => q.field_key && !META_KEYS.has(q.field_key),
        ).length;
    }, [submission]);

    const filledCount = countFilledResponses(responses);
    const hasSubmission = !!submission;
    const progressPct = totalQuestions > 0 ? Math.round((filledCount / totalQuestions) * 100) : 0;

    const statusCfg = hasSubmission
        ? { label: 'Completed', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' }
        : { label: 'Not Started', color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.15)' };

    return (
        <>
            <WorkflowCard isActive={isActive} activeColor={activeColor ?? ACCENT}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    {/* ─── Header ───────────────────────────────────────── */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: hasSubmission ? 2 : 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: hasSubmission ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                                    border: `1px solid ${hasSubmission ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.15)'}`,
                                }}
                            >
                                {hasSubmission ? (
                                    <CheckCircle sx={{ fontSize: 18, color: '#10b981' }} />
                                ) : (
                                    <MicNone sx={{ fontSize: 18, color: ACCENT }} />
                                )}
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                                Discovery Call
                            </Typography>
                        </Box>

                        <Chip
                            size="small"
                            label={statusCfg.label}
                            icon={hasSubmission ? <CheckCircle sx={{ fontSize: '12px !important', color: `${statusCfg.color} !important` }} /> : undefined}
                            sx={{
                                height: 22,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                bgcolor: statusCfg.bg,
                                color: statusCfg.color,
                                border: `1px solid ${statusCfg.border}`,
                            }}
                        />
                    </Box>

                    {/* ─── Empty state ──────────────────────────────────── */}
                    {!hasSubmission && (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Box
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 2.5,
                                    mx: 'auto',
                                    mb: 1.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'rgba(59,130,246,0.08)',
                                    border: '1px solid rgba(59,130,246,0.12)',
                                }}
                            >
                                <GraphicEq sx={{ fontSize: 22, color: ACCENT }} />
                            </Box>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>
                                No notes yet
                            </Typography>
                            <Typography sx={{ color: '#475569', fontSize: '0.72rem', mt: 0.5, mb: 2, lineHeight: 1.5 }}>
                                Open the guided questionnaire during your call to capture details
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<PlayArrow sx={{ fontSize: 16 }} />}
                                onClick={() => setDialogOpen(true)}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    color: ACCENT,
                                    bgcolor: 'rgba(59,130,246,0.08)',
                                    border: '1px solid rgba(59,130,246,0.2)',
                                    px: 2.5,
                                    '&:hover': { bgcolor: 'rgba(59,130,246,0.15)', borderColor: ACCENT },
                                }}
                            >
                                Start Discovery Call
                            </Button>
                        </Box>
                    )}

                    {/* ─── Has submission ───────────────────────────────── */}
                    {hasSubmission && (
                        <Box>
                            {/* ── Meta chips ───────────────────────────────── */}
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                                {submission.call_duration_seconds != null && submission.call_duration_seconds > 0 && (
                                    <Chip
                                        size="small"
                                        icon={<AccessTime sx={{ fontSize: '12px !important', color: '#94a3b8 !important' }} />}
                                        label={formatDuration(submission.call_duration_seconds)}
                                        sx={{ height: 24, fontSize: '0.72rem', fontWeight: 600, bgcolor: 'rgba(100,116,139,0.06)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.1)' }}
                                    />
                                )}
                                {submission.transcript ? (
                                    <Chip
                                        size="small"
                                        icon={<DescriptionOutlined sx={{ fontSize: '12px !important', color: '#818cf8 !important' }} />}
                                        label="Transcript"
                                        sx={{ height: 24, fontSize: '0.72rem', fontWeight: 600, bgcolor: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.15)' }}
                                    />
                                ) : responses.recording_consent === 'yes' ? (
                                    <Chip
                                        size="small"
                                        label="Recorded · No Transcript"
                                        sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600, bgcolor: 'rgba(245,158,11,0.06)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.12)' }}
                                    />
                                ) : (
                                    <Chip
                                        size="small"
                                        icon={<VideocamOff sx={{ fontSize: '11px !important', color: '#475569 !important' }} />}
                                        label="Not Recorded"
                                        sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600, bgcolor: 'rgba(100,116,139,0.05)', color: '#475569', border: '1px solid rgba(100,116,139,0.1)' }}
                                    />
                                )}
                            </Stack>

                            {/* ── Two-column layout: Left (2/3) + Right sentiment (1/3) ── */}
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                {/* Left column — reserved for future features */}
                                <Box sx={{ flex: '1 1 66%', minWidth: 0 }}>
                                    {/* Call notes */}
                                    {submission.call_notes && (
                                        <Tooltip title={submission.call_notes} placement="top" arrow>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mb: 1.5 }}>
                                                <NoteAltOutlined sx={{ fontSize: 14, color: '#f59e0b', mt: 0.2, flexShrink: 0 }} />
                                                <Typography
                                                    sx={{
                                                        color: '#94a3b8',
                                                        fontSize: '0.75rem',
                                                        fontStyle: 'italic',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        cursor: 'default',
                                                        lineHeight: 1.6,
                                                    }}
                                                >
                                                    {submission.call_notes}
                                                </Typography>
                                            </Box>
                                        </Tooltip>
                                    )}

                                    {/* Key highlights */}
                                    {visibleFields.length > 0 && (
                                        <Stack spacing={0.5}>
                                            {visibleFields.slice(0, 4).map(({ key, label }) => (
                                                <Box key={key} sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
                                                    <Typography sx={{ color: '#475569', fontSize: '0.72rem', fontWeight: 600, minWidth: 72, flexShrink: 0 }}>
                                                        {label}
                                                    </Typography>
                                                    <Typography
                                                        sx={{
                                                            color: '#94a3b8',
                                                            fontSize: '0.72rem',
                                                            lineHeight: 1.4,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {fmtVal(responses[key])}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}
                                </Box>

                                {/* Right column — Sentiment 4×2 grid (1/3 width) */}
                                <Box sx={{ flex: '0 0 34%' }}>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.75 }}>
                                        {SENTIMENT_DEFS.map(({ key, label, icon: Icon, colors }) => {
                                            const val = sentiment[key];
                                            const color = val ? (colors[val] ?? '#64748b') : '#334155';
                                            return (
                                                <Box
                                                    key={key}
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: 0.25,
                                                        py: 1,
                                                        px: 0.5,
                                                        borderRadius: 2,
                                                        bgcolor: val ? `${color}08` : 'rgba(100,116,139,0.03)',
                                                        border: `1px solid ${val ? `${color}20` : 'rgba(100,116,139,0.06)'}`,
                                                        transition: 'all 0.15s ease',
                                                        ...(val && {
                                                            '&:hover': {
                                                                bgcolor: `${color}10`,
                                                                borderColor: `${color}30`,
                                                            },
                                                        }),
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            bgcolor: val ? `${color}15` : 'rgba(100,116,139,0.06)',
                                                        }}
                                                    >
                                                        <Icon sx={{ fontSize: 13, color: val ? color : '#475569' }} />
                                                    </Box>
                                                    <Typography sx={{ color: val ? '#94a3b8' : '#475569', fontSize: '0.55rem', fontWeight: 500, lineHeight: 1.2, textAlign: 'center' }}>
                                                        {label}
                                                    </Typography>
                                                    <Typography sx={{ color: val ? color : '#334155', fontSize: '0.67rem', fontWeight: 700, lineHeight: 1.1, textAlign: 'center' }}>
                                                        {val || '—'}
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                        {/* Placeholder tiles for row 2 */}
                                        {[
                                            { label: 'Fit Score', icon: CheckCircle },
                                            { label: 'Follow-up', icon: AccessTime },
                                            { label: 'Referral', icon: GraphicEq },
                                            { label: 'Vibe Match', icon: LocalFireDepartment },
                                        ].map(({ label, icon: PlaceholderIcon }) => (
                                            <Box
                                                key={label}
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: 0.25,
                                                    py: 1,
                                                    px: 0.5,
                                                    borderRadius: 2,
                                                    bgcolor: 'rgba(100,116,139,0.02)',
                                                    border: '1px dashed rgba(100,116,139,0.1)',
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        bgcolor: 'rgba(100,116,139,0.04)',
                                                    }}
                                                >
                                                    <PlaceholderIcon sx={{ fontSize: 13, color: '#334155' }} />
                                                </Box>
                                                <Typography sx={{ color: '#334155', fontSize: '0.55rem', fontWeight: 500, lineHeight: 1.2, textAlign: 'center' }}>
                                                    {label}
                                                </Typography>
                                                <Typography sx={{ color: '#1e293b', fontSize: '0.67rem', fontWeight: 700, lineHeight: 1.1, textAlign: 'center' }}>
                                                    —
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </Box>

                            {/* ── Progress bar ─────────────────────────────── */}
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>
                                        {filledCount} of {totalQuestions} questions
                                    </Typography>
                                    <Typography sx={{ color: progressPct === 100 ? '#10b981' : '#94a3b8', fontSize: '0.72rem', fontWeight: 700 }}>
                                        {progressPct}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={progressPct}
                                    sx={{
                                        height: 5,
                                        borderRadius: 3,
                                        bgcolor: 'rgba(100,116,139,0.1)',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 3,
                                            bgcolor: progressPct === 100 ? '#10b981' : ACCENT,
                                            transition: 'width 0.4s ease',
                                        },
                                    }}
                                />
                            </Box>

                            {/* ── Action button ────────────────────────────── */}
                            <Button
                                size="small"
                                startIcon={<EditNote sx={{ fontSize: 16 }} />}
                                onClick={() => setDialogOpen(true)}
                                fullWidth
                                sx={{
                                    color: ACCENT,
                                    textTransform: 'none',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    py: 0.75,
                                    bgcolor: 'rgba(59,130,246,0.06)',
                                    border: '1px solid rgba(59,130,246,0.12)',
                                    '&:hover': { bgcolor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.25)' },
                                }}
                            >
                                View / Edit Notes
                            </Button>
                        </Box>
                    )}
                </CardContent>
            </WorkflowCard>

            <DiscoveryQuestionnaireFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                inquiryId={inquiry.id}
                brandId={currentBrand?.id ?? 0}
                customerName={inquiry.contact?.first_name || 'there'}
                producerName={inquiry.lead_producer?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || ''}
                brandName={currentBrand?.name || ''}
                existingSubmission={submission}
                onSubmitted={handleSubmitted}
            />
        </>
    );
};

export default DiscoveryQuestionnaireCard;
