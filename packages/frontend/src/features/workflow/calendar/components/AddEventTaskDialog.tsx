"use client";

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
} from '@mui/material';
import { Event as EventIcon, Task as TaskIcon } from '@mui/icons-material';
import { EventForm } from './EventForm';
import type { EventFormData } from './EventForm';
import { TaskForm } from './TaskForm';
import type { TaskFormData } from './TaskForm';
import type { CrewMemberOption } from '@/features/workflow/calendar/hooks/use-contributors';

export { type EventFormData, type TaskFormData };

interface AddEventTaskDialogProps {
    open: boolean;
    onClose: () => void;
    dialogType: 'event' | 'task';
    isCreating: boolean;
    newEvent: EventFormData;
    setNewEvent: React.Dispatch<React.SetStateAction<EventFormData>>;
    onAddEvent: () => void;
    newTask: TaskFormData;
    setNewTask: React.Dispatch<React.SetStateAction<TaskFormData>>;
    onAddTask: () => void;
    crewMembers: CrewMemberOption[];
    currentUserCrewMember: CrewMemberOption | null;
    crewMembersLoading: boolean;
    crewMembersError: string | null;
}

export default function AddEventTaskDialog({
    open,
    onClose,
    dialogType,
    isCreating,
    newEvent,
    setNewEvent,
    onAddEvent,
    newTask,
    setNewTask,
    onAddTask,
    crewMembers,
    currentUserCrewMember,
    crewMembersLoading,
    crewMembersError,
}: AddEventTaskDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {dialogType === 'event' ? <EventIcon /> : <TaskIcon />}
                    Add New {dialogType === 'event' ? 'Event' : 'Task'}
                </Box>
            </DialogTitle>

            <DialogContent>
                {dialogType === 'event' ? (
                    <EventForm
                        newEvent={newEvent}
                        setNewEvent={setNewEvent}
                        contributors={crewMembers}
                        currentUserCrewMember={currentUserCrewMember}
                        crewMembersLoading={crewMembersLoading}
                        crewMembersError={crewMembersError}
                    />
                ) : (
                    <TaskForm
                        newTask={newTask}
                        setNewTask={setNewTask}
                        contributors={crewMembers}
                        currentUserCrewMember={currentUserCrewMember}
                        crewMembersLoading={crewMembersLoading}
                        crewMembersError={crewMembersError}
                    />
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={isCreating}>Cancel</Button>
                <Button
                    onClick={dialogType === 'event' ? onAddEvent : onAddTask}
                    variant="contained"
                    disabled={isCreating || (dialogType === 'event' ? !newEvent.title : !newTask.title)}
                >
                    {isCreating && dialogType === 'event' ? 'Creating...' : `Add ${dialogType === 'event' ? 'Event' : 'Task'}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
