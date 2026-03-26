"use client";

import { useState, useCallback } from 'react';
import type { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';
import type { EventFormData } from '@/features/workflow/calendar/components/EventModal';

interface UseCalendarEventModalDeps {
    apiCreateEvent: (data: Partial<CalendarEvent>) => Promise<CalendarEvent>;
    apiUpdateEvent: (id: string, data: Partial<CalendarEvent>) => Promise<CalendarEvent>;
    apiDeleteEvent: (id: string) => Promise<void>;
    refreshEvents: () => void;
}

export function useCalendarEventModal({
    apiCreateEvent,
    apiUpdateEvent,
    apiDeleteEvent,
    refreshEvents,
}: UseCalendarEventModalDeps) {
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [eventModalMode, setEventModalMode] = useState<'create' | 'edit'>('create');
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [eventInitialData, setEventInitialData] = useState<
        { start: Date; end: Date; title: string } | undefined
    >(undefined);
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);

    const handleEventClick = useCallback((event: CalendarEvent) => {
        setSelectedEvent(event);
        setEventModalMode('edit');
        setIsEventModalOpen(true);
    }, []);

    const handleCreateEvent = useCallback((eventData: { start: Date; end: Date; title: string }) => {
        setEventInitialData(eventData);
        setSelectedEvent(null);
        setEventModalMode('create');
        setIsEventModalOpen(true);
    }, []);

    const closeEventModal = useCallback(() => {
        setIsEventModalOpen(false);
        setSelectedEvent(null);
        setEventInitialData(undefined);
    }, []);

    const handleEventSave = useCallback(
        async (eventData: EventFormData) => {
            try {
                setIsCreatingEvent(true);
                const payload = {
                    title: eventData.title,
                    description: eventData.description,
                    start: eventData.start,
                    end: eventData.end,
                    allDay: eventData.allDay,
                    type: eventData.type,
                    priority: eventData.priority,
                    assignee: eventData.assignee || undefined,
                    project: eventData.project || undefined,
                    location: eventData.location,
                };
                if (eventModalMode === 'create') {
                    await apiCreateEvent(payload);
                } else {
                    await apiUpdateEvent(eventData.id!, payload);
                }
                setIsEventModalOpen(false);
                setSelectedEvent(null);
                refreshEvents();
            } catch {
                console.error('Error saving event');
            } finally {
                setIsCreatingEvent(false);
            }
        },
        [eventModalMode, apiCreateEvent, apiUpdateEvent, refreshEvents],
    );

    const handleEventDelete = useCallback(
        async (eventId: string) => {
            try {
                await apiDeleteEvent(eventId);
                setIsEventModalOpen(false);
                setSelectedEvent(null);
                refreshEvents();
            } catch {
                console.error('Error deleting event');
            }
        },
        [apiDeleteEvent, refreshEvents],
    );

    return {
        isEventModalOpen,
        eventModalMode,
        selectedEvent,
        eventInitialData,
        isCreatingEvent,
        handleEventClick,
        handleCreateEvent,
        closeEventModal,
        handleEventSave,
        handleEventDelete,
    };
}
