"use client";

import React, { useState } from 'react';
import { Box, Typography, Collapse } from '@mui/material';
import {
    AccessTime as ClockIcon,
    CalendarToday as CalendarIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as UncheckedIcon,
    Warning as WarningIcon,
    ArrowForwardIos as NavigateIcon,
    Bolt as BoltIcon,
} from '@mui/icons-material';
import type { ActiveTask, Contributor } from '@/lib/types';
import { StatusPill } from './StatusPill';
import { AssigneeCell } from './AssigneeCell';
import { formatDueDate, getNavigationUrl } from '../utils/task-display-utils';
import { GRID_COLS } from '../constants';

interface TaskRowProps {
    task: ActiveTask;
    groupColor: string;
    contributors: Contributor[];
    onAssign: (taskId: number, source: 'inquiry' | 'project', assigneeId: number | null, taskKind?: 'task' | 'subtask') => void;
    onNavigate: (task: ActiveTask) => void;
    onToggle: (task: ActiveTask) => void;
    isChild?: boolean;
    subtasks?: ActiveTask[];
    nested?: boolean;
}

export function TaskRow({ task, groupColor, contributors, onAssign, onNavigate, onToggle, isChild, subtasks = [], nested = false }: TaskRowProps) {
    const [hovered, setHovered] = useState(false);
    const [subtasksOpen, setSubtasksOpen] = useState(false);
    const isCompleted = task.status === 'Completed';
    const isAuto = task.is_auto_only ?? false;
    const dueInfo = formatDueDate(task.due_date, isCompleted);
    const navUrl = getNavigationUrl(task);
    const completedSubtasks = subtasks.filter(s => s.status === 'Completed').length;

    return (
        <>
            <Box
                onClick={navUrl ? () => onNavigate(task) : undefined}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                sx={{
                    display: 'grid', gridTemplateColumns: GRID_COLS, alignItems: 'center', minHeight: 48,
                    borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background-color 0.12s',
                    cursor: navUrl ? 'pointer' : 'default',
                    '&:hover': { bgcolor: navUrl ? 'rgba(87,155,252,0.035)' : 'rgba(255,255,255,0.028)' },
                    '&:last-child': { borderBottom: 'none' },
                    opacity: isAuto ? (isCompleted ? 0.5 : 0.45) : isCompleted ? 0.5 : 1,
                }}
            >
                {/* Subtask expand chevron */}
                <Box
                    onClick={subtasks.length > 0 ? (e) => { e.stopPropagation(); setSubtasksOpen(o => !o); } : undefined}
                    sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: subtasks.length > 0 ? 'pointer' : 'default',
                        height: '100%', borderRadius: '3px', transition: 'background 0.12s',
                        '&:hover': subtasks.length > 0 ? { bgcolor: 'rgba(255,255,255,0.06)' } : {},
                    }}
                >
                    {subtasks.length > 0 && (
                        subtasksOpen
                            ? <ExpandMoreIcon sx={{ fontSize: 14, color: '#94a3b8', transform: 'rotate(0deg)', transition: 'transform 0.2s' }} />
                            : <ExpandMoreIcon sx={{ fontSize: 14, color: '#94a3b8', transform: 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                    )}
                </Box>

                {/* Project / Inquiry badge */}
                <Box sx={{ px: 1.5, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 1, borderLeft: isChild ? `2px solid ${groupColor}55` : `3px solid ${groupColor}`, height: '100%', pl: nested ? 4 : isChild ? 2.5 : 1.5 }}>
                    <Box
                        onClick={(e) => { e.stopPropagation(); onNavigate(task); }}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 0.875, cursor: 'pointer', borderRadius: 1,
                            px: 0.5, py: 0.375, mx: -0.5, transition: 'background 0.12s', overflow: 'hidden',
                            '&:hover': { bgcolor: task.source === 'project' ? 'rgba(87,155,252,0.1)' : 'rgba(0,200,117,0.1)' },
                        }}
                    >
                        <Box sx={{
                            width: 30, height: 30, borderRadius: task.source === 'project' ? '8px' : '50%',
                            bgcolor: task.source === 'project' ? 'rgba(87,155,252,0.14)' : 'rgba(0,200,117,0.12)',
                            border: `1.5px solid ${task.source === 'project' ? 'rgba(87,155,252,0.35)' : 'rgba(0,200,117,0.3)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <Typography sx={{
                                fontSize: '0.5625rem', fontWeight: 800,
                                color: task.source === 'project' ? '#579BFC' : '#00C875',
                                lineHeight: 1, letterSpacing: '0.02em',
                            }}>
                                {task.context_label.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </Typography>
                        </Box>
                        <Typography noWrap sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.primary' }}>
                            {task.context_label}
                        </Typography>
                    </Box>
                </Box>

                {/* Task Name */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, pl: 1.5, pr: 1.5, overflow: 'hidden', height: '100%' }}>
                    {isAuto
                        ? <BoltIcon sx={{ fontSize: 16, color: isCompleted ? '#00C875' : '#FDAB3D', opacity: isCompleted ? 0.85 : 0.65, flexShrink: 0 }} />
                        : <Box onClick={(e) => { e.stopPropagation(); onToggle(task); }} sx={{ flexShrink: 0, cursor: 'pointer', display: 'flex', '&:hover': { opacity: 0.7 } }}>
                            {isCompleted
                                ? <CheckCircleIcon sx={{ fontSize: 16, color: '#00C875' }} />
                                : <UncheckedIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }} />
                            }
                        </Box>
                    }
                    <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, overflow: 'hidden' }}>
                            <Typography noWrap sx={{
                                fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.3,
                                textDecoration: isCompleted ? 'line-through' : 'none',
                                color: isAuto ? 'rgba(255,255,255,0.35)' : isCompleted ? 'text.secondary' : 'text.primary',
                                fontStyle: isAuto ? 'italic' : 'normal', minWidth: 0,
                            }}>
                                {task.name}
                            </Typography>
                            {!nested && subtasks.length > 0 && (
                                <Typography sx={{ fontSize: '0.65rem', color: '#475569', fontWeight: 600, lineHeight: 1, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    {completedSubtasks}/{subtasks.length} subtasks
                                </Typography>
                            )}
                        </Box>
                        {task.description && (
                            <Typography noWrap sx={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.25, mt: 0.125 }}>
                                {task.description}
                            </Typography>
                        )}
                    </Box>
                    {navUrl && (
                        <NavigateIcon sx={{ fontSize: 10, flexShrink: 0, ml: 0.5, color: hovered ? 'rgba(87,155,252,0.8)' : 'transparent', transition: 'color 0.15s' }} />
                    )}
                </Box>

                {/* Status */}
                <Box sx={{ display: 'flex', justifyContent: 'center', px: 0.5 }}>
                    {isAuto ? (
                        <Box sx={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: isCompleted ? 'rgba(0,200,117,0.12)' : 'rgba(253,171,61,0.12)',
                            color: isCompleted ? '#00C875' : '#FDAB3D',
                            fontWeight: 700, fontSize: '0.6rem',
                            height: 20, px: 0.875, borderRadius: '5px', whiteSpace: 'nowrap',
                            border: isCompleted ? '1px solid rgba(0,200,117,0.25)' : '1px solid rgba(253,171,61,0.25)',
                        }}>Auto</Box>
                    ) : <StatusPill status={task.status} />}
                </Box>

                {/* Assignee */}
                {isAuto ? (
                    <Box sx={{ px: 1.5, display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(253,171,61,0.4)', fontStyle: 'italic' }}>System</Typography>
                    </Box>
                ) : <AssigneeCell task={task} contributors={contributors} onAssign={onAssign} onNavigate={onNavigate} />}

                {/* Due Date */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625, px: 1.5 }}>
                    {dueInfo.urgent
                        ? <WarningIcon sx={{ fontSize: 13, color: dueInfo.color, flexShrink: 0 }} />
                        : <CalendarIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                    }
                    <Typography sx={{ fontSize: '0.75rem', color: dueInfo.color, fontWeight: dueInfo.urgent ? 700 : 400, whiteSpace: 'nowrap' }}>
                        {dueInfo.text}
                    </Typography>
                </Box>

                {/* Hours */}
                <Box sx={{ px: 1.5 }}>
                    {task.estimated_hours ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ClockIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 500 }}>
                                {task.actual_hours != null ? `${task.actual_hours}/${task.estimated_hours}h` : `${task.estimated_hours}h`}
                            </Typography>
                        </Box>
                    ) : (
                        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.18)' }}>—</Typography>
                    )}
                </Box>
            </Box>

            <Collapse in={subtasksOpen}>
                {subtasks.map(subtask => (
                    <TaskRow
                        key={`${subtask.source}-${subtask.id}`}
                        task={subtask}
                        groupColor={groupColor}
                        contributors={contributors}
                        onAssign={onAssign}
                        onNavigate={onNavigate}
                        onToggle={onToggle}
                        isChild
                        nested
                    />
                ))}
            </Collapse>
        </>
    );
}
