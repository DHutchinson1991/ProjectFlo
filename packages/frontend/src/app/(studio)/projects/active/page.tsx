"use client";

import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    CircularProgress,
    Button,
} from '@mui/material';
import {
    CalendarToday as CalendarIcon,
    Event as EventIcon,
    Folder as FolderIcon,
    Description as DescriptionIcon,
    Assignment as AssignmentIcon,
    Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useProjects } from '../../providers/ProjectProvider';

export default function ActiveProjectPage() {
    const { activeProject, isLoading } = useProjects();

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!activeProject) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 3 }}>
                    Active Project
                </Typography>

                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                            No Active Project
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Please select a project from the dropdown above, or create a new project in the Project Management page.
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 3 }}>
                Active Project
            </Typography>

            {/* Project Overview Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <FolderIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Typography variant="h5" sx={{ fontWeight: 500 }}>
                            {activeProject.project_name || `Project ${activeProject.id}`}
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {/* Project Details */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
                                Project Details
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <CalendarIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                    Wedding Date:
                                </Typography>
                                <Typography variant="body2">
                                    {activeProject.wedding_date
                                        ? new Date(activeProject.wedding_date).toLocaleDateString()
                                        : 'Not set'
                                    }
                                </Typography>
                            </Box>

                            {activeProject.booking_date && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <EventIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                        Booking Date:
                                    </Typography>
                                    <Typography variant="body2">
                                        {new Date(activeProject.booking_date).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            )}

                            {activeProject.edit_start_date && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <EventIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                        Edit Start Date:
                                    </Typography>
                                    <Typography variant="body2">
                                        {new Date(activeProject.edit_start_date).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                    Phase:
                                </Typography>
                                <Chip
                                    label={activeProject.phase || 'Planning'}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                />
                            </Box>
                        </Grid>

                        {/* Client Information */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
                                Client Information
                            </Typography>

                            {activeProject.client?.contact ? (
                                <Box>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        <strong>Name:</strong> {' '}
                                        {[activeProject.client.contact.first_name, activeProject.client.contact.last_name]
                                            .filter(Boolean)
                                            .join(' ') || 'Not specified'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        <strong>Email:</strong> {activeProject.client.contact.email}
                                    </Typography>
                                    {activeProject.client.contact.phone_number && (
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>Phone:</strong> {activeProject.client.contact.phone_number}
                                        </Typography>
                                    )}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No client information available
                                </Typography>
                            )}
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Additional Information */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                                Project ID
                            </Typography>
                            <Typography variant="h4" color="primary.main">
                                #{activeProject.id}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {activeProject.brand && (
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                                    Brand
                                </Typography>
                                <Typography variant="body1">
                                    {activeProject.brand.display_name || activeProject.brand.name}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                                Status
                            </Typography>
                            <Chip
                                label="Active"
                                color="success"
                                variant="outlined"
                                sx={{ fontSize: '0.875rem' }}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Documents & Financials Section */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                    Documents & Financials
                </Typography>

                <Grid container spacing={3}>
                    {/* Proposals Section */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                        Proposals
                                    </Typography>
                                </Box>

                                <Button
                                    variant="contained"
                                    disabled
                                    fullWidth
                                    sx={{ mb: 2 }}
                                    startIcon={<DescriptionIcon />}
                                >
                                    Create Proposal
                                </Button>

                                <Typography variant="body2" color="text.secondary">
                                    You have {activeProject.proposals?.length || 0} proposal(s).
                                </Typography>

                                {/* Placeholder for proposals list */}
                                <Box sx={{ mt: 2 }}>
                                    {activeProject.proposals && activeProject.proposals.length > 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Proposals list will be displayed here.
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No proposals created yet.
                                        </Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Contracts Section */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <AssignmentIcon sx={{ mr: 1, color: 'success.main' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                        Contracts
                                    </Typography>
                                </Box>

                                <Button
                                    variant="contained"
                                    disabled
                                    fullWidth
                                    sx={{ mb: 2 }}
                                    startIcon={<AssignmentIcon />}
                                >
                                    Create Contract
                                </Button>

                                <Typography variant="body2" color="text.secondary">
                                    You have {activeProject.contracts?.length || 0} contract(s).
                                </Typography>

                                {/* Placeholder for contracts list */}
                                <Box sx={{ mt: 2 }}>
                                    {activeProject.contracts && activeProject.contracts.length > 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Contracts list will be displayed here.
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No contracts created yet.
                                        </Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Invoices Section */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <ReceiptIcon sx={{ mr: 1, color: 'warning.main' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                        Invoices
                                    </Typography>
                                </Box>

                                <Button
                                    variant="contained"
                                    disabled
                                    fullWidth
                                    sx={{ mb: 2 }}
                                    startIcon={<ReceiptIcon />}
                                >
                                    Create Invoice
                                </Button>

                                <Typography variant="body2" color="text.secondary">
                                    You have {activeProject.invoices?.length || 0} invoice(s).
                                </Typography>

                                {/* Placeholder for invoices list */}
                                <Box sx={{ mt: 2 }}>
                                    {activeProject.invoices && activeProject.invoices.length > 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Invoices list will be displayed here.
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No invoices created yet.
                                        </Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
