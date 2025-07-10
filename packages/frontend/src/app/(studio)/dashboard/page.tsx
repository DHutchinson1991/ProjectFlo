"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Stack,
    Chip,
    CircularProgress,
    Alert,
    Divider,
} from "@mui/material";
import {
    Analytics as AnalyticsIcon,
    People as PeopleIcon,
    MovieFilter as ScenesIcon,
    Business as BrandIcon,
    ContactPhone as ContactIcon,
} from "@mui/icons-material";
import { useBrand } from "../../providers/BrandProvider";
import { api } from "../../../lib/api";

export default function DashboardPage() {
    const { currentBrand, isLoading: brandLoading } = useBrand();

    // Query brand-specific data
    const {
        data: scenes = [],
        isLoading: scenesLoading,
        error: scenesError,
    } = useQuery({
        queryKey: ["scenes", currentBrand?.id],
        queryFn: () => api.scenes.getAll(),
        enabled: !!currentBrand,
    });

    const {
        data: contacts = [],
        isLoading: contactsLoading,
        error: contactsError,
    } = useQuery({
        queryKey: ["contacts", currentBrand?.id],
        queryFn: () => api.contacts.getAll(),
        enabled: !!currentBrand,
    });

    const {
        data: films = [],
        isLoading: filmsLoading,
        error: filmsError,
    } = useQuery({
        queryKey: ["films", currentBrand?.id],
        queryFn: () => api.films.getAll(),
        enabled: !!currentBrand,
    });

    // Query universal data (not brand-specific)
    const {
        data: contributors = [],
        isLoading: contributorsLoading,
        error: contributorsError,
    } = useQuery({
        queryKey: ["contributors", currentBrand?.id],
        queryFn: () => api.contributors.getAll(),
        enabled: !!currentBrand,
    });

    const isLoading = brandLoading || scenesLoading || contactsLoading || filmsLoading || contributorsLoading;
    const hasError = scenesError || contactsError || filmsError || contributorsError;

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Welcome to ProjectFlo Studio - Your production management hub
                </Typography>

                {/* Brand Info */}
                {currentBrand && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: "background.paper", borderRadius: 1, border: 1, borderColor: "divider" }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <BrandIcon color="primary" />
                            <Box>
                                <Typography variant="subtitle1" fontWeight="medium">
                                    Current Brand: {currentBrand.name}
                                </Typography>
                                {currentBrand.description && (
                                    <Typography variant="body2" color="text.secondary">
                                        {currentBrand.description}
                                    </Typography>
                                )}
                            </Box>
                        </Stack>
                    </Box>
                )}
            </Box>

            {/* Error Display */}
            {hasError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Failed to load some data. Please check your connection and try refreshing.
                </Alert>
            )}

            {/* Loading or Content */}
            {isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* Stats Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <ScenesIcon color="primary" sx={{ fontSize: 32 }} />
                                        <Box>
                                            <Typography variant="h6" component="div">
                                                {scenes.length}
                                            </Typography>
                                            <Typography color="text.secondary" variant="body2">
                                                Brand Scenes
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <ContactIcon color="secondary" sx={{ fontSize: 32 }} />
                                        <Box>
                                            <Typography variant="h6" component="div">
                                                {contacts.length}
                                            </Typography>
                                            <Typography color="text.secondary" variant="body2">
                                                Brand Contacts
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <AnalyticsIcon color="success" sx={{ fontSize: 32 }} />
                                        <Box>
                                            <Typography variant="h6" component="div">
                                                {films.length}
                                            </Typography>
                                            <Typography color="text.secondary" variant="body2">
                                                Brand Films
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <PeopleIcon color="warning" sx={{ fontSize: 32 }} />
                                        <Box>
                                            <Typography variant="h6" component="div">
                                                {contributors.length}
                                            </Typography>
                                            <Typography color="text.secondary" variant="body2">
                                                Contributors
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Quick Overview */}
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Brand Overview
                                    </Typography>
                                    <Divider sx={{ my: 2 }} />
                                    {currentBrand ? (
                                        <Stack spacing={2}>
                                            <Typography variant="body1">
                                                You are currently working with <strong>{currentBrand.name}</strong> brand.
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                All data shown on this dashboard is specific to this brand.
                                                Switch brands using the selector in the header to view different brand data.
                                            </Typography>
                                            <Box>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Brand-Specific Data:
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                    <Chip label="Scenes" size="small" color="primary" variant="outlined" />
                                                    <Chip label="Contacts" size="small" color="secondary" variant="outlined" />
                                                    <Chip label="Films" size="small" color="success" variant="outlined" />
                                                    <Chip label="Contributors" size="small" color="warning" variant="outlined" />
                                                </Stack>
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Universal Data (shared across brands):
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                    <Chip label="Timeline Layers" size="small" variant="outlined" />
                                                    <Chip label="Editing Styles" size="small" variant="outlined" />
                                                    <Chip label="Roles" size="small" variant="outlined" />
                                                </Stack>
                                            </Box>
                                        </Stack>
                                    ) : (
                                        <Typography color="text.secondary">
                                            No brand selected. Please select a brand to view brand-specific data.
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Quick Actions
                                    </Typography>
                                    <Stack spacing={2}>
                                        <Chip
                                            label="Create New Scene"
                                            clickable
                                            color="primary"
                                            size="small"
                                            disabled={!currentBrand}
                                        />
                                        <Chip
                                            label="Add Contact"
                                            clickable
                                            color="secondary"
                                            size="small"
                                            disabled={!currentBrand}
                                        />
                                        <Chip
                                            label="Create Film Project"
                                            clickable
                                            color="success"
                                            size="small"
                                            disabled={!currentBrand}
                                        />
                                        <Chip
                                            label="Switch Brand"
                                            clickable
                                            color="default"
                                            size="small"
                                        />
                                    </Stack>
                                    {!currentBrand && (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                                            Select a brand to enable brand-specific actions.
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );
}
