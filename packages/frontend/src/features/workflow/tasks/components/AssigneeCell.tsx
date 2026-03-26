"use client";

import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Avatar, Popover, TextField,
    List, ListItemButton, ListItemAvatar, ListItemText,
} from '@mui/material';
import { Person as PersonIcon, Close as CloseIcon } from '@mui/icons-material';
import type { ActiveTask, Contributor } from '@/lib/types';
import { getInitials, avatarColor } from '../utils/task-display-utils';

interface AssigneeCellProps {
    task: ActiveTask;
    contributors: Contributor[];
    onAssign: (taskId: number, source: 'inquiry' | 'project', assigneeId: number | null, taskKind?: 'task' | 'subtask') => void;
    onNavigate: (task: ActiveTask) => void;
}

export function AssigneeCell({ task, contributors, onAssign, onNavigate }: AssigneeCellProps) {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!search) return contributors;
        const q = search.toLowerCase();
        return contributors.filter(c =>
            c.full_name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
        );
    }, [contributors, search]);

    const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSearch('');
    };

    const handleSelect = (contributorId: number | null) => {
        onAssign(task.id, task.source, contributorId, task.task_kind);
        setAnchorEl(null);
    };

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 1.5, mx: 0.5 }}>
                {task.assignee ? (
                    <>
                        <Avatar
                            onClick={handleOpen}
                            sx={{
                                width: 28, height: 28, fontSize: '0.6875rem', fontWeight: 700,
                                bgcolor: avatarColor(task.assignee.name), flexShrink: 0,
                                boxShadow: '0 0 0 2px rgba(0,0,0,0.3)', cursor: 'pointer',
                                transition: 'opacity 0.15s', '&:hover': { opacity: 0.75 },
                            }}
                        >
                            {getInitials(task.assignee.name)}
                        </Avatar>
                        <Typography
                            noWrap
                            onClick={(e) => { e.stopPropagation(); onNavigate(task); }}
                            sx={{
                                fontSize: '0.8125rem', color: 'text.primary', fontWeight: 500, maxWidth: 110,
                                cursor: 'pointer', transition: 'color 0.15s',
                                '&:hover': { color: '#579BFC', textDecoration: 'underline' },
                            }}
                        >
                            {task.assignee.name}
                        </Typography>
                    </>
                ) : (
                    <Box
                        onClick={handleOpen}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                            borderRadius: 1, p: 0.375, transition: 'background 0.15s',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                        }}
                    >
                        <Avatar sx={{
                            width: 28, height: 28, bgcolor: 'transparent',
                            border: '1.5px dashed rgba(255,255,255,0.18)', flexShrink: 0,
                        }}>
                            <PersonIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        </Avatar>
                        <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
                            Assign…
                        </Typography>
                    </Box>
                )}
            </Box>

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{
                    paper: {
                        sx: {
                            width: 270, maxHeight: 340, bgcolor: '#1e1f25',
                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                        },
                    },
                }}
            >
                <Box sx={{ p: 1.25, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <TextField
                        size="small" placeholder="Search people…"
                        value={search} onChange={e => setSearch(e.target.value)}
                        autoFocus fullWidth
                        InputProps={{ sx: { fontSize: '0.8125rem', bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 1 } }}
                    />
                </Box>
                <List dense sx={{ py: 0.5, maxHeight: 260, overflowY: 'auto' }}>
                    {task.assignee && (
                        <ListItemButton onClick={() => handleSelect(null)} sx={{ py: 0.75, px: 1.5, borderRadius: 1, mx: 0.5 }}>
                            <ListItemAvatar sx={{ minWidth: 36 }}>
                                <Avatar sx={{ width: 26, height: 26, bgcolor: 'rgba(255,255,255,0.06)', border: '1.5px dashed rgba(255,255,255,0.18)' }}>
                                    <CloseIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary="Remove assignee"
                                primaryTypographyProps={{ fontSize: '0.8125rem', color: 'text.secondary', fontStyle: 'italic' }}
                            />
                        </ListItemButton>
                    )}
                    {filtered.map(c => (
                        <ListItemButton
                            key={c.id}
                            onClick={() => handleSelect(c.id)}
                            selected={task.assignee?.id === c.id}
                            sx={{ py: 0.75, px: 1.5, borderRadius: 1, mx: 0.5 }}
                        >
                            <ListItemAvatar sx={{ minWidth: 36 }}>
                                <Avatar sx={{ width: 26, height: 26, fontSize: '0.625rem', fontWeight: 700, bgcolor: avatarColor(c.full_name) }}>
                                    {c.initials}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={c.full_name}
                                primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 500 }}
                            />
                        </ListItemButton>
                    ))}
                </List>
            </Popover>
        </>
    );
}
