'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { MeetingEvent, MeetingFormData, MeetingSchedulerProps } from './types';
import { calculateEndTime, parsePreferredTime } from '@/shared/utils/dateTime';
import { mapMethodToMeetingType } from '@/shared/utils/meeting';
import MeetingListItem from './MeetingListItem';
import MeetingFormDialog from './MeetingFormDialog';

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
    clientPreferredDate,
    clientPreferredTime,
    clientPreferredMethod,
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
        if (formData.event_type === 'discovery_call' || formData.event_type === 'proposal_review') {
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

    const handleSubmit = async () => {
        if (!validateForm()) return;
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

    const handleOpenModal = () => {
        setEditingMeeting(null);

        let startTime: string;
        const prefTime = parsePreferredTime(clientPreferredTime);

        if (clientPreferredDate && prefTime) {
            startTime = `${clientPreferredDate}T${prefTime}`;
        } else if (clientPreferredDate) {
            startTime = `${clientPreferredDate}T09:00`;
        } else {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            startTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        }

        const endTime = calculateEndTime(startTime, defaultDurationMinutes);
        const meetingType = mapMethodToMeetingType(clientPreferredMethod) || 'VIDEO_CALL';

        setFormData({
            title: defaultTitle,
            start_time: startTime,
            end_time: endTime,
            event_type: eventType,
            meeting_type: meetingType,
            meeting_url: defaultMeetingUrl,
            location: '',
            description: defaultDescription,
            assignee_id: undefined,
        });
        setErrors({});
        setIsModalOpen(true);
    };

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

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMeeting(null);
        setErrors({});
    };

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
                        <MeetingListItem
                            key={meeting.id}
                            meeting={meeting}
                            accentColor={accentColor}
                            isLoading={isLoading}
                            onEdit={handleEditMeeting}
                            onDelete={handleDeleteMeeting}
                        />
                    ))}
                </Stack>
            )}

            {/* Meeting Form Dialog */}
            <MeetingFormDialog
                open={isModalOpen}
                onClose={handleCloseModal}
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                isEditing={!!editingMeeting}
                isLoading={isLoading}
                onSubmit={handleSubmit}
                defaultDurationMinutes={defaultDurationMinutes}
            />
        </Box>
    );
};

export default MeetingScheduler;
