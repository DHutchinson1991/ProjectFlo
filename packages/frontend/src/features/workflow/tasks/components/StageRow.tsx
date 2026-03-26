"use client";

import React, { useState, useMemo } from 'react';
import { Box, Typography, Avatar, AvatarGroup, Tooltip, Collapse, LinearProgress } from '@mui/material';
import {
    AccessTime as ClockIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import type { ActiveTask, Contributor } from '@/lib/types';
import { TaskRow } from './TaskRow';
import { getInitials, avatarColor } from '../utils/task-display-utils';

interface StageRowProps {
    stage: ActiveTask;
    children: ActiveTask[];
    groupColor: string;
    contributors: Contributor[];
    onAssign: (taskId: number, source: 'inquiry' | 'project', assigneeId: number | null, taskKind?: 'task' | 'subtask') => void;
    onNavigate: (task: ActiveTask) => void;
    onToggle: (task: ActiveTask) => void;
    subtasksByParent: Map<number, ActiveTask[]>;
}

export function StageRow({ stage, children, groupColor, contributors, onAssign, onNavigate, onToggle, subtasksByParent }: StageRowProps) {
    const [open, setOpen] = useState(true);
    const stageColor = stage.stage_color || groupColor;
    const done = children.filter(t => t.status === 'Completed').length;
    const total = children.length;
    const progress = total > 0 ? (done / total) * 100 : 0;
    const allDone = total > 0 && done === total;
    const totalHours = children.reduce((s, t) => s + (t.estimated_hours || 0), 0);
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
                    bgcolor: `${stageColor}0e`, borderLeft: `3px solid ${stageColor}`,
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer', transition: 'background 0.15s',
                    '&:hover': { bgcolor: `${stageColor}18` },
                }}
            >
                <ExpandMoreIcon sx={{
                    fontSize: 15, color: stageColor, flexShrink: 0,
                    transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s',
                }} />
                <Typography sx={{
                    fontWeight: 700, fontSize: '0.875rem', color: allDone ? '#00C875' : stageColor,
                    letterSpacing: '-0.01em', textDecoration: allDone ? 'line-through' : 'none', opacity: allDone ? 0.7 : 1,
                }}>
                    {stage.name}
                </Typography>
                {allDone && <CheckCircleIcon sx={{ fontSize: 14, color: '#00C875', flexShrink: 0 }} />}
                <Box sx={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    height: 20, px: 0.875, borderRadius: '5px', flexShrink: 0,
                    bgcolor: `${stageColor}1a`, border: `1px solid ${stageColor}33`,
                }}>
                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 800, color: stageColor, lineHeight: 1 }}>
                        {done}/{total}
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate" value={progress}
                    sx={{
                        width: 56, height: 3, borderRadius: 2, flexShrink: 0,
                        bgcolor: 'rgba(255,255,255,0.07)',
                        '& .MuiLinearProgress-bar': { bgcolor: stageColor, borderRadius: 2 },
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
                        groupColor={stageColor}
                        contributors={contributors}
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
