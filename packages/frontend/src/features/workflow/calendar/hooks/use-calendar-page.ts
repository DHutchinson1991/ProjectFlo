"use client";

import { useCallback, useMemo } from 'react';
import type { CalendarTask, CalendarFilters } from '@/features/workflow/calendar/types/calendar-types';
import { useCalendarEvents, useCalendarTasks } from '@/features/workflow/calendar/hooks/use-calendar';
import { useCrewMembers } from '@/features/workflow/calendar/hooks/use-contributors';
import {
    searchTasks,
    getUpcomingDeadlines,
    getOverdueTasks,
    getCompletionRate,
} from '@/features/workflow/calendar/utils/calendar-event-helpers';
import type { EventFormData } from '@/features/workflow/calendar/components/EventModal';
import { useCalendarViewState } from './use-calendar-view-state';
import { useCalendarEventModal } from './use-calendar-event-modal';
import { useCalendarAddDialog } from './use-calendar-add-dialog';

export type { EventFormData };

export function useCalendarPage() {
    const viewState = useCalendarViewState();
    const { currentView, bumpRefreshKey } = viewState;
    const viewTypeForHook = currentView.type === 'agenda' ? 'month' : currentView.type;

    const {
        events,
        loading: eventsLoading,
        error: eventsError,
        createEvent: apiCreateEvent,
        updateEvent: apiUpdateEvent,
        deleteEvent: apiDeleteEvent,
        refreshEvents,
    } = useCalendarEvents(currentView.date, viewTypeForHook);

    const { tasks: apiTasks } = useCalendarTasks(currentView.date, viewTypeForHook);

    const { crewMembers, currentUserCrewMember, loading: crewMembersLoading, error: crewMembersError } =
        useCrewMembers();

    const eventModal = useCalendarEventModal({
        apiCreateEvent,
        apiUpdateEvent,
        apiDeleteEvent,
        refreshEvents,
    });

    const addDialog = useCalendarAddDialog({
        apiCreateEvent,
        refreshEvents,
        bumpRefreshKey,
        currentUserCrewMember,
    });

    const filters: CalendarFilters = {
        projects: [],
        eventTypes: [],
        taskTypes: [],
        priorities: [],
        assignees: [],
        showCompleted: true,
        searchTerm: '',
    };

    const filteredTasks = useMemo(() => {
        let filtered = apiTasks;
        if (filters.searchTerm) filtered = searchTasks(filtered, filters.searchTerm);
        if (!filters.showCompleted) filtered = filtered.filter(t => !t.completed);
        if (filters.projects.length > 0) filtered = filtered.filter(t => t.project && filters.projects.includes(t.project.id));
        if (filters.taskTypes.length > 0) filtered = filtered.filter(t => filters.taskTypes.includes(t.type));
        if (filters.priorities.length > 0) filtered = filtered.filter(t => filters.priorities.includes(t.priority));
        if (filters.assignees.length > 0) filtered = filtered.filter(t => t.assignee && filters.assignees.includes(t.assignee.id));
        return filtered;
    }, [apiTasks, filters]);

    const stats = useMemo(() => {
        const deadlines = getUpcomingDeadlines([], filteredTasks, 7);
        const overdue = getOverdueTasks(filteredTasks);
        const completion = getCompletionRate(filteredTasks);
        return {
            totalEvents: 0,
            totalTasks: filteredTasks.length,
            upcomingDeadlines: deadlines.length,
            overdueTasks: overdue.length,
            completionRate: completion,
        };
    }, [filteredTasks]);

    const handleEventDragUpdate = useCallback(
        async (eventId: string, updateData: { start: Date; end: Date }) => {
            const currentEvent = events.find(e => e.id === eventId);
            if (!currentEvent) return;
            try {
                await apiUpdateEvent(eventId, {
                    title: currentEvent.title,
                    description: currentEvent.description || '',
                    start: updateData.start,
                    end: updateData.end,
                    allDay: currentEvent.allDay || false,
                    type: currentEvent.type,
                    priority: currentEvent.priority,
                    assignee: currentEvent.assignee || undefined,
                    project: currentEvent.project || undefined,
                    location: currentEvent.location || '',
                });
            } catch {
                refreshEvents();
            }
        },
        [events, apiUpdateEvent, refreshEvents],
    );

    const handleTaskClick = useCallback((_task: CalendarTask) => {
        // TODO: Open task details — _task intentionally unused until implementation
        void _task;
    }, []);

    return {
        ...viewState,
        events,
        eventsLoading,
        eventsError,
        filteredTasks,
        stats,
        crewMembers,
        currentUserCrewMember,
        crewMembersLoading,
        crewMembersError,
        ...addDialog,
        ...eventModal,
        handleEventDragUpdate,
        handleTaskClick,
    };
}
