'use client';

import React, { Suspense, lazy } from 'react';
import { Box, CircularProgress, IconButton, Snackbar, TextField, Typography } from '@mui/material';
import {
    LocationOn as LocationIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    People as PeopleIcon,
    Person as PersonIcon,
    MeetingRoom as SpaceIcon,
    Delete as DeleteIcon,
    Notes as NotesIcon,
} from '@mui/icons-material';
import AddressAutocomplete, {
    type AddressResult,
    type AddressAutocompleteColors,
} from '@/shared/ui/AddressAutocomplete/AddressAutocomplete';
import type { LocationsLibrary } from '../types';
import { useLocationDetail } from '../hooks/useLocationDetail';

const LocationsMap = lazy(() =>
    import('./LocationsMap').then((mod) => ({ default: mod.LocationsMap })),
);

const AUTOCOMPLETE_COLORS: AddressAutocompleteColors = {
    bg: 'rgba(255,255,255,0.02)',
    card: 'rgba(255,255,255,0.04)',
    text: '#e0e0e0',
    muted: '#9e9e9e',
    accent: '#10b981',
    border: 'rgba(255,255,255,0.08)',
};

interface LocationDetailPanelProps {
    locationId: number;
    locations?: LocationsLibrary[];
    onDelete?: (loc: LocationsLibrary) => void;
}

function PanelField({
    icon,
    label,
    value,
    onChange,
    onBlur,
    type,
    multiline,
    rows,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    onChange: (val: string) => void;
    onBlur: () => void;
    type?: string;
    multiline?: boolean;
    rows?: number;
}) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.25 }}>
            <Box sx={{ color: 'rgba(255,255,255,0.25)', mt: '6px', '& .MuiSvgIcon-root': { fontSize: '0.8rem' } }}>
                {icon}
            </Box>
            <TextField
                size="small"
                fullWidth
                label={label}
                type={type}
                multiline={multiline}
                rows={rows}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                variant="outlined"
                sx={{
                    '& .MuiOutlinedInput-root': {
                        fontSize: '0.8rem',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.06)' },
                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                        '&.Mui-focused fieldset': { borderColor: '#10b981' },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' },
                }}
            />
        </Box>
    );
}

export function LocationDetailPanel({ locationId, locations, onDelete }: LocationDetailPanelProps) {
    const {
        location,
        locationForm,
        setLocationForm,
        loading,
        snackbarOpen,
        setSnackbarOpen,
        handleSaveLocation,
    } = useLocationDetail(locationId);

    if (loading) {
        return (
            <Box sx={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.01)', py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={20} />
            </Box>
        );
    }

    if (!location) return null;

    const spaces = location.spaces ?? [];

    const update = (key: keyof LocationsLibrary, val: string | number | undefined) =>
        setLocationForm({ ...locationForm, [key]: val });

    const save = (override?: Partial<LocationsLibrary>) => handleSaveLocation(override);

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <LocationIcon sx={{ fontSize: 18, color: '#10b981' }} />
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', flex: 1 }}>
                    {location.name}
                </Typography>
                {onDelete && (
                    <IconButton
                        size="small"
                        onClick={() => onDelete(location)}
                        sx={{ p: 0.5, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}
                    >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                )}
            </Box>

            {/* Map */}
            <Suspense fallback={<Box sx={{ height: 250, bgcolor: 'rgba(255,255,255,0.02)' }} />}>
                <LocationsMap
                    locations={locations ?? (location ? [location] : [])}
                    highlightedId={locationId}
                    height={250}
                />
            </Suspense>

            {/* Address */}
            <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', mb: 0.75 }}>
                    Address
                </Typography>

                <Box sx={{ mb: 1 }}>
                    <AddressAutocomplete
                        key={`panel-addr-${locationId}`}
                        value=""
                        placeholder="Search address…"
                        colors={AUTOCOMPLETE_COLORS}
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
                            setLocationForm(updated);
                            save(updated);
                        }}
                    />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <PanelField icon={<LocationIcon />} label="Name" value={locationForm.name ?? ''} onChange={(v) => update('name', v)} onBlur={() => save()} />
                    <PanelField icon={<LocationIcon />} label="Address Line 1" value={locationForm.address_line1 ?? ''} onChange={(v) => update('address_line1', v)} onBlur={() => save()} />
                    <PanelField icon={<LocationIcon />} label="Address Line 2" value={locationForm.address_line2 ?? ''} onChange={(v) => update('address_line2', v)} onBlur={() => save()} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <PanelField icon={<LocationIcon />} label="City" value={locationForm.city ?? ''} onChange={(v) => update('city', v)} onBlur={() => save()} />
                        <PanelField icon={<LocationIcon />} label="County" value={locationForm.state ?? ''} onChange={(v) => update('state', v)} onBlur={() => save()} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <PanelField icon={<LocationIcon />} label="Postal Code" value={locationForm.postal_code ?? ''} onChange={(v) => update('postal_code', v)} onBlur={() => save()} />
                        <PanelField icon={<LocationIcon />} label="Country" value={locationForm.country ?? ''} onChange={(v) => update('country', v)} onBlur={() => save()} />
                    </Box>
                </Box>
            </Box>

            {/* Contact & Details */}
            <Box sx={{ px: 2, pt: 0.5, pb: 1, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', mb: 0.75 }}>
                    Contact & Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <PanelField icon={<PersonIcon />} label="Contact Name" value={locationForm.contact_name ?? ''} onChange={(v) => update('contact_name', v)} onBlur={() => save()} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <PanelField icon={<PhoneIcon />} label="Phone" value={locationForm.contact_phone ?? ''} onChange={(v) => update('contact_phone', v)} onBlur={() => save()} />
                        <PanelField icon={<EmailIcon />} label="Email" value={locationForm.contact_email ?? ''} onChange={(v) => update('contact_email', v)} onBlur={() => save()} />
                    </Box>
                    <PanelField icon={<PeopleIcon />} label="Capacity" type="number" value={locationForm.capacity ?? ''} onChange={(v) => update('capacity', v === '' ? undefined : Number(v))} onBlur={() => save()} />
                    <PanelField icon={<NotesIcon />} label="Notes" multiline rows={3} value={locationForm.notes ?? ''} onChange={(v) => update('notes', v)} onBlur={() => save()} />
                </Box>
            </Box>

            {/* Spaces */}
            {spaces.length > 0 && (
                <Box sx={{ px: 2, pb: 1.5, pt: 0.5, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', mb: 0.75 }}>
                        Spaces
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {spaces.map((space) => (
                            <Box
                                key={space.id}
                                sx={{
                                    display: 'flex', alignItems: 'flex-start', gap: 1,
                                    py: 0.75, px: 1, borderRadius: 1,
                                    bgcolor: 'rgba(167,139,250,0.04)',
                                    border: '1px solid rgba(167,139,250,0.08)',
                                }}
                            >
                                <SpaceIcon sx={{ fontSize: 12, color: 'rgba(167,139,250,0.5)', mt: '2px', flexShrink: 0 }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                                        {space.name}
                                    </Typography>
                                    {(space.space_type || space.capacity) && (
                                        <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)' }}>
                                            {[space.space_type, space.capacity ? `${space.capacity} capacity` : null].filter(Boolean).join(' · ')}
                                        </Typography>
                                    )}
                                    {/* Structured attributes */}
                                    {(space.indoor_outdoor || space.natural_light || space.flooring || space.ceiling_style) && (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                            {space.indoor_outdoor && (
                                                <Typography component="span" sx={{ fontSize: '0.6rem', px: 0.5, py: 0.1, borderRadius: 0.5, bgcolor: 'rgba(16,185,129,0.08)', color: 'rgba(16,185,129,0.7)', border: '1px solid rgba(16,185,129,0.12)' }}>
                                                    {space.indoor_outdoor.replace('_', ' ').toLowerCase()}
                                                </Typography>
                                            )}
                                            {space.natural_light && (
                                                <Typography component="span" sx={{ fontSize: '0.6rem', px: 0.5, py: 0.1, borderRadius: 0.5, bgcolor: 'rgba(250,204,21,0.08)', color: 'rgba(250,204,21,0.7)', border: '1px solid rgba(250,204,21,0.12)' }}>
                                                    {space.natural_light.toLowerCase()} light
                                                </Typography>
                                            )}
                                            {space.flooring && (
                                                <Typography component="span" sx={{ fontSize: '0.6rem', px: 0.5, py: 0.1, borderRadius: 0.5, bgcolor: 'rgba(167,139,250,0.08)', color: 'rgba(167,139,250,0.6)', border: '1px solid rgba(167,139,250,0.1)' }}>
                                                    {space.flooring}
                                                </Typography>
                                            )}
                                            {space.ceiling_style && (
                                                <Typography component="span" sx={{ fontSize: '0.6rem', px: 0.5, py: 0.1, borderRadius: 0.5, bgcolor: 'rgba(167,139,250,0.08)', color: 'rgba(167,139,250,0.6)', border: '1px solid rgba(167,139,250,0.1)' }}>
                                                    {space.ceiling_style}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                    {space.description && (
                                        <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', mt: 0.25, lineHeight: 1.4, fontStyle: 'italic' }}>
                                            {space.description}
                                        </Typography>
                                    )}
                                    {space.key_features && (
                                        <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', mt: 0.25, lineHeight: 1.3 }}>
                                            ✨ {space.key_features}
                                        </Typography>
                                    )}
                                    {/* Type tag descriptions */}
                                    {space.type_tags && space.type_tags.filter(t => t.description).length > 0 && (
                                        <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                            {space.type_tags.filter(t => t.description).map((tag) => (
                                                <Box key={tag.id} sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
                                                    <Typography component="span" sx={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0, mt: '1px' }}>
                                                        {tag.space_type.replace(/_/g, ' ')}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>
                                                        {tag.description}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={1500}
                onClose={() => setSnackbarOpen(false)}
                message="Saved"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Box>
    );
}
