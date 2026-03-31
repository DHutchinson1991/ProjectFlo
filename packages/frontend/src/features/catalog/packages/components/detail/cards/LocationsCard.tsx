'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
    Box, Typography, Button,
    IconButton, Chip, ClickAwayListener,
    CircularProgress,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

import { scheduleApi } from '@/features/workflow/scheduling/package-template';
import { useOptionalScheduleApi } from '@/features/workflow/scheduling/shared';
import type { EventDay } from '@/features/workflow/scheduling/package-template';
import type {
    PackageActivityRecord,
    PackageLocationSlotRecord,
} from '../../../types';
import { ScheduleCardShell } from './ScheduleCardShell';
import { searchVenues, type NominatimResult } from '@/features/workflow/locations/api/geocoding.api';

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

interface LocationsCardProps {
    packageId: number | null;
    packageEventDays: EventDay[];
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
        create: (dayId: number, data?: any) => scheduleApi.packageLocationSlots.create(packageId!, { event_day_template_id: dayId, ...data }),
        update: () => Promise.resolve(null) as Promise<any>,
        delete: (id: number) => scheduleApi.packageLocationSlots.delete(id),
        assignActivity: (slotId: number, activityId: number) => scheduleApi.packageLocationSlots.assignActivity(slotId, activityId),
        unassignActivity: (slotId: number, activityId: number) => scheduleApi.packageLocationSlots.unassignActivity(slotId, activityId),
    };
    const hasOwner = !!contextApi || !!packageId;
    const isInstanceMode = !!contextApi && contextApi.mode !== 'package';

    // ─── Venue search state (instance mode) ────────────────────────
    const [searchingSlotId, setSearchingSlotId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
    const debounceRef = useRef<number | null>(null);

    const handleVenueSearch = useCallback((q: string) => {
        setSearchQuery(q);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (q.length < 3) { setSearchResults([]); setSearchDropdownOpen(false); return; }
        setSearchLoading(true);
        debounceRef.current = window.setTimeout(async () => {
            const results = await searchVenues(q);
            setSearchResults(results);
            setSearchDropdownOpen(results.length > 0);
            setSearchLoading(false);
        }, 400);
    }, []);

    const formatShort = (r: NominatimResult): string => {
        const a = r.address;
        if (!a) return r.display_name;
        const parts: string[] = [];
        if (a.road) parts.push([a.house_number, a.road].filter(Boolean).join(' '));
        const city = a.city || a.town || a.village;
        if (city) parts.push(city);
        if (a.state || a.county) parts.push(a.state || a.county || '');
        if (a.postcode) parts.push(a.postcode);
        return parts.filter(Boolean).join(', ') || r.display_name;
    };

    const handleVenueSelect = useCallback(async (r: NominatimResult, slotId: number) => {
        const name = r.name || r.display_name.split(',')[0].trim();
        const address = formatShort(r);
        const lat = parseFloat(r.lat);
        const lng = parseFloat(r.lon);
        setSearchingSlotId(null);
        setSearchQuery('');
        setSearchResults([]);
        setSearchDropdownOpen(false);
        try {
            const updated = await locationApi.update(slotId, { name, address, lat, lng } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
            setPackageLocationSlots(prev => prev.map((s: any) => s.id === slotId ? { ...s, name: updated?.name ?? name, address: updated?.address ?? address } : s)); // eslint-disable-line @typescript-eslint/no-explicit-any
        } catch (err) { console.error('Failed to update location slot:', err); }
    }, [locationApi, setPackageLocationSlots]);

    const openSearch = useCallback((slotId: number, currentName?: string) => {
        setSearchingSlotId(slotId);
        setSearchQuery(currentName || '');
        setSearchResults([]);
        setSearchDropdownOpen(false);
    }, []);

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
        <ScheduleCardShell
            title="Locations"
            icon={<PlaceIcon />}
            accentColor="#f59e0b"
            subtitle={selectedActivity ? (
                <Typography sx={{ fontSize: '0.55rem', color: '#a855f7', fontWeight: 600, mt: -0.25 }}>{selectedActivity.name}</Typography>
            ) : activeDay && packageEventDays.length > 1 ? (
                <Typography sx={{ fontSize: '0.55rem', color: '#f59e0b', fontWeight: 600, mt: -0.25 }}>{activeDay.name}</Typography>
            ) : undefined}
            headerRight={daySlots.length > 0
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ? <Chip label={`${selectedActivityId ? daySlots.filter((s: any) => isSlotAssigned(s)).length : daySlots.length}`} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', '& .MuiChip-label': { px: 0.6 } }} />
                : undefined
            }
            cardSx={cardSx}
        >

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
                            <PlaceIcon sx={{ fontSize: 12, color: '#f59e0b', flexShrink: 0, mt: isInstanceMode ? 0.4 : 0 }} />
                            <Box
                                sx={{
                                    flex: 1, minWidth: 0, position: 'relative',
                                    ...(isInstanceMode ? { cursor: 'pointer', borderRadius: '3px', px: 0.25, '&:hover': { bgcolor: 'rgba(245,158,11,0.06)' }, transition: 'background 0.15s' } : {}),
                                }}
                                onClick={isInstanceMode ? (e: React.MouseEvent) => { e.stopPropagation(); openSearch(slot.id, (slot as any).name ?? ''); } : undefined}
                            >
                                {(() => {
                                    const slotName: string = (slot as any).name ?? '';
                                    const slotAddress: string = (slot as any).address ?? '';
                                    const addrFirstPart = slotAddress.split(',')[0]?.trim() || '';

                                    // Determine venue name vs street address.
                                    // If address starts with a segment that differs from
                                    // slotName and doesn't start with a digit, it's the
                                    // venue name (e.g. "Buckatree Hall Hotel").
                                    let displayName = '';
                                    let displayAddress = slotAddress;

                                    if (addrFirstPart && addrFirstPart !== slotName && !/^\d/.test(addrFirstPart)) {
                                        // Address leads with venue name
                                        displayName = addrFirstPart;
                                        displayAddress = slotAddress.slice(addrFirstPart.length).replace(/^[,\s]+/, '');
                                    } else if (slotName && !slotName.includes(',')) {
                                        // Clean single-segment name — use it directly
                                        displayName = slotName;
                                        if (displayAddress.startsWith(slotName)) {
                                            displayAddress = displayAddress.slice(slotName.length).replace(/^[,\s]+/, '');
                                        }
                                    } else if (slotName) {
                                        // Name is address-like (commas + digits): take first part
                                        displayName = slotName.split(',')[0].trim();
                                        displayAddress = slotAddress || slotName.slice(displayName.length).replace(/^[,\s]+/, '');
                                    }
                                    return (<>
                                <Typography variant="body2" component="div" sx={{ fontWeight: 600, fontSize: '0.72rem', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                                    Location {slot.location_number}
                                    {isInstanceMode ? (
                                        <Box
                                            component="span"
                                            sx={{
                                                color: displayName ? '#94a3b8' : 'rgba(255,255,255,0.15)',
                                                fontWeight: 400,
                                                fontStyle: displayName ? 'normal' : 'italic',
                                                fontSize: displayName ? 'inherit' : '0.65rem',
                                                ml: 0.25,
                                            }}
                                        >
                                            {displayName ? ` · ${displayName}` : '· Search venue...'}
                                        </Box>
                                    ) : displayName ? (
                                        <Box component="span" sx={{ color: '#94a3b8', fontWeight: 400 }}> · {displayName}</Box>
                                    ) : null}
                                </Typography>
                                {/* Address line */}
                                {isInstanceMode && displayAddress && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: '#64748b',
                                            fontSize: '0.6rem',
                                            display: 'block',
                                            mt: -0.2,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {displayAddress}
                                    </Typography>
                                )}
                                    </>);
                                })()}
                                {/* Venue search popover */}
                                {searchingSlotId === slot.id && (
                                    <ClickAwayListener onClickAway={() => { setSearchingSlotId(null); setSearchQuery(''); setSearchResults([]); }}>
                                        <Box sx={{ position: 'absolute', top: -4, left: -8, right: -8, zIndex: 30 }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                            <Box sx={{
                                                display: 'flex', alignItems: 'center', gap: 0.5,
                                                bgcolor: 'rgba(16,18,22,0.95)', border: '1px solid rgba(245,158,11,0.3)',
                                                borderRadius: '8px', px: 1, py: 0.25,
                                            }}>
                                                <SearchIcon sx={{ fontSize: 14, color: 'rgba(245,158,11,0.5)' }} />
                                                <Box
                                                    component="input"
                                                    type="text"
                                                    autoFocus
                                                    value={searchQuery}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleVenueSearch(e.target.value)}
                                                    onFocus={() => searchResults.length > 0 && setSearchDropdownOpen(true)}
                                                    placeholder="Search venue name or address..."
                                                    sx={{
                                                        flex: 1, border: 'none', outline: 'none',
                                                        bgcolor: 'transparent', color: '#e2e8f0',
                                                        fontSize: '0.72rem', fontFamily: 'inherit',
                                                        py: '4px', '&::placeholder': { color: 'rgba(148,163,184,0.4)' },
                                                    }}
                                                />
                                                {searchLoading ? (
                                                    <CircularProgress size={12} sx={{ color: 'rgba(245,158,11,0.5)' }} />
                                                ) : searchQuery ? (
                                                    <IconButton size="small" onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchDropdownOpen(false); }} sx={{ p: 0.25, color: 'rgba(148,163,184,0.4)' }}>
                                                        <CloseIcon sx={{ fontSize: 12 }} />
                                                    </IconButton>
                                                ) : null}
                                            </Box>
                                            {searchDropdownOpen && searchResults.length > 0 && (
                                                <Box sx={{
                                                    mt: 0.5, bgcolor: 'rgba(16,18,22,0.97)', border: '1px solid rgba(245,158,11,0.2)',
                                                    borderRadius: '8px', maxHeight: 220, overflowY: 'auto', py: 0.5,
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                                }}>
                                                    {searchResults.map((r, idx) => (
                                                        <Box
                                                            key={r.place_id}
                                                            onClick={() => handleVenueSelect(r, slot.id)}
                                                            sx={{
                                                                px: 1.5, py: 1, cursor: 'pointer',
                                                                display: 'flex', alignItems: 'flex-start', gap: 1,
                                                                borderBottom: idx < searchResults.length - 1 ? '1px solid rgba(52,58,68,0.2)' : 'none',
                                                                '&:hover': { bgcolor: 'rgba(245,158,11,0.06)' },
                                                                transition: 'background 0.15s',
                                                            }}
                                                        >
                                                            <PlaceIcon sx={{ fontSize: 14, color: '#f59e0b', mt: 0.25, flexShrink: 0 }} />
                                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                <Typography sx={{ color: '#f1f5f9', fontSize: '0.72rem', fontWeight: 600, lineHeight: 1.3 }}>
                                                                    {r.name || formatShort(r)}
                                                                </Typography>
                                                                <Typography sx={{ color: '#64748b', fontSize: '0.55rem', mt: 0.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {r.display_name}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    </ClickAwayListener>
                                )}
                                {!isInstanceMode && assignedCount > 0 && (
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.55rem', display: 'block', mt: -0.2 }}>
                                        {assignedCount} {assignedCount === 1 ? 'activity' : 'activities'}
                                    </Typography>
                                )}
                                {isInstanceMode && assignedCount > 0 && (
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.55rem', display: 'block', mt: 0.15 }}>
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
        </ScheduleCardShell>
    );
}
