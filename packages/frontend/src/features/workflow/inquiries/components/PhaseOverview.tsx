import React, { useCallback, useRef, useState, useMemo } from 'react';
import { Box, Typography, Chip, Tooltip, Checkbox } from '@mui/material';
import {
    CheckCircle,
    EmojiEvents,
    Bolt,
    OpenInNew,
    TrendingUp,
    AccessTime,
    CalendarMonth,
} from '@mui/icons-material';
import type { Inquiry } from '@/features/workflow/inquiries/types';
import { utcDiffDays } from '@/shared/utils/taskDates';
import { useBrandTimezone } from '@/features/platform/brand';
import { WORKFLOW_PHASES, getTempColor, TASK_AUTO_COMPLETE, computeActiveIndex } from '../lib';
import type { PipelineTask, WorkflowPhase } from '../lib';

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
/*  Stage tooltip — shows sub-task checklist inside a stage dot        */
/* ------------------------------------------------------------------ */
interface StageItem {
    label: string;
    color: string;
    sectionId: string;
    tasks: PipelineTask[];
    completedCount: number;
    totalCount: number;
    isDone: boolean;
    isActive: boolean;
    isFuture: boolean;
    stageIndex: number;
}

const StageTooltip: React.FC<{
    stage: StageItem;
    totalStages: number;
    inquiry: Inquiry & { activity_logs?: unknown[] };
}> = ({ stage, totalStages, inquiry }) => (
    <Box sx={{ p: 1.5, maxWidth: 320, minWidth: 220 }}>
        {/* Stage header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: stage.color, flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#f1f5f9' }}>
                {stage.label}
            </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                Stage {stage.stageIndex + 1} of {totalStages}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                · {stage.completedCount}/{stage.totalCount} tasks
            </Typography>
            {stage.isDone && <CheckCircle sx={{ fontSize: 14, color: '#22c55e', ml: 'auto' }} />}
            {stage.isActive && (
                <Chip label="Current" size="small" sx={{
                    ml: 'auto', height: 20, fontSize: '0.6rem', fontWeight: 800,
                    bgcolor: `${stage.color}25`, color: stage.color, border: `1px solid ${stage.color}40`,
                    '& .MuiChip-label': { px: 0.75 },
                }} />
            )}
        </Box>

        {/* Mini progress bar */}
        <Box sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(52,58,68,0.2)', mb: 1.25, overflow: 'hidden' }}>
            <Box sx={{
                height: '100%', borderRadius: 2,
                width: `${stage.totalCount > 0 ? (stage.completedCount / stage.totalCount) * 100 : 0}%`,
                bgcolor: stage.color, transition: 'width 0.4s ease',
            }} />
        </Box>

        {/* Sub-task list (read-only) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {stage.tasks.map((task) => {
                const autoRule = TASK_AUTO_COMPLETE[task.name];
                const isTaskDone = autoRule
                    ? autoRule.check(inquiry)
                    : task.status === 'Completed';

                return (
                    <Box
                        key={task.id}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 0.75,
                            py: 0.4, px: 0.5, borderRadius: 1,
                        }}
                    >
                        {isTaskDone ? (
                            <CheckCircle sx={{ fontSize: 13, color: '#22c55e', flexShrink: 0 }} />
                        ) : (
                            <Box sx={{
                                width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
                                border: '1.5px solid rgba(71,85,105,0.5)',
                                bgcolor: 'transparent',
                            }} />
                        )}
                        <Typography sx={{
                            fontSize: '0.72rem', fontWeight: 500, lineHeight: 1.3,
                            color: isTaskDone ? '#4ade80' : '#94a3b8',
                            textDecoration: isTaskDone ? 'line-through' : 'none',
                            opacity: isTaskDone ? 0.7 : 1,
                            flex: 1,
                        }}>
                            {task.name}
                        </Typography>
                        {autoRule && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                <Bolt sx={{ fontSize: 9, color: '#FDAB3D', opacity: 0.75 }} />
                                <Typography sx={{ fontSize: '0.5rem', color: '#FDAB3D', fontWeight: 700, opacity: 0.8 }}>
                                    Auto
                                </Typography>
                            </Box>
                        )}
                    </Box>
                );
            })}
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
    /** Legacy props kept for backward compatibility */
    currentPhase?: string;
    currentPhaseData?: WorkflowPhase;
    activeIndex?: number;
    inquiryId?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    IconComponent?: React.ComponentType<any>;
}

/* ================================================================== */
/*  PhaseOverview Component                                            */
/* ================================================================== */
const PhaseOverview: React.FC<PhaseOverviewProps> = ({ inquiry, pipelineTasks, hasRealTasks }) => {
    const brandTimezone = useBrandTimezone();

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

    // Dynamic stage grouping — uses parent/child hierarchy when available,
    // falls back to sectionId grouping via WORKFLOW_PHASES
    const stageGroups = useMemo(() => {
        const hasHierarchy = pipelineTasks.some(t => t.parentStageId != null);
        if (hasHierarchy) {
            const result: { label: string; color: string; tasks: PipelineTask[] }[] = [];
            const seen = new Map<number, number>();
            for (const task of pipelineTasks) {
                const key = task.parentStageId;
                if (key != null && seen.has(key)) {
                    result[seen.get(key)!].tasks.push(task);
                } else if (key != null) {
                    seen.set(key, result.length);
                    const label = task.sectionId.replace(/-section$/, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    result.push({ label, color: task.color, tasks: [task] });
                } else if (result.length > 0) {
                    result[result.length - 1].tasks.push(task);
                } else {
                    result.push({ label: task.phase, color: task.color, tasks: [task] });
                }
            }
            return result;
        }
        // Fallback: group tasks by their sectionId, using WORKFLOW_PHASES order and colors
        const sectionOrder = WORKFLOW_PHASES.map(p => p.sectionId);
        const sectionMeta = Object.fromEntries(WORKFLOW_PHASES.map(p => [p.sectionId, { label: p.name, color: p.color }]));
        const groups = new Map<string, PipelineTask[]>();
        for (const task of pipelineTasks) {
            const sec = task.sectionId ?? 'needs-assessment-section';
            if (!groups.has(sec)) groups.set(sec, []);
            groups.get(sec)!.push(task);
        }
        return sectionOrder
            .filter(sec => groups.has(sec))
            .map(sec => ({
                label: sectionMeta[sec]?.label ?? sec,
                color: sectionMeta[sec]?.color ?? '#3b82f6',
                tasks: groups.get(sec)!,
            }));
    }, [pipelineTasks]);

    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleHoverEnter = useCallback((id: number) => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setHoveredId(id);
    }, []);

    const handleHoverLeave = useCallback(() => {
        hoverTimeout.current = setTimeout(() => setHoveredId(null), 150);
    }, []);

    /* ── Build enriched stage items from groups ── */
    const stageItems: StageItem[] = useMemo(() => {
        let foundActive = false;
        return stageGroups.map((group, idx) => {
            const completed = group.tasks.filter(t => {
                const autoRule = TASK_AUTO_COMPLETE[t.name];
                return autoRule ? autoRule.check(inquiry) : t.status === 'Completed';
            }).length;
            const total = group.tasks.length;
            const isDone = completed >= total;
            const isActive = !isDone && !foundActive;
            if (isActive) foundActive = true;
            return {
                label: group.label,
                color: group.color,
                sectionId: group.tasks[0]?.sectionId ?? '',
                tasks: group.tasks,
                completedCount: completed,
                totalCount: total,
                isDone,
                isActive,
                isFuture: !isDone && !isActive,
                stageIndex: idx,
            };
        });
    }, [stageGroups, inquiry]);

    const totalStages = stageItems.length;
    const activeStage = stageItems.find(s => s.isActive) ?? stageItems[stageItems.length - 1];
    const completedStages = stageItems.filter(s => s.isDone).length;
    // Current sub-task within the active stage.
    // Split into manual (actionable) vs auto (system-handled) so the hero
    // never tells the user to act on something the system will do itself.
    const pendingTasks = activeStage?.tasks.filter(t => {
        const autoRule = TASK_AUTO_COMPLETE[t.name];
        return !(autoRule ? autoRule.check(inquiry) : t.status === 'Completed');
    }) ?? [];
    const pendingAutoSubTask = pendingTasks.find(t => !!(TASK_AUTO_COMPLETE[t.name] || t.is_auto_only)) ?? null;
    const currentSubTask = pendingTasks.find(t => !TASK_AUTO_COMPLETE[t.name] && !t.is_auto_only) ?? null;

    /* ── Connector between dots (light path when done) ── */
    const Connector: React.FC<{ done: boolean; dotColor: string; nextColor?: string }> = ({ done, dotColor, nextColor }) => (
        <Box
            sx={{
                flex: 1,
                maxWidth: 48,
                minWidth: 12,
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

                {/* ════════ Current Stage Hero ════════ */}
                <Box sx={{ px: 3, pt: 3.5, pb: 2, position: 'relative', zIndex: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {/* Active stage icon — large */}
                        {(() => {
                            const StageIcon = currentSubTask?.icon ?? pendingAutoSubTask?.icon ?? currentTask?.icon;
                            if (!StageIcon) return null;
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
                                    <StageIcon sx={{ fontSize: 26, color }} />
                                </Box>
                            );
                        })()}

                        {/* Stage name + current sub-task */}
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Chip
                                    label={activeStage?.label ?? 'Inquiry'}
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
                                    Stage {(activeStage?.stageIndex ?? 0) + 1} of {totalStages}
                                </Typography>
                                {activeStage && (
                                    <Typography sx={{ fontSize: '0.65rem', color: '#475569' }}>
                                        · {activeStage.completedCount}/{activeStage.totalCount} tasks
                                    </Typography>
                                )}
                            </Box>
                            <Typography
                                sx={{
                                    fontSize: '1.1rem',
                                    fontWeight: 800,
                                    color: currentSubTask ? '#f1f5f9' : 'rgba(253,171,61,0.7)',
                                    letterSpacing: '-0.01em',
                                    lineHeight: 1.2,
                                    fontStyle: currentSubTask ? 'normal' : 'italic',
                                }}
                            >
                                {currentSubTask?.name ?? pendingAutoSubTask?.name ?? currentTask?.name ?? 'Loading...'}
                            </Typography>
                            {!currentSubTask && pendingAutoSubTask && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.375 }}>
                                    <Bolt sx={{ fontSize: 12, color: 'rgba(253,171,61,0.6)' }} />
                                    <Typography sx={{ fontSize: '0.72rem', color: 'rgba(253,171,61,0.55)', fontStyle: 'italic' }}>
                                        System handling · awaiting trigger
                                    </Typography>
                                </Box>
                            )}
                            {currentSubTask?.description && (
                                <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.5, lineHeight: 1.4 }}>
                                    {currentSubTask.description}
                                </Typography>
                            )}
                            {/* Due date & effort — only for manual tasks */}
                            {currentSubTask && (currentSubTask.due_date || currentSubTask.estimated_hours != null) && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.75, flexWrap: 'wrap' }}>
                                    {currentSubTask.due_date && (() => {
                                        const diffDays = utcDiffDays(currentSubTask.due_date, brandTimezone);
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
                                                          : `Due ${new Date(currentSubTask.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: brandTimezone })}`}
                                                </Typography>
                                            </Box>
                                        );
                                    })()}
                                    {currentSubTask.estimated_hours != null && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <AccessTime sx={{ fontSize: 13, color: '#64748b' }} />
                                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8' }}>
                                                {Number(currentSubTask.estimated_hours)}h est.
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

                {/* ════════ Stage Dot Track ════════ */}
                <Box sx={{ px: 3, pb: 1.5, position: 'relative', zIndex: 2 }}>
                    {/* The stage dot track — one dot per stage */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0,
                            mb: 1.5,
                            py: 0.75,
                        }}
                    >
                        {stageItems.map((stage, idx) => {
                            const isHovered = hoveredId === idx;
                            const dotColor = stage.isDone
                                ? getTempColor(idx, totalStages)
                                : stage.isActive
                                  ? getTempColor(idx, totalStages)
                                  : stage.color;
                            const StageIcon = stage.tasks[0]?.icon;
                            const nextPendingTask = stage.tasks.find(t => {
                                const autoRule = TASK_AUTO_COMPLETE[t.name];
                                return !(autoRule ? autoRule.check(inquiry) : t.status === 'Completed');
                            });
                            const nextTaskIsAuto = !!(nextPendingTask && (TASK_AUTO_COMPLETE[nextPendingTask.name] || nextPendingTask.is_auto_only));
                            return (
                                <React.Fragment key={stage.label}>
                                    {idx > 0 && (
                                        <Connector
                                            done={stageItems[idx - 1].isDone}
                                            dotColor={getTempColor(idx - 1, totalStages)}
                                            nextColor={getTempColor(idx, totalStages)}
                                        />
                                    )}
                                    <Tooltip
                                        title={
                                            <StageTooltip
                                                stage={stage}
                                                totalStages={totalStages}
                                                inquiry={inquiry}
                                            />
                                        }
                                        arrow
                                        placement="top"
                                        enterDelay={150}
                                        leaveDelay={200}
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
                                            onClick={() => scrollToSection(stage.sectionId, dotColor)}
                                            onMouseEnter={() => handleHoverEnter(idx)}
                                            onMouseLeave={handleHoverLeave}
                                            sx={{
                                                position: 'relative',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                '&:hover .pfo-dot': {
                                                    transform: 'scale(1.12)',
                                                    boxShadow: `0 0 20px ${dotColor}40`,
                                                },
                                            }}
                                        >
                                            {stage.isActive && (
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
                                                    width: stage.isActive ? 48 : 38,
                                                    height: stage.isActive ? 48 : 38,
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: stage.isDone
                                                        ? `${dotColor}20`
                                                        : stage.isActive
                                                          ? `${dotColor}1A`
                                                          : isHovered
                                                            ? 'rgba(52, 58, 68, 0.25)'
                                                            : 'rgba(52, 58, 68, 0.12)',
                                                    border: `2px solid ${
                                                        stage.isDone
                                                            ? `${dotColor}60`
                                                            : stage.isActive
                                                              ? dotColor
                                                              : isHovered
                                                                ? `${dotColor}40`
                                                                : 'rgba(52, 58, 68, 0.22)'
                                                    }`,
                                                    transition: 'all 0.3s ease',
                                                    boxShadow: stage.isActive
                                                        ? `0 0 24px ${dotColor}40, 0 0 48px ${dotColor}15`
                                                        : stage.isDone
                                                          ? `0 0 10px ${dotColor}18`
                                                          : 'none',
                                                }}
                                            >
                                                {stage.isDone ? (
                                                    <CheckCircle sx={{ fontSize: stage.isActive ? 22 : 18, color: dotColor }} />
                                                ) : StageIcon ? (
                                                    <StageIcon
                                                        sx={{
                                                            fontSize: stage.isActive ? 24 : 18,
                                                            color: stage.isActive ? dotColor : stage.isFuture ? '#475569' : dotColor,
                                                            opacity: stage.isFuture ? 0.5 : 1,
                                                        }}
                                                    />
                                                ) : (
                                                    <Box sx={{
                                                        width: 8, height: 8, borderRadius: '50%',
                                                        bgcolor: stage.isFuture ? '#475569' : dotColor,
                                                        opacity: stage.isFuture ? 0.5 : 1,
                                                    }} />
                                                )}
                                            </Box>
                                            {/* Auto badge — shown when next pending task is system-automated */}
                                            {nextTaskIsAuto && (
                                                <Box sx={{
                                                    position: 'absolute',
                                                    top: stage.isActive ? 30 : 23,
                                                    right: -8,
                                                    width: 15,
                                                    height: 15,
                                                    borderRadius: '50%',
                                                    bgcolor: 'rgba(12,14,20,0.95)',
                                                    border: '1.5px solid rgba(253,171,61,0.65)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    zIndex: 2,
                                                    boxShadow: '0 0 6px rgba(253,171,61,0.3)',
                                                }}>
                                                    <Bolt sx={{ fontSize: 9, color: '#FDAB3D' }} />
                                                </Box>
                                            )}
                                            {/* Stage label below the dot */}
                                            <Typography
                                                sx={{
                                                    fontSize: '0.52rem',
                                                    fontWeight: 700,
                                                    color: stage.isDone
                                                        ? `${dotColor}aa`
                                                        : stage.isActive
                                                          ? dotColor
                                                          : '#475569',
                                                    mt: 0.5,
                                                    textAlign: 'center',
                                                    maxWidth: 64,
                                                    lineHeight: 1.2,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {stage.label}
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                </React.Fragment>
                            );
                        })}
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
                                { pct: 30, label: 'Qualified', color: '#6366f1' },
                                { pct: 65, label: 'Proposal Sent', color: '#a855f7' },
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
                                { pct: 30, label: 'Qualified', color: '#6366f1' },
                                { pct: 65, label: 'Proposal Sent', color: '#a855f7' },
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
                    {!isComplete && completedStages > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1, justifyContent: 'center' }}>
                            <TrendingUp sx={{ fontSize: 13, color: '#22c55e' }} />
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#4ade80' }}>
                                {completedStages} {completedStages === 1 ? 'group' : 'groups'} completed
                            </Typography>
                            <Typography sx={{ fontSize: '0.68rem', color: '#475569' }}>
                                · {totalStages - completedStages} remaining
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
