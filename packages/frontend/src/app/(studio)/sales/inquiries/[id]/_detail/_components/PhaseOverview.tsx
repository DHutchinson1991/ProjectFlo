import React, { useCallback, useRef, useState } from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import {
    CheckCircle,
    ArrowForward,
    EmojiEvents,
    Bolt,
    OpenInNew,
} from '@mui/icons-material';
import { WORKFLOW_PHASES } from '../_lib';
import type { WorkflowPhase } from '../_lib';

/* ------------------------------------------------------------------ */
/*  Animated CSS keyframes                                             */
/* ------------------------------------------------------------------ */
const ANIM_STYLES = `
@keyframes pfo-bar-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes pfo-pulse-ring {
  0%, 100% { box-shadow: 0 0 0 0 var(--ring-color); }
  50%      { box-shadow: 0 0 0 8px transparent; }
}
@keyframes pfo-glow-breathe {
  0%, 100% { opacity: 0.35; }
  50%      { opacity: 0.75; }
}
@keyframes pfo-section-highlight {
  0%   { box-shadow: 0 0 0 0 var(--hl-color); }
  30%  { box-shadow: 0 0 30px 4px var(--hl-color); }
  100% { box-shadow: 0 0 0 0 transparent; }
}
`;

/* ------------------------------------------------------------------ */
/*  Tooltip content for each phase icon                                */
/* ------------------------------------------------------------------ */
const PhaseTooltip: React.FC<{
    phase: WorkflowPhase;
    isDone: boolean;
    isActive: boolean;
}> = ({ phase, isDone, isActive }) => (
    <Box sx={{ p: 1, maxWidth: 220 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
            <Box
                sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: phase.color,
                    flexShrink: 0,
                }}
            />
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#f1f5f9' }}>
                {phase.name}
            </Typography>
            {isDone && (
                <CheckCircle sx={{ fontSize: 13, color: '#22c55e', ml: 'auto' }} />
            )}
            {isActive && (
                <Chip
                    label="Current"
                    size="small"
                    sx={{
                        ml: 'auto',
                        height: 16,
                        fontSize: '0.52rem',
                        fontWeight: 800,
                        bgcolor: `${phase.color}25`,
                        color: phase.color,
                        border: `1px solid ${phase.color}40`,
                        '& .MuiChip-label': { px: 0.5 },
                    }}
                />
            )}
        </Box>
        <Typography sx={{ fontSize: '0.66rem', color: '#94a3b8', mb: 1, lineHeight: 1.4 }}>
            {phase.description}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
            {phase.tasks.map((task, i) => (
                <Box key={task} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography
                        sx={{
                            fontSize: '0.56rem',
                            fontWeight: 700,
                            color: isDone ? '#22c55e' : isActive && i === 0 ? phase.color : '#64748b',
                            width: 12,
                            textAlign: 'center',
                        }}
                    >
                        {isDone ? '✓' : `${i + 1}`}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '0.66rem',
                            color: isDone ? '#94a3b8' : isActive && i === 0 ? '#e2e8f0' : '#64748b',
                            fontWeight: isActive && i === 0 ? 600 : 400,
                            textDecoration: isDone ? 'line-through' : 'none',
                        }}
                    >
                        {task}
                    </Typography>
                </Box>
            ))}
        </Box>
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 1,
                pt: 0.75,
                borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            <OpenInNew sx={{ fontSize: 10, color: '#475569' }} />
            <Typography sx={{ fontSize: '0.55rem', color: '#475569', fontStyle: 'italic' }}>
                Click to jump to section
            </Typography>
        </Box>
    </Box>
);

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface PhaseOverviewProps {
    currentPhase: string;
    currentPhaseData: WorkflowPhase;
    activeIndex: number;
    inquiryId: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    IconComponent: React.ComponentType<any>;
}

/* ------------------------------------------------------------------ */
/*  Scroll-to-highlight helper                                         */
/* ------------------------------------------------------------------ */
const scrollToSection = (sectionId: string, color: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    /* Apply temporary highlight */
    el.style.setProperty('--hl-color', `${color}35`);
    el.style.animation = 'none';
    // force reflow
    void el.offsetHeight;
    el.style.animation = 'pfo-section-highlight 1.8s ease-out forwards';
    el.style.borderRadius = '16px';
    el.style.transition = 'box-shadow 0.3s ease';
    const cleanup = () => {
        el.style.animation = '';
        el.style.boxShadow = '';
        el.style.borderRadius = '';
    };
    setTimeout(cleanup, 2000);
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const PhaseOverview: React.FC<PhaseOverviewProps> = ({
    currentPhaseData,
    activeIndex,
}) => {
    const totalPhases = WORKFLOW_PHASES.length;
    const pct = Math.round(((activeIndex + 1) / totalPhases) * 100);
    const isComplete = activeIndex >= totalPhases - 1 && pct >= 100;
    const color = currentPhaseData?.color || '#3b82f6';

    const activeTasks = currentPhaseData?.tasks ?? [];
    const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);
    const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handlePhaseClick = useCallback((phase: WorkflowPhase) => {
        scrollToSection(phase.sectionId, phase.color);
    }, []);

    const handlePhaseHoverEnter = useCallback((phase: WorkflowPhase) => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setHoveredPhase(phase.id);
    }, []);

    const handlePhaseHoverLeave = useCallback(() => {
        hoverTimeout.current = setTimeout(() => setHoveredPhase(null), 150);
    }, []);

    return (
        <>
            <style>{ANIM_STYLES}</style>

            <Box
                sx={{
                    mt: 0,
                    mb: 3,
                    borderRadius: 4,
                    position: 'relative',
                    overflow: 'hidden',
                    /* Extra-prominent card: double the visual weight */
                    background: `linear-gradient(155deg, rgba(12, 14, 20, 0.98) 0%, rgba(18, 22, 30, 0.97) 40%, ${color}0C 100%)`,
                    border: `1.5px solid ${color}35`,
                    boxShadow: `
                        0 12px 50px rgba(0,0,0,0.6),
                        0 0 100px ${color}10,
                        0 0 40px ${color}08,
                        inset 0 1px 0 rgba(255,255,255,0.05),
                        inset 0 -1px 0 rgba(0,0,0,0.3)
                    `,
                }}
            >
                {/* ── Top ambient glow ── */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -80,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '80%',
                        height: 160,
                        background: `radial-gradient(ellipse, ${color}18, transparent 70%)`,
                        pointerEvents: 'none',
                        animation: 'pfo-glow-breathe 4s ease-in-out infinite',
                    }}
                />
                {/* ── Bottom edge glow ── */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -40,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '60%',
                        height: 80,
                        background: `radial-gradient(ellipse, ${color}0A, transparent 70%)`,
                        pointerEvents: 'none',
                    }}
                />

                {/* ════════ Phase Icon Track ════════ */}
                <Box sx={{ px: 3, pt: 3.5, pb: 2, position: 'relative', zIndex: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0,
                            mb: 2.5,
                        }}
                    >
                        {WORKFLOW_PHASES.map((phase, idx) => {
                            const isDone = idx < activeIndex;
                            const isActive = idx === activeIndex;
                            const isFuture = idx > activeIndex;
                            const PhaseIcon = phase.icon;
                            const isHovered = hoveredPhase === phase.id;

                            return (
                                <React.Fragment key={phase.id}>
                                    {/* Connector line */}
                                    {idx > 0 && (
                                        <Box
                                            sx={{
                                                flex: 1,
                                                maxWidth: 48,
                                                height: isDone ? 3 : 2,
                                                borderRadius: 2,
                                                bgcolor: isDone
                                                    ? `${phase.color}60`
                                                    : 'rgba(52, 58, 68, 0.18)',
                                                transition: 'all 0.4s ease',
                                                ...(isDone && {
                                                    boxShadow: `0 0 8px ${phase.color}20`,
                                                }),
                                            }}
                                        />
                                    )}

                                    {/* Phase dot */}
                                    <Tooltip
                                        title={
                                            <PhaseTooltip
                                                phase={phase}
                                                isDone={isDone}
                                                isActive={isActive}
                                            />
                                        }
                                        arrow
                                        placement="top"
                                        enterDelay={200}
                                        leaveDelay={100}
                                        slotProps={{
                                            tooltip: {
                                                sx: {
                                                    bgcolor: 'rgba(15, 17, 23, 0.97)',
                                                    border: `1px solid ${phase.color}30`,
                                                    backdropFilter: 'blur(16px)',
                                                    boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${phase.color}10`,
                                                    '& .MuiTooltip-arrow': {
                                                        color: 'rgba(15, 17, 23, 0.97)',
                                                    },
                                                },
                                            },
                                        }}
                                    >
                                        <Box
                                            onClick={() => handlePhaseClick(phase)}
                                            onMouseEnter={() => handlePhaseHoverEnter(phase)}
                                            onMouseLeave={handlePhaseHoverLeave}
                                            sx={{
                                                position: 'relative',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                '&:hover .pfo-dot': {
                                                    transform: 'scale(1.15)',
                                                    boxShadow: `0 0 24px ${phase.color}35`,
                                                },
                                            }}
                                        >
                                            {/* Pulse ring for active */}
                                            {isActive && (
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        inset: -4,
                                                        borderRadius: '50%',
                                                        '--ring-color': `${phase.color}45`,
                                                        animation: 'pfo-pulse-ring 2s ease-in-out infinite',
                                                    }}
                                                />
                                            )}

                                            <Box
                                                className="pfo-dot"
                                                sx={{
                                                    width: isActive ? 50 : 38,
                                                    height: isActive ? 50 : 38,
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: isDone
                                                        ? `${phase.color}20`
                                                        : isActive
                                                          ? `${phase.color}1A`
                                                          : isHovered
                                                            ? 'rgba(52, 58, 68, 0.25)'
                                                            : 'rgba(52, 58, 68, 0.12)',
                                                    border: `2px solid ${
                                                        isDone
                                                            ? `${phase.color}60`
                                                            : isActive
                                                              ? phase.color
                                                              : isHovered
                                                                ? `${phase.color}40`
                                                                : 'rgba(52, 58, 68, 0.22)'
                                                    }`,
                                                    transition: 'all 0.3s ease',
                                                    boxShadow: isActive
                                                        ? `0 0 28px ${phase.color}30`
                                                        : isDone
                                                          ? `0 0 12px ${phase.color}15`
                                                          : 'none',
                                                }}
                                            >
                                                {isDone ? (
                                                    <CheckCircle
                                                        sx={{
                                                            fontSize: isActive ? 26 : 20,
                                                            color: phase.color,
                                                        }}
                                                    />
                                                ) : (
                                                    <PhaseIcon
                                                        sx={{
                                                            fontSize: isActive ? 26 : 18,
                                                            color: isActive
                                                                ? phase.color
                                                                : isFuture
                                                                  ? '#475569'
                                                                  : phase.color,
                                                            opacity: isFuture ? 0.5 : 1,
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            {/* Label — always for active, on hover for others */}
                                            {(isActive || isHovered) && (
                                                <Typography
                                                    sx={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        mt: 0.75,
                                                        fontSize: isActive ? '0.6rem' : '0.52rem',
                                                        fontWeight: 700,
                                                        color: isActive ? phase.color : `${phase.color}cc`,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.06em',
                                                        whiteSpace: 'nowrap',
                                                        transition: 'opacity 0.2s ease',
                                                    }}
                                                >
                                                    {phase.name}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Tooltip>
                                </React.Fragment>
                            );
                        })}
                    </Box>
                </Box>

                {/* ════════ Animated Progress Bar ════════ */}
                <Box sx={{ px: 3, pb: 0.5, pt: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                                sx={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: '#94a3b8',
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Pipeline Progress
                            </Typography>
                            <Chip
                                label={`${activeIndex + 1}/${totalPhases} stages`}
                                size="small"
                                sx={{
                                    height: 18,
                                    fontSize: '0.58rem',
                                    fontWeight: 700,
                                    bgcolor: 'rgba(52, 58, 68, 0.2)',
                                    color: '#64748b',
                                    border: '1px solid rgba(52, 58, 68, 0.2)',
                                    '& .MuiChip-label': { px: 0.75 },
                                }}
                            />
                        </Box>
                        <Typography
                            sx={{
                                fontSize: '1.15rem',
                                fontWeight: 900,
                                letterSpacing: '-0.02em',
                                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            {pct}%
                        </Typography>
                    </Box>

                    {/* Bar track */}
                    <Box
                        sx={{
                            height: 10,
                            borderRadius: 5,
                            bgcolor: 'rgba(52, 58, 68, 0.15)',
                            border: '1px solid rgba(52, 58, 68, 0.12)',
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        <Box
                            sx={{
                                height: '100%',
                                width: `${pct}%`,
                                borderRadius: 5,
                                background: `linear-gradient(90deg, ${color}cc, ${color})`,
                                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: 5,
                                    background:
                                        'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                                    backgroundSize: '200% 100%',
                                    animation: 'pfo-bar-shimmer 2.5s ease-in-out infinite',
                                }}
                            />
                        </Box>
                    </Box>
                </Box>

                {/* ════════ Compact Steps Row ════════ */}
                <Box sx={{ px: 3, pt: 2.5, pb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Bolt sx={{ fontSize: 15, color }} />
                        <Typography
                            sx={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: '#94a3b8',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                            }}
                        >
                            Steps to complete
                        </Typography>
                    </Box>

                    {/* Single-row step chips */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap', overflow: 'hidden' }}>
                        {activeTasks.map((task, idx) => {
                            const isFirst = idx === 0;
                            return (
                                <Box
                                    key={task}
                                    sx={{
                                        flex: '1 1 0',
                                        minWidth: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        px: 1.5,
                                        py: 1,
                                        borderRadius: 2,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        bgcolor: isFirst ? `${color}0C` : 'rgba(52, 58, 68, 0.08)',
                                        border: `1px solid ${isFirst ? `${color}30` : 'rgba(52, 58, 68, 0.15)'}`,
                                        transition: 'all 0.25s ease',
                                        '&:hover': {
                                            bgcolor: isFirst ? `${color}18` : 'rgba(52, 58, 68, 0.18)',
                                            borderColor: isFirst ? `${color}50` : 'rgba(52, 58, 68, 0.3)',
                                            transform: 'translateY(-1px)',
                                            boxShadow: isFirst
                                                ? `0 4px 16px ${color}18`
                                                : '0 4px 12px rgba(0,0,0,0.2)',
                                        },
                                        /* Left accent stripe for step 1 */
                                        ...(isFirst && {
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                bottom: 0,
                                                width: 3,
                                                borderRadius: '3px 0 0 3px',
                                                background: `linear-gradient(180deg, ${color}, ${color}80)`,
                                            },
                                        }),
                                    }}
                                >
                                    {/* Step number */}
                                    <Box
                                        sx={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: isFirst ? `${color}20` : 'rgba(52, 58, 68, 0.2)',
                                            border: `1.5px solid ${isFirst ? `${color}50` : 'rgba(52, 58, 68, 0.25)'}`,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: '0.6rem',
                                                fontWeight: 800,
                                                color: isFirst ? color : '#64748b',
                                                lineHeight: 1,
                                            }}
                                        >
                                            {idx + 1}
                                        </Typography>
                                    </Box>

                                    {/* Task text */}
                                    <Typography
                                        sx={{
                                            fontSize: '0.74rem',
                                            fontWeight: isFirst ? 700 : 500,
                                            color: isFirst ? '#f1f5f9' : '#94a3b8',
                                            lineHeight: 1.2,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {task}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>

                    {/* Next stage teaser */}
                    {activeIndex < totalPhases - 1 && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mt: 2,
                                pt: 1.5,
                                borderTop: '1px solid rgba(52, 58, 68, 0.12)',
                            }}
                        >
                            <ArrowForward sx={{ fontSize: 12, color: '#475569' }} />
                            <Typography sx={{ fontSize: '0.65rem', color: '#475569', fontWeight: 500 }}>
                                Then:
                            </Typography>
                            <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                                {WORKFLOW_PHASES[activeIndex + 1].name}
                            </Typography>
                            <Box
                                sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: `${WORKFLOW_PHASES[activeIndex + 1].color}40`,
                                    border: `1px solid ${WORKFLOW_PHASES[activeIndex + 1].color}30`,
                                }}
                            />
                        </Box>
                    )}

                    {/* Completion celebration */}
                    {isComplete && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1.5,
                                mt: 2,
                                py: 1.5,
                                borderRadius: 2,
                                bgcolor: 'rgba(34, 197, 94, 0.06)',
                                border: '1px solid rgba(34, 197, 94, 0.15)',
                            }}
                        >
                            <EmojiEvents sx={{ fontSize: 20, color: '#22c55e' }} />
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#22c55e' }}>
                                All stages complete!
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </>
    );
};

export { PhaseOverview };
