import React from 'react';
import { Card, SxProps, Theme } from '@mui/material';

interface WorkflowCardProps {
    children: React.ReactNode;
    isActive?: boolean;
    activeColor?: string;
    sx?: SxProps<Theme>;
}

// Styled Workflow Card — glassmorphism + hover lift + animated glow
const WorkflowCard = ({ children, isActive, activeColor = '#3b82f6', sx = {} }: WorkflowCardProps) => (
    <Card sx={{
        background: isActive
            ? `linear-gradient(145deg, rgba(16, 18, 24, 0.95), rgba(20, 22, 30, 0.88))`
            : 'linear-gradient(145deg, rgba(16, 18, 24, 0.75), rgba(20, 22, 28, 0.7))',
        backdropFilter: 'blur(20px)',
        borderRadius: 3,
        border: isActive ? `1px solid ${activeColor}40` : '1px solid rgba(52, 58, 68, 0.2)',
        boxShadow: isActive
            ? `0 0 0 1px ${activeColor}08, 0 8px 32px ${activeColor}12, 0 16px 48px rgba(0,0,0,0.35)`
            : '0 2px 12px rgba(0,0,0,0.15)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
            transform: isActive ? 'translateY(-3px)' : 'translateY(-1px)',
            boxShadow: isActive
                ? `0 0 0 1px ${activeColor}15, 0 12px 40px ${activeColor}18, 0 24px 56px rgba(0,0,0,0.45)`
                : '0 6px 24px rgba(0,0,0,0.25)',
            border: isActive ? `1px solid ${activeColor}55` : '1px solid rgba(52, 58, 68, 0.35)',
        },
        '&::before': isActive ? {
            content: '""',
            position: 'absolute',
            inset: -3,
            zIndex: -1,
            borderRadius: 4,
            background: `conic-gradient(from 180deg, ${activeColor}20, transparent 25%, transparent 75%, ${activeColor}10)`,
            filter: 'blur(18px)',
            opacity: 0.7,
            animation: 'cardGlow 4s ease-in-out infinite alternate',
        } : {},
        '&::after': isActive ? {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, height: 3,
            borderRadius: '12px 12px 0 0',
            background: `linear-gradient(90deg, ${activeColor}60, ${activeColor}, ${activeColor}60)`,
            boxShadow: `0 0 16px ${activeColor}30`,
        } : {},
        '@keyframes cardGlow': {
            '0%': { opacity: 0.4 },
            '100%': { opacity: 0.8 },
        },
        ...sx
    }}>
        {children}
    </Card>
);

export { WorkflowCard };
