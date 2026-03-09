'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    CardContent,
    Stack,
    Button,
    Chip,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
} from '@mui/material';
import {
    Assignment,
    ContentCopy,
    Visibility,
    Close,
    EditNote,
} from '@mui/icons-material';
import { Inquiry, NeedsAssessmentSubmission } from '@/lib/types';

interface QuestionnaireReviewCardProps {
    inquiry: Inquiry & { activity_logs?: unknown[] };
    onRefresh?: () => Promise<void>;
    isActive?: boolean;
    activeColor?: string;
    submission?: NeedsAssessmentSubmission | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WorkflowCard: React.ComponentType<any>;
}

// Group submission response keys by category for the review dialog
const RESPONSE_CATEGORIES: { label: string; keys: string[] }[] = [
    {
        label: 'Contact',
        keys: ['contact_first_name', 'contact_last_name', 'contact_email', 'contact_phone'],
    },
    {
        label: 'Event',
        keys: ['wedding_date', 'venue_details', 'event_type', 'stakeholders'],
    },
    {
        label: 'Budget',
        keys: ['budget_range', 'budget_flexible', 'priority_level'],
    },
    {
        label: 'Scope',
        keys: ['coverage_hours', 'deliverables', 'add_ons', 'selected_package'],
    },
    {
        label: 'Timeline',
        keys: ['decision_timeline', 'booking_date'],
    },
    {
        label: 'Communication',
        keys: ['preferred_contact_method', 'preferred_contact_time'],
    },
    {
        label: 'Notes',
        keys: ['notes', 'additional_notes', 'special_requests'],
    },
];

// Human-readable label for a field_key
const humanizeKey = (key: string) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Format a response value for display
const formatValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '-';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
};

const QuestionnaireReviewCard: React.FC<QuestionnaireReviewCardProps> = ({
    inquiry,
    onRefresh: _onRefresh, // eslint-disable-line @typescript-eslint/no-unused-vars
    isActive,
    activeColor,
    submission,
    WorkflowCard,
}) => {
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const hasSubmission = !!submission;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responses = (submission?.responses ?? {}) as Record<string, any>;
    const template = submission?.template;

    // Template version tracking
    const submissionVersion = template?.version || null;

    // Build the public questionnaire URL
    const questionnaireUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}/sales/needs-assessment?inquiry=${inquiry.id}`
            : '';

    const handleCopyLink = () => {
        navigator.clipboard.writeText(questionnaireUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // Group responses by category for the review dialog
    const groupedResponses = RESPONSE_CATEGORIES.map((cat) => {
        const entries = cat.keys
            .filter((k) => responses[k] !== undefined && responses[k] !== null && responses[k] !== '')
            .map((k) => ({ key: k, label: humanizeKey(k), value: responses[k] }));
        return { ...cat, entries };
    }).filter((cat) => cat.entries.length > 0);

    // Collect any remaining keys not covered by the categories
    const categorizedKeys = new Set(RESPONSE_CATEGORIES.flatMap((c) => c.keys));
    const uncategorizedEntries = Object.entries(responses)
        .filter(([k, v]) => !categorizedKeys.has(k) && v !== undefined && v !== null && v !== '')
        .map(([k, v]) => ({ key: k, label: humanizeKey(k), value: v }));

    const answeredCount = Object.keys(responses).length;
    const totalQuestions = RESPONSE_CATEGORIES.reduce((acc, cat) => acc + cat.keys.length, 0);
    const progressPercent = hasSubmission ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent sx={{ p: '0 !important' }}>
                {/* Questionnaire-themed header */}
                <Box sx={{
                    px: 2.5, pt: 2, pb: 1.5,
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06), rgba(251, 191, 36, 0.03))',
                    borderBottom: '1px solid rgba(245, 158, 11, 0.1)',
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                                width: 34, height: 34, borderRadius: 2,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.15)',
                            }}>
                                <Assignment sx={{ fontSize: 18, color: '#f59e0b' }} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.88rem', letterSpacing: '-0.01em' }}>
                                    Needs Assessment
                                </Typography>
                                <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                                    {hasSubmission ? 'Questionnaire completed' : 'Awaiting responses'}
                                </Typography>
                            </Box>
                        </Box>
                        {hasSubmission && (
                            <Chip
                                label={submission!.status === 'linked' ? 'Linked' : submission!.status}
                                size="small"
                                sx={{
                                    height: 22, fontSize: '0.65rem', fontWeight: 600,
                                    bgcolor: submission!.status === 'linked' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    color: submission!.status === 'linked' ? '#22c55e' : '#f59e0b',
                                    border: `1px solid ${submission!.status === 'linked' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                                }}
                            />
                        )}
                    </Box>
                </Box>

                {hasSubmission ? (
                    <Box sx={{ px: 2.5, py: 2 }}>
                        {/* Progress bar */}
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                                    {answeredCount} of {totalQuestions} fields answered
                                </Typography>
                                <Typography sx={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700 }}>
                                    {progressPercent}%
                                </Typography>
                            </Box>
                            <Box sx={{
                                height: 4, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.08)',
                                overflow: 'hidden',
                            }}>
                                <Box sx={{
                                    height: '100%', width: `${Math.min(progressPercent, 100)}%`,
                                    borderRadius: 2,
                                    background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                                    transition: 'width 0.5s ease',
                                }} />
                            </Box>
                        </Box>

                        {/* Quick preview — show top 3 answered categories with dot indicators */}
                        <Stack spacing={0.75} sx={{ mb: 2 }}>
                            {groupedResponses.slice(0, 4).map((group) => (
                                <Box key={group.label} sx={{
                                    display: 'flex', alignItems: 'center', gap: 1.25,
                                    px: 1.25, py: 0.75, borderRadius: 1.5,
                                    bgcolor: 'rgba(245, 158, 11, 0.03)',
                                    border: '1px solid rgba(52, 58, 68, 0.15)',
                                }}>
                                    <Box sx={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        bgcolor: '#22c55e', flexShrink: 0,
                                    }} />
                                    <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, flex: 1 }}>
                                        {group.label}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                                        {group.entries.length} answer{group.entries.length !== 1 ? 's' : ''}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>

                        {/* Version + date */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            {submissionVersion && (
                                <Typography sx={{ fontSize: '0.62rem', color: '#64748b', px: 1, py: 0.25, borderRadius: 1, bgcolor: 'rgba(52, 58, 68, 0.2)' }}>
                                    v{submissionVersion}
                                </Typography>
                            )}
                            <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                                {new Date(submission!.submitted_at).toLocaleDateString(undefined, {
                                    year: 'numeric', month: 'short', day: 'numeric',
                                })}
                            </Typography>
                        </Box>

                        <Button
                            variant="outlined"
                            startIcon={<Visibility sx={{ fontSize: 16 }} />}
                            onClick={() => setReviewDialogOpen(true)}
                            fullWidth
                            size="small"
                            sx={{
                                borderColor: 'rgba(245, 158, 11, 0.25)',
                                color: '#f59e0b',
                                fontSize: '0.78rem', fontWeight: 600,
                                borderRadius: 2, textTransform: 'none',
                                '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.4)' },
                            }}
                        >
                            Review All Responses
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ px: 2.5, py: 2 }}>
                        {/* Empty state — clipboard illustration */}
                        <Box sx={{
                            textAlign: 'center', py: 2, mb: 2,
                            borderRadius: 2, border: '1.5px dashed rgba(245, 158, 11, 0.15)',
                            bgcolor: 'rgba(245, 158, 11, 0.02)',
                        }}>
                            <Box sx={{
                                width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.5,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: 'rgba(245, 158, 11, 0.08)',
                                border: '1px solid rgba(245, 158, 11, 0.12)',
                            }}>
                                <EditNote sx={{ fontSize: 24, color: '#f59e0b' }} />
                            </Box>
                            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500, mb: 0.5 }}>
                                No responses yet
                            </Typography>
                            <Typography sx={{ fontSize: '0.68rem', color: '#64748b', maxWidth: 200, mx: 'auto' }}>
                                Send the questionnaire link or complete it on behalf of the client
                            </Typography>
                        </Box>

                        <Stack spacing={1.25}>
                            <Button
                                variant="outlined"
                                startIcon={<EditNote sx={{ fontSize: 16 }} />}
                                onClick={() => window.open(questionnaireUrl, '_blank')}
                                fullWidth
                                size="small"
                                sx={{
                                    borderColor: 'rgba(245, 158, 11, 0.25)',
                                    color: '#f59e0b',
                                    fontSize: '0.78rem', fontWeight: 600,
                                    borderRadius: 2, textTransform: 'none',
                                    '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.4)' },
                                }}
                            >
                                Complete for Client
                            </Button>
                            <Button
                                variant="text"
                                startIcon={copied ? <Assignment sx={{ fontSize: 14 }} /> : <ContentCopy sx={{ fontSize: 14 }} />}
                                onClick={handleCopyLink}
                                size="small"
                                sx={{
                                    color: copied ? '#22c55e' : '#94a3b8',
                                    fontSize: '0.72rem', textTransform: 'none',
                                    '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.08)' },
                                }}
                            >
                                {copied ? 'Link Copied!' : 'Copy Client Link'}
                            </Button>
                        </Stack>
                    </Box>
                )}
            </CardContent>

            {/* Review Responses Dialog */}
            <Dialog
                open={reviewDialogOpen}
                onClose={() => setReviewDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        background: 'rgba(16, 18, 22, 0.95)',
                        border: '1px solid rgba(52, 58, 68, 0.5)',
                        borderRadius: 3,
                    },
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Questionnaire Responses</Typography>
                    <IconButton size="small" onClick={() => setReviewDialogOpen(false)}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {groupedResponses.map((group, gi) => (
                        <Box key={gi} sx={{ mb: 3 }}>
                            <Typography
                                variant="subtitle2"
                                color="primary"
                                sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                            >
                                {group.label}
                            </Typography>
                            <Stack spacing={1}>
                                {group.entries.map((entry) => (
                                    <Box key={entry.key}>
                                        <Typography variant="caption" color="text.secondary">
                                            {entry.label}
                                        </Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {formatValue(entry.value)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                            {gi < groupedResponses.length - 1 && <Divider sx={{ mt: 2 }} />}
                        </Box>
                    ))}

                    {/* Uncategorized responses */}
                    {uncategorizedEntries.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography
                                variant="subtitle2"
                                color="primary"
                                sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                            >
                                Other
                            </Typography>
                            <Stack spacing={1}>
                                {uncategorizedEntries.map((entry) => (
                                    <Box key={entry.key}>
                                        <Typography variant="caption" color="text.secondary">
                                            {entry.label}
                                        </Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {formatValue(entry.value)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {Object.keys(responses).length === 0 && (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            No responses recorded.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReviewDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </WorkflowCard>
    );
};

export default QuestionnaireReviewCard;
