'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, Chip,
} from '@mui/material';
import {
    Assignment, Close, EditNote, ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import type { InquiryWizardSubmission, IwDateConflictResult, IwCrewConflictResult } from '@/features/workflow/inquiry-wizard/types';
import { groupNaResponses } from '../lib';
import { apiClient } from '@/lib/api';
import { createInquiryWizardSubmissionsApi } from '@/features/workflow/inquiry-wizard/api';
import IwSubmissionSections from './IwSubmissionSections';
import IwReviewPanel from './IwReviewPanel';

const wizardSubmissionsApi = createInquiryWizardSubmissionsApi(apiClient);

export interface InquiryWizardDialogProps {
    open: boolean;
    onClose: () => void;
    submission: InquiryWizardSubmission | null;
    inquiryId: number;
}

export default function InquiryWizardDialog({ open, onClose, submission, inquiryId }: InquiryWizardDialogProps) {
    const [naCopied, setNaCopied] = useState(false);
    const [portalToken, setPortalToken] = useState<string | null>(null);
    const [dateConflicts, setDateConflicts] = useState<IwDateConflictResult | null>(null);
    const [crewConflicts, setCrewConflicts] = useState<IwCrewConflictResult | null>(null);
    const [loadingConflicts, setLoadingConflicts] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewDone, setReviewDone] = useState(false);

    React.useEffect(() => {
        if (open && inquiryId) {
            wizardSubmissionsApi.generatePortalToken(inquiryId)
                .then((res) => setPortalToken(res.portal_token))
                .catch(() => setPortalToken(null));
        }
    }, [open, inquiryId]);

    React.useEffect(() => {
        if (open && submission) {
            setReviewNotes(submission.review_notes ?? '');
            setChecklistState((submission.review_checklist_state as Record<string, boolean>) ?? {});
            setReviewDone(!!submission.reviewed_at);
            setLoadingConflicts(true);
            setDateConflicts(null);
            setCrewConflicts(null);
            Promise.all([
                wizardSubmissionsApi.checkDateConflicts(submission.id),
                wizardSubmissionsApi.checkCrewConflicts(submission.id),
            ])
                .then(([dc, cc]) => { setDateConflicts(dc); setCrewConflicts(cc); })
                .catch(() => {
                    setDateConflicts({ wedding_date: null, booked_conflicts: [], soft_conflicts: [] });
                    setCrewConflicts({ conflicts: [] });
                })
                .finally(() => setLoadingConflicts(false));
        }
    }, [open, submission]);

    const portalUrl = typeof window !== 'undefined' && portalToken
        ? `${window.location.origin}/portal/${portalToken}`
        : '';

    const handleCopyNaLink = () => {
        if (!portalUrl) return;
        navigator.clipboard.writeText(portalUrl).then(() => {
            setNaCopied(true);
            setTimeout(() => setNaCopied(false), 2000);
        });
    };

    const handleCompleteReview = async () => {
        if (!submission) return;
        setSubmittingReview(true);
        try {
            await wizardSubmissionsApi.review(submission.id, {
                review_notes: reviewNotes || undefined,
                review_checklist_state: checklistState,
            });
            setReviewDone(true);
        } catch { /* silently ignore */ } finally { setSubmittingReview(false); }
    };

    const naResponses = (submission?.responses ?? {}) as Record<string, unknown>;
    const { naGrouped, naUncategorized } = groupNaResponses(naResponses);
    const allSections = [
        ...naGrouped.filter((g) => g.label !== 'Budget'),
        ...(naUncategorized.length > 0 ? [{ label: 'Other', entries: naUncategorized }] : []),
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { background: 'linear-gradient(135deg, rgba(16, 18, 24, 0.98), rgba(12, 14, 18, 0.99))', border: '1px solid rgba(52, 58, 68, 0.4)', borderRadius: 3, maxHeight: '90vh' } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5, pt: 2.5, px: 3, borderBottom: '1px solid rgba(52, 58, 68, 0.25)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 38, height: 38, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.12)' }}>
                        <Assignment sx={{ fontSize: 20, color: '#f59e0b' }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#f1f5f9', lineHeight: 1.2 }}>Inquiry Wizard</Typography>
                        {submission && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip label={submission.status === 'linked' ? 'Linked' : submission.status} size="small"
                                    sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', bgcolor: submission.status === 'linked' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: submission.status === 'linked' ? '#22c55e' : '#f59e0b', border: `1px solid ${submission.status === 'linked' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'}` }} />
                                <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                                    Submitted {new Date(submission.submitted_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8' }}><Close sx={{ fontSize: 20 }} /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 2.5, borderColor: 'rgba(52, 58, 68, 0.25)' }}>
                {submission ? (
                    <Box>
                        <IwSubmissionSections sections={allSections} />
                        <IwReviewPanel
                            dateConflicts={dateConflicts} crewConflicts={crewConflicts} loadingConflicts={loadingConflicts}
                            reviewNotes={reviewNotes} onReviewNotesChange={setReviewNotes}
                            checklistState={checklistState} onToggleChecklist={(key) => setChecklistState((prev) => ({ ...prev, [key]: !prev[key] }))}
                            submittingReview={submittingReview} reviewDone={reviewDone} onCompleteReview={handleCompleteReview}
                        />
                    </Box>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Box sx={{ width: 56, height: 56, borderRadius: 3, mx: 'auto', mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                            <EditNote sx={{ fontSize: 28, color: '#f59e0b' }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.95rem', color: '#94a3b8', fontWeight: 600, mb: 0.5 }}>No questionnaire submitted yet</Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: '#64748b', mb: 3, maxWidth: 320, mx: 'auto', lineHeight: 1.5 }}>
                            Send the Client Portal link to the client or complete the questionnaire on their behalf.
                        </Typography>
                        <Stack direction="row" spacing={1.5} justifyContent="center">
                            <Button variant="outlined" size="small" startIcon={<EditNote sx={{ fontSize: 16 }} />}
                                onClick={() => portalUrl && window.open(portalUrl, '_blank')}
                                sx={{ borderColor: 'rgba(245, 158, 11, 0.25)', color: '#f59e0b', fontSize: '0.78rem', fontWeight: 600, borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.4)' } }}>
                                Complete for Client
                            </Button>
                            <Button variant="text" size="small" startIcon={naCopied ? <Assignment sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                                onClick={handleCopyNaLink} sx={{ color: naCopied ? '#22c55e' : '#94a3b8', fontSize: '0.75rem', textTransform: 'none' }}>
                                {naCopied ? 'Copied!' : 'Copy Client Portal Link'}
                            </Button>
                        </Stack>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ borderTop: '1px solid rgba(52, 58, 68, 0.2)', px: 3, py: 1.5 }}>
                <Button onClick={onClose} sx={{ color: '#94a3b8', textTransform: 'none', fontSize: '0.82rem' }}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
