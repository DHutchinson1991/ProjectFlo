'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    Breadcrumbs,
    Link,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    ListItemIcon,
    Avatar,
    Divider,
    Snackbar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Apartment as SpaceIcon,
    Home as HomeIcon,
    Business as BusinessIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Person as PersonIcon,
    Straighten as DimensionsIcon,
    People as CapacityIcon,
    ChevronRight as ChevronRightIcon,
    GpsFixed as GpsFixedIcon,
    Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { api } from '@/lib/api';
import { LocationsLibrary, LocationSpace, CreateLocationSpaceRequest } from '@/lib/types/locations';
import { FloorPlanCard } from './components/FloorPlan/components/Cards/FloorPlanCard';
import AddressAutocomplete, { AddressResult, AddressAutocompleteColors } from '@/components/AddressAutocomplete';
import dynamic from 'next/dynamic';

const VenueMap = dynamic(
    () => import('@/app/(studio)/sales/inquiries/[id]/components/VenueMap'),
    { ssr: false },
);

const MAP_COLORS: AddressAutocompleteColors = {
    bg: '#1a1f2e',
    card: '#2a2f3e',
    text: '#e0e0e0',
    muted: '#9e9e9e',
    accent: '#42a5f5',
    border: '#3a3f4e',
};

export default function LocationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const locationId = Number(params.id);

    const [location, setLocation] = useState<LocationsLibrary | null>(null);
    const [spaces, setSpaces] = useState<LocationSpace[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [isSpaceDialogOpen, setIsSpaceDialogOpen] = useState(false);
    const [editingSpace, setEditingSpace] = useState<LocationSpace | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deletingSpace, setDeletingSpace] = useState<LocationSpace | null>(null);

    // Location form state
    const [locationForm, setLocationForm] = useState<Partial<LocationsLibrary>>({});

    // Space form state
    const [spaceForm, setSpaceForm] = useState<Partial<CreateLocationSpaceRequest>>({
        name: '',
        space_type: '',
        capacity: undefined,
        dimensions_length: undefined,
        dimensions_width: undefined,
        dimensions_height: undefined,
        metadata: {},
        notes: '',
        is_active: true,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setError('');
                setLoading(true);

                // Fetch location details
                const data = await api.locations.getById(locationId);
                setLocation(data);
                setLocationForm(data);

                // Fetch spaces for this location
                const spacesData = await api.locations.getSpaces(locationId);
                setSpaces(spacesData);
            } catch (err: unknown) {
                console.error('Error fetching data:', err);
                setError('Failed to load location details');
            } finally {
                setLoading(false);
            }
        };

        if (locationId) {
            fetchData();
        }
    }, [locationId]);

    const handleSaveLocation = async (overrideForm?: Partial<LocationsLibrary>) => {
        try {
            setError('');
            setSaving(true);
            const payload = overrideForm ?? locationForm;
            await api.locations.update(locationId, payload);
            const updatedLocation = await api.locations.getById(locationId);
            setLocation(updatedLocation);
            setLocationForm(updatedLocation);
            setSnackbarOpen(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update location');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenSpaceDialog = (space?: LocationSpace) => {
        if (space) {
            setEditingSpace(space);
            setSpaceForm({
                name: space.name,
                space_type: space.space_type || '',
                capacity: space.capacity || undefined,
                dimensions_length: space.dimensions_length || undefined,
                dimensions_width: space.dimensions_width || undefined,
                dimensions_height: space.dimensions_height || undefined,
                metadata: space.metadata || {},
                notes: space.notes || '',
                is_active: space.is_active !== false,
            });
        } else {
            setEditingSpace(null);
            setSpaceForm({
                name: '',
                space_type: '',
                capacity: undefined,
                dimensions_length: undefined,
                dimensions_width: undefined,
                dimensions_height: undefined,
                metadata: {},
                notes: '',
                is_active: true,
            });
        }
        setIsSpaceDialogOpen(true);
    };

    const handleSaveSpace = async () => {
        try {
            setError('');
            if (editingSpace) {
                await api.locations.updateSpace(editingSpace.id, spaceForm);
            } else {
                // Create space with required fields
                const createData: CreateLocationSpaceRequest = {
                    name: spaceForm.name || '',
                    location_id: locationId,
                    space_type: spaceForm.space_type || '',
                    capacity: spaceForm.capacity,
                    dimensions_length: spaceForm.dimensions_length,
                    dimensions_width: spaceForm.dimensions_width,
                    dimensions_height: spaceForm.dimensions_height,
                    metadata: spaceForm.metadata || {},
                    notes: spaceForm.notes,
                    is_active: spaceForm.is_active !== false,
                };
                await api.locations.createSpace(createData);
            }

            // Refresh spaces
            const spacesData = await api.locations.getSpaces(locationId);
            setSpaces(spacesData);
            setIsSpaceDialogOpen(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save space');
        }
    };

    const handleDeleteSpace = async () => {
        if (!deletingSpace) return;

        try {
            setError('');
            await api.locations.deleteSpace(deletingSpace.id);

            // Refresh spaces
            const spacesData = await api.locations.getSpaces(locationId);
            setSpaces(spacesData);
            setDeleteConfirmOpen(false);
            setDeletingSpace(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to delete space');
        }
    };

    const handleVenueFloorPlanSave = async (data: {
        venue_floor_plan_data: Record<string, unknown> | null;
        venue_floor_plan_version: number;
        venue_floor_plan_updated_at: string | null;
        venue_floor_plan_updated_by: number | null;
    } | null) => {
        try {
            console.log('🎨 Saving floor plan data:', data);

            if (data === null) {
                // Handle deletion case - update local state to reflect deletion
                console.log('🗑️ Floor plan was deleted, updating local state');
                setLocation(prev => prev ? {
                    ...prev,
                    venue_floor_plan_data: null,
                    venue_floor_plan_version: 1,
                    venue_floor_plan_updated_at: null,
                    venue_floor_plan_updated_by: null
                } : prev);
                return;
            }

            // Only save if there's actual floor plan data
            if (data.venue_floor_plan_data) {
                const updateRequest = {
                    venue_floor_plan_data: data.venue_floor_plan_data,
                    venue_floor_plan_version: data.venue_floor_plan_version
                };

                console.log('🔄 Sending update request to backend:', {
                    locationId,
                    updateRequest: {
                        ...updateRequest,
                        venue_floor_plan_data: `[OBJECT ${JSON.stringify(updateRequest.venue_floor_plan_data).length} chars]`
                    }
                });

                // Save the floor plan data to the backend
                const updatedLocation = await api.locations.updateVenueFloorPlan(locationId, updateRequest);

                console.log('📦 Received updated location from backend:', {
                    venue_floor_plan_version: updatedLocation.venue_floor_plan_version,
                    venue_floor_plan_updated_at: updatedLocation.venue_floor_plan_updated_at,
                    venue_floor_plan_data_exists: !!updatedLocation.venue_floor_plan_data
                });

                setLocation(updatedLocation);

                console.log('✅ Floor plan saved successfully');
            } else {
                console.log('⚠️ No floor plan data to save');
            }
        } catch (err: unknown) {
            console.error('❌ Error saving venue floor plan:', err);

            // More detailed error logging
            if (err instanceof Error) {
                console.error('Error message:', err.message);
                console.error('Error stack:', err.stack);
            }

            // Try to extract more details if it's a fetch error
            if (err && typeof err === 'object' && 'message' in err) {
                const error = err as { message: string; status?: number; response?: unknown };
                console.error('Detailed error info:', {
                    message: error.message,
                    status: error.status,
                    response: error.response
                });
            }

            setError(`Failed to save floor plan: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!location) {
        return (
            <Box p={3}>
                <Alert severity="error">Location not found</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box mb={3}>
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link
                        color="inherit"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            router.push('/manager/locations');
                        }}
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                    >
                        <HomeIcon fontSize="small" />
                        Locations
                    </Link>
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.primary' }}>
                        <BusinessIcon fontSize="small" />
                        {location.name}
                    </Box>
                </Breadcrumbs>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={2}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => router.push('/manager/locations')}
                        >
                            Back
                        </Button>
                        <Typography variant="h4">{location.name}</Typography>
                        <Chip
                            label={location.is_active ? 'Active' : 'Inactive'}
                            color={location.is_active ? 'success' : 'default'}
                        />
                    </Box>

                    {saving && <CircularProgress size={24} />}
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Top Row - Name+Address | Map  ||  Info+Contact */}
            <Grid container spacing={3} sx={{ mb: 4 }}>

                {/* Left half — Name + Address fields | Map side-by-side */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ height: '100%', pb: '16px !important' }}>
                            <Grid container spacing={2} sx={{ height: '100%' }}>

                                {/* Left sub-column — fields */}
                                <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
                                    {/* Name */}
                                    <TextField
                                        fullWidth
                                        label="Location Name"
                                        value={locationForm.name || ''}
                                        onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                                        onBlur={() => handleSaveLocation()}
                                        variant="outlined"
                                        size="small"
                                        sx={{ mb: 1.5 }}
                                        inputProps={{ style: { fontSize: '1rem', fontWeight: 600 } }}
                                    />

                                    {/* Address search */}
                                    <AddressAutocomplete
                                        key={`addr-search-${locationForm.lat ?? 0}-${locationForm.lng ?? 0}`}
                                        value=""
                                        placeholder="Search address…"
                                        colors={MAP_COLORS}
                                        onSelect={(result: AddressResult | null) => {
                                            if (!result) return;
                                            const updated = {
                                                ...locationForm,
                                                name: result.name || locationForm.name || '',
                                                address_line1: result.street || result.display_name.split(',')[0] || '',
                                                city: result.city || '',
                                                state: result.county || '',
                                                postal_code: result.postcode || '',
                                                country: result.country || '',
                                                lat: result.lat,
                                                lng: result.lng,
                                                precision: 'EXACT' as const,
                                            };
                                            setLocationForm(updated);
                                            handleSaveLocation(updated);
                                        }}
                                    />

                                    {/* Address fields */}
                                    <Grid container spacing={1} sx={{ mt: 1 }}>
                                        <Grid item xs={12}>
                                            <TextField fullWidth label="Address Line 1" value={locationForm.address_line1 || ''} onChange={(e) => setLocationForm({ ...locationForm, address_line1: e.target.value })} onBlur={() => handleSaveLocation()} variant="outlined" size="small" />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField fullWidth label="Address Line 2" value={locationForm.address_line2 || ''} onChange={(e) => setLocationForm({ ...locationForm, address_line2: e.target.value })} onBlur={() => handleSaveLocation()} variant="outlined" size="small" />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TextField fullWidth label="City" value={locationForm.city || ''} onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })} onBlur={() => handleSaveLocation()} variant="outlined" size="small" />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TextField fullWidth label="County" value={locationForm.state || ''} onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })} onBlur={() => handleSaveLocation()} variant="outlined" size="small" />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TextField fullWidth label="Postal Code" value={locationForm.postal_code || ''} onChange={(e) => setLocationForm({ ...locationForm, postal_code: e.target.value })} onBlur={() => handleSaveLocation()} variant="outlined" size="small" />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TextField fullWidth label="Country" value={locationForm.country || ''} onChange={(e) => setLocationForm({ ...locationForm, country: e.target.value })} onBlur={() => handleSaveLocation()} variant="outlined" size="small" />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Precision</InputLabel>
                                                <Select
                                                    label="Precision"
                                                    value={locationForm.precision || 'EXACT'}
                                                    onChange={(e) => {
                                                        const updated = { ...locationForm, precision: e.target.value as 'EXACT' | 'APPROXIMATE' };
                                                        setLocationForm(updated);
                                                        handleSaveLocation(updated);
                                                    }}
                                                >
                                                    <MenuItem value="EXACT">Exact — confirmed address</MenuItem>
                                                    <MenuItem value="APPROXIMATE">Approximate — vague region</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        {(locationForm.lat != null || locationForm.lng != null) && (
                                            <>
                                                <Grid item xs={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="Latitude"
                                                        size="small"
                                                        value={locationForm.lat ?? ''}
                                                        onChange={(e) => setLocationForm({ ...locationForm, lat: e.target.value === '' ? undefined : Number(e.target.value) })}
                                                        onBlur={() => handleSaveLocation()}
                                                        variant="outlined"
                                                        InputProps={{ startAdornment: <GpsFixedIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} /> }}
                                                    />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="Longitude"
                                                        size="small"
                                                        value={locationForm.lng ?? ''}
                                                        onChange={(e) => setLocationForm({ ...locationForm, lng: e.target.value === '' ? undefined : Number(e.target.value) })}
                                                        onBlur={() => handleSaveLocation()}
                                                        variant="outlined"
                                                        InputProps={{ startAdornment: <GpsFixedIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} /> }}
                                                    />
                                                </Grid>
                                            </>
                                        )}
                                    </Grid>
                                </Grid>

                                {/* Right sub-column — Map */}
                                <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Box
                                        sx={{
                                            flex: 1,
                                            minHeight: 280,
                                            borderRadius: 1,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {locationForm.lat != null && locationForm.lng != null ? (
                                            <VenueMap lat={locationForm.lat!} lng={locationForm.lng!} height="100%" />
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
                </Grid>

                {/* Right Column - Info + Contact (merged) */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>

                            {/* Status chips */}
                            <Box display="flex" justifyContent="flex-end" gap={1} mb={2}>
                                <Chip icon={<SpaceIcon />} label={`${spaces.length} Spaces`} color="primary" variant="outlined" size="small" />
                                <Chip label={location?.is_active ? 'Active' : 'Inactive'} color={location?.is_active ? 'success' : 'default'} size="small" />
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Total Capacity"
                                        value={locationForm.capacity || ''}
                                        onChange={(e) => setLocationForm({ ...locationForm, capacity: Number(e.target.value) || undefined })}
                                        variant="outlined"
                                        onBlur={() => handleSaveLocation()}
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
                                        onChange={(e) => setLocationForm({ ...locationForm, notes: e.target.value })}
                                        variant="outlined"
                                        onBlur={() => handleSaveLocation()}
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            {/* Contact */}
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
                                        onChange={(e) => setLocationForm({ ...locationForm, contact_name: e.target.value })}
                                        variant="outlined"
                                        onBlur={() => handleSaveLocation()}
                                        InputProps={{ startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Phone Number"
                                        value={locationForm.contact_phone || ''}
                                        onChange={(e) => setLocationForm({ ...locationForm, contact_phone: e.target.value })}
                                        variant="outlined"
                                        onBlur={() => handleSaveLocation()}
                                        InputProps={{ startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        type="email"
                                        value={locationForm.contact_email || ''}
                                        onChange={(e) => setLocationForm({ ...locationForm, contact_email: e.target.value })}
                                        variant="outlined"
                                        onBlur={() => handleSaveLocation()}
                                        InputProps={{ startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            {/* Timestamps */}
                            <Box display="flex" alignItems="center" mb={1.5}>
                                <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6">Record Info</Typography>
                            </Box>
                            <Grid container spacing={1}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary" display="block">Created</Typography>
                                    <Typography variant="body2">
                                        {location.created_at ? new Date(location.created_at).toLocaleString() : '—'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary" display="block">Last Updated</Typography>
                                    <Typography variant="body2">
                                        {location.updated_at ? new Date(location.updated_at).toLocaleString() : '—'}
                                    </Typography>
                                </Grid>
                            </Grid>

                        </CardContent>
                    </Card>
                </Grid>

            </Grid>

            {/* Bottom Row - Floor Plan and Spaces List */}
            <Grid container spacing={3}>
                {/* Floor Plan Card */}
                <Grid item xs={12} md={7}>
                    <FloorPlanCard
                        locationId={locationId}
                        initialData={{
                            venue_floor_plan_data: location.venue_floor_plan_data ?? null,
                            venue_floor_plan_version: location.venue_floor_plan_version ?? 1,
                            venue_floor_plan_updated_at: location.venue_floor_plan_updated_at ?? null,
                            venue_floor_plan_updated_by: location.venue_floor_plan_updated_by ?? null,
                        }}
                        onSave={handleVenueFloorPlanSave}
                    />
                </Grid>

                {/* Spaces List Card */}
                <Grid item xs={12} md={5}>
                    <Card sx={{ height: 500 }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Box>
                                    <Box display="flex" alignItems="center">
                                        <SpaceIcon sx={{ mr: 1, color: 'primary.main' }} />
                                        <Typography variant="h6">Location Spaces ({spaces.length})</Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Click on a space to view and edit details
                                    </Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => handleOpenSpaceDialog()}
                                >
                                    Add Space
                                </Button>
                            </Box>

                            {spaces.length === 0 ? (
                                <Box
                                    sx={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        backgroundColor: 'grey.50',
                                        borderRadius: 1,
                                        border: '1px dashed',
                                        borderColor: 'grey.300',
                                        p: 3
                                    }}
                                >
                                    <SpaceIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        No spaces defined
                                    </Typography>
                                    <Typography color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                                        Add spaces to organize different areas within this location
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => handleOpenSpaceDialog()}
                                    >
                                        Add First Space
                                    </Button>
                                </Box>
                            ) : (
                                <Box sx={{ flex: 1, overflow: 'auto' }}>
                                    <List dense>
                                        {spaces.map((space) => (
                                            <ListItem
                                                key={space.id}
                                                sx={{
                                                    border: '1px solid',
                                                    borderColor: 'grey.200',
                                                    borderRadius: 1,
                                                    mb: 1,
                                                    backgroundColor: 'background.paper',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        backgroundColor: 'action.hover',
                                                        borderColor: 'primary.main',
                                                    }
                                                }}
                                                onClick={() => router.push(`/manager/locations/${locationId}/spaces/${space.id}`)}
                                            >
                                                <ListItemIcon>
                                                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                                                        <SpaceIcon fontSize="small" />
                                                    </Avatar>
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="subtitle2" fontWeight="medium">
                                                            {space.name}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Box>
                                                            {space.space_type && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {space.space_type}
                                                                </Typography>
                                                            )}
                                                            <Box display="flex" gap={1} mt={0.5}>
                                                                {space.capacity && (
                                                                    <Chip
                                                                        icon={<CapacityIcon />}
                                                                        label={space.capacity}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        color="primary"
                                                                    />
                                                                )}
                                                                {space.dimensions_length && space.dimensions_width && (
                                                                    <Chip
                                                                        icon={<DimensionsIcon />}
                                                                        label={`${space.dimensions_length}×${space.dimensions_width}${space.dimensions_height ? `×${space.dimensions_height}` : ''}`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        color="secondary"
                                                                    />
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    }
                                                    secondaryTypographyProps={{ component: 'div' }}
                                                />
                                                <Box sx={{ mr: 1 }}>
                                                    <ChevronRightIcon sx={{ color: 'action.active' }} />
                                                </Box>
                                                <ListItemSecondaryAction>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenSpaceDialog(space);
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeletingSpace(space);
                                                            setDeleteConfirmOpen(true);
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Space Dialog */}
            <Dialog open={isSpaceDialogOpen} onClose={() => setIsSpaceDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingSpace ? 'Edit Space' : 'Add New Space'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Space Name"
                                value={spaceForm.name || ''}
                                onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Space Type"
                                value={spaceForm.space_type || ''}
                                onChange={(e) => setSpaceForm({ ...spaceForm, space_type: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Notes"
                                value={spaceForm.notes || ''}
                                onChange={(e) => setSpaceForm({ ...spaceForm, notes: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Capacity"
                                value={spaceForm.capacity || ''}
                                onChange={(e) => setSpaceForm({ ...spaceForm, capacity: Number(e.target.value) || undefined })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Length"
                                value={spaceForm.dimensions_length || ''}
                                onChange={(e) => setSpaceForm({ ...spaceForm, dimensions_length: Number(e.target.value) || undefined })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Width"
                                value={spaceForm.dimensions_width || ''}
                                onChange={(e) => setSpaceForm({ ...spaceForm, dimensions_width: Number(e.target.value) || undefined })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Height"
                                value={spaceForm.dimensions_height || ''}
                                onChange={(e) => setSpaceForm({ ...spaceForm, dimensions_height: Number(e.target.value) || undefined })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsSpaceDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveSpace} variant="contained">
                        {editingSpace ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the space &quot;{deletingSpace?.name}&quot;? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteSpace} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Auto-save feedback */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={2000}
                onClose={() => setSnackbarOpen(false)}
                message="Saved"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Box>
    );
}
