'use client';

import React, { useMemo, useState } from 'react';
import { Button, LinearProgress } from '@mui/material';
import { CardGiftcard, CheckCircle, Close } from '@mui/icons-material';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { inquiryWizardSubmissionsApi } from '@/features/workflow/inquiry-wizard';
import { InquiryStatus } from '@/features/workflow/inquiries/types';
import type { InquiryCrewAvailabilityRow, InquiryEquipmentAvailabilityRow } from '@/features/workflow/inquiries/types';
import { useBrand } from '@/features/platform/brand';
import { WelcomeEmailDialog, type WelcomeEmailDraft } from '../welcome-email-dialog';
import { buildWelcomeDraft } from '../qualify-card/build-welcome-draft';
import type { DiscoveryCallData } from '../qualify-card/types';
import type { HeaderActionsProps } from './types';

export default function HeaderActions({ inquiry, inquiryTasks, submission, onRefresh, onSnackbar }: HeaderActionsProps) {
    const [sendingWelcomePack, setSendingWelcomePack] = useState(false);
    const [welcomePackSent, setWelcomePackSent] = useState(!!inquiry.welcome_sent_at);
    const [qualifying, setQualifying] = useState(false);
    const [updatingOutcome, setUpdatingOutcome] = useState<null | 'convert' | 'cancel'>(null);
    const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);
    const [welcomeDraft, setWelcomeDraft] = useState<WelcomeEmailDraft | null>(null);
    const [welcomeError, setWelcomeError] = useState<string | null>(null);

    const { currentBrand } = useBrand();
    const brandName = currentBrand?.name || 'Our Team';
    const responses = (submission?.responses as Record<string, unknown> | undefined) ?? {};
    const leadProducer = inquiry.lead_producer ?? null;

    const allSubtasks = inquiryTasks.flatMap((task) => task.subtasks ?? []);
    const qualifySubtask = allSubtasks.find((subtask) => subtask.subtask_key === 'mark_inquiry_qualified');
    const welcomeSubtask = allSubtasks.find((subtask) => subtask.subtask_key === 'send_welcome_response');
    const discoveryCallSubtask = allSubtasks.find((subtask) => subtask.subtask_key === 'schedule_discovery_call');
    const isQualified = qualifySubtask?.status === 'Completed';
    const isWelcomeSent = welcomeSubtask?.status === 'Completed';
    const canQualify = !!qualifySubtask && !!discoveryCallSubtask && discoveryCallSubtask.status === 'Completed' && !(isQualified && isWelcomeSent) && !!inquiry.contact?.email;

    const missingDataQuestions = useMemo(() => {
        const lines: string[] = [];
        if (!inquiry.event_date) lines.push('Could you confirm your event date?');
        if (!inquiry.venue_details && !inquiry.venue_address) lines.push('Do you already have a venue in mind?');
        if (!inquiry.budget_range && !responses.guest_count) lines.push('Approximately how many guests are expected?');
        return lines;
    }, [inquiry, responses.guest_count]);

    const handleQualify = async () => {
        if (!canQualify || qualifying) return;
        setQualifying(true);
        setWelcomeError(null);

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
            setQualifying(false);
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
            onSnackbar('Inquiry contact email is required before sending welcome response');
            return;
        }
        setWelcomeDraft(draft);
        setWelcomeDialogOpen(true);
    };

    const handleConfirmWelcome = async () => {
        if (!welcomeDraft) return;
        try {
            setWelcomeError(null);
            setQualifying(true);
            if (qualifySubtask && qualifySubtask.status !== 'Completed') {
                await inquiriesApi.inquiryTasks.toggleSubtask(inquiry.id, qualifySubtask.id);
            }
            if (welcomeSubtask && welcomeSubtask.status !== 'Completed') {
                await inquiriesApi.inquiryTasks.toggleSubtask(inquiry.id, welcomeSubtask.id);
            }
            await onRefresh();
            setWelcomeDialogOpen(false);
            onSnackbar('Inquiry qualified & welcome sent');
            const subject = encodeURIComponent(welcomeDraft.subject);
            const body = encodeURIComponent(welcomeDraft.body);
            window.location.href = `mailto:${encodeURIComponent(welcomeDraft.recipientEmail)}?subject=${subject}&body=${body}`;
        } catch {
            setWelcomeError('Unable to send welcome response');
            onSnackbar('Failed to qualify inquiry');
        } finally {
            setQualifying(false);
        }
    };

    const handleSendWelcomePack = async () => {
        if (welcomePackSent || sendingWelcomePack) return;
        try {
            setSendingWelcomePack(true);
            await inquiriesApi.sendWelcomePack(inquiry.id);
            setWelcomePackSent(true);
            onSnackbar('Welcome pack sent!');
            await onRefresh();
        } catch {
            onSnackbar('Failed to send welcome pack');
        } finally {
            setSendingWelcomePack(false);
        }
    };

    const handleSetOutcome = async (status: InquiryStatus.WON | InquiryStatus.LOST) => {
        if (updatingOutcome) return;
        try {
            setUpdatingOutcome(status === InquiryStatus.WON ? 'convert' : 'cancel');
            await inquiriesApi.update(inquiry.id, { status });
            onSnackbar(status === InquiryStatus.WON ? 'Inquiry converted' : 'Inquiry cancelled');
            await onRefresh();
        } catch {
            onSnackbar(status === InquiryStatus.WON ? 'Failed to convert inquiry' : 'Failed to cancel inquiry');
        } finally {
            setUpdatingOutcome(null);
        }
    };

    return (
        <>
            {/* Mission control qualified button */}
            {!(isQualified && isWelcomeSent) && (
                <Button
                    id="qualify-respond-section"
                    variant="contained"
                    size="small"
                    startIcon={
                        qualifying
                            ? <LinearProgress sx={{ width: 14 }} />
                            : <CheckCircle sx={{ fontSize: 14 }} />
                    }
                    disabled={qualifying || !canQualify}
                    onClick={handleQualify}
                    sx={{
                        background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                        color: '#eef2ff',
                        border: '1px solid rgba(129, 140, 248, 0.45)',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.24)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
                        },
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 1.5,
                        py: 0.5,
                        '&.Mui-disabled': {
                            opacity: 0.6,
                        },
                    }}
                >
                    Mark Qualified
                </Button>
            )}

            {isQualified && isWelcomeSent && (
                <>
                    <Button
                        id="qualify-respond-section"
                        variant="contained"
                        size="small"
                        startIcon={updatingOutcome === 'convert' ? <LinearProgress sx={{ width: 14 }} /> : <CheckCircle sx={{ fontSize: 14 }} />}
                        disabled={updatingOutcome !== null}
                        onClick={() => handleSetOutcome(InquiryStatus.WON)}
                        sx={{
                            background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                            color: '#ecfeff',
                            border: '1px solid rgba(20, 184, 166, 0.42)',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.24)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #059669, #0d9488)',
                            },
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 1.5,
                            py: 0.5,
                        }}
                    >
                        Convert
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={updatingOutcome === 'cancel' ? <LinearProgress sx={{ width: 14 }} /> : <Close sx={{ fontSize: 14 }} />}
                        disabled={updatingOutcome !== null}
                        onClick={() => handleSetOutcome(InquiryStatus.LOST)}
                        sx={{
                            borderColor: 'rgba(244, 63, 94, 0.35)',
                            color: '#fb7185',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 1.5,
                            py: 0.5,
                            '&:hover': {
                                bgcolor: 'rgba(244, 63, 94, 0.08)',
                                borderColor: 'rgba(244, 63, 94, 0.5)',
                            },
                        }}
                    >
                        Cancel
                    </Button>
                </>
            )}

            <WelcomeEmailDialog
                open={welcomeDialogOpen}
                onClose={() => setWelcomeDialogOpen(false)}
                draft={welcomeDraft}
                onDraftChange={setWelcomeDraft}
                onConfirm={handleConfirmWelcome}
                loading={qualifying}
                error={welcomeError}
            />

            {/* Send Welcome Pack button — shown only when inquiry is Booked */}
            {inquiry.status === 'Booked' && (
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={
                        sendingWelcomePack
                            ? <LinearProgress sx={{ width: 14 }} />
                            : <CardGiftcard sx={{ fontSize: 14 }} />
                    }
                    disabled={welcomePackSent || sendingWelcomePack}
                    onClick={handleSendWelcomePack}
                    sx={{
                        borderColor: welcomePackSent ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 1.5,
                        py: 0.5,
                        '&:hover': {
                            bgcolor: 'rgba(16, 185, 129, 0.08)',
                            borderColor: 'rgba(16, 185, 129, 0.5)',
                        },
                        '&.Mui-disabled': {
                            borderColor: 'rgba(16, 185, 129, 0.25)',
                            color: '#10b981',
                            opacity: 0.6,
                        },
                    }}
                >
                    {welcomePackSent ? 'Welcome Pack Sent' : 'Send Welcome Pack'}
                </Button>
            )}

        </>
    );
}
