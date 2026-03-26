"use client";

import React from 'react';
import { Box, Avatar } from '@mui/material';
import {
    FolderOpen as ProjectIcon,
    Assignment as TaskIcon,
    CalendarToday as CalendarIcon,
    Person as PersonIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { STATUS_CONFIG, DATE_GROUP_COLORS } from '../constants';
import { getInitials, avatarColor } from '../utils/task-display-utils';

/** Renders the icon for a project/inquiry group. */
export function ProjectGroupIcon({ isProject }: { isProject: boolean }) {
    return isProject
        ? <ProjectIcon sx={{ fontSize: 17, color: '#579BFC' }} />
        : <TaskIcon sx={{ fontSize: 17, color: '#00C875' }} />;
}

/** Renders the icon for a status group. */
export function StatusGroupIcon({ status }: { status: string }) {
    return <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: STATUS_CONFIG[status]?.bg, flexShrink: 0 }} />;
}

/** Renders the icon for a person group. */
export function PersonGroupIcon({ assignee }: { assignee: { id: number; name: string; email: string } | null }) {
    return assignee
        ? <Avatar sx={{ width: 22, height: 22, fontSize: '0.5625rem', fontWeight: 800, bgcolor: avatarColor(assignee.name) }}>
            {getInitials(assignee.name)}
        </Avatar>
        : <Avatar sx={{ width: 22, height: 22, bgcolor: 'transparent', border: '1.5px dashed rgba(255,255,255,0.2)' }}>
            <PersonIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
        </Avatar>;
}

/** Renders the icon for a date group. */
export function DateGroupIcon({ group }: { group: string }) {
    return group === 'Overdue'
        ? <WarningIcon sx={{ fontSize: 15, color: '#D83A52' }} />
        : <CalendarIcon sx={{ fontSize: 15, color: DATE_GROUP_COLORS[group] }} />;
}
