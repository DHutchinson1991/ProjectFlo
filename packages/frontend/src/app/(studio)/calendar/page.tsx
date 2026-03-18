"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    Box,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Autocomplete,
    Grid,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Event as EventIcon,
    Task as TaskIcon
} from '@mui/icons-material';

// Import our calendar components
import CalendarHeader from './components/CalendarHeader';
import MonthView from './components/MonthView';
import WeekView from './components/WeekView';
import DayView from './components/DayView';
import AgendaView from './components/AgendaView';
import EventModal, { EventFormData } from './components/EventModal';
import { ContributorSelector } from './components/ContributorSelector';

// Import types and utilities
import {
    CalendarView,
    CalendarEvent,
    CalendarTask,
    CalendarFilters,
    EventType,
    TaskType,
    Priority,
    User,
    Project
} from './types';
import { useCalendarEvents, useCalendarTasks } from './hooks/useCalendar';
import { useContributors, ContributorOption } from './hooks/useContributors';
import {
    eventTypeConfig,
    taskTypeConfig,
    priorityConfig,
    mockProjects
} from './config';
import {
    searchTasks,
    getUpcomingDeadlines,
    getOverdueTasks,
    getCompletionRate
} from './utils';

export default function CalendarPage() {

    // State management
    const [currentView, setCurrentView] = useState<CalendarView>({
        type: 'month',
        date: new Date()
    });

    const filters: CalendarFilters = {
        projects: [],
        eventTypes: [],
        taskTypes: [],
        priorities: [],
        assignees: [],
        showCompleted: true,
        searchTerm: ''
    };

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [addDialogType, setAddDialogType] = useState<'event' | 'task'>('event');
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0); // Used to trigger calendar refresh

    // Event modal state (unified for both create and edit)
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [eventModalMode, setEventModalMode] = useState<'create' | 'edit'>('create');
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [eventInitialData, setEventInitialData] = useState<{ start: Date; end: Date; title: string } | undefined>(undefined);

    // Use calendar hook for API operations - use current view type
    const viewTypeForHook = currentView.type === 'agenda' ? 'month' : currentView.type;
    const { events, loading: eventsLoading, error: eventsError, createEvent: apiCreateEvent, updateEvent: apiUpdateEvent, deleteEvent: apiDeleteEvent, refreshEvents } = useCalendarEvents(currentView.date, viewTypeForHook);

    // Fetch real tasks (inquiry + project) for the current view's date range
    const { tasks: apiTasks } = useCalendarTasks(currentView.date, viewTypeForHook);

    // Use contributors hook for assignee selection
    const {
        contributors,
        currentUserContributor,
        loading: contributorsLoading,
        error: contributorsError
    } = useContributors();

    // Helper function to convert ContributorOption to User format
    const contributorToUser = (contributor: ContributorOption | null): User | null => {
        if (!contributor) return null;
        return {
            id: contributor.id,
            name: contributor.name,
            email: contributor.email,
            avatar: '', // ContributorOption doesn't have avatar, will use initials in UI
            role: 'USER',
        };
    };

    // Wrapper function for drag-to-resize updates (simplified interface)
    const handleEventDragUpdate = useCallback(async (eventId: string, updateData: { start: Date; end: Date }) => {
        try {
            // Find the current event to preserve other properties
            const currentEvent = events.find(e => e.id === eventId);
            if (!currentEvent) {
                throw new Error(`Event with ID ${eventId} not found`);
            }

            console.log('🔄 Updating event via drag...', { eventId, updateData });

            // Use the hook's updateEvent method which handles optimistic updates
            // This will immediately update the local state without needing a full refresh
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
                location: currentEvent.location || ''
            });

            // No need to call refreshEvents() - the hook handles state updates automatically
            console.log('✅ Event updated successfully via drag (optimistic update)');
        } catch (error) {
            console.error('❌ Failed to update event via drag:', error);
            // If there's an error, we might want to refresh to ensure consistency
            console.log('🔄 Refreshing events due to error...');
            refreshEvents();
            throw error; // Re-throw to allow DayView to handle the error
        }
    }, [events, apiUpdateEvent, refreshEvents]);

    // Helper function to format Date for datetime-local input
    const formatDateTimeLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // New event/task form state
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        start: new Date(),
        end: new Date(),
        allDay: false,
        type: 'meeting' as EventType,
        priority: 'medium' as Priority,
        assignee: null as ContributorOption | null,
        project: null as Project | null,
        location: ''
    });

    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        dueDate: new Date(),
        type: 'production' as TaskType,
        priority: 'medium' as Priority,
        assignee: null as ContributorOption | null,
        project: null as Project | null,
        estimatedHours: 1
    });

    // Set default assignee to current user when contributors load
    useEffect(() => {
        if (currentUserContributor && !newEvent.assignee) {
            setNewEvent(prev => ({ ...prev, assignee: currentUserContributor }));
        }
    }, [currentUserContributor, newEvent.assignee]);

    useEffect(() => {
        if (currentUserContributor && !newTask.assignee) {
            setNewTask(prev => ({ ...prev, assignee: currentUserContributor }));
        }
    }, [currentUserContributor, newTask.assignee]);

    // Filtered data (tasks only - events are managed by connected components)
    const filteredTasks = useMemo(() => {
        let filtered = apiTasks;

        // Apply search filter
        if (filters.searchTerm) {
            filtered = searchTasks(filtered, filters.searchTerm);
        }

        // Apply completed filter
        if (!filters.showCompleted) {
            filtered = filtered.filter(task => !task.completed);
        }

        // Apply project filter
        if (filters.projects.length > 0) {
            filtered = filtered.filter(task =>
                task.project && filters.projects.includes(task.project.id)
            );
        }

        // Apply task type filter
        if (filters.taskTypes.length > 0) {
            filtered = filtered.filter(task =>
                filters.taskTypes.includes(task.type)
            );
        }

        // Apply priority filter
        if (filters.priorities.length > 0) {
            filtered = filtered.filter(task =>
                filters.priorities.includes(task.priority)
            );
        }

        // Apply assignee filter
        if (filters.assignees.length > 0) {
            filtered = filtered.filter(task =>
                task.assignee && filters.assignees.includes(task.assignee.id)
            );
        }

        return filtered;
    }, [apiTasks, filters]);

    // Statistics (simplified since events are handled by connected components)
    const stats = useMemo(() => {
        const upcomingDeadlines = getUpcomingDeadlines([], filteredTasks, 7);
        const overdueTasks = getOverdueTasks(filteredTasks);
        const completionRate = getCompletionRate(filteredTasks);

        return {
            totalEvents: 0, // Events are managed by connected components
            totalTasks: filteredTasks.length,
            upcomingDeadlines: upcomingDeadlines.length,
            overdueTasks: overdueTasks.length,
            completionRate
        };
    }, [filteredTasks]);

    // Event handlers
    const handleViewChange = useCallback((newView: CalendarView) => {
        setCurrentView(newView);
    }, []);

    const handleTodayClick = useCallback(() => {
        setCurrentView(prev => ({ ...prev, date: new Date() }));
    }, []);

    const handleDateClick = useCallback((date: Date) => {
        setCurrentView({ type: 'day', date });
    }, []);

    const handleEventClick = useCallback((event: CalendarEvent) => {
        console.log('Event clicked:', event);
        setSelectedEvent(event);
        setEventModalMode('edit');
        setIsEventModalOpen(true);
    }, []);

    const handleCreateEvent = useCallback((eventData: { start: Date; end: Date; title: string }) => {
        console.log('Creating new event:', eventData);

        // Set initial data and open modal in create mode
        setEventInitialData(eventData);
        setSelectedEvent(null);
        setEventModalMode('create');
        setIsEventModalOpen(true);
    }, []);

    const handleEventSave = useCallback(async (eventData: EventFormData) => {
        try {
            setIsCreatingEvent(true);

            if (eventModalMode === 'create') {
                // Create new event
                await apiCreateEvent({
                    title: eventData.title,
                    description: eventData.description,
                    start: eventData.start,
                    end: eventData.end,
                    allDay: eventData.allDay,
                    type: eventData.type,
                    priority: eventData.priority,
                    assignee: eventData.assignee || undefined,
                    project: eventData.project || undefined,
                    location: eventData.location
                });
                console.log('✅ Event created successfully');
            } else {
                // Update existing event
                console.log('📝 Updating event:', eventData);
                await apiUpdateEvent(eventData.id!, {
                    title: eventData.title,
                    description: eventData.description,
                    start: eventData.start,
                    end: eventData.end,
                    allDay: eventData.allDay,
                    type: eventData.type,
                    priority: eventData.priority,
                    assignee: eventData.assignee || undefined,
                    project: eventData.project || undefined,
                    location: eventData.location
                });
                console.log('✅ Event updated successfully');
            }

            // Close modal and refresh
            setIsEventModalOpen(false);
            setSelectedEvent(null);
            refreshEvents();

        } catch (error) {
            console.error('❌ Error saving event:', error);
            // TODO: Show error toast
        } finally {
            setIsCreatingEvent(false);
        }
    }, [eventModalMode, apiCreateEvent, apiUpdateEvent, refreshEvents]);

    const handleEventDelete = useCallback(async (eventId: string) => {
        try {
            console.log('🗑️ Deleting event:', eventId);
            await apiDeleteEvent(eventId);

            setIsEventModalOpen(false);
            setSelectedEvent(null);
            refreshEvents();
            console.log('✅ Event deleted successfully');
        } catch (error) {
            console.error('❌ Error deleting event:', error);
            // TODO: Show error toast
        }
    }, [apiDeleteEvent, refreshEvents]);

    const handleTaskClick = useCallback((task: CalendarTask) => {
        console.log('Task clicked:', task);
        // TODO: Open task details dialog or toggle completion
    }, []);

    const handleAddEvent = useCallback(async () => {
        try {
            setIsCreatingEvent(true);

            // Create the event using the API
            await apiCreateEvent({
                title: newEvent.title,
                description: newEvent.description,
                start: newEvent.start,
                end: newEvent.end,
                allDay: newEvent.allDay,
                type: newEvent.type,
                priority: newEvent.priority,
                assignee: contributorToUser(newEvent.assignee) || undefined,
                project: newEvent.project || undefined,
                location: newEvent.location
            });

            // Refresh calendar views to show the new event
            refreshEvents();

            // Trigger refresh for all calendar views
            setRefreshKey(prev => prev + 1);

            // Close the dialog
            setIsAddDialogOpen(false);

            // Reset form
            setNewEvent({
                title: '',
                description: '',
                start: new Date(),
                end: new Date(),
                allDay: false,
                type: 'meeting',
                priority: 'medium',
                assignee: null,
                project: null,
                location: ''
            });

            console.log('✅ Event created successfully!');
        } catch (error) {
            console.error('❌ Failed to create event:', error);
            // Keep dialog open so user can retry
            alert('Failed to create event. Please try again.');
        } finally {
            setIsCreatingEvent(false);
        }
    }, [newEvent, apiCreateEvent, refreshEvents, setRefreshKey]);

    const handleAddTask = useCallback(() => {
        // Tasks are managed in the task library and auto-generated for inquiries/projects.
        // This dialog is kept for future manual task creation via API.
        console.log('Task creation from calendar not yet supported — use the Tasks page.', newTask);
        setIsAddDialogOpen(false);

        // Reset form
        setNewTask({
            title: '',
            description: '',
            dueDate: new Date(),
            type: 'production',
            priority: 'medium',
            assignee: null,
            project: null,
            estimatedHours: 1
        });
    }, [newTask]);

    // Render calendar view
    const renderCalendarView = () => {
        switch (currentView.type) {
            case 'month':
                return (
                    <MonthView
                        date={currentView.date}
                        onDateClick={handleDateClick}
                        onEventClick={handleEventClick}
                        tasks={filteredTasks}
                        onTaskClick={handleTaskClick}
                        key={`month-${refreshKey}`}
                    />
                );
            case 'week':
                return (
                    <WeekView
                        date={currentView.date}
                        events={events}
                        loading={eventsLoading}
                        error={eventsError}
                        onEventClick={handleEventClick}
                        onCreateEvent={handleCreateEvent}
                        onEventUpdate={handleEventDragUpdate}
                        onDateClick={handleDateClick}
                        tasks={filteredTasks}
                        onTaskClick={handleTaskClick}
                        key={`week-${refreshKey}`}
                    />
                );
            case 'day':
                return (
                    <DayView
                        date={currentView.date}
                        events={events}
                        loading={eventsLoading}
                        error={eventsError}
                        onEventClick={handleEventClick}
                        onCreateEvent={handleCreateEvent}
                        onEventUpdate={handleEventDragUpdate}
                        tasks={filteredTasks}
                        onTaskClick={handleTaskClick}
                        key={`day-${refreshKey}`}
                    />
                );
            case 'agenda':
                return (
                    <AgendaView
                        date={currentView.date}
                        tasks={filteredTasks}
                        onEventClick={handleEventClick}
                        onTaskClick={handleTaskClick}
                        key={`agenda-${refreshKey}`}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
            color: '#e0e0e0'
        }}>
            {/* Calendar Header */}
            <CalendarHeader
                currentView={currentView}
                onViewChange={handleViewChange}
                onTodayClick={handleTodayClick}
                upcomingDeadlines={stats.upcomingDeadlines}
            />

            {/* Main Content */}
            <Box sx={{ flex: 1, display: 'flex' }}>
                {/* Calendar View */}
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {renderCalendarView()}
                </Box>
            </Box>

            {/* Action Buttons */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 1000
                }}
            >
                <Tooltip title="Add Event">
                    <Fab
                        onClick={() => {
                            setAddDialogType('event');
                            setIsAddDialogOpen(true);
                        }}
                        sx={{
                            background: 'linear-gradient(135deg, rgba(74,144,226,0.95) 0%, rgba(74,144,226,0.85) 100%)',
                            color: '#ffffff',
                            width: 64,
                            height: 64,
                            boxShadow: '0 8px 32px rgba(74,144,226,0.4), 0 0 0 1px rgba(74,144,226,0.2)',
                            border: '1px solid rgba(74,144,226,0.3)',
                            backdropFilter: 'blur(20px) saturate(180%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, rgba(74,144,226,1) 0%, rgba(74,144,226,0.95) 100%)',
                                transform: 'translateY(-2px) scale(1.05)',
                                boxShadow: '0 12px 40px rgba(74,144,226,0.5), 0 0 0 1px rgba(74,144,226,0.4)',
                            },
                            '&:active': {
                                transform: 'translateY(0) scale(1.02)',
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        <AddIcon sx={{ fontSize: '1.5rem' }} />
                    </Fab>
                </Tooltip>
            </Box>

            {/* Add Event/Task Dialog */}
            <Dialog
                open={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {addDialogType === 'event' ? <EventIcon /> : <TaskIcon />}
                        Add New {addDialogType === 'event' ? 'Event' : 'Task'}
                    </Box>
                </DialogTitle>

                <DialogContent>
                    {addDialogType === 'event' ? (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Event Title"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                                    fullWidth
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Description"
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                                    fullWidth
                                    multiline
                                    rows={3}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <TextField
                                    label="Start Date & Time"
                                    type="datetime-local"
                                    value={formatDateTimeLocal(newEvent.start)}
                                    onChange={(e) => setNewEvent(prev => ({
                                        ...prev,
                                        start: new Date(e.target.value)
                                    }))}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <TextField
                                    label="End Date & Time"
                                    type="datetime-local"
                                    value={formatDateTimeLocal(newEvent.end)}
                                    onChange={(e) => setNewEvent(prev => ({
                                        ...prev,
                                        end: new Date(e.target.value)
                                    }))}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={newEvent.allDay}
                                            onChange={(e) => setNewEvent(prev => ({
                                                ...prev,
                                                allDay: e.target.checked
                                            }))}
                                        />
                                    }
                                    label="All Day Event"
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Event Type</InputLabel>
                                    <Select
                                        value={newEvent.type}
                                        onChange={(e) => setNewEvent(prev => ({
                                            ...prev,
                                            type: e.target.value as EventType
                                        }))}
                                        label="Event Type"
                                    >
                                        {Object.entries(eventTypeConfig).map(([key, config]) => (
                                            <MenuItem key={key} value={key}>
                                                {config.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Priority</InputLabel>
                                    <Select
                                        value={newEvent.priority}
                                        onChange={(e) => setNewEvent(prev => ({
                                            ...prev,
                                            priority: e.target.value as Priority
                                        }))}
                                        label="Priority"
                                    >
                                        {Object.entries(priorityConfig).map(([key, config]) => (
                                            <MenuItem key={key} value={key}>
                                                {config.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={6}>
                                <Autocomplete
                                    options={mockProjects}
                                    getOptionLabel={(option) => option.name}
                                    value={newEvent.project}
                                    onChange={(_, newValue) => setNewEvent(prev => ({
                                        ...prev,
                                        project: newValue
                                    }))}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Project" />
                                    )}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <ContributorSelector
                                    selectedContributor={newEvent.assignee}
                                    onContributorChange={(contributor) => setNewEvent(prev => ({
                                        ...prev,
                                        assignee: contributor
                                    }))}
                                    contributors={contributors}
                                    currentUserContributor={currentUserContributor}
                                    loading={contributorsLoading}
                                    error={contributorsError}
                                    label="Assignee"
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Location"
                                    value={newEvent.location}
                                    onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    ) : (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Task Title"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                    fullWidth
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Description"
                                    value={newTask.description}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                                    fullWidth
                                    multiline
                                    rows={3}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <TextField
                                    label="Due Date & Time"
                                    type="datetime-local"
                                    value={newTask.dueDate.toISOString().slice(0, 16)}
                                    onChange={(e) => setNewTask(prev => ({
                                        ...prev,
                                        dueDate: new Date(e.target.value)
                                    }))}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <TextField
                                    label="Estimated Hours"
                                    type="number"
                                    value={newTask.estimatedHours}
                                    onChange={(e) => setNewTask(prev => ({
                                        ...prev,
                                        estimatedHours: parseInt(e.target.value) || 1
                                    }))}
                                    fullWidth
                                    inputProps={{ min: 0.5, step: 0.5 }}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Task Type</InputLabel>
                                    <Select
                                        value={newTask.type}
                                        onChange={(e) => setNewTask(prev => ({
                                            ...prev,
                                            type: e.target.value as TaskType
                                        }))}
                                        label="Task Type"
                                    >
                                        {Object.entries(taskTypeConfig).map(([key, config]) => (
                                            <MenuItem key={key} value={key}>
                                                {config.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Priority</InputLabel>
                                    <Select
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask(prev => ({
                                            ...prev,
                                            priority: e.target.value as Priority
                                        }))}
                                        label="Priority"
                                    >
                                        {Object.entries(priorityConfig).map(([key, config]) => (
                                            <MenuItem key={key} value={key}>
                                                {config.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={6}>
                                <Autocomplete
                                    options={mockProjects}
                                    getOptionLabel={(option) => option.name}
                                    value={newTask.project}
                                    onChange={(_, newValue) => setNewTask(prev => ({
                                        ...prev,
                                        project: newValue
                                    }))}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Project" />
                                    )}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <ContributorSelector
                                    selectedContributor={newTask.assignee}
                                    onContributorChange={(contributor) => setNewTask(prev => ({
                                        ...prev,
                                        assignee: contributor
                                    }))}
                                    contributors={contributors}
                                    currentUserContributor={currentUserContributor}
                                    loading={contributorsLoading}
                                    error={contributorsError}
                                    label="Assignee"
                                />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setIsAddDialogOpen(false)} disabled={isCreatingEvent}>
                        Cancel
                    </Button>
                    <Button
                        onClick={addDialogType === 'event' ? handleAddEvent : handleAddTask}
                        variant="contained"
                        disabled={
                            isCreatingEvent ||
                            (addDialogType === 'event' ? !newEvent.title : !newTask.title)
                        }
                    >
                        {isCreatingEvent && addDialogType === 'event' ? 'Creating...' : `Add ${addDialogType === 'event' ? 'Event' : 'Task'}`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Event Modal (unified for create and edit) */}
            <EventModal
                open={isEventModalOpen}
                onClose={() => {
                    setIsEventModalOpen(false);
                    setSelectedEvent(null);
                    setEventInitialData(undefined);
                }}
                mode={eventModalMode}
                event={selectedEvent}
                initialData={eventInitialData}
                contributors={contributors}
                currentUserContributor={currentUserContributor}
                contributorsLoading={contributorsLoading}
                contributorsError={contributorsError}
                onSave={handleEventSave}
                onDelete={handleEventDelete}
                isSaving={isCreatingEvent}
            />
        </Box>
    );
}