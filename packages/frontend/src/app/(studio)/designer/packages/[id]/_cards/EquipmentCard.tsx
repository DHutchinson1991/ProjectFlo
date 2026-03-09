'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Button, IconButton, Menu, MenuItem,
    Chip, Stack, Tooltip, SxProps, Theme,
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Link from 'next/link';

import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils/formatUtils';
import { ServicePackage, ServicePackageItem } from '@/lib/types/domains/sales';
import type { EventDayTemplate } from '@/components/schedule';
import { useOptionalScheduleApi } from '@/components/schedule/ScheduleApiContext';

import type {
    PackageDayOperatorRecord,
    PackageActivityRecord,
    EquipmentRecord,
    UnmannedEquipmentRecord,
    EquipItem,
} from '../_lib/types';

// ─── Local equipment contents shape ─────────────────────────────────
type EquipmentContentsShape = {
    items?: ServicePackageItem[];
    day_equipment?: Record<string, EquipItem[]>;
    activity_equipment?: Record<string, EquipItem[]>;
};

// ─── Props ──────────────────────────────────────────────────────────
export interface EquipmentCardProps {
    packageId: number | null;
    safeBrandId: number | undefined;
    formData: Partial<ServicePackage>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<ServicePackage>>>;
    packageDayOperators: PackageDayOperatorRecord[];
    setPackageDayOperators: React.Dispatch<React.SetStateAction<PackageDayOperatorRecord[]>>;
    packageEventDays: EventDayTemplate[];
    packageActivities: PackageActivityRecord[];
    scheduleActiveDayId: number | null;
    selectedActivityId: number | null;
    allEquipment: EquipmentRecord[];
    unmannedEquipment: UnmannedEquipmentRecord[];
    setUnmannedEquipment: React.Dispatch<React.SetStateAction<UnmannedEquipmentRecord[]>>;
    currency: string;
    cardSx: SxProps<Theme>;
}

// ─── Component ──────────────────────────────────────────────────────
export function EquipmentCard({
    packageId,
    safeBrandId,
    formData,
    setFormData,
    packageDayOperators,
    setPackageDayOperators,
    packageEventDays,
    packageActivities,
    scheduleActiveDayId,
    selectedActivityId,
    allEquipment,
    unmannedEquipment,
    setUnmannedEquipment,
    currency,
    cardSx,
}: EquipmentCardProps) {
    // ── Internalized UI state ──
    const [equipAssignAnchor, setEquipAssignAnchor] = useState<null | HTMLElement>(null);
    const [equipAssignTarget, setEquipAssignTarget] = useState<{ equipmentId: number; currentOpId?: number } | null>(null);
    const [addEquipAnchor, setAddEquipAnchor] = useState<null | HTMLElement>(null);
    const [addEquipType, setAddEquipType] = useState<'CAMERA' | 'AUDIO'>('CAMERA');
    const [trackPickerAnchor, setTrackPickerAnchor] = useState<null | HTMLElement>(null);
    const [trackPickerTarget, setTrackPickerTarget] = useState<{ equipmentId: number; slotType: 'CAMERA' | 'AUDIO' } | null>(null);

    // ── ScheduleApi adapter (context if available, else direct package API) ──
    const contextApi = useOptionalScheduleApi();
    const operatorEquipApi = {
        setEquipment: contextApi?.operators?.setEquipment
            ?? ((opId: number, equip: { equipment_id: number; is_primary: boolean }[]) =>
                api.operators.packageDay.setEquipment(opId, equip)),
        refreshAll: contextApi?.operators?.refreshAll
            ?? (packageId
                ? () => api.operators.packageDay.getAll(packageId)
                : () => Promise.resolve([])),
    };

    // ── Hierarchical equipment: Event Day (base) → Activity (override) ──
    const equipmentContents = ((formData.contents || {}) as EquipmentContentsShape);
    const dayEquipmentMap: Record<string, EquipItem[]> = equipmentContents.day_equipment || {};
    const activityEquipmentOverrides: Record<string, EquipItem[]> = equipmentContents.activity_equipment || {};

    const activeDayId: number | null = scheduleActiveDayId ?? packageEventDays[0]?.id ?? null;
    const activePackageDay = activeDayId
        ? packageEventDays.find((d: EventDayTemplate) => d.id === activeDayId)
        : packageEventDays[0];
    const activeDayTemplateId = (activePackageDay as any)?.event_day_template_id || (activePackageDay as any)?.event_day?.id || null;

    const dayEquipment: EquipItem[] = activeDayId ? (dayEquipmentMap[String(activeDayId)] || []) : [];

    // Fallback: derive equipment from relational operator-equipment links
    const dayOpsForEquip = activeDayTemplateId
        ? packageDayOperators.filter(o => o.event_day_template_id === activeDayTemplateId)
        : packageDayOperators;

    const relationalEquipment: EquipItem[] = dayOpsForEquip.flatMap((op) =>
        (op.equipment || []).map((eq) => {
            const inferredType = eq.equipment?.category === 'AUDIO' ? 'AUDIO' : 'CAMERA';
            const parsedTrack = Number.parseInt(op.position_name.match(/\d+/)?.[0] || '', 10);
            return {
                equipment_id: eq.equipment_id,
                slot_type: inferredType as 'CAMERA' | 'AUDIO',
                track_number: Number.isNaN(parsedTrack) ? undefined : parsedTrack,
                equipment: eq.equipment
                    ? { id: eq.equipment.id, item_name: eq.equipment.item_name, model: eq.equipment.model }
                    : undefined,
            };
        }),
    );

    const mergedDayEquipmentMap = new Map<number, EquipItem>();
    dayEquipment.forEach((item) => mergedDayEquipmentMap.set(item.equipment_id, item));
    relationalEquipment.forEach((item) => {
        if (!mergedDayEquipmentMap.has(item.equipment_id)) {
            mergedDayEquipmentMap.set(item.equipment_id, item);
        }
    });
    const mergedDayEquipment = Array.from(mergedDayEquipmentMap.values());

    // Determine which level is active
    let equipmentItems: EquipItem[];
    let activeLevel: 'day' | 'activity' = 'day';
    let hasOverride = false;

    if (selectedActivityId && activityEquipmentOverrides[String(selectedActivityId)]) {
        equipmentItems = activityEquipmentOverrides[String(selectedActivityId)];
        activeLevel = 'activity';
        hasOverride = true;
    } else {
        equipmentItems = mergedDayEquipment;
        activeLevel = 'day';
    }

    const cameraItems = equipmentItems.filter(e => e.slot_type === 'CAMERA').sort((a, b) => (a.track_number || 999) - (b.track_number || 999));
    const audioItems = equipmentItems.filter(e => e.slot_type === 'AUDIO').sort((a, b) => (a.track_number || 999) - (b.track_number || 999));

    // ── Save helpers ──
    const saveEquipmentAtLevel = (newItems: EquipItem[]) => {
        const contents: EquipmentContentsShape = { ...equipmentContents, items: equipmentContents.items || [] };
        if (selectedActivityId) {
            contents.activity_equipment = { ...activityEquipmentOverrides, [String(selectedActivityId)]: newItems };
        } else if (activeDayId) {
            contents.day_equipment = { ...dayEquipmentMap, [String(activeDayId)]: newItems };
        }
        setFormData({ ...formData, contents } as Partial<ServicePackage>);
    };

    const addEquipmentItem = (equipId: number, slotType: 'CAMERA' | 'AUDIO') => {
        const eq = allEquipment.find((e) => e.id === equipId);
        if (!eq) return;
        const already = equipmentItems.some(e => e.equipment_id === equipId);
        if (already) return;
        const usedTracks = equipmentItems.filter(e => e.slot_type === slotType).map(e => e.track_number || 0);
        let nextTrack = 1;
        while (usedTracks.includes(nextTrack)) nextTrack++;
        saveEquipmentAtLevel([...equipmentItems, { equipment_id: equipId, slot_type: slotType, track_number: nextTrack, equipment: { id: eq.id, item_name: eq.item_name, model: eq.model } }]);
    };

    const changeTrackNumber = (equipmentId: number, slotType: 'CAMERA' | 'AUDIO', newTrack: number) => {
        const updated = equipmentItems.map(item => {
            if (item.equipment_id === equipmentId) return { ...item, track_number: newTrack };
            if (item.slot_type === slotType && item.track_number === newTrack) return { ...item, track_number: undefined };
            return item;
        });
        saveEquipmentAtLevel(updated);
    };

    const removeEquipmentItem = (equipId: number) => {
        saveEquipmentAtLevel(equipmentItems.filter(e => e.equipment_id !== equipId));
    };

    const resetOverride = () => {
        if (!hasOverride || !selectedActivityId) return;
        const contents: EquipmentContentsShape = { ...equipmentContents, items: equipmentContents.items || [] };
        const updated = { ...activityEquipmentOverrides };
        delete updated[String(selectedActivityId)];
        contents.activity_equipment = updated;
        setFormData({ ...formData, contents } as Partial<ServicePackage>);
    };

    const levelLabel = activeLevel === 'activity' ? 'Activity Override' : 'Event Day';
    const levelColor = activeLevel === 'activity' ? '#a855f7' : '#f59e0b';

    // Build equipment → operator map
    const equipToOperator = new Map<number, PackageDayOperatorRecord>();
    dayOpsForEquip.forEach(op => {
        (op.equipment || []).forEach(eq => {
            equipToOperator.set(eq.equipment_id, op);
        });
    });

    const getOperatorForEquipment = (equipmentId: number | undefined) => {
        if (!equipmentId) return null;
        return equipToOperator.get(equipmentId) || null;
    };

    // ── Operator assignment helpers ──
    const handleAssignOperator = async (operatorDayId: number, equipmentId: number) => {
        const targetOp = dayOpsForEquip.find(o => o.id === operatorDayId);
        if (!targetOp) return;
        const currentOwner = equipToOperator.get(equipmentId);
        if (currentOwner && currentOwner.id !== operatorDayId) {
            const updatedEquip = (currentOwner.equipment || [])
                .filter(e => e.equipment_id !== equipmentId)
                .map(e => ({ equipment_id: e.equipment_id, is_primary: e.is_primary }));
            try { await operatorEquipApi.setEquipment(currentOwner.id, updatedEquip); } catch {}
        }
        const existsAlready = (targetOp.equipment || []).some(e => e.equipment_id === equipmentId);
        const newEquip = existsAlready
            ? (targetOp.equipment || []).map(e => ({ equipment_id: e.equipment_id, is_primary: e.is_primary }))
            : [...(targetOp.equipment || []).map(e => ({ equipment_id: e.equipment_id, is_primary: e.is_primary })), { equipment_id: equipmentId, is_primary: true }];
        try {
            await operatorEquipApi.setEquipment(operatorDayId, newEquip);
            const dayOps = await operatorEquipApi.refreshAll();
            setPackageDayOperators(dayOps || []);
        } catch (err) { console.warn('Failed to assign operator:', err); }
    };

    const handleUnassignOperator = async (operatorDayId: number, equipmentId: number) => {
        const targetOp = dayOpsForEquip.find(o => o.id === operatorDayId);
        if (!targetOp) return;
        const updatedEquip = (targetOp.equipment || [])
            .filter(e => e.equipment_id !== equipmentId)
            .map(e => ({ equipment_id: e.equipment_id, is_primary: e.is_primary }));
        try {
            await operatorEquipApi.setEquipment(operatorDayId, updatedEquip);
            const dayOps = await operatorEquipApi.refreshAll();
            setPackageDayOperators(dayOps || []);
        } catch (err) { console.warn('Failed to unassign operator:', err); }
    };

    const handleToggleUnmanned = async (equipmentId: number) => {
        try {
            const isCurrentlyUnmanned = unmannedEquipment.some(eq => eq.id === equipmentId);
            await api.equipment.setUnmannedStatus(equipmentId, !isCurrentlyUnmanned);
            if (safeBrandId) {
                const unmannedList = await api.equipment.findUnmanned(safeBrandId);
                setUnmannedEquipment(unmannedList || []);
            }
            const dayOps = await operatorEquipApi.refreshAll();
            setPackageDayOperators(dayOps || []);
        } catch (err) {
            console.error('❌ Failed to toggle unmanned status:', err);
        }
    };

    // ── Render a single equipment row ──
    const renderEquipRow = (item: EquipItem, type: 'CAMERA' | 'AUDIO', _fallbackIndex: number) => {
        const isCamera = type === 'CAMERA';
        const accentColor = isCamera ? '#648CFF' : '#10b981';
        const hoverBg = isCamera ? 'rgba(100, 140, 255, 0.06)' : 'rgba(16, 185, 129, 0.06)';
        const trackNum = item.track_number;
        const trackLabel = trackNum ? (isCamera ? `Camera ${trackNum}` : `Audio ${trackNum}`) : (isCamera ? `Cam` : `Aud`);
        const op = getOperatorForEquipment(item.equipment_id);
        const opColor = op?.position_color || op?.contributor?.crew_color || '#EC4899';

        let tierName: string | null = null;
        if (op?.contributor && op?.job_role) {
            const jobRoleMatch = op.contributor.contributor_job_roles?.find(
                (cjr) => cjr.job_role_id === op.job_role_id
            );
            tierName = jobRoleMatch?.payment_bracket?.name || null;
        }

        const opLabel = op?.job_role
            ? `${op.job_role.display_name || op.job_role.name}${tierName ? ` - ${tierName}` : ''}`
            : (op?.position_name || '');
        const opName = op?.contributor
            ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim()
            : '';
        const opInitials = (opName || opLabel) ? (opName || opLabel).split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : '';

        const isEquipUnmanned = isCamera && unmannedEquipment.some(eq => eq.id === item.equipment_id);

        const isEquipAssigned = (() => {
            if (!selectedActivityId) return true;
            if (!op) return true;
            if (op.activity_assignments && op.activity_assignments.length > 0) {
                return op.activity_assignments.some(a => a.package_activity_id === selectedActivityId);
            }
            if (op.package_activity_id) return op.package_activity_id === selectedActivityId;
            return true;
        })();

        return (
            <Box
                key={item.equipment_id}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    py: 0.75, px: 1.5, mx: -1.5, borderRadius: 1.5,
                    opacity: isEquipAssigned ? 1 : 0.3,
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: hoverBg, '& .equip-del': { opacity: 1 } },
                }}
            >
                {/* Delete button */}
                <IconButton
                    className="equip-del"
                    size="small"
                    onClick={() => removeEquipmentItem(item.equipment_id)}
                    sx={{ p: 0, opacity: 0, transition: 'opacity 0.15s', color: 'rgba(255,255,255,0.25)', '&:hover': { color: '#ef4444' } }}
                >
                    <DeleteIcon sx={{ fontSize: 13 }} />
                </IconButton>
                {/* Track label */}
                <Box
                    onClick={(e) => {
                        setTrackPickerAnchor(e.currentTarget as HTMLElement);
                        setTrackPickerTarget({ equipmentId: item.equipment_id, slotType: type });
                    }}
                    sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44, flexShrink: 0,
                        cursor: 'pointer', borderRadius: 1, py: 0.25, px: 0.25,
                        transition: 'all 0.15s ease', '&:hover': { bgcolor: `${accentColor}12` },
                    }}
                >
                    <Typography sx={{ fontSize: '0.45rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1 }}>Track</Typography>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: trackNum ? accentColor : '#475569', lineHeight: 1.3 }}>{trackLabel}</Typography>
                </Box>
                <Box sx={{
                    width: 26, height: 26, borderRadius: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: `${accentColor}18`, border: `1px solid ${accentColor}35`, flexShrink: 0,
                }}>
                    {isCamera
                        ? <VideocamIcon sx={{ fontSize: 13, color: accentColor }} />
                        : <MicIcon sx={{ fontSize: 13, color: accentColor }} />
                    }
                </Box>
                {/* Equipment name */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{
                        fontWeight: 600, fontSize: '0.73rem', color: '#f1f5f9',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {item.equipment?.item_name || `${isCamera ? 'Camera' : 'Audio'}`}
                    </Typography>
                    {item.equipment?.model && (
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.6rem', display: 'block', mt: -0.25 }}>
                            {item.equipment.model}
                        </Typography>
                    )}
                </Box>
                {/* Day rate cost column */}
                {(() => {
                    const fullEq = allEquipment.find((e) => e.id === item.equipment_id);
                    const dayRate = fullEq?.rental_price_per_day ? Number(fullEq.rental_price_per_day) : 0;
                    return (
                        <Typography variant="caption" sx={{
                            color: dayRate > 0 ? '#f59e0b' : '#475569',
                            fontWeight: 600, fontSize: '0.65rem', minWidth: 56,
                            textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums',
                        }}>
                            {dayRate > 0 ? formatCurrency(dayRate, currency) : '—'}
                        </Typography>
                    );
                })()}
                {/* Operator column */}
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                    {/* UM toggle */}
                    {isCamera && (
                        <Tooltip title={isEquipUnmanned ? 'Camera is unmanned (static) — click to remove' : 'Mark this camera as unmanned (static)'} arrow placement="top">
                            <Box
                                onClick={(e) => { e.stopPropagation(); handleToggleUnmanned(item.equipment_id); }}
                                sx={{
                                    width: 20, height: 20, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', flexShrink: 0,
                                    border: isEquipUnmanned ? '2px solid #94a3b8' : '2px dashed rgba(100,116,139,0.35)',
                                    bgcolor: isEquipUnmanned ? 'rgba(148,163,184,0.18)' : 'transparent',
                                    transition: 'all 0.15s',
                                    '&:hover': { bgcolor: isEquipUnmanned ? 'rgba(148,163,184,0.28)' : 'rgba(148,163,184,0.08)', borderColor: '#94a3b8' },
                                }}
                            >
                                <Typography sx={{ fontSize: '0.4rem', fontWeight: 800, color: isEquipUnmanned ? '#94a3b8' : 'rgba(100,116,139,0.5)', lineHeight: 1, userSelect: 'none' }}>
                                    UM
                                </Typography>
                            </Box>
                        </Tooltip>
                    )}
                    {/* Operator chip or assign button */}
                    {op ? (
                        <Tooltip title={`${opLabel}${op.contributor ? ` · ${`${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim()}` : ''}${isEquipUnmanned ? ' (Unmanned)' : ''} — Click to change`} arrow placement="top">
                            <Box
                                onClick={(e) => {
                                    setEquipAssignAnchor(e.currentTarget);
                                    setEquipAssignTarget({ equipmentId: item.equipment_id, currentOpId: op.id });
                                }}
                                sx={{
                                    display: 'flex', alignItems: 'center', gap: 0.5,
                                    height: 24, pl: 0.25, pr: 1, borderRadius: 3,
                                    bgcolor: isEquipUnmanned ? 'rgba(148,163,184,0.08)' : `${opColor}12`,
                                    border: `1px solid ${isEquipUnmanned ? 'rgba(148,163,184,0.30)' : `${opColor}30`}`,
                                    cursor: 'pointer', opacity: isEquipUnmanned ? 0.7 : 1,
                                    transition: 'all 0.15s ease', maxWidth: 120, flexShrink: 0,
                                    '&:hover': { bgcolor: isEquipUnmanned ? 'rgba(148,163,184,0.18)' : `${opColor}22`, borderColor: isEquipUnmanned ? 'rgba(148,163,184,0.50)' : `${opColor}50` },
                                }}
                            >
                                <Box sx={{
                                    width: 18, height: 18, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    bgcolor: isEquipUnmanned ? 'rgba(148,163,184,0.30)' : `${opColor}30`, flexShrink: 0,
                                }}>
                                    <Typography sx={{ fontSize: '0.5rem', fontWeight: 800, color: isEquipUnmanned ? '#94a3b8' : opColor, lineHeight: 1 }}>
                                        {opInitials}
                                    </Typography>
                                </Box>
                                <Typography sx={{
                                    fontSize: '0.6rem', fontWeight: 700, color: isEquipUnmanned ? '#94a3b8' : opColor,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1,
                                }}>
                                    {opName || opLabel || 'Crew'}
                                </Typography>
                            </Box>
                        </Tooltip>
                    ) : (
                        <Box
                            onClick={(e) => {
                                setEquipAssignAnchor(e.currentTarget);
                                setEquipAssignTarget({ equipmentId: item.equipment_id });
                            }}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 0.5,
                                height: 22, px: 0.75, borderRadius: 2,
                                border: '1px dashed rgba(100, 116, 139, 0.3)',
                                cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s ease',
                                '&:hover': { borderColor: 'rgba(100, 116, 139, 0.6)', bgcolor: 'rgba(255,255,255,0.03)' },
                            }}
                        >
                            <AddIcon sx={{ fontSize: 10, color: '#475569' }} />
                            <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.55rem', fontWeight: 600 }}>
                                Assign Operator
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </Box>
        );
    };

    const activeDay = packageEventDays.find(d => d.id === (scheduleActiveDayId || packageEventDays[0]?.id));
    const selectedActivity = selectedActivityId ? packageActivities.find(a => a.id === selectedActivityId) : null;

    return (
        <Box sx={{ ...(cardSx as object), overflow: 'hidden' }}>
            {/* Card Header */}
            <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid rgba(52, 58, 68, 0.25)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <BuildIcon sx={{ fontSize: 14, color: '#10b981' }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Equipment</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: -0.25 }}>
                                {selectedActivity ? (
                                    <Typography sx={{ fontSize: '0.55rem', color: '#a855f7', fontWeight: 600 }}>{selectedActivity.name}</Typography>
                                ) : activeDay && packageEventDays.length > 1 ? (
                                    <Typography sx={{ fontSize: '0.55rem', color: '#f59e0b', fontWeight: 600 }}>{activeDay.name}</Typography>
                                ) : null}
                                <Chip
                                    label={levelLabel}
                                    size="small"
                                    sx={{
                                        height: 14, fontSize: '0.45rem', fontWeight: 700,
                                        bgcolor: `${levelColor}15`, color: levelColor,
                                        border: `1px solid ${levelColor}30`, '& .MuiChip-label': { px: 0.5 },
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                    {(cameraItems.length > 0 || audioItems.length > 0) && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {cameraItems.length > 0 && (
                                <Chip
                                    icon={<VideocamIcon sx={{ fontSize: '11px !important' }} />}
                                    label={`${cameraItems.length}`}
                                    size="small"
                                    sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(100, 140, 255, 0.1)', color: '#648CFF', border: '1px solid rgba(100, 140, 255, 0.2)', '& .MuiChip-icon': { color: '#648CFF' }, '& .MuiChip-label': { px: 0.4 } }}
                                />
                            )}
                            {audioItems.length > 0 && (
                                <Chip
                                    icon={<MicIcon sx={{ fontSize: '11px !important' }} />}
                                    label={`${audioItems.length}`}
                                    size="small"
                                    sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', '& .MuiChip-icon': { color: '#10b981' }, '& .MuiChip-label': { px: 0.4 } }}
                                />
                            )}
                        </Box>
                    )}
                </Box>

                {/* Override controls bar */}
                {hasOverride && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Button
                            size="small"
                            onClick={resetOverride}
                            sx={{
                                fontSize: '0.5rem', textTransform: 'none', fontWeight: 600, py: 0.15, px: 0.75,
                                color: '#ef4444', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.06)' },
                            }}
                        >
                            Reset to Event Day
                        </Button>
                    </Box>
                )}
            </Box>

            {/* ── Equipment Section ── */}
            <Box sx={{ px: 2.5, pt: 1.5, pb: 1 }}>
                {/* Section label + column header row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.5rem' }}>
                            Equipment
                        </Typography>
                    </Box>
                    <Box sx={{ width: 120, textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.5rem' }}>
                            Operator
                        </Typography>
                    </Box>
                </Box>

                {/* Camera rows */}
                {cameraItems.length > 0 && (
                    <Box sx={{ mb: audioItems.length > 0 ? 1.5 : 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#648CFF' }} />
                            <Typography variant="caption" sx={{ color: '#648CFF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.5rem', flex: 1 }}>
                                Cameras
                            </Typography>
                            <IconButton
                                size="small"
                                onClick={(e) => { setAddEquipAnchor(e.currentTarget); setAddEquipType('CAMERA'); }}
                                sx={{ p: 0.25, color: '#648CFF', opacity: 0.6, '&:hover': { opacity: 1, bgcolor: 'rgba(100, 140, 255, 0.08)' } }}
                            >
                                <AddIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                        </Box>
                        {cameraItems.map((item, idx) => renderEquipRow(item, 'CAMERA', idx + 1))}
                    </Box>
                )}

                {/* Audio rows */}
                {audioItems.length > 0 && (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#10b981' }} />
                            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.5rem', flex: 1 }}>
                                Audio
                            </Typography>
                            <IconButton
                                size="small"
                                onClick={(e) => { setAddEquipAnchor(e.currentTarget); setAddEquipType('AUDIO'); }}
                                sx={{ p: 0.25, color: '#10b981', opacity: 0.6, '&:hover': { opacity: 1, bgcolor: 'rgba(16, 185, 129, 0.08)' } }}
                            >
                                <AddIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                        </Box>
                        {audioItems.map((item, idx) => renderEquipRow(item, 'AUDIO', idx + 1))}
                    </Box>
                )}

                {equipmentItems.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 1 }}>
                            No equipment added yet
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            <Button
                                size="small"
                                startIcon={<VideocamIcon sx={{ fontSize: 11 }} />}
                                onClick={(e) => { setAddEquipAnchor(e.currentTarget); setAddEquipType('CAMERA'); }}
                                sx={{ fontSize: '0.55rem', color: '#648CFF', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(100, 140, 255, 0.06)' } }}
                            >
                                Add Camera
                            </Button>
                            <Button
                                size="small"
                                startIcon={<MicIcon sx={{ fontSize: 11 }} />}
                                onClick={(e) => { setAddEquipAnchor(e.currentTarget); setAddEquipType('AUDIO'); }}
                                sx={{ fontSize: '0.55rem', color: '#10b981', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.06)' } }}
                            >
                                Add Audio
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* Equipment Total */}
                {equipmentItems.length > 0 && (() => {
                    const totalEquipCost = equipmentItems.reduce((sum, item) => {
                        const fullEq = allEquipment.find((e) => e.id === item.equipment_id);
                        return sum + (fullEq?.rental_price_per_day ? Number(fullEq.rental_price_per_day) : 0);
                    }, 0);
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5, pt: 1, borderTop: '1px solid rgba(245, 158, 11, 0.15)' }}>
                            <Typography variant="caption" sx={{ flex: 1, color: '#94a3b8', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                Total
                            </Typography>
                            <Typography variant="caption" sx={{
                                color: totalEquipCost > 0 ? '#f59e0b' : '#475569',
                                fontWeight: 700, fontSize: '0.7rem', fontVariantNumeric: 'tabular-nums',
                                minWidth: 56, textAlign: 'right',
                            }}>
                                {totalEquipCost > 0 ? formatCurrency(totalEquipCost, currency) : '—'}
                            </Typography>
                        </Box>
                    );
                })()}

                {/* Bottom actions */}
                <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    <Button
                        size="small"
                        startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                        onClick={(e) => { setAddEquipAnchor(e.currentTarget); setAddEquipType('CAMERA'); }}
                        sx={{ fontSize: '0.6rem', color: '#648CFF', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(100, 140, 255, 0.06)' } }}
                    >
                        Add Equipment
                    </Button>
                    <Button
                        size="small"
                        href="/manager/equipment"
                        component={Link}
                        sx={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', color: '#94a3b8' } }}
                    >
                        Manage Equipment
                    </Button>
                </Box>
            </Box>

            {/* Equipment-Operator Assignment Menu */}
            <Menu
                anchorEl={equipAssignAnchor}
                open={Boolean(equipAssignAnchor)}
                onClose={() => { setEquipAssignAnchor(null); setEquipAssignTarget(null); }}
                PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 200, maxHeight: 300 } }}
            >
                <Box sx={{ px: 1.5, py: 0.75, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Assign Operator
                    </Typography>
                </Box>
                {/* Mark Unmanned option (cameras only) */}
                {equipAssignTarget && (() => {
                    const isCameraEquip = cameraItems.some(eq => eq.equipment_id === equipAssignTarget.equipmentId);
                    const isCurrentlyUnmanned = unmannedEquipment.some(eq => eq.id === equipAssignTarget.equipmentId);
                    if (!isCameraEquip) return null;
                    return (
                        <MenuItem
                            onClick={async () => {
                                setEquipAssignAnchor(null);
                                await handleToggleUnmanned(equipAssignTarget.equipmentId);
                                setEquipAssignTarget(null);
                            }}
                            sx={{
                                fontSize: '0.7rem', color: '#94a3b8', py: 0.75,
                                bgcolor: isCurrentlyUnmanned ? 'rgba(148, 163, 184, 0.12)' : 'transparent',
                                '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.18)' },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(148, 163, 184, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Typography sx={{ fontSize: '0.5rem', fontWeight: 800, color: '#94a3b8' }}>UM</Typography>
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                                        {isCurrentlyUnmanned ? 'Remove Unmanned' : 'Mark Unmanned'}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.55rem', color: '#64748b' }}>No operator needed</Typography>
                                </Box>
                                {isCurrentlyUnmanned && (
                                    <Typography sx={{ fontSize: '0.5rem', color: '#94a3b8', fontWeight: 600 }}>✓</Typography>
                                )}
                            </Box>
                        </MenuItem>
                    );
                })()}
                {dayOpsForEquip.length === 0 ? (
                    <MenuItem disabled sx={{ fontSize: '0.7rem', color: '#475569' }}>Add crew members first</MenuItem>
                ) : (() => {
                    const isTargetCamera = equipAssignTarget
                        ? cameraItems.some(eq => eq.equipment_id === equipAssignTarget.equipmentId)
                        : false;
                    const isTargetAudio = equipAssignTarget
                        ? audioItems.some(eq => eq.equipment_id === equipAssignTarget.equipmentId)
                        : false;
                    const requiredRoleName = isTargetCamera ? 'videographer' : isTargetAudio ? 'sound_engineer' : null;
                    const requiredRoleLabel = isTargetCamera ? 'Videographers' : isTargetAudio ? 'Sound Engineers' : null;

                    const matchingOps = requiredRoleName
                        ? dayOpsForEquip.filter(op => op.job_role?.name === requiredRoleName)
                        : dayOpsForEquip;
                    const otherOps = requiredRoleName
                        ? dayOpsForEquip.filter(op => op.job_role?.name !== requiredRoleName)
                        : [];

                    const renderOpItem = (op: PackageDayOperatorRecord, dimmed = false) => {
                        const opC = op.position_color || op.contributor?.crew_color || '#EC4899';
                        let opTierName: string | null = null;
                        if (op.contributor && op.job_role) {
                            const jrm = op.contributor.contributor_job_roles?.find(cjr => cjr.job_role_id === op.job_role_id);
                            opTierName = jrm?.payment_bracket?.name || null;
                        }
                        const opRoleLabel = op.job_role
                            ? `${op.job_role.display_name || op.job_role.name}${opTierName ? ` - ${opTierName}` : ''}`
                            : (op.position_name || '?');
                        const initials = opRoleLabel.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
                        const personName = op.contributor ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim() : null;
                        const isCurrentlyAssigned = equipAssignTarget?.currentOpId === op.id;
                        return (
                            <MenuItem
                                key={op.id}
                                onClick={async () => {
                                    setEquipAssignAnchor(null);
                                    if (!equipAssignTarget) return;
                                    if (isCurrentlyAssigned) return;
                                    await handleAssignOperator(op.id, equipAssignTarget.equipmentId);
                                    setEquipAssignTarget(null);
                                }}
                                sx={{
                                    fontSize: '0.7rem', color: dimmed ? '#64748b' : '#e2e8f0', py: 0.75,
                                    opacity: dimmed ? 0.65 : 1,
                                    bgcolor: isCurrentlyAssigned ? `${opC}12` : 'transparent',
                                    '&:hover': { bgcolor: `${opC}18` },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: `${opC}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Typography sx={{ fontSize: '0.5rem', fontWeight: 800, color: opC }}>{initials}</Typography>
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{opRoleLabel}</Typography>
                                        {personName && <Typography sx={{ fontSize: '0.55rem', color: '#38bdf8' }}>{personName}</Typography>}
                                        {!personName && <Typography sx={{ fontSize: '0.55rem', color: '#f59e0b', fontStyle: 'italic' }}>Unassigned</Typography>}
                                    </Box>
                                    {isCurrentlyAssigned && (
                                        <Typography sx={{ fontSize: '0.5rem', color: opC, fontWeight: 600 }}>✓</Typography>
                                    )}
                                </Box>
                            </MenuItem>
                        );
                    };

                    return (
                        <>
                            {requiredRoleLabel && (
                                <MenuItem disabled sx={{ fontSize: '0.5rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, py: 0.3, minHeight: 0, opacity: '1 !important' }}>
                                    {requiredRoleLabel}
                                </MenuItem>
                            )}
                            {matchingOps.length > 0
                                ? matchingOps.map(op => renderOpItem(op))
                                : requiredRoleName && (
                                    <MenuItem disabled sx={{ fontSize: '0.65rem', color: '#475569', py: 0.5 }}>
                                        No {requiredRoleLabel?.toLowerCase()} on this day
                                    </MenuItem>
                                )
                            }
                            {otherOps.length > 0 && (
                                <>
                                    <MenuItem disabled sx={{ fontSize: '0.5rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, py: 0.3, mt: 0.5, minHeight: 0, opacity: '1 !important', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                        Other Crew
                                    </MenuItem>
                                    {otherOps.map(op => renderOpItem(op, true))}
                                </>
                            )}
                        </>
                    );
                })()}
                {/* Unassign option */}
                {equipAssignTarget?.currentOpId && (
                    <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <MenuItem
                            onClick={async () => {
                                setEquipAssignAnchor(null);
                                if (!equipAssignTarget?.currentOpId) return;
                                await handleUnassignOperator(equipAssignTarget.currentOpId, equipAssignTarget.equipmentId);
                                setEquipAssignTarget(null);
                            }}
                            sx={{ fontSize: '0.7rem', color: '#ef4444', py: 0.75, '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' } }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DeleteIcon sx={{ fontSize: 13, color: '#ef4444' }} />
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>Unassign</Typography>
                            </Box>
                        </MenuItem>
                    </Box>
                )}
            </Menu>

            {/* Add Equipment Menu */}
            <Menu
                anchorEl={addEquipAnchor}
                open={Boolean(addEquipAnchor)}
                onClose={() => setAddEquipAnchor(null)}
                PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 220, maxHeight: 350 } }}
            >
                <Box sx={{ px: 1.5, py: 0.75, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 0.5 }}>
                    <Button
                        size="small"
                        onClick={() => setAddEquipType('CAMERA')}
                        sx={{
                            fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', minWidth: 0, px: 1, py: 0.25,
                            color: addEquipType === 'CAMERA' ? '#648CFF' : '#475569',
                            bgcolor: addEquipType === 'CAMERA' ? 'rgba(100, 140, 255, 0.1)' : 'transparent',
                            borderRadius: 1,
                        }}
                    >
                        Cameras
                    </Button>
                    <Button
                        size="small"
                        onClick={() => setAddEquipType('AUDIO')}
                        sx={{
                            fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', minWidth: 0, px: 1, py: 0.25,
                            color: addEquipType === 'AUDIO' ? '#10b981' : '#475569',
                            bgcolor: addEquipType === 'AUDIO' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                            borderRadius: 1,
                        }}
                    >
                        Audio
                    </Button>
                </Box>
                {(() => {
                    const typeColor = addEquipType === 'CAMERA' ? '#648CFF' : '#10b981';
                    const categoryFilter = addEquipType === 'CAMERA' ? ['CAMERA'] : ['AUDIO'];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const filtered = allEquipment.filter((eq: any) => categoryFilter.some(c => (eq.category || '').toUpperCase().includes(c)));
                    const existingIds = new Set(equipmentItems.map(e => e.equipment_id));
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const available = filtered.filter((eq: any) => !existingIds.has(eq.id));
                    if (available.length === 0) {
                        return <MenuItem disabled sx={{ fontSize: '0.7rem', color: '#475569' }}>No {addEquipType.toLowerCase()} equipment available</MenuItem>;
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return available.map((eq: any) => (
                        <MenuItem
                            key={eq.id}
                            onClick={() => { addEquipmentItem(eq.id, addEquipType); setAddEquipAnchor(null); }}
                            sx={{ fontSize: '0.7rem', color: '#e2e8f0', py: 0.75, '&:hover': { bgcolor: `${typeColor}12` } }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: `${typeColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {addEquipType === 'CAMERA'
                                        ? <VideocamIcon sx={{ fontSize: 12, color: typeColor }} />
                                        : <MicIcon sx={{ fontSize: 12, color: typeColor }} />
                                    }
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.item_name}</Typography>
                                    {eq.model && <Typography sx={{ fontSize: '0.55rem', color: '#64748b' }}>{eq.model}</Typography>}
                                </Box>
                            </Box>
                        </MenuItem>
                    ));
                })()}
            </Menu>

            {/* Track Number Picker Menu */}
            <Menu
                anchorEl={trackPickerAnchor}
                open={Boolean(trackPickerAnchor)}
                onClose={() => { setTrackPickerAnchor(null); setTrackPickerTarget(null); }}
                PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 100 } }}
            >
                {(() => {
                    if (!trackPickerTarget) return null;
                    const { equipmentId, slotType } = trackPickerTarget;
                    const isCamera = slotType === 'CAMERA';
                    const accentColor = isCamera ? '#648CFF' : '#10b981';
                    const sameTypeCount = equipmentItems.filter(e => e.slot_type === slotType).length;
                    const maxTrack = Math.max(sameTypeCount, 4);
                    const currentItem = equipmentItems.find(e => e.equipment_id === equipmentId);
                    const currentTrack = currentItem?.track_number;

                    return (
                        <>
                            <Box sx={{ px: 1.5, py: 0.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Set Track #
                                </Typography>
                            </Box>
                            {Array.from({ length: maxTrack }, (_, i) => i + 1).map(num => {
                                const takenBy = equipmentItems.find(e => e.slot_type === slotType && e.track_number === num && e.equipment_id !== equipmentId);
                                const isCurrent = currentTrack === num;
                                return (
                                    <MenuItem
                                        key={num}
                                        onClick={() => {
                                            changeTrackNumber(equipmentId, slotType, num);
                                            setTrackPickerAnchor(null);
                                            setTrackPickerTarget(null);
                                        }}
                                        sx={{
                                            fontSize: '0.7rem', color: isCurrent ? accentColor : '#e2e8f0',
                                            py: 0.5, minHeight: 28,
                                            bgcolor: isCurrent ? `${accentColor}12` : 'transparent',
                                            '&:hover': { bgcolor: `${accentColor}18` },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                                            <Typography sx={{ fontSize: '0.7rem', fontWeight: isCurrent ? 800 : 600 }}>
                                                {isCamera ? 'Camera' : 'Audio'} {num}
                                            </Typography>
                                            {isCurrent && (
                                                <Typography sx={{ fontSize: '0.5rem', color: accentColor, fontWeight: 600 }}>✓</Typography>
                                            )}
                                            {takenBy && !isCurrent && (
                                                <Typography sx={{ fontSize: '0.45rem', color: '#64748b', fontStyle: 'italic' }}>swap</Typography>
                                            )}
                                        </Box>
                                    </MenuItem>
                                );
                            })}
                        </>
                    );
                })()}
            </Menu>
        </Box>
    );
}
