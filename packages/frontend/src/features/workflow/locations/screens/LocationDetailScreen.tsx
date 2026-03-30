'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    Alert,
    Box,
    Breadcrumbs,
    Button,
    Chip,
    CircularProgress,
    Grid,
    Link,
    Snackbar,
    Typography,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Business as BusinessIcon,
    Home as HomeIcon,
} from '@mui/icons-material';

import { useLocationDetail } from '../hooks/useLocationDetail';
import { LocationAddressCard } from '../components/LocationAddressCard';
import { LocationContactCard } from '../components/LocationContactCard';

interface LocationDetailScreenProps {
    locationId: number;
}

export function LocationDetailScreen({ locationId }: LocationDetailScreenProps) {
    const router = useRouter();
    const {
        location,
        locationForm,
        setLocationForm,
        loading,
        saving,
        error,
        snackbarOpen,
        setSnackbarOpen,
        handleSaveLocation,
    } = useLocationDetail(locationId);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!location) {
        return <Box p={3}><Alert severity="error">Location not found</Alert></Box>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box mb={3}>
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link
                        color="inherit"
                        href="#"
                        onClick={(e) => { e.preventDefault(); router.push('/locations'); }}
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
                        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push('/locations')}>
                            Back
                        </Button>
                        <Typography variant="h4">{location.name}</Typography>
                        <Chip label={location.is_active ? 'Active' : 'Inactive'} color={location.is_active ? 'success' : 'default'} />
                    </Box>
                    {saving && <CircularProgress size={24} />}
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <LocationAddressCard
                        locationForm={locationForm}
                        onFormChange={setLocationForm}
                        onSave={handleSaveLocation}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <LocationContactCard
                        location={location}
                        locationForm={locationForm}
                        onFormChange={setLocationForm}
                        onSave={handleSaveLocation}
                    />
                </Grid>
            </Grid>

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
