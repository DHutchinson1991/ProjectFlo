'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    Chip,
    TextField,
    Alert,
    CircularProgress,
    Breadcrumbs,
    Link,
    MenuItem,
    FormControlLabel,
    Switch,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Save as SaveIcon,
    Edit as EditIcon,
    Cancel as CancelIcon,
    Apartment as SpaceIcon,
    Home as HomeIcon,
    Business as BusinessIcon,
    LocationOn as LocationIcon,
    Straighten as DimensionsIcon,
    People as CapacityIcon,
    Description as NotesIcon,
    Category as TypeIcon,
} from '@mui/icons-material';
import { locationsApi } from '../api';
import type { LocationsLibrary, LocationSpace, CreateLocationSpaceRequest } from '../types';

const SPACE_TYPES = [
    'Dance Floor', 'Ceremony Area', 'Reception Hall', 'Cocktail Area',
    'Bridal Suite', "Groom's Room", 'Garden', 'Balcony', 'Terrace',
    'Chapel', 'Ballroom', 'Foyer', 'Bar Area', 'Kitchen', 'Outdoor Space', 'Other',
];

interface SpaceDetailScreenProps {
    locationId: number;
    spaceId: number;
}

export function SpaceDetailScreen({ locationId, spaceId }: SpaceDetailScreenProps) {
    const router = useRouter();

    const [location, setLocation] = useState<LocationsLibrary | null>(null);
    const [space, setSpace] = useState<LocationSpace | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);

    const [spaceForm, setSpaceForm] = useState<Partial<CreateLocationSpaceRequest>>({
        name: '', space_type: '', capacity: undefined,
        dimensions_length: undefined, dimensions_width: undefined, dimensions_height: undefined,
        metadata: {}, notes: '', is_active: true,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setError('');
                setLoading(true);
                const locationData = await locationsApi.getById(locationId);
                setLocation(locationData);
                const spacesData = await locationsApi.getSpaces(locationId);
                const currentSpace = spacesData.find(s => s.id === spaceId);
                if (currentSpace) {
                    setSpace(currentSpace);
                    setSpaceForm({
                        name: currentSpace.name, space_type: currentSpace.space_type || '',
                        capacity: currentSpace.capacity || undefined,
                        dimensions_length: currentSpace.dimensions_length || undefined,
                        dimensions_width: currentSpace.dimensions_width || undefined,
                        dimensions_height: currentSpace.dimensions_height || undefined,
                        metadata: currentSpace.metadata || {}, notes: currentSpace.notes || '',
                        is_active: currentSpace.is_active !== false,
                    });
                } else {
                    setError('Space not found');
                }
            } catch {
                setError('Failed to load space details');
            } finally {
                setLoading(false);
            }
        };
        if (locationId && spaceId) fetchData();
    }, [locationId, spaceId]);

    const handleSaveSpace = async () => {
        try {
            setError('');
            await locationsApi.updateSpace(spaceId, spaceForm);
            const spacesData = await locationsApi.getSpaces(locationId);
            const updatedSpace = spacesData.find(s => s.id === spaceId);
            if (updatedSpace) setSpace(updatedSpace);
            setIsEditing(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update space');
        }
    };

    const calculateSquareFootage = () => {
        const { dimensions_length: l, dimensions_width: w } = spaceForm;
        return l && w ? (l * w).toFixed(0) : null;
    };

    const calculateVolume = () => {
        const { dimensions_length: l, dimensions_width: w, dimensions_height: h } = spaceForm;
        return l && w && h ? (l * w * h).toFixed(0) : null;
    };

    if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;
    if (!location || !space) return <Box p={3}><Alert severity="error">Space not found</Alert></Box>;

    return (
        <Box sx={{ p: 3 }}>
            <Box mb={3}>
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link color="inherit" href="#" onClick={(e) => { e.preventDefault(); router.push('/resources/locations'); }} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}>
                        <HomeIcon fontSize="small" />Locations
                    </Link>
                    <Link color="inherit" href="#" onClick={(e) => { e.preventDefault(); router.push(`/resources/locations/${locationId}`); }} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}>
                        <BusinessIcon fontSize="small" />{location.name}
                    </Link>
                    <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SpaceIcon fontSize="small" />{space.name}
                    </Typography>
                </Breadcrumbs>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={2}>
                        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(`/resources/locations/${locationId}`)}>Back to Location</Button>
                        <Typography variant="h4">{space.name}</Typography>
                        <Box display="flex" gap={1}>
                            <Chip label={space.is_active ? 'Active' : 'Inactive'} color={space.is_active ? 'success' : 'default'} size="small" />
                            {space.space_type && <Chip icon={<TypeIcon />} label={space.space_type} color="primary" variant="outlined" size="small" />}
                            {space.capacity && <Chip icon={<CapacityIcon />} label={`${space.capacity} people`} color="secondary" variant="outlined" size="small" />}
                        </Box>
                    </Box>
                    {!isEditing ? (
                        <Button variant="contained" startIcon={<EditIcon />} onClick={() => setIsEditing(true)}>Edit Space</Button>
                    ) : (
                        <Box display="flex" gap={1}>
                            <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => { setIsEditing(false); setSpaceForm({ name: space.name, space_type: space.space_type || '', capacity: space.capacity || undefined, dimensions_length: space.dimensions_length || undefined, dimensions_width: space.dimensions_width || undefined, dimensions_height: space.dimensions_height || undefined, metadata: space.metadata || {}, notes: space.notes || '', is_active: space.is_active !== false }); }}>Cancel</Button>
                            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveSpace}>Save Changes</Button>
                        </Box>
                    )}
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}><SpaceIcon sx={{ mr: 1, color: 'primary.main' }} /><Typography variant="h6">Basic Information</Typography></Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12}><TextField fullWidth label="Space Name" value={spaceForm.name || ''} onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })} disabled={!isEditing} variant={isEditing ? 'outlined' : 'filled'} /></Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth select label="Space Type" value={spaceForm.space_type || ''} onChange={(e) => setSpaceForm({ ...spaceForm, space_type: e.target.value })} disabled={!isEditing} variant={isEditing ? 'outlined' : 'filled'}>
                                        {SPACE_TYPES.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Capacity" value={spaceForm.capacity || ''} onChange={(e) => setSpaceForm({ ...spaceForm, capacity: Number(e.target.value) || undefined })} disabled={!isEditing} variant={isEditing ? 'outlined' : 'filled'} InputProps={{ startAdornment: <CapacityIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} /></Grid>
                                <Grid item xs={12}><FormControlLabel control={<Switch checked={spaceForm.is_active !== false} onChange={(e) => setSpaceForm({ ...spaceForm, is_active: e.target.checked })} disabled={!isEditing} />} label="Active Space" /></Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box display="flex" alignItems="center" mb={2}><NotesIcon sx={{ mr: 1, color: 'primary.main' }} /><Typography variant="h6">Description & Notes</Typography></Box>
                            <TextField fullWidth multiline rows={10} label="Space Description" value={spaceForm.notes || ''} onChange={(e) => setSpaceForm({ ...spaceForm, notes: e.target.value })} disabled={!isEditing} variant={isEditing ? 'outlined' : 'filled'} placeholder="Add details about this space, setup requirements, special features, etc." sx={{ flex: 1 }} />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={9}>
                    <Card sx={{ height: 500 }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Box display="flex" alignItems="center"><LocationIcon sx={{ mr: 1, color: 'primary.main' }} /><Typography variant="h6">Space Layout Designer</Typography></Box>
                                <Button variant="outlined" size="small" startIcon={<EditIcon />} disabled={!isEditing}>Edit Layout</Button>
                            </Box>
                            <Box sx={{ flex: 1, backgroundColor: 'grey.50', border: '2px dashed', borderColor: 'grey.300', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                <SpaceIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary" gutterBottom>Interactive Space Layout</Typography>
                                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>Drag and drop interface for furniture placement and space planning</Typography>
                                <Typography variant="caption" color="text.secondary" textAlign="center">Canvas-based layout designer with room setup visualization</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card sx={{ height: 500 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}><DimensionsIcon sx={{ mr: 1, color: 'primary.main' }} /><Typography variant="h6">Dimensions</Typography></Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12}><TextField fullWidth type="number" label="Length (ft)" value={spaceForm.dimensions_length || ''} onChange={(e) => setSpaceForm({ ...spaceForm, dimensions_length: Number(e.target.value) || undefined })} disabled={!isEditing} variant={isEditing ? 'outlined' : 'filled'} size="small" /></Grid>
                                <Grid item xs={12}><TextField fullWidth type="number" label="Width (ft)" value={spaceForm.dimensions_width || ''} onChange={(e) => setSpaceForm({ ...spaceForm, dimensions_width: Number(e.target.value) || undefined })} disabled={!isEditing} variant={isEditing ? 'outlined' : 'filled'} size="small" /></Grid>
                                <Grid item xs={12}><TextField fullWidth type="number" label="Height (ft)" value={spaceForm.dimensions_height || ''} onChange={(e) => setSpaceForm({ ...spaceForm, dimensions_height: Number(e.target.value) || undefined })} disabled={!isEditing} variant={isEditing ? 'outlined' : 'filled'} size="small" /></Grid>
                                {calculateSquareFootage() && <Grid item xs={12}><TextField fullWidth label="Square Footage" value={`${calculateSquareFootage()} sq ft`} disabled variant="filled" size="small" /></Grid>}
                                {calculateVolume() && <Grid item xs={12}><TextField fullWidth label="Volume" value={`${calculateVolume()} cu ft`} disabled variant="filled" size="small" /></Grid>}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
