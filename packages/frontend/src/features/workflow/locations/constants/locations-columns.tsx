import React from 'react';
import { Box, Typography } from '@mui/material';
import {
    LocationOn as LocationIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    People as PeopleIcon,
} from '@mui/icons-material';
import type { StudioColumn } from '@/shared/ui';
import type { LocationsLibrary } from '../types';

export const locationsColumns: StudioColumn<LocationsLibrary>[] = [
    {
        key: 'location',
        label: 'Location',
        flex: 2,
        render: (loc) => (
            <Box display="flex" alignItems="center">
                <LocationIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                <Box>
                    <Typography variant="subtitle2" fontWeight="medium">
                        {loc.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {[loc.city, loc.state].filter(Boolean).join(', ')}
                    </Typography>
                </Box>
            </Box>
        ),
    },
    {
        key: 'contact',
        label: 'Contact',
        flex: 2,
        render: (loc) => (
            <Box>
                {loc.contact_name && (
                    <Typography variant="body2" fontWeight={500}>
                        {loc.contact_name}
                    </Typography>
                )}
                {loc.contact_phone && (
                    <Box display="flex" alignItems="center" mt={0.25}>
                        <PhoneIcon sx={{ fontSize: 13, mr: 0.5, color: 'rgba(255,255,255,0.3)' }} />
                        <Typography variant="caption" color="text.secondary">
                            {loc.contact_phone}
                        </Typography>
                    </Box>
                )}
                {loc.contact_email && (
                    <Box display="flex" alignItems="center" mt={0.25}>
                        <EmailIcon sx={{ fontSize: 13, mr: 0.5, color: 'rgba(255,255,255,0.3)' }} />
                        <Typography variant="caption" color="text.secondary">
                            {loc.contact_email}
                        </Typography>
                    </Box>
                )}
            </Box>
        ),
    },
    {
        key: 'capacity',
        label: 'Capacity',
        width: 100,
        align: 'center',
        render: (loc) =>
            loc.capacity ? (
                <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                    <PeopleIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.3)' }} />
                    <Typography variant="body2">{loc.capacity}</Typography>
                </Box>
            ) : null,
    },
];
