"use client";

import React, { useMemo, useState } from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import { KeyboardArrowUp as ChevronUpIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { getJourneyIcon } from './journey-icons';
import type { PortalDashboardColors } from '@/features/workflow/proposals/utils/portal/themes';
import type { JourneyStep } from '@/features/workflow/proposals/types/portal';

const pulseRing = keyframes`
    0%   { transform: scale(1); opacity: 0.7; }
    100% { transform: scale(1.9); opacity: 0; }
`;

interface JourneyProgressRailProps {
    steps: JourneyStep[];
    colors: PortalDashboardColors;
    currentStepRef: React.RefObject<HTMLDivElement | null>;
    onStepCtaClick?: (step: JourneyStep) => boolean | void;
    onStepClick?: (step: JourneyStep) => boolean | void;
    isStepClickable?: (step: JourneyStep) => boolean;
}

const STATUS_COLORS: Record<string, string> = {
    completed: '#22c55e',
    active: '#60a5fa',
    waiting: '#f59e0b',
    upcoming: '#6b7280',
    locked: '#374151',
};

function relativeTime(iso: string | undefined): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function JourneyProgressRail({ steps, colors, currentStepRef, onStepCtaClick, onStepClick, isStepClickable }: JourneyProgressRailProps) {
    const [historyOpen, setHistoryOpen] = useState(false);
    const [laterOpen, setLaterOpen] = useState(false);

    const completedCount = steps.filter((step) => step.status === 'completed').length;
    const currentCount = steps.some((step) => step.status === 'active' || step.status === 'waiting') ? 1 : 0;
    const progressPct = steps.length > 0 ? ((completedCount + currentCount) / steps.length) * 100 : 0;

    const { completedSteps, activeZone, lockedSteps } = useMemo(() => {
        const completed: JourneyStep[] = [];
        const active: JourneyStep[] = [];
        const locked: JourneyStep[] = [];

        let pastActive = false;
        for (const step of steps) {
            if (step.status === 'locked') {
                locked.push(step);
                continue;
            }

            if (step.status === 'completed' && !pastActive) {
                completed.push(step);
                continue;
            }

            pastActive = true;
            active.push(step);
        }

        return { completedSteps: completed, activeZone: active, lockedSteps: locked };
    }, [steps]);

    const previewCount = 2;
    const previewSteps = completedSteps.slice(-previewCount);
    const hiddenSteps = completedSteps.slice(0, -previewCount);

    return (
        <Box sx={{ mt: { xs: 4.5, md: 5.5 }, maxWidth: 680, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.1 }}>
                <Typography sx={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: alpha(colors.muted, 0.78),
                }}>
                    Your journey
                </Typography>
            </Box>

            <Box sx={{
                height: 2,
                borderRadius: '999px',
                bgcolor: alpha(colors.border, 0.82),
                overflow: 'hidden',
                mb: 1.1,
            }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(progressPct, 4)}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        height: '100%',
                        borderRadius: '999px',
                        background: `linear-gradient(90deg, ${STATUS_COLORS.active} 0%, ${alpha(STATUS_COLORS.active, 0.72)} 100%)`,
                        boxShadow: `0 0 14px ${alpha(STATUS_COLORS.active, 0.24)}`,
                    }}
                />
            </Box>

            <AnimatePresence initial={false}>
                {historyOpen && hiddenSteps.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        {hiddenSteps.map((step) => (
                            <RailStepRow
                                key={step.key}
                                step={step}
                                isLast={false}
                                colors={colors}
                                onStepCtaClick={onStepCtaClick}
                                onStepClick={onStepClick}
                                isStepClickable={isStepClickable}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {hiddenSteps.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.25 }}>
                    <IconButton
                        size="small"
                        onClick={() => setHistoryOpen((open) => !open)}
                        disableRipple
                        sx={{
                            color: alpha(colors.muted, 0.46),
                            '&:hover': { color: colors.text, bgcolor: alpha(colors.border, 0.08) },
                        }}
                    >
                        <motion.div
                            animate={{ rotate: historyOpen ? 0 : 180 }}
                            transition={{ duration: 0.25 }}
                            style={{ display: 'flex' }}
                        >
                            <ChevronUpIcon sx={{ fontSize: 18 }} />
                        </motion.div>
                    </IconButton>
                </Box>
            )}

            <Box sx={{
                position: 'relative',
                '&::before': previewSteps.length > 0 && !historyOpen ? {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    height: '60%',
                    zIndex: 2,
                    pointerEvents: 'none',
                    background: `linear-gradient(to bottom, ${alpha(colors.bg, 0.18)} 0%, transparent 100%)`,
                } : undefined,
            }}>
                {previewSteps.map((step, index) => (
                    <motion.div
                        key={step.key}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: historyOpen ? 1 : 0.26 + index * 0.18, y: 0 }}
                        transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1], delay: index * 0.08 }}
                    >
                        <RailStepRow
                            step={step}
                            isLast={false}
                            colors={colors}
                            onStepCtaClick={onStepCtaClick}
                            onStepClick={onStepClick}
                            isStepClickable={isStepClickable}
                            faded={!historyOpen}
                        />
                    </motion.div>
                ))}
            </Box>

            {activeZone.map((step, index) => {
                const isCurrent = step.status === 'active' || step.status === 'waiting';
                const isLast = index === activeZone.length - 1 && lockedSteps.length === 0;

                return (
                    <RailStepRow
                        key={step.key}
                        step={step}
                        isLast={isLast}
                        colors={colors}
                        ref={isCurrent ? currentStepRef : undefined}
                        onStepCtaClick={onStepCtaClick}
                        onStepClick={onStepClick}
                        isStepClickable={isStepClickable}
                    />
                );
            })}

            {/* "Coming up" collapsible section for locked steps */}
            {lockedSteps.length > 0 && (
                <>
                    <Box
                        onClick={() => setLaterOpen((o) => !o)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.8,
                            py: 1.2,
                            cursor: 'pointer',
                            userSelect: 'none',
                            '&:hover .chevron-icon': { color: colors.text },
                        }}
                    >
                        <Typography sx={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: alpha(colors.muted, 0.44),
                        }}>
                            {laterOpen ? 'Hide upcoming' : `${lockedSteps.length} more steps`}
                        </Typography>
                        <motion.div
                            animate={{ rotate: laterOpen ? 180 : 0 }}
                            transition={{ duration: 0.25 }}
                            style={{ display: 'flex' }}
                        >
                            <ChevronUpIcon
                                className="chevron-icon"
                                sx={{
                                    fontSize: 16,
                                    color: alpha(colors.muted, 0.36),
                                    transition: 'color 0.2s ease',
                                    transform: 'rotate(180deg)',
                                }}
                            />
                        </motion.div>
                    </Box>

                    <AnimatePresence initial={false}>
                        {laterOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                style={{ overflow: 'hidden' }}
                            >
                                {lockedSteps.map((step, index) => (
                                    <RailStepRow
                                        key={step.key}
                                        step={step}
                                        isLast={index === lockedSteps.length - 1}
                                        colors={colors}
                                        onStepCtaClick={onStepCtaClick}
                                        onStepClick={onStepClick}
                                        isStepClickable={isStepClickable}
                                        faded
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </Box>
    );
}

const RailStepRow = React.forwardRef<HTMLDivElement, {
    step: JourneyStep;
    isLast: boolean;
    colors: PortalDashboardColors;
    faded?: boolean;
    onStepCtaClick?: (step: JourneyStep) => boolean | void;
    onStepClick?: (step: JourneyStep) => boolean | void;
    isStepClickable?: (step: JourneyStep) => boolean;
}>(function RailStepRow({ step, isLast, colors, faded = false, onStepCtaClick, onStepClick, isStepClickable }, ref) {
    const statusColor = STATUS_COLORS[step.status] ?? STATUS_COLORS.upcoming;
    const isCompleted = step.status === 'completed';
    const isCurrent = step.status === 'active' || step.status === 'waiting';
    const isUpcoming = step.status === 'upcoming';
    const isLocked = step.status === 'locked';
    const isRowClickable = !!onStepClick && (isStepClickable ? isStepClickable(step) : true);
    const Icon = getJourneyIcon(step.icon);
    const subline = step.waitingMessage || step.summary || (isCompleted ? relativeTime(step.completedAt) : null);

    const action = (() => {
        if (step.cta && (isCurrent || isCompleted)) {
            return (
                <Button
                    component="a"
                    href={step.cta.href}
                    size="small"
                    onClick={(e) => {
                        const handled = onStepCtaClick?.(step);
                        if (handled) e.preventDefault();
                    }}
                    sx={{
                        minWidth: 84,
                        borderRadius: '999px',
                        px: 1.6,
                        py: 0.65,
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        color: isCurrent ? statusColor : colors.text,
                        bgcolor: isCurrent ? alpha(statusColor, 0.06) : 'transparent',
                        border: `1px solid ${alpha(isCurrent ? statusColor : colors.border, isCurrent ? 0.26 : 0.84)}`,
                        '&:hover': {
                            bgcolor: isCurrent ? alpha(statusColor, 0.12) : alpha(colors.border, 0.08),
                            borderColor: isCurrent ? alpha(statusColor, 0.4) : undefined,
                        },
                    }}
                >
                    {step.cta.label}
                </Button>
            );
        }

        if (isCurrent) return <StatusPill label={step.status === 'waiting' ? 'Waiting' : 'Current'} color={statusColor} filled />;
        if (isCompleted) return <StatusPill label="Done" color={statusColor} />;
        if (isLocked) return <StatusPill label="Later" color={colors.muted} muted />;
        return null;
    })();

    return (
        <Box
            ref={ref}
            sx={{
                display: 'grid',
                gridTemplateColumns: '12px minmax(0, 1fr)',
                columnGap: { xs: 1.1, md: 1.4 },
                opacity: faded ? 0.56 : 1,
            }}
        >
            <Box sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pt: 1,
            }}>
                {isCurrent && (
                    <Box sx={{
                        position: 'absolute',
                        top: 4,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        border: `1px solid ${alpha(statusColor, 0.55)}`,
                        animation: `${pulseRing} 1.8s ease-out infinite`,
                    }} />
                )}

                <Box sx={{
                    position: 'relative',
                    width: isCurrent ? 8 : 6,
                    height: isCurrent ? 8 : 6,
                    borderRadius: '50%',
                    border: `1px solid ${isUpcoming || isLocked ? alpha(colors.border, 0.46) : alpha(statusColor, 0.86)}`,
                    bgcolor: alpha(colors.bg, 0.9),
                    mt: 0.35,
                }}>
                    <Box sx={{
                        position: 'absolute',
                        inset: 1,
                        borderRadius: '50%',
                        bgcolor: isCompleted || isCurrent ? statusColor : 'transparent',
                        boxShadow: isCurrent ? `0 0 8px ${alpha(statusColor, 0.35)}` : 'none',
                    }} />
                </Box>

                {!isLast && (
                    <Box sx={{
                        width: '1px',
                        flexGrow: 1,
                        minHeight: 30,
                        mt: 0.5,
                        bgcolor: isCompleted
                            ? alpha(statusColor, 0.44)
                            : isCurrent
                                ? alpha(statusColor, 0.26)
                                : alpha(colors.border, 0.5),
                    }} />
                )}
            </Box>

            <Box
                onClick={() => {
                    if (!isRowClickable) return;
                    onStepClick?.(step);
                }}
                role={isRowClickable ? 'button' : undefined}
                tabIndex={isRowClickable ? 0 : -1}
                onKeyDown={(e) => {
                    if (!isRowClickable) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onStepClick?.(step);
                    }
                }}
                sx={{
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.2,
                    py: 0.88,
                    borderBottom: isLast ? 'none' : `1px solid ${alpha(colors.border, 0.44)}`,
                    transition: 'background-color 0.2s ease',
                    cursor: isRowClickable ? 'pointer' : 'default',
                    '&:hover': isRowClickable ? { bgcolor: alpha(colors.border, 0.05) } : undefined,
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}
                >
                    <Box sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '9px',
                        display: { xs: 'none', sm: 'flex' },
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(colors.card, 0.42),
                        border: `1px solid ${alpha(isCurrent ? statusColor : colors.border, isCurrent ? 0.34 : 0.42)}`,
                        color: isUpcoming || isLocked ? alpha(colors.muted, 0.35) : isCurrent ? statusColor : alpha(statusColor, 0.45),
                        flexShrink: 0,
                    }}>
                        <Icon sx={{ fontSize: 14 }} />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{
                            fontSize: isCurrent ? '0.9rem' : '0.84rem',
                            fontWeight: isCurrent ? 700 : 500,
                            color: isUpcoming || isLocked ? alpha(colors.text, 0.42) : isCurrent ? colors.text : alpha(colors.text, 0.48),
                            lineHeight: 1.25,
                        }}>
                            {step.label}
                        </Typography>
                        {subline && (
                            <Typography sx={{
                                mt: 0.2,
                                fontSize: '0.71rem',
                                color: alpha(colors.muted, isUpcoming || isLocked ? 0.34 : isCurrent ? 0.62 : 0.4),
                                lineHeight: 1.45,
                                maxWidth: 340,
                            }}>
                                {subline}
                            </Typography>
                        )}
                    </Box>
                </motion.div>

                {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
            </Box>
        </Box>
    );
});

function StatusPill({ label, color, filled = false, muted = false }: {
    label: string;
    color: string;
    filled?: boolean;
    muted?: boolean;
}) {
    return (
        <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 70,
            px: 0.85,
            py: 0.34,
            borderRadius: '8px',
            border: `1px solid ${alpha(color, muted ? 0.16 : 0.3)}`,
            bgcolor: filled ? color : alpha(color, muted ? 0.04 : 0.08),
        }}>
            <Typography sx={{
                fontSize: '0.56rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: filled ? '#fff' : color,
            }}>
                {label}
            </Typography>
        </Box>
    );
}
