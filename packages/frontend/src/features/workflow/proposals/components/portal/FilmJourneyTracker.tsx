"use client";

import React, { useMemo, useEffect, useRef } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CheckCircle as CheckIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { getJourneyIcon } from './journey-icons';
import { StepHeroContent } from './StepHeroContent';
import { useJourneyAnimation } from '@/features/workflow/proposals/hooks/use-journey-animation';
import { fadeInUp } from '@/features/workflow/proposals/utils/portal/animations';
import type { PortalDashboardColors } from '@/features/workflow/proposals/utils/portal/themes';
import type { JourneyStep } from '@/features/workflow/proposals/types/portal';

interface FilmJourneyTrackerProps {
    steps: JourneyStep[];
    portalToken: string;
    colors: PortalDashboardColors;
    onStepCtaClick?: (step: JourneyStep) => boolean | void;
}

const STATUS_COLORS: Record<string, string> = {
    completed: '#22c55e',
    active: '#60a5fa',
    waiting: '#f59e0b',
    upcoming: '#6b7280',
    locked: '#374151',
};

function getStepEyebrow(step: JourneyStep, isPlayingThrough: boolean) {
    if (isPlayingThrough) return 'Journey Update';
    if (step.status === 'completed') return 'Completed';
    if (step.status === 'active') return 'Active enquiry';
    if (step.status === 'waiting') return 'In progress';
    if (step.status === 'locked') return 'Later on';
    return 'Coming up';
}

function splitHeadline(label: string) {
    const words = label.trim().split(/\s+/).filter(Boolean);

    if (words.length <= 1) {
        return { lead: label, tail: '' };
    }

    const lead = words.slice(0, -1).join(' ');
    const lastWord = words[words.length - 1];
    const tail = /[.!?]$/.test(lastWord) ? lastWord : `${lastWord}.`;

    return { lead, tail };
}

export function FilmJourneyTracker({ steps, portalToken, colors, onStepCtaClick }: FilmJourneyTrackerProps) {
    const {
        displayedStep,
        isPlayingThrough,
        isResting,
        completedCount,
        totalCount,
        skipPlaythrough,
    } = useJourneyAnimation(steps, portalToken);

    const confettiFired = useRef(false);

    // Confetti on Booking Confirmed
    useEffect(() => {
        if (
            isPlayingThrough &&
            displayedStep?.key === 'booking_confirmed' &&
            displayedStep.status === 'completed' &&
            !confettiFired.current
        ) {
            confettiFired.current = true;
            const end = Date.now() + 1500;
            const burst = () => {
                confetti({ particleCount: 40, spread: 80, origin: { y: 0.55 }, colors: ['#22c55e', '#60a5fa', '#f59e0b', '#fff'] });
                if (Date.now() < end) requestAnimationFrame(burst);
            };
            burst();
        }
    }, [isPlayingThrough, displayedStep]);

    if (!displayedStep) return null;

    const statusColor = STATUS_COLORS[displayedStep.status] ?? STATUS_COLORS.upcoming;
    const isCompleted = displayedStep.status === 'completed';
    const isActive = displayedStep.status === 'active';
    const isWaiting = displayedStep.status === 'waiting';
    const progressPct = totalCount > 0 ? completedCount / totalCount : 0;
    const headline = splitHeadline(displayedStep.label);
    const supportingCopy = displayedStep.summary || displayedStep.waitingMessage || 'Your journey is moving forward behind the scenes.';

    return (
        <Box sx={{ animation: `${fadeInUp} 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both` }}>
            <Box sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                py: { xs: 4.5, md: 6.5 }, px: { xs: 2, md: 4 },
                position: 'relative', overflow: 'visible',
                minHeight: { xs: 320, md: 400 },
                width: '100%',
                maxWidth: 760,
                mx: 'auto',
            }}>
                {/* Large ambient glow */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`glow-${displayedStep.key}`}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 0.5, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.3 }}
                        transition={{ duration: 1.4, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            width: 400, height: 400, borderRadius: '50%',
                            background: `radial-gradient(circle, ${alpha(statusColor, 0.2)} 0%, ${alpha(statusColor, 0.06)} 40%, transparent 70%)`,
                            filter: 'blur(40px)', pointerEvents: 'none',
                        }}
                    />
                </AnimatePresence>

                {/* Orbiting particles */}
                {(isActive || isWaiting) && isResting && (
                    <OrbitalParticles color={statusColor} slow={isWaiting} />
                )}

                {/* Soft breathing glow behind icon */}
                {(isActive || isWaiting) && isResting && (
                    <BreathingGlow color={statusColor} />
                )}

                {/* Progress ring + Icon */}
                <Box sx={{ position: 'relative', zIndex: 2 }}>
                    {/* SVG progress ring */}
                    <ProgressRing
                        progress={progressPct}
                        size={180}
                        strokeWidth={3}
                        color={statusColor}
                        isResting={isResting}
                    />

                    {/* Icon centered inside ring */}
                    <Box sx={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={displayedStep.key}
                                initial={{ opacity: 0, scale: 0.2, rotate: -15, y: 30 }}
                                animate={{
                                    opacity: 1, scale: 1, rotate: 0, y: 0,
                                    ...(isActive && isResting ? {
                                        y: [0, -3, 0],
                                        scale: [1, 1.04, 1],
                                        transition: {
                                            y: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
                                            scale: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
                                        },
                                    } : {}),
                                    ...(isWaiting && isResting ? {
                                        y: [0, -2, 0],
                                        opacity: [0.85, 1, 0.85],
                                        scale: [1, 1.02, 1],
                                        transition: {
                                            y: { repeat: Infinity, duration: 5, ease: 'easeInOut' },
                                            opacity: { repeat: Infinity, duration: 5, ease: 'easeInOut' },
                                            scale: { repeat: Infinity, duration: 5, ease: 'easeInOut' },
                                        },
                                    } : {}),
                                }}
                                exit={{ opacity: 0, scale: 0.4, rotate: 10, y: -20 }}
                                transition={{ type: 'spring', stiffness: 120, damping: 18, mass: 1.2 }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <IconDisplay step={displayedStep} statusColor={statusColor} />
                            </motion.div>
                        </AnimatePresence>
                    </Box>

                    {/* Checkmark stamp */}
                    <AnimatePresence>
                        {isPlayingThrough && isCompleted && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.4 }}
                                style={{
                                    position: 'absolute', bottom: 8, right: 8, zIndex: 3,
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: '#22c55e', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 4px 20px ${alpha('#22c55e', 0.5)}`,
                                }}
                            >
                                <CheckIcon sx={{ fontSize: 20, color: '#fff' }} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Box>

                {/* Hero text */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`hero-copy-${displayedStep.key}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                        style={{ textAlign: 'center', width: '100%' }}
                    >
                        <Typography sx={{
                            mt: 2.5,
                            fontSize: { xs: '2.2rem', md: '3.4rem' },
                            fontWeight: 500,
                            color: colors.text,
                            lineHeight: { xs: 1.05, md: 1 },
                            letterSpacing: '-0.025em',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        }}>
                            <Box component="span" sx={{ display: 'block' }}>{headline.lead}</Box>
                            {headline.tail && (
                                <Box component="span" sx={{ display: 'block', color: alpha(colors.text, 0.48) }}>
                                    {headline.tail}
                                </Box>
                            )}
                        </Typography>
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Typography sx={{
                                mt: 1.25,
                                mx: 'auto',
                                maxWidth: 460,
                                fontSize: { xs: '0.95rem', md: '1rem' },
                                color: alpha(colors.muted, 0.84),
                                textAlign: 'center',
                                lineHeight: 1.7,
                            }}>
                                {supportingCopy}
                            </Typography>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>

                {/* Contextual hero content per phase */}
                <AnimatePresence mode="wait">
                    {isResting && (
                        <StepHeroContent
                            key={`hero-${displayedStep.key}`}
                            step={displayedStep}
                            statusColor={statusColor}
                            colors={colors}
                            onCtaClick={onStepCtaClick}
                        />
                    )}
                </AnimatePresence>

                {/* CTA is rendered by StepHeroContent per-step (via HeroSignal) */}

                {/* Skip button during playthrough */}
                {isPlayingThrough && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                        <Button size="small" onClick={skipPlaythrough} sx={{
                            mt: 2, fontSize: '0.78rem', color: colors.muted,
                            textTransform: 'none', borderRadius: '8px',
                            '&:hover': { bgcolor: alpha(colors.border, 0.2) },
                        }}>
                            Skip to current →
                        </Button>
                    </motion.div>
                )}
            </Box>
        </Box>
    );
}

/* ── Icon Display ─────────────────────────────────────── */

function IconDisplay({ step, statusColor }: { step: JourneyStep; statusColor: string }) {
    const Icon = getJourneyIcon(step.icon);
    return (
        <Box sx={{
            width: { xs: 110, md: 136 }, height: { xs: 110, md: 136 },
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: statusColor,
            position: 'relative',
        }}>
            {/* Soft backdrop glow behind icon */}
            <Box sx={{
                position: 'absolute',
                width: '70%', height: '70%',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(statusColor, 0.15)} 0%, transparent 70%)`,
                filter: 'blur(14px)',
            }} />
            <motion.div
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <Icon sx={{ fontSize: { xs: 68, md: 88 }, filter: `drop-shadow(0 0 8px ${alpha(statusColor, 0.35)})` }} />
            </motion.div>
        </Box>
    );
}

/* ── SVG Progress Ring ────────────────────────────────── */

function ProgressRing({ progress, size, strokeWidth, color, isResting }: {
    progress: number; size: number; strokeWidth: number; color: string; isResting: boolean;
}) {
    const gradientId = 'progress-gradient';
    const shimmerId = 'shimmer-mask';
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    // Lighter tint for gradient end
    const lighterColor = alpha(color, 0.45);

    return (
        <Box sx={{ width: size, height: size, position: 'relative' }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <defs>
                    {/* Gradient stroke */}
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} />
                        <stop offset="100%" stopColor={lighterColor} />
                    </linearGradient>
                    {/* Shimmer highlight that travels along the arc */}
                    <linearGradient id={shimmerId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="white" stopOpacity="0">
                            <animate attributeName="offset" values="-0.3;1.3" dur="3.5s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="5%" stopColor="white" stopOpacity="0.35">
                            <animate attributeName="offset" values="-0.15;1.45" dur="3.5s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="10%" stopColor="white" stopOpacity="0">
                            <animate attributeName="offset" values="0;1.6" dur="3.5s" repeatCount="indefinite" />
                        </stop>
                    </linearGradient>
                </defs>

                {/* Track */}
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke={alpha(color, 0.08)}
                    strokeWidth={strokeWidth}
                />

                {/* Progress arc — gradient stroke */}
                <motion.circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                        filter: isResting ? `drop-shadow(0 0 6px ${alpha(color, 0.4)})` : undefined,
                    }}
                />

                {/* Shimmer overlay — follows same arc */}
                {isResting && progress > 0 && (
                    <motion.circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none"
                        stroke={`url(#${shimmerId})`}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ mixBlendMode: 'overlay' }}
                    />
                )}
            </svg>
        </Box>
    );
}

/* ── Orbiting particles (layered depths) ──────────────── */

function OrbitalParticles({ color, slow }: { color: string; slow: boolean }) {
    // Far layer — large, very soft bokeh, slow orbit
    const farParticles = useMemo(() => (
        Array.from({ length: 6 }, (_, i) => ({
            id: `far-${i}`,
            size: 16 + Math.random() * 14,
            radius: 120 + Math.random() * 60,
            speed: (slow ? 32 : 22) + Math.random() * 12,
            offset: (360 / 6) * i + Math.random() * 30,
            opacity: 0.12 + Math.random() * 0.14,
            blur: 6 + Math.random() * 5,
        }))
    ), [slow]);

    // Mid layer — medium bokeh, mid speed
    const midParticles = useMemo(() => (
        Array.from({ length: 4 }, (_, i) => ({
            id: `mid-${i}`,
            size: 6 + Math.random() * 6,
            radius: 95 + Math.random() * 35,
            speed: (slow ? 22 : 14) + Math.random() * 8,
            offset: (360 / 4) * i + Math.random() * 30,
            opacity: 0.22 + Math.random() * 0.25,
            blur: 2.5 + Math.random() * 2,
        }))
    ), [slow]);

    // Near layer — small, sharp, faster orbit
    const nearParticles = useMemo(() => (
        Array.from({ length: 5 }, (_, i) => ({
            id: `near-${i}`,
            size: 2.5 + Math.random() * 2.5,
            radius: 80 + Math.random() * 25,
            speed: (slow ? 16 : 9) + Math.random() * 6,
            offset: (360 / 5) * i + Math.random() * 20,
            opacity: 0.4 + Math.random() * 0.35,
            blur: 0,
        }))
    ), [slow]);

    const allParticles = [...farParticles, ...midParticles, ...nearParticles];

    return (
        <>
            {allParticles.map((p) => (
                <motion.div
                    key={p.id}
                    animate={{ rotate: 360 }}
                    transition={{ duration: p.speed, repeat: Infinity, ease: 'linear' }}
                    style={{
                        position: 'absolute', width: p.radius * 2, height: p.radius * 2,
                        pointerEvents: 'none',
                        zIndex: p.id.startsWith('near') ? 2 : p.id.startsWith('mid') ? 1 : 0,
                    }}
                >
                    <motion.div
                        animate={{
                            opacity: [p.opacity, p.opacity * 0.15, p.opacity],
                            scale: p.blur > 2 ? [1, 1.4, 1] : [1, 1.1, 1],
                        }}
                        transition={{ duration: p.speed / 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute',
                            top: 0, left: '50%',
                            width: p.size, height: p.size, borderRadius: '50%',
                            background: p.blur > 0
                                ? `radial-gradient(circle, ${color} 0%, transparent 70%)`
                                : color,
                            transform: `translateX(-50%) rotate(${p.offset}deg)`,
                            filter: p.blur > 0 ? `blur(${p.blur}px)` : undefined,
                            boxShadow: `0 0 ${p.size * (p.blur > 0 ? 4 : 2)}px ${alpha(color, p.blur > 0 ? 0.3 : 0.5)}`,
                        }}
                    />
                </motion.div>
            ))}
        </>
    );
}

/* ── Soft breathing glow ──────────────────────────────── */

function BreathingGlow({ color }: { color: string }) {
    return (
        <motion.div
            animate={{
                opacity: [0.18, 0.35, 0.18],
                scale: [0.92, 1.08, 0.92],
            }}
            transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
            style={{
                position: 'absolute',
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(color, 0.22)} 0%, ${alpha(color, 0.06)} 50%, transparent 75%)`,
                filter: 'blur(30px)',
                pointerEvents: 'none',
                zIndex: 1,
            }}
        />
    );
}
