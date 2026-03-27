import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import type { CalendarEvent } from '../types/calendar-types';
import { calendarApi } from '../api';
import { transformBackendEvents, transformToBackendEvent, getDateRangeForView } from '../mappers/calendar-event-mapper';
import { calendarQueryKeys } from '../constants/query-keys';

export function useCalendarEvents(viewDate: Date, viewType: 'month' | 'week' | 'day') {
    const queryClient = useQueryClient();
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const dateRange = useMemo(() => getDateRangeForView(viewDate, viewType), [viewDate, viewType]);
    const startStr = useMemo(() => dateRange.start.toISOString().slice(0, 10), [dateRange.start]);
    const endStr = useMemo(() => dateRange.end.toISOString().slice(0, 10), [dateRange.end]);
    const queryKey = useMemo(
        () => calendarQueryKeys.eventsRange(brandId, startStr, endStr),
        [brandId, startStr, endStr],
    );

    const { data: events = [], isPending: loading, error: queryError } = useQuery({
        queryKey,
        queryFn: () =>
            calendarApi.getEventsForDateRange(dateRange.start, dateRange.end).then(transformBackendEvents),
        enabled: !!brandId,
    });

    const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to load events' : null;

    const invalidate = useCallback(
        () => queryClient.invalidateQueries({ queryKey: calendarQueryKeys.events(brandId) }),
        [queryClient, brandId],
    );

    const createMutation = useMutation({
        mutationFn: (data: Partial<CalendarEvent>) =>
            calendarApi.createEvent(transformToBackendEvent(data)).then(e => transformBackendEvents([e])[0]),
        onSuccess: invalidate,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CalendarEvent> }) =>
            calendarApi
                .updateEvent(parseInt(id, 10), transformToBackendEvent(data))
                .then(e => transformBackendEvents([e])[0]),
        onSuccess: invalidate,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => calendarApi.deleteEvent(parseInt(id, 10)),
        onSuccess: invalidate,
    });

    const createEvent = useCallback(
        (data: Partial<CalendarEvent>) => createMutation.mutateAsync(data),
        [createMutation],
    );
    const updateEvent = useCallback(
        (id: string, data: Partial<CalendarEvent>) => updateMutation.mutateAsync({ id, data }),
        [updateMutation],
    );
    const deleteEvent = useCallback(
        (id: string) => deleteMutation.mutateAsync(id),
        [deleteMutation],
    );

    return { events, loading, error, createEvent, updateEvent, deleteEvent, refreshEvents: invalidate };
}
