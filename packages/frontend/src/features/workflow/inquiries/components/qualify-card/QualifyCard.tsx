'use client';

import React, { useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Typography,
} from '@mui/material';
import { CheckCircle, VerifiedUser } from '@mui/icons-material';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { inquiryWizardSubmissionsApi } from '@/features/workflow/inquiry-wizard';
import { useBrand } from '@/features/platform/brand';
import type { InquiryCrewAvailabilityRow, InquiryEquipmentAvailabilityRow } from '@/features/workflow/inquiries/types';
import { WelcomeEmailDialog, type WelcomeEmailDraft } from '../welcome-email-dialog';
import { buildWelcomeDraft } from './build-welcome-draft';
import type { QualifyCardProps, SubtaskLite, DiscoveryCallData } from './types';

export default function QualifyCard({ inquiry, inquiryTasks, submission, onRefresh }: QualifyCardProps) {
    const [busy, setBusy] = useState<'qualify' | 'welcome' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);
    const [welcomeDraft, setWelcomeDraft] = useState<WelcomeEmailDraft | null>(null);

    const responses = (submission?.responses as Record<string, unknown> | undefined) ?? {};
    const leadProducer = inquiry.lead_producer ?? null;
    const { currentBrand } = useBrand();
    const brandName = currentBrand?.name || 'Our Team';

    const allSubtasks = useMemo(() => {
        const tasks = inquiryTasks ?? [];
        const subtasks: SubtaskLite[] = [];
        for (const task of tasks) {
            if (!task.subtasks) continue;
            for (const subtask of task.subtasks) {
                subtasks.push({
                    id: subtask.id,
                    subtask_key: subtask.subtask_key,
                    status: subtask.status,
                });
            }
        }
        return subtasks;
    }, [inquiryTasks]);

    const qualifySubtask = allSubtasks.find((s) => s.subtask_key === 'mark_inquiry_qualified');
    const welcomeSubtask = allSubtasks.find((s) => s.subtask_key === 'send_welcome_response');
    const discoveryCallSubtask = allSubtasks.find((s) => s.subtask_key === 'schedule_discovery_call');

    const missingDataQuestions = useMemo(() => {
        const lines: string[] = [];
        if (!inquiry.event_date) lines.push('Could you confirm your event date?');
        if (!inquiry.venue_details && !inquiry.venue_address) lines.push('Do you already have a venue in mind?');
        if (!inquiry.budget_range && !responses.guest_count) lines.push('Approximately how many guests are expected?');
        return lines;
    }, [inquiry, responses.guest_count]);

    const handleQualify = () => {
        if (isComplete) return;
        handleOpenWelcomeDialog();
    };

    const handleOpenWelcomeDialog = async () => {
        setBusy('welcome');
        let portalUrl: string | null = null;
        let discoveryCall: DiscoveryCallData = null;
        let crew: InquiryCrewAvailabilityRow[] = [];
        let equipment: InquiryEquipmentAvailabilityRow[] = [];
        try {
            const [portalResult, callResult, crewResult, equipmentResult] = await Promise.allSettled([
                inquiryWizardSubmissionsApi.generatePortalToken(inquiry.id),
                inquiriesApi.getDiscoveryCall(inquiry.id),
                inquiriesApi.getCrewAvailability(inquiry.id),
                inquiriesApi.getEquipmentAvailability(inquiry.id),
            ]);
            if (portalResult.status === 'fulfilled' && portalResult.value?.portal_token) {
                portalUrl = `${window.location.origin}/portal/${portalResult.value.portal_token}`;
            }
            if (callResult.status === 'fulfilled') discoveryCall = callResult.value;
            if (crewResult.status === 'fulfilled') crew = crewResult.value.rows;
            if (equipmentResult.status === 'fulfilled') equipment = equipmentResult.value.rows;
        } catch {
            // Non-fatal
        } finally {
            setBusy(null);
        }

        const draft = buildWelcomeDraft(
            inquiry,
            leadProducer,
            missingDataQuestions,
            brandName,
            Number(currentBrand?.default_tax_rate ?? 0),
            portalUrl,
            discoveryCall,
            String(responses.discovery_call_interest ?? ''),
            crew,
            equipment,
        );
        if (!draft) {
            setError('Inquiry contact email is required before sending welcome response');
            return;
        }
        setWelcomeDraft(draft);
        setWelcomeDialogOpen(true);
    };

    const handleConfirmWelcome = async () => {
        if (!welcomeDraft) return;
        try {
            setError(null);
            setBusy('welcome');
            // Mark both qualify and welcome subtasks as completed together
            if (qualifySubtask && qualifySubtask.status !== 'Completed') {
                await inquiriesApi.inquiryTasks.toggleSubtask(inquiry.id, qualifySubtask.id);
            }
            if (welcomeSubtask && welcomeSubtask.status !== 'Completed') {
                await inquiriesApi.inquiryTasks.toggleSubtask(inquiry.id, welcomeSubtask.id);
            }
            await onRefresh();
            setWelcomeDialogOpen(false);
            const subject = encodeURIComponent(welcomeDraft.subject);
            const body = encodeURIComponent(welcomeDraft.body);
            window.location.href = `mailto:${encodeURIComponent(welcomeDraft.recipientEmail)}?subject=${subject}&body=${body}`;
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to send welcome response');
        } finally {
            setBusy(null);
        }
    };

    const isQualified = qualifySubtask?.status === 'Completed';
    const isWelcomeSent = welcomeSubtask?.status === 'Completed';
    const isComplete = isQualified && isWelcomeSent;

    const qualifyDisabled = busy !== null || !qualifySubtask || isComplete || !discoveryCallSubtask || discoveryCallSubtask.status !== 'Completed' || !inquiry.contact?.email;

    // ── Completed state ──
    if (isComplete) {
        return (
            <Box
                id="qualify-section"
                sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(6,78,59,0.12) 100%)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <Box
                    sx={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 16px rgba(16,185,129,0.25)',
                    }}
                >
                    <CheckCircle sx={{ fontSize: '1.3rem', color: '#fff' }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#e2e8f0' }}>
                        Qualified &amp; Welcome Sent
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.25 }} noWrap>
                        {inquiry.contact?.email ?? 'Client notified'}
                    </Typography>
                </Box>
            </Box>
        );
    }

    // ── Active state ──
    return (
        <Box
            id="qualify-section"
            sx={{
                borderRadius: 3,
                overflow: 'hidden',
                background: 'linear-gradient(160deg, rgba(99,102,241,0.07) 0%, rgba(15,23,42,0.6) 50%, rgba(139,92,246,0.05) 100%)',
                border: '1px solid rgba(99,102,241,0.2)',
            }}
        >
            {/* Header bar */}
            <Box
                sx={{
                    px: 2.5, py: 1.5,
                    background: 'linear-gradient(90deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
                    borderBottom: '1px solid rgba(99,102,241,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <VerifiedUser sx={{ fontSize: '1rem', color: '#818cf8' }} />
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#c7d2fe', letterSpacing: '0.02em' }}>
                    Qualify &amp; Respond
                </Typography>
            </Box>

            {error && (
                <Box sx={{ px: 2, pt: 1.5 }}>
                    <Alert severity="error" sx={{ py: 0.25, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
                        {error}
                    </Alert>
                </Box>
            )}

            {/* Action button */}
            <Box sx={{ p: 2 }}>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleQualify}
                    disabled={qualifyDisabled}
                    startIcon={
                        busy === 'welcome'
                            ? <CircularProgress size={16} sx={{ color: 'inherit' }} />
                            : <CheckCircle sx={{ fontSize: '1.1rem' }} />
                    }
                    sx={{
                        py: 1.25,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                        boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
                            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                        },
                        '&.Mui-disabled': {
                            background: 'rgba(99,102,241,0.15)',
                            color: 'rgba(148,163,184,0.5)',
                        },
                    }}
                >
                    Qualify
                </Button>
            </Box>

            <WelcomeEmailDialog
                open={welcomeDialogOpen}
                onClose={() => setWelcomeDialogOpen(false)}
                draft={welcomeDraft}
                onDraftChange={setWelcomeDraft}
                onConfirm={handleConfirmWelcome}
                loading={busy === 'welcome'}
                error={error}
            />
        </Box>
    );
}
