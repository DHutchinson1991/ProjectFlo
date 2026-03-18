// Custom React hooks for calendar data management
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarEvent, CalendarTask, EventType } from '../types';
import { getCalendarApi } from '../services/calendarApi';
import { transformBackendEvents, transformToBackendEvent, transformBackendTasks, getDateRangeForView } from '../services/dataTransforms';

// Hook for managing calendar events
export function useCalendarEvents(viewDate: Date, viewType: 'month' | 'week' | 'day') {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const api = useMemo(() => getCalendarApi(), []);

    // Get date range for current view
    const dateRange = useMemo(() => {
        return getDateRangeForView(viewDate, viewType);
    }, [viewDate, viewType]);

    // Fetch events for current date range
    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const backendEvents = await api.getEventsForDateRange(
                dateRange.start,
                dateRange.end
            );

            const transformedEvents = transformBackendEvents(backendEvents);
            setEvents(transformedEvents);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load events');
            console.error('Error fetching calendar events:', err);
        } finally {
            setLoading(false);
        }
    }, [api, dateRange.start, dateRange.end]);

    // Fetch events when date range changes
    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Create new event
    const createEvent = useCallback(async (eventData: Partial<CalendarEvent>) => {
        try {
            console.log('🔄 Creating event with data:', eventData);
            const backendEventData = transformToBackendEvent(eventData);
            console.log('🔄 Transformed backend data:', backendEventData);

            const newBackendEvent = await api.createEvent(backendEventData);
            const newEvent = transformBackendEvents([newBackendEvent])[0];

            setEvents(prevEvents => [...prevEvents, newEvent]);
            return newEvent;
        } catch (err) {
            console.error('❌ Error creating event:', err);
            setError(err instanceof Error ? err.message : 'Failed to create event');
            throw err;
        }
    }, [api]);

    // Update existing event
    const updateEvent = useCallback(async (id: string, eventData: Partial<CalendarEvent>) => {
        try {
            const backendEventData = transformToBackendEvent(eventData);
            const updatedBackendEvent = await api.updateEvent(parseInt(id), backendEventData);
            const updatedEvent = transformBackendEvents([updatedBackendEvent])[0];

            setEvents(prevEvents =>
                prevEvents.map(event => event.id === id ? updatedEvent : event)
            );
            return updatedEvent;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update event');
            throw err;
        }
    }, [api]);

    // Delete event
    const deleteEvent = useCallback(async (id: string) => {
        try {
            await api.deleteEvent(parseInt(id));
            setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete event');
            throw err;
        }
    }, [api]);

    // Refresh events
    const refreshEvents = useCallback(() => {
        fetchEvents();
    }, [fetchEvents]);

    return {
        events,
        loading,
        error,
        createEvent,
        updateEvent,
        deleteEvent,
        refreshEvents
    };
}

// Hook for calendar statistics
export function useCalendarStats(userId?: number) {
    const [stats, setStats] = useState<{
        total_events: number;
        project_events: number;
        personal_events: number;
        holiday_events: number;
        upcoming_events: number;
        past_events: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const api = useMemo(() => getCalendarApi(), []);

    useEffect(() => {
        let isMounted = true;

        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);

                const calendarStats = await api.getCalendarStats(userId);

                if (isMounted) {
                    setStats(calendarStats);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Failed to load stats');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchStats();

        return () => {
            isMounted = false;
        };
    }, [api, userId]);

    return { stats, loading, error };
}

// Hook for today's events
export function useTodaysEvents(contributorId?: number) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const api = useMemo(() => getCalendarApi(), []);

    useEffect(() => {
        let isMounted = true;

        const fetchTodaysEvents = async () => {
            try {
                setLoading(true);
                setError(null);

                const backendEvents = await api.getTodaysEvents(contributorId);
                const transformedEvents = transformBackendEvents(backendEvents);

                if (isMounted) {
                    setEvents(transformedEvents);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Failed to load today\'s events');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchTodaysEvents();

        return () => {
            isMounted = false;
        };
    }, [api, contributorId]);

    return { events, loading, error };
}

// Hook for upcoming events
export function useUpcomingEvents(contributorId?: number, limit: number = 10) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const api = useMemo(() => getCalendarApi(), []);

    useEffect(() => {
        let isMounted = true;

        const fetchUpcomingEvents = async () => {
            try {
                setLoading(true);
                setError(null);

                const backendEvents = await api.getUpcomingEvents(contributorId, limit);
                const transformedEvents = transformBackendEvents(backendEvents);

                if (isMounted) {
                    setEvents(transformedEvents);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Failed to load upcoming events');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchUpcomingEvents();

        return () => {
            isMounted = false;
        };
    }, [api, contributorId, limit]);

    return { events, loading, error };
}

// Hook for calendar tags
export function useCalendarTags() {
    const [tags, setTags] = useState<Array<{ id: number; name: string; color: string; description?: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const api = useMemo(() => getCalendarApi(), []);

    useEffect(() => {
        let isMounted = true;

        const fetchTags = async () => {
            try {
                setLoading(true);
                setError(null);

                const calendarTags = await api.getTags();

                if (isMounted) {
                    setTags(calendarTags);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Failed to load tags');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchTags();

        return () => {
            isMounted = false;
        };
    }, [api]);

    return { tags, loading, error };
}

// Hook for fetching inquiry_tasks + project_tasks as CalendarTask[] for a date range
export function useCalendarTasks(viewDate: Date, viewType: 'month' | 'week' | 'day') {
    const [tasks, setTasks] = useState<CalendarTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const api = useMemo(() => getCalendarApi(), []);

    const dateRange = useMemo(() => getDateRangeForView(viewDate, viewType), [viewDate, viewType]);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const backendTasks = await api.getTasksForDateRange(dateRange.start, dateRange.end);
            setTasks(transformBackendTasks(backendTasks));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load tasks');
            console.error('Error fetching calendar tasks:', err);
        } finally {
            setLoading(false);
        }
    }, [api, dateRange.start, dateRange.end]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return { tasks, loading, error, refreshTasks: fetchTasks };
}

// Hook for filtering events
export function useFilteredEvents(events: CalendarEvent[], filters: {
    eventTypes?: EventType[];
    search?: string;
    contributorId?: string;
}) {
    return useMemo(() => {
        let filtered = [...events];

        // Filter by event types
        if (filters.eventTypes && filters.eventTypes.length > 0) {
            filtered = filtered.filter(event => filters.eventTypes!.includes(event.type));
        }

        // Filter by search term
        if (filters.search && filters.search.trim()) {
            const searchTerm = filters.search.toLowerCase().trim();
            filtered = filtered.filter(event =>
                event.title.toLowerCase().includes(searchTerm) ||
                event.description?.toLowerCase().includes(searchTerm) ||
                event.location?.toLowerCase().includes(searchTerm) ||
                event.assignee?.name.toLowerCase().includes(searchTerm)
            );
        }

        // Filter by contributor
        if (filters.contributorId) {
            filtered = filtered.filter(event => event.assignee?.id === filters.contributorId);
        }

        return filtered;
    }, [events, filters]);
}
