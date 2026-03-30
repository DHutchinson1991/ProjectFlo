'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import {
    LocationOn as LocationIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    People as PeopleIcon,
    OpenInNew as OpenIcon,
} from '@mui/icons-material';
import type { LocationsLibrary } from '../types';

interface LocationDetailPanelProps {
    location: LocationsLibrary;
    onNavigate: (loc: LocationsLibrary) => void;
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | number | null }) {
    if (!value) return null;
    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, py: 0.5 }}>
            <Box sx={{ color: 'rgba(255,255,255,0.3)', mt: '2px', '& .MuiSvgIcon-root': { fontSize: '0.875rem' } }}>
                {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', mb: 0.25 }}>
                    {label}
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)', wordBreak: 'break-word' }}>
                    {value}
                </Typography>
            </Box>
        </Box>
    );
}

export function LocationDetailPanel({ location, onNavigate }: LocationDetailPanelProps) {
    const address = [location.address_line1, location.address_line2, location.city, location.state, location.postal_code]
        .filter(Boolean)
        .join(', ');

    return (
        <Box
            sx={{
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 2.5,
                bgcolor: 'rgba(255,255,255,0.01)',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <Box
                onClick={() => onNavigate(location)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                }}
            >
                <LocationIcon sx={{ fontSize: 18, color: '#10b981' }} />
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', flex: 1 }}>
                    {location.name}
                </Typography>
                <OpenIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.25)' }} />
            </Box>

            {/* Details */}
            <Box sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {address && <DetailRow icon={<LocationIcon />} label="Address" value={address} />}
                {location.contact_name && <DetailRow icon={<PeopleIcon />} label="Contact" value={location.contact_name} />}
                {location.contact_phone && <DetailRow icon={<PhoneIcon />} label="Phone" value={location.contact_phone} />}
                {location.contact_email && <DetailRow icon={<EmailIcon />} label="Email" value={location.contact_email} />}
                {location.capacity && <DetailRow icon={<PeopleIcon />} label="Capacity" value={location.capacity} />}
            </Box>
        </Box>
    );
}
