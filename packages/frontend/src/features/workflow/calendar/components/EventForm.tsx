"use client";

import React from 'react';
import {
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Autocomplete,
    Grid,
} from '@mui/material';
import type { EventType, Priority, Project } from '@/features/workflow/calendar/types/calendar-types';
import { ContributorSelector } from './ContributorSelector';
import type { ContributorOption } from '@/features/workflow/calendar/hooks/use-contributors';
import { eventTypeConfig, priorityConfig } from '@/features/workflow/calendar/constants/calendar-config';

function formatDateTimeLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${hh}:${mm}`;
}

export interface EventFormData {
    title: string;
    description: string;
    start: Date;
    end: Date;
    allDay: boolean;
    type: EventType;
    priority: Priority;
    assignee: ContributorOption | null;
    project: Project | null;
    location: string;
}

interface EventFormProps {
    newEvent: EventFormData;
    setNewEvent: React.Dispatch<React.SetStateAction<EventFormData>>;
    contributors: ContributorOption[];
    currentUserContributor: ContributorOption | null;
    contributorsLoading: boolean;
    contributorsError: string | null;
}

export function EventForm({
    newEvent,
    setNewEvent,
    contributors,
    currentUserContributor,
    contributorsLoading,
    contributorsError,
}: EventFormProps) {
    return (
        <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
                <TextField label="Event Title" value={newEvent.title} onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))} fullWidth required />
            </Grid>
            <Grid item xs={12}>
                <TextField label="Description" value={newEvent.description} onChange={e => setNewEvent(prev => ({ ...prev, description: e.target.value }))} fullWidth multiline rows={3} />
            </Grid>
            <Grid item xs={6}>
                <TextField label="Start Date & Time" type="datetime-local" value={formatDateTimeLocal(newEvent.start)} onChange={e => setNewEvent(prev => ({ ...prev, start: new Date(e.target.value) }))} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
                <TextField label="End Date & Time" type="datetime-local" value={formatDateTimeLocal(newEvent.end)} onChange={e => setNewEvent(prev => ({ ...prev, end: new Date(e.target.value) }))} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
                <FormControlLabel
                    control={<Switch checked={newEvent.allDay} onChange={e => setNewEvent(prev => ({ ...prev, allDay: e.target.checked }))} />}
                    label="All Day Event"
                />
            </Grid>
            <Grid item xs={6}>
                <FormControl fullWidth>
                    <InputLabel>Event Type</InputLabel>
                    <Select value={newEvent.type} onChange={e => setNewEvent(prev => ({ ...prev, type: e.target.value as EventType }))} label="Event Type">
                        {Object.entries(eventTypeConfig).map(([k, c]) => <MenuItem key={k} value={k}>{c.label}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={6}>
                <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select value={newEvent.priority} onChange={e => setNewEvent(prev => ({ ...prev, priority: e.target.value as Priority }))} label="Priority">
                        {Object.entries(priorityConfig).map(([k, c]) => <MenuItem key={k} value={k}>{c.label}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={6}>
                <Autocomplete options={[] as Project[]} getOptionLabel={o => o.name} value={newEvent.project} onChange={(_, v) => setNewEvent(prev => ({ ...prev, project: v }))} renderInput={p => <TextField {...p} label="Project" />} />
            </Grid>
            <Grid item xs={6}>
                <ContributorSelector selectedContributor={newEvent.assignee} onContributorChange={c => setNewEvent(prev => ({ ...prev, assignee: c }))} contributors={contributors} currentUserContributor={currentUserContributor} loading={contributorsLoading} error={contributorsError} label="Assignee" required />
            </Grid>
            <Grid item xs={12}>
                <TextField label="Location" value={newEvent.location} onChange={e => setNewEvent(prev => ({ ...prev, location: e.target.value }))} fullWidth />
            </Grid>
        </Grid>
    );
}
