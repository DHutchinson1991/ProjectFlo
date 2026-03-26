import React from 'react';
import { Box, Typography } from '@mui/material';
import { injectCalendarAnimations } from '@/features/workflow/calendar/constants/calendar-animations';

injectCalendarAnimations();

const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const WeekDayHeaders: React.FC = () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1.5, mb: 2.5, px: 2, pt: 2, position: 'relative', zIndex: 1 }}>
        {weekDays.map((day, index) => {
            const isWeekday = index <= 4;
            return (
                <Box
                    key={day}
                    sx={{
                        textAlign: 'center', position: 'relative', py: 1.5, px: 1, borderRadius: 2,
                        background: isWeekday
                            ? 'linear-gradient(135deg, rgba(74,144,226,0.2) 0%, rgba(74,144,226,0.35) 50%, rgba(74,144,226,0.25) 100%)'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 100%)',
                        border: isWeekday ? '1px solid rgba(74,144,226,0.4)' : '1px solid rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            background: isWeekday
                                ? 'linear-gradient(135deg, rgba(74,144,226,0.3) 0%, rgba(74,144,226,0.45) 50%, rgba(74,144,226,0.35) 100%)'
                                : 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.20) 50%, rgba(255,255,255,0.15) 100%)',
                            transform: 'translateY(-2px) scale(1.02)',
                            boxShadow: isWeekday
                                ? '0 8px 20px rgba(74,144,226,0.3), 0 0 0 1px rgba(74,144,226,0.5)'
                                : '0 8px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.3)',
                        },
                    }}
                >
                    <Typography variant="subtitle2" sx={{
                        fontWeight: 600, color: '#ffffff', letterSpacing: 1.5, fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        textShadow: isWeekday
                            ? '0 0 20px rgba(74,144,226,0.8), 0 2px 4px rgba(0,0,0,0.6)'
                            : '0 2px 6px rgba(0,0,0,0.8)',
                        transition: 'all 0.4s ease', position: 'relative', opacity: 1,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}>
                        {day}

                        {isWeekday && (
                            <>
                                <Box sx={{
                                    position: 'absolute', top: -3, right: -3, width: 6, height: 6, borderRadius: '50%',
                                    background: 'radial-gradient(circle, #4A90E2 0%, #357ABD 100%)',
                                    boxShadow: '0 0 10px rgba(74,144,226,0.8), 0 0 20px rgba(74,144,226,0.4)',
                                    opacity: 0.9, animation: 'calPulse 3s ease-in-out infinite',
                                }} />
                                <Box sx={{
                                    position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)',
                                    width: '80%', height: 3,
                                    background: 'linear-gradient(90deg, transparent, #4A90E2, transparent)',
                                    borderRadius: 2, boxShadow: '0 0 8px rgba(74,144,226,0.6)',
                                }} />
                            </>
                        )}

                        {!isWeekday && (
                            <Box sx={{
                                position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
                                width: '40%', height: 1,
                                background: 'linear-gradient(90deg, transparent, rgba(224,224,224,0.3), transparent)',
                                borderRadius: 1,
                            }} />
                        )}
                    </Typography>
                </Box>
            );
        })}
    </Box>
);

export default WeekDayHeaders;
