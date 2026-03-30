"use client";

import React, { useMemo, useState } from 'react';
import {
    Avatar,
    Box,
    List,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Popover,
    TextField,
    Typography,
} from '@mui/material';
import { Close as CloseIcon, Person as PersonIcon } from '@mui/icons-material';
import { avatarColor, getInitials } from '@/shared/utils/avatar';

export interface PickerCrew {
    id: number;
    full_name: string;
    initials?: string;
    email?: string;
    job_role_assignments?: {
        job_role_id: number;
        payment_bracket_id?: number | null;
        payment_bracket?: { id: number; level: number } | null;
    }[];
}

export interface CrewPickerProps {
    crew: PickerCrew[];
    selectedId: number | null;
    selectedName?: string | null;
    onSelect: (crewId: number | null) => void;
    allowRemove?: boolean;
    filterRoleId?: number | null;
    filterMinBracketLevel?: number | null;
    showDashWhenEmpty?: boolean;
    placeholder?: string;
}

export function CrewPicker({
    crew,
    selectedId,
    selectedName,
    onSelect,
    allowRemove = true,
    filterRoleId,
    filterMinBracketLevel,
    showDashWhenEmpty = false,
    placeholder = 'Assign...',
}: CrewPickerProps) {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [search, setSearch] = useState('');

    const eligible = useMemo(() => {
        let list = crew;

        if (filterRoleId) {
            list = list.filter((member) =>
                member.job_role_assignments?.some((assignment) => {
                    if (assignment.job_role_id !== filterRoleId) return false;
                    if (!assignment.payment_bracket) return true;
                    if (filterMinBracketLevel != null) {
                        return assignment.payment_bracket.level >= filterMinBracketLevel;
                    }
                    return true;
                }),
            );
        }

        if (search) {
            const query = search.toLowerCase();
            list = list.filter(
                (member) =>
                    member.full_name.toLowerCase().includes(query) ||
                    member.email?.toLowerCase().includes(query),
            );
        }

        return list;
    }, [crew, filterMinBracketLevel, filterRoleId, search]);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setSearch('');
    };

    const handleSelect = (crewId: number | null) => {
        onSelect(crewId);
        setAnchorEl(null);
    };

    if (showDashWhenEmpty && !selectedId && !filterRoleId) {
        return (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', fontStyle: 'italic' }}>
                -
            </Typography>
        );
    }

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 1.5, mx: 0.5 }}>
                {selectedId && selectedName ? (
                    <>
                        <Avatar
                            onClick={handleOpen}
                            sx={{
                                width: 28,
                                height: 28,
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                bgcolor: avatarColor(selectedName),
                                flexShrink: 0,
                                boxShadow: '0 0 0 2px rgba(0,0,0,0.3)',
                                cursor: 'pointer',
                                transition: 'opacity 0.15s',
                                '&:hover': { opacity: 0.75 },
                            }}
                        >
                            {getInitials(selectedName)}
                        </Avatar>
                        <Typography
                            noWrap
                            sx={{
                                fontSize: '0.8125rem',
                                color: 'text.primary',
                                fontWeight: 500,
                                maxWidth: 110,
                            }}
                        >
                            {selectedName}
                        </Typography>
                    </>
                ) : (
                    <Box
                        onClick={handleOpen}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            cursor: 'pointer',
                            borderRadius: 1,
                            p: 0.375,
                            transition: 'background 0.15s',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 28,
                                height: 28,
                                bgcolor: 'transparent',
                                border: '1.5px dashed rgba(255,255,255,0.18)',
                                flexShrink: 0,
                            }}
                        >
                            <PersonIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        </Avatar>
                        <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
                            {placeholder}
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
                            width: 270,
                            maxHeight: 340,
                            bgcolor: '#1e1f25',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 2,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                        },
                    },
                }}
            >
                <Box sx={{ p: 1.25, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <TextField
                        size="small"
                        placeholder="Search crew..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        autoFocus
                        fullWidth
                        InputProps={{
                            sx: {
                                fontSize: '0.8125rem',
                                bgcolor: 'rgba(255,255,255,0.04)',
                                borderRadius: 1,
                            },
                        }}
                    />
                </Box>
                <List dense sx={{ py: 0.5, maxHeight: 260, overflowY: 'auto' }}>
                    {allowRemove && selectedId && (
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
                    {eligible.map((member) => (
                        <ListItemButton
                            key={member.id}
                            onClick={() => handleSelect(member.id)}
                            selected={selectedId === member.id}
                            sx={{ py: 0.75, px: 1.5, borderRadius: 1, mx: 0.5 }}
                        >
                            <ListItemAvatar sx={{ minWidth: 36 }}>
                                <Avatar sx={{ width: 26, height: 26, fontSize: '0.625rem', fontWeight: 700, bgcolor: avatarColor(member.full_name) }}>
                                    {member.initials ?? getInitials(member.full_name)}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={member.full_name}
                                primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 500 }}
                            />
                        </ListItemButton>
                    ))}
                </List>
            </Popover>
        </>
    );
}
