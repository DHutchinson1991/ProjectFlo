'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, CardContent, Chip } from '@mui/material';
import { Handshake, Schedule } from '@mui/icons-material';
import { getCalendarApi, BackendCalendarEvent } from '../../../../../calendar/services/calendarApi';
import { useAuth } from '@/app/providers/AuthProvider';
import MeetingScheduler, { MeetingFormData } from '../../components/MeetingScheduler';
import type { WorkflowCardProps } from '../_lib';
import { WorkflowCard } from './WorkflowCard';

const ConsultationCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
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
                    event.event_type === 'CONSULTATION'
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
                event_type: 'CONSULTATION',
                inquiry_id: inquiry.id,
                contributor_id: user?.id || 1
            });

            const events = await calApi.getEvents();
            const consultationMeetings = events.filter(event =>
                event.inquiry_id === inquiry.id &&
                event.event_type === 'CONSULTATION'
            );
            setMeetings(consultationMeetings);

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error scheduling consultation:', error);
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
                event_type: 'CONSULTATION'
            });

            const events = await calApi.getEvents();
            const consultationMeetings = events.filter(event =>
                event.inquiry_id === inquiry.id &&
                event.event_type === 'CONSULTATION'
            );
            setMeetings(consultationMeetings);

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error updating consultation:', error);
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
                event.event_type === 'CONSULTATION'
            );
            setMeetings(consultationMeetings);

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error deleting consultation:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent sx={{ p: '0 !important' }}>
                {/* ── Header ── */}
                <Box sx={{
                    px: 2.5, pt: 2, pb: 1.5,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid rgba(52, 58, 68, 0.3)',
                    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.06), transparent)',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 34, height: 34, borderRadius: 2,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(244, 114, 182, 0.08))',
                            border: '1px solid rgba(236, 72, 153, 0.2)',
                            boxShadow: '0 0 12px rgba(236, 72, 153, 0.08)',
                        }}>
                            <Handshake sx={{ fontSize: 17, color: '#ec4899' }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                                Consultation
                            </Typography>
                            <Typography sx={{ fontSize: '0.6rem', color: '#64748b', letterSpacing: '0.03em' }}>
                                In-depth project review
                            </Typography>
                        </Box>
                    </Box>
                    {meetings.length > 0 && (
                        <Chip
                            icon={<Schedule sx={{ fontSize: 12 }} />}
                            label={`${meetings.length} booked`}
                            size="small"
                            sx={{
                                height: 24, fontSize: '0.65rem', fontWeight: 700,
                                bgcolor: 'rgba(236, 72, 153, 0.08)',
                                color: '#ec4899',
                                border: '1px solid rgba(236, 72, 153, 0.15)',
                                '& .MuiChip-icon': { color: '#ec4899' },
                            }}
                        />
                    )}
                </Box>

                <Box sx={{ px: 2.5, py: 2 }}>
                    {/* ── Scheduler ── */}
                    <MeetingScheduler
                        meetings={meetings}
                        onScheduleMeeting={handleScheduleMeeting}
                        onUpdateMeeting={handleUpdateMeeting}
                        onDeleteMeeting={handleDeleteMeeting}
                        isLoading={isLoading}
                        eventType="consultation"
                        defaultDurationMinutes={60}
                        accentColor="#ec4899"
                        scheduleLabel="Book Consultation"
                        emptyMessage="No consultations booked yet"
                    />
                </Box>
            </CardContent>
        </WorkflowCard>
    );
};

export { ConsultationCard };
