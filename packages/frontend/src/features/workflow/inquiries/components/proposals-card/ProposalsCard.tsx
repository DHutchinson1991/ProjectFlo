'use client';

import React, { useState } from 'react';
import { Box, Typography, CardContent, Button, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Stepper, Step, StepLabel, Chip } from '@mui/material';
import { Description, OpenInNew, ContentCopy, Visibility, VisibilityOff, ChatBubbleOutline, AccessTime, Send, DeleteOutline, Handshake } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { proposalsApi, useInquiryProposals, useProposalShareLink } from '@/features/workflow/proposals';
import { calendarApi, type BackendCalendarEvent } from '@/features/workflow/calendar/api';
import { calendarQueryKeys } from '@/features/workflow/calendar/constants/query-keys';
import { useAuth } from '@/features/platform/auth';
import { useBrand } from '@/features/platform/brand';
import { StatusChip } from '@/shared/ui';
import { colors } from '@/shared/theme/tokens';
import { WorkflowCard } from '@/shared/ui/WorkflowCard';
import MeetingScheduler, { type MeetingFormData } from '../meeting-scheduler';
import SectionViewIcons from './SectionViewIcons';
import { timeAgo } from '@/shared/utils/dateTime';
import { getEffectiveStatus, getActiveStep, STEPS } from './types';
import type { WorkflowCardProps } from '../../lib';

const ProposalsCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const { copyShareUrl, openPreview } = useProposalShareLink();
    const { proposals, reload } = useInquiryProposals(inquiry?.id);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [sending, setSending] = useState(false);

    const { user } = useAuth();
    const { currentBrand } = useBrand();
    const queryClient = useQueryClient();

    const proposal = proposals[0] ?? null;
    const showReview = !!proposal?.client_response;

    /* ── Proposal Review Meetings ── */
    const meetingsQueryKey = calendarQueryKeys.proposalReviewMeetings(currentBrand?.id, inquiry.id);

    const { data: meetings = [], isPending: meetingsLoading } = useQuery<BackendCalendarEvent[]>({
        queryKey: meetingsQueryKey,
        queryFn: async () => {
            const events = await calendarApi.getEvents();
            return events.filter(e => e.inquiry_id === inquiry.id && e.event_type === 'PROPOSAL_REVIEW');
        },
        enabled: showReview && !!currentBrand?.id && !!inquiry?.id,
    });

    const invalidateMeetings = async () => {
        await queryClient.invalidateQueries({ queryKey: meetingsQueryKey });
    };

    const createMeetingMutation = useMutation({
        mutationFn: (meetingData: MeetingFormData) =>
            calendarApi.createEvent({ ...meetingData, event_type: 'PROPOSAL_REVIEW', inquiry_id: inquiry.id, crew_id: user?.id || 1 }),
        onSuccess: invalidateMeetings,
    });

    const updateMeetingMutation = useMutation({
        mutationFn: ({ meetingId, meetingData }: { meetingId: number; meetingData: Partial<MeetingFormData> }) =>
            calendarApi.updateEvent(meetingId, { ...meetingData, event_type: 'PROPOSAL_REVIEW' }),
        onSuccess: invalidateMeetings,
    });

    const deleteMeetingMutation = useMutation({
        mutationFn: (meetingId: number) => calendarApi.deleteEvent(meetingId),
        onSuccess: invalidateMeetings,
    });

    const meetingLoading = meetingsLoading || createMeetingMutation.isPending || updateMeetingMutation.isPending || deleteMeetingMutation.isPending;

    const handleScheduleMeeting = async (meetingData: MeetingFormData) => {
        await createMeetingMutation.mutateAsync(meetingData);
        if (onRefresh) onRefresh();
    };
    const handleUpdateMeeting = async (meetingId: number, meetingData: Partial<MeetingFormData>) => {
        await updateMeetingMutation.mutateAsync({ meetingId, meetingData });
        if (onRefresh) onRefresh();
    };
    const handleDeleteMeeting = async (meetingId: number) => {
        await deleteMeetingMutation.mutateAsync(meetingId);
        if (onRefresh) onRefresh();
    };

    const handleCreate = async () => {
        try {
            const newProposal = await proposalsApi.create(inquiry.id, {});
            await reload();
            if (onRefresh) onRefresh();
            // Navigate to proposal editor instead of preview
            if (newProposal?.id) {
                window.open(`/inquiries/${inquiry.id}/proposals/${newProposal.id}`, '_blank');
            }
        } catch (error) {
            console.error('Error creating proposal:', error);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await proposalsApi.delete(inquiry.id, deleteTarget.id);
            await reload();
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error deleting proposal:', error);
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const handleCopyLink = async () => {
        if (!proposal) return;
        try {
            await copyShareUrl(inquiry.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    };

    const handleSend = async () => {
        if (!proposal || proposal.status !== 'Draft') return;
        setSending(true);
        try {
            await proposalsApi.sendProposal(inquiry.id, proposal.id);
            await reload();
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error sending proposal:', error);
        } finally {
            setSending(false);
        }
    };

    const effectiveStatus = proposal ? getEffectiveStatus(proposal) : 'Draft';
    const activeStep = getActiveStep(effectiveStatus);

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                            <Description sx={{ fontSize: 18, color: '#8b5cf6' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>Proposal</Typography>
                    </Box>
                    {!proposal && (
                        <Button size="small" startIcon={<Description />} onClick={handleCreate} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}>
                            Generate Proposal
                        </Button>
                    )}
                </Box>

                {/* Empty state */}
                {!proposal ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Box sx={{ width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.12)' }}>
                            <Description sx={{ fontSize: 22, color: '#8b5cf6' }} />
                        </Box>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>No proposal yet</Typography>
                        <Typography sx={{ color: '#475569', fontSize: '0.72rem', mt: 0.5 }}>Auto-generated from your inquiry data</Typography>
                    </Box>
                ) : (
                    <Box>
                        {/* Title + version + status row */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {proposal.title}
                                </Typography>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', bgcolor: 'rgba(100, 116, 139, 0.1)', px: 0.8, py: 0.2, borderRadius: 1, flexShrink: 0 }}>
                                    v{proposal.version}
                                </Typography>
                            </Box>
                            <StatusChip status={effectiveStatus === 'ChangesRequested' ? 'Changes Requested' : effectiveStatus === 'Reconsideration' ? 'Under Review' : effectiveStatus} />
                        </Box>

                        {/* Progress stepper */}
                        <Stepper
                            activeStep={activeStep}
                            alternativeLabel
                            sx={{
                                mb: 2,
                                '& .MuiStepConnector-line': { borderColor: 'rgba(100, 116, 139, 0.2)', borderTopWidth: 2 },
                                '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': { borderColor: colors.accent },
                                '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': { borderColor: colors.success },
                                '& .MuiStepLabel-label': { fontSize: '0.65rem', color: '#475569', mt: 0.5 },
                                '& .MuiStepLabel-label.Mui-active': { color: colors.accent, fontWeight: 600 },
                                '& .MuiStepLabel-label.Mui-completed': { color: colors.success },
                                '& .MuiStepIcon-root': { fontSize: 18, color: 'rgba(100, 116, 139, 0.3)' },
                                '& .MuiStepIcon-root.Mui-active': { color: colors.accent },
                                '& .MuiStepIcon-root.Mui-completed': { color: colors.success },
                            }}
                        >
                            {STEPS.map((label) => (
                                <Step key={label} completed={activeStep > STEPS.indexOf(label)}>
                                    <StepLabel>{(effectiveStatus === 'ChangesRequested' || effectiveStatus === 'Reconsideration') && label === 'Accepted' ? (effectiveStatus === 'Reconsideration' ? 'Review' : 'Changes') : label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                        {/* Insights row */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2, px: 0.5 }}>
                            {proposal.sent_at && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Send sx={{ fontSize: 13, color: '#64748b' }} />
                                    <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                        Sent {timeAgo(proposal.sent_at)}
                                    </Typography>
                                </Box>
                            )}
                            {proposal.sent_at && proposal.viewed_at ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Visibility sx={{ fontSize: 13, color: colors.accent }} />
                                    <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                        Viewed {timeAgo(proposal.viewed_at)}{proposal.view_count > 1 ? ` (${proposal.view_count}×)` : ''}
                                    </Typography>
                                </Box>
                            ) : proposal.sent_at ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <VisibilityOff sx={{ fontSize: 13, color: '#475569' }} />
                                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>Not yet viewed</Typography>
                                </Box>
                            ) : null}
                            {proposal.client_response_at && proposal.sent_at && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AccessTime sx={{ fontSize: 13, color: '#64748b' }} />
                                    <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                        Responded in {timeAgo(proposal.client_response_at).replace(' ago', '')}
                                    </Typography>
                                </Box>
                            )}
                            {!proposal.sent_at && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AccessTime sx={{ fontSize: 13, color: '#475569' }} />
                                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                                        Last edited {timeAgo(proposal.updated_at)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Client response message */}
                        {proposal.client_response_message && (
                            <Box sx={{
                                mb: 2, py: 1, px: 1.5, borderRadius: 2,
                                bgcolor: proposal.client_response === 'ChangesRequested' ? 'rgba(245, 158, 11, 0.06)'
                                    : proposal.client_response === 'Reconsideration' ? 'rgba(139, 92, 246, 0.06)'
                                    : 'rgba(34, 197, 94, 0.06)',
                                border: `1px solid ${proposal.client_response === 'ChangesRequested' ? 'rgba(245, 158, 11, 0.15)'
                                    : proposal.client_response === 'Reconsideration' ? 'rgba(139, 92, 246, 0.15)'
                                    : 'rgba(34, 197, 94, 0.15)'}`,
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                    <ChatBubbleOutline sx={{
                                        fontSize: 12,
                                        color: proposal.client_response === 'ChangesRequested' ? colors.warning
                                            : proposal.client_response === 'Reconsideration' ? colors.accent
                                            : colors.success,
                                    }} />
                                    <Typography sx={{
                                        fontSize: '0.68rem', fontWeight: 600,
                                        color: proposal.client_response === 'ChangesRequested' ? colors.warning
                                            : proposal.client_response === 'Reconsideration' ? colors.accent
                                            : colors.success,
                                    }}>
                                        {proposal.client_response === 'Reconsideration' ? 'Submitted for Review' : 'Client Feedback'}
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    &ldquo;{proposal.client_response_message}&rdquo;
                                </Typography>
                            </Box>
                        )}

                        {/* Consolidated section notes summary (shown when client submitted for review) */}
                        {proposal.client_response === 'Reconsideration' && (proposal.section_notes?.length ?? 0) > 0 && (
                            <Box sx={{ mb: 2, py: 1, px: 1.5, borderRadius: 2, bgcolor: 'rgba(139, 92, 246, 0.04)', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: colors.accent, mb: 0.75 }}>
                                    Section Notes ({proposal.section_notes!.length})
                                </Typography>
                                {proposal.section_notes!.map((sn) => (
                                    <Box key={sn.section_type} sx={{ py: 0.5, '&:not(:last-child)': { borderBottom: '1px solid rgba(100, 116, 139, 0.08)' } }}>
                                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            {sn.section_type.replace(/-/g, ' ')}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                                            &ldquo;{sn.note}&rdquo;
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* Section view tracking */}
                        {proposal.sent_at && (
                            <SectionViewIcons
                                sectionViews={proposal.section_views ?? []}
                                sectionNotes={proposal.section_notes ?? []}
                            />
                        )}

                        {/* Action buttons */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: '1px solid rgba(100, 116, 139, 0.1)' }}>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="Delete proposal">
                                    <IconButton
                                        size="small"
                                        onClick={() => setDeleteTarget({ id: proposal.id, title: proposal.title })}
                                        sx={{ color: '#64748b', '&:hover': { color: colors.error, bgcolor: 'rgba(239, 68, 68, 0.08)' } }}
                                    >
                                        <DeleteOutline sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Tooltip title="Preview proposal">
                                    <IconButton
                                        size="small"
                                        onClick={async () => {
                                            try { await openPreview(inquiry.id); } catch { /* ignore */ }
                                        }}
                                        sx={{ color: '#94a3b8', '&:hover': { color: '#e2e8f0', bgcolor: 'rgba(139, 92, 246, 0.08)' } }}
                                    >
                                        <OpenInNew sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={copied ? 'Copied!' : 'Copy share link'}>
                                    <IconButton
                                        size="small"
                                        onClick={handleCopyLink}
                                        sx={{ color: copied ? colors.success : '#94a3b8', '&:hover': { color: '#e2e8f0', bgcolor: 'rgba(139, 92, 246, 0.08)' } }}
                                    >
                                        <ContentCopy sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                                {proposal.status === 'Draft' && (
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<Send sx={{ fontSize: 14 }} />}
                                        onClick={handleSend}
                                        disabled={sending}
                                        sx={{
                                            borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem',
                                            bgcolor: colors.accent, '&:hover': { bgcolor: '#7c3aed' },
                                            boxShadow: 'none',
                                        }}
                                    >
                                        {sending ? 'Sending...' : 'Send Proposal'}
                                    </Button>
                                )}
                            </Box>
                        </Box>

                        {/* ── Proposal Review Section ── */}
                        {showReview && (
                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(100, 116, 139, 0.1)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <Handshake sx={{ fontSize: 16, color: '#ec4899' }} />
                                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9' }}>
                                        Proposal Review
                                    </Typography>
                                    {meetings.length > 0 && (
                                        <Chip
                                            label={`${meetings.length} booked`}
                                            size="small"
                                            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}
                                        />
                                    )}
                                </Box>
                                <MeetingScheduler
                                    meetings={meetings}
                                    onScheduleMeeting={handleScheduleMeeting}
                                    onUpdateMeeting={handleUpdateMeeting}
                                    onDeleteMeeting={handleDeleteMeeting}
                                    isLoading={meetingLoading}
                                    eventType="proposal_review"
                                    defaultDurationMinutes={60}
                                    accentColor="#ec4899"
                                    scheduleLabel="Book Proposal Review"
                                    emptyMessage="No proposal reviews scheduled yet"
                                />
                            </Box>
                        )}
                    </Box>
                )}
            </CardContent>

            <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)}>
                <DialogTitle>Delete Proposal</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </WorkflowCard>
    );
};

export { ProposalsCard };
