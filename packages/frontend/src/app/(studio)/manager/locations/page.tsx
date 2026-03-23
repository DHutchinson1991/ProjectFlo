'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Button,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    LocationOn as LocationIcon,
    Apartment as SpaceIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    People as PeopleIcon,
} from '@mui/icons-material';
import { api } from '@/lib/api';
import { useBrand } from '@/app/providers/BrandProvider';
import { LocationsLibrary, CreateLocationRequest } from '@/lib/types/locations';

export default function LocationsPage() {
    const router = useRouter();
    const { currentBrand } = useBrand();
    const [locations, setLocations] = useState<LocationsLibrary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [locationDialogOpen, setLocationDialogOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<LocationsLibrary | null>(null);

    // Form states
    const [locationForm, setLocationForm] = useState<CreateLocationRequest>({
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
    });

    useEffect(() => {
        loadLocations();
    }, [currentBrand?.id]);

    const loadLocations = async () => {
        try {
            setLoading(true);
            const data = await api.locations.getAll(currentBrand?.id);
            setLocations(data);
        } catch {
            setError('Failed to load locations');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLocation = () => {
        setEditingLocation(null);
        setLocationForm({
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
        });
        setLocationDialogOpen(true);
    };

    const handleViewLocationDetails = (location: LocationsLibrary) => {
        router.push(`/manager/locations/${location.id}`);
    };

    const handleSaveLocation = async () => {
        try {
            if (editingLocation) {
                await api.locations.update(editingLocation.id, locationForm);
            } else {
                await api.locations.create({
                    ...locationForm,
                    ...(currentBrand?.id ? { brand_id: currentBrand.id } : {}),
                });
            }
            setLocationDialogOpen(false);
            loadLocations();
        } catch {
            setError('Failed to save location');
        }
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
                <Typography variant="h4" component="h1">
                    Locations Library
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateLocation}
                >
                    Add Location
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Location</TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell>Contact</TableCell>
                            <TableCell>Capacity</TableCell>
                            <TableCell>Spaces</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {locations.map((location) => (
                            <TableRow
                                key={location.id}
                                hover
                                sx={{ cursor: 'pointer' }}
                                onClick={() => handleViewLocationDetails(location)}
                            >
                                <TableCell>
                                    <Box display="flex" alignItems="center">
                                        <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight="medium">
                                                {location.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {location.city}, {location.state}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {location.address_line1}
                                        {location.address_line2 && `, ${location.address_line2}`}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {location.postal_code}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {location.contact_name && (
                                        <Typography variant="body2">
                                            {location.contact_name}
                                        </Typography>
                                    )}
                                    {location.contact_phone && (
                                        <Box display="flex" alignItems="center" mt={0.5}>
                                            <PhoneIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {location.contact_phone}
                                            </Typography>
                                        </Box>
                                    )}
                                    {location.contact_email && (
                                        <Box display="flex" alignItems="center" mt={0.5}>
                                            <EmailIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {location.contact_email}
                                            </Typography>
                                        </Box>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {location.capacity && (
                                        <Box display="flex" alignItems="center">
                                            <PeopleIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                                {location.capacity}
                                            </Typography>
                                        </Box>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        icon={<SpaceIcon />}
                                        label={`${location._count?.spaces || 0} Spaces`}
                                        color="primary"
                                        variant="outlined"
                                        size="small"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Location Dialog */}
            <Dialog open={locationDialogOpen} onClose={() => setLocationDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingLocation ? 'Edit Location' : 'Add New Location'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                label="Location Name"
                                fullWidth
                                required
                                value={locationForm.name}
                                onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Address Line 1"
                                fullWidth
                                value={locationForm.address_line1}
                                onChange={(e) => setLocationForm({ ...locationForm, address_line1: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Address Line 2"
                                fullWidth
                                value={locationForm.address_line2}
                                onChange={(e) => setLocationForm({ ...locationForm, address_line2: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="City"
                                fullWidth
                                value={locationForm.city}
                                onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="State"
                                fullWidth
                                value={locationForm.state}
                                onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Postal Code"
                                fullWidth
                                value={locationForm.postal_code}
                                onChange={(e) => setLocationForm({ ...locationForm, postal_code: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Contact Name"
                                fullWidth
                                value={locationForm.contact_name}
                                onChange={(e) => setLocationForm({ ...locationForm, contact_name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Contact Phone"
                                fullWidth
                                value={locationForm.contact_phone}
                                onChange={(e) => setLocationForm({ ...locationForm, contact_phone: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Contact Email"
                                type="email"
                                fullWidth
                                value={locationForm.contact_email}
                                onChange={(e) => setLocationForm({ ...locationForm, contact_email: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Capacity"
                                type="number"
                                fullWidth
                                value={locationForm.capacity || ''}
                                onChange={(e) => setLocationForm({ ...locationForm, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Notes"
                                fullWidth
                                multiline
                                rows={3}
                                value={locationForm.notes}
                                onChange={(e) => setLocationForm({ ...locationForm, notes: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLocationDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveLocation}>
                        {editingLocation ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>


        </Box>
    );
}
