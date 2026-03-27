"use client";

import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Avatar, Popover, TextField,
    List, ListItemButton, ListItemAvatar, ListItemText,
} from '@mui/material';
import { Person as PersonIcon, Close as CloseIcon } from '@mui/icons-material';
import { getInitials, avatarColor } from '@/shared/utils/avatar';

// ── Minimal interfaces for flexibility ───────────────────────
export interface PickerContributor {
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

export interface CrewMemberPickerProps {
    /** Full list of contributors (role/tier filtering applied internally) */
    crewMembers: PickerContributor[];
    /** Currently-assigned contributor ID (null = unassigned) */
    selectedId: number | null;
    /** Display name for the selected contributor */
    selectedName?: string | null;
    /** Called when user picks or removes a contributor */
    onSelect: (crewMemberId: number | null) => void;
    /** Show "Remove assignee" option when someone is selected (default: true) */
    allowRemove?: boolean;
    /** Filter contributors to those with this job role */
    filterRoleId?: number | null;
    /** Minimum bracket level required (contributors at or above this are shown) */
    filterMinBracketLevel?: number | null;
    /** Show the "—" placeholder instead of "Assign…" when no contributor and no role */
    showDashWhenEmpty?: boolean;
}

export function CrewMemberPicker({
    crewMembers,
    selectedId,
    selectedName,
    onSelect,
    allowRemove = true,
    filterRoleId,
    filterMinBracketLevel,
    showDashWhenEmpty = false,
}: CrewMemberPickerProps) {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [search, setSearch] = useState('');

    const eligible = useMemo(() => {
        let list = contributors;

        // Role + tier filtering
        if (filterRoleId) {
            list = list.filter(c =>
                c.job_role_assignments?.some(r => {
                    if (r.job_role_id !== filterRoleId) return false;
                    if (!r.payment_bracket) return true; // untiered → always eligible
                    if (filterMinBracketLevel != null) return r.payment_bracket.level >= filterMinBracketLevel;
                    return true;
                }),
            );
        }

        // Text search
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(c =>
                c.full_name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q),
            );
        }

        return list;
    }, [crewMembers, filterRoleId, filterMinBracketLevel, search]);

    const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSearch('');
    };

    const handleSelect = (crewMemberId: number | null) => {
        onSelect(crewMemberId);
        setAnchorEl(null);
    };

    // Nothing to show — no role assigned, no contributor
    if (showDashWhenEmpty && !selectedId && !filterRoleId) {
        return (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', fontStyle: 'italic' }}>
                —
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
                                width: 28, height: 28, fontSize: '0.6875rem', fontWeight: 700,
                                bgcolor: avatarColor(selectedName), flexShrink: 0,
                                boxShadow: '0 0 0 2px rgba(0,0,0,0.3)', cursor: 'pointer',
                                transition: 'opacity 0.15s', '&:hover': { opacity: 0.75 },
                            }}
                        >
                            {getInitials(selectedName)}
                        </Avatar>
                        <Typography
                            noWrap
                            sx={{
                                fontSize: '0.8125rem', color: 'text.primary', fontWeight: 500, maxWidth: 110,
                            }}
                        >
                            {selectedName}
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
                    {eligible.map(c => (
                        <ListItemButton
                            key={c.id}
                            onClick={() => handleSelect(c.id)}
                            selected={selectedId === c.id}
                            sx={{ py: 0.75, px: 1.5, borderRadius: 1, mx: 0.5 }}
                        >
                            <ListItemAvatar sx={{ minWidth: 36 }}>
                                <Avatar sx={{ width: 26, height: 26, fontSize: '0.625rem', fontWeight: 700, bgcolor: avatarColor(c.full_name) }}>
                                    {c.initials ?? getInitials(c.full_name)}
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
