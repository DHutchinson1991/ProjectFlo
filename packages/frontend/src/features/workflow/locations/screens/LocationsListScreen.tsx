'use client';

import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Button,
    Typography,
    CircularProgress,
    Alert,
    TextField,
    InputAdornment,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    Paper,
} from '@mui/material';
import {
    Add as AddIcon,
    LocationOn as LocationIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    People as PeopleIcon,
    Search as SearchIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { StudioTable, type StudioColumn } from '@/shared/ui';
import { sectionColors } from '@/shared/theme/tokens';
import type { LocationsLibrary, CreateLocationRequest } from '../types';
import { LocationCreateDialog } from '../components/LocationCreateDialog';
import { LocationDetailPanel } from '../components/LocationDetailPanel';
import { useLocationsList } from '../hooks';

// Leaflet is heavy — lazy-load the map
const LocationsMap = lazy(() =>
    import('../components/LocationsMap').then((mod) => ({ default: mod.LocationsMap })),
);

const EMPTY_FORM: CreateLocationRequest = {
    name: '',
    address_line1: '',
    city: '',
    state: '',
    country: 'United States',
    postal_code: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    capacity: undefined,
    notes: '',
};

export function LocationsListScreen() {
    const router = useRouter();
    const { locations, loading, isError, saveMutation } = useLocationsList();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<LocationsLibrary | null>(null);
    const [form, setForm] = useState<CreateLocationRequest>(EMPTY_FORM);
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    // ── Filter state ──────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [cityFilter, setCityFilter] = useState('all');
    const [capacityFilter, setCapacityFilter] = useState('all');

    // ── Derived data ──────────────────────────────────────
    const cities = useMemo(() => {
        const set = new Set<string>();
        locations.forEach((l) => { if (l.city) set.add(l.city); });
        return Array.from(set).sort();
    }, [locations]);

    const filteredLocations = useMemo(() => {
        let result = locations;

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter((l) =>
                l.name.toLowerCase().includes(q) ||
                l.city?.toLowerCase().includes(q) ||
                l.state?.toLowerCase().includes(q) ||
                l.contact_name?.toLowerCase().includes(q) ||
                l.address_line1?.toLowerCase().includes(q) ||
                l.postal_code?.toLowerCase().includes(q),
            );
        }

        // City
        if (cityFilter !== 'all') {
            result = result.filter((l) => l.city === cityFilter);
        }

        // Capacity
        if (capacityFilter === 'small') result = result.filter((l) => l.capacity && l.capacity < 100);
        else if (capacityFilter === 'medium') result = result.filter((l) => l.capacity && l.capacity >= 100 && l.capacity <= 200);
        else if (capacityFilter === 'large') result = result.filter((l) => l.capacity && l.capacity > 200);
        else if (capacityFilter === 'unknown') result = result.filter((l) => !l.capacity);

        return result;
    }, [locations, searchQuery, cityFilter, capacityFilter]);

    const hoveredLocation = useMemo(
        () => (hoveredId ? filteredLocations.find((l) => l.id === hoveredId) ?? null : null),
        [hoveredId, filteredLocations],
    );

    const handleCreate = () => {
        setEditingLocation(null);
        setForm(EMPTY_FORM);
        setDialogOpen(true);
    };

    const handleSave = () => {
        saveMutation.mutate(
            { editingLocation, form },
            { onSuccess: () => setDialogOpen(false) },
        );
    };

    const handleRowClick = (location: LocationsLibrary) => {
        router.push(`/resources/locations/${location.id}`);
    };

    const columns: StudioColumn<LocationsLibrary>[] = [
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
                            {loc.city}{loc.state ? `, ${loc.state}` : ''}
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

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            {/* Page header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Locations Library
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
                    Add Location
                </Button>
            </Box>

            {(isError || saveMutation.isError) && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {isError ? 'Failed to load locations' : 'Failed to save location'}
                </Alert>
            )}

            {/* ── Toolbar ────────────────────────────────────── */}
            <Paper elevation={0} sx={{
                display: 'flex', alignItems: 'center', gap: 1, p: 0.875, px: 1.25, mb: 2,
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.02)', flexWrap: 'wrap',
            }}>
                {/* City filter */}
                <FormControl size="small" sx={{ minWidth: 130 }}>
                    <Select
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        displayEmpty
                        sx={{
                            borderRadius: 1.5, fontSize: '0.75rem', height: 32,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                        }}
                    >
                        <MenuItem value="all" sx={{ fontSize: '0.8125rem' }}>All Cities</MenuItem>
                        {cities.map((c) => (
                            <MenuItem key={c} value={c} sx={{ fontSize: '0.8125rem' }}>{c}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Capacity filter */}
                <FormControl size="small" sx={{ minWidth: 130 }}>
                    <Select
                        value={capacityFilter}
                        onChange={(e) => setCapacityFilter(e.target.value)}
                        displayEmpty
                        sx={{
                            borderRadius: 1.5, fontSize: '0.75rem', height: 32,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                        }}
                    >
                        <MenuItem value="all" sx={{ fontSize: '0.8125rem' }}>Any Capacity</MenuItem>
                        <MenuItem value="small" sx={{ fontSize: '0.8125rem' }}>Small (&lt; 100)</MenuItem>
                        <MenuItem value="medium" sx={{ fontSize: '0.8125rem' }}>Medium (100–200)</MenuItem>
                        <MenuItem value="large" sx={{ fontSize: '0.8125rem' }}>Large (200+)</MenuItem>
                        <MenuItem value="unknown" sx={{ fontSize: '0.8125rem' }}>Not set</MenuItem>
                    </Select>
                </FormControl>

                {/* Search */}
                <TextField
                    size="small"
                    placeholder="Search locations, contacts, addresses…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.3)' }} />
                            </InputAdornment>
                        ),
                        endAdornment: searchQuery ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.25 }}>
                                    <CloseIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                            </InputAdornment>
                        ) : null,
                    }}
                    sx={{
                        ml: 'auto', minWidth: 260,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5, fontSize: '0.8125rem', height: 32,
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                        },
                    }}
                />

                {/* Count */}
                <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled', fontWeight: 600, whiteSpace: 'nowrap', px: 0.5 }}>
                    {filteredLocations.length} / {locations.length}
                </Typography>
            </Paper>

            {/* Dashboard layout: table 2/3 + sidebar 1/3 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2.5, alignItems: 'start' }}>
                {/* Left — Table */}
                <StudioTable
                    columns={columns}
                    rows={filteredLocations}
                    getRowKey={(loc) => loc.id}
                    onRowClick={handleRowClick}
                    onRowHover={(loc) => setHoveredId(loc?.id ?? null)}
                    sectionColor={sectionColors.locations}
                    emptyMessage="No locations yet — add your first venue"
                />

                {/* Right — Sidebar */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: 24 }}>
                    {/* Map */}
                    <Suspense
                        fallback={
                            <Box sx={{
                                height: 380, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.01)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <CircularProgress size={24} />
                            </Box>
                        }
                    >
                        <LocationsMap
                            locations={filteredLocations}
                            highlightedId={hoveredId}
                            onMarkerClick={handleRowClick}
                            height={380}
                        />
                    </Suspense>

                    {/* Detail panel — shown on hover */}
                    {hoveredLocation ? (
                        <LocationDetailPanel
                            location={hoveredLocation}
                            onNavigate={handleRowClick}
                        />
                    ) : (
                        <Box sx={{
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 2.5,
                            bgcolor: 'rgba(255,255,255,0.01)',
                            px: 3, py: 4,
                            textAlign: 'center',
                        }}>
                            <LocationIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.12)', mb: 1 }} />
                            <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.25)' }}>
                                Hover a row to preview location details
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            <LocationCreateDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleSave}
                form={form}
                onFormChange={setForm}
                isEditing={!!editingLocation}
            />
        </Box>
    );
}
