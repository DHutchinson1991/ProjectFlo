"use client";

import React from 'react';
import { Box, Fab, Tooltip } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import {
    CalendarHeader,
    MonthView,
    WeekView,
    DayView,
    AgendaView,
    EventModal,
    AddEventTaskDialog,
} from '../components';
import { useCalendarPage } from '../hooks/use-calendar-page';

export function CalendarScreen() {
    const {
        currentView,
        refreshKey,
        handleViewChange,
        handleTodayClick,
        handleDateClick,
        events,
        eventsLoading,
        eventsError,
        filteredTasks,
        stats,
        crewMembers,
        currentUserCrewMember,
        crewMembersLoading,
        crewMembersError,
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
        isEventModalOpen,
        eventModalMode,
        selectedEvent,
        eventInitialData,
        handleEventClick,
        handleCreateEvent,
        closeEventModal,
        handleEventSave,
        handleEventDelete,
        handleEventDragUpdate,
        handleTaskClick,
    } = useCalendarPage();

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
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
                color: '#e0e0e0',
            }}
        >
            <CalendarHeader
                currentView={currentView}
                onViewChange={handleViewChange}
                onTodayClick={handleTodayClick}
                upcomingDeadlines={stats.upcomingDeadlines}
            />

            <Box sx={{ flex: 1, display: 'flex' }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{renderCalendarView()}</Box>
            </Box>

            <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
                <Tooltip title="Add Event">
                    <Fab
                        onClick={() => {
                            setAddDialogType('event');
                            setIsAddDialogOpen(true);
                        }}
                        sx={{
                            background:
                                'linear-gradient(135deg, rgba(74,144,226,0.95) 0%, rgba(74,144,226,0.85) 100%)',
                            color: '#ffffff',
                            width: 64,
                            height: 64,
                            boxShadow: '0 8px 32px rgba(74,144,226,0.4), 0 0 0 1px rgba(74,144,226,0.2)',
                            border: '1px solid rgba(74,144,226,0.3)',
                            backdropFilter: 'blur(20px) saturate(180%)',
                            '&:hover': {
                                background:
                                    'linear-gradient(135deg, rgba(74,144,226,1) 0%, rgba(74,144,226,0.95) 100%)',
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

            <AddEventTaskDialog
                open={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                dialogType={addDialogType}
                isCreating={isCreatingEvent}
                newEvent={newEvent}
                setNewEvent={setNewEvent}
                onAddEvent={handleAddEvent}
                newTask={newTask}
                setNewTask={setNewTask}
                onAddTask={handleAddTask}
                contributors={crewMembers}
                currentUserCrewMember={currentUserCrewMember}
                crewMembersLoading={crewMembersLoading}
                crewMembersError={crewMembersError}
            />

            <EventModal
                open={isEventModalOpen}
                onClose={closeEventModal}
                mode={eventModalMode}
                event={selectedEvent}
                initialData={eventInitialData}
                contributors={crewMembers}
                currentUserCrewMember={currentUserCrewMember}
                crewMembersLoading={crewMembersLoading}
                crewMembersError={crewMembersError}
                onSave={handleEventSave}
                onDelete={handleEventDelete}
                isSaving={isCreatingEvent}
            />
        </Box>
    );
}

export default CalendarScreen;
