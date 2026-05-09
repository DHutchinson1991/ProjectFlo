'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Button, IconButton, Menu, MenuItem,
    Tooltip, SxProps, Theme, Checkbox,
    Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { formatCurrency } from '@/shared/utils/formatUtils';
import { ServicePackage, ServicePackageItem } from '@/features/catalog/packages/types/service-package.types';
import { equipmentApi } from '@/features/workflow/equipment/api';
import { crewSlotsApi } from '@/features/workflow/scheduling/shared';
import type { EventDay } from '@/features/workflow/scheduling/package-template';
import { useOptionalScheduleApi } from '@/features/workflow/scheduling/shared';
import { detailGlassCardSx } from '../detail-tokens';

import type {
    PackageCrewSlotRecord,
    PackageActivityRecord,
    EquipmentRecord,
    UnmannedEquipmentRecord,
    EquipItem,
} from '../../../types';


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
    PackageCrewSlots: PackageCrewSlotRecord[];
    setPackageCrewSlots: React.Dispatch<React.SetStateAction<PackageCrewSlotRecord[]>>;
    packageEventDays: EventDay[];
    packageActivities: PackageActivityRecord[];
    scheduleActiveDayId: number | null;
    selectedActivityId: number | null;
    allEquipment: EquipmentRecord[];
    unmannedEquipment: UnmannedEquipmentRecord[];
    setUnmannedEquipment: React.Dispatch<React.SetStateAction<UnmannedEquipmentRecord[]>>;
    currency: string;
    cardSx?: SxProps<Theme>;
    selectedEquipmentId?: number | null;
    onSelectEquipment?: (id: number | null) => void;
}

// ─── Component ──────────────────────────────────────────────────────
export function EquipmentCard({
    packageId,
    safeBrandId,
    formData,
    setFormData,
    PackageCrewSlots,
    setPackageCrewSlots,
    packageEventDays,
    packageActivities,
    scheduleActiveDayId,
    selectedActivityId,
    allEquipment,
    unmannedEquipment,
    setUnmannedEquipment,
    currency,
    selectedEquipmentId,
    onSelectEquipment,
}: EquipmentCardProps) {
    // ── Internalized UI state ──
    const [equipAssignAnchor, setEquipAssignAnchor] = useState<null | HTMLElement>(null);
    const [equipAssignTarget, setEquipAssignTarget] = useState<{ equipmentId: number; currentOpId?: number } | null>(null);
    const [addEquipAnchor, setAddEquipAnchor] = useState<null | HTMLElement>(null);
    const [addEquipType, setAddEquipType] = useState<'CAMERA' | 'AUDIO'>('CAMERA');
    const [trackPickerAnchor, setTrackPickerAnchor] = useState<null | HTMLElement>(null);
    const [trackPickerTarget, setTrackPickerTarget] = useState<{ equipmentId: number; slotType: 'CAMERA' | 'AUDIO' } | null>(null);
    const [equipSwapAnchor, setEquipSwapAnchor] = useState<null | HTMLElement>(null);
    const [equipSwapItemId, setEquipSwapItemId] = useState<number | null>(null);
    const [equipCtxMenu, setEquipCtxMenu] = useState<{ top: number; left: number; equipmentId: number } | null>(null);

    // ── ScheduleApi adapter (context if available, else direct package API) ──
    const contextApi = useOptionalScheduleApi();
    const crewSlotEquipApi = {
        setEquipment: contextApi?.crewSlots?.setEquipment
            ?? ((opId: number, equip: { equipment_id: number; is_primary: boolean }[]) =>
                crewSlotsApi.packageDay.setEquipment(opId, equip)),
        refreshAll: contextApi?.crewSlots?.refreshAll
            ?? (packageId
                ? () => crewSlotsApi.packageDay.getAll(packageId)
                : () => Promise.resolve([])),
    };

    // ── Hierarchical equipment: Event Day (base) → Activity (override) ──
    const equipmentContents = ((formData.contents || {}) as EquipmentContentsShape);
    const dayEquipmentMap: Record<string, EquipItem[]> = equipmentContents.day_equipment || {};
    const activityEquipmentOverrides: Record<string, EquipItem[]> = equipmentContents.activity_equipment || {};

    const activeDayId: number | null = scheduleActiveDayId ?? packageEventDays[0]?.id ?? null;
    const activePackageDay = activeDayId
        ? packageEventDays.find((d: EventDay) => d.id === activeDayId)
        : packageEventDays[0];
    const activeDayTemplateId = (activePackageDay as any)?.event_day_template_id || (activePackageDay as any)?.event_day?.id || null;
    const activeJoinId: number | undefined = (activePackageDay as any)?._joinId;

    // Try template ID first (new format), then join table ID (legacy packages)
    const dayEquipment: EquipItem[] = activeDayId
        ? (dayEquipmentMap[String(activeDayId)]
            || (activeJoinId ? dayEquipmentMap[String(activeJoinId)] : undefined)
            || [])
        : [];

    // Fallback: derive equipment from relational crew-slot-equipment links
    const dayOpsForEquip = activeDayTemplateId
        ? PackageCrewSlots.filter(o => o.event_day_template_id === activeDayTemplateId)
        : PackageCrewSlots;

    const relationalEquipment: EquipItem[] = dayOpsForEquip.flatMap((op) =>
        (op.equipment || []).map((eq) => {
            const inferredType = eq.equipment?.category === 'AUDIO' ? 'AUDIO' : 'CAMERA';
            const parsedTrack = Number.parseInt(op.label?.match(/\d+/)?.[0] || '', 10);
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

    const handleSwapEquipment = async (oldEquipId: number, newEquipId: number) => {
        if (oldEquipId === newEquipId) return;
        const oldItem = equipmentItems.find(e => e.equipment_id === oldEquipId);
        if (!oldItem) return;
        const newEq = allEquipment.find(e => e.id === newEquipId);
        if (!newEq) return;
        // Update local formData
        const updated = equipmentItems.map(item => {
            if (item.equipment_id === oldEquipId) {
                return { ...item, equipment_id: newEquipId, equipment: { id: newEq.id, item_name: newEq.item_name, model: newEq.model } };
            }
            return item;
        });
        saveEquipmentAtLevel(updated);
    };

    // Build equipment → crew slot map
    const equipToCrewSlot = new Map<number, PackageCrewSlotRecord>();
    dayOpsForEquip.forEach(op => {
        (op.equipment || []).forEach(eq => {
            equipToCrewSlot.set(eq.equipment_id, op);
        });
    });

    const getCrewSlotForEquipment = (equipmentId: number | undefined) => {
        if (!equipmentId) return null;
        return equipToCrewSlot.get(equipmentId) || null;
    };

    // ── Crew slot assignment helpers ──
    const handleAssignCrewSlot = async (crewSlotDayId: number, equipmentId: number) => {
        const targetOp = dayOpsForEquip.find(o => o.id === crewSlotDayId);
        if (!targetOp) return;
        const currentOwner = equipToCrewSlot.get(equipmentId);
        if (currentOwner && currentOwner.id !== crewSlotDayId) {
            const updatedEquip = (currentOwner.equipment || [])
                .filter(e => e.equipment_id !== equipmentId)
                .map(e => ({ equipment_id: e.equipment_id, is_primary: e.is_primary }));
            try { await crewSlotEquipApi.setEquipment(currentOwner.id, updatedEquip); } catch {}
        }
        const existsAlready = (targetOp.equipment || []).some(e => e.equipment_id === equipmentId);
        const newEquip = existsAlready
            ? (targetOp.equipment || []).map(e => ({ equipment_id: e.equipment_id, is_primary: e.is_primary }))
            : [...(targetOp.equipment || []).map(e => ({ equipment_id: e.equipment_id, is_primary: e.is_primary })), { equipment_id: equipmentId, is_primary: true }];
        try {
            await crewSlotEquipApi.setEquipment(crewSlotDayId, newEquip);
            const dayOps = await crewSlotEquipApi.refreshAll();
            setPackageCrewSlots(dayOps || []);
        } catch (err) { console.warn('Failed to assign crew slot:', err); }
    };

    const handleUnassignCrewSlot = async (crewSlotDayId: number, equipmentId: number) => {
        const targetOp = dayOpsForEquip.find(o => o.id === crewSlotDayId);
        if (!targetOp) return;
        const updatedEquip = (targetOp.equipment || [])
            .filter(e => e.equipment_id !== equipmentId)
            .map(e => ({ equipment_id: e.equipment_id, is_primary: e.is_primary }));
        try {
            await crewSlotEquipApi.setEquipment(crewSlotDayId, updatedEquip);
            const dayOps = await crewSlotEquipApi.refreshAll();
            setPackageCrewSlots(dayOps || []);
        } catch (err) { console.warn('Failed to unassign crew slot:', err); }
    };

    const handleToggleUnmanned = async (equipmentId: number) => {
        try {
            const isCurrentlyUnmanned = unmannedEquipment.some(eq => eq.id === equipmentId);
            await equipmentApi.setUnmannedStatus(equipmentId, !isCurrentlyUnmanned);
            if (safeBrandId) {
                const unmannedList = await equipmentApi.findUnmanned(safeBrandId);
                setUnmannedEquipment(unmannedList || []);
            }
            const dayOps = await crewSlotEquipApi.refreshAll();
            setPackageCrewSlots(dayOps || []);
        } catch (err) {
            console.error('❌ Failed to toggle unmanned status:', err);
        }
    };

    const allItems = [...cameraItems, ...audioItems];

    const selectedActivity = selectedActivityId ? packageActivities.find(a => a.id === selectedActivityId) : null;
    const actColor = selectedActivity?.color || '#f59e0b';

    // ── Render a single equipment row ──
    const renderEquipRow = (item: EquipItem, type: 'CAMERA' | 'AUDIO') => {
        const isCamera = type === 'CAMERA';
        const accentColor = isCamera ? '#648CFF' : '#10b981';
        const trackNum = item.track_number;
        const op = getCrewSlotForEquipment(item.equipment_id);

        let tierName: string | null = null;
        if (op?.crew && op?.job_role) {
            const jobRoleMatch = op.crew.job_role_assignments?.find(
                (cjr) => cjr.job_role_id === op.job_role_id
            );
            tierName = jobRoleMatch?.payment_bracket?.name || null;
        }

        const opLabel = op?.job_role
            ? `${op.job_role.display_name || op.job_role.name}${tierName ? ` - ${tierName}` : ''}`
            : (op?.label || '');
        const opName = op?.crew
            ? `${op.crew.contact?.first_name || ''} ${op.crew.contact?.last_name || ''}`.trim()
            : '';
        const isEquipUnmanned = isCamera && unmannedEquipment.some(eq => eq.id === item.equipment_id);

        const isEquipAssigned = (() => {
            if (!selectedActivityId) return true;
            if (activeLevel === 'activity') return true;
            if (!op) return true;
            if (op.activity_assignments && op.activity_assignments.length > 0) {
                return op.activity_assignments.some(a => a.package_activity_id === selectedActivityId);
            }
            if (op.package_activity_id) return op.package_activity_id === selectedActivityId;
            return true;
        })();

        const bCellSx = { py: 1.1, px: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.72rem' } as const;

        const isSelected = selectedEquipmentId === item.equipment_id;

        return (
            <TableRow
                key={item.equipment_id}
                onClick={() => onSelectEquipment?.(isSelected ? null : item.equipment_id)}
                onContextMenu={(e) => { e.preventDefault(); setEquipCtxMenu({ top: e.clientY, left: e.clientX, equipmentId: item.equipment_id }); }}
                sx={{
                    opacity: isEquipAssigned ? 1 : 0.3,
                    cursor: onSelectEquipment ? 'pointer' : undefined,
                    transition: 'all 0.2s ease',
                    bgcolor: isSelected ? 'rgba(100, 140, 255, 0.08)' : undefined,
                    '&:hover': {
                        bgcolor: isSelected
                            ? 'rgba(100, 140, 255, 0.12)'
                            : isCamera ? 'rgba(100, 140, 255, 0.04)' : 'rgba(16, 185, 129, 0.04)',
                    },
                }}
            >
                {/* Read-only assignment checkbox (inherited from crew slot) */}
                {selectedActivityId && (
                    <TableCell sx={{ ...bCellSx, p: 0, textAlign: 'center' }}>
                        <Tooltip title={op ? `Inherited from ${opName || opLabel || 'crew slot'}` : 'No crew assigned'} placement="left" arrow>
                            <span>
                                <Checkbox
                                    checked={isEquipAssigned}
                                    disabled
                                    size="small"
                                    sx={{
                                        p: 0, '& .MuiSvgIcon-root': { fontSize: 15 },
                                        color: 'rgba(255,255,255,0.08)',
                                        '&.Mui-checked.Mui-disabled': { color: `${actColor}73` },
                                        '&.Mui-disabled': { color: 'rgba(255,255,255,0.08)' },
                                    }}
                                />
                            </span>
                        </Tooltip>
                    </TableCell>
                )}
                {/* Track */}
                <TableCell sx={{ ...bCellSx, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: trackNum ? '#94a3b8' : '#475569', lineHeight: 1 }}>
                        {trackNum ? `${isCamera ? 'V' : 'A'}${trackNum}` : '—'}
                    </Typography>
                </TableCell>
                {/* Equipment */}
                <TableCell sx={bCellSx}>
                    <Box
                        sx={{ minWidth: 0, display: 'inline-flex', alignItems: 'center', gap: 0.25, maxWidth: '100%' }}
                    >
                        <Typography className="equip-name" variant="body2" sx={{
                            fontWeight: 600, fontSize: '0.75rem', color: '#cbd5e1',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            transition: 'color 0.15s',
                        }}>
                            {item.equipment?.item_name || `${isCamera ? 'Camera' : 'Audio'}`}
                        </Typography>
                        <KeyboardArrowDownIcon
                            onClick={(e) => {
                                e.stopPropagation();
                                setEquipSwapAnchor(e.currentTarget as unknown as HTMLElement);
                                setEquipSwapItemId(item.equipment_id);
                            }}
                            sx={{ fontSize: 13, color: '#475569', flexShrink: 0, cursor: 'pointer', '&:hover': { color: '#94a3b8' } }}
                        />
                    </Box>
                </TableCell>
                {/* Type */}
                <TableCell sx={{ ...bCellSx, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {isCamera ? 'Camera' : 'Audio'}
                    </Typography>
                </TableCell>
                {/* Status (Manned / Unmanned) */}
                <TableCell sx={{ ...bCellSx, textAlign: 'center' }}>
                    {isCamera ? (
                        <Tooltip title={isEquipUnmanned ? 'Unmanned (static) — click to toggle' : 'Manned — click to mark unmanned'} arrow placement="top">
                            <Box
                                onClick={(e) => { e.stopPropagation(); handleToggleUnmanned(item.equipment_id); }}
                                sx={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    height: 20, px: 0.75, borderRadius: 1, cursor: 'pointer',
                                    border: isEquipUnmanned ? '1px solid rgba(148,163,184,0.4)' : '1px solid rgba(100,116,139,0.2)',
                                    bgcolor: isEquipUnmanned ? 'rgba(148,163,184,0.12)' : 'transparent',
                                    transition: 'all 0.15s',
                                    '&:hover': { bgcolor: isEquipUnmanned ? 'rgba(148,163,184,0.22)' : 'rgba(100,116,139,0.08)' },
                                }}
                            >
                                <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: isEquipUnmanned ? '#94a3b8' : '#475569', lineHeight: 1, userSelect: 'none' }}>
                                    {isEquipUnmanned ? 'UM' : 'M'}
                                </Typography>
                            </Box>
                        </Tooltip>
                    ) : null}
                </TableCell>
                {/* Crew */}
                <TableCell sx={bCellSx}>
                    {op ? (
                        <Tooltip title={`${opLabel}${op.crew ? ` · ${opName}` : ''}${isEquipUnmanned ? ' (Unmanned)' : ''} — Click to change`} arrow placement="top">
                            <Box
                                sx={{
                                    display: 'inline-flex', alignItems: 'center', gap: 0.25,
                                    opacity: isEquipUnmanned ? 0.7 : 1,
                                }}
                            >
                                <Typography className="crew-name"
                                    sx={{
                                        fontSize: '0.65rem', fontWeight: 600,
                                        color: isEquipUnmanned ? '#94a3b8' : '#cbd5e1',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}
                                >
                                    {opName || opLabel || 'Crew'}
                                </Typography>
                                <KeyboardArrowDownIcon
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEquipAssignAnchor(e.currentTarget as unknown as HTMLElement);
                                        setEquipAssignTarget({ equipmentId: item.equipment_id, currentOpId: op.id });
                                    }}
                                    sx={{ fontSize: 12, color: '#475569', flexShrink: 0, cursor: 'pointer', '&:hover': { color: '#94a3b8' } }}
                                />
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
                                Assign
                            </Typography>
                        </Box>
                    )}
                </TableCell>
                {/* Rate */}
                <TableCell sx={{ ...bCellSx, textAlign: 'right' }}>
                    {(() => {
                        const fullEq = allEquipment.find((e) => e.id === item.equipment_id);
                        const dayRate = fullEq?.rental_price_per_day ? Number(fullEq.rental_price_per_day) : 0;
                        return (
                            <Typography variant="caption" sx={{
                                color: dayRate > 0 ? '#f59e0b' : '#475569',
                                fontWeight: 600, fontSize: '0.65rem', fontVariantNumeric: 'tabular-nums',
                            }}>
                                {dayRate > 0 ? formatCurrency(dayRate, currency) : '—'}
                            </Typography>
                        );
                    })()}
                </TableCell>

            </TableRow>
        );
    };

    const hCellSx = { py: 1.25, px: 1.5, fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' } as const;

    return (
        <>
            <Box sx={detailGlassCardSx}>
            {/* ── Section header ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.01em' }}>
                    Equipment
                </Typography>
                {selectedActivity && (
                    <Typography sx={{ fontSize: '0.55rem', color: selectedActivity.color || '#f59e0b', fontWeight: 600 }}>Filtering: {selectedActivity.name}</Typography>
                )}
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {hasOverride && (
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
                    )}
                    <IconButton
                        size="small"
                        onClick={(e) => { setAddEquipAnchor(e.currentTarget); setAddEquipType('CAMERA'); }}
                        sx={{ p: 0.25, color: '#64748b', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}
                    >
                        <AddIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </Box>
            </Box>

            {/* ── Equipment table ── */}
            {equipmentItems.length > 0 ? (
                <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <colgroup>
                        {selectedActivityId && <col style={{ width: '4%' }} />}
                        <col style={{ width: '7%' }} />
                        <col style={{ width: selectedActivityId ? '33%' : '37%' }} />
                        <col style={{ width: selectedActivityId ? '10%' : '11%' }} />
                        <col style={{ width: selectedActivityId ? '8%' : '9%' }} />
                        <col style={{ width: selectedActivityId ? '20%' : '21%' }} />
                        <col style={{ width: selectedActivityId ? '18%' : '15%' }} />
                    </colgroup>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                            {selectedActivityId && <TableCell sx={{ ...hCellSx, width: 28, p: 0 }} />}
                            <TableCell sx={{ ...hCellSx, textAlign: 'center', pr: 2 }}>Track</TableCell>
                            <TableCell sx={hCellSx}>Equipment</TableCell>
                            <TableCell sx={{ ...hCellSx, textAlign: 'center' }}>Type</TableCell>
                            <TableCell sx={{ ...hCellSx, textAlign: 'center' }}>Status</TableCell>
                            <TableCell sx={hCellSx}>Crew</TableCell>
                            <TableCell sx={{ ...hCellSx, textAlign: 'right' }}>Rate</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {allItems.map((item) => renderEquipRow(item, item.slot_type as 'CAMERA' | 'AUDIO'))}

                        {/* Total row */}
                        {(() => {
                            const totalEquipCost = equipmentItems.reduce((sum, item) => {
                                const fullEq = allEquipment.find((e) => e.id === item.equipment_id);
                                return sum + (fullEq?.rental_price_per_day ? Number(fullEq.rental_price_per_day) : 0);
                            }, 0);
                            return (
                                <>
                                    {/* ── Grand Total spacer ── */}
                                    <TableRow>
                                        <TableCell colSpan={selectedActivityId ? 7 : 6} sx={{ py: 0.5, borderBottom: 'none', borderTop: '2px solid rgba(255,255,255,0.06)' }} />
                                    </TableRow>
                                    {/* ── Grand Total row ── */}
                                    <TableRow sx={{ bgcolor: 'rgba(245, 158, 11, 0.04)' }}>
                                        <TableCell colSpan={selectedActivityId ? 6 : 5} sx={{ py: 1.25, borderBottom: 'none', borderTop: '1px solid rgba(245, 158, 11, 0.25)' }}>
                                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Total
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.25, textAlign: 'right', borderBottom: 'none', borderTop: '1px solid rgba(245, 158, 11, 0.25)' }}>
                                            <Typography sx={{
                                                color: totalEquipCost > 0 ? '#f59e0b' : '#475569',
                                                fontWeight: 700, fontSize: '0.95rem',
                                                fontVariantNumeric: 'tabular-nums',
                                            }}>
                                                {totalEquipCost > 0 ? formatCurrency(totalEquipCost, currency) : '—'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                </>
                            );
                        })()}
                    </TableBody>
                </Table>
            ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" sx={{ color: '#475569' }}>
                        No equipment added yet
                    </Typography>
                </Box>
            )}

            {/* Row context menu — right-click actions */}
            <Menu
                open={Boolean(equipCtxMenu)}
                onClose={() => setEquipCtxMenu(null)}
                anchorReference="anchorPosition"
                anchorPosition={equipCtxMenu ? { top: equipCtxMenu.top, left: equipCtxMenu.left } : undefined}
                PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' } }}
            >
                <MenuItem
                    onClick={() => {
                        if (!equipCtxMenu) return;
                        removeEquipmentItem(equipCtxMenu.equipmentId);
                        setEquipCtxMenu(null);
                    }}
                    sx={{ fontSize: '0.72rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 1 }}
                >
                    <DeleteIcon sx={{ fontSize: 14 }} /> Remove Equipment
                </MenuItem>
            </Menu>
            {/* Equipment-Crew Slot Assignment Menu */}
            <Menu
                anchorEl={equipAssignAnchor}
                open={Boolean(equipAssignAnchor)}
                onClose={() => { setEquipAssignAnchor(null); setEquipAssignTarget(null); }}
                PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' } }}
            >
                {/* Crew list — filtered by equipment type */}
                {(() => {
                    const targetItem = equipAssignTarget
                        ? equipmentItems.find(e => e.equipment_id === equipAssignTarget.equipmentId)
                        : null;
                    const slotType = targetItem?.slot_type; // 'CAMERA' | 'AUDIO'
                    const CAMERA_KEYWORDS = ['videographer', 'camera', 'operator', 'cinematographer', 'photographer', 'drone'];
                    const AUDIO_KEYWORDS = ['sound', 'audio', 'mixer'];
                    const keywords = slotType === 'CAMERA' ? CAMERA_KEYWORDS : slotType === 'AUDIO' ? AUDIO_KEYWORDS : null;

                    const matchesRole = (op: typeof dayOpsForEquip[0]) => {
                        if (!keywords) return true; // no filter if type unknown
                        const roleName = (op.job_role?.name || op.label || '').toLowerCase();
                        return keywords.some(kw => roleName.includes(kw));
                    };

                    const filtered = dayOpsForEquip.filter(matchesRole);

                    if (filtered.length === 0) {
                        return <MenuItem disabled sx={{ fontSize: '0.7rem', color: '#475569' }}>No matching crew</MenuItem>;
                    }

                    return filtered.map(op => {
                        const personName = op.crew ? `${op.crew.contact?.first_name || ''} ${op.crew.contact?.last_name || ''}`.trim() : null;
                        const roleLabel = op.job_role?.display_name || op.job_role?.name || op.label || '—';
                        const label = personName ? `${personName} · ${roleLabel}` : roleLabel;
                        const isAssigned = equipAssignTarget?.currentOpId === op.id;
                        return (
                            <MenuItem
                                key={op.id}
                                onClick={async () => {
                                    setEquipAssignAnchor(null);
                                    if (!equipAssignTarget || isAssigned) return;
                                    await handleAssignCrewSlot(op.id, equipAssignTarget.equipmentId);
                                    setEquipAssignTarget(null);
                                }}
                                sx={{ fontSize: '0.72rem', color: isAssigned ? '#f59e0b' : '#cbd5e1', py: 0.75, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                            >
                                {label}{isAssigned ? ' ✓' : ''}
                            </MenuItem>
                        );
                    });
                })()}
                {/* Unassign */}
                {equipAssignTarget?.currentOpId && (
                    <MenuItem
                        onClick={async () => {
                            setEquipAssignAnchor(null);
                            if (!equipAssignTarget?.currentOpId) return;
                            await handleUnassignCrewSlot(equipAssignTarget.currentOpId, equipAssignTarget.equipmentId);
                            setEquipAssignTarget(null);
                        }}
                        sx={{ fontSize: '0.72rem', color: '#ef4444', py: 0.75, borderTop: '1px solid rgba(255,255,255,0.06)', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }}
                    >
                        Unassign
                    </MenuItem>
                )}
            </Menu>

            {/* Add Equipment Menu */}
            <Menu
                anchorEl={addEquipAnchor}
                open={Boolean(addEquipAnchor)}
                onClose={() => setAddEquipAnchor(null)}
                PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' } }}
            >
                <MenuItem disabled sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', py: 0.5, minHeight: 0, opacity: '1 !important', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 1 }}>
                    <Box
                        component="span"
                        onClick={(e) => { e.stopPropagation(); setAddEquipType('CAMERA'); }}
                        sx={{ cursor: 'pointer', color: addEquipType === 'CAMERA' ? '#648CFF' : undefined, pointerEvents: 'all' }}
                    >Cameras</Box>
                    <Box component="span" sx={{ color: 'rgba(255,255,255,0.1)' }}>|</Box>
                    <Box
                        component="span"
                        onClick={(e) => { e.stopPropagation(); setAddEquipType('AUDIO'); }}
                        sx={{ cursor: 'pointer', color: addEquipType === 'AUDIO' ? '#10b981' : undefined, pointerEvents: 'all' }}
                    >Audio</Box>
                </MenuItem>
                {(() => {
                    const categoryFilter = addEquipType === 'CAMERA' ? ['CAMERA'] : ['AUDIO'];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const filtered = allEquipment.filter((eq: any) => categoryFilter.some(c => (eq.category || '').toUpperCase().includes(c)));
                    const existingIds = new Set(equipmentItems.map(e => e.equipment_id));
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const available = filtered.filter((eq: any) => !existingIds.has(eq.id));
                    if (available.length === 0) return <MenuItem disabled sx={{ fontSize: '0.72rem', color: '#475569' }}>No equipment available</MenuItem>;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return available.map((eq: any) => (
                        <MenuItem
                            key={eq.id}
                            onClick={() => { addEquipmentItem(eq.id, addEquipType); setAddEquipAnchor(null); }}
                            sx={{ fontSize: '0.72rem', color: '#cbd5e1', py: 0.75, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                        >
                            {eq.item_name}{eq.model ? ` · ${eq.model}` : ''}
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

            {/* Equipment Swap Menu */}
            <Menu
                anchorEl={equipSwapAnchor}
                open={Boolean(equipSwapAnchor)}
                onClose={() => { setEquipSwapAnchor(null); setEquipSwapItemId(null); }}
                PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' } }}
            >
                {(() => {
                    if (!equipSwapItemId) return null;
                    const currentItem = equipmentItems.find(e => e.equipment_id === equipSwapItemId);
                    if (!currentItem) return null;
                    const isCamera = currentItem.slot_type === 'CAMERA';
                    const categoryFilter = isCamera ? ['CAMERA'] : ['AUDIO'];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const filtered = allEquipment.filter((eq: any) => categoryFilter.some(c => (eq.category || '').toUpperCase().includes(c)));
                    const existingIds = new Set(equipmentItems.map(e => e.equipment_id));
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const available = filtered.filter((eq: any) => !existingIds.has(eq.id) || eq.id === equipSwapItemId);
                    if (available.length === 0) return <MenuItem disabled sx={{ fontSize: '0.72rem', color: '#475569' }}>No equipment available</MenuItem>;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return available.map((eq: any) => {
                        const isCurrent = eq.id === equipSwapItemId;
                        return (
                            <MenuItem
                                key={eq.id}
                                onClick={async () => {
                                    setEquipSwapAnchor(null);
                                    if (!isCurrent) await handleSwapEquipment(equipSwapItemId, eq.id);
                                    setEquipSwapItemId(null);
                                }}
                                sx={{ fontSize: '0.72rem', color: isCurrent ? '#f59e0b' : '#cbd5e1', py: 0.75, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                            >
                                {eq.item_name}{eq.model ? ` · ${eq.model}` : ''}{isCurrent ? ' ✓' : ''}
                            </MenuItem>
                        );
                    });
                })()}
            </Menu>
            </Box>
        </>
    );
}
