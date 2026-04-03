'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
    Box,
    Typography,
    CardContent,
    Chip,
} from '@mui/material';
import {
    AccessTime,
} from '@mui/icons-material';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { useBrand } from '@/features/platform/brand';
import { humanize } from '../../lib';
import { useEventDetailsData } from '../../hooks/useEventDetailsData';
import VenueSection from './VenueSection';
import EventNotesSection from './EventNotesSection';
import { haversineKm, formatDistance } from '@/shared/utils/geography';
import type { EventDetailsCardProps } from './types';

const VenueMap = dynamic(() => import('@/shared/ui/VenueMap'), { ssr: false });

const EventDetailsCard: React.FC<EventDetailsCardProps> = ({
    inquiry,
    onRefresh,
    isActive,
    activeColor,
    submission,
    WorkflowCard,
}) => {
    const { currentBrand } = useBrand();
    const { ceremonySlot, slotsLoading, venueCoords: geocodedVenueCoords, brandCoords } = useEventDetailsData(
        inquiry,
        submission,
        currentBrand,
    );

    const dateInputRef = useRef<HTMLInputElement>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responses = (submission?.responses ?? {}) as Record<string, any>;

    const [formData, setFormData] = useState({
        wedding_date: inquiry.event_date
            ? new Date(inquiry.event_date).toISOString().split('T')[0]
            : (responses.wedding_date || ''),
        venue_details: inquiry.venue_details || responses.venue_details || '',
        venue_address: inquiry.venue_address || '',
        venue_lat: inquiry.venue_lat ?? null as number | null,
        venue_lng: inquiry.venue_lng ?? null as number | null,
    });

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

    const partnerName = responses.partner_name;
    const specialRequests = responses.special_requests;
    const birthdayPerson = responses.birthday_person_name;
    const birthdayRelation = responses.birthday_relation;
    const isBirthdayPerson = responses.is_birthday_person;
    const eventType = responses.event_type;
    const approxDate = responses.wedding_date_approx;

    // Display coordinates
    const displayLat = formData.venue_lat ?? ceremonySlot?.lat ?? geocodedVenueCoords?.lat ?? null;
    const displayLng = formData.venue_lng ?? ceremonySlot?.lng ?? geocodedVenueCoords?.lng ?? null;
    const hasVenueCoords = displayLat != null && displayLng != null;

    const distance = useMemo(() => {
        if (!hasVenueCoords || !brandCoords) return null;
        const km = haversineKm(brandCoords.lat, brandCoords.lng, displayLat!, displayLng!);
        return formatDistance(km);
    }, [hasVenueCoords, brandCoords, displayLat, displayLng]);

    /* ---- inline date save ---- */
    const handleDateChange = async (newDate: string) => {
        if (!newDate) return;
        setFormData(prev => ({ ...prev, wedding_date: newDate }));
        try {
            await inquiriesApi.update(inquiry.id, { wedding_date: newDate });
            if (onRefresh) await onRefresh();
        } catch (error) {
            console.error('Failed to update event date:', error);
        }
    };

    /* ---- date computations ---- */
    const dateObj = formData.wedding_date ? new Date(formData.wedding_date + 'T00:00:00') : null;
    const monthShort = dateObj ? dateObj.toLocaleDateString(undefined, { month: 'short' }).toUpperCase() : '';
    const dayNum = dateObj ? dateObj.getDate().toString() : '';
    const displayDate = dateObj
        ? dateObj.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })
        : 'Date not set';
    const daysUntilEvent = useMemo(() => {
        if (!dateObj) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(dateObj);
        eventDate.setHours(0, 0, 0, 0);
        return Math.ceil((eventDate.getTime() - today.getTime()) / 86400000);
    }, [dateObj]);

    /* ---- short venue label ---- */
    const slotAddress = ceremonySlot?.address || '';
    const slotName = ceremonySlot?.name || '';
    const venueName = ceremonySlot?.venueName || '';

    const venueShortName = slotsLoading ? '' : (venueName || slotName || slotAddress.split(',')[0]?.trim() || '');
    const venueLabel = ceremonySlot
        ? `Location ${ceremonySlot.slotIndex} of ${ceremonySlot.totalSlots}`
        : 'Venue';

    /* ---- structured address fields ---- */
    const structuredAddress: { label: string; value: string }[] = (() => {
        const fields = ceremonySlot?.addressFields;
        if (fields) {
            let street = fields.address_line1 || '';
            if (venueShortName && street.startsWith(venueShortName)) {
                street = street.slice(venueShortName.length).replace(/^[,\s]+/, '');
            }
            return [
                street && { label: 'Street', value: street },
                fields.address_line2 && { label: 'Street 2', value: fields.address_line2 },
                fields.city && { label: 'City', value: fields.city },
                fields.county && { label: 'County', value: fields.county },
                fields.country && { label: 'Country', value: fields.country },
                fields.postcode && { label: 'Postcode', value: fields.postcode },
            ].filter(Boolean) as { label: string; value: string }[];
        }
        const venueFullAddress = slotsLoading ? '' : (slotAddress || '');
        const parts = venueFullAddress.split(',').map((p: string) => p.trim()).filter(Boolean);
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
                </Box>

                {/* Hidden date input for popup picker */}
                <input
                    ref={dateInputRef}
                    type="date"
                    value={formData.wedding_date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                />

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
                                    cursor: 'pointer',
                                    transition: 'transform 0.15s, box-shadow 0.15s',
                                    '&:hover': { transform: 'scale(1.08)', boxShadow: '0 6px 16px rgba(236, 72, 153, 0.35)' },
                                }}
                                onClick={() => dateInputRef.current?.showPicker?.()}
                                >
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
                                    cursor: 'pointer',
                                    transition: 'border-color 0.15s',
                                    '&:hover': { borderColor: 'rgba(236, 72, 153, 0.4)' },
                                }}
                                onClick={() => dateInputRef.current?.showPicker?.()}
                                >
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
                            {daysUntilEvent !== null && (
                                <Box sx={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    gap: 0.4, flexShrink: 0, pl: 1.5,
                                    borderLeft: '1px solid rgba(100,116,139,0.2)',
                                }}>
                                    <AccessTime sx={{ fontSize: 20, color: '#22d3ee' }} />
                                    <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#e2e8f0', lineHeight: 1 }}>
                                        {Math.abs(daysUntilEvent)}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.6rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>
                                        {daysUntilEvent >= 0 ? 'Days to Event' : 'Days Since'}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Venue info (no-map variant renders inline here) */}
                        <VenueSection
                            venueShortName={venueShortName}
                            venueLabel={venueLabel}
                            structuredAddress={structuredAddress}
                            distance={distance}
                            hasVenueCoords={hasVenueCoords}
                        />
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

                {/* Partner / birthday / notes summary */}
                <EventNotesSection
                    partnerName={partnerName}
                    specialRequests={specialRequests}
                    birthdayPerson={birthdayPerson}
                    birthdayRelation={birthdayRelation}
                    isBirthdayPerson={isBirthdayPerson}
                />
            </CardContent>
        </WorkflowCard>
    );
};

export default EventDetailsCard;
