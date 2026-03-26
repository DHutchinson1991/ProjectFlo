import React from 'react';
import { Box, Typography } from '@mui/material';

interface WeekHourLabelProps {
    hour: number;
    onHourSlotClick: (firstDay: Date, hour: number) => void;
    firstDay: Date;
    formatHour: (hour: number) => string;
}

const WeekHourLabel: React.FC<WeekHourLabelProps> = ({
    hour,
    onHourSlotClick,
    firstDay,
    formatHour
}) => {
    return (
        <Box
            onClick={() => {
                // Create event for current week's first day (Monday) at this hour
                console.log('🖱️ WeekView CLICKED hour label:', hour, 'creating event on Monday');
                onHourSlotClick(firstDay, hour);
            }}
            sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-end',
                position: 'relative',
                borderRight: '1px solid rgba(74,144,226,0.08)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.03) 100%)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                    background: 'linear-gradient(135deg, rgba(74,144,226,0.1) 0%, rgba(74,144,226,0.15) 100%)',
                    // Removed the time display on hover as requested
                }
            }}
        >
            <Typography
                variant="body2"
                sx={{
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.7)',
                    transform: 'translateY(-8px)',
                    fontSize: '0.8rem',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
            >
                {formatHour(hour)}
            </Typography>
        </Box>
    );
};

export default WeekHourLabel;
