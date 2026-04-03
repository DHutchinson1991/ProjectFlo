import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { calendarApi, type BackendCalendarEvent } from '@/features/workflow/calendar/api';
import { calendarQueryKeys } from '@/features/workflow/calendar/constants/query-keys';
import { useAuth } from '@/features/platform/auth';
import { useBrand } from '@/features/platform/brand';
import { useMeetingSettings } from '@/features/platform/settings/hooks';
import type { Inquiry, NeedsAssessmentSubmission } from '../../types';
import { mapMethodToMeetingType } from '@/shared/utils/meeting';

interface UseDiscoveryCallCardArgs {
    inquiry: Inquiry;
    onRefresh?: () => void;
    submission?: NeedsAssessmentSubmission | null;
}

export function useDiscoveryCallCard({ inquiry, onRefresh, submission }: UseDiscoveryCallCardArgs) {
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

    const latestMeeting = meetings[0] as BackendCalendarEvent | undefined;
    const isConfirmed = latestMeeting?.is_confirmed === true;

    // -- Handlers --
    const createEvent = async (date: string, time: string, confirmed: boolean, crewMemberId?: number) => {
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
                crew_id: crewMemberId || user?.id || 1,
                is_confirmed: confirmed,
            });
            setRescheduleMode(false);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error creating event:', error);
        }
    };

    const handleConfirmClientSlot = () => createEvent(reqDate, reqTime, true);

    const handleRescheduleSelect = async (date: string, time: string, crewMemberId?: number) => {
        if (latestMeeting) {
            try {
                await deleteMeetingMutation.mutateAsync(latestMeeting.id);
            } catch (error) {
                console.error('Error deleting old meeting:', error);
            }
        }
        await createEvent(date, time, true, crewMemberId);
    };

    const handleScheduleViaSlots = (date: string, time: string, crewMemberId?: number) => {
        createEvent(date, time, false, crewMemberId);
    };

    const handleToggleConfirm = async (meeting: BackendCalendarEvent) => {
        try {
            await updateMeetingMutation.mutateAsync({
                meetingId: meeting.id,
                payload: { is_confirmed: !meeting.is_confirmed },
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

    return {
        // state
        meetings,
        meetingSettings,
        currentBrand,
        rescheduleMode,
        setRescheduleMode,
        isLoading,
        // derived
        hasMeetingScheduled,
        showClientBookedState,
        latestMeeting,
        isConfirmed,
        wantsCall,
        declinedCall,
        defaultDuration,
        reqMethod,
        reqDate,
        reqTime,
        // handlers
        handleConfirmClientSlot,
        handleRescheduleSelect,
        handleScheduleViaSlots,
        handleToggleConfirm,
        handleDeleteMeeting,
        createEvent,
    };
}
