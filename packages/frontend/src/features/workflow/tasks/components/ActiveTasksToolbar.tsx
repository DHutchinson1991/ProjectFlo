"use client";

import React from 'react';
import {
    Box, Typography, Paper, Divider, Select, MenuItem, FormControl, TextField,
    InputAdornment, IconButton, ToggleButton, ToggleButtonGroup, Tooltip,
} from '@mui/material';
import {
    Search as SearchIcon,
    FolderOpen as ProjectIcon,
    Assignment as TaskIcon,
    AccountTree as PhaseViewIcon,
    Group as PersonViewIcon,
    DateRange as DateViewIcon,
    Circle as CircleIcon,
    Close as CloseIcon,
    Bolt as BoltIcon,
} from '@mui/icons-material';
import { STATUS_CONFIG } from '../constants';
import type { GroupMode } from '../constants';

interface ActiveTasksToolbarProps {
    groupMode: GroupMode;
    statusFilter: string;
    sourceFilter: string;
    showAuto: boolean;
    searchQuery: string;
    totalVisible: number;
    totalAll: number;
    onGroupModeChange: (mode: GroupMode) => void;
    onStatusFilterChange: (val: string) => void;
    onSourceFilterChange: (val: string) => void;
    onShowAutoToggle: () => void;
    onSearchChange: (val: string) => void;
}

export function ActiveTasksToolbar({
    groupMode, statusFilter, sourceFilter, showAuto, searchQuery,
    totalVisible, totalAll,
    onGroupModeChange, onStatusFilterChange, onSourceFilterChange, onShowAutoToggle, onSearchChange,
}: ActiveTasksToolbarProps) {
    return (
        <Paper elevation={0} sx={{
            display: 'flex', alignItems: 'center', gap: 1, p: 0.875, px: 1.25, mb: 2,
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.02)', flexWrap: 'wrap',
        }}>
            {/* Group By */}
            <ToggleButtonGroup
                value={groupMode} exclusive
                onChange={(_, val) => val && onGroupModeChange(val)}
                size="small"
                sx={{
                    '& .MuiToggleButton-root': {
                        fontSize: '0.75rem', fontWeight: 600, textTransform: 'none',
                        px: 1.25, py: 0.375, height: 32,
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.45)', gap: 0.5,
                        '&.Mui-selected': { bgcolor: 'rgba(87,155,252,0.14)', color: '#579BFC', borderColor: 'rgba(87,155,252,0.35)' },
                        '&:hover:not(.Mui-selected)': { bgcolor: 'rgba(255,255,255,0.04)', color: 'text.primary' },
                    },
                }}
            >
                <ToggleButton value="project"><ProjectIcon sx={{ fontSize: 14 }} />Project</ToggleButton>
                <ToggleButton value="status"><CircleIcon sx={{ fontSize: 9 }} />Status</ToggleButton>
                <ToggleButton value="person"><PersonViewIcon sx={{ fontSize: 14 }} />Person</ToggleButton>
                <ToggleButton value="date"><DateViewIcon sx={{ fontSize: 14 }} />Date</ToggleButton>
                <ToggleButton value="phase"><PhaseViewIcon sx={{ fontSize: 14 }} />Phase</ToggleButton>
            </ToggleButtonGroup>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.375, borderColor: 'rgba(255,255,255,0.07)' }} />

            {/* Status filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                    value={statusFilter} onChange={e => onStatusFilterChange(e.target.value)}
                    sx={{ borderRadius: 1.5, fontSize: '0.75rem', height: 32, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }}
                >
                    <MenuItem value="active" sx={{ fontSize: '0.8125rem' }}>Active Only</MenuItem>
                    <MenuItem value="all" sx={{ fontSize: '0.8125rem' }}>All Statuses</MenuItem>
                    {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                        <MenuItem key={key} value={key} sx={{ fontSize: '0.8125rem' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: val.bg }} />
                                {val.label}
                            </Box>
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Source filter */}
            <FormControl size="small" sx={{ minWidth: 108 }}>
                <Select
                    value={sourceFilter} onChange={e => onSourceFilterChange(e.target.value)}
                    sx={{ borderRadius: 1.5, fontSize: '0.75rem', height: 32, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }}
                >
                    <MenuItem value="all" sx={{ fontSize: '0.8125rem' }}>All Sources</MenuItem>
                    <MenuItem value="project" sx={{ fontSize: '0.8125rem' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <ProjectIcon sx={{ fontSize: 14, color: '#579BFC' }} /> Projects
                        </Box>
                    </MenuItem>
                    <MenuItem value="inquiry" sx={{ fontSize: '0.8125rem' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <TaskIcon sx={{ fontSize: 14, color: '#00C875' }} /> Inquiries
                        </Box>
                    </MenuItem>
                </Select>
            </FormControl>

            {/* Auto tasks toggle */}
            <Tooltip title={showAuto ? 'Hide automated tasks' : 'Show automated tasks'} arrow>
                <ToggleButton
                    value="showAuto" selected={showAuto} onChange={onShowAutoToggle}
                    size="small"
                    sx={{
                        height: 32, px: 1, gap: 0.5, borderRadius: 1.5,
                        fontSize: '0.75rem', fontWeight: 600, textTransform: 'none',
                        border: '1px solid rgba(255,255,255,0.1) !important',
                        color: showAuto ? '#FDAB3D' : 'text.disabled',
                        bgcolor: showAuto ? 'rgba(253,171,61,0.08) !important' : 'transparent !important',
                        '&:hover': { bgcolor: 'rgba(253,171,61,0.12) !important', color: '#FDAB3D' },
                    }}
                >
                    <BoltIcon sx={{ fontSize: 13 }} /> Auto
                </ToggleButton>
            </Tooltip>

            {/* Search */}
            <TextField
                size="small" placeholder="Search tasks, people, projects…"
                value={searchQuery} onChange={e => onSearchChange(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.3)' }} />
                        </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                        <InputAdornment position="end">
                            <IconButton size="small" onClick={() => onSearchChange('')} sx={{ p: 0.25 }}>
                                <CloseIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </InputAdornment>
                    ) : null,
                }}
                sx={{
                    ml: 'auto', minWidth: 240,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5, fontSize: '0.8125rem', height: 32,
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    },
                }}
            />

            <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled', fontWeight: 600, whiteSpace: 'nowrap', px: 0.5 }}>
                {totalVisible} / {totalAll}
            </Typography>
        </Paper>
    );
}
