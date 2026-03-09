'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, CardContent, Chip, Stack } from '@mui/material';
import { Phone, EventAvailable, Schedule, Videocam, PhoneInTalk, PersonPin } from '@mui/icons-material';
import { getCalendarApi, BackendCalendarEvent } from '../../../../../calendar/services/calendarApi';
import { useAuth } from '@/app/providers/AuthProvider';
import MeetingScheduler, { MeetingFormData } from '../../components/MeetingScheduler';
import type { WorkflowCardProps } from '../_lib';
import { WorkflowCard } from './WorkflowCard';

const CallsCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor, submission }) => {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState<BackendCalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                setIsLoading(true);
                const api = getCalendarApi();
                const events = await api.getEvents();
                const inquiryMeetings = events.filter(event =>
                    event.inquiry_id === inquiry.id &&
                    event.event_type === 'DISCOVERY_CALL'
                );
                setMeetings(inquiryMeetings);
            } catch (error) {
                console.error('Error fetching meetings:', error);
                setMeetings([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (inquiry?.id) {
            fetchMeetings();
        }
    }, [inquiry?.id]);

    const handleScheduleMeeting = async (meetingData: MeetingFormData) => {
        try {
            setIsLoading(true);
            const calApi = getCalendarApi();
            await calApi.createEvent({
                ...meetingData,
                event_type: 'DISCOVERY_CALL',
                inquiry_id: inquiry.id,
                contributor_id: user?.id || 1
            });

            const events = await calApi.getEvents();
            const inquiryMeetings = events.filter(event =>
                event.inquiry_id === inquiry.id &&
                event.event_type === 'DISCOVERY_CALL'
            );
            setMeetings(inquiryMeetings);

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error scheduling meeting:', error);
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
                ...(meetingData.event_type && { event_type: meetingData.event_type.toUpperCase() as BackendCalendarEvent['event_type'] })
            });

            const events = await calApi.getEvents();
            const inquiryMeetings = events.filter(event =>
                event.inquiry_id === inquiry.id &&
                event.event_type === 'DISCOVERY_CALL'
            );
            setMeetings(inquiryMeetings);

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error updating meeting:', error);
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
            const inquiryMeetings = events.filter(event =>
                event.inquiry_id === inquiry.id &&
                event.event_type === 'DISCOVERY_CALL'
            );
            setMeetings(inquiryMeetings);

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error deleting meeting:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const submissionResponses = (submission?.responses ?? {}) as Record<string, any>;
    const reqMethod = submissionResponses.discovery_call_method;
    const reqDate = submissionResponses.discovery_call_date;
    const reqTime = submissionResponses.discovery_call_time;
    const hasCallPref = reqMethod || reqDate || reqTime;

    const getMethodIcon = (method: string) => {
        const lower = (method || '').toLowerCase();
        if (lower.includes('video') || lower.includes('zoom') || lower.includes('teams')) return <Videocam sx={{ fontSize: 14 }} />;
        if (lower.includes('phone') || lower.includes('call')) return <PhoneInTalk sx={{ fontSize: 14 }} />;
        if (lower.includes('person') || lower.includes('meet')) return <PersonPin sx={{ fontSize: 14 }} />;
        return <Phone sx={{ fontSize: 14 }} />;
    };

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent sx={{ p: '0 !important' }}>
                {/* ── Header ── */}
                <Box sx={{
                    px: 2.5, pt: 2, pb: 1.5,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid rgba(52, 58, 68, 0.3)',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06), transparent)',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 34, height: 34, borderRadius: 2,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.08))',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            boxShadow: '0 0 12px rgba(245, 158, 11, 0.08)',
                        }}>
                            <Phone sx={{ fontSize: 17, color: '#f59e0b' }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                                Discovery Call
                            </Typography>
                            <Typography sx={{ fontSize: '0.6rem', color: '#64748b', letterSpacing: '0.03em' }}>
                                Initial client outreach
                            </Typography>
                        </Box>
                    </Box>
                    {meetings.length > 0 && (
                        <Chip
                            icon={<Schedule sx={{ fontSize: 12 }} />}
                            label={`${meetings.length} scheduled`}
                            size="small"
                            sx={{
                                height: 24, fontSize: '0.65rem', fontWeight: 700,
                                bgcolor: 'rgba(245, 158, 11, 0.08)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.15)',
                                '& .MuiChip-icon': { color: '#f59e0b' },
                            }}
                        />
                    )}
                </Box>

                <Box sx={{ px: 2.5, py: 2 }}>
                    {/* ── Client Call Preferences ── */}
                    {hasCallPref && (
                        <Box sx={{
                            mb: 2, p: 1.5, borderRadius: 2.5,
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.04), rgba(251, 191, 36, 0.02))',
                            border: '1px solid rgba(245, 158, 11, 0.1)',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25 }}>
                                <EventAvailable sx={{ fontSize: 13, color: '#fbbf24' }} />
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Client Preferred
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {reqMethod && (
                                    <Chip
                                        icon={getMethodIcon(reqMethod)}
                                        label={reqMethod}
                                        size="small"
                                        sx={{
                                            height: 26, fontSize: '0.72rem', fontWeight: 600,
                                            bgcolor: 'rgba(245, 158, 11, 0.06)',
                                            color: '#fcd34d',
                                            border: '1px solid rgba(245, 158, 11, 0.12)',
                                            '& .MuiChip-icon': { color: '#fbbf24' },
                                        }}
                                    />
                                )}
                                {reqDate && (
                                    <Chip
                                        icon={<Schedule sx={{ fontSize: 12 }} />}
                                        label={new Date(reqDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        size="small"
                                        sx={{
                                            height: 26, fontSize: '0.72rem', fontWeight: 600,
                                            bgcolor: 'rgba(245, 158, 11, 0.06)',
                                            color: '#fcd34d',
                                            border: '1px solid rgba(245, 158, 11, 0.12)',
                                            '& .MuiChip-icon': { color: '#fbbf24' },
                                        }}
                                    />
                                )}
                                {reqTime && (
                                    <Chip
                                        label={reqTime}
                                        size="small"
                                        sx={{
                                            height: 26, fontSize: '0.72rem', fontWeight: 600,
                                            bgcolor: 'rgba(245, 158, 11, 0.06)',
                                            color: '#fcd34d',
                                            border: '1px solid rgba(245, 158, 11, 0.12)',
                                        }}
                                    />
                                )}
                            </Stack>
                        </Box>
                    )}

                    {/* ── Scheduler ── */}
                    <MeetingScheduler
                        meetings={meetings}
                        onScheduleMeeting={handleScheduleMeeting}
                        onUpdateMeeting={handleUpdateMeeting}
                        onDeleteMeeting={handleDeleteMeeting}
                        isLoading={isLoading}
                        eventType="discovery_call"
                        defaultDurationMinutes={15}
                        accentColor="#f59e0b"
                        scheduleLabel="Schedule Call"
                        emptyMessage="No discovery calls scheduled yet"
                    />
                </Box>
            </CardContent>
        </WorkflowCard>
    );
};

export { CallsCard };
