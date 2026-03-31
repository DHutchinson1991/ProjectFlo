'use client';

import React from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import {
    CheckCircle, CheckCircleOutline, EditCalendar,
    Delete as DeleteIcon, TimerOutlined, LinkRounded, LocationOn,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { BackendCalendarEvent } from '@/features/workflow/calendar/api';

interface MeetingCardProps {
    meeting: BackendCalendarEvent;
    isConfirmed: boolean;
    isLoading: boolean;
    onToggleConfirm: (meeting: BackendCalendarEvent) => void;
    onReschedule: () => void;
    onDelete: (meetingId: number) => void;
}

const MeetingCard: React.FC<MeetingCardProps> = ({
    meeting, isConfirmed, isLoading,
    onToggleConfirm, onReschedule, onDelete,
}) => {
    const start = new Date(meeting.start_time);
    const end = new Date(meeting.end_time);
    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
    const statusColor = isConfirmed ? '#10b981' : '#f59e0b';

    return (
        <Box sx={{
            borderRadius: 2.5, overflow: 'hidden',
            bgcolor: 'rgba(15,23,42,0.5)',
            border: `1px solid ${isConfirmed ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.1)'}`,
        }}>
            {/* 3-column: Date | Details | Actions */}
            <Box sx={{ display: 'flex', minHeight: 96 }}>
                {/* Col 1: Date block */}
                <Box sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    width: 68, flexShrink: 0,
                    bgcolor: `${statusColor}06`,
                    borderRight: '1px solid rgba(51,65,85,0.1)',
                }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>
                        {format(start, 'EEE')}
                    </Typography>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.15, my: 0.2 }}>
                        {format(start, 'd')}
                    </Typography>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>
                        {format(start, 'MMM')}
                    </Typography>
                </Box>

                {/* Col 2: Details */}
                <Box sx={{ flex: 1, py: 1.5, px: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.75, minWidth: 0 }}>
                    {/* Time */}
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>
                            {format(start, 'h:mm a')}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1 }}>
                            - {format(end, 'h:mm a')}
                        </Typography>
                    </Box>

                    {/* Meta row: duration + type + link */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                            <TimerOutlined sx={{ fontSize: 13, color: '#64748b' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                                {durationMin}m
                            </Typography>
                        </Box>
                        {meeting.meeting_type && (
                            <Chip size="small" label={meeting.meeting_type.replace(/_/g, ' ')} sx={{
                                height: 20, fontSize: '0.65rem', fontWeight: 700,
                                bgcolor: `${statusColor}0a`, color: statusColor,
                                border: `1px solid ${statusColor}18`,
                                '& .MuiChip-label': { px: 0.75 },
                            }} />
                        )}
                        {meeting.meeting_url && (
                            <Typography
                                component="a"
                                href={meeting.meeting_url.startsWith('http') ? meeting.meeting_url : `https://${meeting.meeting_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                    display: 'inline-flex', alignItems: 'center', gap: 0.3,
                                    fontSize: '0.75rem', color: '#3b82f6', fontWeight: 500,
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline', color: '#60a5fa' },
                                }}
                            >
                                <LinkRounded sx={{ fontSize: 14, color: '#3b82f6' }} />
                                link
                            </Typography>
                        )}
                        {meeting.location && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                <LocationOn sx={{ fontSize: 13, color: '#64748b' }} />
                                <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                                    {meeting.location}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Col 3: Labeled action buttons */}
                <Box sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center',
                    gap: 0.5, px: 0.75, py: 0.75, flexShrink: 0,
                    borderLeft: '1px solid rgba(51,65,85,0.08)',
                }}>
                    <Button
                        size="small"
                        startIcon={isConfirmed ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : <CheckCircleOutline sx={{ fontSize: '14px !important' }} />}
                        onClick={() => onToggleConfirm(meeting)}
                        disabled={isLoading}
                        sx={{
                            minWidth: 0, px: 1, py: 0.4,
                            fontSize: '0.65rem', fontWeight: 600, textTransform: 'none',
                            color: statusColor,
                            bgcolor: `${statusColor}0a`,
                            border: `1px solid ${statusColor}18`,
                            borderRadius: 1.5,
                            justifyContent: 'flex-start',
                            '& .MuiButton-startIcon': { mr: 0.5 },
                            '&:hover': { bgcolor: `${statusColor}18` },
                        }}
                    >
                        {isConfirmed ? 'Confirmed' : 'Confirm'}
                    </Button>
                    <Button
                        size="small"
                        startIcon={<EditCalendar sx={{ fontSize: '13px !important' }} />}
                        onClick={onReschedule}
                        disabled={isLoading}
                        sx={{
                            minWidth: 0, px: 1, py: 0.4,
                            fontSize: '0.65rem', fontWeight: 600, textTransform: 'none',
                            color: '#94a3b8',
                            bgcolor: 'rgba(148,163,184,0.06)',
                            border: '1px solid rgba(148,163,184,0.1)',
                            borderRadius: 1.5,
                            justifyContent: 'flex-start',
                            '& .MuiButton-startIcon': { mr: 0.5 },
                            '&:hover': { color: '#f59e0b', bgcolor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.15)' },
                        }}
                    >
                        Reschedule
                    </Button>
                    <Button
                        size="small"
                        startIcon={<DeleteIcon sx={{ fontSize: '13px !important' }} />}
                        onClick={() => onDelete(meeting.id)}
                        disabled={isLoading}
                        sx={{
                            minWidth: 0, px: 1, py: 0.4,
                            fontSize: '0.65rem', fontWeight: 600, textTransform: 'none',
                            color: '#475569',
                            bgcolor: 'rgba(71,85,105,0.06)',
                            border: '1px solid rgba(71,85,105,0.08)',
                            borderRadius: 1.5,
                            justifyContent: 'flex-start',
                            '& .MuiButton-startIcon': { mr: 0.5 },
                            '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.15)' },
                        }}
                    >
                        Delete
                    </Button>
                </Box>
            </Box>

            {/* Bottom status accent */}
            <Box sx={{
                height: 2,
                background: `linear-gradient(90deg, transparent, ${statusColor}60, ${statusColor}, ${statusColor}60, transparent)`,
            }} />
        </Box>
    );
};

export default MeetingCard;
