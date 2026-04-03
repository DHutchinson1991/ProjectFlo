import React from 'react';
import { format } from 'date-fns';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { MeetingEvent } from './types';

interface MeetingListItemProps {
    meeting: MeetingEvent;
    accentColor: string;
    isLoading: boolean;
    onEdit: (meeting: MeetingEvent) => void;
    onDelete: (meetingId: number) => void;
}

const MeetingListItem: React.FC<MeetingListItemProps> = ({
    meeting,
    accentColor,
    isLoading,
    onEdit,
    onDelete,
}) => (
    <Box sx={{
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
                    {format(new Date(meeting.start_time), 'PPP p')} – {format(new Date(meeting.end_time), 'p')}
                </Typography>
                {meeting.location && (
                    <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>📍 {meeting.location}</Typography>
                )}
                {meeting.meeting_url && (
                    <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>🔗 {meeting.meeting_url}</Typography>
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
                    onClick={() => onEdit(meeting)}
                    disabled={isLoading}
                    sx={{ color: '#64748b', p: 0.5, '&:hover': { color: accentColor, bgcolor: `${accentColor}10` } }}
                >
                    <EditIcon sx={{ fontSize: 15 }} />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => onDelete(meeting.id)}
                    disabled={isLoading}
                    sx={{ color: '#64748b', p: 0.5, '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.08)' } }}
                >
                    <DeleteIcon sx={{ fontSize: 15 }} />
                </IconButton>
            </Box>
        </Box>
    </Box>
);

export default MeetingListItem;
