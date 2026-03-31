import React, { useState } from 'react';
import { Box, Typography, CardContent, Button, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Stepper, Step, StepLabel, Chip } from '@mui/material';
import { Description, OpenInNew, ContentCopy, Visibility, VisibilityOff, ChatBubbleOutline, AccessTime, Send, DeleteOutline, CheckCircle, RadioButtonUnchecked, EventNote, AttachMoney, MovieFilter, Schedule, People, CameraAlt, TextFields, CardGiftcard, Gavel, Handshake } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { proposalsApi, useInquiryProposals, useProposalShareLink } from '@/features/workflow/proposals';
import { calendarApi, type BackendCalendarEvent } from '@/features/workflow/calendar/api';
import { calendarQueryKeys } from '@/features/workflow/calendar/constants/query-keys';
import { useAuth } from '@/features/platform/auth';
import { useBrand } from '@/features/platform/brand';
import { StatusChip } from '@/shared/ui';
import { colors } from '@/shared/theme/tokens';
import type { Proposal, ProposalSectionView, ProposalContractSummary, ProposalSectionNote } from '@/features/workflow/proposals';
import type { WorkflowCardProps } from '../lib';
import { WorkflowCard } from './WorkflowCard';
import MeetingScheduler, { MeetingFormData } from './MeetingScheduler';

/** Format a relative time label like "3 days ago" or "2 hours ago" */
function timeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Determine the effective display status based on proposal state */
function getEffectiveStatus(proposal: Proposal): string {
    if (proposal.client_response === 'Accepted') return 'Accepted';
    if (proposal.client_response === 'ChangesRequested') return 'ChangesRequested';
    if (proposal.viewed_at && proposal.status === 'Sent') return 'Viewed';
    return proposal.status; // Draft | Sent
}

/** Map status to stepper index */
const STEPS = ['Draft', 'Sent', 'Viewed', 'Accepted'];
function getActiveStep(status: string): number {
    const map: Record<string, number> = { Draft: 0, Sent: 1, Viewed: 2, Accepted: 3, ChangesRequested: 2 };
    return map[status] ?? 0;
}

/* Section tracking configuration */
const TRACKED_SECTIONS: { type: string; label: string; icon: React.ElementType }[] = [
    { type: 'text', label: 'Message', icon: TextFields },
    { type: 'event-details', label: 'Event', icon: EventNote },
    { type: 'pricing', label: 'Pricing', icon: AttachMoney },
    { type: 'package-details', label: 'Package', icon: CardGiftcard },
    { type: 'films', label: 'Films', icon: MovieFilter },
    { type: 'schedule', label: 'Schedule', icon: Schedule },
    { type: 'subjects', label: 'Subjects', icon: CameraAlt },
    { type: 'team', label: 'Team', icon: People },
];

function formatSectionDuration(totalSeconds: number): string {
    if (!totalSeconds || totalSeconds <= 0) return '0s';
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes < 60) return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return remMinutes ? `${hours}h ${remMinutes}m` : `${hours}h`;
}

function getDurationVisual(totalSeconds: number): { text: string; bg: string; border: string } {
    if (totalSeconds >= 120) {
        return { text: colors.success, bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.28)' };
    }
    if (totalSeconds >= 45) {
        return { text: colors.warning, bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.28)' };
    }
    return { text: '#64748b', bg: 'rgba(100, 116, 139, 0.08)', border: 'rgba(100, 116, 139, 0.16)' };
}

function SectionViewIcons({ sectionViews, sectionNotes }: { sectionViews: ProposalSectionView[]; sectionNotes: ProposalSectionNote[] }) {
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const viewedTypes = new Set(sectionViews.map((sv) => sv.section_type));
    const durationByType = new Map(sectionViews.map((sv) => [sv.section_type, sv.duration_seconds ?? 0]));
    const noteByType = new Map(sectionNotes.map((sn) => [sn.section_type, sn.note]));
    const viewedCount = TRACKED_SECTIONS.filter((s) => viewedTypes.has(s.type)).length;

    const activeNote = selectedSection ? noteByType.get(selectedSection) ?? null : null;
    const activeSection = selectedSection ? TRACKED_SECTIONS.find((s) => s.type === selectedSection) : null;

    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b' }}>
                    Client Engagement
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: viewedCount > 0 ? colors.accent : '#475569' }}>
                    {viewedCount}/{TRACKED_SECTIONS.length} viewed
                </Typography>
            </Box>
            {/* Progress bar */}
            <Box sx={{ height: 2, borderRadius: 1, bgcolor: 'rgba(100, 116, 139, 0.1)', mb: 1.5, overflow: 'hidden' }}>
                <Box sx={{
                    height: '100%', borderRadius: 1,
                    width: `${(viewedCount / TRACKED_SECTIONS.length) * 100}%`,
                    bgcolor: colors.accent,
                    transition: 'width 0.4s ease',
                }} />
            </Box>
            {/* Full-width icon row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                {TRACKED_SECTIONS.map(({ type, label, icon: Icon }) => {
                    const viewed = viewedTypes.has(type);
                    const totalSeconds = durationByType.get(type) ?? 0;
                    const durationLabel = formatSectionDuration(totalSeconds);
                    const durationVisual = getDurationVisual(totalSeconds);
                    const hasNote = noteByType.has(type);
                    const isSelected = selectedSection === type;
                    return (
                            <Box
                                key={type}
                                onClick={() => setSelectedSection((prev) => (prev === type ? null : type))}
                                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3, flex: 1, cursor: 'pointer' }}
                            >
                                <Box sx={{
                                    width: 30, height: 30, borderRadius: 1.5,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    bgcolor: isSelected
                                        ? 'rgba(139, 92, 246, 0.22)'
                                        : viewed ? 'rgba(139, 92, 246, 0.12)' : 'rgba(100, 116, 139, 0.05)',
                                    border: `1px solid ${isSelected ? colors.accent : viewed ? 'rgba(139, 92, 246, 0.3)' : 'rgba(100, 116, 139, 0.08)'}`,
                                    transition: 'all 0.2s ease',
                                    '&:hover': { bgcolor: viewed ? 'rgba(139, 92, 246, 0.2)' : 'rgba(100, 116, 139, 0.1)' },
                                    ...(hasNote && { boxShadow: '0 0 0 1.5px rgba(139,92,246,0.35)' }),
                                }}>
                                    <Icon sx={{ fontSize: 15, color: isSelected ? colors.accent : viewed ? colors.accent : '#334155', transition: 'color 0.2s ease' }} />
                                </Box>
                                <Typography sx={{ fontSize: '0.55rem', color: viewed ? '#94a3b8' : '#334155', fontWeight: viewed ? 600 : 400, transition: 'all 0.25s ease' }}>
                                    {label}
                                </Typography>
                                <Typography sx={{
                                    fontSize: '0.55rem',
                                    color: viewed ? durationVisual.text : 'rgba(100,116,139,0.45)',
                                    fontWeight: viewed ? 700 : 500,
                                    letterSpacing: '0.02em',
                                    px: 0.45,
                                    py: 0.1,
                                    borderRadius: 1,
                                    bgcolor: viewed ? durationVisual.bg : 'transparent',
                                    border: viewed ? `1px solid ${durationVisual.border}` : '1px solid transparent',
                                }}>
                                    {durationLabel}
                                </Typography>
                            </Box>
                    );
                })}
            </Box>
            {/* Inline note panel — shown when a section with a note is selected */}
            {selectedSection && (
                <Box sx={{
                    mt: 1.5, p: 1.5, borderRadius: 2,
                    bgcolor: activeNote ? 'rgba(139, 92, 246, 0.06)' : 'rgba(100, 116, 139, 0.04)',
                    border: `1px solid ${activeNote ? 'rgba(139, 92, 246, 0.18)' : 'rgba(100, 116, 139, 0.1)'}`,
                    transition: 'all 0.2s ease',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: activeNote ? 0.75 : 0 }}>
                        {activeSection && <activeSection.icon sx={{ fontSize: 13, color: activeNote ? colors.accent : '#64748b' }} />}
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: activeNote ? '#94a3b8' : '#64748b' }}>
                            {activeSection?.label ?? selectedSection}
                        </Typography>
                    </Box>
                    {activeNote ? (
                        <Typography sx={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                            &ldquo;{activeNote}&rdquo;
                        </Typography>
                    ) : (
                        <Typography sx={{ fontSize: '0.7rem', color: '#475569', fontStyle: 'italic' }}>
                            No note for this section
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    );
}

function ContractJourney({ contract }: { contract: ProposalContractSummary }) {
    const signer = contract.signers[0];
    const contractViewed = !!signer?.viewed_at;
    const contractSigned = !!signer?.signed_at;

    let statusText: string;
    let statusColor: string;
    if (contractSigned) {
        statusText = `Signed ${signer?.signed_at ? timeAgo(signer.signed_at) : ''}`;
        statusColor = colors.success;
    } else if (contractViewed) {
        statusText = `Viewed ${signer?.viewed_at ? timeAgo(signer.viewed_at) : ''} · Not yet signed`;
        statusColor = colors.accent;
    } else if (contract.status === 'Sent') {
        statusText = 'Sent · Not yet viewed';
        statusColor = '#94a3b8';
    } else {
        statusText = contract.status === 'Draft' ? 'Draft' : contract.status;
        statusColor = '#64748b';
    }

    return (
        <Box sx={{ mb: 2, py: 1, px: 1.5, borderRadius: 2, bgcolor: 'rgba(100, 116, 139, 0.04)', border: '1px solid rgba(100, 116, 139, 0.1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Gavel sx={{ fontSize: 13, color: statusColor }} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8' }}>
                    Contract
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: statusColor, ml: 0.5 }}>
                    {statusText}
                </Typography>
            </Box>
            {/* Mini step dots for contract journey */}
            <Box sx={{ display: 'flex', gap: 0.8, mt: 0.8, alignItems: 'center' }}>
                {(['Draft', 'Sent', 'Viewed', 'Signed'] as const).map((step, i) => {
                    const reached = (
                        (step === 'Draft') ||
                        (step === 'Sent' && ['Sent', 'Completed'].includes(contract.status)) ||
                        (step === 'Viewed' && contractViewed) ||
                        (step === 'Signed' && contractSigned)
                    );
                    return (
                        <React.Fragment key={step}>
                            {i > 0 && <Box sx={{ width: 12, height: 1.5, bgcolor: reached ? colors.success : 'rgba(100, 116, 139, 0.15)', borderRadius: 1 }} />}
                            <Tooltip title={step} arrow>
                                <Box sx={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    bgcolor: reached ? colors.success : 'rgba(100, 116, 139, 0.2)',
                                    transition: 'all 0.2s',
                                }} />
                            </Tooltip>
                        </React.Fragment>
                    );
                })}
            </Box>
        </Box>
    );
}

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
            if (newProposal?.share_token) {
                window.open(`/proposals/${newProposal.share_token}?preview=true`, '_blank');
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
            await copyShareUrl(inquiry.id, proposal);
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
                            <StatusChip status={effectiveStatus === 'ChangesRequested' ? 'Changes Requested' : effectiveStatus} />
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
                                    <StepLabel>{effectiveStatus === 'ChangesRequested' && label === 'Accepted' ? 'Changes' : label}</StepLabel>
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
                            <Box sx={{ mb: 2, py: 1, px: 1.5, borderRadius: 2, bgcolor: proposal.client_response === 'ChangesRequested' ? 'rgba(245, 158, 11, 0.06)' : 'rgba(34, 197, 94, 0.06)', border: `1px solid ${proposal.client_response === 'ChangesRequested' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)'}` }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                    <ChatBubbleOutline sx={{ fontSize: 12, color: proposal.client_response === 'ChangesRequested' ? colors.warning : colors.success }} />
                                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: proposal.client_response === 'ChangesRequested' ? colors.warning : colors.success }}>
                                        Client Feedback
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    &ldquo;{proposal.client_response_message}&rdquo;
                                </Typography>
                            </Box>
                        )}

                        {/* Section view tracking icons — click a section to see its note */}
                        {proposal.sent_at && (
                            <SectionViewIcons
                                sectionViews={proposal.section_views ?? []}
                                sectionNotes={proposal.section_notes ?? []}
                            />
                        )}

                        {/* Contract journey */}
                        {proposal.contract && (
                            <ContractJourney contract={proposal.contract} />
                        )}

                        {/* Action buttons */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: '1px solid rgba(100, 116, 139, 0.1)' }}>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="Preview proposal">
                                    <IconButton
                                        size="small"
                                        onClick={async () => {
                                            try { await openPreview(inquiry.id, proposal); } catch { /* ignore */ }
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
                            <Box sx={{ display: 'flex', gap: 1 }}>
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
                                <Button
                                    size="small"
                                    variant="text"
                                    startIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                                    onClick={async () => {
                                        try { await openPreview(inquiry.id, proposal); } catch { /* ignore */ }
                                    }}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', color: '#8b5cf6' }}
                                >
                                    Edit Proposal
                                </Button>
                            </Box>
                        </Box>

                        {/* ── Proposal Review Section (shown after client responds) ── */}
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
