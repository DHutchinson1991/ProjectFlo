"use client";

import React, { useState, useMemo } from 'react';
import { Box, Typography, Avatar, AvatarGroup, Tooltip, Collapse, LinearProgress } from '@mui/material';
import { AccessTime as ClockIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import type { ActiveTask, Contributor } from '@/lib/types';
import { TaskRow } from './TaskRow';
import { StageRow } from './StageRow';
import { ColumnHeaders } from './StatusPill';
import { buildTaskTree } from '../utils/task-display-utils';
import { getInitials, avatarColor } from '../utils/task-display-utils';

interface TaskGroupProps {
    title: string;
    color: string;
    tasks: ActiveTask[];
    defaultExpanded: boolean;
    icon?: React.ReactNode;
    badge?: string;
    contributors: Contributor[];
    onAssign: (taskId: number, source: 'inquiry' | 'project', assigneeId: number | null, taskKind?: 'task' | 'subtask') => void;
    onNavigate: (task: ActiveTask) => void;
    onToggle: (task: ActiveTask) => void;
}

export function TaskGroup({ title, color, tasks, defaultExpanded, icon, badge, contributors, onAssign, onNavigate, onToggle }: TaskGroupProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const subtasksByParent = useMemo(() => {
        const map = new Map<number, ActiveTask[]>();
        tasks.forEach(task => {
            if (!task.subtask_parent_id) return;
            const list = map.get(task.subtask_parent_id) ?? [];
            list.push(task);
            map.set(task.subtask_parent_id, list);
        });
        return map;
    }, [tasks]);

    const leafTasks = tasks.filter(t => !t.is_stage && t.task_kind !== 'subtask');
    const totalHours = leafTasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);
    const completedCount = leafTasks.filter(t => t.status === 'Completed').length;
    const progress = leafTasks.length > 0 ? (completedCount / leafTasks.length) * 100 : 0;

    const allAssignees = useMemo(() => [...new Map(
        tasks.filter(t => t.assignee).map(t => [t.assignee!.id, t.assignee!])
    ).values()], [tasks]);

    return (
        <Box sx={{ '&:not(:last-child)': { borderBottom: '1px solid rgba(255,255,255,0.05)' } }}>
            {/* Group Header */}
            <Box
                onClick={() => setExpanded(!expanded)}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.25,
                    cursor: 'pointer', userSelect: 'none', bgcolor: 'rgba(255,255,255,0.015)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                    borderLeft: `4px solid ${color}`, transition: 'background 0.15s',
                }}
            >
                <ExpandMoreIcon sx={{
                    fontSize: 18, color: 'text.secondary', flexShrink: 0,
                    transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s',
                }} />
                {icon && <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</Box>}
                <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color, letterSpacing: '-0.01em' }}>
                    {title}
                </Typography>
                <Box sx={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    height: 22, minWidth: 28, px: 0.75, borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem',
                    bgcolor: `${color}1a`, color, border: `1px solid ${color}33`,
                }}>
                    {tasks.length}
                </Box>
                {badge && (
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', fontWeight: 500 }}>
                        {badge}
                    </Typography>
                )}
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, ml: 1 }}>
                    <LinearProgress
                        variant="determinate" value={progress}
                        sx={{
                            flex: 1, maxWidth: 100, height: 3, borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.07)',
                            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 },
                        }}
                    />
                    <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {completedCount}/{tasks.length}
                    </Typography>
                </Box>
                {totalHours > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 0.5 }}>
                        <ClockIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
                            {totalHours.toFixed(1)}h
                        </Typography>
                    </Box>
                )}
            </Box>

            <Collapse in={expanded}>
                <ColumnHeaders />
                {buildTaskTree(tasks).map(item =>
                    item.type === 'stage' ? (
                        <StageRow
                            key={`stage-${item.stage.source}-${item.stage.id}`}
                            stage={item.stage}
                            children={item.children}
                            groupColor={color}
                            contributors={contributors}
                            onAssign={onAssign}
                            onNavigate={onNavigate}
                            onToggle={onToggle}
                            subtasksByParent={subtasksByParent}
                        />
                    ) : (
                        <TaskRow
                            key={`${item.task.source}-${item.task.id}`}
                            task={item.task}
                            groupColor={color}
                            contributors={contributors}
                            onAssign={onAssign}
                            onNavigate={onNavigate}
                            onToggle={onToggle}
                            subtasks={subtasksByParent.get(item.task.id) ?? []}
                        />
                    )
                )}

                {/* Group Footer */}
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 0.875,
                    bgcolor: 'rgba(255,255,255,0.012)', borderTop: '1px solid rgba(255,255,255,0.04)',
                }}>
                    <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled', fontWeight: 500 }}>
                        {leafTasks.length} item{leafTasks.length !== 1 ? 's' : ''}
                        {totalHours > 0 && <>  ·  {totalHours.toFixed(1)}h total</>}
                    </Typography>
                    {allAssignees.length > 0 && (
                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled' }}>Team:</Typography>
                            <AvatarGroup max={6} sx={{
                                '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.5625rem', fontWeight: 800, border: '2px solid rgba(20,20,26,1)' }
                            }}>
                                {allAssignees.map(a => (
                                    <Tooltip key={a.id} title={a.name} arrow>
                                        <Avatar sx={{ bgcolor: avatarColor(a.name) }}>{getInitials(a.name)}</Avatar>
                                    </Tooltip>
                                ))}
                            </AvatarGroup>
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
}
