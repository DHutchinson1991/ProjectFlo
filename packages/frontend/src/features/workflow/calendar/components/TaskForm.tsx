"use client";

import React from 'react';
import {
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete,
    Grid,
} from '@mui/material';
import type { TaskType, Priority, Project } from '@/features/workflow/calendar/types/calendar-types';
import { CrewMemberSelector } from './CrewMemberSelector';
import type { CrewMemberOption } from '@/features/workflow/calendar/hooks/use-contributors';
import { taskTypeConfig, priorityConfig } from '@/features/workflow/calendar/constants/calendar-config';

export interface TaskFormData {
    title: string;
    description: string;
    dueDate: Date;
    type: TaskType;
    priority: Priority;
    assignee: CrewMemberOption | null;
    project: Project | null;
    estimatedHours: number;
}

interface TaskFormProps {
    newTask: TaskFormData;
    setNewTask: React.Dispatch<React.SetStateAction<TaskFormData>>;
    crewMembers: CrewMemberOption[];
    currentUserCrewMember: CrewMemberOption | null;
    crewMembersLoading: boolean;
    crewMembersError: string | null;
}

export function TaskForm({
    newTask,
    setNewTask,
    crewMembers,
    currentUserCrewMember,
    crewMembersLoading,
    crewMembersError,
}: TaskFormProps) {
    return (
        <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
                <TextField label="Task Title" value={newTask.title} onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))} fullWidth required />
            </Grid>
            <Grid item xs={12}>
                <TextField label="Description" value={newTask.description} onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))} fullWidth multiline rows={3} />
            </Grid>
            <Grid item xs={6}>
                <TextField label="Due Date & Time" type="datetime-local" value={newTask.dueDate.toISOString().slice(0, 16)} onChange={e => setNewTask(prev => ({ ...prev, dueDate: new Date(e.target.value) }))} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
                <TextField label="Estimated Hours" type="number" value={newTask.estimatedHours} onChange={e => setNewTask(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 1 }))} fullWidth inputProps={{ min: 0.5, step: 0.5 }} />
            </Grid>
            <Grid item xs={6}>
                <FormControl fullWidth>
                    <InputLabel>Task Type</InputLabel>
                    <Select value={newTask.type} onChange={e => setNewTask(prev => ({ ...prev, type: e.target.value as TaskType }))} label="Task Type">
                        {Object.entries(taskTypeConfig).map(([k, c]) => <MenuItem key={k} value={k}>{c.label}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={6}>
                <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select value={newTask.priority} onChange={e => setNewTask(prev => ({ ...prev, priority: e.target.value as Priority }))} label="Priority">
                        {Object.entries(priorityConfig).map(([k, c]) => <MenuItem key={k} value={k}>{c.label}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={6}>
                <Autocomplete options={[] as Project[]} getOptionLabel={o => o.name} value={newTask.project} onChange={(_, v) => setNewTask(prev => ({ ...prev, project: v }))} renderInput={p => <TextField {...p} label="Project" />} />
            </Grid>
            <Grid item xs={6}>
                <CrewMemberSelector selectedCrewMember={newTask.assignee} onCrewMemberChange={c => setNewTask(prev => ({ ...prev, assignee: c }))} contributors={crewMembers} currentUserCrewMember={currentUserCrewMember} loading={crewMembersLoading} error={crewMembersError} label="Assignee" />
            </Grid>
        </Grid>
    );
}
