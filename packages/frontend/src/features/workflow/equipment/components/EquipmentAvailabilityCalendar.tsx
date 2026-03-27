import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Chip,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    CalendarToday as CalendarIcon,
    NavigateBefore as PrevIcon,
    NavigateNext as NextIcon,
} from '@mui/icons-material';
import { useEquipmentAvailability, type EquipmentAvailabilitySlot } from '../hooks';

interface EquipmentAvailabilityCalendarProps {
    equipmentId: number;
    equipmentName: string;
}

const STATUS_COLORS = {
    AVAILABLE: '#10b981',
    BOOKED: '#f59e0b',
    IN_USE: '#ef4444',
    UNAVAILABLE: '#6b7280',
    TENTATIVE: '#8b5cf6',
};

const STATUS_LABELS = {
    AVAILABLE: 'Available',
    BOOKED: 'Booked',
    IN_USE: 'In Use',
    UNAVAILABLE: 'Unavailable',
    TENTATIVE: 'Tentative',
};

export default function EquipmentAvailabilityCalendar({ equipmentId, equipmentName }: EquipmentAvailabilityCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const { availabilitySlots, loading, error } = useEquipmentAvailability(equipmentId, currentDate, statusFilter);

    // Navigation handlers
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Helper function to determine day status
    const getDayStatus = (date: Date, slots: EquipmentAvailabilitySlot[]) => {
        if (slots.length === 0) {
            // No explicit slots = default to AVAILABLE
            return {
                status: 'AVAILABLE' as const,
                isDefault: true,
                slots: []
            };
        }

        // Find the most restrictive status for this day
        const statuses = slots.map(slot => slot.status);

        if (statuses.includes('UNAVAILABLE')) {
            return {
                status: 'UNAVAILABLE' as const,
                isDefault: false,
                slots: slots.filter(slot => slot.status === 'UNAVAILABLE')
            };
        }

        if (statuses.includes('IN_USE')) {
            return {
                status: 'IN_USE' as const,
                isDefault: false,
                slots: slots.filter(slot => slot.status === 'IN_USE')
            };
        }

        if (statuses.includes('BOOKED')) {
            return {
                status: 'BOOKED' as const,
                isDefault: false,
                slots: slots.filter(slot => slot.status === 'BOOKED')
            };
        }

        if (statuses.includes('TENTATIVE')) {
            return {
                status: 'TENTATIVE' as const,
                isDefault: false,
                slots: slots.filter(slot => slot.status === 'TENTATIVE')
            };
        }

        // Default to available if only explicit AVAILABLE slots
        return {
            status: 'AVAILABLE' as const,
            isDefault: false,
            slots: slots
        };
    };

    // Calendar generation
    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

        const days = [];
        const currentDateObj = new Date(startDate);

        // Generate 42 days (6 weeks)
        for (let i = 0; i < 42; i++) {
            const daySlots = availabilitySlots.filter(slot => {
                const slotDate = new Date(slot.start_date);
                return slotDate.toDateString() === currentDateObj.toDateString();
            });

            const dayStatus = getDayStatus(currentDateObj, daySlots);

            days.push({
                date: new Date(currentDateObj),
                isCurrentMonth: currentDateObj.getMonth() === month,
                isToday: currentDateObj.toDateString() === new Date().toDateString(),
                slots: daySlots,
                status: dayStatus.status,
                isDefaultStatus: dayStatus.isDefault,
                primarySlots: dayStatus.slots
            });

            currentDateObj.setDate(currentDateObj.getDate() + 1);
        }

        return days;
    };

    const calendarDays = generateCalendarDays();
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (loading) {
        return (
            <Card sx={{
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                border: '1px solid rgba(52, 58, 68, 0.3)',
                background: 'rgba(16, 18, 22, 0.95)',
                backdropFilter: 'blur(10px)',
                mt: 3,
            }}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                        <CircularProgress size={40} sx={{ color: '#9ca3af' }} />
                        <Typography sx={{ ml: 2, color: '#9ca3af' }}>Loading availability calendar...</Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            border: '1px solid rgba(52, 58, 68, 0.3)',
            background: 'rgba(16, 18, 22, 0.95)',
            backdropFilter: 'blur(10px)',
            mt: 3,
        }}>
            <CardContent sx={{ p: 4 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarIcon sx={{ mr: 2, color: '#9ca3af', fontSize: 28 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                            Availability Calendar
                        </Typography>
                    </Box>

                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel sx={{ color: '#9ca3af' }}>Filter Status</InputLabel>
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            label="Filter Status"
                            sx={{
                                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(75, 85, 99, 0.6)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#6b7280',
                                },
                                '& .MuiSelect-select': {
                                    color: '#f3f4f6'
                                }
                            }}
                        >
                            <MenuItem value="ALL">All Status</MenuItem>
                            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                <MenuItem key={key} value={key}>
                                    <Chip
                                        label={label}
                                        size="small"
                                        sx={{
                                            backgroundColor: alpha(STATUS_COLORS[key as keyof typeof STATUS_COLORS], 0.2),
                                            color: STATUS_COLORS[key as keyof typeof STATUS_COLORS],
                                            border: `1px solid ${alpha(STATUS_COLORS[key as keyof typeof STATUS_COLORS], 0.3)}`,
                                            fontWeight: 600,
                                        }}
                                    />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        {error}
                    </Alert>
                )}

                {/* Calendar Navigation */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton onClick={goToPreviousMonth} sx={{ color: '#9ca3af' }}>
                            <PrevIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#f3f4f6', minWidth: 200, textAlign: 'center' }}>
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </Typography>
                        <IconButton onClick={goToNextMonth} sx={{ color: '#9ca3af' }}>
                            <NextIcon />
                        </IconButton>
                    </Box>
                    <Button
                        onClick={goToToday}
                        size="small"
                        sx={{
                            color: '#9ca3af',
                            backgroundColor: 'rgba(30, 41, 59, 0.4)',
                            border: '1px solid rgba(52, 58, 68, 0.2)',
                            '&:hover': {
                                backgroundColor: 'rgba(52, 58, 68, 0.4)',
                                borderColor: 'rgba(75, 85, 99, 0.4)'
                            }
                        }}
                    >
                        Today
                    </Button>
                </Box>

                {/* Calendar Grid */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 1,
                    border: '1px solid rgba(52, 58, 68, 0.3)',
                    borderRadius: 2,
                    overflow: 'hidden'
                }}>
                    {/* Day Headers */}
                    {dayNames.map((day) => (
                        <Box
                            key={day}
                            sx={{
                                p: 1.5,
                                textAlign: 'center',
                                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                                borderBottom: '1px solid rgba(52, 58, 68, 0.3)',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                color: '#d1d5db'
                            }}
                        >
                            {day}
                        </Box>
                    ))}

                    {/* Calendar Days */}
                    {calendarDays.map((day, index) => (
                        <Box
                            key={index}
                            sx={{
                                minHeight: 100,
                                p: 1,
                                backgroundColor: day.isCurrentMonth ? 'rgba(22, 32, 43, 0.6)' : 'rgba(30, 41, 59, 0.3)',
                                borderRight: index % 7 !== 6 ? '1px solid rgba(52, 58, 68, 0.2)' : 'none',
                                borderBottom: index < 35 ? '1px solid rgba(52, 58, 68, 0.2)' : 'none',
                                position: 'relative',
                                opacity: day.isCurrentMonth ? 1 : 0.5,
                                ...(day.isToday && {
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    border: '2px solid rgba(59, 130, 246, 0.3)',
                                }),
                                // Add subtle background color based on day status
                                ...(!day.isDefaultStatus && day.status !== 'AVAILABLE' && {
                                    backgroundColor: day.isCurrentMonth
                                        ? alpha(STATUS_COLORS[day.status], 0.05)
                                        : 'rgba(30, 41, 59, 0.3)',
                                })
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: day.isToday ? 700 : 500,
                                        color: day.isToday ? '#60a5fa' : '#9ca3af',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    {day.date.getDate()}
                                </Typography>

                                {/* Day Status Indicator */}
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: day.isDefaultStatus
                                            ? alpha(STATUS_COLORS.AVAILABLE, 0.6)
                                            : STATUS_COLORS[day.status],
                                        ...(day.isDefaultStatus && {
                                            border: `1px solid ${alpha(STATUS_COLORS.AVAILABLE, 0.8)}`,
                                            backgroundColor: 'transparent',
                                        })
                                    }}
                                />
                            </Box>

                            {/* Show status or availability slots */}
                            <Box sx={{ mt: 0.5 }}>
                                {day.isDefaultStatus ? (
                                    // Show default available status
                                    <Box
                                        sx={{
                                            height: 16,
                                            borderRadius: 1,
                                            backgroundColor: alpha(STATUS_COLORS.AVAILABLE, 0.3),
                                            border: `1px dashed ${alpha(STATUS_COLORS.AVAILABLE, 0.5)}`,
                                            fontSize: '0.65rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: STATUS_COLORS.AVAILABLE,
                                            fontWeight: 500,
                                            fontStyle: 'italic'
                                        }}
                                    >
                                        Available
                                    </Box>
                                ) : (
                                    // Show explicit slots
                                    <>
                                        {day.slots.slice(0, 3).map((slot) => (
                                            <Tooltip
                                                key={slot.id}
                                                title={
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                            {slot.title || `${STATUS_LABELS[slot.status]} Slot`}
                                                        </Typography>
                                                        <Typography variant="caption">
                                                            {new Date(slot.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                            {new Date(slot.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </Typography>
                                                        {slot.description && (
                                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                                {slot.description}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                            >
                                                <Box
                                                    sx={{
                                                        height: 16,
                                                        borderRadius: 1,
                                                        backgroundColor: alpha(STATUS_COLORS[slot.status], 0.8),
                                                        mb: 0.25,
                                                        cursor: 'pointer',
                                                        fontSize: '0.65rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        px: 0.5,
                                                        color: 'white',
                                                        fontWeight: 600,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        '&:hover': {
                                                            backgroundColor: STATUS_COLORS[slot.status],
                                                            transform: 'scale(1.02)'
                                                        },
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {slot.title || STATUS_LABELS[slot.status]}
                                                </Box>
                                            </Tooltip>
                                        ))}
                                        {day.slots.length > 3 && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: '#6b7280',
                                                    fontSize: '0.6rem',
                                                    fontWeight: 600
                                                }}
                                            >
                                                +{day.slots.length - 3} more
                                            </Typography>
                                        )}
                                    </>
                                )}
                            </Box>
                        </Box>
                    ))}
                </Box>

                {/* Legend */}
                <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: 1,
                                    backgroundColor: STATUS_COLORS[key as keyof typeof STATUS_COLORS],
                                }}
                            />
                            <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                                {label}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* Summary */}
                {availabilitySlots.length === 0 && !loading && (
                    <Box sx={{
                        textAlign: 'center',
                        py: 3,
                        background: alpha(STATUS_COLORS.AVAILABLE, 0.05),
                        borderRadius: 2,
                        border: `1px solid ${alpha(STATUS_COLORS.AVAILABLE, 0.2)}`,
                        mt: 3
                    }}>
                        <CalendarIcon sx={{ fontSize: 36, color: STATUS_COLORS.AVAILABLE, mb: 1 }} />
                        <Typography variant="h6" sx={{ color: STATUS_COLORS.AVAILABLE, fontWeight: 600 }}>
                            Equipment Available
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                            {equipmentName} is available for booking.
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
