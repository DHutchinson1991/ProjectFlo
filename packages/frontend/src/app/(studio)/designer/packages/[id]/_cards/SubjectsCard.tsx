'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Button, TextField, Select, MenuItem,
    IconButton, Chip, Menu, Tooltip,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import { api } from '@/lib/api';
import { useOptionalScheduleApi } from '@/components/schedule/ScheduleApiContext';
import type { EventDayTemplate } from '@/components/schedule/EventDayManager';
import type {
    PackageActivityRecord,
    PackageEventDaySubjectRecord,
    SubjectTypeTemplate,
} from '../_lib/types';

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

interface SubjectsCardProps {
    packageId: number | null;
    packageEventDays: EventDayTemplate[];
    packageActivities: PackageActivityRecord[];
    packageSubjects: PackageEventDaySubjectRecord[];
    setPackageSubjects: React.Dispatch<React.SetStateAction<PackageEventDaySubjectRecord[]>>;
    subjectTemplates: SubjectTypeTemplate[];
    scheduleActiveDayId: number | null;
    selectedActivityId: number | null;
    cardSx: SxProps<Theme>;
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function SubjectsCard({
    packageId,
    packageEventDays,
    packageActivities,
    packageSubjects,
    setPackageSubjects,
    subjectTemplates,
    scheduleActiveDayId,
    selectedActivityId,
    cardSx,
}: SubjectsCardProps) {
    // ─── ScheduleApi adapter (use context if available, else direct package API) ──
    const contextApi = useOptionalScheduleApi();
    const subjectApi = contextApi?.subjects ?? {
        create: (dayId: number, data: any) => api.schedule.packageEventDaySubjects.create(packageId!, { event_day_template_id: dayId, ...data }),
        update: (id: number, data: any) => api.schedule.packageEventDaySubjects.update(id, data),
        delete: (id: number) => api.schedule.packageEventDaySubjects.delete(id),
        assignActivity: (subjectId: number, activityId: number) => api.schedule.packageEventDaySubjects.assignActivity(subjectId, activityId),
        unassignActivity: (subjectId: number, activityId: number) => api.schedule.packageEventDaySubjects.unassignActivity(subjectId, activityId),
    };
    // When using ScheduleApi, we always have a valid owner, so packageId check can be relaxed
    const hasOwner = !!contextApi || !!packageId;
    const isInstanceMode = !!contextApi && contextApi.mode !== 'package';

    // ─── Internalized UI state ───────────────────────────────────────
    const [addSubjectMenuAnchor, setAddSubjectMenuAnchor] = useState<null | HTMLElement>(null);
    const [addSubjectDayId, setAddSubjectDayId] = useState<number | null>(null);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectCategory, setNewSubjectCategory] = useState('PEOPLE');
    // Inline count editing — track which subject is being typed into
    const [editingCountId, setEditingCountId] = useState<number | null>(null);
    const [editingCountValue, setEditingCountValue] = useState('');
    // Inline real_name editing (instance mode only)
    const [editingRealNameId, setEditingRealNameId] = useState<number | null>(null);
    const [editingRealNameValue, setEditingRealNameValue] = useState('');

    // ─── Derived values ──────────────────────────────────────────────
    const activeEventDayId = scheduleActiveDayId || packageEventDays[0]?.id;
    const activeDay = packageEventDays.find(d => d.id === activeEventDayId);
    const selectedActivity = selectedActivityId ? packageActivities.find(a => a.id === selectedActivityId) : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const daySubjects = packageSubjects
        .filter((s: any) => s.event_day_template_id === activeEventDayId) // eslint-disable-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const aGuests = (a.name as string).toLowerCase() === 'guests';
            const bGuests = (b.name as string).toLowerCase() === 'guests';
            if (aGuests && !bGuests) return 1;
            if (!aGuests && bGuests) return -1;
            return 0;
        });

    // ── Multi-activity subject assignments (DB-backed via activity_assignments) ──
    const isSubjectAssigned = (s: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!selectedActivityId) return true;
        if (s.activity_assignments && s.activity_assignments.length > 0) {
            return s.activity_assignments.some((a: any) => a.package_activity_id === selectedActivityId); // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        // Legacy fallback
        if (s.package_activity_id) return s.package_activity_id === selectedActivityId;
        return false; // no explicit assignment — click to assign
    };

    const toggleSubjectActivity = async (s: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!selectedActivityId) return;
        try {
            const assigned = isSubjectAssigned(s);
            const updatedSubj = assigned
                ? await subjectApi.unassignActivity(s.id, selectedActivityId)
                : await subjectApi.assignActivity(s.id, selectedActivityId);
            // Update local state with the returned subject (includes activity_assignments)
            setPackageSubjects(prev => prev.map((sub: any) => sub.id === s.id ? { ...sub, ...updatedSubj } : sub)); // eslint-disable-line @typescript-eslint/no-explicit-any
        } catch (err) {
            console.warn('Failed to toggle subject activity:', err);
        }
    };

    // Find templates whose name matches the active day (e.g. "Wedding" matches "Wedding Day")
    const matchedTemplates = subjectTemplates.filter(t =>
        activeDay && (
            activeDay.name.toLowerCase().includes(t.name.toLowerCase()) ||
            t.name.toLowerCase().includes(activeDay.name.toLowerCase().split(' ')[0])
        )
    );
    const existingNames = new Set(daySubjects.map((s: any) => s.name)); // eslint-disable-line @typescript-eslint/no-explicit-any
    // Suggested roles from matched templates not yet added
    const suggestedRoles = matchedTemplates.flatMap(t => t.roles).filter(r => !existingNames.has(r.role_name));

    // ─── Helpers ─────────────────────────────────────────────────────
    const addSubjectFromTemplate = async (role: { id: number; role_name: string }) => {
        if (!activeEventDayId || !hasOwner) return;
        try {
            const created = await subjectApi.create(activeEventDayId, {
                name: role.role_name,
                category: 'PEOPLE',
                role_template_id: role.id,
            });
            // Auto-assign to selected activity via DB
            if (selectedActivityId && created?.id) {
                const assignedSubj = await subjectApi.assignActivity(created.id, selectedActivityId);
                setPackageSubjects(prev => [...prev, { ...created, ...assignedSubj }]);
            } else {
                setPackageSubjects(prev => [...prev, created]);
            }
        } catch (err) { console.warn('Failed to add subject:', err); }
    };

    const addCustomSubject = async () => {
        if (!newSubjectName.trim() || !addSubjectDayId || !hasOwner) return;
        try {
            const created = await subjectApi.create(addSubjectDayId, {
                name: newSubjectName.trim(),
                category: newSubjectCategory,
            });
            // Auto-assign to selected activity via DB
            if (selectedActivityId && created?.id) {
                const assignedSubj = await subjectApi.assignActivity(created.id, selectedActivityId);
                setPackageSubjects(prev => [...prev, { ...created, ...assignedSubj }]);
            } else {
                setPackageSubjects(prev => [...prev, created]);
            }
            setNewSubjectName('');
            setAddSubjectMenuAnchor(null);
            setAddSubjectDayId(null);
        } catch (err) { console.warn('Failed to add subject:', err); }
    };

    // ─── Render ──────────────────────────────────────────────────────
    return (
        <>
            <Box sx={{ ...(cardSx as object), overflow: 'hidden' }}>
                {/* Card Header */}
                <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid rgba(52, 58, 68, 0.25)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                                <PeopleIcon sx={{ fontSize: 14, color: '#a78bfa' }} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subjects</Typography>
                                {selectedActivity ? (
                                    <Typography sx={{ fontSize: '0.55rem', color: '#a855f7', fontWeight: 600, mt: -0.25 }}>{selectedActivity.name}</Typography>
                                ) : activeDay && packageEventDays.length > 1 ? (
                                    <Typography sx={{ fontSize: '0.55rem', color: '#f59e0b', fontWeight: 600, mt: -0.25 }}>{activeDay.name}</Typography>
                                ) : null}
                            </Box>
                        </Box>
                        {daySubjects.length > 0 && (
                            <Chip label={`${daySubjects.reduce((sum: number, s: any) => sum + (s.count != null ? (s.count as number) : 1), 0)}`} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', border: '1px solid rgba(167, 139, 250, 0.2)', '& .MuiChip-label': { px: 0.6 } }} />
                        )}
                    </Box>
                </Box>

                <Box sx={{ px: 2.5, pt: 1.5, pb: 1.5 }}>
                    {/* Existing subjects */}
                    {daySubjects.map((subj: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const subjAssigned = isSubjectAssigned(subj);
                        const isGroup = subj.count !== null && subj.count !== undefined;
                        const currentCount: number = subj.count ?? 1;
                        const isEditingThis = editingCountId === subj.id;

                        const applyCount = async (rawVal: string) => {
                            setEditingCountId(null);
                            const n = parseInt(rawVal, 10);
                            const next = isNaN(n) ? currentCount : Math.max(1, n);
                            if (next === currentCount) return;
                            try {
                                const updated = await subjectApi.update(subj.id, { count: next });
                                setPackageSubjects(prev => prev.map((s: any) => s.id === subj.id ? { ...s, count: updated?.count ?? next } : s)); // eslint-disable-line @typescript-eslint/no-explicit-any
                            } catch (err) { console.warn('Failed to update count:', err); }
                        };

                        const adjustCount = async (e: React.MouseEvent, delta: number) => {
                            e.stopPropagation();
                            const next = Math.max(1, currentCount + delta);
                            if (next === currentCount) return;
                            try {
                                const updated = await subjectApi.update(subj.id, { count: next });
                                setPackageSubjects(prev => prev.map((s: any) => s.id === subj.id ? { ...s, count: updated?.count ?? next } : s)); // eslint-disable-line @typescript-eslint/no-explicit-any
                            } catch (err) { console.warn('Failed to update count:', err); }
                        };

                        const toggleGroup = async (e: React.MouseEvent) => {
                            e.stopPropagation();
                            const newCount = isGroup ? null : 2;
                            try {
                                const updated = await subjectApi.update(subj.id, { count: newCount });
                                setPackageSubjects(prev => prev.map((s: any) => s.id === subj.id ? { ...s, count: updated?.count ?? newCount } : s)); // eslint-disable-line @typescript-eslint/no-explicit-any
                            } catch (err) { console.warn('Failed to toggle group:', err); }
                        };

                        return (
                        <Box
                            key={subj.id}
                            onClick={() => {
                                if (!selectedActivityId) return;
                                toggleSubjectActivity(subj);
                            }}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 0.75,
                                py: 0.5, px: 1, mx: -1, borderRadius: 1.5,
                                transition: 'all 0.2s ease',
                                opacity: subjAssigned ? 1 : 0.3,
                                cursor: selectedActivityId ? 'pointer' : 'default',
                                '&:hover': {
                                    bgcolor: selectedActivityId ? 'rgba(167, 139, 250, 0.12)' : 'rgba(167, 139, 250, 0.05)',
                                    opacity: selectedActivityId && !subjAssigned ? 0.7 : (subjAssigned ? 1 : 0.3),
                                    '& .subj-del': { opacity: !selectedActivityId ? 1 : (subjAssigned ? 1 : 0) },
                                    '& .subj-group-toggle': { opacity: 1 },
                                },
                            }}
                        >
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: '#a78bfa' }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" component="div" sx={{ fontWeight: 600, fontSize: '0.72rem', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                                    {subj.name}
                                    {isInstanceMode && !isGroup && subj.name.toLowerCase() !== 'guests' ? (
                                        editingRealNameId === subj.id ? (
                                            <Box
                                                component="input"
                                                type="text"
                                                autoFocus
                                                value={editingRealNameValue}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingRealNameValue(e.target.value)}
                                                onBlur={async () => {
                                                    const val = editingRealNameValue.trim() || null;
                                                    setEditingRealNameId(null);
                                                    if (val !== ((subj as any).real_name ?? null)) {
                                                        try {
                                                            const updated = await subjectApi.update(subj.id, { real_name: val });
                                                            setPackageSubjects(prev => prev.map((s: any) => s.id === subj.id ? { ...s, real_name: updated?.real_name ?? val } : s));
                                                        } catch { /* ignore */ }
                                                    }
                                                }}
                                                onKeyDown={(e: React.KeyboardEvent) => {
                                                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                                    if (e.key === 'Escape') setEditingRealNameId(null);
                                                    e.stopPropagation();
                                                }}
                                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                sx={{
                                                    ml: 0.5,
                                                    border: '1px solid rgba(167,139,250,0.4)',
                                                    borderRadius: '3px',
                                                    bgcolor: 'rgba(167,139,250,0.08)',
                                                    color: '#94a3b8',
                                                    fontSize: '0.72rem',
                                                    fontWeight: 400,
                                                    py: '1px',
                                                    px: '4px',
                                                    outline: 'none',
                                                    width: 120,
                                                    fontFamily: 'inherit',
                                                }}
                                            />
                                        ) : (
                                            <Box
                                                component="span"
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    setEditingRealNameId(subj.id);
                                                    setEditingRealNameValue((subj as any).real_name ?? '');
                                                }}
                                                sx={{
                                                    color: (subj as any).real_name ? '#94a3b8' : 'rgba(255,255,255,0.15)',
                                                    fontWeight: 400,
                                                    fontStyle: (subj as any).real_name ? 'normal' : 'italic',
                                                    fontSize: (subj as any).real_name ? 'inherit' : '0.65rem',
                                                    cursor: 'pointer',
                                                    borderRadius: '3px',
                                                    ml: 0.25,
                                                    px: 0.25,
                                                    '&:hover': { bgcolor: 'rgba(167,139,250,0.08)' },
                                                    transition: 'background 0.15s',
                                                }}
                                            >
                                                {(subj as any).real_name ? ` — ${(subj as any).real_name}` : '— Add name...'}
                                            </Box>
                                        )
                                    ) : (subj as any).real_name ? (
                                        <Box component="span" sx={{ color: '#94a3b8', fontWeight: 400 }}> — {(subj as any).real_name}</Box>
                                    ) : null}
                                </Typography>
                                {subj.category && (
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.55rem', display: 'block', mt: -0.2, textTransform: 'capitalize' }}>
                                        {(subj.category as string).toLowerCase()}{isGroup ? ' group' : ''}
                                    </Typography>
                                )}
                            </Box>

                            {/* Group toggle icon */}
                            <Tooltip title={isGroup ? 'Remove group' : 'Make group'} arrow placement="top">
                                <IconButton
                                    size="small"
                                    className="subj-group-toggle"
                                    onClick={toggleGroup}
                                    sx={{
                                        p: 0.25, flexShrink: 0,
                                        opacity: isGroup ? 1 : 0,
                                        transition: 'opacity 0.15s',
                                        color: isGroup ? '#a78bfa' : '#475569',
                                        '&:hover': { color: isGroup ? '#c4b5fd' : '#a78bfa', bgcolor: 'rgba(167,139,250,0.12)' },
                                    }}
                                >
                                    <GroupsIcon sx={{ fontSize: 13 }} />
                                </IconButton>
                            </Tooltip>

                            {/* Count stepper — only when group */}
                            {isGroup && (
                                <Box
                                    onClick={e => e.stopPropagation()}
                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.15, flexShrink: 0 }}
                                >
                                    <IconButton size="small" onClick={(e) => adjustCount(e, -1)}
                                        sx={{ p: 0.15, color: '#64748b', '&:hover': { color: '#a78bfa', bgcolor: 'rgba(167,139,250,0.12)' } }}>
                                        <Box component="span" sx={{ fontSize: 13, lineHeight: 1, fontWeight: 700 }}>−</Box>
                                    </IconButton>
                                    {isEditingThis ? (
                                        <Box
                                            component="input"
                                            type="number"
                                            autoFocus
                                            value={editingCountValue}
                                            onChange={e => setEditingCountValue(e.target.value)}
                                            onBlur={e => applyCount(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') applyCount((e.target as HTMLInputElement).value);
                                                if (e.key === 'Escape') setEditingCountId(null);
                                                e.stopPropagation();
                                            }}
                                            onClick={e => e.stopPropagation()}
                                            sx={{
                                                width: 36, textAlign: 'center', border: '1px solid rgba(167,139,250,0.5)',
                                                borderRadius: '4px', bgcolor: 'rgba(167,139,250,0.1)', color: '#a78bfa',
                                                fontSize: '0.65rem', fontWeight: 700, py: '1px', px: '2px',
                                                outline: 'none',
                                                '&::-webkit-inner-spin-button': { display: 'none' },
                                            }}
                                        />
                                    ) : (
                                        <Typography
                                            onClick={(e) => { e.stopPropagation(); setEditingCountId(subj.id); setEditingCountValue(String(currentCount)); }}
                                            sx={{
                                                fontSize: '0.65rem', fontWeight: 700, color: '#a78bfa',
                                                minWidth: 20, textAlign: 'center', fontVariantNumeric: 'tabular-nums',
                                                cursor: 'text', px: 0.25,
                                                borderRadius: '4px',
                                                '&:hover': { bgcolor: 'rgba(167,139,250,0.1)' },
                                            }}
                                        >
                                            {currentCount}
                                        </Typography>
                                    )}
                                    <IconButton size="small" onClick={(e) => adjustCount(e, +1)}
                                        sx={{ p: 0.15, color: '#64748b', '&:hover': { color: '#a78bfa', bgcolor: 'rgba(167,139,250,0.12)' } }}>
                                        <Box component="span" sx={{ fontSize: 13, lineHeight: 1, fontWeight: 700 }}>+</Box>
                                    </IconButton>
                                </Box>
                            )}

                            <Box className="subj-del" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
                                <IconButton
                                    size="small"
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            await subjectApi.delete(subj.id);
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            setPackageSubjects(prev => prev.filter((s: any) => s.id !== subj.id));
                                        } catch (err) { console.warn('Failed to remove subject:', err); }
                                    }}
                                    sx={{ p: 0.25, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}
                                >
                                    <DeleteIcon sx={{ fontSize: 11 }} />
                                </IconButton>
                            </Box>
                        </Box>
                        );
                    })}

                    {/* Template suggestions: show if matched template has unassigned roles */}
                    {suggestedRoles.length > 0 && (
                        <Box sx={{ mt: daySubjects.length > 0 ? 1.5 : 0 }}>
                            {daySubjects.length === 0 && (
                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.58rem', display: 'block', mb: 0.75 }}>
                                    From {matchedTemplates.map(t => t.name).join(', ')} template:
                                </Typography>
                            )}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {suggestedRoles.map(role => (
                                    <Chip
                                        key={role.id}
                                        label={role.role_name}
                                        size="small"
                                        onClick={() => addSubjectFromTemplate(role)}
                                        icon={<AddIcon sx={{ fontSize: '10px !important' }} />}
                                        sx={{
                                            height: 20, fontSize: '0.6rem', fontWeight: 600, cursor: 'pointer',
                                            bgcolor: 'rgba(167, 139, 250, 0.07)', color: '#a78bfa',
                                            border: '1px dashed rgba(167, 139, 250, 0.3)',
                                            '& .MuiChip-icon': { color: '#a78bfa' },
                                            '&:hover': { bgcolor: 'rgba(167, 139, 250, 0.15)', borderStyle: 'solid' },
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* Add custom subject button */}
                    <Box sx={{ mt: (daySubjects.length > 0 || suggestedRoles.length > 0) ? 1.5 : 0.5, display: 'flex', justifyContent: 'center' }}>
                        {hasOwner && packageEventDays.length > 0 && (
                            <Button
                                size="small"
                                startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                                onClick={(e) => {
                                    setAddSubjectMenuAnchor(e.currentTarget);
                                    setAddSubjectDayId(activeEventDayId || null);
                                    setNewSubjectName('');
                                    setNewSubjectCategory('PEOPLE');
                                }}
                                sx={{ fontSize: '0.6rem', color: '#a78bfa', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(167, 139, 250, 0.06)' } }}
                            >
                                Add Custom Subject
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Subject Add Menu */}
            <Menu
                anchorEl={addSubjectMenuAnchor}
                open={Boolean(addSubjectMenuAnchor)}
                onClose={() => { setAddSubjectMenuAnchor(null); setAddSubjectDayId(null); setNewSubjectName(''); }}
                PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 240 } }}
            >
                <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.75 }}>
                        Custom Subject
                    </Typography>
                    <TextField
                        autoFocus
                        size="small"
                        placeholder="Name (e.g. Bride, Groom...)"
                        value={newSubjectName}
                        onChange={e => setNewSubjectName(e.target.value)}
                        onKeyDown={async (e) => {
                            if (e.key === 'Enter' && newSubjectName.trim() && addSubjectDayId && hasOwner) {
                                await addCustomSubject();
                            }
                        }}
                        InputProps={{ sx: { fontSize: '0.75rem', color: '#f1f5f9', bgcolor: 'rgba(255,255,255,0.04)', '& fieldset': { borderColor: 'rgba(167, 139, 250, 0.3)' }, '&:hover fieldset': { borderColor: 'rgba(167, 139, 250, 0.5)' }, '&.Mui-focused fieldset': { borderColor: '#a78bfa' } } }}
                        sx={{ mb: 0.75, width: '100%' }}
                    />
                    <Select
                        size="small"
                        value={newSubjectCategory}
                        onChange={e => setNewSubjectCategory(e.target.value)}
                        sx={{ width: '100%', fontSize: '0.7rem', color: '#e2e8f0', bgcolor: 'rgba(255,255,255,0.04)', '& fieldset': { borderColor: 'rgba(167, 139, 250, 0.2)' }, '& .MuiSelect-icon': { color: '#64748b' } }}
                    >
                        <MenuItem value="PEOPLE" sx={{ fontSize: '0.7rem' }}>People</MenuItem>
                        <MenuItem value="OBJECTS" sx={{ fontSize: '0.7rem' }}>Objects</MenuItem>
                        <MenuItem value="LOCATIONS" sx={{ fontSize: '0.7rem' }}>Locations</MenuItem>
                    </Select>
                </Box>
                {newSubjectName.trim() && (
                    <Box sx={{ px: 1.5, py: 0.75 }}>
                        <Button
                            size="small"
                            fullWidth
                            onClick={addCustomSubject}
                            sx={{ fontSize: '0.65rem', color: '#a78bfa', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: 'rgba(167, 139, 250, 0.1)' } }}
                        >
                            Add &quot;{newSubjectName.trim()}&quot;
                        </Button>
                    </Box>
                )}
            </Menu>
        </>
    );
}
