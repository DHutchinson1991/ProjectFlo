'use client';

import React, { useState } from 'react';
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
    Chip,
    Grid,
} from '@mui/material';
import {
    Assignment,
    Close,
    EditNote,
    ContentCopy as ContentCopyIcon,
    Person,
    Event,
    Videocam,
    AttachMoney,
    Schedule,
    Chat,
    Phone,
    Notes,
    HelpOutline,
} from '@mui/icons-material';
import type { NeedsAssessmentSubmission } from '@/lib/types';
import { groupNaResponses, fmtVal } from '../_lib';

/* ------------------------------------------------------------------ */
/*  Section icon map                                                   */
/* ------------------------------------------------------------------ */
const SECTION_ICONS: Record<string, React.ReactElement> = {
    Contact: <Person sx={{ fontSize: 15 }} />,
    Event: <Event sx={{ fontSize: 15 }} />,
    Coverage: <Videocam sx={{ fontSize: 15 }} />,
    Budget: <AttachMoney sx={{ fontSize: 15 }} />,
    Timeline: <Schedule sx={{ fontSize: 15 }} />,
    Communication: <Chat sx={{ fontSize: 15 }} />,
    'Discovery Call': <Phone sx={{ fontSize: 15 }} />,
    Notes: <Notes sx={{ fontSize: 15 }} />,
    Other: <HelpOutline sx={{ fontSize: 15 }} />,
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
export interface NeedsAssessmentDialogProps {
    open: boolean;
    onClose: () => void;
    submission: NeedsAssessmentSubmission | null;
    inquiryId: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function NeedsAssessmentDialog({
    open,
    onClose,
    submission,
    inquiryId,
}: NeedsAssessmentDialogProps) {
    const [naCopied, setNaCopied] = useState(false);

    const questionnaireUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}/sales/needs-assessment?inquiry=${inquiryId}`
            : '';

    const handleCopyNaLink = () => {
        navigator.clipboard.writeText(questionnaireUrl).then(() => {
            setNaCopied(true);
            setTimeout(() => setNaCopied(false), 2000);
        });
    };

    /* ---- grouped responses ---- */
    const naResponses = (submission?.responses ?? {}) as Record<string, unknown>;
    const { naGrouped, naUncategorized } = groupNaResponses(naResponses);

    /* ---- all sections (grouped + uncategorized, budget excluded) ---- */
    const allSections = [
        ...naGrouped.filter(g => g.label !== 'Budget'),
        ...(naUncategorized.length > 0 ? [{ label: 'Other', entries: naUncategorized }] : []),
    ];

    /* ---- render ---- */
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    background: 'linear-gradient(135deg, rgba(16, 18, 24, 0.98), rgba(12, 14, 18, 0.99))',
                    border: '1px solid rgba(52, 58, 68, 0.4)',
                    borderRadius: 3,
                    maxHeight: '90vh',
                },
            }}
        >
            {/* ── Header ── */}
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 1.5,
                    pt: 2.5,
                    px: 3,
                    borderBottom: '1px solid rgba(52, 58, 68, 0.25)',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 2.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.12)',
                        }}
                    >
                        <Assignment sx={{ fontSize: 20, color: '#f59e0b' }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#f1f5f9', lineHeight: 1.2 }}>
                            Needs Assessment
                        </Typography>
                        {submission && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip
                                    label={submission.status === 'linked' ? 'Linked' : submission.status}
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        bgcolor:
                                            submission.status === 'linked'
                                                ? 'rgba(34, 197, 94, 0.1)'
                                                : 'rgba(245, 158, 11, 0.1)',
                                        color: submission.status === 'linked' ? '#22c55e' : '#f59e0b',
                                        border: `1px solid ${
                                            submission.status === 'linked'
                                                ? 'rgba(34, 197, 94, 0.2)'
                                                : 'rgba(245, 158, 11, 0.2)'
                                        }`,
                                    }}
                                />
                                <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                                    Submitted{' '}
                                    {new Date(submission.submitted_at).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8' }}>
                    <Close sx={{ fontSize: 20 }} />
                </IconButton>
            </DialogTitle>

            {/* ── Content ── */}
            <DialogContent sx={{ px: 3, py: 2.5, borderColor: 'rgba(52, 58, 68, 0.25)' }}>
                {submission ? (
                    <Box>
                        {Object.keys(naResponses).length === 0 ? (
                            <Typography sx={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', py: 3, textAlign: 'center' }}>
                                No responses recorded.
                            </Typography>
                        ) : (
                            <Grid container spacing={2.5}>
                                {allSections.map((group, gi) => (
                                    <Grid item xs={12} sm={6} key={gi}>
                                        <Box
                                            sx={{
                                                height: '100%',
                                                borderRadius: 2.5,
                                                bgcolor: 'rgba(255, 255, 255, 0.02)',
                                                border: '1px solid rgba(52, 58, 68, 0.25)',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {/* Section header */}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    px: 2,
                                                    py: 1.25,
                                                    borderBottom: '1px solid rgba(52, 58, 68, 0.2)',
                                                    bgcolor: 'rgba(255, 255, 255, 0.015)',
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        color: '#f59e0b',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    {SECTION_ICONS[group.label] ?? <HelpOutline sx={{ fontSize: 15 }} />}
                                                </Box>
                                                <Typography
                                                    sx={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: 700,
                                                        color: '#f59e0b',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.06em',
                                                    }}
                                                >
                                                    {group.label}
                                                </Typography>
                                                <Chip
                                                    label={group.entries.length}
                                                    size="small"
                                                    sx={{
                                                        ml: 'auto',
                                                        height: 18,
                                                        minWidth: 24,
                                                        fontSize: '0.6rem',
                                                        fontWeight: 700,
                                                        bgcolor: 'rgba(245, 158, 11, 0.08)',
                                                        color: '#f59e0b',
                                                        '& .MuiChip-label': { px: 0.75 },
                                                    }}
                                                />
                                            </Box>
                                            {/* Section entries */}
                                            <Stack spacing={0} sx={{ px: 2, py: 1.5 }}>
                                                {group.entries.map((entry, ei) => (
                                                    <Box
                                                        key={entry.key}
                                                        sx={{
                                                            py: 1,
                                                            borderBottom:
                                                                ei < group.entries.length - 1
                                                                    ? '1px solid rgba(52, 58, 68, 0.12)'
                                                                    : 'none',
                                                        }}
                                                    >
                                                        <Typography
                                                            sx={{
                                                                fontSize: '0.62rem',
                                                                color: '#64748b',
                                                                fontWeight: 600,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.04em',
                                                                mb: 0.25,
                                                            }}
                                                        >
                                                            {entry.label}
                                                        </Typography>
                                                        <Typography
                                                            sx={{
                                                                fontSize: '0.85rem',
                                                                color: '#e2e8f0',
                                                                fontWeight: 500,
                                                                whiteSpace: 'pre-wrap',
                                                                wordBreak: 'break-word',
                                                            }}
                                                        >
                                                            {fmtVal(entry.value)}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                ) : (
                    /* ── Empty state ── */
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 3,
                                mx: 'auto',
                                mb: 2.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(245, 158, 11, 0.06)',
                                border: '1px solid rgba(245, 158, 11, 0.1)',
                            }}
                        >
                            <EditNote sx={{ fontSize: 28, color: '#f59e0b' }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.95rem', color: '#94a3b8', fontWeight: 600, mb: 0.5 }}>
                            No questionnaire submitted yet
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: '#64748b', mb: 3, maxWidth: 320, mx: 'auto', lineHeight: 1.5 }}>
                            Send the link to the client or complete the questionnaire on their behalf.
                        </Typography>
                        <Stack direction="row" spacing={1.5} justifyContent="center">
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<EditNote sx={{ fontSize: 16 }} />}
                                onClick={() => window.open(questionnaireUrl, '_blank')}
                                sx={{
                                    borderColor: 'rgba(245, 158, 11, 0.25)',
                                    color: '#f59e0b',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    '&:hover': {
                                        bgcolor: 'rgba(245, 158, 11, 0.08)',
                                        borderColor: 'rgba(245, 158, 11, 0.4)',
                                    },
                                }}
                            >
                                Complete for Client
                            </Button>
                            <Button
                                variant="text"
                                size="small"
                                startIcon={
                                    naCopied ? (
                                        <Assignment sx={{ fontSize: 14 }} />
                                    ) : (
                                        <ContentCopyIcon sx={{ fontSize: 14 }} />
                                    )
                                }
                                onClick={handleCopyNaLink}
                                sx={{
                                    color: naCopied ? '#22c55e' : '#94a3b8',
                                    fontSize: '0.75rem',
                                    textTransform: 'none',
                                }}
                            >
                                {naCopied ? 'Copied!' : 'Copy Link'}
                            </Button>
                        </Stack>
                    </Box>
                )}
            </DialogContent>

            {/* ── Footer ── */}
            <DialogActions sx={{ borderTop: '1px solid rgba(52, 58, 68, 0.2)', px: 3, py: 1.5 }}>
                <Button onClick={onClose} sx={{ color: '#94a3b8', textTransform: 'none', fontSize: '0.82rem' }}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
