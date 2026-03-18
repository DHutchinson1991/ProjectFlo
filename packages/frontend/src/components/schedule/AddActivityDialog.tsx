'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Chip,
    Stack,
    Autocomplete,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import { api } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────

interface ActivityRecord {
    id: number;
    package_id: number;
    package_event_day_id: number;
    name: string;
    description?: string | null;
    color?: string | null;
    icon?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    duration_minutes?: number | null;
    order_index: number;
}

const ACTIVITY_COLORS = [
    '#f59e0b', '#10b981', '#648CFF', '#ec4899',
    '#a855f7', '#0ea5e9', '#ef4444', '#f97316',
    '#14b8a6', '#8b5cf6', '#06b6d4', '#d946ef',
];

const ACTIVITY_PRESETS = [
    { name: 'Bridal Prep', color: '#ec4899' },
    { name: 'Groom Prep', color: '#648CFF' },
    { name: 'First Look', color: '#a855f7' },
    { name: 'Ceremony', color: '#f59e0b' },
    { name: 'Family Portraits', color: '#10b981' },
    { name: 'Couple Portraits', color: '#0ea5e9' },
    { name: 'Cocktail Hour', color: '#f97316' },
    { name: 'Reception', color: '#14b8a6' },
    { name: 'First Dance', color: '#d946ef' },
    { name: 'Speeches & Toasts', color: '#8b5cf6' },
    { name: 'Detail Shots', color: '#06b6d4' },
    { name: 'Send Off', color: '#ef4444' },
];

/** Resolved presets: either from API (per event day template) or the hardcoded fallback */
type PresetEntry = { name: string; color: string };

export type ActivityValues = Partial<Pick<ActivityRecord, 'name' | 'color' | 'start_time' | 'end_time' | 'description'>> & { name: string; color: string };

export interface ActivitySaveResult extends ActivityValues {
    subjectChanges: { id: number; assign: boolean }[];
    newSubjects: string[];
    locationSlotChanges: { slotId: number; assign: boolean }[];
    crewChanges: { id: number; assign: boolean }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SubjectRecord = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LocationSlotRecord = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CrewRecord = any;

interface AddEditActivityDialogProps {
    open: boolean;
    initial?: Partial<ActivityValues>;
    activityId?: number;
    existingNames?: string[];
    eventDayTemplateId?: number | null;
    eventDaySubjects?: SubjectRecord[];
    eventDayLocationSlots?: LocationSlotRecord[];
    eventDayCrew?: CrewRecord[];
    onClose: () => void;
    onSave: (vals: ActivitySaveResult) => void;
    /** Fired immediately when the user picks a colour swatch (edit mode only) */
    onColorChange?: (color: string) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────

/** Normalize "9:00" → "09:00" for <input type="time"> */
function normalizeTime(t: string | null | undefined): string {
    if (!t) return '';
    const parts = t.split(':');
    if (parts.length >= 2) {
        return parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0');
    }
    return t;
}

// ─── Component ───────────────────────────────────────────────────

export const AddEditActivityDialog: React.FC<AddEditActivityDialogProps> = ({
    open,
    initial,
    activityId,
    existingNames = [],
    eventDayTemplateId,
    eventDaySubjects = [],
    eventDayLocationSlots = [],
    eventDayCrew = [],
    onClose,
    onSave,
    onColorChange,
}) => {
    const isEdit = !!initial;

    // ── Dynamic presets from API ──
    const [resolvedPresets, setResolvedPresets] = useState<PresetEntry[]>(ACTIVITY_PRESETS);

    const loadPresets = useCallback(async () => {
        if (!eventDayTemplateId) {
            setResolvedPresets(ACTIVITY_PRESETS);
            return;
        }
        try {
            const apiPresets = await api.schedule.activityPresets.getAll(eventDayTemplateId);
            if (apiPresets && apiPresets.length > 0) {
                setResolvedPresets(apiPresets.map((p: { name: string; color?: string }) => ({
                    name: p.name,
                    color: p.color || ACTIVITY_COLORS[0],
                })));
            } else {
                setResolvedPresets(ACTIVITY_PRESETS);
            }
        } catch {
            setResolvedPresets(ACTIVITY_PRESETS);
        }
    }, [eventDayTemplateId]);

    useEffect(() => { loadPresets(); }, [loadPresets]);

    // ── Core form values ──
    const [values, setValues] = useState<ActivityValues>({
        name: '',
        color: ACTIVITY_COLORS[0],
        start_time: '',
        end_time: '',
        description: '',
    });

    // ── Subject assignment state ──
    const [assignedSubjectIds, setAssignedSubjectIds] = useState<Set<number>>(new Set());
    const [newSubjectName, setNewSubjectName] = useState('');

    // ── Location slot assignment state ──
    const [assignedSlotIds, setAssignedSlotIds] = useState<Set<number>>(new Set());

    // ── Crew assignment state ──
    const [assignedCrewIds, setAssignedCrewIds] = useState<Set<number>>(new Set());

    // Track initial assignments to compute diffs on save
    const [initialSubjectIds, setInitialSubjectIds] = useState<Set<number>>(new Set());
    const [initialSlotIds, setInitialSlotIds] = useState<Set<number>>(new Set());
    const [initialCrewIds, setInitialCrewIds] = useState<Set<number>>(new Set());
    const [pendingNewSubjects, setPendingNewSubjects] = useState<string[]>([]);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            if (initial) {
                setValues({
                    name: initial.name || '',
                    color: initial.color || ACTIVITY_COLORS[0],
                    start_time: normalizeTime(initial.start_time),
                    end_time: normalizeTime(initial.end_time),
                    description: initial.description ?? '',
                });
            } else {
                setValues({
                    name: '',
                    color: ACTIVITY_COLORS[0],
                    start_time: '',
                    end_time: '',
                    description: '',
                });
            }

            // Initialize subject assignments (from activity_assignments M2M junction)
            const subjIds = new Set(
                (activityId
                    ? eventDaySubjects.filter((s: SubjectRecord) =>
                        s.activity_assignments?.some((a: { package_activity_id: number }) => a.package_activity_id === activityId)
                    )
                    : eventDaySubjects
                ).map((s: SubjectRecord) => s.id as number),
            );
            setAssignedSubjectIds(new Set(subjIds));
            setInitialSubjectIds(new Set(subjIds));

            // Initialize location slot assignments (from activity_assignments junction)
            const slotIds = new Set(
                (activityId
                    ? eventDayLocationSlots.filter((s: LocationSlotRecord) =>
                        s.activity_assignments?.some((a: { package_activity_id: number }) => a.package_activity_id === activityId)
                    )
                    : []
                ).map((s: LocationSlotRecord) => s.id as number),
            );
            setAssignedSlotIds(new Set(slotIds));
            setInitialSlotIds(new Set(slotIds));

            // Initialize crew assignments (from activity_assignments M2M junction)
            const crewIds = new Set(
                (activityId
                    ? eventDayCrew.filter((c: CrewRecord) =>
                        c.activity_assignments?.some((a: { package_activity_id: number }) => a.package_activity_id === activityId)
                    )
                    : []
                ).map((c: CrewRecord) => c.id as number),
            );
            setAssignedCrewIds(new Set(crewIds));
            setInitialCrewIds(new Set(crewIds));

            // Clear pending
            setPendingNewSubjects([]);
            setNewSubjectName('');
        }
    }, [open, initial, activityId, eventDaySubjects, eventDayLocationSlots, eventDayCrew]);

    // Auto-set color when selecting a preset name
    const getPresetColor = (name: string): string | undefined => {
        return resolvedPresets.find(p => p.name === name)?.color;
    };

    // ── Subject toggles ──
    const toggleSubject = (subjectId: number) => {
        setAssignedSubjectIds(prev => {
            const next = new Set(prev);
            if (next.has(subjectId)) next.delete(subjectId);
            else next.add(subjectId);
            return next;
        });
    };

    const addNewSubject = () => {
        const trimmed = newSubjectName.trim();
        if (!trimmed) return;
        if (pendingNewSubjects.includes(trimmed)) return;
        if (eventDaySubjects.some((s: SubjectRecord) => s.name === trimmed)) return;
        setPendingNewSubjects(prev => [...prev, trimmed]);
        setNewSubjectName('');
    };

    const removeNewSubject = (name: string) => {
        setPendingNewSubjects(prev => prev.filter(n => n !== name));
    };

    // ── Crew toggles ──
    const toggleCrew = (crewId: number) => {
        setAssignedCrewIds(prev => {
            const next = new Set(prev);
            if (next.has(crewId)) next.delete(crewId);
            else next.add(crewId);
            return next;
        });
    };

    // ── Location slot toggles ──
    const toggleSlot = (slotId: number) => {
        setAssignedSlotIds(prev => {
            const next = new Set(prev);
            if (next.has(slotId)) next.delete(slotId);
            else next.add(slotId);
            return next;
        });
    };

    // ── Save ──
    const handleSubmit = () => {
        if (!values.name.trim()) return;

        // Compute subject diffs
        const subjectChanges: { id: number; assign: boolean }[] = [];
        eventDaySubjects.forEach((s: SubjectRecord) => {
            const wasAssigned = initialSubjectIds.has(s.id);
            const nowAssigned = assignedSubjectIds.has(s.id);
            if (wasAssigned !== nowAssigned) {
                subjectChanges.push({ id: s.id, assign: nowAssigned });
            }
        });

        // Compute location slot diffs
        const locationSlotChanges: { slotId: number; assign: boolean }[] = [];
        eventDayLocationSlots.forEach((s: LocationSlotRecord) => {
            const wasAssigned = initialSlotIds.has(s.id);
            const nowAssigned = assignedSlotIds.has(s.id);
            if (wasAssigned !== nowAssigned) {
                locationSlotChanges.push({ slotId: s.id, assign: nowAssigned });
            }
        });

        // Compute crew diffs
        const crewChanges: { id: number; assign: boolean }[] = [];
        eventDayCrew.forEach((c: CrewRecord) => {
            const wasAssigned = initialCrewIds.has(c.id);
            const nowAssigned = assignedCrewIds.has(c.id);
            if (wasAssigned !== nowAssigned) {
                crewChanges.push({ id: c.id, assign: nowAssigned });
            }
        });

        onSave({
            ...values,
            subjectChanges,
            newSubjects: pendingNewSubjects,
            locationSlotChanges,
            crewChanges,
        });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { bgcolor: 'background.default' } }}
        >
            <DialogTitle>{isEdit ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2.5} sx={{ mt: 1 }}>
                    {/* ── Name ── */}
                    <Autocomplete
                        freeSolo
                        options={resolvedPresets.map(p => p.name).filter(n => !existingNames.includes(n) || n === values.name)}
                        value={values.name}
                        onChange={(_, v) => {
                            if (v) {
                                const presetColor = getPresetColor(v);
                                setValues(prev => ({ ...prev, name: v, ...(presetColor ? { color: presetColor } : {}) }));
                            }
                        }}
                        onInputChange={(_, v) => {
                            const presetColor = getPresetColor(v);
                            setValues(prev => ({ ...prev, name: v, ...(presetColor ? { color: presetColor } : {}) }));
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Activity name" size="small" autoFocus />
                        )}
                    />

                    {/* ── Times ── */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            label="Start time"
                            type="time"
                            size="small"
                            value={values.start_time ?? ''}
                            onChange={e => setValues(v => ({ ...v, start_time: e.target.value }))}
                            InputLabelProps={{ shrink: true }}
                            sx={{ flex: 1 }}
                        />
                        <TextField
                            label="End time"
                            type="time"
                            size="small"
                            value={values.end_time ?? ''}
                            onChange={e => setValues(v => ({ ...v, end_time: e.target.value }))}
                            InputLabelProps={{ shrink: true }}
                            sx={{ flex: 1 }}
                        />
                    </Box>

                    {/* ── Description ── */}
                    <TextField
                        label="Description (optional)"
                        size="small"
                        multiline
                        rows={2}
                        value={values.description ?? ''}
                        onChange={e => setValues(v => ({ ...v, description: e.target.value }))}
                    />

                    {/* ── Colour ── */}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Box
                                sx={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    bgcolor: values.color || ACTIVITY_COLORS[0],
                                    flexShrink: 0,
                                    border: '2px solid rgba(255,255,255,0.2)',
                                }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
                                Colour
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            {ACTIVITY_COLORS.map(colour => {
                                const selected = (values.color || ACTIVITY_COLORS[0]) === colour;
                                return (
                                    <Box
                                        key={colour}
                                        onClick={() => {
                                        setValues(v => ({ ...v, color: colour }));
                                        onColorChange?.(colour);
                                    }}
                                        sx={{
                                            width: 26,
                                            height: 26,
                                            borderRadius: '50%',
                                            bgcolor: colour,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: selected ? '2px solid #fff' : '2px solid transparent',
                                            boxShadow: selected ? `0 0 0 2px ${colour}` : 'none',
                                            transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                                            '&:hover': {
                                                transform: 'scale(1.2)',
                                                boxShadow: `0 0 0 2px ${colour}`,
                                            },
                                        }}
                                    >
                                        {selected && <CheckIcon sx={{ fontSize: 13, color: '#fff' }} />}
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>

                    {/* ── Subjects Section ── */}
                    {isEdit && (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                                <PersonIcon sx={{ fontSize: 15, color: '#a78bfa' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
                                    Subjects
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.6rem', ml: 0.5 }}>
                                    (assigned to this activity)
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                                {/* Key subjects first */}
                                {eventDaySubjects.filter((s: SubjectRecord) => (s.name as string).toLowerCase() !== 'guests').map((subj: SubjectRecord) => {
                                    const assigned = assignedSubjectIds.has(subj.id);
                                    const label = subj.count != null ? `${subj.name} · ${subj.count}` : subj.name;
                                    return (
                                        <Chip
                                            key={subj.id}
                                            label={label}
                                            size="small"
                                            onClick={() => toggleSubject(subj.id)}
                                            sx={{
                                                cursor: 'pointer',
                                                bgcolor: assigned ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255,255,255,0.04)',
                                                color: assigned ? '#c4b5fd' : '#94a3b8',
                                                border: `1px solid ${assigned ? 'rgba(167, 139, 250, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                                                fontWeight: assigned ? 600 : 400,
                                                fontSize: '0.7rem',
                                                transition: 'all 0.15s ease',
                                                '&:hover': {
                                                    bgcolor: assigned ? 'rgba(167, 139, 250, 0.25)' : 'rgba(255,255,255,0.08)',
                                                },
                                            }}
                                        />
                                    );
                                })}
                                {/* Guests — always last, muted styling */}
                                {eventDaySubjects.filter((s: SubjectRecord) => (s.name as string).toLowerCase() === 'guests').map((subj: SubjectRecord) => {
                                    const assigned = assignedSubjectIds.has(subj.id);
                                    const label = subj.count != null ? `${subj.name} · ${subj.count}` : subj.name;
                                    return (
                                        <Chip
                                            key={subj.id}
                                            label={label}
                                            size="small"
                                            onClick={() => toggleSubject(subj.id)}
                                            sx={{
                                                cursor: 'pointer',
                                                bgcolor: assigned ? 'rgba(109, 90, 138, 0.2)' : 'rgba(255,255,255,0.03)',
                                                color: assigned ? '#9d87c0' : '#64748b',
                                                border: `1px solid ${assigned ? 'rgba(109, 90, 138, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                                                fontWeight: assigned ? 500 : 400,
                                                fontSize: '0.7rem',
                                                transition: 'all 0.15s ease',
                                                '&:hover': {
                                                    bgcolor: assigned ? 'rgba(109, 90, 138, 0.3)' : 'rgba(255,255,255,0.06)',
                                                },
                                            }}
                                        />
                                    );
                                })}
                                {/* Pending new subjects */}
                                {pendingNewSubjects.map(name => (
                                    <Chip
                                        key={`new-${name}`}
                                        label={name}
                                        size="small"
                                        onDelete={() => removeNewSubject(name)}
                                        deleteIcon={<CloseIcon sx={{ fontSize: 12 }} />}
                                        sx={{
                                            bgcolor: 'rgba(167, 139, 250, 0.15)',
                                            color: '#c4b5fd',
                                            border: '1px dashed rgba(167, 139, 250, 0.3)',
                                            fontWeight: 600,
                                            fontSize: '0.7rem',
                                        }}
                                    />
                                ))}
                                {eventDaySubjects.length === 0 && pendingNewSubjects.length === 0 && (
                                    <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.65rem' }}>
                                        No subjects on this event day yet
                                    </Typography>
                                )}
                            </Box>
                            {/* Add new subject inline */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <TextField
                                    size="small"
                                    placeholder="New subject name…"
                                    value={newSubjectName}
                                    onChange={e => setNewSubjectName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNewSubject(); } }}
                                    sx={{
                                        flex: 1,
                                        '& .MuiOutlinedInput-root': {
                                            height: 30, fontSize: '0.75rem',
                                            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                                        },
                                    }}
                                />
                                <Button
                                    size="small"
                                    onClick={addNewSubject}
                                    disabled={!newSubjectName.trim()}
                                    sx={{ minWidth: 0, px: 1, fontSize: '0.65rem', color: '#a78bfa', textTransform: 'none' }}
                                >
                                    + Add
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {/* ── Crew Section ── */}
                    {isEdit && (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                                <PersonIcon sx={{ fontSize: 15, color: '#EC4899' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#EC4899', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
                                    Crew
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.6rem', ml: 0.5 }}>
                                    (assigned to this activity)
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                                {eventDayCrew.map((crew: CrewRecord) => {
                                    const assigned = assignedCrewIds.has(crew.id);
                                    const crewName = crew.position_name || 'Crew';
                                    const crewRole = crew.job_role?.display_name || crew.job_role?.name;
                                    return (
                                        <Chip
                                            key={crew.id}
                                            label={crewRole ? `${crewName} · ${crewRole}` : crewName}
                                            size="small"
                                            onClick={() => toggleCrew(crew.id)}
                                            sx={{
                                                cursor: 'pointer',
                                                bgcolor: assigned ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255,255,255,0.04)',
                                                color: assigned ? '#f9a8d4' : '#94a3b8',
                                                border: `1px solid ${assigned ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                                                fontWeight: assigned ? 600 : 400,
                                                fontSize: '0.7rem',
                                                transition: 'all 0.15s ease',
                                                '&:hover': {
                                                    bgcolor: assigned ? 'rgba(236, 72, 153, 0.25)' : 'rgba(255,255,255,0.08)',
                                                },
                                            }}
                                        />
                                    );
                                })}
                                {eventDayCrew.length === 0 && (
                                    <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.65rem' }}>
                                        No crew on this event day yet
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    )}

                    {/* ── Locations Section (numbered slots) ── */}
                    {isEdit && (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                                <PlaceIcon sx={{ fontSize: 15, color: '#f59e0b' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
                                    Locations
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.6rem', ml: 0.5 }}>
                                    (assigned to this activity)
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                                {eventDayLocationSlots.map((slot: LocationSlotRecord) => {
                                    const assigned = assignedSlotIds.has(slot.id);
                                    return (
                                        <Chip
                                            key={slot.id}
                                            label={`Location ${slot.location_number}`}
                                            size="small"
                                            onClick={() => toggleSlot(slot.id)}
                                            sx={{
                                                cursor: 'pointer',
                                                bgcolor: assigned ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.04)',
                                                color: assigned ? '#fbbf24' : '#94a3b8',
                                                border: `1px solid ${assigned ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                                                fontWeight: assigned ? 600 : 400,
                                                fontSize: '0.7rem',
                                                transition: 'all 0.15s ease',
                                                '&:hover': {
                                                    bgcolor: assigned ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.08)',
                                                },
                                            }}
                                        />
                                    );
                                })}
                                {eventDayLocationSlots.length === 0 && (
                                    <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.65rem' }}>
                                        No location slots on this event day yet
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={!values.name.trim()}>
                    {isEdit ? 'Save' : 'Add'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddEditActivityDialog;
