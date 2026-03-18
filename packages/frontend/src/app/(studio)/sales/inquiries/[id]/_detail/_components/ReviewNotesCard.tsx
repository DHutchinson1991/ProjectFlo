'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, CardContent, TextField, Button, Chip, Stack,
    Accordion, AccordionSummary, AccordionDetails, IconButton, Tooltip,
} from '@mui/material';
import {
    RateReview, CheckCircle, ExpandMore, ContentCopy, OpenInNew, DataObject,
} from '@mui/icons-material';
import { api } from '@/lib/api';
import { groupNaResponses, fmtVal } from '../_lib';
import type { WorkflowCardProps } from '../_lib';
import { WorkflowCard } from './WorkflowCard';

const ACCENT = '#8b5cf6'; // purple

const ReviewNotesCard: React.FC<WorkflowCardProps> = ({
    inquiry, onRefresh, isActive, activeColor, submission,
}) => {
    const [reviewNotes, setReviewNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [savingNotes, setSavingNotes] = useState(false);
    const [reviewDone, setReviewDone] = useState(false);
    const [portalToken, setPortalToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Hydrate from existing submission data
    useEffect(() => {
        if (submission) {
            setReviewNotes(submission.review_notes ?? '');
            setReviewDone(!!submission.reviewed_at);
        }
    }, [submission]);

    // Generate portal link
    useEffect(() => {
        if (inquiry?.id) {
            api.clientPortal.generateToken(inquiry.id)
                .then((res) => setPortalToken(res.portal_token))
                .catch(() => setPortalToken(null));
        }
    }, [inquiry?.id]);

    const portalUrl =
        typeof window !== 'undefined' && portalToken
            ? `${window.location.origin}/portal/${portalToken}`
            : '';

    const handleCopyLink = useCallback(() => {
        if (!portalUrl) return;
        navigator.clipboard.writeText(portalUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [portalUrl]);

    const handleCompleteReview = async () => {
        if (!submission) return;
        setSubmitting(true);
        try {
            await api.needsAssessmentSubmissions.review(submission.id, {
                review_notes: reviewNotes || undefined,
            });
            setReviewDone(true);
            onRefresh?.();
        } catch {
            // user can retry
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveNotes = async () => {
        if (!submission) return;
        setSavingNotes(true);
        try {
            await api.needsAssessmentSubmissions.review(submission.id, {
                review_notes: reviewNotes || undefined,
            });
            onRefresh?.();
        } catch {
            // user can retry
        } finally {
            setSavingNotes(false);
        }
    };

    const notesChanged = reviewNotes !== (submission?.review_notes ?? '');

    // Raw data for collapsible accordion
    const responses = (submission?.responses ?? {}) as Record<string, unknown>;
    const { naGrouped, naUncategorized } = groupNaResponses(responses);
    const allSections = [
        ...naGrouped,
        ...(naUncategorized.length > 0
            ? [{ label: 'Other', entries: naUncategorized, keys: [] as string[] }]
            : []),
    ];

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor} sx={{ height: 'fit-content' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{
                        width: 32, height: 32, borderRadius: 2,
                        bgcolor: 'rgba(139,92,246,0.1)',
                        border: '1px solid rgba(139,92,246,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <RateReview sx={{ fontSize: 18, color: ACCENT }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9', flex: 1 }}>
                        Inquiry Received
                    </Typography>
                    {submission && (
                        <Chip
                            size="small"
                            label={reviewDone ? 'Reviewed' : submission.status === 'linked' ? 'Linked' : 'Pending Review'}
                            sx={{
                                height: 20, fontSize: '0.65rem', fontWeight: 700,
                                bgcolor: reviewDone
                                    ? 'rgba(16,185,129,0.12)'
                                    : 'rgba(139,92,246,0.12)',
                                color: reviewDone ? '#10b981' : ACCENT,
                                border: `1px solid ${reviewDone ? 'rgba(16,185,129,0.2)' : 'rgba(139,92,246,0.2)'}`,
                            }}
                        />
                    )}
                </Box>

                {!submission ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                            No assessment submitted yet
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {/* Submitted date */}
                        {submission.submitted_at && (
                            <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                                Submitted {new Date(submission.submitted_at).toLocaleDateString('en-GB', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                })}
                            </Typography>
                        )}

                        {/* Review notes */}
                        <TextField
                            multiline
                            minRows={2}
                            maxRows={6}
                            placeholder="Review notes (optional)…"
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    fontSize: '0.8rem',
                                    color: '#e2e8f0',
                                    bgcolor: 'rgba(15,23,42,0.4)',
                                    '& fieldset': { borderColor: 'rgba(148,163,184,0.15)' },
                                    '&:hover fieldset': { borderColor: 'rgba(139,92,246,0.3)' },
                                    '&.Mui-focused fieldset': { borderColor: ACCENT },
                                },
                            }}
                        />

                        {/* Actions row */}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            {reviewDone && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    disabled={savingNotes || !notesChanged}
                                    onClick={handleSaveNotes}
                                    sx={{
                                        fontSize: '0.72rem', textTransform: 'none', fontWeight: 600,
                                        color: '#cbd5e1', borderColor: 'rgba(148,163,184,0.2)',
                                    }}
                                >
                                    {savingNotes ? 'Saving notes…' : 'Save Notes'}
                                </Button>
                            )}

                            <Button
                                size="small"
                                variant={reviewDone ? 'outlined' : 'contained'}
                                disabled={submitting || reviewDone}
                                onClick={handleCompleteReview}
                                startIcon={reviewDone ? <CheckCircle /> : <RateReview />}
                                sx={{
                                    fontSize: '0.72rem', textTransform: 'none', fontWeight: 600,
                                    ...(reviewDone
                                        ? { color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }
                                        : { bgcolor: ACCENT, '&:hover': { bgcolor: '#7c3aed' } }),
                                }}
                            >
                                {submitting ? 'Saving…' : reviewDone ? 'Review Complete' : 'Complete Review'}
                            </Button>

                            {portalUrl && (
                                <>
                                    <Tooltip title={copied ? 'Copied!' : 'Copy portal link'}>
                                        <IconButton size="small" onClick={handleCopyLink} sx={{ color: '#94a3b8' }}>
                                            <ContentCopy sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Open client portal">
                                        <IconButton
                                            size="small"
                                            onClick={() => window.open(portalUrl, '_blank')}
                                            sx={{ color: '#94a3b8' }}
                                        >
                                            <OpenInNew sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Tooltip>
                                </>
                            )}
                        </Box>

                        {/* Raw data accordion */}
                        {allSections.length > 0 && (
                            <Accordion
                                disableGutters
                                elevation={0}
                                sx={{
                                    bgcolor: 'transparent',
                                    '&:before': { display: 'none' },
                                    border: '1px solid rgba(148,163,184,0.08)',
                                    borderRadius: '8px !important',
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMore sx={{ color: '#64748b', fontSize: 18 }} />}
                                    sx={{ minHeight: 36, px: 1.5, '& .MuiAccordionSummary-content': { my: 0.5 } }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <DataObject sx={{ fontSize: 14, color: '#64748b' }} />
                                        <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                                            All Responses
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ px: 1.5, pb: 1.5, pt: 0 }}>
                                    <Stack spacing={1.5}>
                                        {allSections.map(section => (
                                            <Box key={section.label}>
                                                <Typography sx={{
                                                    fontSize: '0.65rem', fontWeight: 700, color: ACCENT,
                                                    textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5,
                                                }}>
                                                    {section.label}
                                                </Typography>
                                                {section.entries.map(entry => (
                                                    <Box key={entry.key} sx={{
                                                        display: 'flex', gap: 1, py: 0.25,
                                                        borderBottom: '1px solid rgba(148,163,184,0.05)',
                                                    }}>
                                                        <Typography sx={{
                                                            fontSize: '0.7rem', color: '#64748b',
                                                            minWidth: 100, flexShrink: 0,
                                                        }}>
                                                            {entry.label}
                                                        </Typography>
                                                        <Typography sx={{
                                                            fontSize: '0.7rem', color: '#cbd5e1',
                                                            wordBreak: 'break-word',
                                                        }}>
                                                            {fmtVal(entry.value)}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        ))}
                                    </Stack>
                                </AccordionDetails>
                            </Accordion>
                        )}
                    </Stack>
                )}
            </CardContent>
        </WorkflowCard>
    );
};

export default ReviewNotesCard;
