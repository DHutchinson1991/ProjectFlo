'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, CardContent, Chip, Stack, Button,
    CircularProgress,
} from '@mui/material';
import { keyframes } from '@mui/material/styles';
import {
    Phone, Videocam, PhoneInTalk, PersonPin,
    CheckCircle, CheckCircleOutline, EventAvailable, EditCalendar,
    Delete as DeleteIcon, AccessTime, CalendarToday,
    LinkRounded, LocationOn, TimerOutlined,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { calendarApi, type BackendCalendarEvent } from '@/features/workflow/calendar/api';
import { calendarQueryKeys } from '@/features/workflow/calendar/constants/query-keys';
import { useAuth } from '@/features/platform/auth';
import { useBrand } from '@/features/platform/brand';
import { useMeetingSettings } from '@/features/platform/settings/hooks';
import type { WorkflowCardProps } from '../lib';
import { WorkflowCard } from './WorkflowCard';

/* -- Animations -- */
const chipBounce = keyframes`
    0%   { transform: scale(1); }
    40%  { transform: scale(1.07); }
    100% { transform: scale(1); }
`;

/* -- Helpers -- */
function formatSlotLabel(time: string): string {
    if (!time || !time.includes(':')) return time;
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}

type SlotInfo = { time: string; available: boolean; operator_id?: number };

const mapMethodToMeetingType = (method?: string): 'VIDEO_CALL' | 'PHONE_CALL' | 'IN_PERSON' | undefined => {
    if (!method) return undefined;
    const lower = method.toLowerCase();
    if (lower.includes('video')) return 'VIDEO_CALL';
    if (lower.includes('phone')) return 'PHONE_CALL';
    if (lower.includes('person')) return 'IN_PERSON';
    return undefined;
};

const getMethodIcon = (method: string) => {
    const lower = (method || '').toLowerCase();
    if (lower.includes('video') || lower.includes('zoom') || lower.includes('teams')) return <Videocam sx={{ fontSize: 14 }} />;
    if (lower.includes('phone') || lower.includes('call')) return <PhoneInTalk sx={{ fontSize: 14 }} />;
    if (lower.includes('person') || lower.includes('meet')) return <PersonPin sx={{ fontSize: 14 }} />;
    return <Phone sx={{ fontSize: 14 }} />;
};

/* =========================================================== */
/*  SlotPicker -- inline reschedule slot picker (wizard-like)  */
/* =========================================================== */
interface SlotPickerProps {
    brandId: number;
    initialDate?: string;
    duration: number;
    accentColor?: string;
    onSelect: (date: string, time: string, operatorId?: number) => void;
    onCancel: () => void;
    isLoading?: boolean;
    confirmLabel?: string;
    showCancel?: boolean;
}

const SlotPicker: React.FC<SlotPickerProps> = ({
    brandId, initialDate, duration, accentColor = '#f59e0b',
    onSelect, onCancel, isLoading: parentLoading,
    confirmLabel = 'Confirm New Time', showCancel = true,
}) => {
    const [selectedDate, setSelectedDate] = useState(initialDate || '');
    const [selectedTime, setSelectedTime] = useState('');
    const [selectedOperator, setSelectedOperator] = useState<number | undefined>();
    const [slots, setSlots] = useState<SlotInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [unavailableReason, setUnavailableReason] = useState<string | null>(null);

    const fetchSlots = useCallback(async (date: string) => {
        setLoading(true);
        setSlots([]);
        setSelectedTime('');
        setUnavailableReason(null);
        try {
            const res = await calendarApi.getDiscoveryCallSlots(brandId, date);
            setSlots(res.slots || []);
            if (res.unavailable_reason) setUnavailableReason(res.unavailable_reason);
        } catch {
            setUnavailableReason('error');
        } finally {
            setLoading(false);
        }
    }, [brandId]);

    useEffect(() => {
        if (selectedDate) fetchSlots(selectedDate);
    }, [selectedDate, fetchSlots]);

    const availableSlots = slots.filter(s => s.available);
    const hasSlots = availableSlots.length > 0;

    // Build 14 upcoming days for date selector
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingDays: string[] = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        upcomingDays.push(`${yyyy}-${mm}-${dd}`);
    }

    return (
        <Box sx={{ mt: 1 }}>
            {/* Date selector -- scrollable row of day chips */}
            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
                Pick a date
            </Typography>
            <Box sx={{
                display: 'flex', gap: 0.75, overflowX: 'auto', pb: 1, mb: 1.5,
                '&::-webkit-scrollbar': { height: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(148,163,184,0.2)', borderRadius: 2 },
            }}>
                {upcomingDays.map((day) => {
                    const d = new Date(day + 'T00:00:00');
                    const active = selectedDate === day;
                    return (
                        <Box
                            key={day}
                            onClick={() => setSelectedDate(day)}
                            sx={{
                                minWidth: 56, py: 0.75, px: 1, borderRadius: '10px', textAlign: 'center',
                                cursor: 'pointer', userSelect: 'none', flexShrink: 0,
                                border: `1.5px solid ${active ? accentColor : 'rgba(51,65,85,0.2)'}`,
                                bgcolor: active ? `${accentColor}14` : 'rgba(15,23,42,0.25)',
                                transition: 'all 0.2s ease',
                                animation: active ? `${chipBounce} 0.25s ease-out` : 'none',
                                '&:hover': { borderColor: `${accentColor}60` },
                            }}
                        >
                            <Typography sx={{ fontSize: '0.6rem', color: active ? accentColor : '#64748b', fontWeight: 600, lineHeight: 1 }}>
                                {d.toLocaleDateString(undefined, { weekday: 'short' })}
                            </Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: active ? '#e2e8f0' : '#94a3b8', fontWeight: active ? 700 : 500, lineHeight: 1.3 }}>
                                {d.getDate()}
                            </Typography>
                            <Typography sx={{ fontSize: '0.55rem', color: active ? accentColor : '#64748b', fontWeight: 500, lineHeight: 1 }}>
                                {d.toLocaleDateString(undefined, { month: 'short' })}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>

            {/* Slot grid */}
            {selectedDate && (
                <Box>
                    <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
                        Available times
                        {duration > 0 && (
                            <Typography component="span" sx={{ color: 'rgba(100,116,139,0.6)', fontSize: '0.55rem', fontWeight: 400, ml: 0.75, letterSpacing: 0, textTransform: 'none' }}>
                                ({duration} min each)
                            </Typography>
                        )}
                    </Typography>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={20} sx={{ color: accentColor }} />
                        </Box>
                    ) : unavailableReason && !hasSlots ? (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography sx={{ color: 'rgba(226,232,240,0.45)', fontSize: '0.74rem' }}>
                                {unavailableReason === 'not_available_day'
                                    ? 'Not available on this day -- try another.'
                                    : 'No slots available -- try another date.'}
                            </Typography>
                        </Box>
                    ) : !hasSlots ? (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography sx={{ color: 'rgba(226,232,240,0.45)', fontSize: '0.74rem' }}>
                                No slots available on this date.
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75 }}>
                            {slots.map((slot) => {
                                const active = selectedTime === slot.time;
                                return (
                                    <Box
                                        key={slot.time}
                                        onClick={() => {
                                            if (!slot.available) return;
                                            setSelectedTime(slot.time);
                                            setSelectedOperator(slot.operator_id);
                                        }}
                                        sx={{
                                            py: 1, px: 0.75, borderRadius: '10px', textAlign: 'center',
                                            cursor: slot.available ? 'pointer' : 'default',
                                            userSelect: 'none',
                                            border: `1.5px solid ${active ? accentColor : slot.available ? 'rgba(51,65,85,0.3)' : 'rgba(51,65,85,0.1)'}`,
                                            bgcolor: active ? `${accentColor}14` : slot.available ? 'rgba(15,23,42,0.25)' : 'rgba(15,23,42,0.12)',
                                            opacity: slot.available ? 1 : 0.35,
                                            transition: 'all 0.2s ease',
                                            animation: active ? `${chipBounce} 0.25s ease-out` : 'none',
                                            '&:hover': slot.available ? { borderColor: `${accentColor}60`, bgcolor: `${accentColor}08` } : {},
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4 }}>
                                            <AccessTime sx={{ fontSize: 12, color: active ? accentColor : '#64748b', transition: 'color 0.2s' }} />
                                            <Typography sx={{
                                                fontSize: '0.74rem', fontWeight: active ? 700 : 500,
                                                color: active ? accentColor : slot.available ? '#e2e8f0' : '#64748b',
                                                transition: 'color 0.2s',
                                            }}>
                                                {formatSlotLabel(slot.time)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            )}

            {/* Action buttons */}
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                {showCancel && (
                    <Button
                        onClick={onCancel}
                        fullWidth
                        sx={{
                            color: '#94a3b8', bgcolor: 'rgba(148,163,184,0.06)',
                            border: '1px solid rgba(148,163,184,0.12)',
                            borderRadius: 2, fontSize: '0.74rem', fontWeight: 600,
                            textTransform: 'none', py: 0.75,
                        }}
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    onClick={() => onSelect(selectedDate, selectedTime, selectedOperator)}
                    disabled={!selectedDate || !selectedTime || parentLoading}
                    fullWidth
                    sx={{
                        color: '#10b981', bgcolor: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.18)',
                        borderRadius: 2, fontSize: '0.74rem', fontWeight: 600,
                        textTransform: 'none', py: 0.75,
                        '&:hover': { bgcolor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.35)' },
                        '&.Mui-disabled': { color: 'rgba(16,185,129,0.3)', borderColor: 'rgba(16,185,129,0.08)' },
                    }}
                >
                    {confirmLabel}
                </Button>
            </Stack>
        </Box>
    );
};

/* ========================= */
/*  CallsCard  (main card)  */
/* ========================= */
const CallsCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor, submission }) => {
    const { user } = useAuth();
    const { currentBrand } = useBrand();
    const queryClient = useQueryClient();
    const [rescheduleMode, setRescheduleMode] = useState(false);

    const meetingsQueryKey = calendarQueryKeys.discoveryCallMeetings(currentBrand?.id, inquiry.id);

    const { data: meetings = [], isPending: meetingsLoading } = useQuery<BackendCalendarEvent[]>({
        queryKey: meetingsQueryKey,
        queryFn: async () => {
            const events = await calendarApi.getEvents();
            return events.filter(event => event.inquiry_id === inquiry.id && event.event_type === 'DISCOVERY_CALL');
        },
        enabled: !!currentBrand?.id && !!inquiry?.id,
    });

    const { data: meetingSettings = null, isPending: meetingSettingsLoading } = useMeetingSettings();

    const refreshMeetings = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: meetingsQueryKey });
    }, [queryClient, meetingsQueryKey]);

    const createMeetingMutation = useMutation({
        mutationFn: (eventPayload: Parameters<typeof calendarApi.createEvent>[0]) => calendarApi.createEvent(eventPayload),
        onSuccess: refreshMeetings,
    });

    const updateMeetingMutation = useMutation({
        mutationFn: ({
            meetingId,
            payload,
        }: {
            meetingId: number;
            payload: Parameters<typeof calendarApi.updateEvent>[1];
        }) => calendarApi.updateEvent(meetingId, payload),
        onSuccess: refreshMeetings,
    });

    const deleteMeetingMutation = useMutation({
        mutationFn: (meetingId: number) => calendarApi.deleteEvent(meetingId),
        onSuccess: refreshMeetings,
    });

    const isLoading =
        meetingsLoading ||
        meetingSettingsLoading ||
        createMeetingMutation.isPending ||
        updateMeetingMutation.isPending ||
        deleteMeetingMutation.isPending;

    const contactName = inquiry?.contact?.full_name || inquiry?.contact?.first_name || '';
    const defaultTitle = contactName ? `${contactName} - Discovery Call` : 'Discovery Call';
    const defaultDescription = meetingSettings?.description || '';
    const defaultMeetingUrl = meetingSettings?.google_meet_link || '';
    const defaultDuration = meetingSettings?.duration_minutes ?? 20;

    // -- Submission data --
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const submissionResponses = (submission?.responses ?? {}) as Record<string, any>;
    const callInterest = submissionResponses.discovery_call_interest;
    const reqMethod = submissionResponses.discovery_call_method;
    const reqDate = submissionResponses.discovery_call_date;
    const reqTime = submissionResponses.discovery_call_time;
    const wantsCall = callInterest === 'yes';
    const declinedCall = callInterest === 'no';
    const hasMeetingScheduled = meetings.length > 0;
    const isSpecificSlot = !!(reqDate && reqTime && /^\d{1,2}:\d{2}$/.test(reqTime));
    const showClientBookedState = isSpecificSlot && !hasMeetingScheduled;

    const latestMeeting = meetings[0];
    const isConfirmed = latestMeeting?.is_confirmed === true;

    // -- Handlers --
    const createEvent = async (date: string, time: string, confirmed: boolean, operatorId?: number) => {
        try {
            const paddedTime = time.padStart(5, '0');
            const startDate = new Date(`${date}T${paddedTime}:00`);
            const endDate = new Date(startDate.getTime() + defaultDuration * 60 * 1000);
            const meetingType = mapMethodToMeetingType(reqMethod) || 'VIDEO_CALL';

            await createMeetingMutation.mutateAsync({
                title: defaultTitle,
                start_time: startDate.toISOString(),
                end_time: endDate.toISOString(),
                event_type: 'DISCOVERY_CALL',
                meeting_type: meetingType,
                meeting_url: defaultMeetingUrl,
                description: defaultDescription,
                inquiry_id: inquiry.id,
                crew_member_id: operatorId || user?.id || 1,
                is_confirmed: confirmed,
            });
            setRescheduleMode(false);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error creating event:', error);
        }
    };

    const handleConfirmClientSlot = () => createEvent(reqDate, reqTime, true);

    const handleRescheduleSelect = async (date: string, time: string, operatorId?: number) => {
        // Delete current meeting, create new one
        if (latestMeeting) {
            try {
                await deleteMeetingMutation.mutateAsync(latestMeeting.id);
            } catch (error) {
                console.error('Error deleting old meeting:', error);
            }
        }
        await createEvent(date, time, true, operatorId);
    };

    const handleScheduleViaSlots = (date: string, time: string, operatorId?: number) => {
        createEvent(date, time, false, operatorId);
    };

    const handleToggleConfirm = async (meeting: BackendCalendarEvent) => {
        try {
            await updateMeetingMutation.mutateAsync({
                meetingId: meeting.id,
                payload: {
                    is_confirmed: !meeting.is_confirmed,
                },
            });
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error toggling confirm:', error);
        }
    };

    const handleDeleteMeeting = async (meetingId: number) => {
        try {
            await deleteMeetingMutation.mutateAsync(meetingId);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error deleting meeting:', error);
        }
    };

    // -- Header chip --
    const headerChip = () => {
        if (hasMeetingScheduled) {
            return (
                <Chip
                    label={isConfirmed ? 'Confirmed' : 'Scheduled'}
                    size="small"
                    sx={{
                        height: 20, fontSize: '0.65rem', fontWeight: 700,
                        bgcolor: isConfirmed ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: isConfirmed ? '#10b981' : '#f59e0b',
                    }}
                />
            );
        }
        if (showClientBookedState) {
            return (
                <Chip label="Client Booked" size="small" sx={{
                    height: 20, fontSize: '0.65rem', fontWeight: 700,
                    bgcolor: 'rgba(59,130,246,0.1)', color: '#3b82f6',
                }} />
            );
        }
        return null;
    };

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent>
                {/* -- Header -- */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                            width: 28, height: 28, borderRadius: 1.5,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.15)',
                        }}>
                            <Phone sx={{ fontSize: 15, color: '#f59e0b' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>
                            Discovery Call
                        </Typography>
                        {headerChip()}
                    </Box>
                </Box>

                {/* =========================================== */}
                {/*  STATE A -- Meeting already exists          */}
                {/* =========================================== */}
                {hasMeetingScheduled && !rescheduleMode && (
                    <Box>
                        {meetings.map((meeting) => {
                            const start = new Date(meeting.start_time);
                            const end = new Date(meeting.end_time);
                            const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
                            const statusColor = isConfirmed ? '#10b981' : '#f59e0b';

                            return (
                                <Box key={meeting.id} sx={{
                                    borderRadius: 2.5, overflow: 'hidden',
                                    bgcolor: 'rgba(15,23,42,0.5)',
                                    border: `1px solid ${isConfirmed ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.1)'}`,
                                }}>
                                    {/* 3-column: Date | Details | Actions */}
                                    <Box sx={{ display: 'flex', minHeight: 96 }}>
                                        {/* Col 1: Date block */}
                                        <Box sx={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            width: 68, flexShrink: 0,
                                            bgcolor: `${statusColor}06`,
                                            borderRight: '1px solid rgba(51,65,85,0.1)',
                                        }}>
                                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>
                                                {format(start, 'EEE')}
                                            </Typography>
                                            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.15, my: 0.2 }}>
                                                {format(start, 'd')}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>
                                                {format(start, 'MMM')}
                                            </Typography>
                                        </Box>

                                        {/* Col 2: Details */}
                                        <Box sx={{ flex: 1, py: 1.5, px: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.75, minWidth: 0 }}>
                                            {/* Time */}
                                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>
                                                    {format(start, 'h:mm a')}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1 }}>
                                                    - {format(end, 'h:mm a')}
                                                </Typography>
                                            </Box>

                                            {/* Meta row: duration + type + link */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                                    <TimerOutlined sx={{ fontSize: 13, color: '#64748b' }} />
                                                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                                                        {durationMin}m
                                                    </Typography>
                                                </Box>
                                                {meeting.meeting_type && (
                                                    <Chip size="small" label={meeting.meeting_type.replace(/_/g, ' ')} sx={{
                                                        height: 20, fontSize: '0.65rem', fontWeight: 700,
                                                        bgcolor: `${statusColor}0a`, color: statusColor,
                                                        border: `1px solid ${statusColor}18`,
                                                        '& .MuiChip-label': { px: 0.75 },
                                                    }} />
                                                )}
                                                {meeting.meeting_url && (
                                                    <Typography
                                                        component="a"
                                                        href={meeting.meeting_url.startsWith('http') ? meeting.meeting_url : `https://${meeting.meeting_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 0.3,
                                                            fontSize: '0.75rem', color: '#3b82f6', fontWeight: 500,
                                                            textDecoration: 'none',
                                                            '&:hover': { textDecoration: 'underline', color: '#60a5fa' },
                                                        }}
                                                    >
                                                        <LinkRounded sx={{ fontSize: 14, color: '#3b82f6' }} />
                                                        link
                                                    </Typography>
                                                )}
                                                {meeting.location && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                                        <LocationOn sx={{ fontSize: 13, color: '#64748b' }} />
                                                        <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                                                            {meeting.location}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Col 3: Labeled action buttons */}
                                        <Box sx={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center',
                                            gap: 0.5, px: 0.75, py: 0.75, flexShrink: 0,
                                            borderLeft: '1px solid rgba(51,65,85,0.08)',
                                        }}>
                                            <Button
                                                size="small"
                                                startIcon={isConfirmed ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : <CheckCircleOutline sx={{ fontSize: '14px !important' }} />}
                                                onClick={() => handleToggleConfirm(latestMeeting)}
                                                disabled={isLoading}
                                                sx={{
                                                    minWidth: 0, px: 1, py: 0.4,
                                                    fontSize: '0.65rem', fontWeight: 600, textTransform: 'none',
                                                    color: statusColor,
                                                    bgcolor: `${statusColor}0a`,
                                                    border: `1px solid ${statusColor}18`,
                                                    borderRadius: 1.5,
                                                    justifyContent: 'flex-start',
                                                    '& .MuiButton-startIcon': { mr: 0.5 },
                                                    '&:hover': { bgcolor: `${statusColor}18` },
                                                }}
                                            >
                                                {isConfirmed ? 'Confirmed' : 'Confirm'}
                                            </Button>
                                            <Button
                                                size="small"
                                                startIcon={<EditCalendar sx={{ fontSize: '13px !important' }} />}
                                                onClick={() => setRescheduleMode(true)}
                                                disabled={isLoading}
                                                sx={{
                                                    minWidth: 0, px: 1, py: 0.4,
                                                    fontSize: '0.65rem', fontWeight: 600, textTransform: 'none',
                                                    color: '#94a3b8',
                                                    bgcolor: 'rgba(148,163,184,0.06)',
                                                    border: '1px solid rgba(148,163,184,0.1)',
                                                    borderRadius: 1.5,
                                                    justifyContent: 'flex-start',
                                                    '& .MuiButton-startIcon': { mr: 0.5 },
                                                    '&:hover': { color: '#f59e0b', bgcolor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.15)' },
                                                }}
                                            >
                                                Reschedule
                                            </Button>
                                            <Button
                                                size="small"
                                                startIcon={<DeleteIcon sx={{ fontSize: '13px !important' }} />}
                                                onClick={() => handleDeleteMeeting(meeting.id)}
                                                disabled={isLoading}
                                                sx={{
                                                    minWidth: 0, px: 1, py: 0.4,
                                                    fontSize: '0.65rem', fontWeight: 600, textTransform: 'none',
                                                    color: '#475569',
                                                    bgcolor: 'rgba(71,85,105,0.06)',
                                                    border: '1px solid rgba(71,85,105,0.08)',
                                                    borderRadius: 1.5,
                                                    justifyContent: 'flex-start',
                                                    '& .MuiButton-startIcon': { mr: 0.5 },
                                                    '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.15)' },
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </Box>
                                    </Box>

                                    {/* Bottom status accent */}
                                    <Box sx={{
                                        height: 2,
                                        background: `linear-gradient(90deg, transparent, ${statusColor}60, ${statusColor}, ${statusColor}60, transparent)`,
                                    }} />
                                </Box>
                            );
                        })}
                    </Box>
                )}

                {/* Reschedule slot picker (from meeting-exists state) */}
                {hasMeetingScheduled && rescheduleMode && currentBrand?.id && (
                    <Box>
                        <Box sx={{ mb: 1.5, p: 1.25, borderRadius: 2, bgcolor: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
                            <Typography sx={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>
                                Pick a new time for the discovery call
                            </Typography>
                        </Box>
                        <SlotPicker
                            brandId={currentBrand.id}
                            initialDate={latestMeeting ? new Date(latestMeeting.start_time).toISOString().slice(0, 10) : undefined}
                            duration={defaultDuration}
                            onSelect={handleRescheduleSelect}
                            onCancel={() => setRescheduleMode(false)}
                            isLoading={isLoading}
                        />
                    </Box>
                )}

                {/* =========================================== */}
                {/*  STATE B -- Client booked a specific slot   */}
                {/* =========================================== */}
                {showClientBookedState && !rescheduleMode && (
                    <Box>
                        {/* Banner */}
                        <Box sx={{
                            mb: 2, p: 1.5, borderRadius: 2.5, position: 'relative', overflow: 'hidden',
                            bgcolor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)',
                        }}>
                            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, bgcolor: '#10b981', opacity: 0.5 }} />
                            <Typography sx={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700 }}>
                                Client booked a discovery call
                            </Typography>
                            <Typography sx={{ fontSize: '0.66rem', color: '#64748b', mt: 0.25 }}>
                                Confirm the slot or propose a new time
                            </Typography>
                        </Box>

                        {/* Two-column slot display */}
                        <Box sx={{
                            mb: 2, borderRadius: 3, overflow: 'hidden',
                            bgcolor: 'rgba(15,23,42,0.4)', border: '1px solid rgba(51,65,85,0.15)',
                            display: 'flex',
                        }}>
                            {/* Date column */}
                            {(() => {
                                const d = new Date(reqDate + 'T00:00:00');
                                return (
                                    <Box sx={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        minWidth: 80, py: 2, px: 1.5,
                                        bgcolor: 'rgba(59,130,246,0.05)',
                                        borderRight: '1px solid rgba(51,65,85,0.12)',
                                    }}>
                                        <CalendarToday sx={{ fontSize: 15, color: '#3b82f6', mb: 0.5, opacity: 0.7 }} />
                                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>
                                            {d.toLocaleDateString(undefined, { weekday: 'short' })}
                                        </Typography>
                                        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>
                                            {d.getDate()}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>
                                            {d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                        </Typography>
                                    </Box>
                                );
                            })()}

                            {/* Details column */}
                            <Box sx={{ flex: 1, py: 2, px: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
                                {/* Time */}
                                <Box sx={{
                                    display: 'inline-flex', alignItems: 'center', gap: 0.5, alignSelf: 'flex-start',
                                    px: 1.25, py: 0.5, borderRadius: '8px',
                                    bgcolor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.12)',
                                }}>
                                    <AccessTime sx={{ fontSize: 13, color: '#3b82f6' }} />
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9' }}>
                                        {formatSlotLabel(reqTime)}
                                    </Typography>
                                </Box>

                                {/* Method */}
                                {reqMethod && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        {getMethodIcon(reqMethod)}
                                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#e2e8f0' }}>
                                            {reqMethod}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        <Stack direction="row" spacing={1}>
                            <Button
                                startIcon={<EventAvailable sx={{ fontSize: 15 }} />}
                                onClick={handleConfirmClientSlot}
                                disabled={isLoading}
                                fullWidth
                                sx={{
                                    color: '#10b981', bgcolor: 'rgba(16,185,129,0.07)',
                                    border: '1px solid rgba(16,185,129,0.15)',
                                    borderRadius: 2.5, fontSize: '0.74rem', fontWeight: 700,
                                    textTransform: 'none', py: 0.9,
                                    '&:hover': { bgcolor: 'rgba(16,185,129,0.14)', borderColor: 'rgba(16,185,129,0.3)', boxShadow: '0 0 20px rgba(16,185,129,0.08)' },
                                }}
                            >
                                Confirm
                            </Button>
                            <Button
                                startIcon={<EditCalendar sx={{ fontSize: 15 }} />}
                                onClick={() => setRescheduleMode(true)}
                                disabled={isLoading}
                                fullWidth
                                sx={{
                                    color: '#f59e0b', bgcolor: 'rgba(245,158,11,0.07)',
                                    border: '1px solid rgba(245,158,11,0.15)',
                                    borderRadius: 2.5, fontSize: '0.74rem', fontWeight: 700,
                                    textTransform: 'none', py: 0.9,
                                    '&:hover': { bgcolor: 'rgba(245,158,11,0.14)', borderColor: 'rgba(245,158,11,0.3)', boxShadow: '0 0 20px rgba(245,158,11,0.08)' },
                                }}
                            >
                                Reschedule
                            </Button>
                        </Stack>
                    </Box>
                )}

                {/* Client-booked reschedule slot picker */}
                {showClientBookedState && rescheduleMode && currentBrand?.id && (
                    <Box>
                        <Box sx={{ mb: 1.5, p: 1.25, borderRadius: 2, bgcolor: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
                            <Typography sx={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>
                                Pick a new time for the discovery call
                            </Typography>
                        </Box>
                        <SlotPicker
                            brandId={currentBrand.id}
                            initialDate={reqDate}
                            duration={defaultDuration}
                            onSelect={(date, time, opId) => createEvent(date, time, true, opId)}
                            onCancel={() => setRescheduleMode(false)}
                            isLoading={isLoading}
                        />
                    </Box>
                )}

                {/* =========================================== */}
                {/*  STATE C -- No meeting, no specific slot    */}
                {/* =========================================== */}
                {!hasMeetingScheduled && !showClientBookedState && !rescheduleMode && (
                    <Box>
                        {/* Status banners */}
                        {wantsCall && (
                            <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                                <Typography sx={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                                    Client requested a discovery call
                                </Typography>
                            </Box>
                        )}
                        {!wantsCall && !declinedCall && (
                            <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.1)' }}>
                                <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                                    No call preference received
                                </Typography>
                                <Typography sx={{ fontSize: '0.7rem', color: '#64748b', mt: 0.25 }}>
                                    You can still schedule a discovery call below
                                </Typography>
                            </Box>
                        )}
                        {declinedCall && (
                            <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(100,116,139,0.04)', border: '1px solid rgba(100,116,139,0.1)' }}>
                                <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
                                    Client declined a discovery call
                                </Typography>
                                <Typography sx={{ fontSize: '0.68rem', color: '#475569', mt: 0.25 }}>
                                    You can still schedule one if needed
                                </Typography>
                            </Box>
                        )}

                        {/* Slot-based scheduler */}
                        {currentBrand?.id ? (
                            <SlotPicker
                                brandId={currentBrand.id}
                                duration={defaultDuration}
                                onSelect={handleScheduleViaSlots}
                                onCancel={() => {}}
                                isLoading={isLoading}
                                confirmLabel="Schedule Call"
                                showCancel={false}
                            />
                        ) : (
                            <Box sx={{ py: 3, textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '0.76rem', color: '#475569' }}>
                                    No discovery calls scheduled yet
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </CardContent>
        </WorkflowCard>
    );
};

export { CallsCard };
