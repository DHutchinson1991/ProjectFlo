"use client";

import { useState, useCallback, useEffect } from 'react';
import type { CalendarEvent, EventType, TaskType, Priority, Project } from '@/features/workflow/calendar/types/calendar-types';
import type { CrewMemberOption } from './use-contributors';

interface UseCalendarAddDialogDeps {
    apiCreateEvent: (data: Partial<CalendarEvent>) => Promise<CalendarEvent>;
    refreshEvents: () => void;
    bumpRefreshKey: () => void;
    currentUserCrewMember: CrewMemberOption | null;
}

export function useCalendarAddDialog({
    apiCreateEvent,
    refreshEvents,
    bumpRefreshKey,
    currentUserCrewMember,
}: UseCalendarAddDialogDeps) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [addDialogType, setAddDialogType] = useState<'event' | 'task'>('event');
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);

    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        start: new Date(),
        end: new Date(),
        allDay: false,
        type: 'meeting' as EventType,
        priority: 'medium' as Priority,
        assignee: null as CrewMemberOption | null,
        project: null as Project | null,
        location: '',
    });

    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        dueDate: new Date(),
        type: 'production' as TaskType,
        priority: 'medium' as Priority,
        assignee: null as CrewMemberOption | null,
        project: null as Project | null,
        estimatedHours: 1,
    });

    useEffect(() => {
        if (currentUserCrewMember && !newEvent.assignee) {
            setNewEvent(prev => ({ ...prev, assignee: currentUserCrewMember }));
        }
    }, [currentUserCrewMember, newEvent.assignee]);

    useEffect(() => {
        if (currentUserCrewMember && !newTask.assignee) {
            setNewTask(prev => ({ ...prev, assignee: currentUserCrewMember }));
        }
    }, [currentUserCrewMember, newTask.assignee]);

    const handleAddEvent = useCallback(async () => {
        try {
            setIsCreatingEvent(true);
            const assignee = newEvent.assignee
                ? { id: newEvent.assignee.id, name: newEvent.assignee.name, email: newEvent.assignee.email, avatar: '', role: 'USER' }
                : undefined;
            await apiCreateEvent({
                title: newEvent.title,
                description: newEvent.description,
                start: newEvent.start,
                end: newEvent.end,
                allDay: newEvent.allDay,
                type: newEvent.type,
                priority: newEvent.priority,
                assignee,
                project: newEvent.project || undefined,
                location: newEvent.location,
            });
            refreshEvents();
            bumpRefreshKey();
            setIsAddDialogOpen(false);
            setNewEvent({
                title: '', description: '', start: new Date(), end: new Date(),
                allDay: false, type: 'meeting', priority: 'medium',
                assignee: null, project: null, location: '',
            });
        } catch {
            alert('Failed to create event. Please try again.');
        } finally {
            setIsCreatingEvent(false);
        }
    }, [newEvent, apiCreateEvent, refreshEvents, bumpRefreshKey]);

    const handleAddTask = useCallback(() => {
        setIsAddDialogOpen(false);
        setNewTask({
            title: '', description: '', dueDate: new Date(), type: 'production',
            priority: 'medium', assignee: null, project: null, estimatedHours: 1,
        });
    }, []);

    return {
        isAddDialogOpen,
        setIsAddDialogOpen,
        addDialogType,
        setAddDialogType,
        isCreatingEvent,
        newEvent,
        setNewEvent,
        newTask,
        setNewTask,
        handleAddEvent,
        handleAddTask,
    };
}
