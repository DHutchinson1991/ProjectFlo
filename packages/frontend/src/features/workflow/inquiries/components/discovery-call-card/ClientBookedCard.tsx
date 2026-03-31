'use client';

import React from 'react';
import { Box, Typography, Stack, Button } from '@mui/material';
import { AccessTime, CalendarToday, EventAvailable, EditCalendar } from '@mui/icons-material';
import { formatSlotLabel, getMethodIcon } from './helpers';

interface ClientBookedCardProps {
    reqDate: string;
    reqTime: string;
    reqMethod?: string;
    isLoading: boolean;
    onConfirm: () => void;
    onReschedule: () => void;
}

const ClientBookedCard: React.FC<ClientBookedCardProps> = ({
    reqDate, reqTime, reqMethod, isLoading,
    onConfirm, onReschedule,
}) => {
    const d = new Date(reqDate + 'T00:00:00');

    return (
        <Box>
            {/* Banner */}
            <Box sx={{
                mb: 2, p: 1.5, borderRadius: 2.5, position: 'relative', overflow: 'hidden',
                bgcolor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)',
            }}>
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, bgcolor: '#10b981', opacity: 0.5 }} />
                <Typography sx={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700 }}>
                    Client booked a discovery call
                </Typography>
                <Typography sx={{ fontSize: '0.66rem', color: '#64748b', mt: 0.25 }}>
                    Confirm the slot or propose a new time
                </Typography>
            </Box>

            {/* Two-column slot display */}
            <Box sx={{
                mb: 2, borderRadius: 3, overflow: 'hidden',
                bgcolor: 'rgba(15,23,42,0.4)', border: '1px solid rgba(51,65,85,0.15)',
                display: 'flex',
            }}>
                {/* Date column */}
                <Box sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minWidth: 80, py: 2, px: 1.5,
                    bgcolor: 'rgba(59,130,246,0.05)',
                    borderRight: '1px solid rgba(51,65,85,0.12)',
                }}>
                    <CalendarToday sx={{ fontSize: 15, color: '#3b82f6', mb: 0.5, opacity: 0.7 }} />
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>
                        {d.toLocaleDateString(undefined, { weekday: 'short' })}
                    </Typography>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>
                        {d.getDate()}
                    </Typography>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>
                        {d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </Typography>
                </Box>

                {/* Details column */}
                <Box sx={{ flex: 1, py: 2, px: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
                    {/* Time */}
                    <Box sx={{
                        display: 'inline-flex', alignItems: 'center', gap: 0.5, alignSelf: 'flex-start',
                        px: 1.25, py: 0.5, borderRadius: '8px',
                        bgcolor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.12)',
                    }}>
                        <AccessTime sx={{ fontSize: 13, color: '#3b82f6' }} />
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9' }}>
                            {formatSlotLabel(reqTime)}
                        </Typography>
                    </Box>

                    {/* Method */}
                    {reqMethod && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            {getMethodIcon(reqMethod)}
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#e2e8f0' }}>
                                {reqMethod}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            <Stack direction="row" spacing={1}>
                <Button
                    startIcon={<EventAvailable sx={{ fontSize: 15 }} />}
                    onClick={onConfirm}
                    disabled={isLoading}
                    fullWidth
                    sx={{
                        color: '#10b981', bgcolor: 'rgba(16,185,129,0.07)',
                        border: '1px solid rgba(16,185,129,0.15)',
                        borderRadius: 2.5, fontSize: '0.74rem', fontWeight: 700,
                        textTransform: 'none', py: 0.9,
                        '&:hover': { bgcolor: 'rgba(16,185,129,0.14)', borderColor: 'rgba(16,185,129,0.3)', boxShadow: '0 0 20px rgba(16,185,129,0.08)' },
                    }}
                >
                    Confirm
                </Button>
                <Button
                    startIcon={<EditCalendar sx={{ fontSize: 15 }} />}
                    onClick={onReschedule}
                    disabled={isLoading}
                    fullWidth
                    sx={{
                        color: '#f59e0b', bgcolor: 'rgba(245,158,11,0.07)',
                        border: '1px solid rgba(245,158,11,0.15)',
                        borderRadius: 2.5, fontSize: '0.74rem', fontWeight: 700,
                        textTransform: 'none', py: 0.9,
                        '&:hover': { bgcolor: 'rgba(245,158,11,0.14)', borderColor: 'rgba(245,158,11,0.3)', boxShadow: '0 0 20px rgba(245,158,11,0.08)' },
                    }}
                >
                    Reschedule
                </Button>
            </Stack>
        </Box>
    );
};

export default ClientBookedCard;
