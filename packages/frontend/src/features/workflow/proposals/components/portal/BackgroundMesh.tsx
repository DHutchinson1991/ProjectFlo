"use client";

import React from 'react';
import { Box } from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import { motion } from 'framer-motion';

const aurora = keyframes`
    0%   { transform: translate(0, 0) rotate(0deg) scale(1); }
    25%  { transform: translate(60px, -40px) rotate(15deg) scale(1.15); }
    50%  { transform: translate(-30px, 50px) rotate(-10deg) scale(0.95); }
    75%  { transform: translate(40px, 20px) rotate(5deg) scale(1.08); }
    100% { transform: translate(0, 0) rotate(0deg) scale(1); }
`;

const drift = keyframes`
    0%   { transform: translate(0, 0) scale(1); }
    33%  { transform: translate(-50px, 30px) scale(1.1); }
    66%  { transform: translate(40px, -20px) scale(0.92); }
    100% { transform: translate(0, 0) scale(1); }
`;

interface BackgroundMeshProps {
    /** Primary aurora color (default: purple #7c4dff) */
    primary?: string;
    /** Secondary accent color (default: violet #a855f7) */
    secondary?: string;
    /** Tertiary warm glow color (default: green #22c55e) */
    tertiary?: string;
    /** Cool accent color (default: blue #60a5fa) */
    cool?: string;
}

/**
 * Bold animated background — layered aurora blobs with strong colour
 * presence. Paints the page with life instead of a flat void.
 * Accepts optional color overrides for theme takeover.
 */
export function BackgroundMesh({
    primary = '#7c4dff',
    secondary = '#a855f7',
    tertiary = '#22c55e',
    cool = '#60a5fa',
}: BackgroundMeshProps = {}) {
    return (
        <Box
            aria-hidden
            sx={{
                position: 'fixed',
                inset: 0,
                zIndex: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
            }}
        >
            {/* Base gradient — lifts the page from pure black */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${alpha(primary, 0.12)} 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, ${alpha(tertiary, 0.06)} 0%, transparent 50%)`,
                }}
            />

            {/* Primary aurora — large, high opacity */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '-5%',
                    left: '10%',
                    width: 700,
                    height: 700,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(primary, 0.18)} 0%, ${alpha(primary, 0.06)} 40%, transparent 70%)`,
                    filter: 'blur(60px)',
                    animation: `${aurora} 20s ease-in-out infinite`,
                }}
            />

            {/* Secondary accent — right side */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '30%',
                    right: '-5%',
                    width: 550,
                    height: 550,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(secondary, 0.15)} 0%, ${alpha(secondary, 0.05)} 45%, transparent 70%)`,
                    filter: 'blur(70px)',
                    animation: `${drift} 25s ease-in-out infinite`,
                    animationDelay: '-8s',
                }}
            />

            {/* Tertiary accent — bottom, warm glow */}
            <motion.div
                animate={{
                    x: [0, 50, -40, 0],
                    y: [0, -30, 25, 0],
                    scale: [1, 1.12, 0.9, 1],
                }}
                transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute',
                    bottom: '0%',
                    left: '25%',
                    width: 500,
                    height: 500,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(tertiary, 0.10)} 0%, ${alpha(tertiary, 0.03)} 40%, transparent 65%)`,
                    filter: 'blur(60px)',
                }}
            />

            {/* Cool accent — center, adds depth */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '55%',
                    left: '40%',
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(cool, 0.08)} 0%, transparent 60%)`,
                    filter: 'blur(80px)',
                    animation: `${aurora} 28s ease-in-out infinite`,
                    animationDelay: '-14s',
                }}
            />

            {/* Noise texture overlay for grain/depth */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.03,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '128px 128px',
                }}
            />
        </Box>
    );
}
