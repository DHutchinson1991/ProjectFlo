'use client';

import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';

const shimmerSweep = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const shimmerPulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

const borderGlow = keyframes`
  0%, 100% { border-color: rgba(123, 97, 255, 0.15); box-shadow: 0 0 0 rgba(123, 97, 255, 0); }
  50% { border-color: rgba(179, 136, 255, 0.5); box-shadow: 0 0 20px rgba(123, 97, 255, 0.15); }
`;

const wordShimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

/**
 * Standard shimmer: sweeping light bar over children. 
 * Used on viewfinder cards etc.
 */
export const ShimmerOverlay: React.FC<{ active: boolean; children: React.ReactNode; label?: string }> = ({ active, children, label }) => (
  <Box sx={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
    {children}
    {active && (
      <Box sx={{
        position: 'absolute',
        inset: 0,
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: 'rgba(123, 97, 255, 0.06)',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Sweeping light bar */}
        <Box sx={{
          position: 'absolute',
          inset: 0,
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '60%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(179,136,255,0.12), transparent)',
            animation: `${shimmerSweep} 1.8s ease-in-out infinite`,
          },
        }} />
        {label && (
          <Typography sx={{
            position: 'relative',
            zIndex: 1,
            color: '#B388FF',
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            animation: `${shimmerPulse} 1.8s ease-in-out infinite`,
          }}>
            {label}
          </Typography>
        )}
      </Box>
    )}
  </Box>
);

/**
 * Pulsing border glow for spatial panels / floorplans.
 * Much more visible than the subtle sweep — clear animated purple border.
 */
export const GlowBorderOverlay: React.FC<{ active: boolean; children: React.ReactNode; label?: string }> = ({ active, children, label }) => (
  <Box sx={{
    position: 'relative',
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 2,
    border: active ? '2px solid rgba(179, 136, 255, 0.3)' : '2px solid transparent',
    animation: active ? `${borderGlow} 2s ease-in-out infinite` : 'none',
    transition: 'border-color 0.3s ease',
    overflow: 'hidden',
  }}>
    {children}
    {active && label && (
      <Box sx={{
        position: 'absolute',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        pointerEvents: 'none',
      }}>
        <Typography sx={{
          color: '#B388FF',
          fontSize: '0.6rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          bgcolor: 'rgba(15, 10, 30, 0.85)',
          px: 1.5,
          py: 0.35,
          borderRadius: 1,
          border: '1px solid rgba(179, 136, 255, 0.25)',
          backdropFilter: 'blur(6px)',
          animation: `${shimmerPulse} 2s ease-in-out infinite`,
        }}>
          {label}
        </Typography>
      </Box>
    )}
  </Box>
);

/**
 * Text shimmer: each word gets a sweeping gradient.
 * Wraps text children and applies shimmer per-word inline.
 */
export const TextShimmer: React.FC<{ active: boolean; children: React.ReactNode }> = ({ active, children }) => {
  if (!active) return <>{children}</>;

  return (
    <Box sx={{
      '& *': {
        background: 'linear-gradient(90deg, rgba(255,255,255,0.45) 0%, #B388FF 40%, rgba(255,255,255,0.45) 80%)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: `${wordShimmer} 2.5s linear infinite`,
      },
    }}>
      {children}
    </Box>
  );
};
