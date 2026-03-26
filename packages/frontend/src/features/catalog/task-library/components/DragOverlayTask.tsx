"use client";

import React from "react";
import { Box, Typography, Chip, Stack } from "@mui/material";
import { DragIndicator as DragIndicatorIcon } from "@mui/icons-material";
import { TaskLibrary, PRICING_TYPE_LABELS } from "@/lib/types";

interface DragOverlayTaskProps {
    task: TaskLibrary;
    phase: string;
}

export function DragOverlayTask({ task, phase }: DragOverlayTaskProps) {
    // Get phase colors
    const phaseColors = {
        'Lead': { color: '#667eea', bg: 'rgba(102, 126, 234, 0.1)', hover: 'rgba(102, 126, 234, 0.2)' },
        'Inquiry': { color: '#f093fb', bg: 'rgba(240, 147, 251, 0.1)', hover: 'rgba(240, 147, 251, 0.2)' },
        'Booking': { color: '#4facfe', bg: 'rgba(79, 172, 254, 0.1)', hover: 'rgba(79, 172, 254, 0.2)' },
        'Creative_Development': { color: '#43e97b', bg: 'rgba(67, 233, 123, 0.1)', hover: 'rgba(67, 233, 123, 0.2)' },
        'Pre_Production': { color: '#fa709a', bg: 'rgba(250, 112, 154, 0.1)', hover: 'rgba(250, 112, 154, 0.2)' },
        'Production': { color: '#2196f3', bg: 'rgba(33, 150, 243, 0.1)', hover: 'rgba(33, 150, 243, 0.2)' },
        'Post_Production': { color: '#9c27b0', bg: 'rgba(156, 39, 176, 0.1)', hover: 'rgba(156, 39, 176, 0.2)' },
        'Delivery': { color: '#ffeb3b', bg: 'rgba(255, 235, 59, 0.1)', hover: 'rgba(255, 235, 59, 0.2)' }
    };

    const phaseStyle = phaseColors[phase as keyof typeof phaseColors] || phaseColors['Lead'];

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 2,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.2) 100%)',
                backdropFilter: 'blur(20px)',
                borderRadius: 2,
                border: `2px solid ${phaseStyle.color}`,
                minWidth: 400,
                maxWidth: 600,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                cursor: 'grabbing',
                transform: 'rotate(5deg)',
                transition: 'all 0.2s ease-in-out',
            }}
        >
            <DragIndicatorIcon sx={{ color: phaseStyle.color }} />

            <Stack direction="row" spacing={2} sx={{ flex: 1, alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight="medium" sx={{ color: 'white', mb: 0.5 }}>
                        {task.name}
                    </Typography>
                    {task.description && (
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
                            {task.description.length > 50 ? `${task.description.substring(0, 50)}...` : task.description}
                        </Typography>
                    )}
                </Box>

                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Chip
                        label={PRICING_TYPE_LABELS[task.pricing_type]}
                        size="small"
                        sx={{
                            background: phaseStyle.bg,
                            color: phaseStyle.color,
                            border: `1px solid ${phaseStyle.color}`,
                            fontSize: '0.7rem',
                            height: 24,
                        }}
                    />

                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 'medium' }}>
                        {task.effort_hours}h
                    </Typography>
                </Stack>
            </Stack>
        </Box>
    );
}
