import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import type { CalendarEvent, EventType } from '../types/calendar-types';
import { calendarApi } from '../api';
import { transformBackendTasks } from '../mappers/calendar-task-mapper';
import { getDateRangeForView } from '../mappers/calendar-event-mapper';
import { calendarQueryKeys } from '../constants/query-keys';

export function useCalendarTasks(viewDate: Date, viewType: 'month' | 'week' | 'day') {
    const queryClient = useQueryClient();
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const dateRange = useMemo(() => getDateRangeForView(viewDate, viewType), [viewDate, viewType]);
    const startStr = useMemo(() => dateRange.start.toISOString().slice(0, 10), [dateRange.start]);
    const endStr = useMemo(() => dateRange.end.toISOString().slice(0, 10), [dateRange.end]);

    const { data: tasks = [], isPending: loading, error: queryError } = useQuery({
        queryKey: calendarQueryKeys.tasksRange(brandId, startStr, endStr),
        queryFn: () =>
            calendarApi.getTasksForDateRange(dateRange.start, dateRange.end).then(transformBackendTasks),
        enabled: !!brandId,
    });

    const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to load tasks' : null;

    const refreshTasks = useCallback(
        () => queryClient.invalidateQueries({ queryKey: calendarQueryKeys.tasks(brandId) }),
        [queryClient, brandId],
    );

    return { tasks, loading, error, refreshTasks };
}

export function useFilteredEvents(
    events: CalendarEvent[],
    filters: { eventTypes?: EventType[]; search?: string; crewMemberId?: string },
) {
    return useMemo(() => {
        let filtered = [...events];

        if (filters.eventTypes?.length) {
            filtered = filtered.filter(e => filters.eventTypes!.includes(e.type));
        }

        if (filters.search?.trim()) {
            const term = filters.search.toLowerCase().trim();
            filtered = filtered.filter(
                e =>
                    e.title.toLowerCase().includes(term) ||
                    e.description?.toLowerCase().includes(term) ||
                    e.location?.toLowerCase().includes(term) ||
                    e.assignee?.name.toLowerCase().includes(term),
            );
        }

        if (filters.crewMemberId) {
            filtered = filtered.filter(e => e.assignee?.id === filters.crewMemberId);
        }

        return filtered;
    }, [events, filters]);
}
