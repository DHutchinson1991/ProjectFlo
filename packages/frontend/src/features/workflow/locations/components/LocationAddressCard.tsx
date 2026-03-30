'use client';

import React from 'react';
import {
    Box,
    Card,
    CardContent,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import { GpsFixed as GpsFixedIcon } from '@mui/icons-material';
import dynamic from 'next/dynamic';

import AddressAutocomplete, {
    type AddressResult,
    type AddressAutocompleteColors,
} from '@/shared/ui/AddressAutocomplete/AddressAutocomplete';
import type { LocationsLibrary } from '../types';

const VenueMap = dynamic(() => import('@/shared/ui/VenueMap'), { ssr: false });

const MAP_COLORS: AddressAutocompleteColors = {
    bg: '#1a1f2e',
    card: '#2a2f3e',
    text: '#e0e0e0',
    muted: '#9e9e9e',
    accent: '#42a5f5',
    border: '#3a3f4e',
};

interface LocationAddressCardProps {
    locationForm: Partial<LocationsLibrary>;
    onFormChange: (form: Partial<LocationsLibrary>) => void;
    onSave: (override?: Partial<LocationsLibrary>) => void;
}

export function LocationAddressCard({ locationForm, onFormChange, onSave }: LocationAddressCardProps) {
    const field = (key: keyof LocationsLibrary) => ({
        value: (locationForm[key] as string | number | undefined) ?? '',
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            onFormChange({ ...locationForm, [key]: e.target.value }),
        onBlur: () => onSave(),
        variant: 'outlined' as const,
        size: 'small' as const,
        fullWidth: true,
    });

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', pb: '16px !important' }}>
                <Grid container spacing={2} sx={{ height: '100%' }}>
                    {/* Left: fields */}
                    <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <TextField
                            label="Location Name"
                            {...field('name')}
                            sx={{ mb: 1.5 }}
                            inputProps={{ style: { fontSize: '1rem', fontWeight: 600 } }}
                        />

                        <AddressAutocomplete
                            key={`addr-search-${locationForm.lat ?? 0}-${locationForm.lng ?? 0}`}
                            value=""
                            placeholder="Search address…"
                            colors={MAP_COLORS}
                            onSelect={(result: AddressResult | null) => {
                                if (!result) return;
                                const updated: Partial<LocationsLibrary> = {
                                    ...locationForm,
                                    name: result.name || locationForm.name || '',
                                    address_line1: result.street || result.display_name.split(',')[0] || '',
                                    city: result.city || '',
                                    state: result.county || '',
                                    postal_code: result.postcode || '',
                                    country: result.country || '',
                                    lat: result.lat,
                                    lng: result.lng,
                                    precision: 'EXACT',
                                };
                                onFormChange(updated);
                                onSave(updated);
                            }}
                        />

                        <Grid container spacing={1} sx={{ mt: 1 }}>
                            <Grid item xs={12}><TextField label="Address Line 1" {...field('address_line1')} /></Grid>
                            <Grid item xs={12}><TextField label="Address Line 2" {...field('address_line2')} /></Grid>
                            <Grid item xs={6}><TextField label="City" {...field('city')} /></Grid>
                            <Grid item xs={6}><TextField label="County" {...field('state')} /></Grid>
                            <Grid item xs={6}><TextField label="Postal Code" {...field('postal_code')} /></Grid>
                            <Grid item xs={6}><TextField label="Country" {...field('country')} /></Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Precision</InputLabel>
                                    <Select
                                        label="Precision"
                                        value={locationForm.precision || 'EXACT'}
                                        onChange={(e) => {
                                            const updated = {
                                                ...locationForm,
                                                precision: e.target.value as 'EXACT' | 'APPROXIMATE',
                                            };
                                            onFormChange(updated);
                                            onSave(updated);
                                        }}
                                    >
                                        <MenuItem value="EXACT">Exact - confirmed address</MenuItem>
                                        <MenuItem value="APPROXIMATE">Approximate - vague region</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            {(locationForm.lat != null || locationForm.lng != null) && (
                                <>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Latitude"
                                            size="small"
                                            fullWidth
                                            value={locationForm.lat ?? ''}
                                            onChange={(e) => onFormChange({ ...locationForm, lat: e.target.value === '' ? undefined : Number(e.target.value) })}
                                            onBlur={() => onSave()}
                                            variant="outlined"
                                            InputProps={{ startAdornment: <GpsFixedIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} /> }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Longitude"
                                            size="small"
                                            fullWidth
                                            value={locationForm.lng ?? ''}
                                            onChange={(e) => onFormChange({ ...locationForm, lng: e.target.value === '' ? undefined : Number(e.target.value) })}
                                            onBlur={() => onSave()}
                                            variant="outlined"
                                            InputProps={{ startAdornment: <GpsFixedIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} /> }}
                                        />
                                    </Grid>
                                </>
                            )}
                        </Grid>
                    </Grid>

                    {/* Right: map */}
                    <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ flex: 1, minHeight: 280, borderRadius: 1, overflow: 'hidden' }}>
                            {locationForm.lat != null && locationForm.lng != null ? (
                                <VenueMap lat={locationForm.lat} lng={locationForm.lng} height="100%" />
                            ) : (
                                <Box
                                    sx={{
                                        height: '100%',
                                        border: '2px dashed',
                                        borderColor: 'grey.700',
                                        borderRadius: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary" textAlign="center" px={2}>
                                        Search for an address to show the map
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}
