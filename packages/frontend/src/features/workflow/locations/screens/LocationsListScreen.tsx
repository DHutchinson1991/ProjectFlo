'use client';

import React, { useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    FormControl,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    Close as CloseIcon,
    LocationOn as LocationIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { StudioTable } from '@/shared/ui';
import { sectionColors } from '@/shared/theme/tokens';
import type { LocationsLibrary, CreateLocationRequest, LocationCapacityFilter } from '../types';
import { LocationCreateDialog } from '../components/LocationCreateDialog';
import { LocationDetailPanel } from '../components/LocationDetailPanel';
import { useLocationsList } from '../hooks';
import { locationsColumns } from '../constants/locations-columns';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [cityFilter, setCityFilter] = useState('all');
    const [capacityFilter, setCapacityFilter] = useState<LocationCapacityFilter>('all');

    const { locations, loading, isError, saveMutation, deleteMutation } = useLocationsList({
        searchQuery,
        cityFilter,
        capacityFilter,
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<LocationsLibrary | null>(null);
    const [form, setForm] = useState<CreateLocationRequest>(EMPTY_FORM);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    const cities = Array.from(new Set(locations.map((location) => location.city).filter(Boolean) as string[])).sort();

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

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">Locations Library</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
                    Add Location
                </Button>
            </Box>

            {(isError || saveMutation.isError) && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {isError ? 'Failed to load locations' : 'Failed to save location'}
                </Alert>
            )}

            <Paper elevation={0} sx={{
                display: 'flex', alignItems: 'center', gap: 1, p: 0.875, px: 1.25, mb: 2,
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.02)', flexWrap: 'wrap',
            }}>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                    <Select
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        displayEmpty
                        sx={{ borderRadius: 1.5, fontSize: '0.75rem', height: 32, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }}
                    >
                        <MenuItem value="all" sx={{ fontSize: '0.8125rem' }}>All Cities</MenuItem>
                        {cities.map((c) => (
                            <MenuItem key={c} value={c} sx={{ fontSize: '0.8125rem' }}>{c}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 130 }}>
                    <Select
                        value={capacityFilter}
                        onChange={(e) => setCapacityFilter(e.target.value as LocationCapacityFilter)}
                        displayEmpty
                        sx={{ borderRadius: 1.5, fontSize: '0.75rem', height: 32, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }}
                    >
                        <MenuItem value="all" sx={{ fontSize: '0.8125rem' }}>Any Capacity</MenuItem>
                        <MenuItem value="small" sx={{ fontSize: '0.8125rem' }}>Small (&lt; 100)</MenuItem>
                        <MenuItem value="medium" sx={{ fontSize: '0.8125rem' }}>Medium (100–200)</MenuItem>
                        <MenuItem value="large" sx={{ fontSize: '0.8125rem' }}>Large (200+)</MenuItem>
                        <MenuItem value="unknown" sx={{ fontSize: '0.8125rem' }}>Not set</MenuItem>
                    </Select>
                </FormControl>

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
                        '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: '0.8125rem', height: 32, '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } },
                    }}
                />

                <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled', fontWeight: 600, whiteSpace: 'nowrap', px: 0.5 }}>
                    {locations.length}
                </Typography>
            </Paper>

            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2.5, alignItems: 'start' }}>
                <StudioTable
                    columns={locationsColumns}
                    rows={locations}
                    getRowKey={(loc) => loc.id}
                    onRowClick={(loc) => setSelectedId(loc.id)}
                    onRowHover={(loc) => setHoveredId(loc?.id ?? null)}
                    getRowAccentColor={(loc) => loc.id === selectedId ? '#10b981' : ''}
                    sectionColor={sectionColors.locations}
                    emptyMessage="No locations yet — add your first venue"
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: 24 }}>
                    {(hoveredId ?? selectedId) ? (
                        <LocationDetailPanel
                            key={hoveredId ?? selectedId}
                            locationId={(hoveredId ?? selectedId)!}
                            locations={locations}
                            onDelete={(loc) => {
                                if (window.confirm(`Delete "${loc.name}"? This will soft-delete the location.`)) {
                                    deleteMutation.mutate(loc.id);
                                    setSelectedId(null);
                                    setHoveredId(null);
                                }
                            }}
                        />
                    ) : (
                        <Box sx={{
                            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2.5,
                            bgcolor: 'rgba(255,255,255,0.01)', px: 3, py: 4, textAlign: 'center',
                        }}>
                            <LocationIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.12)', mb: 1 }} />
                            <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.25)' }}>
                                Hover or click a row to view location details
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
