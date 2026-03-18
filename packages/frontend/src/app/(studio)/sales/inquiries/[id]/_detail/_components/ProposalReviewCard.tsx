'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, CardContent, Chip } from '@mui/material';
import { Handshake } from '@mui/icons-material';
import { getCalendarApi, BackendCalendarEvent } from '../../../../../calendar/services/calendarApi';
import { useAuth } from '@/app/providers/AuthProvider';
import MeetingScheduler, { MeetingFormData } from '../../components/MeetingScheduler';
import type { WorkflowCardProps } from '../_lib';
import { WorkflowCard } from './WorkflowCard';

const ProposalReviewCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState<BackendCalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchConsultations = async () => {
            try {
                setIsLoading(true);
                const api = getCalendarApi();
                const events = await api.getEvents();
                const consultationMeetings = events.filter(event =>
                    event.inquiry_id === inquiry.id &&
                    event.event_type === 'PROPOSAL_REVIEW'
                );
                setMeetings(consultationMeetings);
            } catch (error) {
                console.error('Error fetching consultations:', error);
                setMeetings([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (inquiry?.id) {
            fetchConsultations();
        }
    }, [inquiry?.id]);

    const handleScheduleMeeting = async (meetingData: MeetingFormData) => {
        try {
            setIsLoading(true);
            const calApi = getCalendarApi();
            await calApi.createEvent({
                ...meetingData,
                event_type: 'PROPOSAL_REVIEW',
                inquiry_id: inquiry.id,
                contributor_id: user?.id || 1
            });

            const events = await calApi.getEvents();
            const consultationMeetings = events.filter(event =>
                event.inquiry_id === inquiry.id &&
                event.event_type === 'PROPOSAL_REVIEW'
            );
            setMeetings(consultationMeetings);

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error scheduling proposal review:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateMeeting = async (meetingId: number, meetingData: Partial<MeetingFormData>) => {
        try {
            setIsLoading(true);
            const calApi = getCalendarApi();
            await calApi.updateEvent(meetingId, {
                ...meetingData,
                event_type: 'PROPOSAL_REVIEW'
            });

            const events = await calApi.getEvents();
            const consultationMeetings = events.filter(event =>
                event.inquiry_id === inquiry.id &&
                event.event_type === 'PROPOSAL_REVIEW'
            );
            setMeetings(consultationMeetings);

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error updating proposal review:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteMeeting = async (meetingId: number) => {
        try {
            setIsLoading(true);
            const calApi = getCalendarApi();
            await calApi.deleteEvent(meetingId);

            const events = await calApi.getEvents();
            const consultationMeetings = events.filter(event =>
                event.inquiry_id === inquiry.id &&
                event.event_type === 'PROPOSAL_REVIEW'
            );
            setMeetings(consultationMeetings);

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error deleting proposal review:', error);
            throw error;
        } finally {
            setIsLoading(false);
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
