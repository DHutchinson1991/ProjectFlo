import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { injectCalendarAnimations } from '@/features/workflow/calendar/constants/calendar-animations';

injectCalendarAnimations();

const WeekViewSkeleton: React.FC = () => (
    <Box sx={{
        width: '100%',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
        borderRadius: 4, display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(74,144,226,0.08)',
        position: 'relative', overflow: 'hidden',
    }}>
        {/* Skeleton Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
                {[...Array(7)].map((_, i) => (
                    <Box key={i} sx={{ flex: 1, textAlign: 'center' }}>
                        <Box sx={{
                            height: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1, mb: 1,
                            animation: 'calSkeletonPulse 2s ease-in-out infinite', animationDelay: `${i * 0.1}s`,
                        }} />
                        <Box sx={{
                            height: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 1,
                            animation: 'calSkeletonPulse 2s ease-in-out infinite', animationDelay: `${i * 0.1 + 0.2}s`,
                        }} />
                    </Box>
                ))}
            </Box>
        </Box>

        {/* Skeleton Time Grid */}
        <Box sx={{ p: 2, flex: 1 }}>
            <Box sx={{ display: 'flex' }}>
                <Box sx={{ width: 100, pr: 2 }}>
                    {[...Array(12)].map((_, i) => (
                        <Box key={i} sx={{ height: 80, display: 'flex', alignItems: 'center' }}>
                            <Box sx={{
                                width: 60, height: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 1,
                                animation: 'calSkeletonPulse 2s ease-in-out infinite', animationDelay: `${i * 0.05}s`,
                            }} />
                        </Box>
                    ))}
                </Box>
                <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
                    {[...Array(7)].map((_, dayIndex) => (
                        <Box key={dayIndex} sx={{ flex: 1, position: 'relative' }}>
                            {[...Array(2)].map((_, eventIndex) => {
                                const tops = [80, 320, 160, 400, 240, 120, 360];
                                const heights = [100, 80, 120, 60, 90, 110, 70];
                                return (
                                    <Box key={eventIndex} sx={{
                                        position: 'absolute',
                                        top: tops[(dayIndex + eventIndex) % 7],
                                        left: 4, right: 4,
                                        height: heights[(dayIndex + eventIndex) % 7],
                                        backgroundColor: 'rgba(74,144,226,0.1)',
                                        borderLeft: '3px solid rgba(74,144,226,0.3)', borderRadius: 1,
                                        animation: 'calSkeletonPulse 2s ease-in-out infinite',
                                        animationDelay: `${(dayIndex * 3 + eventIndex) * 0.1}s`,
                                    }} />
                                );
                            })}
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>

        {/* Loading indicator overlay */}
        <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            display: 'flex', alignItems: 'center', gap: 2,
            backgroundColor: 'rgba(10,10,10,0.9)', padding: 2, borderRadius: 2,
            backdropFilter: 'blur(8px)', border: '1px solid rgba(74,144,226,0.2)',
        }}>
            <CircularProgress size={20} sx={{ color: '#4A90E2', '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
            <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.875rem' }}>Loading events...</Typography>
        </Box>
    </Box>
);

export default WeekViewSkeleton;
