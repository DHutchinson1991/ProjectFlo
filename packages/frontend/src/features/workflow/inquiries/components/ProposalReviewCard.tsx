'use client';

import React from 'react';
import { Box, Typography, CardContent, Chip } from '@mui/material';
import { Handshake } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { calendarApi, type BackendCalendarEvent } from '@/features/workflow/calendar/api';
import { calendarQueryKeys } from '@/features/workflow/calendar/constants/query-keys';
import { useAuth } from '@/features/platform/auth';
import { useBrand } from '@/features/platform/brand';
import MeetingScheduler, { MeetingFormData } from './MeetingScheduler';
import type { WorkflowCardProps } from '../lib';
import { WorkflowCard } from './WorkflowCard';

const ProposalReviewCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const { user } = useAuth();
    const { currentBrand } = useBrand();
    const queryClient = useQueryClient();

    const meetingsQueryKey = calendarQueryKeys.proposalReviewMeetings(currentBrand?.id, inquiry.id);

    const {
        data: meetings = [],
        isPending: meetingsLoading,
    } = useQuery<BackendCalendarEvent[]>({
        queryKey: meetingsQueryKey,
        queryFn: async () => {
            const events = await calendarApi.getEvents();
            return events.filter(
                event => event.inquiry_id === inquiry.id && event.event_type === 'PROPOSAL_REVIEW',
            );
        },
        enabled: !!currentBrand?.id && !!inquiry?.id,
    });

    const invalidateMeetings = async () => {
        await queryClient.invalidateQueries({ queryKey: meetingsQueryKey });
    };

    const createMeetingMutation = useMutation({
        mutationFn: (meetingData: MeetingFormData) =>
            calendarApi.createEvent({
                ...meetingData,
                event_type: 'PROPOSAL_REVIEW',
                inquiry_id: inquiry.id,
                crew_member_id: user?.id || 1,
            }),
        onSuccess: invalidateMeetings,
    });

    const updateMeetingMutation = useMutation({
        mutationFn: ({
            meetingId,
            meetingData,
        }: {
            meetingId: number;
            meetingData: Partial<MeetingFormData>;
        }) =>
            calendarApi.updateEvent(meetingId, {
                ...meetingData,
                event_type: 'PROPOSAL_REVIEW',
            }),
        onSuccess: invalidateMeetings,
    });

    const deleteMeetingMutation = useMutation({
        mutationFn: (meetingId: number) => calendarApi.deleteEvent(meetingId),
        onSuccess: invalidateMeetings,
    });

    const isLoading =
        meetingsLoading || createMeetingMutation.isPending || updateMeetingMutation.isPending || deleteMeetingMutation.isPending;

    const handleScheduleMeeting = async (meetingData: MeetingFormData) => {
        try {
            await createMeetingMutation.mutateAsync(meetingData);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error scheduling proposal review:', error);
            throw error;
        }
    };

    const handleUpdateMeeting = async (meetingId: number, meetingData: Partial<MeetingFormData>) => {
        try {
            await updateMeetingMutation.mutateAsync({
                meetingId,
                meetingData,
            });

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error updating proposal review:', error);
            throw error;
        }
    };

    const handleDeleteMeeting = async (meetingId: number) => {
        try {
            await deleteMeetingMutation.mutateAsync(meetingId);

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error deleting proposal review:', error);
            throw error;
        }
    };

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent>
                {/* ── Header ── */}
                <Box sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    mb: 2,
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 32, height: 32, borderRadius: 2,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: 'rgba(236, 72, 153, 0.1)',
                            border: '1px solid rgba(236, 72, 153, 0.15)',
                        }}>
                            <Handshake sx={{ fontSize: 18, color: '#ec4899' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                            Proposal Review
                        </Typography>
                        {meetings.length > 0 && (
                            <Chip
                                label={`${meetings.length} booked`}
                                size="small"
                                sx={{
                                    height: 20, fontSize: '0.65rem', fontWeight: 700,
                                    bgcolor: 'rgba(236, 72, 153, 0.1)',
                                    color: '#ec4899',
                                }}
                            />
                        )}
                    </Box>
                </Box>

                {/* ── Scheduler ── */}
                <MeetingScheduler
                    meetings={meetings}
                    onScheduleMeeting={handleScheduleMeeting}
                    onUpdateMeeting={handleUpdateMeeting}
                    onDeleteMeeting={handleDeleteMeeting}
                    isLoading={isLoading}
                    eventType="proposal_review"
                    defaultDurationMinutes={60}
                    accentColor="#ec4899"
                    scheduleLabel="Book Proposal Review"
                    emptyMessage="No proposal reviews scheduled yet"
                />
            </CardContent>
        </WorkflowCard>
    );
};

export { ProposalReviewCard };
