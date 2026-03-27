import { useQuery } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { calendarApi } from '../api';
import { transformBackendEvents } from '../mappers/calendar-event-mapper';
import { calendarQueryKeys } from '../constants/query-keys';

export function useCalendarStats(userId?: number) {
    const { currentBrand } = useBrand();
    const { data: stats = null, isPending: loading, error: queryError } = useQuery({
        queryKey: calendarQueryKeys.stats(currentBrand?.id, userId),
        queryFn: () => calendarApi.getCalendarStats(userId),
        enabled: !!currentBrand,
    });
    const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to load stats' : null;
    return { stats, loading, error };
}

export function useTodaysEvents(crewMemberId?: number) {
    const { currentBrand } = useBrand();
    const { data: events = [], isPending: loading, error: queryError } = useQuery({
        queryKey: calendarQueryKeys.todayEvents(currentBrand?.id, crewMemberId),
        queryFn: () => calendarApi.getTodaysEvents(crewMemberId).then(transformBackendEvents),
        enabled: !!currentBrand,
    });
    const error = queryError instanceof Error ? queryError.message : queryError ? "Failed to load today's events" : null;
    return { events, loading, error };
}

export function useUpcomingEvents(crewMemberId?: number, limit = 10) {
    const { currentBrand } = useBrand();
    const { data: events = [], isPending: loading, error: queryError } = useQuery({
        queryKey: calendarQueryKeys.upcomingEvents(currentBrand?.id, crewMemberId, limit),
        queryFn: () => calendarApi.getUpcomingEvents(crewMemberId, limit).then(transformBackendEvents),
        enabled: !!currentBrand,
    });
    const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to load upcoming events' : null;
    return { events, loading, error };
}

export function useCalendarTags() {
    const { currentBrand } = useBrand();
    const { data: tags = [], isPending: loading, error: queryError } = useQuery({
        queryKey: calendarQueryKeys.tags(currentBrand?.id),
        queryFn: calendarApi.getTags,
        enabled: !!currentBrand,
    });
    const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to load tags' : null;
    return { tags, loading, error };
}
