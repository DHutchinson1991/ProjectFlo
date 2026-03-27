"use client";

import React from 'react';
import { Box, Typography } from '@mui/material';
import type { ActiveTask, CrewMember } from '@/features/workflow/tasks/types';
import { CrewMemberPicker } from '@/shared/ui/tasks';

interface AssigneeCellProps {
    task: ActiveTask;
    crewMembers: CrewMember[];
    onAssign: (taskId: number, source: 'inquiry' | 'project', assigneeId: number | null, taskKind?: 'task' | 'subtask') => void;
    onNavigate: (task: ActiveTask) => void;
}

export function AssigneeCell({ task, crewMembers, onAssign, onNavigate }: AssigneeCellProps) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CrewMemberPicker
                contributors={crewMembers}
                selectedId={task.assignee?.id ?? null}
                selectedName={task.assignee?.name ?? null}
                onSelect={(id) => onAssign(task.id, task.source, id, task.task_kind)}
            />
            {task.assignee && (
                <Typography
                    noWrap
                    onClick={(e) => { e.stopPropagation(); onNavigate(task); }}
                    sx={{
                        fontSize: '0.8125rem', color: 'text.primary', fontWeight: 500, maxWidth: 110,
                        cursor: 'pointer', transition: 'color 0.15s', ml: -0.5,
                        '&:hover': { color: '#579BFC', textDecoration: 'underline' },
                    }}
                >
                    {task.assignee.name}
                </Typography>
            )}
        </Box>
    );
}
