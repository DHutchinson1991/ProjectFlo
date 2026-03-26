'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    CardContent,
    CircularProgress,
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import PersonIcon from '@mui/icons-material/Person';
import { Inquiry } from '@/lib/types';
import { api } from '@/lib/api';

const PURPLE = '#a855f7';

interface LocationsSubjectsCardProps {
    inquiry: Inquiry;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WorkflowCard: React.ComponentType<any>;
}

interface LocationSlot {
    id: number;
    location_number: number;
    name: string | null;
    address: string | null;
    project_activity?: { name: string } | null;
}

interface EventDaySubject {
    id: number;
    name: string;
    real_name: string | null;
    count: number | null;
    category: string;
    contact_id?: number | null;
}

const LocationsSubjectsCard: React.FC<LocationsSubjectsCardProps> = ({ inquiry, WorkflowCard }) => {
    const [locationSlots, setLocationSlots] = useState<LocationSlot[]>([]);
    const [subjects, setSubjects] = useState<EventDaySubject[]>([]);
    const [loaded, setLoaded] = useState(false);

    const load = useCallback(() => {
        if (!inquiry.source_package_id && !inquiry.selected_package_id) return;
        Promise.all([
            api.schedule.instanceLocationSlots.getForInquiry(inquiry.id),
            api.schedule.instanceSubjects.getForInquiry(inquiry.id),
        ])
            .then(([slots, subs]) => {
                setLocationSlots(slots ?? []);
                setSubjects(subs ?? []);
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, [inquiry.id, inquiry.source_package_id, inquiry.selected_package_id]);

    useEffect(() => {
        load();
    }, [load]);

    if (!inquiry.source_package_id && !inquiry.selected_package_id) return null;

    const hasContent = locationSlots.length > 0 || subjects.length > 0;

    return (
        <WorkflowCard isActive={false} activeColor={undefined}>
            <CardContent sx={{ p: '0 !important' }}>
                {/* Header */}
                <Box sx={{ px: 2.5, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlaceIcon sx={{ fontSize: 18, color: PURPLE }} />
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                        Locations &amp; Subjects
                    </Typography>
                </Box>

                {!loaded && (
                    <Box sx={{ px: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={14} />
                        <Typography variant="caption" color="text.secondary">Loading…</Typography>
                    </Box>
                )}

                {loaded && !hasContent && (
                    <Box sx={{ px: 2.5, pb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.82rem' }}>
                            No location slots or subjects found for this package.
                        </Typography>
                    </Box>
                )}

                {/* ── Locations (read-only summary) ── */}
                {loaded && locationSlots.length > 0 && (
                    <Box sx={{ px: 2.5, pb: 1.5 }}>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: PURPLE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>
                            Locations
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {locationSlots.map((slot) => (
                                <Box key={slot.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, pl: 0.5 }}>
                                    <Typography
                                        sx={{
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            color: '#e2e8f0',
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0,
                                        }}
                                    >
                                        Location {slot.location_number}
                                    </Typography>
                                    {slot.name && (
                                        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                                            {slot.name}
                                        </Typography>
                                    )}
                                    {!slot.name && !slot.address && (
                                        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.15)', fontStyle: 'italic' }}>
                                            Not set
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}

                {/* ── Subjects (read-only summary) ── */}
                {loaded && subjects.length > 0 && (
                    <Box
                        sx={{
                            px: 2.5,
                            pb: 2,
                            borderTop: locationSlots.length > 0 ? '1px solid rgba(52,58,68,0.3)' : 'none',
                            pt: locationSlots.length > 0 ? 1.5 : 0,
                        }}
                    >
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: PURPLE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>
                            Subjects
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {subjects.map((subject) => (
                                <Box key={subject.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 0.5 }}>
                                    <Typography
                                        sx={{
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            color: '#e2e8f0',
                                            minWidth: 80,
                                            textAlign: 'right',
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {subject.name}
                                    </Typography>
                                    {subject.count && subject.count > 1 && (
                                        <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                                            ×{subject.count}
                                        </Typography>
                                    )}
                                    <Typography
                                        sx={{
                                            color: subject.real_name ? 'text.secondary' : 'rgba(255,255,255,0.15)',
                                            fontStyle: subject.real_name ? 'normal' : 'italic',
                                            fontSize: subject.real_name ? '0.78rem' : '0.72rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                        }}
                                    >
                                        {subject.real_name || '—'}
                                        {subject.contact_id && (
                                            <PersonIcon sx={{ fontSize: '0.8rem', color: 'success.main' }} />
                                        )}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}

                {/* ── Edit hint ── */}
                {loaded && hasContent && (
                    <Box sx={{ px: 2.5, pb: 1.5 }}>
                        <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                            Edit in Package Review →
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </WorkflowCard>
    );
};

export default LocationsSubjectsCard;
