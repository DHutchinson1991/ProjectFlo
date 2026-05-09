'use client';

import React from 'react';
import {
    Box,
    Typography,
    Chip,
    LinearProgress,
    Stack,
    Avatar,
} from '@mui/material';
import {
    CheckCircleOutline,
    RadioButtonUnchecked,
} from '@mui/icons-material';
import type { Project, ProjectTask } from '../../types/project.types';
import type { ProjectPhaseConfig } from '../../constants/project-phases';

interface ProjectPhaseTabProps {
    project: Project;
    phaseConfig: ProjectPhaseConfig;
    tasks: ProjectTask[];
    onRefresh: () => Promise<void>;
}

/**
 * Generic phase tab — renders tasks for a specific production phase.
 * Shared by all phase tabs (Planning, Creative, Pre-Prod, Production, Post-Prod, Delivery).
 */
export function ProjectPhaseTab({ phaseConfig, tasks }: ProjectPhaseTabProps) {
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const total = tasks.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    const taskGroups = tasks.filter((t) => t.is_task_group);
    const standaloneTasks = tasks.filter((t) => !t.is_task_group && !t.parent_inquiry_task_id);

    return (
        <Box>
            {/* Phase header */}
            <Box
                sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: 2,
                    backgroundColor: phaseConfig.color + '08',
                    border: `1px solid ${phaseConfig.color}15`,
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                backgroundColor: phaseConfig.color,
                            }}
                        />
                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>
                            {phaseConfig.name}
                        </Typography>
                    </Box>
                    <Chip
                        label={`${completed}/${total} tasks`}
                        size="small"
                        sx={{
                            backgroundColor: phaseConfig.color + '20',
                            color: phaseConfig.color,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                        }}
                    />
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: 'rgba(148, 163, 184, 0.1)',
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: phaseConfig.color,
                        },
                    }}
                />
            </Box>

            {/* Empty state */}
            {total === 0 && (
                <Box
                    sx={{
                        py: 8,
                        textAlign: 'center',
                        borderRadius: 2,
                        backgroundColor: 'rgba(30, 41, 59, 0.4)',
                        border: '1px dashed rgba(148, 163, 184, 0.12)',
                    }}
                >
                    <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                        No tasks in this phase yet.
                    </Typography>
                </Box>
            )}

            {/* Task groups */}
            <Stack spacing={2}>
                {taskGroups.map((group) => {
                    const children = tasks.filter((t) => t.parent_inquiry_task_id === group.id);
                    const groupCompleted = children.filter((t) => t.status === 'Completed').length;
                    return (
                        <Box
                            key={group.id}
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: 'rgba(30, 41, 59, 0.6)',
                                border: '1px solid rgba(148, 163, 184, 0.08)',
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0' }}>
                                    {group.name}
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    {groupCompleted}/{children.length}
                                </Typography>
                            </Box>
                            <Stack spacing={0.5}>
                                {children.map((task) => (
                                    <TaskRow key={task.id} task={task} phaseColor={phaseConfig.color} />
                                ))}
                            </Stack>
                        </Box>
                    );
                })}

                {/* Standalone tasks (not part of a group) */}
                {standaloneTasks.map((task) => (
                    <TaskRow key={task.id} task={task} phaseColor={phaseConfig.color} />
                ))}
            </Stack>
        </Box>
    );
}

function TaskRow({ task, phaseColor }: { task: ProjectTask; phaseColor: string }) {
    const isCompleted = task.status === 'Completed';
    const assignee = task.assigned_to?.contact;
    const subtasksDone = task.subtasks?.filter((s) => s.status === 'Completed').length ?? 0;
    const subtasksTotal = task.subtasks?.length ?? 0;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1,
                borderRadius: 1.5,
                '&:hover': { backgroundColor: 'rgba(148, 163, 184, 0.04)' },
            }}
        >
            {isCompleted ? (
                <CheckCircleOutline sx={{ fontSize: 20, color: '#10b981' }} />
            ) : (
                <RadioButtonUnchecked sx={{ fontSize: 20, color: '#475569' }} />
            )}

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    sx={{
                        fontSize: '0.85rem',
                        color: isCompleted ? '#64748b' : '#e2e8f0',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        fontWeight: 500,
                    }}
                >
                    {task.name}
                </Typography>
                {subtasksTotal > 0 && (
                    <Typography sx={{ fontSize: '0.7rem', color: '#475569' }}>
                        {subtasksDone}/{subtasksTotal} subtasks
                    </Typography>
                )}
            </Box>

            {task.job_role && (
                <Chip
                    label={task.job_role.display_name ?? task.job_role.name}
                    size="small"
                    sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        backgroundColor: 'rgba(148, 163, 184, 0.1)',
                        color: '#94a3b8',
                    }}
                />
            )}

            {assignee && (
                <Avatar
                    sx={{ width: 24, height: 24, fontSize: '0.65rem', backgroundColor: phaseColor + '40', color: phaseColor }}
                >
                    {(assignee.first_name?.[0] ?? '') + (assignee.last_name?.[0] ?? '')}
                </Avatar>
            )}

            {task.due_date && (
                <Typography sx={{ fontSize: '0.7rem', color: '#475569', whiteSpace: 'nowrap' }}>
                    {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Typography>
            )}
        </Box>
    );
}
