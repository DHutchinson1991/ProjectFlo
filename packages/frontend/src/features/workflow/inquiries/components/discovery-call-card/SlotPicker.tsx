'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Stack, Button, CircularProgress } from '@mui/material';
import { AccessTime } from '@mui/icons-material';
import { calendarApi } from '@/features/workflow/calendar/api';
import { formatSlotLabel } from '@/shared/utils/dateTime';
import { chipBounce, type SlotInfo } from './helpers';

interface SlotPickerProps {
    brandId: number;
    initialDate?: string;
    duration: number;
    accentColor?: string;
    onSelect: (date: string, time: string, crewMemberId?: number) => void;
    onCancel: () => void;
    isLoading?: boolean;
    confirmLabel?: string;
    showCancel?: boolean;
}

const SlotPicker: React.FC<SlotPickerProps> = ({
    brandId, initialDate, duration, accentColor = '#f59e0b',
    onSelect, onCancel, isLoading: parentLoading,
    confirmLabel = 'Confirm New Time', showCancel = true,
}) => {
    const [selectedDate, setSelectedDate] = useState(initialDate || '');
    const [selectedTime, setSelectedTime] = useState('');
    const [selectedCrewMember, setSelectedCrewMember] = useState<number | undefined>();
    const [slots, setSlots] = useState<SlotInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [unavailableReason, setUnavailableReason] = useState<string | null>(null);

    const fetchSlots = useCallback(async (date: string) => {
        setLoading(true);
        setSlots([]);
        setSelectedTime('');
        setUnavailableReason(null);
        try {
            const res = await calendarApi.getDiscoveryCallSlots(brandId, date);
            setSlots(res.slots || []);
            if (res.unavailable_reason) setUnavailableReason(res.unavailable_reason);
        } catch {
            setUnavailableReason('error');
        } finally {
            setLoading(false);
        }
    }, [brandId]);

    useEffect(() => {
        if (selectedDate) fetchSlots(selectedDate);
    }, [selectedDate, fetchSlots]);

    const availableSlots = slots.filter(s => s.available);
    const hasSlots = availableSlots.length > 0;

    // Build 14 upcoming days for date selector
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingDays: string[] = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        upcomingDays.push(`${yyyy}-${mm}-${dd}`);
    }

    return (
        <Box sx={{ mt: 1 }}>
            {/* Date selector -- scrollable row of day chips */}
            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
                Pick a date
            </Typography>
            <Box sx={{
                display: 'flex', gap: 0.75, overflowX: 'auto', pb: 1, mb: 1.5,
                '&::-webkit-scrollbar': { height: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(148,163,184,0.2)', borderRadius: 2 },
            }}>
                {upcomingDays.map((day) => {
                    const d = new Date(day + 'T00:00:00');
                    const active = selectedDate === day;
                    return (
                        <Box
                            key={day}
                            onClick={() => setSelectedDate(day)}
                            sx={{
                                minWidth: 56, py: 0.75, px: 1, borderRadius: '10px', textAlign: 'center',
                                cursor: 'pointer', userSelect: 'none', flexShrink: 0,
                                border: `1.5px solid ${active ? accentColor : 'rgba(51,65,85,0.2)'}`,
                                bgcolor: active ? `${accentColor}14` : 'rgba(15,23,42,0.25)',
                                transition: 'all 0.2s ease',
                                animation: active ? `${chipBounce} 0.25s ease-out` : 'none',
                                '&:hover': { borderColor: `${accentColor}60` },
                            }}
                        >
                            <Typography sx={{ fontSize: '0.6rem', color: active ? accentColor : '#64748b', fontWeight: 600, lineHeight: 1 }}>
                                {d.toLocaleDateString(undefined, { weekday: 'short' })}
                            </Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: active ? '#e2e8f0' : '#94a3b8', fontWeight: active ? 700 : 500, lineHeight: 1.3 }}>
                                {d.getDate()}
                            </Typography>
                            <Typography sx={{ fontSize: '0.55rem', color: active ? accentColor : '#64748b', fontWeight: 500, lineHeight: 1 }}>
                                {d.toLocaleDateString(undefined, { month: 'short' })}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>

            {/* Slot grid */}
            {selectedDate && (
                <Box>
                    <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
                        Available times
                        {duration > 0 && (
                            <Typography component="span" sx={{ color: 'rgba(100,116,139,0.6)', fontSize: '0.55rem', fontWeight: 400, ml: 0.75, letterSpacing: 0, textTransform: 'none' }}>
                                ({duration} min each)
                            </Typography>
                        )}
                    </Typography>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={20} sx={{ color: accentColor }} />
                        </Box>
                    ) : unavailableReason && !hasSlots ? (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography sx={{ color: 'rgba(226,232,240,0.45)', fontSize: '0.74rem' }}>
                                {unavailableReason === 'not_available_day'
                                    ? 'Not available on this day -- try another.'
                                    : 'No slots available -- try another date.'}
                            </Typography>
                        </Box>
                    ) : !hasSlots ? (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography sx={{ color: 'rgba(226,232,240,0.45)', fontSize: '0.74rem' }}>
                                No slots available on this date.
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75 }}>
                            {slots.map((slot) => {
                                const active = selectedTime === slot.time;
                                return (
                                    <Box
                                        key={slot.time}
                                        onClick={() => {
                                            if (!slot.available) return;
                                            setSelectedTime(slot.time);
                                            setSelectedCrewMember(slot.operator_id);
                                        }}
                                        sx={{
                                            py: 1, px: 0.75, borderRadius: '10px', textAlign: 'center',
                                            cursor: slot.available ? 'pointer' : 'default',
                                            userSelect: 'none',
                                            border: `1.5px solid ${active ? accentColor : slot.available ? 'rgba(51,65,85,0.3)' : 'rgba(51,65,85,0.1)'}`,
                                            bgcolor: active ? `${accentColor}14` : slot.available ? 'rgba(15,23,42,0.25)' : 'rgba(15,23,42,0.12)',
                                            opacity: slot.available ? 1 : 0.35,
                                            transition: 'all 0.2s ease',
                                            animation: active ? `${chipBounce} 0.25s ease-out` : 'none',
                                            '&:hover': slot.available ? { borderColor: `${accentColor}60`, bgcolor: `${accentColor}08` } : {},
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4 }}>
                                            <AccessTime sx={{ fontSize: 12, color: active ? accentColor : '#64748b', transition: 'color 0.2s' }} />
                                            <Typography sx={{
                                                fontSize: '0.74rem', fontWeight: active ? 700 : 500,
                                                color: active ? accentColor : slot.available ? '#e2e8f0' : '#64748b',
                                                transition: 'color 0.2s',
                                            }}>
                                                {formatSlotLabel(slot.time)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            )}

            {/* Action buttons */}
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                {showCancel && (
                    <Button
                        onClick={onCancel}
                        fullWidth
                        sx={{
                            color: '#94a3b8', bgcolor: 'rgba(148,163,184,0.06)',
                            border: '1px solid rgba(148,163,184,0.12)',
                            borderRadius: 2, fontSize: '0.74rem', fontWeight: 600,
                            textTransform: 'none', py: 0.75,
                        }}
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    onClick={() => onSelect(selectedDate, selectedTime, selectedCrewMember)}
                    disabled={!selectedDate || !selectedTime || parentLoading}
                    fullWidth
                    sx={{
                        color: '#10b981', bgcolor: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.18)',
                        borderRadius: 2, fontSize: '0.74rem', fontWeight: 600,
                        textTransform: 'none', py: 0.75,
                        '&:hover': { bgcolor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.35)' },
                        '&.Mui-disabled': { color: 'rgba(16,185,129,0.3)', borderColor: 'rgba(16,185,129,0.08)' },
                    }}
                >
                    {confirmLabel}
                </Button>
            </Stack>
        </Box>
    );
};

export default SlotPicker;
