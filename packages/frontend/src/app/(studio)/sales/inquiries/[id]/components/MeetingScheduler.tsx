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
    IconButton,
    Chip,
    Stack,
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
export interface MeetingFormData {
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
    eventType: EventType;
    defaultDurationMinutes?: number;
    defaultTitle?: string;
    defaultDescription?: string;
    defaultMeetingUrl?: string;
    accentColor?: string;
    scheduleLabel?: string;
    emptyMessage?: string;
}

const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({
    meetings,
    onScheduleMeeting,
    onUpdateMeeting,
    onDeleteMeeting,
    isLoading = false,
    eventType,
    defaultDurationMinutes = 60,
    defaultTitle = '',
    defaultDescription = '',
    defaultMeetingUrl = '',
    accentColor = '#3b82f6',
    scheduleLabel = 'Schedule',
    emptyMessage = 'No meetings scheduled yet',
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
            title: defaultTitle,
            start_time: startTime,
            end_time: endTime,
            event_type: eventType, // Use the fixed event type
            meeting_type: 'VIDEO_CALL',
            meeting_url: defaultMeetingUrl,
            location: '',
            description: defaultDescription,
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
            {/* Schedule Button */}
            <Button
                startIcon={<AddIcon />}
                onClick={handleOpenModal}
                disabled={isLoading}
                fullWidth
                sx={{
                    mb: 2,
                    color: accentColor,
                    bgcolor: `${accentColor}08`,
                    border: `1px solid ${accentColor}18`,
                    borderRadius: 2,
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    py: 0.85,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        bgcolor: `${accentColor}15`,
                        borderColor: `${accentColor}35`,
                        boxShadow: `0 0 16px ${accentColor}10`,
                    },
                }}
            >
                {scheduleLabel}
            </Button>

            {/* Meetings List */}
            {meetings.length === 0 ? (
                <Box sx={{
                    py: 3.5, px: 2, textAlign: 'center', borderRadius: 2,
                    bgcolor: 'rgba(15, 23, 42, 0.25)',
                    border: '1px dashed rgba(51, 65, 85, 0.2)',
                }}>
                    <Typography sx={{ fontSize: '0.76rem', color: '#475569' }}>
                        {emptyMessage}
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={1.5}>
                    {meetings.map((meeting) => (
                        <Box key={meeting.id} sx={{
                            p: 1.5, borderRadius: 2,
                            bgcolor: 'rgba(15, 23, 42, 0.35)',
                            border: '1px solid rgba(51, 65, 85, 0.15)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                bgcolor: 'rgba(15, 23, 42, 0.55)',
                                borderColor: `${accentColor}18`,
                            },
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>
                                            {meeting.title}
                                        </Typography>
                                        {meeting.meeting_type && (
                                            <Chip
                                                size="small"
                                                label={meeting.meeting_type.replace('_', ' ')}
                                                sx={{
                                                    height: 20, fontSize: '0.58rem', fontWeight: 600,
                                                    bgcolor: `${accentColor}10`,
                                                    color: accentColor,
                                                    border: `1px solid ${accentColor}20`,
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', mb: 0.25 }}>
                                        {format(new Date(meeting.start_time), 'PPP p')} \u2013 {format(new Date(meeting.end_time), 'p')}
                                    </Typography>
                                    {meeting.location && (
                                        <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>\ud83d\udccd {meeting.location}</Typography>
                                    )}
                                    {meeting.meeting_url && (
                                        <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>\ud83d\udd17 {meeting.meeting_url}</Typography>
                                    )}
                                    {meeting.description && (
                                        <Typography sx={{ fontSize: '0.68rem', color: '#64748b', mt: 0.5 }}>{meeting.description}</Typography>
                                    )}
                                    {meeting.outcome_notes && (
                                        <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mt: 0.5, fontStyle: 'italic' }}>
                                            <strong>Outcome:</strong> {meeting.outcome_notes}
                                        </Typography>
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.25, ml: 1, flexShrink: 0 }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEditMeeting(meeting)}
                                        disabled={isLoading}
                                        sx={{ color: '#64748b', p: 0.5, '&:hover': { color: accentColor, bgcolor: `${accentColor}10` } }}
                                    >
                                        <EditIcon sx={{ fontSize: 15 }} />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeleteMeeting(meeting.id)}
                                        disabled={isLoading}
                                        sx={{ color: '#64748b', p: 0.5, '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.08)' } }}
                                    >
                                        <DeleteIcon sx={{ fontSize: 15 }} />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Stack>
            )}

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
