'use client';

import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    TextField,
    Typography,
} from '@mui/material';
import {
    Email as EmailIcon,
    People as CapacityIcon,
    Person as PersonIcon,
    Phone as PhoneIcon,
    Schedule as ScheduleIcon,
} from '@mui/icons-material';

import type { LocationsLibrary } from '../types';

interface LocationContactCardProps {
    location: LocationsLibrary;
    locationForm: Partial<LocationsLibrary>;
    onFormChange: (form: Partial<LocationsLibrary>) => void;
    onSave: () => void;
}

export function LocationContactCard({
    location,
    locationForm,
    onFormChange,
    onSave,
}: LocationContactCardProps) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" justifyContent="flex-end" gap={1} mb={2}>
                    <Chip
                        label={location.is_active ? 'Active' : 'Inactive'}
                        color={location.is_active ? 'success' : 'default'}
                        size="small"
                    />
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Total Capacity"
                            value={locationForm.capacity || ''}
                            onChange={(e) =>
                                onFormChange({ ...locationForm, capacity: Number(e.target.value) || undefined })
                            }
                            onBlur={onSave}
                            variant="outlined"
                            InputProps={{ startAdornment: <CapacityIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Notes"
                            value={locationForm.notes || ''}
                            onChange={(e) => onFormChange({ ...locationForm, notes: e.target.value })}
                            onBlur={onSave}
                            variant="outlined"
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box display="flex" alignItems="center" mb={2}>
                    <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Contact</Typography>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Contact Name"
                            value={locationForm.contact_name || ''}
                            onChange={(e) => onFormChange({ ...locationForm, contact_name: e.target.value })}
                            onBlur={onSave}
                            variant="outlined"
                            InputProps={{ startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Phone Number"
                            value={locationForm.contact_phone || ''}
                            onChange={(e) => onFormChange({ ...locationForm, contact_phone: e.target.value })}
                            onBlur={onSave}
                            variant="outlined"
                            InputProps={{ startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            type="email"
                            label="Email Address"
                            value={locationForm.contact_email || ''}
                            onChange={(e) => onFormChange({ ...locationForm, contact_email: e.target.value })}
                            onBlur={onSave}
                            variant="outlined"
                            InputProps={{ startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box display="flex" alignItems="center" mb={1.5}>
                    <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Record Info</Typography>
                </Box>
                <Grid container spacing={1}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" display="block">Created</Typography>
                        <Typography variant="body2">
                            {location.created_at ? new Date(location.created_at).toLocaleString() : '-'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" display="block">Last Updated</Typography>
                        <Typography variant="body2">
                            {location.updated_at ? new Date(location.updated_at).toLocaleString() : '-'}
                        </Typography>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}
