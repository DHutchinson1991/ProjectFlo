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
} from '@mui/material';
import {
    Place,
    Edit,
    CheckCircle,
    AccessTime,
    NearMe,
    LocationOff,
} from '@mui/icons-material';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { Inquiry, NeedsAssessmentSubmission } from '@/lib/types';
import { inquiriesService, api } from '@/lib/api';
import { useBrand } from '@/app/providers/BrandProvider';
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
    if (brandGeoCache.has(address)) return brandGeoCache.get(address) ?? null;
    try {
        const params = new URLSearchParams({ q: address, format: 'json', limit: '1' });
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?${params}`,
            { headers: { Accept: 'application/json', 'User-Agent': 'ProjectFlo/1.0' } },
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (data.length === 0) { brandGeoCache.set(address, null); return null; }
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        brandGeoCache.set(address, coords);
        return coords;
    } catch {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responses = (submission?.responses ?? {}) as Record<string, any>;

    // Ceremony location from package schedule location slots
    const [ceremonySlot, setCeremonySlot] = useState<{
        name: string; address: string; lat: number | null; lng: number | null;
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
                    || slots.find(s => s.name || s.address);
                if (ceremony && (ceremony.name || ceremony.address)) {
                    let lat: number | null = null;
                    let lng: number | null = null;
                    // Geocode ceremony address for the map
                    const addrToGeocode = ceremony.address || ceremony.name;
                    if (addrToGeocode) {
                        const coords = await geocodeBrandAddress(addrToGeocode);
                        if (coords) { lat = coords.lat; lng = coords.lng; }
                    }
                    setCeremonySlot({
                        name: ceremony.name || '',
                        address: ceremony.address || '',
                        lat,
                        lng,
                    });
                }
            })
            .catch(() => { /* ignore – will fall back to venue_details */ });
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

    // Display coordinates: prefer geocoded ceremony slot, then inquiry venue
    const displayLat = ceremonySlot?.lat ?? formData.venue_lat;
    const displayLng = ceremonySlot?.lng ?? formData.venue_lng;
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
            payload.venue_details = formData.venue_details;
            payload.venue_address = formData.venue_address || null;
            payload.venue_lat = formData.venue_lat;
            payload.venue_lng = formData.venue_lng;
            await inquiriesService.update(inquiry.id, payload);
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

    /* ---- short venue label (prefer ceremony location slot) ---- */
    const venueShortName = ceremonySlot?.name || formData.venue_details || formData.venue_address?.split(',')[0] || '';
    const venueFullAddress = ceremonySlot?.address || formData.venue_address || '';
    const venueLabel = 'Ceremony Venue';

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

                            <Box>
                                <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {venueLabel}
                                </Typography>
                                <AddressSearch
                                    value={formData.venue_address}
                                    onSelect={handleAddressSelect}
                                />
                            </Box>
                        </Stack>
                    </Box>
                ) : (
                    /* ============ VIEW MODE — Two-column ============ */
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
                                <Box>
                                    <Typography sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem', lineHeight: 1.3 }}>
                                        {displayDate}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.25 }}>
                                        Event Date
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Venue / Ceremony location row (when no map) */}
                            {!hasVenueCoords && (
                                <Box sx={{
                                    display: 'flex', alignItems: 'flex-start', gap: 1.5,
                                    p: 1.25, borderRadius: 2,
                                    bgcolor: venueShortName ? 'rgba(168, 85, 247, 0.06)' : 'rgba(168, 85, 247, 0.04)',
                                    border: '1px solid rgba(168, 85, 247, 0.08)',
                                }}>
                                    <Box sx={{
                                        width: 32, height: 32, borderRadius: 1.5,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        bgcolor: venueShortName ? 'rgba(168, 85, 247, 0.1)' : 'rgba(100, 116, 139, 0.1)', flexShrink: 0,
                                        mt: 0.25,
                                    }}>
                                        {venueShortName
                                            ? <Place sx={{ fontSize: 16, color: '#a855f7' }} />
                                            : <LocationOff sx={{ fontSize: 16, color: '#64748b' }} />}
                                    </Box>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {venueLabel}
                                        </Typography>
                                        {venueShortName ? (
                                            <>
                                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3 }}>
                                                    {venueShortName}
                                                </Typography>
                                                {venueFullAddress && venueFullAddress !== venueShortName && (
                                                    <Typography sx={{
                                                        fontSize: '0.7rem', color: '#64748b', mt: 0.25, lineHeight: 1.35,
                                                        overflow: 'hidden', textOverflow: 'ellipsis',
                                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                                    }}>
                                                        {venueFullAddress}
                                                    </Typography>
                                                )}
                                            </>
                                        ) : (
                                            <Typography sx={{ fontSize: '0.82rem', color: '#475569', fontWeight: 500, fontStyle: 'italic' }}>
                                                Location unknown
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            )}

                            {/* Venue name + address when map is shown */}
                            {hasVenueCoords && (
                                <Box sx={{ mt: 0.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                        <Place sx={{ fontSize: 16, color: '#a855f7', mt: 0.2, flexShrink: 0 }} />
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            {venueShortName && (
                                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3 }}>
                                                    {venueShortName}
                                                </Typography>
                                            )}
                                            {venueFullAddress && venueFullAddress !== venueShortName && (
                                                <Typography sx={{
                                                    fontSize: '0.7rem', color: '#64748b', mt: 0.25, lineHeight: 1.35,
                                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                                }}>
                                                    {venueFullAddress}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    {distance && (
                                        <Chip
                                            icon={<NearMe sx={{ fontSize: 12 }} />}
                                            label={distance}
                                            size="small"
                                            sx={{
                                                mt: 1.5,
                                                height: 24,
                                                bgcolor: 'rgba(59, 130, 246, 0.08)',
                                                border: '1px solid rgba(59, 130, 246, 0.15)',
                                                color: '#60a5fa',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                '& .MuiChip-icon': { color: '#60a5fa' },
                                            }}
                                        />
                                    )}
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
                )}
            </CardContent>
        </WorkflowCard>
    );
};

export default EventDetailsCard;
