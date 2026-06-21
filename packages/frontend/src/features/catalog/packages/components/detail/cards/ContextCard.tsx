'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CameraRollIcon from '@mui/icons-material/CameraRoll';
import InventoryIcon from '@mui/icons-material/Inventory';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import BadgeIcon from '@mui/icons-material/Badge';
import LocalMoviesRoundedIcon from '@mui/icons-material/LocalMoviesRounded';

import { formatCurrency } from '@/shared/utils/formatUtils';
import type { EventDay } from '@/features/workflow/scheduling/package-template';
import type { ServicePackage, ServicePackageItem } from '@/features/catalog/packages/types/service-package.types';
import type { EquipmentRecord, UnmannedEquipmentRecord, PackageCrewSlotRecord, PackageEventDaySubjectRecord, PackageLocationSlotRecord, PackageSpaceSlotRecord, EquipItem, FilmData, PackageActivityRecord } from '../../../types';
import { getContentItemKey, getFilmStats } from '../../../utils/package-helpers';
import {
    resolveMomentSubjectContext,
    type MomentActionRecord,
} from '../../../utils/moment-subject-context';


// ─── Types ───────────────────────────────────────────────────────────

interface ActivityRecord {
    id: number;
    name: string;
    description?: string | null;
    color?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    duration_minutes?: number | null;
    moments?: MomentRecord[];
}

interface MomentRecord {
    id: number;
    name: string;
    description?: string | null;
    order_index: number;
    duration_seconds: number;
    actions?: MomentActionRecord[];
    subject_actions?: Record<string, string | { action: string | null; focal: string } | null> | null;
}

interface ContextCardProps {
    activities: ActivityRecord[];
    contentItems?: ServicePackageItem[];
    films?: FilmData[];
    packageActivities?: PackageActivityRecord[];
    selectedContentItemId?: string | null;
    selectedActivityId: number | null;
    selectedMomentId: number | null;
    selectedEquipmentId?: number | null;
    selectedSubjectId?: number | null;
    selectedLocationSlotId?: number | null;
    selectedSpaceSlotId?: number | null;
    selectedCrewSlotId?: number | null;
    packageSubjects?: PackageEventDaySubjectRecord[];
    packageLocationSlots?: PackageLocationSlotRecord[];
    allEquipment?: EquipmentRecord[];
    unmannedEquipment?: UnmannedEquipmentRecord[];
    PackageCrewSlots?: PackageCrewSlotRecord[];
    formData?: Partial<ServicePackage>;
    scheduleActiveDayId?: number | null;
    packageEventDays?: EventDay[];
    currency?: string;
    packageName?: string | null;
    packageDescription?: string | null;
    readOnly?: boolean;
    onUpdateActivity?: (id: number, updates: Partial<ActivityRecord>) => Promise<void> | void;
    onUpdateMoment?: (activityId: number, momentId: number, updates: Partial<MomentRecord>) => Promise<void> | void;
    /** Fired when colour swatch is hovered/selected so the timeline can preview live */
    onColorPreview?: (activityId: number | null, color: string | null) => void;
}

// ─── Constants ───────────────────────────────────────────────────────

const ACTIVITY_COLORS = [
    '#f59e0b', '#10b981', '#648CFF', '#ec4899',
    '#a855f7', '#0ea5e9', '#ef4444', '#f97316',
    '#14b8a6', '#8b5cf6', '#06b6d4', '#d946ef',
];

// ─── Helpers ─────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function normalizeTime(t: string | null | undefined): string {
    if (!t) return '';
    const parts = t.split(':');
    if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    return t;
}

// ─── Shared inline input styles ──────────────────────────────────────

const inputSx = {
    width: '100%', border: 'none',
    borderBottom: '1px solid rgba(167,139,250,0.15)',
    bgcolor: 'transparent', color: '#e2e8f0', fontFamily: 'inherit',
    outline: 'none', px: '4px', py: '3px',
    '&::placeholder': { color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' },
    '&:focus': { borderBottomColor: 'rgba(167,139,250,0.5)' },
} as const;

const detailLabelSx = { fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' } as const;
const detailValueSx = { fontSize: '0.72rem', color: '#cbd5e1' } as const;

// ─── Component ───────────────────────────────────────────────────────

export function ContextCard({
    activities, contentItems, films, packageActivities,
    selectedContentItemId, selectedActivityId, selectedMomentId,
    selectedEquipmentId, selectedSubjectId, selectedLocationSlotId,
    selectedSpaceSlotId, selectedCrewSlotId,
    packageSubjects, packageLocationSlots,
    allEquipment, unmannedEquipment, PackageCrewSlots,
    formData, scheduleActiveDayId, packageEventDays, currency,
    packageName, packageDescription, readOnly,
    onUpdateActivity, onUpdateMoment, onColorPreview,
}: ContextCardProps) {
    const activity = activities.find((a) => a.id === selectedActivityId) ?? null;
    const moment = selectedMomentId
        ? activities.flatMap((a) => a.moments ?? []).find((m) => m.id === selectedMomentId) ?? null
        : null;
    const momentActivity = moment
        ? activities.find(a => (a.moments ?? []).some(m => m.id === moment.id)) ?? null
        : null;

    // ── Equipment lookup ─────────────────────────────────────────
    const equipItem = useMemo(() => {
        if (!selectedEquipmentId) return null;
        const dayId = scheduleActiveDayId ?? packageEventDays?.[0]?.id;

        // Source 1: formData.contents.day_equipment[dayId]
        const contents = (formData?.contents || {}) as { day_equipment?: Record<string, EquipItem[]> };
        const dayEquip: EquipItem[] = dayId ? (contents.day_equipment?.[String(dayId)] ?? []) : [];
        const fromContents = dayEquip.find(e => e.equipment_id === selectedEquipmentId);
        if (fromContents) return fromContents;

        // Source 2: relational — derive from PackageCrewSlots equipment links
        if (PackageCrewSlots) {
            for (const slot of PackageCrewSlots) {
                const eq = slot.equipment?.find(e => e.equipment_id === selectedEquipmentId);
                if (eq) {
                    const inferredType = eq.equipment?.category === 'AUDIO' ? 'AUDIO' : 'CAMERA';
                    return {
                        equipment_id: eq.equipment_id,
                        slot_type: inferredType as 'CAMERA' | 'AUDIO',
                        track_number: undefined,
                        equipment: eq.equipment ? { id: eq.equipment.id, item_name: eq.equipment.item_name, model: eq.equipment.model } : undefined,
                    };
                }
            }
        }
        return null;
    }, [selectedEquipmentId, formData, scheduleActiveDayId, packageEventDays, PackageCrewSlots]);

    const equipRecord = useMemo(() => {
        if (!selectedEquipmentId) return null;
        return allEquipment?.find(e => e.id === selectedEquipmentId) ?? null;
    }, [selectedEquipmentId, allEquipment]);

    const isUnmanned = useMemo(() => {
        if (!selectedEquipmentId) return false;
        return unmannedEquipment?.some(u => u.id === selectedEquipmentId) ?? false;
    }, [selectedEquipmentId, unmannedEquipment]);

    const equipCrewSlot = useMemo(() => {
        if (!selectedEquipmentId || !PackageCrewSlots) return null;
        return PackageCrewSlots.find(s => s.equipment?.some(e => e.equipment_id === selectedEquipmentId)) ?? null;
    }, [selectedEquipmentId, PackageCrewSlots]);

    // ── Subject lookup ───────────────────────────────────────────
    const selectedSubject = useMemo(() => {
        if (!selectedSubjectId || !packageSubjects) return null;
        return packageSubjects.find(s => s.id === selectedSubjectId) ?? null;
    }, [selectedSubjectId, packageSubjects]);

    const subjectMomentContext = useMemo(
        () => resolveMomentSubjectContext(moment, selectedSubject),
        [selectedSubject, moment],
    );

    // ── Location / Space lookup ──────────────────────────────────
    const selectedLocation = useMemo(() => {
        if (!selectedLocationSlotId || !packageLocationSlots) return null;
        return packageLocationSlots.find(l => l.id === selectedLocationSlotId) ?? null;
    }, [selectedLocationSlotId, packageLocationSlots]);

    const selectedSpace = useMemo(() => {
        if (!selectedSpaceSlotId || !packageLocationSlots) return null;
        for (const loc of packageLocationSlots) {
            const space = loc.space_slots?.find(s => s.id === selectedSpaceSlotId);
            if (space) return { space, parentLocation: loc };
        }
        return null;
    }, [selectedSpaceSlotId, packageLocationSlots]);

    // ── Crew slot lookup ─────────────────────────────────────────
    const selectedCrewSlot = useMemo(() => {
        if (!selectedCrewSlotId || !PackageCrewSlots) return null;
        return PackageCrewSlots.find(s => s.id === selectedCrewSlotId) ?? null;
    }, [selectedCrewSlotId, PackageCrewSlots]);

    const selectedContentItem = useMemo(() => {
        if (!selectedContentItemId || !contentItems?.length) return null;
        const items = contentItems;
        for (let index = 0; index < items.length; index += 1) {
            const item = items[index];
            if (getContentItemKey(item, index) === selectedContentItemId) {
                return { item, index };
            }
        }
        return null;
    }, [contentItems, selectedContentItemId]);

    const selectedContentFilm = useMemo(() => {
        if (!selectedContentItem?.item.referenceId || !films?.length) return null;
        return films.find((film) => film.id === selectedContentItem.item.referenceId) ?? null;
    }, [films, selectedContentItem]);

    const selectedContentActivity = useMemo(() => {
        const activityId = selectedContentItem?.item.config?.activity_id;
        if (!activityId || !packageActivities?.length) return null;
        return packageActivities.find((activity) => activity.id === activityId) ?? null;
    }, [packageActivities, selectedContentItem]);

    const selectedContentStats = useMemo(() => {
        if (!selectedContentItem?.item.referenceId || !films?.length) {
            return { realtime: 0, montage: 0, totalDuration: '0:00' };
        }
        return getFilmStats(films, selectedContentItem.item.referenceId);
    }, [films, selectedContentItem]);

    const selectedContentEquipCount = useMemo(() => {
        if (!selectedContentFilm?.scenes) return 0;
        return selectedContentFilm.scenes.reduce((total, scene) => {
            return total + (Array.isArray(scene.equipment) ? scene.equipment.length : 0);
        }, 0);
    }, [selectedContentFilm]);

    // ── Display priority ─────────────────────────────────────────
    const showSubject = !!selectedSubject;
    const showLocation = !showSubject && !!selectedLocation;
    const showSpace = !showSubject && !showLocation && !!selectedSpace;
    const showCrew = !showSubject && !showLocation && !showSpace && !!selectedCrewSlot;
    const showEquipment = !showSubject && !showLocation && !showSpace && !showCrew && !!selectedEquipmentId && !!equipItem;
    const showFilm = !showSubject && !showLocation && !showSpace && !showCrew && !showEquipment && !!selectedContentItem;
    const showMoment = !showSubject && !showLocation && !showSpace && !showCrew && !showEquipment && !showFilm && !!moment;
    const showActivity = !showSubject && !showLocation && !showSpace && !showCrew && !showEquipment && !showFilm && !showMoment && !!activity;
    const isEmpty = !showSubject && !showLocation && !showSpace && !showCrew && !showEquipment && !showFilm && !showMoment && !showActivity;
    const showPackage = isEmpty && (packageName || packageDescription);
    const accentColor = showSubject ? '#f59e0b' : showLocation ? '#10b981' : showSpace ? '#14b8a6' : showCrew ? '#8b5cf6' : showEquipment ? '#64748b' : showFilm ? '#a855f7' : showMoment ? '#0ea5e9' : '#a855f7';
    const editable = !readOnly && !!onUpdateActivity;

    // ── Activity field state ─────────────────────────────────────
    const [actName, setActName] = useState('');
    const [actDesc, setActDesc] = useState('');
    const [actStart, setActStart] = useState('');
    const [actEnd, setActEnd] = useState('');
    const [actColor, setActColor] = useState('');

    // Sync from selected activity
    useEffect(() => {
        if (activity) {
            setActName(activity.name ?? '');
            setActDesc(activity.description ?? '');
            setActStart(normalizeTime(activity.start_time));
            setActEnd(normalizeTime(activity.end_time));
            setActColor(activity.color ?? ACTIVITY_COLORS[0]);
        }
    }, [activity?.id, activity?.color]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Moment field state ───────────────────────────────────────
    const [momName, setMomName] = useState('');
    const [momDesc, setMomDesc] = useState('');
    const [momDuration, setMomDuration] = useState('');

    useEffect(() => {
        if (moment) {
            setMomName(moment.name ?? '');
            setMomDesc(moment.description ?? '');
            setMomDuration(String(moment.duration_seconds || 30));
        }
    }, [moment?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Debounced save helpers ───────────────────────────────────
    const actTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const momTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const saveActivity = useCallback((field: string, value: string) => {
        if (!activity || !onUpdateActivity) return;
        if (actTimerRef.current) clearTimeout(actTimerRef.current);
        actTimerRef.current = setTimeout(() => {
            onUpdateActivity(activity.id, { [field]: value || null });
        }, 400);
    }, [activity, onUpdateActivity]);

    const saveMoment = useCallback((field: string, value: string | number) => {
        if (!moment || !momentActivity || !onUpdateMoment) return;
        if (momTimerRef.current) clearTimeout(momTimerRef.current);
        momTimerRef.current = setTimeout(() => {
            onUpdateMoment(momentActivity.id, moment.id, { [field]: value });
        }, 400);
    }, [moment, momentActivity, onUpdateMoment]);

    // Cleanup timers on unmount
    useEffect(() => () => {
        if (actTimerRef.current) clearTimeout(actTimerRef.current);
        if (momTimerRef.current) clearTimeout(momTimerRef.current);
    }, []);

    return (
        <Box>
            {/* ── Header ── */}
            <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: accentColor, display: 'flex', alignItems: 'center', '& svg': { fontSize: 16 } }}>
                        {showSubject ? <PersonIcon />
                            : showLocation ? <PlaceIcon />
                            : showSpace ? <MeetingRoomIcon />
                            : showCrew ? <BadgeIcon />
                            : showEquipment
                                ? (equipItem?.slot_type === 'AUDIO' ? <MicIcon /> : <VideocamIcon />)
                                : showFilm ? <LocalMoviesRoundedIcon />
                                : showMoment ? <CameraRollIcon /> : showPackage ? <InventoryIcon /> : <AutoAwesomeIcon />}
                    </Box>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {showSubject ? 'Subject Detail' : showLocation ? 'Location Detail' : showSpace ? 'Space Detail' : showCrew ? 'Role Detail' : showEquipment ? 'Equipment Detail' : showFilm ? 'Film Detail' : showMoment ? 'Moment Detail' : showActivity ? 'Activity Detail' : showPackage ? 'Package' : 'Context'}
                    </Typography>
                </Box>
            </Box>
            <Box sx={{ px: 2.5, py: 2 }}>
                {/* ── Empty state ── */}
                {isEmpty && !showPackage && (
                    <Typography sx={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic' }}>
                        Select a film, activity, or moment to see details
                    </Typography>
                )}

                {/* ── Film detail ── */}
                {showFilm && selectedContentItem && (
                    <Stack spacing={1.5}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
                            {selectedContentItem.item.description}
                        </Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                            Click the film name in the table to open the editor.
                        </Typography>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                            <Box>
                                <Typography sx={detailLabelSx}>Duration</Typography>
                                <Typography sx={detailValueSx}>
                                    {selectedContentStats.totalDuration !== '0:00' ? selectedContentStats.totalDuration : '—'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography sx={detailLabelSx}>Scenes</Typography>
                                <Typography sx={detailValueSx}>
                                    {selectedContentFilm?.scenes?.length ?? 0}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography sx={detailLabelSx}>Equipment</Typography>
                                <Typography sx={detailValueSx}>
                                    {selectedContentEquipCount > 0 ? selectedContentEquipCount : '—'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography sx={detailLabelSx}>Activity</Typography>
                                <Typography sx={{ ...detailValueSx, color: selectedContentActivity ? '#a855f7' : detailValueSx.color }}>
                                    {selectedContentActivity?.name ?? '—'}
                                </Typography>
                            </Box>
                        </Box>

                        {(selectedContentFilm?.scenes?.length ?? 0) > 0 ? (
                            <Box>
                                <Typography sx={{ ...detailLabelSx, mb: 0.5 }}>Scene breakdown</Typography>
                                <Stack spacing={0.5}>
                                    {selectedContentFilm!.scenes!.map((scene) => (
                                        <Box
                                            key={scene.id}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 1,
                                                px: 1,
                                                py: 0.65,
                                                borderRadius: 1.5,
                                                bgcolor: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                            }}
                                        >
                                            <Typography sx={{ fontSize: '0.72rem', color: '#cbd5e1', minWidth: 0 }} noWrap>
                                                {scene.name}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace', flexShrink: 0 }}>
                                                {scene.mode === 'MONTAGE' ? 'Montage' : 'Realtime'}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        ) : null}

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {selectedContentStats.realtime > 0 ? (
                                <Chip
                                    label={`${selectedContentStats.realtime} realtime`}
                                    size="small"
                                    sx={{ height: 22, fontSize: '0.62rem', bgcolor: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: 'none' }}
                                />
                            ) : null}
                            {selectedContentStats.montage > 0 ? (
                                <Chip
                                    label={`${selectedContentStats.montage} montage`}
                                    size="small"
                                    sx={{ height: 22, fontSize: '0.62rem', bgcolor: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: 'none' }}
                                />
                            ) : null}
                            {selectedContentItem.item.config?.linked_film_id ? (
                                <Chip
                                    label="Configured"
                                    size="small"
                                    sx={{ height: 22, fontSize: '0.62rem', bgcolor: 'rgba(34,197,94,0.12)', color: '#22c55e', border: 'none' }}
                                />
                            ) : (
                                <Chip
                                    label="Template only"
                                    size="small"
                                    sx={{ height: 22, fontSize: '0.62rem', bgcolor: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'none' }}
                                />
                            )}
                        </Box>
                    </Stack>
                )}

                {/* ── Package info ── */}
                {showPackage && (
                    <Stack spacing={1}>
                        {packageName && (
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
                                {packageName}
                            </Typography>
                        )}
                        {packageDescription && (
                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.5 }}>
                                {packageDescription}
                            </Typography>
                        )}
                    </Stack>
                )}

                {/* ── Subject detail ── */}
                {showSubject && selectedSubject && (
                    <Stack spacing={2}>
                        {/* Name */}
                        <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
                                {selectedSubject.name}
                            </Typography>
                            {selectedSubject.real_name && (
                                <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', mt: 0.25 }}>
                                    {selectedSubject.real_name}
                                </Typography>
                            )}
                        </Box>

                        <Stack spacing={1.25}>
                            {/* Category */}
                            {selectedSubject.category && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={detailLabelSx}>Category</Typography>
                                    <Typography sx={detailValueSx}>{selectedSubject.category}</Typography>
                                </Box>
                            )}

                            {/* Role template */}
                            {selectedSubject.role_template && (
                                <>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={detailLabelSx}>Role</Typography>
                                        <Typography sx={detailValueSx}>{selectedSubject.role_template.role_name}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={detailLabelSx}>Type</Typography>
                                        <Chip
                                            label={selectedSubject.role_template.is_group ? 'Group' : 'Individual'}
                                            size="small"
                                            sx={{ height: 22, fontSize: '0.62rem', fontWeight: 600, bgcolor: selectedSubject.role_template.is_group ? 'rgba(251,191,36,0.10)' : 'rgba(34,197,94,0.10)', color: selectedSubject.role_template.is_group ? '#fbbf24' : '#22c55e', border: 'none' }}
                                        />
                                    </Box>
                                </>
                            )}

                            {/* Count */}
                            {selectedSubject.count != null && selectedSubject.count > 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={detailLabelSx}>Count</Typography>
                                    <Typography sx={detailValueSx}>{selectedSubject.count}</Typography>
                                </Box>
                            )}
                        </Stack>

                        {/* Member names */}
                        {selectedSubject.member_names && selectedSubject.member_names.length > 0 && (
                            <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                <Typography sx={{ ...detailLabelSx, mb: 0.75 }}>Members</Typography>
                                <Stack spacing={0.5}>
                                    {selectedSubject.member_names.map((n, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)' }}>
                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f59e0b', flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: '0.72rem', color: '#e2e8f0' }}>{n}</Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        {/* Activity assignments */}
                        {selectedSubject.activity_assignments && selectedSubject.activity_assignments.length > 0 && (
                            <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                <Typography sx={{ ...detailLabelSx, mb: 0.75 }}>Assigned Activities</Typography>
                                <Stack spacing={0.5}>
                                    {selectedSubject.activity_assignments.map(a => (
                                        <Box key={a.id} sx={{ px: 1.5, py: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)' }}>
                                            <Typography sx={{ fontSize: '0.72rem', color: '#e2e8f0' }}>
                                                {a.package_activity?.name ?? `Activity #${a.package_activity_id}`}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        {moment && (
                            <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                <Typography sx={{ ...detailLabelSx, mb: 0.75 }}>Selected Moment</Typography>
                                <Stack spacing={0.75}>
                                    <Box>
                                        <Typography sx={{ fontSize: '0.76rem', color: '#f1f5f9', fontWeight: 600 }}>
                                            {moment.name}
                                        </Typography>
                                        {moment.description && (
                                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.5, mt: 0.25 }}>
                                                {moment.description}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={detailLabelSx}>Duration</Typography>
                                        <Typography sx={detailValueSx}>{formatDuration(moment.duration_seconds)}</Typography>
                                    </Box>

                                    {subjectMomentContext?.action && subjectMomentContext.focal !== 'BACKGROUND' && (() => {
                                        const FOCAL_COLORS: Record<string, string> = { PRIMARY: '#a78bfa', SECONDARY: '#38bdf8' };
                                        const focalColor = subjectMomentContext.focal
                                            ? (FOCAL_COLORS[subjectMomentContext.focal] ?? '#94a3b8')
                                            : '#94a3b8';

                                        return (
                                            <Box sx={{ pt: 0.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography sx={detailLabelSx}>Subject Action</Typography>
                                                    {subjectMomentContext.focal && (
                                                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: focalColor }}>
                                                            {subjectMomentContext.focal.toLowerCase()}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Typography sx={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.6, fontStyle: 'italic' }}>
                                                    {subjectMomentContext.action}
                                                </Typography>
                                            </Box>
                                        );
                                    })()}
                                </Stack>
                            </Box>
                        )}
                    </Stack>
                )}

                {/* ── Location detail ── */}
                {showLocation && selectedLocation && (
                    <Stack spacing={2}>
                        {/* Name */}
                        <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
                                {selectedLocation.custom_name || selectedLocation.location?.name || `Location ${selectedLocation.location_number}`}
                            </Typography>
                            {selectedLocation.custom_name && selectedLocation.location?.name && (
                                <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', mt: 0.25 }}>
                                    {selectedLocation.location.name}
                                </Typography>
                            )}
                        </Box>

                        <Stack spacing={1.25}>
                            {/* Location # */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={detailLabelSx}>Location #</Typography>
                                <Typography sx={detailValueSx}>{selectedLocation.location_number}</Typography>
                            </Box>

                            {/* Mode */}
                            {selectedLocation.mode && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={detailLabelSx}>Mode</Typography>
                                    <Chip
                                        label={selectedLocation.mode}
                                        size="small"
                                        sx={{ height: 22, fontSize: '0.62rem', fontWeight: 600, bgcolor: 'rgba(16,185,129,0.10)', color: '#10b981', border: 'none' }}
                                    />
                                </Box>
                            )}
                        </Stack>

                        {/* Spaces */}
                        {selectedLocation.space_slots && selectedLocation.space_slots.length > 0 && (
                            <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                <Typography sx={{ ...detailLabelSx, mb: 0.75 }}>Spaces ({selectedLocation.space_slots.length})</Typography>
                                <Stack spacing={0.5}>
                                    {selectedLocation.space_slots.map(sp => (
                                        <Box key={sp.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)' }}>
                                            <MeetingRoomIcon sx={{ fontSize: 12, color: '#14b8a6' }} />
                                            <Typography sx={{ fontSize: '0.72rem', color: '#e2e8f0' }}>{sp.label}</Typography>
                                            {sp.location_space?.space_type && (
                                                <Chip label={sp.location_space.space_type} size="small" sx={{ height: 18, fontSize: '0.55rem', bgcolor: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: 'none', ml: 'auto' }} />
                                            )}
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        {/* Activity assignments */}
                        {selectedLocation.activity_assignments && selectedLocation.activity_assignments.length > 0 && (
                            <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                <Typography sx={{ ...detailLabelSx, mb: 0.75 }}>Assigned Activities</Typography>
                                <Stack spacing={0.5}>
                                    {selectedLocation.activity_assignments.map(a => {
                                        const act = activities.find(ac => ac.id === a.package_activity_id);
                                        return (
                                            <Box key={a.id} sx={{ px: 1.5, py: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)' }}>
                                                <Typography sx={{ fontSize: '0.72rem', color: '#e2e8f0' }}>
                                                    {act?.name ?? `Activity #${a.package_activity_id}`}
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        )}
                    </Stack>
                )}

                {/* ── Space detail ── */}
                {showSpace && selectedSpace && (
                    <Stack spacing={2}>
                        {/* Name */}
                        <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
                                {selectedSpace.space.label}
                            </Typography>
                            {selectedSpace.space.location_space?.name && (
                                <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', mt: 0.25 }}>
                                    {selectedSpace.space.location_space.name}
                                </Typography>
                            )}
                        </Box>

                        <Stack spacing={1.25}>
                            {/* Parent location */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={detailLabelSx}>Location</Typography>
                                <Typography sx={detailValueSx}>
                                    {selectedSpace.parentLocation.custom_name || selectedSpace.parentLocation.location?.name || `Location ${selectedSpace.parentLocation.location_number}`}
                                </Typography>
                            </Box>

                            {/* Space type */}
                            {selectedSpace.space.location_space?.space_type && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={detailLabelSx}>Space Type</Typography>
                                    <Chip
                                        label={selectedSpace.space.location_space.space_type}
                                        size="small"
                                        sx={{ height: 22, fontSize: '0.62rem', fontWeight: 600, bgcolor: 'rgba(20,184,166,0.10)', color: '#14b8a6', border: 'none' }}
                                    />
                                </Box>
                            )}

                            {/* Type tags */}
                            {selectedSpace.space.type_tags && selectedSpace.space.type_tags.length > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Typography sx={detailLabelSx}>Tags</Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        {selectedSpace.space.type_tags.map(t => (
                                            <Chip key={t.id} label={t.space_type} size="small" sx={{ height: 20, fontSize: '0.55rem', bgcolor: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: 'none' }} />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Stack>

                        {/* Preset info */}
                        {selectedSpace.space.preset && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Typography sx={detailLabelSx}>Layout</Typography>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#e2e8f0', fontWeight: 500 }}>{selectedSpace.space.preset.name}</Typography>
                                    {selectedSpace.space.preset.guest_capacity && (
                                        <Typography sx={{ fontSize: '0.62rem', color: '#64748b' }}>{selectedSpace.space.preset.guest_capacity} guests</Typography>
                                    )}
                                </Box>
                            </Box>
                        )}

                        {/* Floor plan mini-preview */}
                        {selectedSpace.space.objects && selectedSpace.space.objects.length > 0 && (
                            <Box sx={{ pt: 0.5 }}>
                                <Typography sx={{ ...detailLabelSx, mb: 0.75 }}>Floor Plan</Typography>
                                <Box sx={{
                                    borderRadius: 1.5,
                                    bgcolor: 'rgba(0,0,0,0.25)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    overflow: 'hidden',
                                    p: 1,
                                }}>
                                    <svg viewBox="0 0 1000 1000" width="100%" height="auto" style={{ display: 'block' }}>
                                        {selectedSpace.space.objects.map(obj => {
                                            const fill = obj.object_type === 'AISLE' ? 'rgba(167,139,250,0.12)'
                                                : obj.object_type === 'STAGE' || obj.object_type === 'ALTAR' ? 'rgba(245,158,11,0.18)'
                                                : obj.object_type === 'ARCH' ? 'rgba(236,72,153,0.15)'
                                                : obj.object_type === 'CHAIR_ROW' ? 'rgba(148,163,184,0.12)'
                                                : obj.object_type === 'DANCE_FLOOR' ? 'rgba(217,70,239,0.15)'
                                                : obj.object_type === 'TABLE_ROUND' || obj.object_type === 'TABLE_HEAD' || obj.object_type === 'TABLE_RECT' ? 'rgba(20,184,166,0.15)'
                                                : obj.object_type === 'BAR' || obj.object_type === 'DJ_BOOTH' ? 'rgba(249,115,22,0.15)'
                                                : obj.object_type === 'WINDOW' || obj.object_type === 'DOOR' ? 'rgba(100,140,255,0.12)'
                                                : 'rgba(255,255,255,0.06)';
                                            const stroke = obj.object_type === 'AISLE' ? 'rgba(167,139,250,0.3)'
                                                : obj.object_type === 'STAGE' || obj.object_type === 'ALTAR' ? 'rgba(245,158,11,0.35)'
                                                : obj.object_type === 'ARCH' ? 'rgba(236,72,153,0.3)'
                                                : obj.object_type === 'CHAIR_ROW' ? 'rgba(148,163,184,0.2)'
                                                : 'rgba(255,255,255,0.1)';
                                            return (
                                                <g key={obj.id} transform={obj.rotation ? `rotate(${obj.rotation} ${obj.x + obj.width / 2} ${obj.y + obj.height / 2})` : undefined}>
                                                    <rect
                                                        x={obj.x} y={obj.y}
                                                        width={obj.width} height={obj.height}
                                                        rx={obj.object_type === 'TABLE_ROUND' ? obj.width / 2 : 4}
                                                        fill={fill} stroke={stroke} strokeWidth={2}
                                                    />
                                                    {obj.width > 60 && (
                                                        <text
                                                            x={obj.x + obj.width / 2}
                                                            y={obj.y + obj.height / 2 + 4}
                                                            textAnchor="middle"
                                                            fill="rgba(255,255,255,0.35)"
                                                            fontSize={Math.min(18, obj.width / 6)}
                                                            fontFamily="Inter, sans-serif"
                                                        >{obj.label}</text>
                                                    )}
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </Box>
                            </Box>
                        )}

                        {/* Activity assignments */}
                        {selectedSpace.space.activity_assignments && selectedSpace.space.activity_assignments.length > 0 && (
                            <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                <Typography sx={{ ...detailLabelSx, mb: 0.75 }}>Assigned Activities</Typography>
                                <Stack spacing={0.5}>
                                    {selectedSpace.space.activity_assignments.map(a => {
                                        const act = activities.find(ac => ac.id === a.package_activity_id);
                                        return (
                                            <Box key={a.id} sx={{ px: 1.5, py: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)' }}>
                                                <Typography sx={{ fontSize: '0.72rem', color: '#e2e8f0' }}>
                                                    {act?.name ?? `Activity #${a.package_activity_id}`}
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        )}
                    </Stack>
                )}

                {/* ── Crew / Role detail ── */}
                {showCrew && selectedCrewSlot && (
                    <Stack spacing={2}>
                        {/* ─── TOP: Role detail ─── */}
                        <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
                                {selectedCrewSlot.job_role?.display_name || selectedCrewSlot.job_role?.name || selectedCrewSlot.label || 'Crew Role'}
                            </Typography>
                            {selectedCrewSlot.job_role?.category && (
                                <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', mt: 0.25 }}>
                                    {selectedCrewSlot.job_role.category}
                                </Typography>
                            )}
                        </Box>

                        <Stack spacing={1.25}>
                            {/* Hours */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={detailLabelSx}>Hours</Typography>
                                <Typography sx={detailValueSx}>{selectedCrewSlot.hours}h</Typography>
                            </Box>

                            {/* Event day */}
                            {selectedCrewSlot.event_day?.name && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={detailLabelSx}>Day</Typography>
                                    <Typography sx={detailValueSx}>{selectedCrewSlot.event_day.name}</Typography>
                                </Box>
                            )}

                            {/* Equipment links */}
                            {selectedCrewSlot.equipment && selectedCrewSlot.equipment.length > 0 && (
                                <Box>
                                    <Typography sx={{ ...detailLabelSx, mb: 0.5 }}>Equipment</Typography>
                                    <Stack spacing={0.5}>
                                        {selectedCrewSlot.equipment.map(eq => (
                                            <Box key={eq.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)' }}>
                                                <VideocamIcon sx={{ fontSize: 12, color: '#64748b' }} />
                                                <Typography sx={{ fontSize: '0.72rem', color: '#e2e8f0' }}>
                                                    {eq.equipment?.item_name ?? `Equipment #${eq.equipment_id}`}
                                                </Typography>
                                                {eq.is_primary && (
                                                    <Chip label="Primary" size="small" sx={{ height: 18, fontSize: '0.55rem', bgcolor: 'rgba(59,130,246,0.10)', color: '#3b82f6', border: 'none', ml: 'auto' }} />
                                                )}
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {/* Activity assignments */}
                            {selectedCrewSlot.activity_assignments && selectedCrewSlot.activity_assignments.length > 0 && (
                                <Box>
                                    <Typography sx={{ ...detailLabelSx, mb: 0.5 }}>Activities</Typography>
                                    <Stack spacing={0.5}>
                                        {selectedCrewSlot.activity_assignments.map(a => (
                                            <Box key={a.id} sx={{ px: 1.5, py: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)' }}>
                                                <Typography sx={{ fontSize: '0.72rem', color: '#e2e8f0' }}>
                                                    {a.package_activity?.name ?? `Activity #${a.package_activity_id}`}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Stack>

                        {/* ─── BOTTOM: Crew member detail ─── */}
                        {selectedCrewSlot.crew ? (
                            <Box sx={{ pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
                                    Crew Member
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
                                    <Box sx={{
                                        width: 32, height: 32, borderRadius: '50%',
                                        bgcolor: selectedCrewSlot.crew.crew_color ? `${selectedCrewSlot.crew.crew_color}25` : 'rgba(139,92,246,0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: selectedCrewSlot.crew.crew_color || '#8b5cf6' }}>
                                            {(selectedCrewSlot.crew.contact.first_name || selectedCrewSlot.crew.contact.email || '?').charAt(0).toUpperCase()}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: '0.8rem', color: '#f1f5f9', fontWeight: 600 }}>
                                            {[selectedCrewSlot.crew.contact.first_name, selectedCrewSlot.crew.contact.last_name].filter(Boolean).join(' ') || selectedCrewSlot.crew.contact.email}
                                        </Typography>
                                        {selectedCrewSlot.crew.contact.email && (
                                            <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                                                {selectedCrewSlot.crew.contact.email}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>

                                <Stack spacing={1}>
                                    {/* Crew color */}
                                    {selectedCrewSlot.crew.crew_color && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography sx={detailLabelSx}>Crew Colour</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: selectedCrewSlot.crew.crew_color }} />
                                                <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'monospace' }}>{selectedCrewSlot.crew.crew_color}</Typography>
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Job role assignments on this crew member */}
                                    {selectedCrewSlot.crew.job_role_assignments && selectedCrewSlot.crew.job_role_assignments.length > 0 && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography sx={detailLabelSx}>Roles</Typography>
                                            <Typography sx={detailValueSx}>
                                                {selectedCrewSlot.crew.job_role_assignments.map(jra => jra.job_role?.display_name || jra.job_role?.name || 'Unknown').join(', ')}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </Box>
                        ) : (
                            <Box sx={{ pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <Typography sx={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic' }}>
                                    No crew member assigned
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                )}

                {/* ── Equipment detail ── */}
                {showEquipment && equipItem && (
                    <Stack spacing={2}>
                        {/* Name */}
                        <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
                                {equipRecord?.item_name ?? equipItem.equipment?.item_name ?? 'Unknown'}
                            </Typography>
                            {(equipRecord?.model || equipItem.equipment?.model) && (
                                <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', mt: 0.25 }}>
                                    {equipRecord?.model ?? equipItem.equipment?.model}
                                </Typography>
                            )}
                        </Box>

                        {/* Info rows */}
                        <Stack spacing={1.25}>
                            {/* Category */}
                            {equipRecord?.category && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Category</Typography>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#cbd5e1' }}>{equipRecord.category}</Typography>
                                </Box>
                            )}

                            {/* Track */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Track</Typography>
                                <Chip
                                    label={`${equipItem.slot_type === 'AUDIO' ? 'A' : 'V'}${equipItem.track_number ?? '?'}`}
                                    size="small"
                                    sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: 'none' }}
                                />
                            </Box>

                            {/* Manned / Unmanned */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Status</Typography>
                                <Chip
                                    label={isUnmanned ? 'Unmanned' : 'Manned'}
                                    size="small"
                                    sx={{ height: 22, fontSize: '0.62rem', fontWeight: 600, bgcolor: isUnmanned ? 'rgba(251,191,36,0.10)' : 'rgba(34,197,94,0.10)', color: isUnmanned ? '#fbbf24' : '#22c55e', border: 'none' }}
                                />
                            </Box>

                            {/* Day rate */}
                            {equipRecord?.rental_price_per_day != null && Number(equipRecord.rental_price_per_day) > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Day Rate</Typography>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 600 }}>
                                        {formatCurrency(Number(equipRecord.rental_price_per_day), currency || 'GBP')}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>

                        {/* Crew assignment */}
                        {equipCrewSlot && !isUnmanned && (
                            <Box sx={{ mt: 0.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', mb: 0.75 }}>
                                    Assigned Crew
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)' }}>
                                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#a78bfa' }}>
                                            {(equipCrewSlot.job_role?.display_name || equipCrewSlot.job_role?.name || equipCrewSlot.label || '?').charAt(0).toUpperCase()}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: '0.72rem', color: '#e2e8f0', fontWeight: 500 }}>
                                            {equipCrewSlot.job_role?.display_name || equipCrewSlot.job_role?.name || equipCrewSlot.label || 'Operator'}
                                        </Typography>
                                        {equipCrewSlot.crew?.contact && (
                                            <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                                                {[equipCrewSlot.crew.contact.first_name, equipCrewSlot.crew.contact.last_name].filter(Boolean).join(' ') || equipCrewSlot.crew.contact.email}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Stack>
                )}

                {/* ── Activity detail (editable) ── */}
                {showActivity && activity && (
                    <Stack spacing={1.5}>
                        {/* Name */}
                        {editable ? (
                            <Box component="input" type="text" value={actName}
                                placeholder="Activity name"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setActName(e.target.value); saveActivity('name', e.target.value); }}
                                sx={{ ...inputSx, fontSize: '0.85rem', fontWeight: 600 }}
                            />
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: activity.color || '#a855f7', flexShrink: 0 }} />
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>{activity.name}</Typography>
                            </Box>
                        )}

                        {/* Description */}
                        {editable ? (
                            <Box component="textarea" rows={2} value={actDesc}
                                placeholder="Description (optional)"
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setActDesc(e.target.value); saveActivity('description', e.target.value); }}
                                sx={{ ...inputSx, fontSize: '0.72rem', resize: 'vertical', minHeight: 36, lineHeight: 1.5, color: '#94a3b8' }}
                            />
                        ) : activity.description ? (
                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.5 }}>{activity.description}</Typography>
                        ) : null}

                        {/* Times */}
                        {editable && (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 600, mb: 0.25 }}>START</Typography>
                                    <Box component="input" type="time" value={actStart}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setActStart(e.target.value); saveActivity('start_time', e.target.value); }}
                                        sx={{
                                            ...inputSx, fontSize: '0.72rem', color: '#e2e8f0',
                                            '&::-webkit-calendar-picker-indicator': { filter: 'invert(0.7)' },
                                        }}
                                    />
                                </Box>
                                <Typography sx={{ fontSize: '0.65rem', color: '#475569', mt: 1.5 }}>–</Typography>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 600, mb: 0.25 }}>END</Typography>
                                    <Box component="input" type="time" value={actEnd}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setActEnd(e.target.value); saveActivity('end_time', e.target.value); }}
                                        sx={{
                                            ...inputSx, fontSize: '0.72rem', color: '#e2e8f0',
                                            '&::-webkit-calendar-picker-indicator': { filter: 'invert(0.7)' },
                                        }}
                                    />
                                </Box>
                            </Box>
                        )}

                        {/* Color picker */}
                        {editable && (
                            <Box>
                                <Typography sx={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 600, mb: 0.5 }}>COLOUR</Typography>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                    {ACTIVITY_COLORS.map(c => (
                                        <Box
                                            key={c}
                                            onClick={() => {
                                                setActColor(c);
                                                onUpdateActivity?.(activity.id, { color: c });
                                                onColorPreview?.(null, null);
                                            }}
                                            onMouseEnter={() => onColorPreview?.(activity.id, c)}
                                            onMouseLeave={() => onColorPreview?.(null, null)}
                                            sx={{
                                                width: 18, height: 18, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                                                border: actColor === c ? '2px solid #fff' : '2px solid transparent',
                                                transition: 'border 0.15s, transform 0.15s',
                                                '&:hover': { transform: 'scale(1.2)' },
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Info chips (read-only mode) */}
                        {!editable && (
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                {(activity.duration_minutes ?? 0) > 0 && (
                                    <Chip icon={<AccessTimeIcon sx={{ fontSize: '12px !important' }} />} label={`${activity.duration_minutes}m`} size="small"
                                        sx={{ height: 22, fontSize: '0.62rem', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: 'none' }} />
                                )}
                                {(activity.moments?.length ?? 0) > 0 && (
                                    <Chip icon={<CameraRollIcon sx={{ fontSize: '12px !important' }} />}
                                        label={`${activity.moments!.length} moment${activity.moments!.length !== 1 ? 's' : ''}`} size="small"
                                        sx={{ height: 22, fontSize: '0.62rem', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: 'none' }} />
                                )}
                            </Box>
                        )}
                    </Stack>
                )}

                {/* ── Moment detail (editable) ── */}
                {showMoment && moment && (
                    <Stack spacing={1.5}>
                        {/* Name */}
                        {editable ? (
                            <Box component="input" type="text" value={momName}
                                placeholder="Moment name"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setMomName(e.target.value); saveMoment('name', e.target.value); }}
                                sx={{ ...inputSx, fontSize: '0.85rem', fontWeight: 600 }}
                            />
                        ) : (
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>{moment.name}</Typography>
                        )}

                        {/* Description */}
                        {editable ? (
                            <Box component="textarea" rows={2} value={momDesc}
                                placeholder="Description (optional)"
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setMomDesc(e.target.value); saveMoment('description', e.target.value); }}
                                sx={{ ...inputSx, fontSize: '0.72rem', resize: 'vertical', minHeight: 36, lineHeight: 1.5, color: '#94a3b8' }}
                            />
                        ) : moment.description ? (
                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.5 }}>{moment.description}</Typography>
                        ) : null}

                        {/* Duration */}
                        {editable ? (
                            <Box>
                                <Typography sx={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 600, mb: 0.25 }}>DURATION (seconds)</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box component="input" type="number" min="1" value={momDuration}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            setMomDuration(e.target.value);
                                            const v = parseInt(e.target.value, 10);
                                            if (v > 0) saveMoment('duration_seconds', v);
                                        }}
                                        sx={{ ...inputSx, fontSize: '0.72rem', width: 70 }}
                                    />
                                    <Typography sx={{ fontSize: '0.62rem', color: '#64748b' }}>
                                        = {formatDuration(parseInt(momDuration, 10) || 0)}
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            <Chip icon={<AccessTimeIcon sx={{ fontSize: '12px !important' }} />}
                                label={formatDuration(moment.duration_seconds)} size="small"
                                sx={{ height: 22, fontSize: '0.62rem', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: 'none', alignSelf: 'flex-start' }} />
                        )}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}
