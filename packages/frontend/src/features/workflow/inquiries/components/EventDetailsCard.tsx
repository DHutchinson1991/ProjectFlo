'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
    Box,
    Typography,
    CardContent,
    Stack,
    TextField,
    IconButton,
    Chip,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    Place,
    Edit,
    CheckCircle,
    AccessTime,
    NearMe,
    LocationOff,
    Groups,
    Notes,
} from '@mui/icons-material';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { Inquiry, NeedsAssessmentSubmission } from '@/lib/types';
import { api } from '@/lib/api';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { useBrand } from '@/app/providers/BrandProvider';
import { humanize } from '../lib';
import AddressSearch, { type AddressSelection } from './AddressSearch';

// Dynamic-import the map (Leaflet needs `window`)
const VenueMap = dynamic(() => import('./VenueMap'), { ssr: false });

// Re-use the shared WorkflowCard wrapper from the parent page
interface EventDetailsCardProps {
    inquiry: Inquiry & { activity_logs?: unknown[] };
    onRefresh?: () => Promise<void>;
    isActive?: boolean;
    activeColor?: string;
    submission?: NeedsAssessmentSubmission | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WorkflowCard: React.ComponentType<any>;
}

/* ------------------------------------------------------------------ */
/*  Haversine distance (km) between two lat/lng pairs                  */
/* ------------------------------------------------------------------ */
function haversineKm(
    lat1: number, lng1: number,
    lat2: number, lng2: number,
): number {
    const R = 6371; // Earth radius km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
    const miles = km * 0.621371;
    if (miles < 1) return `${(miles * 5280).toFixed(0)} ft`;
    return `${miles.toFixed(1)} mi`;
}

/* ------------------------------------------------------------------ */
/*  Geocode a brand address string via Nominatim (cached / one-shot)   */
/* ------------------------------------------------------------------ */
const brandGeoCache = new Map<string, { lat: number; lng: number } | null>();

async function geocodeBrandAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    const cached = brandGeoCache.get(address);
    if (cached !== undefined) return cached;
    try {
        const params = new URLSearchParams({ q: address, format: 'json', limit: '1' });
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?${params}`,
            { headers: { Accept: 'application/json', 'User-Agent': 'ProjectFlo/1.0' } },
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (data.length === 0) return null; // Don't cache empty results — address text may change
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        brandGeoCache.set(address, coords);
        return coords;
    } catch (_e) {
        return null;
    }
}

/* ================================================================== */
/*  EventDetailsCard                                                   */
/* ================================================================== */
const EventDetailsCard: React.FC<EventDetailsCardProps> = ({
    inquiry,
    onRefresh,
    isActive,
    activeColor,
    submission,
    WorkflowCard,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const { currentBrand } = useBrand();

    // Event type options
    const [eventTypeOptions, setEventTypeOptions] = useState<{ id: number; name: string }[]>([]);
    const [selectedEventTypeId, setSelectedEventTypeId] = useState<number | null>(inquiry.event_type_id ?? null);

    useEffect(() => {
        api.eventTypes.getAll().then((data: any[]) => setEventTypeOptions(data || [])).catch(() => {});
    }, []);

    useEffect(() => {
        setSelectedEventTypeId(inquiry.event_type_id ?? null);
    }, [inquiry.event_type_id]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responses = (submission?.responses ?? {}) as Record<string, any>;

    // Ceremony location from package schedule location slots
    const [slotsLoading, setSlotsLoading] = useState(true);
    const [ceremonySlot, setCeremonySlot] = useState<{
        id: number; name: string; address: string; lat: number | null; lng: number | null;
        slotIndex: number; totalSlots: number; updatedAt: Date;
        addressFields?: { address_line1?: string; address_line2?: string; city?: string; county?: string; country?: string; postcode?: string };
    } | null>(null);

    useEffect(() => {
        if (!inquiry.id) return;
        api.schedule.instanceLocationSlots.getForInquiry(inquiry.id)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then(async (slots: any[]) => {
                if (!slots || slots.length === 0) return;
                // Check both project_activity and activity_assignments for "Ceremony"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const isCeremony = (s: any) =>
                    s.project_activity?.name?.toLowerCase().includes('ceremony') ||
                    s.activity_assignments?.some((a: any) =>
                        a.project_activity?.name?.toLowerCase().includes('ceremony'),
                    );
                const ceremony = slots.find(isCeremony)
                    || slots.find(s => s.name || s.address || s.location);
                if (!ceremony) return;

                // Build name + address from slot fields AND linked LocationsLibrary
                const loc = ceremony.location;
                const slotName = ceremony.name || loc?.name || '';
                const slotAddr = ceremony.address || '';

                // Build a structured address from location library if available
                let fullAddress = slotAddr;
                let addressFields: { address_line1?: string; address_line2?: string; city?: string; county?: string; country?: string; postcode?: string } | undefined;
                if (loc) {
                    const parts = [
                        loc.address_line1,
                        loc.address_line2,
                        loc.city,
                        loc.state,
                        loc.postal_code,
                    ].filter(Boolean);
                    if (parts.length > 0) {
                        fullAddress = parts.join(', ');
                    }
                    addressFields = {
                        address_line1: loc.address_line1 || undefined,
                        address_line2: loc.address_line2 || undefined,
                        city: loc.city || undefined,
                        county: loc.state || undefined,
                        country: loc.country || undefined,
                        postcode: loc.postal_code || undefined,
                    };
                }

                if (!slotName && !fullAddress) return;

                let lat: number | null = null;
                let lng: number | null = null;
                // Geocode using the best address available
                const addrToGeocode = fullAddress || slotName;
                if (addrToGeocode) {
                    const coords = await geocodeBrandAddress(addrToGeocode);
                    if (coords) { lat = coords.lat; lng = coords.lng; }
                }
                const slotIndex = slots.indexOf(ceremony) + 1;
                setCeremonySlot({
                    id: ceremony.id,
                    name: slotName,
                    address: fullAddress,
                    lat,
                    lng,
                    slotIndex,
                    totalSlots: slots.length,
                    updatedAt: new Date(ceremony.updated_at),
                    addressFields,
                });
            })
            .catch(() => { /* ignore – will fall back to venue_details */ })
            .finally(() => setSlotsLoading(false));
    }, [inquiry.id]);

    const [formData, setFormData] = useState({
        wedding_date: inquiry.event_date
            ? new Date(inquiry.event_date).toISOString().split('T')[0]
            : (responses.wedding_date || ''),
        venue_details: inquiry.venue_details || responses.venue_details || '',
        venue_address: inquiry.venue_address || '',
        venue_lat: inquiry.venue_lat ?? null as number | null,
        venue_lng: inquiry.venue_lng ?? null as number | null,
    });

    // Geocoded coords stored separately so sync effect can't wipe them
    const [geocodedVenueCoords, setGeocodedVenueCoords] = useState<{ lat: number; lng: number } | null>(null);

    // Auto-geocode venue text when DB coords are missing (e.g. portal wizard submissions)
    useEffect(() => {
        if (inquiry.venue_lat != null && inquiry.venue_lng != null) return;
        const addrText = inquiry.venue_address
            || inquiry.venue_details
            || responses.ceremony_location
            || responses.venue_details;
        if (!addrText) return;
        let cancelled = false;
        geocodeBrandAddress(addrText).then((coords) => {
            if (cancelled || !coords) return;
            setGeocodedVenueCoords(coords);
        });
        return () => { cancelled = true; };
    }, [inquiry.venue_lat, inquiry.venue_lng, inquiry.venue_address, inquiry.venue_details, responses.ceremony_location, responses.venue_details]);

    // Brand geo
    const [brandCoords, setBrandCoords] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = (submission?.responses ?? {}) as Record<string, any>;
        setFormData({
            wedding_date: inquiry.event_date
                ? new Date(inquiry.event_date).toISOString().split('T')[0]
                : (r.wedding_date || ''),
            venue_details: inquiry.venue_details || r.venue_details || '',
            venue_address: inquiry.venue_address || '',
            venue_lat: inquiry.venue_lat ?? null,
            venue_lng: inquiry.venue_lng ?? null,
        });
    }, [inquiry, submission]);

    // Geocode brand address once
    useEffect(() => {
        if (!currentBrand) return;
        const parts = [
            currentBrand.address_line1,
            currentBrand.address_line2,
            currentBrand.city,
            currentBrand.state,
            currentBrand.postal_code,
            currentBrand.country,
        ].filter(Boolean);
        if (parts.length === 0) return;
        geocodeBrandAddress(parts.join(', ')).then(setBrandCoords);
    }, [currentBrand]);

    const partnerName = responses.partner_name;
    const guestCount = responses.guest_count;
    const specialRequests = responses.special_requests;
    const birthdayPerson = responses.birthday_person_name;
    const birthdayRelation = responses.birthday_relation;
    const isBirthdayPerson = responses.is_birthday_person;

    // ── Event type + approx date from NA ──
    const eventType = responses.event_type;
    const approxDate = responses.wedding_date_approx;

    // Display coordinates from the ceremony location slot (primary source)
    const displayLat = formData.venue_lat ?? ceremonySlot?.lat ?? geocodedVenueCoords?.lat ?? null;
    const displayLng = formData.venue_lng ?? ceremonySlot?.lng ?? geocodedVenueCoords?.lng ?? null;
    const hasVenueCoords = displayLat != null && displayLng != null;

    const distance = useMemo(() => {
        if (!hasVenueCoords || !brandCoords) return null;
        const km = haversineKm(
            brandCoords.lat, brandCoords.lng,
            displayLat!, displayLng!,
        );
        return formatDistance(km);
    }, [hasVenueCoords, brandCoords, displayLat, displayLng]);

    /* ---- save handler ---- */
    const handleSave = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: any = {};
            if (formData.wedding_date) payload.wedding_date = formData.wedding_date;
            // Save event type FK when changed
            payload.event_type_id = selectedEventTypeId ?? null;
            await inquiriesApi.update(inquiry.id, payload);

            // Sync the ceremony location slot with the new address (venue data lives on location slots now)
            if (ceremonySlot?.id) {
                const shortName = formData.venue_address?.split(',')[0]?.trim() || '';
                await api.schedule.instanceLocationSlots.update(ceremonySlot.id, {
                    name: shortName || null,
                    address: formData.venue_address || null,
                });
                // Update local ceremony slot state so view mode reflects immediately
                const coords = formData.venue_address
                    ? await geocodeBrandAddress(formData.venue_address)
                    : null;
                setCeremonySlot(prev => prev ? {
                    ...prev,
                    name: shortName,
                    address: formData.venue_address || '',
                    lat: coords?.lat ?? null,
                    lng: coords?.lng ?? null,
                } : null);
            }

            setIsEditing(false);
            if (onRefresh) await onRefresh();
        } catch (error) {
            console.error('Failed to update event details:', error);
            alert('Failed to update event details');
        }
    };

    /* ---- address autocomplete callback ---- */
    const handleAddressSelect = (result: AddressSelection | null) => {
        if (result) {
            setFormData((prev) => ({
                ...prev,
                venue_address: result.display_name,
                venue_details: result.display_name.split(',')[0], // Short name
                venue_lat: result.lat,
                venue_lng: result.lng,
            }));
        } else {
            // "Set as unknown"
            setFormData((prev) => ({
                ...prev,
                venue_address: '',
                venue_details: '',
                venue_lat: null,
                venue_lng: null,
            }));
        }
    };

    /* ---- date computations ---- */
    const dateObj = formData.wedding_date ? new Date(formData.wedding_date + 'T00:00:00') : null;
    const monthShort = dateObj ? dateObj.toLocaleDateString(undefined, { month: 'short' }).toUpperCase() : '';
    const dayNum = dateObj ? dateObj.getDate().toString() : '';
    const displayDate = dateObj
        ? dateObj.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })
        : 'Date not set';

    /* ---- short venue label ---- */
    const slotAddress = ceremonySlot?.address || '';
    const slotName = ceremonySlot?.name || '';

    const venueShortName = slotsLoading
        ? ''
        : (slotName || slotAddress.split(',')[0]?.trim() || '');
    const venueFullAddress = slotsLoading
        ? ''
        : (slotAddress || '');
    const venueLabel = ceremonySlot
        ? `Location ${ceremonySlot.slotIndex} of ${ceremonySlot.totalSlots}`
        : 'Venue';

    /* ---- structured address fields for labelled display ---- */
    const structuredAddress: { label: string; value: string }[] = (() => {
        const fields = ceremonySlot?.addressFields;
        if (fields) {
            return [
                fields.address_line1 && { label: 'Street', value: fields.address_line1 },
                fields.address_line2 && { label: 'Street 2', value: fields.address_line2 },
                fields.city && { label: 'City', value: fields.city },
                fields.county && { label: 'County', value: fields.county },
                fields.country && { label: 'Country', value: fields.country },
                fields.postcode && { label: 'Postcode', value: fields.postcode },
            ].filter(Boolean) as { label: string; value: string }[];
        }
        // Fallback: parse comma-separated address into unlabelled parts
        const parts = venueFullAddress
            .split(',')
            .map((p: string) => p.trim())
            .filter(Boolean);
        const filtered = parts[0] === venueShortName ? parts.slice(1) : parts;
        if (filtered.length === 0) return [];
        return filtered.map((p) => ({ label: '', value: p }));
    })();

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent sx={{ p: '0 !important' }}>
                {/* Header */}
                <Box sx={{
                    px: 2.5, pt: 2, pb: 1.5,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid rgba(52, 58, 68, 0.3)',
                    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.06), transparent)',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CelebrationIcon sx={{ color: '#ec4899', fontSize: 20 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em' }}>
                            Event
                        </Typography>
                        {eventType && (
                            <Chip
                                size="small"
                                label={humanize(eventType)}
                                sx={{
                                    height: 20, fontSize: '0.65rem', fontWeight: 700,
                                    bgcolor: 'rgba(236,72,153,0.12)',
                                    color: '#ec4899',
                                    border: '1px solid rgba(236,72,153,0.2)',
                                }}
                            />
                        )}
                    </Box>
                    <IconButton
                        size="small"
                        onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                        sx={{ color: '#94a3b8' }}
                    >
                        {isEditing ? <CheckCircle color="primary" sx={{ fontSize: 20 }} /> : <Edit sx={{ fontSize: 18 }} />}
                    </IconButton>
                </Box>

                {isEditing ? (
                    /* ============ EDIT MODE ============ */
                    <Box sx={{ p: 2.5 }}>
                        <Stack spacing={2.5}>
                            <TextField
                                label="Event Date"
                                type="date"
                                fullWidth
                                size="small"
                                value={formData.wedding_date}
                                onChange={(e) => setFormData({ ...formData, wedding_date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'rgba(15, 23, 42, 0.6)',
                                        color: '#e2e8f0',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(51, 65, 85, 0.4)' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#64748b' },
                                }}
                            />

                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ color: '#64748b' }}>Event Type</InputLabel>
                            <Select
                                label="Event Type"
                                value={selectedEventTypeId ?? ''}
                                onChange={(e) => setSelectedEventTypeId(e.target.value ? Number(e.target.value) : null)}
                                sx={{
                                    bgcolor: 'rgba(15, 23, 42, 0.6)',
                                    color: '#e2e8f0',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(51, 65, 85, 0.4)' },
                                }}
                            >
                                <MenuItem value=""><em>Not set</em></MenuItem>
                                {eventTypeOptions.map((et) => (
                                    <MenuItem key={et.id} value={et.id}>{et.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        </Stack>
                    </Box>
                ) : (
                    /* ============ VIEW MODE ============ */
                    <>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        minHeight: hasVenueCoords ? 220 : 'auto',
                    }}>
                        {/* LEFT — Date & Quick Info */}
                        <Box sx={{
                            flex: '0 0 auto',
                            width: { xs: '100%', sm: hasVenueCoords ? '45%' : '100%' },
                            p: 2.5,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                        }}>
                            {/* Date display */}
                            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                                {dateObj ? (
                                    <Box sx={{
                                        width: 56, minWidth: 56, height: 56, borderRadius: 2.5,
                                        background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 4px 12px rgba(236, 72, 153, 0.25)',
                                    }}>
                                        <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1 }}>
                                            {monthShort}
                                        </Typography>
                                        <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                                            {dayNum}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{
                                        width: 56, minWidth: 56, height: 56, borderRadius: 2.5,
                                        bgcolor: 'rgba(100, 116, 139, 0.1)',
                                        border: '2px dashed rgba(100, 116, 139, 0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <AccessTime sx={{ color: '#475569', fontSize: 20 }} />
                                    </Box>
                                )}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem', lineHeight: 1.3 }}>
                                        {displayDate}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.25 }}>
                                        Event Date
                                    </Typography>
                                    {!dateObj && approxDate && (
                                        <Typography sx={{ fontSize: '0.72rem', color: '#f59e0b', mt: 0.25 }}>
                                            Approx: {approxDate}
                                        </Typography>
                                    )}
                                </Box>
                                {guestCount && (
                                    <Box sx={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        gap: 0.4, flexShrink: 0, pl: 1.5,
                                        borderLeft: '1px solid rgba(100,116,139,0.2)',
                                    }}>
                                        <Groups sx={{ fontSize: 22, color: '#06b6d4' }} />
                                        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#e2e8f0', lineHeight: 1 }}>
                                            {guestCount}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.6rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>
                                            Guests
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Venue / Ceremony location row (when no map) */}
                            {!hasVenueCoords && (
                                <Box sx={{
                                    display: 'flex', alignItems: 'flex-start', gap: 1.5,
                                    borderLeft: '2px solid rgba(100,116,139,0.2)',
                                    pl: 1.5,
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.15, flexShrink: 0 }}>
                                        {venueShortName
                                            ? <Place sx={{ fontSize: 14, color: '#64748b' }} />
                                            : <LocationOff sx={{ fontSize: 14, color: '#475569' }} />}
                                    </Box>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.25 }}>
                                            {venueLabel}
                                        </Typography>
                                        {venueShortName ? (
                                            <>
                                                <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3 }}>
                                                    {venueShortName}
                                                </Typography>
                                                {structuredAddress.length > 0 && (
                                                    <Stack spacing={0.2} sx={{ mt: 0.5 }}>
                                                        {structuredAddress.map((field, i) => (
                                                            <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                                                                {field.label && (
                                                                    <Typography sx={{ fontSize: '0.62rem', color: '#475569', fontWeight: 600, minWidth: 52, flexShrink: 0 }}>
                                                                        {field.label}
                                                                    </Typography>
                                                                )}
                                                                <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4 }}>
                                                                    {field.value}
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                )}
                                            </>
                                        ) : (
                                            <Typography sx={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500, fontStyle: 'italic' }}>
                                                Location unknown
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            )}

                            {/* Venue name + address when map is shown */}
                            {hasVenueCoords && (
                                <Box sx={{
                                    display: 'flex', alignItems: 'flex-start', gap: 1.5,
                                    borderLeft: '2px solid rgba(100,116,139,0.2)',
                                    pl: 1.5,
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.15, flexShrink: 0 }}>
                                        <Place sx={{ fontSize: 14, color: '#64748b' }} />
                                    </Box>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.25 }}>
                                            {venueLabel}
                                        </Typography>
                                        {venueShortName && (
                                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3 }}>
                                                {venueShortName}
                                            </Typography>
                                        )}
                                        {structuredAddress.length > 0 && (
                                            <Stack spacing={0.2} sx={{ mt: 0.5 }}>
                                                {structuredAddress.map((field, i) => (
                                                    <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                                                        {field.label && (
                                                            <Typography sx={{ fontSize: '0.62rem', color: '#475569', fontWeight: 600, minWidth: 52, flexShrink: 0 }}>
                                                                {field.label}
                                                            </Typography>
                                                        )}
                                                        <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4 }}>
                                                            {field.value}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        )}
                                        {distance && (
                                            <Chip
                                                icon={<NearMe sx={{ fontSize: 12 }} />}
                                                label={distance}
                                                size="small"
                                                sx={{
                                                    mt: 1,
                                                    height: 22,
                                                    bgcolor: 'rgba(59, 130, 246, 0.08)',
                                                    border: '1px solid rgba(59, 130, 246, 0.15)',
                                                    color: '#60a5fa',
                                                    fontSize: '0.68rem',
                                                    fontWeight: 600,
                                                    '& .MuiChip-icon': { color: '#60a5fa' },
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        {/* RIGHT — Map */}
                        {hasVenueCoords && (
                            <Box sx={{
                                flex: 1,
                                minWidth: 0,
                                p: 1,
                                display: 'flex',
                                flexDirection: 'column',
                            }}>
                                <Box sx={{
                                    flex: 1,
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.88))',
                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 14px 30px rgba(2, 6, 23, 0.26)',
                                    minHeight: 180,
                                    p: 0.35,
                                }}>
                                    <VenueMap
                                        lat={displayLat!}
                                        lng={displayLng!}
                                        height="100%"
                                    />
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {/* ── Partner / birthday / notes summary ── */}
                    {(partnerName || specialRequests || birthdayPerson || isBirthdayPerson === 'yes') && (
                        <Box sx={{ px: 2.5, py: 1.75, borderTop: '1px solid rgba(52, 58, 68, 0.3)' }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.2 }}>
                                {partnerName && (
                                    <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.1)' }}>
                                        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.4 }}>
                                            Partner
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>
                                            {partnerName}
                                        </Typography>
                                    </Box>
                                )}

                                {(birthdayPerson || isBirthdayPerson === 'yes') && (
                                    <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.1)' }}>
                                        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.4 }}>
                                            Birthday Person
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>
                                            {birthdayPerson
                                                ? `${birthdayPerson}${birthdayRelation ? ` (${birthdayRelation})` : ''}`
                                                : 'Contact is the birthday person'}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {specialRequests && (
                                <Box sx={{ mt: 1.2, p: 1.2, borderRadius: 2, bgcolor: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.08)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.45 }}>
                                        <Notes sx={{ fontSize: 14, color: '#94a3b8' }} />
                                        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Special Requests
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                                        {specialRequests}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                    </>
                )}
            </CardContent>
        </WorkflowCard>
    );
};

export default EventDetailsCard;
