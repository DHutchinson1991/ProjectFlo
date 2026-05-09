'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    Box, Typography, Button,
    IconButton, ClickAwayListener,
    CircularProgress, Checkbox,
    Table, TableBody, TableCell, TableHead, TableRow,
    Tooltip,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import type { EventDay } from '@/features/workflow/scheduling/package-template';
import type {
    PackageActivityRecord,
    PackageLocationSlotRecord,
    PackageSpaceSlotRecord,
    SpaceType,
} from '../../../types';

import { searchVenues, type NominatimResult } from '@/features/workflow/locations/api/geocoding.api';
import { locationsApi } from '@/features/workflow/locations/api';
import type { LocationsLibrary } from '@/features/workflow/locations/types';
import { scheduleApi } from '@/features/workflow/scheduling/package-template';
import { useOptionalScheduleApi } from '@/features/workflow/scheduling/shared';
import { detailGlassCardSx, detailHeaderCellSx, detailBodyCellSx } from '../detail-tokens';


/* ================================================================== */
/*  Space-type label map                                               */
/* ================================================================== */
const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
    CEREMONY_AREA: 'Ceremony', RECEPTION_HALL: 'Reception', BRIDAL_SUITE: 'Bridal Suite',
    GROOM_SUITE: 'Groom Suite', GETTING_READY_ROOM: 'Getting Ready', OUTDOOR_AREA: 'Outdoor',
    COCKTAIL_AREA: 'Cocktail', DINING_AREA: 'Dining', DANCE_FLOOR: 'Dance Floor',
    ENTRANCE_HALL: 'Entrance', GARDEN: 'Garden', TERRACE: 'Terrace', CHAPEL: 'Chapel',
    LOUNGE: 'Lounge', LIBRARY: 'Library', PRIVATE_ROOM: 'Private', OTHER: 'Other',
};

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
    cardSx?: SxProps<Theme>;
    selectedLocationSlotId?: number | null;
    selectedSpaceSlotId?: number | null;
    onSelectLocation?: (id: number | null) => void;
    onSelectSpace?: (id: number | null) => void;
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
    selectedLocationSlotId,
    selectedSpaceSlotId,
    onSelectLocation,
    onSelectSpace,
}: LocationsCardProps) {
    // ─── ScheduleApi adapter ─────────────────────────────────────────
    const contextApi = useOptionalScheduleApi();
    const locationApi = contextApi?.locationSlots ?? {
        create: (dayId: number, data?: any) => scheduleApi.packageLocationSlots.create(packageId!, { event_day_template_id: dayId, ...data }), // eslint-disable-line @typescript-eslint/no-explicit-any
        update: (slotId: number, data: any) => scheduleApi.packageLocationSlots.update(slotId, data), // eslint-disable-line @typescript-eslint/no-explicit-any
        delete: (id: number) => scheduleApi.packageLocationSlots.delete(id),
        assignActivity: (slotId: number, activityId: number) => scheduleApi.packageLocationSlots.assignActivity(slotId, activityId),
        unassignActivity: (slotId: number, activityId: number) => scheduleApi.packageLocationSlots.unassignActivity(slotId, activityId),
    };
    const spaceApi = contextApi?.spaceSlots ?? {
        create: (dayId: number, data: any) => scheduleApi.packageSpaceSlots.create(packageId!, { event_day_template_id: dayId, ...data }), // eslint-disable-line @typescript-eslint/no-explicit-any
        update: (slotId: number, data: any) => scheduleApi.packageSpaceSlots.update(slotId, data), // eslint-disable-line @typescript-eslint/no-explicit-any
        delete: (slotId: number) => scheduleApi.packageSpaceSlots.delete(slotId),
        assignActivity: (slotId: number, activityId: number) => scheduleApi.packageSpaceSlots.assignActivity(slotId, activityId),
        unassignActivity: (slotId: number, activityId: number) => scheduleApi.packageSpaceSlots.unassignActivity(slotId, activityId),
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

    // ─── Space label editing state ───────────────────────────────────
    const [editingSpaceId, setEditingSpaceId] = useState<number | null>(null);
    const [editingSpaceLabel, setEditingSpaceLabel] = useState('');
    const [addingSpaceForSlotId, setAddingSpaceForSlotId] = useState<number | null>(null);
    const [newSpaceLabel, setNewSpaceLabel] = useState('');

    // ─── Venue library link state ────────────────────────────────────
    const [linkingVenueSlotId, setLinkingVenueSlotId] = useState<number | null>(null);
    const [venueSearchQuery, setVenueSearchQuery] = useState('');
    const [venueResults, setVenueResults] = useState<LocationsLibrary[]>([]);
    const [venueSearchLoading, setVenueSearchLoading] = useState(false);
    const [importingSlotId, setImportingSlotId] = useState<number | null>(null);

    // ─── Space slot editor state ─────────────────────────────────────


    const startEditSpaceLabel = useCallback((spaceId: number, currentLabel: string) => {
        setEditingSpaceId(spaceId);
        setEditingSpaceLabel(currentLabel);
    }, []);

    const refreshSlots = useCallback(async () => {
        if (packageId) {
            const slots = await scheduleApi.packageLocationSlots.getAll(packageId) as unknown as PackageLocationSlotRecord[];
            setPackageLocationSlots(slots || []);
        }
    }, [packageId, setPackageLocationSlots]);

    const commitSpaceLabel = useCallback(async (spaceId: number) => {
        const trimmed = editingSpaceLabel.trim();
        setEditingSpaceId(null);
        if (!trimmed) return;
        try {
            await spaceApi.update(spaceId, { label: trimmed });
            await refreshSlots();
        } catch (err) { console.error('Failed to update space label:', err); }
    }, [editingSpaceLabel, spaceApi, refreshSlots]);

    const commitNewSpace = useCallback(async (slotId: number, dayId: number) => {
        const trimmed = newSpaceLabel.trim();
        setAddingSpaceForSlotId(null);
        setNewSpaceLabel('');
        if (!trimmed) return;
        try {
            await spaceApi.create(dayId, { label: trimmed, location_slot_id: slotId });
            await refreshSlots();
        } catch (err) { console.error('Failed to create space:', err); }
    }, [newSpaceLabel, spaceApi, refreshSlots]);

    // ─── Venue library search (for linking) ──────────────────────────
    const venueDebounceRef = useRef<number | null>(null);

    const handleVenueLibrarySearch = useCallback((q: string) => {
        setVenueSearchQuery(q);
        if (venueDebounceRef.current) clearTimeout(venueDebounceRef.current);
        if (q.length < 2) { setVenueResults([]); return; }
        setVenueSearchLoading(true);
        venueDebounceRef.current = window.setTimeout(async () => {
            try {
                const results = await locationsApi.getAll({ search: q });
                setVenueResults(results);
            } catch { setVenueResults([]); }
            setVenueSearchLoading(false);
        }, 300);
    }, []);

    const handleLinkVenue = useCallback(async (slotId: number, venue: LocationsLibrary) => {
        setLinkingVenueSlotId(null);
        setVenueSearchQuery('');
        setVenueResults([]);
        if (!packageId) return;
        // Auto-import spaces from the linked venue
        setImportingSlotId(slotId);
        try {
            await scheduleApi.packageSpaceSlots.importFromVenue(packageId, slotId, venue.id);
            await refreshSlots();
        } catch (err) { console.error('Failed to import venue spaces:', err); }
        setImportingSlotId(null);
    }, [packageId, refreshSlots]);

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
    const daySlots = packageLocationSlots.filter((s: any) => s.event_day_template_id === activeEventDayId); // eslint-disable-line @typescript-eslint/no-explicit-any
    const maxSlots = 5;
    const showVenueCol = daySlots.some((s: any) => s.mode !== 'SANDBOX'); // eslint-disable-line @typescript-eslint/no-explicit-any
    const totalCols = 3 + (selectedActivityId ? 1 : 0) + (showVenueCol ? 1 : 0); // Location + Mode + Actions + optional checkbox + optional venue

    // Detect orphaned activities (assigned to location but no space)
    const orphansBySlot = useMemo(() => {
        const map = new Map<number, Array<{ id: number; name: string }>>();
        for (const slot of daySlots) {
            const assigns: Array<{ package_activity_id: number }> = (slot as any).activity_assignments ?? [];
            const spaces: PackageSpaceSlotRecord[] = (slot as any).space_slots ?? [];
            const orphans: Array<{ id: number; name: string }> = [];
            for (const a of assigns) {
                const hasSpace = spaces.some((sp) => sp.activity_assignments?.some((sa) => sa.package_activity_id === a.package_activity_id));
                if (!hasSpace) {
                    const act = packageActivities.find((pa) => pa.id === a.package_activity_id);
                    if (act) orphans.push({ id: act.id, name: act.name });
                }
            }
            if (orphans.length > 0) map.set(slot.id, orphans);
        }
        return map;
    }, [daySlots, packageActivities]);

    // Flatten all space slots from all location slots on this day
    const hCellSx = detailHeaderCellSx;
    const bCellSx = detailBodyCellSx;

    // ─── Render ──────────────────────────────────────────────────────
    return (
        <>
        <Box sx={detailGlassCardSx}>
            {/* ── Section header ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.01em' }}>
                    Locations
                </Typography>
                {selectedActivity && (
                    <Typography sx={{ fontSize: '0.55rem', color: selectedActivity.color || '#f59e0b', fontWeight: 600 }}>Filtering: {selectedActivity.name}</Typography>
                )}
                {hasOwner && packageEventDays.length > 0 && daySlots.length < maxSlots && (
                    <Box sx={{ ml: 'auto' }}>
                        <IconButton
                            size="small"
                            onClick={async () => {
                                if (!activeEventDayId || !hasOwner) return;
                                try {
                                    const created = await locationApi.create(activeEventDayId);
                                    setPackageLocationSlots(prev => [...prev, created]);
                                } catch (err) { console.warn('Failed to add location slot:', err); }
                            }}
                            sx={{ p: 0.25, color: '#64748b', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                        >
                            <AddIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Box>
                )}
            </Box>

            {/* ── Locations table ── */}
            {daySlots.length > 0 ? (
                <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <colgroup>
                        {[
                            selectedActivityId ? <col key="activity" style={{ width: 28 }} /> : null,
                            <col key="location" />,
                            <col key="mode" style={{ width: '18%' }} />,
                            showVenueCol ? <col key="venue" style={{ width: '28%' }} /> : null,
                            <col key="actions" style={{ width: 36 }} />,
                        ]}
                    </colgroup>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                            {selectedActivityId && <TableCell sx={{ ...hCellSx, width: 28, p: 0 }} />}
                            <TableCell sx={hCellSx}>Location</TableCell>
                            <TableCell sx={hCellSx}>Mode</TableCell>
                            {showVenueCol && <TableCell sx={hCellSx}>Venue</TableCell>}
                            <TableCell sx={hCellSx} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {daySlots.map((slot: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                            const assigned = !selectedActivityId || slot.activity_assignments?.some((a: any) => a.package_activity_id === selectedActivityId); // eslint-disable-line @typescript-eslint/no-explicit-any
                            const slotName: string = (slot as any).name ?? '';
                            const slotAddress: string = (slot as any).address ?? '';
                            const addrFirstPart = slotAddress.split(',')[0]?.trim() || '';
                            const spaceSlots: PackageSpaceSlotRecord[] = slot.space_slots ?? [];

                            let displayName = '';
                            let displayAddress = slotAddress;
                            if (addrFirstPart && addrFirstPart !== slotName && !/^\d/.test(addrFirstPart)) {
                                displayName = addrFirstPart;
                                displayAddress = slotAddress.slice(addrFirstPart.length).replace(/^[,\s]+/, '');
                            } else if (slotName && !slotName.includes(',')) {
                                displayName = slotName;
                                if (displayAddress.startsWith(slotName)) displayAddress = displayAddress.slice(slotName.length).replace(/^[,\s]+/, '');
                            } else if (slotName) {
                                displayName = slotName.split(',')[0].trim();
                                displayAddress = slotAddress || slotName.slice(displayName.length).replace(/^[,\s]+/, '');
                            }

                            return (
                                <React.Fragment key={slot.id}>
                                    {/* ── Main location row ── */}
                                    <TableRow
                                        onClick={() => onSelectLocation?.(selectedLocationSlotId === slot.id ? null : slot.id)}
                                        sx={{
                                            opacity: assigned ? 1 : 0.3,
                                            cursor: onSelectLocation ? 'pointer' : undefined,
                                            transition: 'all 0.2s ease',
                                            ...(selectedLocationSlotId === slot.id && { bgcolor: 'rgba(16,185,129,0.08)' }),
                                            '&:hover': {
                                                bgcolor: selectedLocationSlotId === slot.id ? 'rgba(16,185,129,0.12)' : 'rgba(245, 158, 11, 0.04)',
                                                '& .slot-actions': { opacity: 1 },
                                            },
                                        }}
                                    >
                                        {/* Assignment checkbox */}
                                        {selectedActivityId && (
                                            <TableCell sx={{ ...bCellSx, p: 0, textAlign: 'center' }}>
                                                <Checkbox
                                                    checked={assigned}
                                                    onChange={async () => {
                                                        if (!hasOwner) return;
                                                        try {
                                                            if (assigned) {
                                                                const updated = await locationApi.unassignActivity(slot.id, selectedActivityId);
                                                                setPackageLocationSlots(prev => prev.map((s: any) => s.id === slot.id ? { ...s, ...updated } : s));
                                                            } else {
                                                                const updated = await locationApi.assignActivity(slot.id, selectedActivityId);
                                                                setPackageLocationSlots(prev => prev.map((s: any) => s.id === slot.id ? { ...s, ...updated } : s));
                                                            }
                                                        } catch (err) { console.warn('Failed to toggle location slot:', err); }
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    size="small"
                                                    sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 15 }, color: 'rgba(255,255,255,0.15)', '&.Mui-checked': { color: selectedActivity?.color || '#f59e0b' } }}
                                                />
                                            </TableCell>
                                        )}
                                        {/* Location label */}
                                        <TableCell sx={{ ...bCellSx, color: '#f1f5f9', fontWeight: 600, position: 'relative' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {`Location ${slot.location_number}`}
                                            </Box>
                                            {/* Venue search overlay (anchored to Location cell) */}
                                            {searchingSlotId === slot.id && (
                                                <ClickAwayListener onClickAway={() => { setSearchingSlotId(null); setSearchQuery(''); setSearchResults([]); }}>
                                                    <Box sx={{ position: 'absolute', top: -4, left: -8, right: -8, zIndex: 30 }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(16,18,22,0.95)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', px: 1, py: 0.25 }}>
                                                            <SearchIcon sx={{ fontSize: 14, color: 'rgba(245,158,11,0.5)' }} />
                                                            <Box component="input" type="text" autoFocus value={searchQuery}
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleVenueSearch(e.target.value)}
                                                                onFocus={() => searchResults.length > 0 && setSearchDropdownOpen(true)}
                                                                placeholder="Search venue name or address..."
                                                                sx={{ flex: 1, border: 'none', outline: 'none', bgcolor: 'transparent', color: '#e2e8f0', fontSize: '0.72rem', fontFamily: 'inherit', py: '4px', '&::placeholder': { color: 'rgba(148,163,184,0.4)' } }}
                                                            />
                                                            {searchLoading ? <CircularProgress size={12} sx={{ color: 'rgba(245,158,11,0.5)' }} /> : searchQuery ? (
                                                                <IconButton size="small" onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchDropdownOpen(false); }} sx={{ p: 0.25, color: 'rgba(148,163,184,0.4)' }}><CloseIcon sx={{ fontSize: 12 }} /></IconButton>
                                                            ) : null}
                                                        </Box>
                                                        {searchDropdownOpen && searchResults.length > 0 && (
                                                            <Box sx={{ mt: 0.5, bgcolor: 'rgba(16,18,22,0.97)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', maxHeight: 220, overflowY: 'auto', py: 0.5, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                                                                {searchResults.map((r, idx) => (
                                                                    <Box key={r.place_id} onClick={() => handleVenueSelect(r, slot.id)} sx={{ px: 1.5, py: 1, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 1, borderBottom: idx < searchResults.length - 1 ? '1px solid rgba(52,58,68,0.2)' : 'none', '&:hover': { bgcolor: 'rgba(245,158,11,0.06)' }, transition: 'background 0.15s' }}>
                                                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                            <Typography sx={{ color: '#f1f5f9', fontSize: '0.72rem', fontWeight: 600, lineHeight: 1.3 }}>{r.name || formatShort(r)}</Typography>
                                                                            <Typography sx={{ color: '#64748b', fontSize: '0.55rem', mt: 0.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display_name}</Typography>
                                                                        </Box>
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </ClickAwayListener>
                                            )}
                                        </TableCell>
                                        {/* Mode */}
                                        <TableCell sx={{ ...bCellSx, color: '#64748b', fontSize: '0.65rem' }}>
                                            {slot.mode === 'SANDBOX' ? 'Sandbox' : displayName ? 'Venue' : '—'}
                                        </TableCell>
                                        {/* Venue name */}
                                        {showVenueCol && (
                                            <TableCell
                                                sx={{
                                                    ...bCellSx, color: displayName ? '#94a3b8' : 'rgba(255,255,255,0.15)', fontWeight: 400,
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                    ...(isInstanceMode ? { cursor: 'pointer', '&:hover': { color: '#f59e0b' }, transition: 'color 0.15s' } : {}),
                                                }}
                                                onClick={isInstanceMode ? (e: React.MouseEvent) => { e.stopPropagation(); openSearch(slot.id, slotName); } : undefined}
                                            >
                                                {isInstanceMode
                                                    ? (displayName || 'Search...')
                                                    : (displayName || '—')
                                                }
                                            </TableCell>
                                        )}
                                        {/* Actions */}
                                        <TableCell sx={{ ...bCellSx, textAlign: 'center' }}>
                                            <Box className="slot-actions" sx={{ opacity: 0, transition: 'opacity 0.15s', display: 'flex', justifyContent: 'center', gap: 0.25 }}>
                                                {hasOwner && (
                                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAddingSpaceForSlotId(slot.id); setNewSpaceLabel(''); }} sx={{ p: 0.25, color: 'rgba(167,139,250,0.4)', '&:hover': { color: '#a78bfa' } }}>
                                                        <AddIcon sx={{ fontSize: 12 }} />
                                                    </IconButton>
                                                )}
                                                {isInstanceMode && (
                                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); openSearch(slot.id, slotName); }} sx={{ p: 0.25, color: 'rgba(245,158,11,0.5)', '&:hover': { color: '#f59e0b' } }}>
                                                        <SearchIcon sx={{ fontSize: 12 }} />
                                                    </IconButton>
                                                )}
                                                <IconButton size="small" onClick={async (e) => { e.stopPropagation(); try { await locationApi.delete(slot.id); setPackageLocationSlots(prev => prev.filter((s: any) => s.id !== slot.id)); } catch (err) { console.warn('Failed to remove location slot:', err); } }} sx={{ p: 0.25, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}>{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                                                    <DeleteIcon sx={{ fontSize: 12 }} />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>

                                    {/* ── Orphan banner ── */}
                                    {orphansBySlot.has(slot.id) && (
                                        <TableRow>
                                            <TableCell colSpan={totalCols} sx={{ py: 0.5, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, bgcolor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '6px', px: 1, py: 0.5 }}>
                                                    <WarningAmberRoundedIcon sx={{ fontSize: 13, color: '#f59e0b' }} />
                                                    <Typography sx={{ fontSize: '0.6rem', color: '#f59e0b', fontWeight: 500, flex: 1 }}>
                                                        {orphansBySlot.get(slot.id)!.map(o => o.name).join(', ')} {orphansBySlot.get(slot.id)!.length === 1 ? 'has' : 'have'} no planning space
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (!activeEventDayId || !hasOwner) return;
                                                            // First try: just refresh — the backend self-heal will create missing spaces
                                                            await refreshSlots();
                                                            // Check if orphans still exist after refresh (backend may not be updated yet)
                                                            const freshSlots = packageLocationSlots.filter((s: any) => s.id === slot.id);
                                                            const freshSpaces: PackageSpaceSlotRecord[] = (freshSlots[0] as any)?.space_slots ?? [];
                                                            for (const orphan of orphansBySlot.get(slot.id) ?? []) {
                                                                const stillOrphan = !freshSpaces.some((sp) => sp.activity_assignments?.some((sa) => sa.package_activity_id === orphan.id));
                                                                if (!stillOrphan) continue;
                                                                const label = packageActivities.find(a => a.id === orphan.id)?.location_label || `${orphan.name} Space`;
                                                                // Find existing space with this label (may be orphaned with no location_slot_id)
                                                                const existingSpace = freshSpaces.find((sp: PackageSpaceSlotRecord) => sp.label === label);
                                                                if (existingSpace) {
                                                                    try { await spaceApi.assignActivity(existingSpace.id, orphan.id); } catch { /* ignore */ }
                                                                } else {
                                                                    try {
                                                                        const created = await spaceApi.create(activeEventDayId, { label, location_slot_id: slot.id });
                                                                        if (created?.id) {
                                                                            try { await spaceApi.assignActivity(created.id, orphan.id); } catch { /* ignore */ }
                                                                        }
                                                                    } catch { /* label collision — the refresh will pick it up */ }
                                                                }
                                                            }
                                                            await refreshSlots();
                                                        }}
                                                        sx={{ fontSize: '0.55rem', color: '#f59e0b', textTransform: 'none', fontWeight: 700, py: 0, px: 0.75, minWidth: 0, '&:hover': { bgcolor: 'rgba(245,158,11,0.1)' } }}
                                                    >
                                                        Create {orphansBySlot.get(slot.id)!.length === 1 ? 'Space' : 'Spaces'}
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {/* ── Space slots sub-rows ── */}
                                    {spaceSlots.map((space: PackageSpaceSlotRecord) => {
                                        const spaceAssigned = !selectedActivityId || space.activity_assignments?.some((a) => a.package_activity_id === selectedActivityId);

                                        return (
                                            <TableRow
                                                key={space.id}
                                                onClick={() => onSelectSpace?.(selectedSpaceSlotId === space.id ? null : space.id)}
                                                sx={{
                                                    opacity: spaceAssigned ? 1 : 0.3,
                                                    cursor: onSelectSpace ? 'pointer' : undefined,
                                                    transition: 'all 0.2s ease',
                                                    ...(selectedSpaceSlotId === space.id && { bgcolor: 'rgba(20,184,166,0.08)' }),
                                                    '&:hover': {
                                                        bgcolor: selectedSpaceSlotId === space.id ? 'rgba(20,184,166,0.12)' : 'rgba(167,139,250,0.04)',
                                                        '& .space-actions': { opacity: 1 },
                                                    },
                                                }}
                                            >
                                                {/* Space assignment checkbox */}
                                                {selectedActivityId && (
                                                    <TableCell sx={{ ...bCellSx, p: 0, textAlign: 'center' }}>
                                                        <Checkbox
                                                            checked={spaceAssigned}
                                                            onChange={async () => {
                                                                if (!hasOwner) return;
                                                                try {
                                                                    if (spaceAssigned) { await spaceApi.unassignActivity(space.id, selectedActivityId); }
                                                                    else { await spaceApi.assignActivity(space.id, selectedActivityId); }
                                                                    await refreshSlots();
                                                                } catch (err) { console.warn('Failed to toggle space slot:', err); }
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            size="small"
                                                            sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 13 }, color: 'rgba(255,255,255,0.15)', '&.Mui-checked': { color: selectedActivity?.color || '#f59e0b' } }}
                                                        />
                                                    </TableCell>
                                                )}
                                                {/* Space label — indented */}
                                                <TableCell sx={{ ...bCellSx, pl: 3 }} colSpan={showVenueCol ? 3 : 2}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>
                                                        {editingSpaceId === space.id ? (
                                                            <ClickAwayListener onClickAway={() => commitSpaceLabel(space.id)}>
                                                                <Box
                                                                    component="input"
                                                                    autoFocus
                                                                    value={editingSpaceLabel}
                                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingSpaceLabel(e.target.value)}
                                                                    onKeyDown={(e: React.KeyboardEvent) => {
                                                                        if (e.key === 'Enter') commitSpaceLabel(space.id);
                                                                        if (e.key === 'Escape') setEditingSpaceId(null);
                                                                    }}
                                                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                                    placeholder="e.g. Ceremony Space"
                                                                    sx={{
                                                                        flex: 1, border: 'none', outline: 'none',
                                                                        bgcolor: 'rgba(255,255,255,0.04)', color: '#e2e8f0',
                                                                        fontSize: '0.65rem', fontWeight: 500, fontFamily: 'inherit',
                                                                        borderRadius: '3px', px: 0.5, py: '2px',
                                                                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                                                                        '&::placeholder': { color: 'rgba(148,163,184,0.35)', fontWeight: 400, fontStyle: 'italic' },
                                                                    }}
                                                                />
                                                            </ClickAwayListener>
                                                        ) : (
                                                            <Typography
                                                                variant="body2"
                                                                component="div"
                                                                onDoubleClick={(e: React.MouseEvent) => { e.stopPropagation(); if (hasOwner) startEditSpaceLabel(space.id, space.label); }}
                                                                sx={{ fontWeight: 500, fontSize: '0.65rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: hasOwner ? 'text' : 'default', display: 'flex', alignItems: 'center', gap: 0.5 }}
                                                            >
                                                                {space.label}
                                                                {(space.type_tags?.length ?? 0) > 0 && space.type_tags!.map((tag) => (
                                                                    <Box key={tag.id} component="span" sx={{ fontSize: '0.45rem', fontWeight: 600, color: 'rgba(167,139,250,0.5)', bgcolor: 'rgba(167,139,250,0.08)', borderRadius: '3px', px: 0.4, py: '1px', lineHeight: 1.2 }}>
                                                                        {SPACE_TYPE_LABELS[tag.space_type as SpaceType] ?? tag.space_type}
                                                                    </Box>
                                                                ))}
                                                                {(space.type_tags?.length ?? 0) > 0 && (
                                                                    <Box component="span" sx={{ fontSize: '0.42rem', fontWeight: 600, color: 'rgba(139,92,246,0.45)', bgcolor: 'rgba(139,92,246,0.06)', borderRadius: '3px', px: 0.4, py: '1px', lineHeight: 1.2, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                                                        📐 Preset
                                                                    </Box>
                                                                )}
                                                                {space.location_space_id && (
                                                                    <Box component="span" sx={{ fontSize: '0.45rem', color: 'rgba(245,158,11,0.4)' }}>🔗</Box>
                                                                )}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                {/* Space actions */}
                                                <TableCell sx={{ ...bCellSx, textAlign: 'center' }}>
                                                    <Box className="space-actions" sx={{ opacity: 0, transition: 'opacity 0.15s', display: 'flex', justifyContent: 'center', gap: 0.25 }}>

                                                        <IconButton size="small" onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                await spaceApi.delete(space.id);
                                                                await refreshSlots();
                                                            } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                                                                const msg = err?.response?.data?.message || err?.message || '';
                                                                if (msg.includes('no planning space') || msg.includes('Cannot delete')) {
                                                                    alert(msg);
                                                                } else {
                                                                    console.warn('Failed to remove space slot:', err);
                                                                }
                                                            }
                                                        }} sx={{ p: 0.15, color: 'rgba(255,255,255,0.15)', '&:hover': { color: '#ef4444' } }}>
                                                            <DeleteIcon sx={{ fontSize: 9 }} />
                                                        </IconButton>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}

                                    {/* Add Space inline input row */}
                                    {addingSpaceForSlotId === slot.id && (
                                        <TableRow>
                                            <TableCell sx={{ ...bCellSx, pl: 3 }} colSpan={totalCols - (selectedActivityId ? 1 : 0) - 1}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                    <ClickAwayListener onClickAway={() => commitNewSpace(slot.id, slot.event_day_template_id)}>
                                                        <Box
                                                            component="input"
                                                            autoFocus
                                                            value={newSpaceLabel}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSpaceLabel(e.target.value)}
                                                            onKeyDown={(e: React.KeyboardEvent) => {
                                                                if (e.key === 'Enter') commitNewSpace(slot.id, slot.event_day_template_id);
                                                                if (e.key === 'Escape') { setAddingSpaceForSlotId(null); setNewSpaceLabel(''); }
                                                            }}
                                                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                            placeholder="e.g. Ceremony Space"
                                                            sx={{
                                                                flex: 1, border: 'none', outline: 'none',
                                                                bgcolor: 'rgba(167,139,250,0.06)', color: '#e2e8f0',
                                                                fontSize: '0.65rem', fontWeight: 500, fontFamily: 'inherit',
                                                                borderRadius: '3px', px: 0.5, py: '2px',
                                                                borderBottom: '1px solid rgba(167,139,250,0.3)',
                                                                '&::placeholder': { color: 'rgba(148,163,184,0.35)', fontWeight: 400, fontStyle: 'italic' },
                                                            }}
                                                        />
                                                    </ClickAwayListener>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={bCellSx} />
                                        </TableRow>
                                    )}


                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            ) : (
                <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontSize: '0.7rem', textAlign: 'center', py: 2 }}>
                    {selectedActivity ? 'No location slots for this day' : 'No location slots — add up to 5'}
                </Typography>
            )}

            {/* Add Location button (when table is empty or below table) */}
            {daySlots.length === 0 && hasOwner && packageEventDays.length > 0 && (
                <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'center' }}>
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
                </Box>
            )}
        </Box>


        </>
    );
}
