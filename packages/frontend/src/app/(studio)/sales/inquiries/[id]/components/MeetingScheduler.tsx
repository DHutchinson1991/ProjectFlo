'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Paper,
    Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { EventType, MeetingType } from '../../../../calendar/types';

// Meeting event interface
interface MeetingEvent {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    event_type: EventType;
    meeting_type?: MeetingType;
    meeting_url?: string;
    location?: string;
    description?: string;
    outcome_notes?: string;
    assignee_id?: number;
    inquiry_id?: number;
}

// Form data interface
interface MeetingFormData {
    title: string;
    start_time: string;
    end_time: string;
    event_type: EventType;
    meeting_type?: MeetingType;
    meeting_url?: string;
    location?: string;
    description?: string;
    assignee_id?: number;
}

// Component props interface
interface MeetingSchedulerProps {
    meetings: MeetingEvent[];
    onScheduleMeeting: (meetingData: MeetingFormData) => Promise<void>;
    onUpdateMeeting: (meetingId: number, meetingData: Partial<MeetingFormData>) => Promise<void>;
    onDeleteMeeting: (meetingId: number) => Promise<void>;
    isLoading?: boolean;
    eventType: EventType; // Fixed event type for this scheduler
    defaultDurationMinutes?: number; // Default meeting duration in minutes
}

const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({
    meetings,
    onScheduleMeeting,
    onUpdateMeeting,
    onDeleteMeeting,
    isLoading = false,
    eventType,
    defaultDurationMinutes = 60
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<MeetingEvent | null>(null);
    const [formData, setFormData] = useState<MeetingFormData>({
        title: '',
        start_time: '',
        end_time: '',
        event_type: eventType,
        meeting_type: 'ONLINE',
        meeting_url: '',
        location: '',
        description: '',
        assignee_id: undefined,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Helper function to calculate end time based on start time and duration
    const calculateEndTime = (startTime: string, durationMinutes: number): string => {
        if (!startTime) return '';
        const start = new Date(startTime);
        const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

        // Format for datetime-local input (local time, not UTC)
        const year = end.getFullYear();
        const month = String(end.getMonth() + 1).padStart(2, '0');
        const day = String(end.getDate()).padStart(2, '0');
        const hours = String(end.getHours()).padStart(2, '0');
        const minutes = String(end.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Helper functions for styling
    const getEventTypeColor = (eventType: EventType): 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
        switch (eventType) {
            case 'discovery_call':
                return 'primary';
            case 'consultation':
                return 'success';
            default:
                return 'secondary';
        }
    };

    const getMeetingTypeColor = (meetingType?: MeetingType): 'primary' | 'secondary' | 'success' | 'warning' => {
        switch (meetingType) {
            case 'ONLINE':
            case 'VIDEO_CALL':
                return 'primary';
            case 'PHONE_CALL':
                return 'warning';
            case 'IN_PERSON':
                return 'success';
            default:
                return 'secondary';
        }
    };

    // Form validation
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.start_time) {
            newErrors.start_time = 'Start time is required';
        }

        if (!formData.end_time) {
            newErrors.end_time = 'End time is required';
        }

        if (formData.start_time && formData.end_time && new Date(formData.start_time) >= new Date(formData.end_time)) {
            newErrors.end_time = 'End time must be after start time';
        }

        if (formData.event_type === 'discovery_call' || formData.event_type === 'consultation') {
            if (!formData.meeting_type) {
                newErrors.meeting_type = 'Meeting type is required';
            }

            if (formData.meeting_type === 'ONLINE' || formData.meeting_type === 'VIDEO_CALL') {
                if (!formData.meeting_url?.trim()) {
                    newErrors.meeting_url = 'Meeting URL is required for online meetings';
                }
            }

            if (formData.meeting_type === 'IN_PERSON' && !formData.location?.trim()) {
                newErrors.location = 'Location is required for in-person meetings';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            if (editingMeeting) {
                await onUpdateMeeting(editingMeeting.id, formData);
            } else {
                await onScheduleMeeting(formData);
            }
            handleCloseModal();
        } catch (error) {
            console.error('Error saving meeting:', error);
        }
    };

    // Handle opening modal for new meeting
    const handleOpenModal = () => {
        setEditingMeeting(null);
        const now = new Date();

        // Format current time for datetime-local input (local time, not UTC)
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        const startTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        const endTime = calculateEndTime(startTime, defaultDurationMinutes);

        setFormData({
            title: '',
            start_time: startTime,
            end_time: endTime,
            event_type: eventType, // Use the fixed event type
            meeting_type: 'ONLINE',
            meeting_url: '',
            location: '',
            description: '',
            assignee_id: undefined,
        });
        setErrors({});
        setIsModalOpen(true);
    };

    // Handle opening modal for editing
    const handleEditMeeting = (meeting: MeetingEvent) => {
        setEditingMeeting(meeting);
        setFormData({
            title: meeting.title,
            start_time: meeting.start_time,
            end_time: meeting.end_time,
            event_type: meeting.event_type,
            meeting_type: meeting.meeting_type,
            meeting_url: meeting.meeting_url || '',
            location: meeting.location || '',
            description: meeting.description || '',
            assignee_id: meeting.assignee_id,
        });
        setErrors({});
        setIsModalOpen(true);
    };

    // Handle closing modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMeeting(null);
        setErrors({});
    };

    // Handle deleting meeting
    const handleDeleteMeeting = async (meetingId: number) => {
        if (window.confirm('Are you sure you want to delete this meeting?')) {
            try {
                await onDeleteMeeting(meetingId);
            } catch (error) {
                console.error('Error deleting meeting:', error);
            }
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                    Discovery Calls & Consultations
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenModal}
                    disabled={isLoading}
                >
                    Schedule Meeting
                </Button>
            </Box>

            {/* Meetings List */}
            <Paper elevation={1}>
                {meetings.length === 0 ? (
                    <Box p={3} textAlign="center">
                        <Typography variant="body2" color="text.secondary">
                            No meetings scheduled yet. Click &quot;Schedule Meeting&quot; to add a discovery call or consultation.
                        </Typography>
                    </Box>
                ) : (
                    <List>
                        {meetings.map((meeting, index) => (
                            <React.Fragment key={meeting.id}>
                                <ListItem>
                                    <ListItemText
                                        primary={
                                            <>
                                                <Typography variant="subtitle1" component="span">
                                                    {meeting.title}
                                                </Typography>
                                                <Box component="span" sx={{ ml: 1 }}>
                                                    <Chip
                                                        size="small"
                                                        label={meeting.event_type.replace('_', ' ').toUpperCase()}
                                                        color={getEventTypeColor(meeting.event_type)}
                                                    />
                                                    {meeting.meeting_type && (
                                                        <Chip
                                                            size="small"
                                                            label={meeting.meeting_type.replace('_', ' ')}
                                                            color={getMeetingTypeColor(meeting.meeting_type)}
                                                            variant="outlined"
                                                            sx={{ ml: 0.5 }}
                                                        />
                                                    )}
                                                </Box>
                                            </>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" color="text.secondary" component="span" display="block">
                                                    {format(new Date(meeting.start_time), 'PPP p')} - {format(new Date(meeting.end_time), 'p')}
                                                </Typography>
                                                {meeting.location && (
                                                    <Typography variant="body2" color="text.secondary" component="span" display="block">
                                                        📍 {meeting.location}
                                                    </Typography>
                                                )}
                                                {meeting.meeting_url && (
                                                    <Typography variant="body2" color="text.secondary" component="span" display="block">
                                                        🔗 {meeting.meeting_url}
                                                    </Typography>
                                                )}
                                                {meeting.description && (
                                                    <Typography variant="body2" color="text.secondary" component="span" display="block">
                                                        {meeting.description}
                                                    </Typography>
                                                )}
                                                {meeting.outcome_notes && (
                                                    <Typography variant="body2" color="text.primary" component="span" display="block" sx={{ mt: 1 }}>
                                                        <strong>Outcome:</strong> {meeting.outcome_notes}
                                                    </Typography>
                                                )}
                                            </>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleEditMeeting(meeting)}
                                            disabled={isLoading}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleDeleteMeeting(meeting.id)}
                                            disabled={isLoading}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < meetings.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Meeting Form Modal */}
            <Dialog
                open={isModalOpen}
                onClose={handleCloseModal}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        {/* Title */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Meeting Title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                error={!!errors.title}
                                helperText={errors.title}
                                required
                            />
                        </Grid>

                        {/* Event Type - Hidden and readonly */}
                        <input type="hidden" value={formData.event_type} />

                        {/* Meeting Method - Full width since event type is hidden */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required error={!!errors.meeting_type}>
                                <InputLabel>Meeting Method</InputLabel>
                                <Select
                                    value={formData.meeting_type || ''}
                                    label="Meeting Method"
                                    onChange={(e) => setFormData({ ...formData, meeting_type: e.target.value as MeetingType })}
                                >
                                    <MenuItem value="ONLINE">Online</MenuItem>
                                    <MenuItem value="VIDEO_CALL">Video Call</MenuItem>
                                    <MenuItem value="PHONE_CALL">Phone Call</MenuItem>
                                    <MenuItem value="IN_PERSON">In Person</MenuItem>
                                </Select>
                                {errors.meeting_type && (
                                    <Typography variant="caption" color="error">
                                        {errors.meeting_type}
                                    </Typography>
                                )}
                            </FormControl>
                        </Grid>

                        {/* Start Time */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="datetime-local"
                                label="Start Time"
                                value={formData.start_time}
                                onChange={(e) => {
                                    const newStartTime = e.target.value;
                                    const newEndTime = calculateEndTime(newStartTime, defaultDurationMinutes);
                                    setFormData({
                                        ...formData,
                                        start_time: newStartTime,
                                        end_time: newEndTime
                                    });
                                }}
                                error={!!errors.start_time}
                                helperText={errors.start_time}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>

                        {/* End Time */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="datetime-local"
                                label="End Time"
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                error={!!errors.end_time}
                                helperText={errors.end_time}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>

                        {/* Meeting URL (for online meetings) */}
                        {(formData.meeting_type === 'ONLINE' || formData.meeting_type === 'VIDEO_CALL') && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Meeting URL"
                                    value={formData.meeting_url}
                                    onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                                    error={!!errors.meeting_url}
                                    helperText={errors.meeting_url}
                                    placeholder="https://zoom.us/j/..."
                                    required
                                />
                            </Grid>
                        )}

                        {/* Location (for in-person meetings) */}
                        {formData.meeting_type === 'IN_PERSON' && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    error={!!errors.location}
                                    helperText={errors.location}
                                    placeholder="Meeting address or location"
                                    required
                                />
                            </Grid>
                        )}

                        {/* Description */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Description (Optional)"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Meeting agenda, topics to discuss, etc."
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MeetingScheduler;
