import React, { useCallback, useRef, useState, useMemo } from 'react';
import { Box, Typography, Chip, Tooltip, Checkbox } from '@mui/material';
import {
    CheckCircle,
    EmojiEvents,
    Bolt,
    OpenInNew,
    ArrowForward,
    TrendingUp,
    AccessTime,
    CalendarMonth,
} from '@mui/icons-material';
import type { Inquiry } from '@/lib/types';
import { WORKFLOW_PHASES, getTempColor, TASK_AUTO_COMPLETE, computeActiveIndex } from '../_lib';
import type { PipelineTask, WorkflowPhase } from '../_lib';

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
  50%      { box-shadow: 0 0 0 6px transparent; }
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
@keyframes pfo-liquid-wave {
  0%   { transform: translateX(-100%) scaleY(1); }
  50%  { transform: translateX(0%) scaleY(1.4); }
  100% { transform: translateX(100%) scaleY(1); }
}
@keyframes pfo-light-pulse {
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1; }
}
`;

/* ------------------------------------------------------------------ */
/*  Tooltip content for a pipeline task                                */
/* ------------------------------------------------------------------ */
const TaskTooltip: React.FC<{
    task: PipelineTask;
    idx: number;
    total: number;
    isDone: boolean;
    isActive: boolean;
    onToggle?: () => void;
    pending?: boolean;
    autoComplete?: { isDone: boolean; doneLabel: string; pendingLabel: string };
}> = ({ task, idx, total, isDone, isActive, onToggle, pending, autoComplete }) => (
    <Box sx={{ p: 1.25, maxWidth: 280 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
            <Box
                sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: task.color,
                    flexShrink: 0,
                }}
            />
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9' }}>
                {task.name}
            </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75, flexWrap: 'wrap' }}>
            <Chip
                label={task.phase}
                size="small"
                sx={{
                    height: 20,
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    bgcolor: `${task.color}18`,
                    color: `${task.color}cc`,
                    border: `1px solid ${task.color}30`,
                    '& .MuiChip-label': { px: 0.75 },
                }}
            />
            <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                Step {idx + 1} of {total}
            </Typography>
            {isDone && <CheckCircle sx={{ fontSize: 14, color: '#22c55e', ml: 'auto' }} />}
            {isActive && (
                <Chip
                    label="Current"
                    size="small"
                    sx={{
                        ml: 'auto',
                        height: 20,
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        bgcolor: `${task.color}25`,
                        color: task.color,
                        border: `1px solid ${task.color}40`,
                        '& .MuiChip-label': { px: 0.75 },
                    }}
                />
            )}
        </Box>
        {/* Effort hours + due date */}
        {(task.estimated_hours || task.due_date) && (
            <Box sx={{ display: 'flex', gap: 1.5, mb: 0.75, flexWrap: 'wrap' }}>
                {task.estimated_hours != null && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <AccessTime sx={{ fontSize: 11, color: '#64748b' }} />
                        <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
                            {Number(task.estimated_hours)}h est.
                        </Typography>
                    </Box>
                )}
                {task.due_date && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <CalendarMonth sx={{ fontSize: 11, color: '#64748b' }} />
                        <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
                            {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </Typography>
                    </Box>
                )}
            </Box>
        )}
        {task.description && (
            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4 }}>
                {task.description}
            </Typography>
        )}
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
            {/* Auto-tracked task (data-driven, not manually toggleable) */}
            {autoComplete ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
                    {autoComplete.isDone ? (
                        <>
                            <CheckCircle sx={{ fontSize: 14, color: '#22c55e' }} />
                            <Typography sx={{ fontSize: '0.65rem', color: '#22c55e', fontWeight: 600 }}>
                                {autoComplete.doneLabel}
                            </Typography>
                            <Typography sx={{ fontSize: '0.55rem', color: '#475569', ml: 'auto', fontStyle: 'italic' }}>
                                auto-tracked
                            </Typography>
                        </>
                    ) : (
                        <>
                            <OpenInNew sx={{ fontSize: 11, color: task.color }} />
                            <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
                                {autoComplete.pendingLabel}
                            </Typography>
                        </>
                    )}
                </Box>
            ) : onToggle && isDone ? (
                /* Manual task — completed: show status + undo */
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
                    <CheckCircle sx={{ fontSize: 14, color: '#22c55e' }} />
                    <Typography sx={{ fontSize: '0.65rem', color: '#22c55e', fontWeight: 600 }}>
                        Completed
                    </Typography>
                    <Typography
                        onClick={(e) => { e.stopPropagation(); if (!pending) onToggle(); }}
                        sx={{
                            fontSize: '0.6rem',
                            color: '#94a3b8',
                            fontWeight: 600,
                            ml: 'auto',
                            cursor: pending ? 'wait' : 'pointer',
                            opacity: pending ? 0.5 : 1,
                            '&:hover': { color: '#e2e8f0', textDecoration: 'underline' },
                        }}
                    >
                        {pending ? 'Saving…' : 'Undo'}
                    </Typography>
                </Box>
            ) : onToggle ? (
                /* Manual task — not done: checkbox to mark complete */
                <Box
                    onClick={(e) => { e.stopPropagation(); if (!pending) onToggle(); }}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        cursor: pending ? 'wait' : 'pointer',
                        opacity: pending ? 0.5 : 1,
                        borderRadius: 1,
                        px: 0.5,
                        py: 0.25,
                        mx: -0.5,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                        width: '100%',
                    }}
                >
                    <Checkbox
                        checked={false}
                        disabled={pending}
                        size="small"
                        sx={{
                            p: 0,
                            color: '#475569',
                            '& .MuiSvgIcon-root': { fontSize: 16 },
                        }}
                    />
                    <Typography sx={{ fontSize: '0.65rem', color: '#cbd5e1', fontWeight: 600 }}>
                        {pending ? 'Saving…' : 'Mark as complete'}
                    </Typography>
                </Box>
            ) : (
                /* No real tasks — navigation hint + setup note */
                <>
                    <OpenInNew sx={{ fontSize: 11, color: '#475569' }} />
                    <Typography sx={{ fontSize: '0.6rem', color: '#475569', fontStyle: 'italic' }}>
                        Click to jump to section
                    </Typography>
                    {!isDone && (
                        <Typography sx={{ fontSize: '0.55rem', color: '#475569', ml: 'auto', fontStyle: 'italic' }}>
                            Refresh to enable tracking
                        </Typography>
                    )}
                </>
            )}
        </Box>
    </Box>
);

/* ------------------------------------------------------------------ */
/*  Scroll-to-highlight helper                                         */
/* ------------------------------------------------------------------ */
const scrollToSection = (sectionId: string, color: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.setProperty('--hl-color', `${color}35`);
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = 'pfo-section-highlight 1.8s ease-out forwards';
    el.style.borderRadius = '16px';
    el.style.transition = 'box-shadow 0.3s ease';
    setTimeout(() => {
        el.style.animation = '';
        el.style.boxShadow = '';
        el.style.borderRadius = '';
    }, 2000);
};

/* ------------------------------------------------------------------ */
/*  Progress calculation — uses shared computeActiveIndex from _lib    */
/* ------------------------------------------------------------------  */

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface PhaseOverviewProps {
    inquiry: Inquiry & { activity_logs?: unknown[] };
    pipelineTasks: PipelineTask[];
    hasRealTasks: boolean;
    onToggleTask: (task: PipelineTask) => Promise<void> | void;
    taskActionPending?: boolean;
    /** Legacy props kept for backward compatibility */
    currentPhase?: string;
    currentPhaseData?: WorkflowPhase;
    activeIndex?: number;
    inquiryId?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    IconComponent?: React.ComponentType<any>;
}

/* ------------------------------------------------------------------ */
/*  Phase-group divider                                                */
/* ------------------------------------------------------------------ */
const PhaseDivider: React.FC<{ label: string; color: string }> = ({ label, color }) => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mx: 1.5,
            gap: 0.25,
        }}
    >
        <Box sx={{ width: 2, height: 20, borderRadius: 1, bgcolor: `${color}30` }} />
        <ArrowForward
            sx={{
                fontSize: 11,
                color: `${color}66`,
            }}
        />
        <Box sx={{ width: 2, height: 20, borderRadius: 1, bgcolor: `${color}30` }} />
    </Box>
);

/* ================================================================== */
/*  PhaseOverview Component                                            */
/* ================================================================== */
const PhaseOverview: React.FC<PhaseOverviewProps> = ({ inquiry, pipelineTasks, hasRealTasks, onToggleTask, taskActionPending = false }) => {

    /* ── Derived state ── */
    const hasTasks = pipelineTasks.length > 0;
    const totalTasks = hasTasks ? pipelineTasks.length : WORKFLOW_PHASES.length;
    const activeIndex = computeActiveIndex(pipelineTasks, inquiry);
    // For real tasks, count actual completions + auto-complete overrides; for fallback, use heuristic
    const completedCount = hasRealTasks
        ? pipelineTasks.filter(t => {
              const autoRule = TASK_AUTO_COMPLETE[t.name];
              if (autoRule && autoRule.check(inquiry)) return true;
              return t.status === 'Completed';
          }).length
        : activeIndex;
    const pct = Math.round((completedCount / totalTasks) * 100);
    const isComplete = completedCount >= totalTasks;

    const currentTask = hasTasks ? pipelineTasks[activeIndex] : null;
    // Temperature-gradient color for the active dot (shifts cool→warm→green)
    const tempColor = getTempColor(activeIndex, totalTasks);
    const color = tempColor;

    const inquiryTasks = useMemo(() => pipelineTasks.filter(t => t.phase === 'Inquiry'), [pipelineTasks]);
    const bookingTasks = useMemo(() => pipelineTasks.filter(t => t.phase === 'Booking'), [pipelineTasks]);

    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleHoverEnter = useCallback((id: number) => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setHoveredId(id);
    }, []);

    const handleHoverLeave = useCallback(() => {
        hoverTimeout.current = setTimeout(() => setHoveredId(null), 150);
    }, []);

    /* ── Render a single task dot ── */
    const renderTaskDot = useCallback(
        (task: PipelineTask, globalIdx: number) => {
            // Check if this task is auto-determined from inquiry data
            const autoRule = TASK_AUTO_COMPLETE[task.name];
            const autoStatus = autoRule
                ? { isDone: autoRule.check(inquiry), doneLabel: autoRule.doneLabel, pendingLabel: autoRule.pendingLabel }
                : undefined;

            // Determine state: auto-complete overrides backend status
            const isDone = autoStatus
                ? autoStatus.isDone
                : (task.status ? task.status === 'Completed' : globalIdx < activeIndex);
            const isActive = !isDone && (task.status
                ? globalIdx === activeIndex
                : globalIdx === activeIndex);
            const isFuture = !isDone && (task.status
                ? globalIdx > activeIndex
                : globalIdx > activeIndex);
            const TaskIcon = task.icon;
            const isHovered = hoveredId === task.id;
            // Temperature color for this specific dot
            const dotTempColor = getTempColor(globalIdx, totalTasks);
            const dotColor = isDone ? dotTempColor : isActive ? dotTempColor : task.color;

            const handleDotClick = () => {
                scrollToSection(task.sectionId, dotColor);
            };

            return (
                <Tooltip
                    key={task.id}
                    title={
                        <TaskTooltip
                            task={{ ...task, color: dotColor }}
                            idx={globalIdx}
                            total={totalTasks}
                            isDone={isDone}
                            isActive={isActive}
                            onToggle={!autoStatus && hasRealTasks && task.inquiry_task_id ? () => { if (!taskActionPending) void onToggleTask(task); } : undefined}
                            pending={taskActionPending}
                            autoComplete={autoStatus}
                        />
                    }
                    arrow
                    placement="top"
                    enterDelay={150}
                    leaveDelay={100}
                    slotProps={{
                        tooltip: {
                            sx: {
                                bgcolor: 'rgba(15, 17, 23, 0.97)',
                                border: `1px solid ${dotColor}30`,
                                backdropFilter: 'blur(16px)',
                                boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${dotColor}10`,
                                '& .MuiTooltip-arrow': { color: 'rgba(15, 17, 23, 0.97)' },
                            },
                        },
                    }}
                >
                    <Box
                        onClick={handleDotClick}
                        onMouseEnter={() => handleHoverEnter(task.id)}
                        onMouseLeave={handleHoverLeave}
                        sx={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                            '&:hover .pfo-dot': {
                                transform: 'scale(1.15)',
                                boxShadow: `0 0 20px ${dotColor}40`,
                            },
                        }}
                    >
                        {isActive && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: -5,
                                    borderRadius: '50%',
                                    '--ring-color': `${dotColor}50`,
                                    animation: 'pfo-pulse-ring 2s ease-in-out infinite',
                                }}
                            />
                        )}

                        <Box
                            className="pfo-dot"
                            sx={{
                                width: isActive ? 46 : 34,
                                height: isActive ? 46 : 34,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: isDone
                                    ? `${dotColor}20`
                                    : isActive
                                      ? `${dotColor}1A`
                                      : isHovered
                                        ? 'rgba(52, 58, 68, 0.25)'
                                        : 'rgba(52, 58, 68, 0.12)',
                                border: `2px solid ${
                                    isDone
                                        ? `${dotColor}60`
                                        : isActive
                                          ? dotColor
                                          : isHovered
                                            ? `${dotColor}40`
                                            : 'rgba(52, 58, 68, 0.22)'
                                }`,
                                transition: 'all 0.3s ease',
                                boxShadow: isActive
                                    ? `0 0 24px ${dotColor}40, 0 0 48px ${dotColor}15`
                                    : isDone
                                      ? `0 0 10px ${dotColor}18`
                                      : 'none',
                            }}
                        >
                            {isDone ? (
                                <CheckCircle sx={{ fontSize: isActive ? 22 : 17, color: dotColor }} />
                            ) : (
                                <TaskIcon
                                    sx={{
                                        fontSize: isActive ? 22 : 16,
                                        color: isActive ? dotColor : isFuture ? '#475569' : dotColor,
                                        opacity: isFuture ? 0.5 : 1,
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                </Tooltip>
            );
        },
        [activeIndex, hoveredId, totalTasks, hasRealTasks, inquiry, handleHoverEnter, handleHoverLeave, onToggleTask, taskActionPending],
    );

    /* ── Connector between dots (light path when done) ── */
    const Connector: React.FC<{ done: boolean; dotColor: string; nextColor?: string }> = ({ done, dotColor, nextColor }) => (
        <Box
            sx={{
                flex: 1,
                maxWidth: 24,
                minWidth: 8,
                height: done ? 3.5 : 2,
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
                bgcolor: done
                    ? 'transparent'
                    : 'rgba(52, 58, 68, 0.18)',
                transition: 'all 0.4s ease',
                ...(done && {
                    background: `linear-gradient(90deg, ${dotColor}88, ${nextColor ?? dotColor}88)`,
                    boxShadow: `0 0 10px ${dotColor}30, 0 0 4px ${nextColor ?? dotColor}25`,
                    animation: 'pfo-light-pulse 3s ease-in-out infinite',
                }),
            }}
        />
    );

    /* ── Render a group of task dots with connectors ── */
    const renderGroup = (tasks: PipelineTask[], globalOffset: number) =>
        tasks.map((task, localIdx) => {
            const globalIdx = globalOffset + localIdx;
            const prevIdx = globalOffset + localIdx - 1;
            // Connector is lit if the current dot is completed (including auto-complete rules)
            const connDone = hasRealTasks
                ? (() => {
                      const autoRule = TASK_AUTO_COMPLETE[task.name];
                      if (autoRule && autoRule.check(inquiry)) return true;
                      return task.status === 'Completed';
                  })()
                : globalIdx <= activeIndex;
            return (
                <React.Fragment key={task.id}>
                    {localIdx > 0 && (
                        <Connector
                            done={connDone}
                            dotColor={getTempColor(prevIdx, totalTasks)}
                            nextColor={getTempColor(globalIdx, totalTasks)}
                        />
                    )}
                    {renderTaskDot(task, globalIdx)}
                </React.Fragment>
            );
        });

    /* ── Legacy fallback (no task library data) ── */
    if (!hasTasks) {
        return <LegacyPhaseOverview inquiry={inquiry} />;
    }

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
                {/* ── Ambient glows ── */}
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

                {/* ════════ Current Task Hero ════════ */}
                <Box sx={{ px: 3, pt: 3.5, pb: 2, position: 'relative', zIndex: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        {/* Active task icon — large */}
                        {currentTask && (() => {
                            const ActiveIcon = currentTask.icon;
                            return (
                                <Box
                                    sx={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: `${color}18`,
                                        border: `2px solid ${color}80`,
                                        boxShadow: `0 0 28px ${color}30, 0 0 56px ${color}10`,
                                        '--ring-color': `${color}40`,
                                        animation: 'pfo-pulse-ring 2.5s ease-in-out infinite',
                                        flexShrink: 0,
                                    }}
                                >
                                    <ActiveIcon sx={{ fontSize: 26, color }} />
                                </Box>
                            );
                        })()}

                        {/* Task name + phase + motivational line */}
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Chip
                                    label={currentTask?.phase ?? 'Inquiry'}
                                    size="small"
                                    sx={{
                                        height: 22,
                                        fontSize: '0.65rem',
                                        fontWeight: 800,
                                        bgcolor: `${color}18`,
                                        color: `${color}cc`,
                                        border: `1px solid ${color}30`,
                                        '& .MuiChip-label': { px: 0.75 },
                                    }}
                                />
                                <Typography sx={{ fontSize: '0.7rem', color: '#475569' }}>
                                    Step {activeIndex + 1} of {totalTasks}
                                </Typography>
                            </Box>
                            <Typography
                                sx={{
                                    fontSize: '1.1rem',
                                    fontWeight: 800,
                                    color: '#f1f5f9',
                                    letterSpacing: '-0.01em',
                                    lineHeight: 1.2,
                                }}
                            >
                                {currentTask?.name ?? 'Loading...'}
                            </Typography>
                            {currentTask?.description && (
                                <Typography
                                    sx={{
                                        fontSize: '0.75rem',
                                        color: '#64748b',
                                        mt: 0.5,
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {currentTask.description}
                                </Typography>
                            )}
                            {/* Due date & effort for current task */}
                            {currentTask && (currentTask.due_date || currentTask.estimated_hours != null) && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.75, flexWrap: 'wrap' }}>
                                    {currentTask.due_date && (() => {
                                        const due = new Date(currentTask.due_date);
                                        const now = new Date();
                                        now.setHours(0, 0, 0, 0);
                                        due.setHours(0, 0, 0, 0);
                                        const diffDays = Math.round((due.getTime() - now.getTime()) / 86400000);
                                        const isOverdue = diffDays < 0;
                                        const isSoon = diffDays >= 0 && diffDays <= 2;
                                        const dateColor = isOverdue ? '#ef4444' : isSoon ? '#f59e0b' : '#94a3b8';
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <CalendarMonth sx={{ fontSize: 13, color: dateColor }} />
                                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: dateColor }}>
                                                    {isOverdue
                                                        ? `Overdue by ${Math.abs(diffDays)}d`
                                                        : diffDays === 0
                                                          ? 'Due today'
                                                          : `Due ${due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                                                </Typography>
                                            </Box>
                                        );
                                    })()}
                                    {currentTask.estimated_hours != null && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <AccessTime sx={{ fontSize: 13, color: '#64748b' }} />
                                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8' }}>
                                                {Number(currentTask.estimated_hours)}h est.
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Box>

                        {/* Percentage */}
                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                            <Typography
                                sx={{
                                    fontSize: '1.75rem',
                                    fontWeight: 900,
                                    letterSpacing: '-0.03em',
                                    lineHeight: 1,
                                    background: `linear-gradient(135deg, ${color}, ${color}aa)`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                {pct}%
                            </Typography>
                            <Typography sx={{ fontSize: '0.6rem', color: '#475569', fontWeight: 600, mt: 0.25 }}>
                                complete
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* ════════ Pipeline Task Track ════════ */}
                <Box sx={{ px: 3, pb: 1.5, position: 'relative', zIndex: 2 }}>
                    {/* Phase labels above the track */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 1.5 }}>
                        {inquiryTasks.length > 0 && (
                            <Typography
                                sx={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    color: '#3b82f688',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                }}
                            >
                                Inquiry ({inquiryTasks.length})
                            </Typography>
                        )}
                        {bookingTasks.length > 0 && (
                            <Typography
                                sx={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    color: '#8b5cf688',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                }}
                            >
                                Booking ({bookingTasks.length})
                            </Typography>
                        )}
                    </Box>

                    {/* The dot track */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0,
                            mb: 1.5,
                            flexWrap: 'nowrap',
                            overflowX: 'auto',
                            py: 0.75,
                            '&::-webkit-scrollbar': { display: 'none' },
                        }}
                    >
                        {renderGroup(inquiryTasks, 0)}

                        {inquiryTasks.length > 0 && bookingTasks.length > 0 && (() => {
                            const allInquiryDone = hasRealTasks
                                ? inquiryTasks.every(t => {
                                      const autoRule = TASK_AUTO_COMPLETE[t.name];
                                      if (autoRule && autoRule.check(inquiry)) return true;
                                      return t.status === 'Completed';
                                  })
                                : activeIndex >= inquiryTasks.length;
                            return (
                            <>
                                <Connector
                                    done={allInquiryDone}
                                    dotColor={getTempColor(inquiryTasks.length - 1, totalTasks)}
                                    nextColor={getTempColor(inquiryTasks.length, totalTasks)}
                                />
                                <PhaseDivider label="▸" color="#64748b" />
                                <Connector
                                    done={allInquiryDone}
                                    dotColor={getTempColor(inquiryTasks.length - 1, totalTasks)}
                                    nextColor={getTempColor(inquiryTasks.length, totalTasks)}
                                />
                            </>
                            );
                        })()}

                        {renderGroup(bookingTasks, inquiryTasks.length)}
                    </Box>
                </Box>

                {/* ════════ Progress Bar with Liquid Fill + Milestones ════════ */}
                <Box sx={{ px: 3, pb: 3, pt: 0 }}>
                    {/* Bar track */}
                    <Box
                        sx={{
                            height: 12,
                            borderRadius: 6,
                            bgcolor: 'rgba(52, 58, 68, 0.15)',
                            border: '1px solid rgba(52, 58, 68, 0.1)',
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        {/* Temperature-gradient fill */}
                        <Box
                            sx={{
                                height: '100%',
                                width: `${pct}%`,
                                borderRadius: 6,
                                background: `linear-gradient(90deg, ${getTempColor(0, totalTasks)}, ${getTempColor(Math.floor(totalTasks * 0.33), totalTasks)}, ${getTempColor(Math.floor(totalTasks * 0.66), totalTasks)}, ${color})`,
                                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Shimmer */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: 6,
                                    background:
                                        'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                                    backgroundSize: '200% 100%',
                                    animation: 'pfo-bar-shimmer 2.5s ease-in-out infinite',
                                }}
                            />
                            {/* Liquid wave overlay */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '200%',
                                    height: '100%',
                                    background:
                                        'radial-gradient(ellipse 60% 80% at 50% 60%, rgba(255,255,255,0.18) 0%, transparent 60%)',
                                    animation: 'pfo-liquid-wave 4s ease-in-out infinite',
                                    pointerEvents: 'none',
                                }}
                            />
                        </Box>

                        {/* ── Milestone markers ── */}
                        {(() => {
                            // Define milestones at meaningful pipeline points
                            const milestones = [
                                { pct: Math.round((inquiryTasks.length / totalTasks) * 100), label: 'Qualified', color: '#6366f1' },
                                { pct: Math.round(((inquiryTasks.length + Math.ceil(bookingTasks.length * 0.4)) / totalTasks) * 100), label: 'Proposal Sent', color: '#a855f7' },
                                { pct: Math.round(((totalTasks - 1) / totalTasks) * 100), label: 'Ready to Book', color: '#22c55e' },
                            ];
                            return milestones.map((ms) => {
                                const reached = pct >= ms.pct;
                                return (
                                    <Tooltip
                                        key={ms.label}
                                        title={<Typography sx={{ fontSize: '0.7rem', fontWeight: 700, p: 0.5 }}>{ms.label}</Typography>}
                                        arrow
                                        placement="top"
                                        slotProps={{ tooltip: { sx: { bgcolor: 'rgba(15, 17, 23, 0.97)', '& .MuiTooltip-arrow': { color: 'rgba(15, 17, 23, 0.97)' } } } }}
                                    >
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                left: `${ms.pct}%`,
                                                top: '50%',
                                                transform: 'translate(-50%, -50%) rotate(45deg)',
                                                width: reached ? 10 : 8,
                                                height: reached ? 10 : 8,
                                                bgcolor: reached ? ms.color : 'rgba(52, 58, 68, 0.4)',
                                                border: `2px solid ${reached ? ms.color : 'rgba(52, 58, 68, 0.3)'}`,
                                                borderRadius: 1.5,
                                                zIndex: 3,
                                                transition: 'all 0.4s ease',
                                                boxShadow: reached ? `0 0 12px ${ms.color}50` : 'none',
                                                cursor: 'default',
                                            }}
                                        />
                                    </Tooltip>
                                );
                            });
                        })()}
                    </Box>

                    {/* Milestone labels underneath */}
                    <Box sx={{ position: 'relative', height: 16, mt: 0.5 }}>
                        {(() => {
                            const milestones = [
                                { pct: Math.round((inquiryTasks.length / totalTasks) * 100), label: 'Qualified', color: '#6366f1' },
                                { pct: Math.round(((inquiryTasks.length + Math.ceil(bookingTasks.length * 0.4)) / totalTasks) * 100), label: 'Proposal Sent', color: '#a855f7' },
                                { pct: Math.round(((totalTasks - 1) / totalTasks) * 100), label: 'Ready to Book', color: '#22c55e' },
                            ];
                            return milestones.map((ms) => {
                                const reached = pct >= ms.pct;
                                return (
                                    <Typography
                                        key={ms.label}
                                        sx={{
                                            position: 'absolute',
                                            left: `${ms.pct}%`,
                                            transform: 'translateX(-50%)',
                                            fontSize: '0.55rem',
                                            fontWeight: 700,
                                            color: reached ? `${ms.color}cc` : 'rgba(71, 85, 105, 0.5)',
                                            whiteSpace: 'nowrap',
                                            transition: 'color 0.4s ease',
                                        }}
                                    >
                                        {ms.label}
                                    </Typography>
                                );
                            });
                        })()}
                    </Box>

                    {/* Motivational footer */}
                    {!isComplete && completedCount > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1, justifyContent: 'center' }}>
                            <TrendingUp sx={{ fontSize: 13, color: '#22c55e' }} />
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#4ade80' }}>
                                {completedCount} {completedCount === 1 ? 'step' : 'steps'} completed
                            </Typography>
                            <Typography sx={{ fontSize: '0.68rem', color: '#475569' }}>
                                · {totalTasks - completedCount} remaining
                            </Typography>
                        </Box>
                    )}

                    {isComplete && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1.5,
                                mt: 1.5,
                                py: 1.25,
                                borderRadius: 2,
                                bgcolor: 'rgba(34, 197, 94, 0.06)',
                                border: '1px solid rgba(34, 197, 94, 0.15)',
                            }}
                        >
                            <EmojiEvents sx={{ fontSize: 18, color: '#22c55e' }} />
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#22c55e' }}>
                                Pipeline complete — ready to book!
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </>
    );
};

/* ================================================================== */
/*  Legacy fallback — renders old WORKFLOW_PHASES when no API data     */
/* ================================================================== */
const LegacyPhaseOverview: React.FC<{ inquiry: Inquiry & { activity_logs?: unknown[] } }> = ({ inquiry }) => {
    const totalPhases = WORKFLOW_PHASES.length;
    const legacyActive = (() => {
        let s = 0;
        const ws = inquiry?.workflow_status;
        if (ws && typeof ws === 'object') {
            if (ws.needsAssessment === 'completed') s++;
            if (ws.discoveryCall === 'completed') s++;
            if (ws.clientApproval === 'completed') s++;
        }
        if (inquiry.estimates?.length) s++;
        if (inquiry.proposals?.length) s++;
        if (inquiry.quotes?.length) s++;
        if (inquiry.contracts?.length) s++;
        if (inquiry.activity_logs?.length) s++;
        return Math.min(Math.floor((s / 8) * totalPhases), totalPhases - 1);
    })();
    const pct = Math.round(((legacyActive + 1) / totalPhases) * 100);
    const currentPhaseData = WORKFLOW_PHASES[legacyActive];
    const clr = currentPhaseData?.color || '#3b82f6';

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
                    background: `linear-gradient(155deg, rgba(12, 14, 20, 0.98) 0%, rgba(18, 22, 30, 0.97) 40%, ${clr}0C 100%)`,
                    border: `1.5px solid ${clr}35`,
                    boxShadow: `0 12px 50px rgba(0,0,0,0.6), 0 0 100px ${clr}10, inset 0 1px 0 rgba(255,255,255,0.05)`,
                }}
            >
                <Box sx={{ px: 3, pt: 3.5, pb: 2, position: 'relative', zIndex: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, mb: 2.5 }}>
                        {WORKFLOW_PHASES.map((phase, idx) => {
                            const isDone = idx < legacyActive;
                            const isActive = idx === legacyActive;
                            const PhaseIcon = phase.icon;
                            return (
                                <React.Fragment key={phase.id}>
                                    {idx > 0 && (
                                        <Box
                                            sx={{
                                                flex: 1,
                                                maxWidth: 48,
                                                height: isDone ? 3 : 2,
                                                borderRadius: 2,
                                                bgcolor: isDone ? `${phase.color}60` : 'rgba(52, 58, 68, 0.18)',
                                            }}
                                        />
                                    )}
                                    <Tooltip title={phase.name} arrow placement="top">
                                        <Box
                                            onClick={() => scrollToSection(phase.sectionId, phase.color)}
                                            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Box
                                                sx={{
                                                    width: isActive ? 50 : 38,
                                                    height: isActive ? 50 : 38,
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: isDone ? `${phase.color}20` : isActive ? `${phase.color}1A` : 'rgba(52, 58, 68, 0.12)',
                                                    border: `2px solid ${isDone ? `${phase.color}60` : isActive ? phase.color : 'rgba(52, 58, 68, 0.22)'}`,
                                                }}
                                            >
                                                {isDone ? (
                                                    <CheckCircle sx={{ fontSize: 20, color: phase.color }} />
                                                ) : (
                                                    <PhaseIcon sx={{ fontSize: isActive ? 26 : 18, color: isActive ? phase.color : '#475569', opacity: idx > legacyActive ? 0.5 : 1 }} />
                                                )}
                                            </Box>
                                        </Box>
                                    </Tooltip>
                                </React.Fragment>
                            );
                        })}
                    </Box>
                </Box>
                <Box sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Bolt sx={{ fontSize: 14, color: clr }} />
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>
                                {currentPhaseData?.name}
                            </Typography>
                            <Chip
                                label={`${legacyActive + 1}/${totalPhases}`}
                                size="small"
                                sx={{ height: 18, fontSize: '0.56rem', fontWeight: 800, bgcolor: `${clr}14`, color: `${clr}cc`, border: `1px solid ${clr}25`, '& .MuiChip-label': { px: 0.6 } }}
                            />
                        </Box>
                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, background: `linear-gradient(135deg, ${clr}, ${clr}cc)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {pct}%
                        </Typography>
                    </Box>
                    <Box sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(52, 58, 68, 0.15)', border: '1px solid rgba(52, 58, 68, 0.1)', overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: `linear-gradient(90deg, ${clr}cc, ${clr})`, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export { PhaseOverview };
