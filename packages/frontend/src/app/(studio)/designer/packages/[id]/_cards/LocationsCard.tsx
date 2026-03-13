'use client';

import React from 'react';
import {
    Box, Typography, Button,
    IconButton, Chip,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import { api } from '@/lib/api';
import { useOptionalScheduleApi } from '@/components/schedule/ScheduleApiContext';
import type { EventDayTemplate } from '@/components/schedule/EventDayManager';
import type {
    PackageActivityRecord,
    PackageLocationSlotRecord,
} from '../_lib/types';

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

interface LocationsCardProps {
    packageId: number | null;
    packageEventDays: EventDayTemplate[];
    packageActivities: PackageActivityRecord[];
    packageLocationSlots: PackageLocationSlotRecord[];
    setPackageLocationSlots: React.Dispatch<React.SetStateAction<PackageLocationSlotRecord[]>>;
    scheduleActiveDayId: number | null;
    selectedActivityId: number | null;
    cardSx: SxProps<Theme>;
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function LocationsCard({
    packageId,
    packageEventDays,
    packageActivities,
    packageLocationSlots,
    setPackageLocationSlots,
    scheduleActiveDayId,
    selectedActivityId,
    cardSx,
}: LocationsCardProps) {
    // ─── ScheduleApi adapter (context if available, else direct package API) ──
    const contextApi = useOptionalScheduleApi();
    const locationApi = contextApi?.locationSlots ?? {
        create: (dayId: number, data?: any) => api.schedule.packageLocationSlots.create(packageId!, { event_day_template_id: dayId, ...data }),
        delete: (id: number) => api.schedule.packageLocationSlots.delete(id),
        assignActivity: (slotId: number, activityId: number) => api.schedule.packageLocationSlots.assignActivity(slotId, activityId),
        unassignActivity: (slotId: number, activityId: number) => api.schedule.packageLocationSlots.unassignActivity(slotId, activityId),
    };
    const hasOwner = !!contextApi || !!packageId;

    // ─── Derived values ──────────────────────────────────────────────
    const activeEventDayId = scheduleActiveDayId || packageEventDays[0]?.id;
    const activeDay = packageEventDays.find(d => d.id === activeEventDayId);
    const selectedActivity = selectedActivityId ? packageActivities.find(a => a.id === selectedActivityId) : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const daySlots = packageLocationSlots.filter((s: any) => s.event_day_template_id === activeEventDayId);
    const isSlotAssigned = (slot: any) => !selectedActivityId || slot.activity_assignments?.some((a: any) => a.package_activity_id === selectedActivityId); // eslint-disable-line @typescript-eslint/no-explicit-any
    const maxSlots = 5;

    // ─── Render ──────────────────────────────────────────────────────
    return (
        <Box sx={{ ...(cardSx as object), overflow: 'hidden' }}>
            {/* Card Header */}
            <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid rgba(52, 58, 68, 0.25)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                            <PlaceIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Locations</Typography>
                            {selectedActivity ? (
                                <Typography sx={{ fontSize: '0.55rem', color: '#a855f7', fontWeight: 600, mt: -0.25 }}>{selectedActivity.name}</Typography>
                            ) : activeDay && packageEventDays.length > 1 ? (
                                <Typography sx={{ fontSize: '0.55rem', color: '#f59e0b', fontWeight: 600, mt: -0.25 }}>{activeDay.name}</Typography>
                            ) : null}
                        </Box>
                    </Box>
                    {daySlots.length > 0 && (
                        <Chip
                            label={`${selectedActivityId ? daySlots.filter((s: any) => isSlotAssigned(s)).length : daySlots.length}`} // eslint-disable-line @typescript-eslint/no-explicit-any
                            size="small"
                            sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', '& .MuiChip-label': { px: 0.6 } }}
                        />
                    )}
                </Box>
            </Box>

            <Box sx={{ px: 2.5, pt: 1.5, pb: 1.5 }}>
                {daySlots.length === 0 && (
                    <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontSize: '0.7rem', textAlign: 'center', py: 1 }}>
                        {selectedActivity ? 'No location slots for this day' : 'No location slots — add up to 5'}
                    </Typography>
                )}
                {daySlots.map((slot: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                    const assigned = isSlotAssigned(slot);
                    // When an activity is selected, show count for that activity only;
                    // show total count otherwise so dimmed slots don't show misleading numbers.
                    const assignedCount = selectedActivityId
                        ? (slot.activity_assignments?.filter((a: any) => a.package_activity_id === selectedActivityId).length || 0) // eslint-disable-line @typescript-eslint/no-explicit-any
                        : (slot.activity_assignments?.length || 0);
                    return (
                        <Box
                            key={slot.id}
                            onClick={async () => {
                                if (!selectedActivityId || !hasOwner) return;
                                try {
                                    if (assigned) {
                                        const updated = await locationApi.unassignActivity(slot.id, selectedActivityId);
                                        setPackageLocationSlots(prev => prev.map((s: any) => s.id === slot.id ? { ...s, ...updated } : s)); // eslint-disable-line @typescript-eslint/no-explicit-any
                                    } else {
                                        const updated = await locationApi.assignActivity(slot.id, selectedActivityId);
                                        setPackageLocationSlots(prev => prev.map((s: any) => s.id === slot.id ? { ...s, ...updated } : s)); // eslint-disable-line @typescript-eslint/no-explicit-any
                                    }
                                } catch (err) { console.warn('Failed to toggle location slot:', err); }
                            }}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 1, py: 0.5, px: 1, mx: -1, borderRadius: 1.5,
                                transition: 'all 0.2s ease',
                                opacity: assigned ? 1 : 0.3,
                                cursor: selectedActivityId ? 'pointer' : 'default',
                                '&:hover': {
                                    bgcolor: selectedActivityId ? 'rgba(245, 158, 11, 0.06)' : 'transparent',
                                    '& .slot-del': { opacity: 1 },
                                },
                            }}
                        >
                            <PlaceIcon sx={{ fontSize: 12, color: '#f59e0b', flexShrink: 0 }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.72rem', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    Location {slot.location_number}
                                    {(slot as any).name && (
                                        <Box component="span" sx={{ color: '#94a3b8', fontWeight: 400 }}> · {(slot as any).name}</Box>
                                    )}
                                </Typography>
                                {assignedCount > 0 && (
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.55rem', display: 'block', mt: -0.2 }}>
                                        {assignedCount} {assignedCount === 1 ? 'activity' : 'activities'}
                                    </Typography>
                                )}
                            </Box>
                            <Box className="slot-del" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
                                <IconButton
                                    size="small"
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            await locationApi.delete(slot.id);
                                            setPackageLocationSlots(prev => prev.filter((s: any) => s.id !== slot.id)); // eslint-disable-line @typescript-eslint/no-explicit-any
                                        } catch (err) { console.warn('Failed to remove location slot:', err); }
                                    }}
                                    sx={{ p: 0.25, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}
                                >
                                    <DeleteIcon sx={{ fontSize: 11 }} />
                                </IconButton>
                            </Box>
                        </Box>
                    );
                })}
                <Box sx={{ mt: daySlots.length > 0 ? 1 : 0.25, display: 'flex', justifyContent: 'center' }}>
                    {hasOwner && packageEventDays.length > 0 && daySlots.length < maxSlots && (
                        <Button
                            size="small"
                            startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                            onClick={async () => {
                                if (!activeEventDayId || !hasOwner) return;
                                try {
                                    const created = await locationApi.create(activeEventDayId);
                                    setPackageLocationSlots(prev => [...prev, created]);
                                } catch (err) { console.warn('Failed to add location slot:', err); }
                            }}
                            sx={{ fontSize: '0.6rem', color: '#f59e0b', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.06)' } }}
                        >
                            Add Location
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
