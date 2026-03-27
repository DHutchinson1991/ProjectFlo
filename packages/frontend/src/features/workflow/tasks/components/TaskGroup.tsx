"use client";

import React, { useState, useMemo } from 'react';
import { Box, Typography, Avatar, AvatarGroup, Tooltip } from '@mui/material';
import { AccessTime as ClockIcon } from '@mui/icons-material';
import type { ActiveTask, CrewMember } from '@/features/workflow/tasks/types';
import { sumEstimatedHours } from '@/shared/utils/hours';
import { TaskGroupHeader, TaskColumnHeaders } from '@/shared/ui/tasks';
import { TaskRow } from './TaskRow';
import { TaskGroupRow } from './TaskGroupRow';
import { buildTaskTree } from '../utils/task-display-utils';
import { getInitials, avatarColor } from '../utils/task-display-utils';
import { GRID_COLS } from '../constants';

interface TaskGroupProps {
    title: string;
    color: string;
    tasks: ActiveTask[];
    defaultExpanded: boolean;
    icon?: React.ReactNode;
    badge?: string;
    crewMembers: CrewMember[];
    onAssign: (taskId: number, source: 'inquiry' | 'project', assigneeId: number | null, taskKind?: 'task' | 'subtask') => void;
    onNavigate: (task: ActiveTask) => void;
    onToggle: (task: ActiveTask) => void;
}

export function TaskGroup({ title, color, tasks, defaultExpanded, icon, badge, crewMembers, onAssign, onNavigate, onToggle }: TaskGroupProps) {
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

    const leafTasks = tasks.filter(t => !t.is_task_group && t.task_kind !== 'subtask');
    const totalHours = sumEstimatedHours(leafTasks);
    const completedCount = leafTasks.filter(t => t.status === 'Completed').length;
    const progress = leafTasks.length > 0 ? (completedCount / leafTasks.length) * 100 : 0;

    const allAssignees = useMemo(() => [...new Map(
        tasks.filter(t => t.assignee).map(t => [t.assignee!.id, t.assignee!])
    ).values()], [tasks]);

    return (
        <TaskGroupHeader
            title={title}
            color={color}
            count={tasks.length}
            expanded={expanded}
            onToggle={() => setExpanded(!expanded)}
            icon={icon}
            badge={badge}
            progress={progress}
            progressLabel={`${completedCount}/${tasks.length}`}
            totalHours={totalHours}
        >
            <TaskColumnHeaders
                columns={['', 'Project / Inquiry', 'Task', 'Status', 'Person', 'Due Date', 'Hours']}
                gridCols={GRID_COLS}
            />
            {buildTaskTree(tasks).map(item =>
                item.type === 'stage' ? (
                    <TaskGroupRow
                        key={`stage-${item.stage.source}-${item.stage.id}`}
                        stage={item.stage}
                        children={item.children}
                        groupColor={color}
                        contributors={crewMembers}
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
                        contributors={crewMembers}
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
        </TaskGroupHeader>
    );
}
