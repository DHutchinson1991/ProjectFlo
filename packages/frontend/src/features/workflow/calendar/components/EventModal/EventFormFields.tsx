import React from 'react';
import {
    TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel,
    Switch, Autocomplete, Grid, Typography, Box,
} from '@mui/material';
import { CalendarEvent, EventType, Priority, Project } from '@/features/workflow/calendar/types/calendar-types';
import { CrewSelector } from '../CrewSelector';
import { CrewOption } from '@/features/workflow/calendar/hooks/use-crew-members';
import { eventTypeConfig, priorityConfig } from '@/features/workflow/calendar/constants/calendar-config';
import { formatDateTimeLocal } from '../../hooks/use-event-form';

/** Shared dark-theme TextField sx */
const darkInputSx = {
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)', '&.Mui-focused': { color: '#4A90E2' } },
    '& .MuiOutlinedInput-root': {
        borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.05)', color: 'white',
        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
        '&.Mui-focused fieldset': { borderColor: '#4A90E2', boxShadow: '0 0 0 3px rgba(74,144,226,0.1)' },
    },
};

/** Shared dark-theme Select sx */
const darkSelectSx = {
    borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.05)', color: 'white',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4A90E2' },
    '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.7)' },
};

const darkMenuProps = {
    PaperProps: {
        sx: {
            backgroundColor: 'rgba(30,30,35,0.95)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            '& .MuiMenuItem-root': {
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(74,144,226,0.1)' },
                '&.Mui-selected': { backgroundColor: 'rgba(74,144,226,0.2)' },
            },
        },
    },
};

interface FormState {
    title: string;
    description: string;
    start: Date;
    end: Date;
    allDay: boolean;
    type: EventType;
    priority: Priority;
    assignee: CrewOption | null;
    project: Project | null;
    location: string;
}

interface EventFormFieldsProps {
    formData: FormState;
    setFormData: React.Dispatch<React.SetStateAction<FormState>>;
    mode: 'create' | 'edit';
    event?: CalendarEvent | null;
    crew: CrewOption[];
    currentUserCrew: CrewOption | null;
    crewLoading: boolean;
    crewError: string | null;
}

const EventFormFields: React.FC<EventFormFieldsProps> = ({
    formData, setFormData, mode, event,
    crew, currentUserCrew, crewLoading, crewError,
}) => (
    <Grid container spacing={2}>
        <Grid item xs={12}>
            <TextField label="Event Title" value={formData.title} required fullWidth variant="outlined"
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} sx={darkInputSx} />
        </Grid>

        <Grid item xs={12}>
            <TextField label="Description" value={formData.description} multiline rows={2} fullWidth variant="outlined"
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} sx={darkInputSx} />
        </Grid>

        <Grid item xs={6}>
            <TextField label="Start Date & Time" type="datetime-local" value={formatDateTimeLocal(formData.start)}
                fullWidth InputLabelProps={{ shrink: true }} variant="outlined"
                onChange={(e) => setFormData(prev => ({ ...prev, start: new Date(e.target.value) }))} sx={darkInputSx} />
        </Grid>

        <Grid item xs={6}>
            <TextField label="End Date & Time" type="datetime-local" value={formatDateTimeLocal(formData.end)}
                fullWidth InputLabelProps={{ shrink: true }} variant="outlined"
                onChange={(e) => setFormData(prev => ({ ...prev, end: new Date(e.target.value) }))} sx={darkInputSx} />
        </Grid>

        <Grid item xs={6}>
            <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.7)', '&.Mui-focused': { color: '#4A90E2' } }}>Event Type</InputLabel>
                <Select value={formData.type} label="Event Type" sx={darkSelectSx} MenuProps={darkMenuProps}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as EventType }))}>
                    {Object.entries(eventTypeConfig).map(([key, config]) => (
                        <MenuItem key={key} value={key}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: config.color }} />
                                {config.label}
                            </Box>
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Grid>

        <Grid item xs={6}>
            <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.7)', '&.Mui-focused': { color: '#4A90E2' } }}>Priority</InputLabel>
                <Select value={formData.priority} label="Priority" sx={darkSelectSx} MenuProps={darkMenuProps}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Priority }))}>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                        <MenuItem key={key} value={key}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: config.color }} />
                                {config.label}
                            </Box>
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Grid>

        <Grid item xs={12}>
            <TextField label="Location" value={formData.location} fullWidth
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} />
        </Grid>

        <Grid item xs={6}>
            <CrewSelector selectedCrew={formData.assignee}
                onCrewChange={(c) => setFormData(prev => ({ ...prev, assignee: c }))}
                crew={crew} currentUserCrew={currentUserCrew}
                loading={crewLoading} error={crewError} label="Assignee" />
        </Grid>

        <Grid item xs={6}>
            <Autocomplete value={formData.project}
                onChange={(_, v) => setFormData(prev => ({ ...prev, project: v }))}
                options={[] as Project[]} getOptionLabel={(o) => o.name}
                renderInput={(params) => <TextField {...params} label="Project" />}
                renderOption={(props, option) => (
                    <Box component="li" {...props}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: option.color, mr: 1 }} />
                        {option.name}
                    </Box>
                )}
            />
        </Grid>

        <Grid item xs={12}>
            <FormControlLabel
                control={<Switch checked={formData.allDay}
                    onChange={(e) => setFormData(prev => ({ ...prev, allDay: e.target.checked }))}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#4A90E2' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4A90E2' } }} />}
                label={<Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>All Day Event</Typography>}
            />
        </Grid>

        <Grid item xs={6}>
            <TextField label="Location" value={formData.location} fullWidth variant="outlined"
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} sx={darkInputSx} />
        </Grid>

        {mode === 'edit' && event && (
            <Grid item xs={12}>
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>Event Information</Typography>
                    <Grid container spacing={1}>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Status: <strong>{event.status}</strong></Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Created: <strong>{new Date(event.created_at).toLocaleDateString()}</strong></Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Updated: <strong>{new Date(event.updated_at).toLocaleDateString()}</strong></Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Event ID: <strong>{event.id}</strong></Typography>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
        )}
    </Grid>
);

export default EventFormFields;
