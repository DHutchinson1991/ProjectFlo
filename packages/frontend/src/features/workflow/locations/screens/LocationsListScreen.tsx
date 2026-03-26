'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    Chip,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Add as AddIcon,
    LocationOn as LocationIcon,
    Apartment as SpaceIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    People as PeopleIcon,
} from '@mui/icons-material';
import { useBrand } from '@/features/platform/brand';
import { locationsApi } from '../api';
import type { LocationsLibrary, CreateLocationRequest } from '../types';
import { LocationCreateDialog } from '../components/LocationCreateDialog';

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
    const { currentBrand } = useBrand();
    const queryClient = useQueryClient();
    const { data: locations = [], isLoading: loading, isError } = useQuery({
        queryKey: ['locations', currentBrand?.id],
        queryFn: () => locationsApi.getAll(),
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<LocationsLibrary | null>(null);
    const [form, setForm] = useState<CreateLocationRequest>(EMPTY_FORM);

    const saveMutation = useMutation({
        mutationFn: () =>
            editingLocation
                ? locationsApi.update(editingLocation.id, form)
                : locationsApi.create({ ...form, ...(currentBrand?.id ? { brand_id: currentBrand.id } : {}) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            setDialogOpen(false);
        },
    });

    const handleCreate = () => {
        setEditingLocation(null);
        setForm(EMPTY_FORM);
        setDialogOpen(true);
    };

    const handleRowClick = (location: LocationsLibrary) => {
        router.push(`/resources/locations/${location.id}`);
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
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
                    Add Location
                </Button>
            </Box>

            {(isError || saveMutation.isError) && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {isError ? 'Failed to load locations' : 'Failed to save location'}
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
                                onClick={() => handleRowClick(location)}
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
                                        <Typography variant="body2">{location.contact_name}</Typography>
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
                                            <Typography variant="body2">{location.capacity}</Typography>
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

            <LocationCreateDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={() => saveMutation.mutate()}
                form={form}
                onFormChange={setForm}
                isEditing={!!editingLocation}
            />
        </Box>
    );
}
