"use client";

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { AutoAwesome as SparkleIcon } from '@mui/icons-material';
import type { PortalDashboardColors } from '@/features/workflow/proposals/utils/portal/themes';
import type { JourneyStep } from '@/features/workflow/proposals/types/portal';

interface StepHeroContentProps {
    step: JourneyStep;
    statusColor: string;
    colors: PortalDashboardColors;
    /** Called when a CTA button is clicked. Return true to prevent default navigation. */
    onCtaClick?: (step: JourneyStep) => boolean | void;
}

/**
 * Contextual "hero moment" block that renders beneath the main step
 * icon/label in FilmJourneyTracker. Each phase gets tailored micro-UI.
 */
export function StepHeroContent({ step, statusColor, colors, onCtaClick }: StepHeroContentProps) {
    const content = getStepContent(step, statusColor, colors, onCtaClick);
    if (!content) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: 0.5, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
            {content}
        </motion.div>
    );
}

function getStepContent(
    step: JourneyStep,
    statusColor: string,
    colors: PortalDashboardColors,
    onCtaClick?: (step: JourneyStep) => boolean | void,
): React.ReactNode | null {
    const { key, status, cta } = step;

    const handleCtaClick = (e: React.MouseEvent) => {
        const handled = onCtaClick?.(step);
        if (handled) e.preventDefault();
    };

    // Only show hero content for active/waiting/completed steps — not upcoming
    if (status === 'upcoming' || status === 'locked') return null;

    switch (key) {
        /* ── Inquiry received / qualified ──────────────────────── */
        case 'inquiry_received':
            return status === 'completed' ? (
                <HeroChip
                    icon={<SparkleIcon sx={{ fontSize: 14, color: colors.green }} />}
                    text="Your inquiry was received — we love what you're planning"
                    colors={colors}
                />
            ) : (
                <HeroChip
                    icon={<SparkleIcon sx={{ fontSize: 14, color: statusColor }} />}
                    text="We're reviewing your details now"
                    colors={colors}
                />
            );

        case 'inquiry_qualified':
            return status === 'completed' ? (
                <HeroChip
                    icon={<SparkleIcon sx={{ fontSize: 14, color: colors.green }} />}
                    text="Your inquiry stood out — here's what happens next"
                    colors={colors}
                />
            ) : (
                <HeroChip
                    icon={<SparkleIcon sx={{ fontSize: 14, color: statusColor }} />}
                    text="Almost there — your enquiry is being reviewed"
                    colors={colors}
                />
            );

        /* ── Discovery / crew ─────────────────────────────────── */
        case 'schedule_discovery':
            return status === 'active' ? (
                <HeroMessage
                    text="Let's find a time to chat about your vision"
                    sub="A quick call helps us plan the perfect film"
                    statusColor={statusColor}
                    colors={colors}
                    cta={cta}
                    onCtaClick={handleCtaClick}
                />
            ) : null;

        case 'discovery_complete':
            return status === 'completed' ? (
                <HeroChip
                    icon={<SparkleIcon sx={{ fontSize: 14, color: colors.green }} />}
                    text="Great chat — we're excited about your event"
                    colors={colors}
                />
            ) : null;

        /* ── Estimate ─────────────────────────────────────────── */
        case 'estimate_ready':
            return (
                    <HeroSignal
                        eyebrow="Ready now"
                        text="Your personalised estimate is ready"
                        sub="Tailored pricing based on your event details"
                        statusColor={statusColor}
                        colors={colors}
                        cta={cta}
                        onCtaClick={handleCtaClick}
                    />
            );

        /* ── Proposal ─────────────────────────────────────────── */
        case 'proposal_sent':
            if (status === 'waiting') {
                return (
                    <HeroSignal
                        eyebrow="Ready for review"
                        text="Your proposal is waiting for you"
                        sub="Take your time and review it at your own pace"
                        statusColor={statusColor}
                        colors={colors}
                        cta={cta}
                        onCtaClick={handleCtaClick}
                    />
                );
            }
            return null;

        case 'proposal_accepted':
            return status === 'completed' ? (
                <HeroChip
                    icon={<SparkleIcon sx={{ fontSize: 14, color: colors.green }} />}
                    text="Wonderful — you loved the proposal!"
                    colors={colors}
                />
            ) : null;

        /* ── Contract ─────────────────────────────────────────── */
        case 'contract_ready':
            if (status === 'waiting') {
                return (
                    <HeroSignal
                        eyebrow="Next step"
                        text="Contract and confirmation are ready"
                        sub="One more step locks in your date"
                        statusColor={statusColor}
                        colors={colors}
                        cta={cta}
                        onCtaClick={handleCtaClick}
                        meta={
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <ProgressDots count={2} filled={1} color={statusColor} />
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: alpha(colors.text, 0.9) }}>
                                    1 of 2 steps to confirm
                                </Typography>
                            </Box>
                        }
                    />
                );
            }
            return null;

        case 'contract_signed':
            return status === 'completed' ? (
                <HeroChip
                    icon={<SparkleIcon sx={{ fontSize: 14, color: colors.green }} />}
                    text="Contract signed — it's official!"
                    colors={colors}
                />
            ) : null;

        /* ── Booking confirmed ────────────────────────────────── */
        case 'booking_confirmed':
            return status === 'completed' ? (
                <Box sx={{ textAlign: 'center', mt: 1.5 }}>
                    <motion.div
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Typography sx={{
                            fontSize: '0.92rem', fontWeight: 700,
                            background: `linear-gradient(135deg, ${colors.green}, ${colors.accent})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            You&apos;re booked!
                        </Typography>
                    </motion.div>
                    <Typography sx={{
                        fontSize: '0.72rem', color: alpha(colors.muted, 0.6),
                        mt: 0.5,
                    }}>
                        Your film team is being assembled
                    </Typography>
                </Box>
            ) : null;

        default:
            return null;
    }
}

/* ── Reusable micro-components ──────────────────────────── */

function HeroChip({ icon, text, colors }: {
    icon: React.ReactNode;
    text: string;
    colors: PortalDashboardColors;
}) {
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.75,
            mt: 1.5, px: 2, py: 0.75,
            borderRadius: '20px',
            bgcolor: alpha(colors.border, 0.08),
            border: `1px solid ${alpha(colors.border, 0.12)}`,
        }}>
            {icon}
            <Typography sx={{
                fontSize: '0.76rem', fontWeight: 500,
                color: alpha(colors.text, 0.8),
            }}>
                {text}
            </Typography>
        </Box>
    );
}

function HeroMessage({ text, sub, statusColor, colors, cta, onCtaClick }: {
    text: string;
    sub: string;
    statusColor: string;
    colors: PortalDashboardColors;
    cta?: { label: string; href: string };
    onCtaClick?: (e: React.MouseEvent) => void;
}) {
    return (
        <Box sx={{ textAlign: 'center', mt: 1.5, maxWidth: 300, mx: 'auto' }}>
            <Typography sx={{
                fontSize: '0.82rem', fontWeight: 600, color: colors.text,
            }}>
                {text}
            </Typography>
            <Typography sx={{
                fontSize: '0.72rem', color: alpha(colors.muted, 0.65), mt: 0.3,
            }}>
                {sub}
            </Typography>
            {cta && (
                <Button
                    component="a" href={cta.href} size="small"
                    onClick={onCtaClick}
                    sx={{
                        mt: 1.5, fontSize: '0.78rem', fontWeight: 700,
                        textTransform: 'none', borderRadius: '10px',
                        px: 3, py: 0.8,
                        color: '#fff', bgcolor: statusColor,
                        boxShadow: `0 4px 16px ${alpha(statusColor, 0.3)}`,
                        '&:hover': {
                            bgcolor: alpha(statusColor, 0.85),
                            boxShadow: `0 6px 24px ${alpha(statusColor, 0.4)}`,
                        },
                    }}
                >
                    {cta.label}
                </Button>
            )}
        </Box>
    );
}

function HeroSignal({ eyebrow, text, sub, statusColor, colors, cta, onCtaClick, meta }: {
    eyebrow: string;
    text: string;
    sub: string;
    statusColor: string;
    colors: PortalDashboardColors;
    cta?: { label: string; href: string };
    onCtaClick?: (e: React.MouseEvent) => void;
    meta?: React.ReactNode;
}) {
    return (
        <Box sx={{ textAlign: 'center', mt: 2, maxWidth: 360, mx: 'auto' }}>
            <Typography sx={{
                fontSize: '0.62rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: statusColor,
                mb: 0.8,
            }}>
                {eyebrow}
            </Typography>
            <Typography sx={{
                fontSize: '0.92rem',
                fontWeight: 600,
                color: colors.text,
                lineHeight: 1.35,
            }}>
                {text}
            </Typography>
            <Typography sx={{
                fontSize: '0.74rem',
                color: alpha(colors.muted, 0.72),
                lineHeight: 1.6,
                mt: 0.45,
            }}>
                {sub}
            </Typography>
            {meta && <Box sx={{ mt: 1.1 }}>{meta}</Box>}
            {cta && (
                <Button
                    component="a"
                    href={cta.href}
                    onClick={onCtaClick}
                    size="small"
                    sx={{
                        mt: 1.4,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: '999px',
                        px: 2.2,
                        py: 0.7,
                        color: statusColor,
                        border: `1px solid ${alpha(statusColor, 0.26)}`,
                        bgcolor: alpha(statusColor, 0.06),
                        '&:hover': {
                            bgcolor: alpha(statusColor, 0.12),
                            borderColor: alpha(statusColor, 0.4),
                        },
                    }}
                >
                    {cta.label}
                </Button>
            )}
        </Box>
    );
}

function ProgressDots({ count, filled, color }: {
    count: number; filled: number; color: string;
}) {
    return (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
            {Array.from({ length: count }, (_, i) => (
                <Box
                    key={i}
                    sx={{
                        width: 6, height: 6, borderRadius: '50%',
                        bgcolor: i < filled ? color : alpha(color, 0.2),
                        transition: 'background-color 0.3s',
                    }}
                />
            ))}
        </Box>
    );
}
