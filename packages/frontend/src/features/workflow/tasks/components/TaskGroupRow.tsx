"use client";

import React, { useState, useMemo } from 'react';
import { Box, Typography, Avatar, AvatarGroup, Tooltip, Collapse, LinearProgress } from '@mui/material';
import {
    AccessTime as ClockIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import type { ActiveTask, CrewMember } from '@/features/workflow/tasks/types';
import { sumEstimatedHours } from '@/shared/utils/hours';
import { TaskRow } from './TaskRow';
import { getInitials, avatarColor } from '../utils/task-display-utils';

interface TaskGroupRowProps {
    stage: ActiveTask;
    children: ActiveTask[];
    groupColor: string;
    crewMembers: CrewMember[];
    onAssign: (taskId: number, source: 'inquiry' | 'project', assigneeId: number | null, taskKind?: 'task' | 'subtask') => void;
    onNavigate: (task: ActiveTask) => void;
    onToggle: (task: ActiveTask) => void;
    subtasksByParent: Map<number, ActiveTask[]>;
}

export function TaskGroupRow({ stage, children, groupColor, crewMembers, onAssign, onNavigate, onToggle, subtasksByParent }: TaskGroupRowProps) {
    const [open, setOpen] = useState(true);
    const color = groupColor;
    const done = children.filter(t => t.status === 'Completed').length;
    const total = children.length;
    const progress = total > 0 ? (done / total) * 100 : 0;
    const allDone = total > 0 && done === total;
    const totalHours = sumEstimatedHours(children);
    const overdueAny = children.some(t =>
        t.due_date && t.status !== 'Completed' && new Date(t.due_date) < new Date()
    );
    const teamMembers = useMemo(() => [...new Map(
        children.filter(t => t.assignee).map(t => [t.assignee!.id, t.assignee!])
    ).values()], [children]);

    return (
        <Box sx={{ '&:not(:last-child)': { borderBottom: 'none' } }}>
            <Box
                onClick={() => setOpen(!open)}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, height: 38, pl: 2, pr: 2.5,
                    bgcolor: `${color}0e`, borderLeft: `3px solid ${color}`,
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer', transition: 'background 0.15s',
                    '&:hover': { bgcolor: `${color}18` },
                }}
            >
                <ExpandMoreIcon sx={{
                    fontSize: 15, color: color, flexShrink: 0,
                    transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s',
                }} />
                <Typography sx={{
                    fontWeight: 700, fontSize: '0.875rem', color: allDone ? '#00C875' : color,
                    letterSpacing: '-0.01em', textDecoration: allDone ? 'line-through' : 'none', opacity: allDone ? 0.7 : 1,
                }}>
                    {stage.name}
                </Typography>
                {allDone && <CheckCircleIcon sx={{ fontSize: 14, color: '#00C875', flexShrink: 0 }} />}
                <Box sx={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    height: 20, px: 0.875, borderRadius: '5px', flexShrink: 0,
                    bgcolor: `${color}1a`, border: `1px solid ${color}33`,
                }}>
                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 800, color: color, lineHeight: 1 }}>
                        {done}/{total}
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate" value={progress}
                    sx={{
                        width: 56, height: 3, borderRadius: 2, flexShrink: 0,
                        bgcolor: 'rgba(255,255,255,0.07)',
                        '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 },
                    }}
                />
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
                    {overdueAny && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <WarningIcon sx={{ fontSize: 12, color: '#D83A52' }} />
                            <Typography sx={{ fontSize: '0.6875rem', color: '#D83A52', fontWeight: 700 }}>Overdue</Typography>
                        </Box>
                    )}
                    {totalHours > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ClockIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
                                {totalHours.toFixed(1)}h
                            </Typography>
                        </Box>
                    )}
                    {teamMembers.length > 0 && (
                        <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.5625rem', fontWeight: 800, border: '2px solid rgba(16,16,20,1)' } }}>
                            {teamMembers.map(a => (
                                <Tooltip key={a.id} title={a.name} arrow>
                                    <Avatar sx={{ bgcolor: avatarColor(a.name) }}>{getInitials(a.name)}</Avatar>
                                </Tooltip>
                            ))}
                        </AvatarGroup>
                    )}
                </Box>
            </Box>
            <Collapse in={open}>
                {children.map(task => (
                    <TaskRow
                        key={`${task.source}-${task.id}`}
                        task={task}
                        groupColor={color}
                        contributors={crewMembers}
                        onAssign={onAssign}
                        onNavigate={onNavigate}
                        onToggle={onToggle}
                        isChild
                        subtasks={subtasksByParent.get(task.id) ?? []}
                    />
                ))}
            </Collapse>
        </Box>
    );
}
