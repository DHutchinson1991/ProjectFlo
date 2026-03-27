"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    IconButton,
    Alert,
    Snackbar,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    CircularProgress,
    Tabs,
    Tab,
    Link,
} from '@mui/material';
import { StudioTable, type StudioColumn } from '@/shared/ui';
import { sectionColors } from '@/shared/theme/tokens';
import {
    Visibility as ViewIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Business as BusinessIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Person as PersonIcon,
    Folder as ProjectIcon,
    Numbers as CountIcon,
    Settings as ActionsIcon,
} from '@mui/icons-material';
import { clientsApi } from '@/features/workflow/clients/api';
import type { Client, ClientListItem, CreateClientData, UpdateClientData } from '@/features/workflow/clients/types';
import { useBrand } from '@/features/platform/brand';

export function ClientsListScreen() {
    // Brand context
    const { currentBrand } = useBrand();

    // Data states
    const [clients, setClients] = useState<ClientListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [editingClient, setEditingClient] = useState<ClientListItem | null>(null);
    const [deletingClient, setDeletingClient] = useState<ClientListItem | null>(null);

    // Tab state for client detail view
    const [currentTab, setCurrentTab] = useState(0);

    // Form states
    const [formData, setFormData] = useState<CreateClientData>({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        company_name: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Notification states
    const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, severity: 'success' | 'error') => {
        setNotification({ message, severity });
    };

    // Load clients
    const loadClients = async () => {
        try {
            setIsLoading(true);
            const data = await clientsApi.getAll();
            setClients(data);
        } catch (error) {
            console.error('Failed to load clients:', error);
            showNotification('Failed to load clients', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentBrand) {
            loadClients();
        }
    }, [currentBrand]);

    // Form validation
    const validateForm = (data: CreateClientData | UpdateClientData): Record<string, string> => {
        const errors: Record<string, string> = {};

        if (!data.first_name?.trim()) {
            errors.first_name = 'First name is required';
        }

        if (!data.last_name?.trim()) {
            errors.last_name = 'Last name is required';
        }

        if (!data.email?.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.email = 'Please enter a valid email address';
        }

        return errors;
    };

    // Dialog handlers
    const openCreateDialog = () => {
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone_number: '',
            company_name: '',
        });
        setFormErrors({});
        setEditingClient(null);
        setFormDialogOpen(true);
    };

    const openEditDialog = (client: ClientListItem) => {
        setFormData({
            first_name: client.contact.first_name || '',
            last_name: client.contact.last_name || '',
            email: client.contact.email,
            phone_number: client.contact.phone_number || '',
            company_name: client.contact.company_name || '',
        });
        setFormErrors({});
        setEditingClient(client);
        setFormDialogOpen(true);
    };

    const openDeleteDialog = (client: ClientListItem) => {
        setDeletingClient(client);
        setDeleteDialogOpen(true);
    };

    const openViewDialog = async (clientId: number) => {
        try {
            const client = await clientsApi.getById(clientId);
            setSelectedClient(client);
            setViewDialogOpen(true);
        } catch (error) {
            console.error('Failed to load client details:', error);
            showNotification('Failed to load client details', 'error');
        }
    };

    // CRUD operations
    const handleSubmit = async () => {
        const errors = validateForm(formData);
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingClient) {
                await clientsApi.update(editingClient.id, formData);
                showNotification('Client updated successfully', 'success');
            } else {
                await clientsApi.create(formData);
                showNotification('Client created successfully', 'success');
            }

            setFormDialogOpen(false);
            await loadClients();
        } catch (error) {
            console.error('Failed to save client:', error);
            showNotification(
                `Failed to ${editingClient ? 'update' : 'create'} client`,
                'error'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingClient) return;

        try {
            await clientsApi.delete(deletingClient.id);
            showNotification('Client archived successfully', 'success');
            setDeleteDialogOpen(false);
            setDeletingClient(null);
            await loadClients();
        } catch (error) {
            console.error('Failed to delete client:', error);
            showNotification('Failed to archive client', 'error');
        }
    };

    const handleFormChange = (field: keyof CreateClientData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const getProjectStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'success';
            case 'completed': return 'primary';
            case 'on_hold': return 'warning';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                    Clients
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreateDialog}
                    sx={{
                        bgcolor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark' }
                    }}
                >
                    New Client
                </Button>
            </Box>

            {/* Clients Table */}
            <Card>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                        All Clients
                    </Typography>

                    {isLoading ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                                Loading clients...
                            </Typography>
                        </Box>
                    ) : clients.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                No clients found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Clients are automatically created when inquiries are converted to won status.
                            </Typography>
                        </Box>
                    ) : (
                        <StudioTable
                            sectionColor={sectionColors.clients}
                            columns={[
                                {
                                    key: 'contact',
                                    label: 'Contact',
                                    flex: 3,
                                    headerIcon: <PersonIcon />,
                                    render: (client) => (
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {client.contact.full_name}
                                            </Typography>
                                            {client.contact.email && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                                    <EmailIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {client.contact.email}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {client.contact.phone_number && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                                    <PhoneIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {client.contact.phone_number}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {client.contact.company_name && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                                    <BusinessIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {client.contact.company_name}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    ),
                                },
                                {
                                    key: 'latest_project',
                                    label: 'Latest Project',
                                    flex: 2,
                                    headerIcon: <ProjectIcon />,
                                    render: (client) =>
                                        client.latest_project_name ? (
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {client.latest_project_name}
                                                </Typography>
                                                {client.latest_wedding_date && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {client.latest_wedding_date.toLocaleDateString()}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No projects
                                            </Typography>
                                        ),
                                },
                                {
                                    key: 'total_projects',
                                    label: 'Total Projects',
                                    width: 130,
                                    headerIcon: <CountIcon />,
                                    align: 'center',
                                    render: () => (
                                        <Typography variant="body2" color="text.secondary">
                                            View Details
                                        </Typography>
                                    ),
                                },
                                {
                                    key: 'actions',
                                    label: 'Actions',
                                    width: 140,
                                    align: 'center',
                                    render: (client) => (
                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                                            <IconButton
                                                onClick={() => openViewDialog(client.id)}
                                                size="small"
                                                color="primary"
                                                title="View Details"
                                            >
                                                <ViewIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => openEditDialog(client)}
                                                size="small"
                                                color="secondary"
                                                title="Edit Client"
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => openDeleteDialog(client)}
                                                size="small"
                                                color="error"
                                                title="Archive Client"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    ),
                                },
                            ] as StudioColumn<ClientListItem>[]}
                            rows={clients}
                            getRowKey={(c) => c.id}
                            onRowClick={(c) => openViewDialog(c.id)}
                            emptyMessage="No clients found"
                        />
                    )}
                </CardContent>
            </Card>

            {/* View Client Dialog - Unified Client Hub */}
            <Dialog open={viewDialogOpen} onClose={() => { setViewDialogOpen(false); setCurrentTab(0); }} maxWidth="lg" fullWidth>
                <DialogTitle>
                    {selectedClient ? `${selectedClient.contact.full_name} - Client Hub` : 'Client Details'}
                </DialogTitle>
                <DialogContent>
                    {selectedClient && (
                        <Box sx={{ width: '100%' }}>
                            {/* Tab Navigation */}
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                                <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
                                    <Tab label="Details" />
                                    <Tab label={`Projects (${selectedClient.projects.length})`} />
                                    <Tab label="Inquiry History" />
                                </Tabs>
                            </Box>

                            {/* Tab 1: Details */}
                            <Box hidden={currentTab !== 0} sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>Contact Information</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">First Name</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {selectedClient.contact.first_name}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">Last Name</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {selectedClient.contact.last_name}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">Email</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            <Typography variant="body1">{selectedClient.contact.email}</Typography>
                                        </Box>
                                    </Grid>
                                    {selectedClient.contact.phone_number && (
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary">Phone</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="body1">{selectedClient.contact.phone_number}</Typography>
                                            </Box>
                                        </Grid>
                                    )}
                                    {selectedClient.contact.company_name && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">Company</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="body1">{selectedClient.contact.company_name}</Typography>
                                            </Box>
                                        </Grid>
                                    )}
                                    <Grid item xs={12}>
                                        <Typography variant="body2" color="text.secondary">Client Since</Typography>
                                        <Typography variant="body1">
                                            {selectedClient.created_at.toLocaleDateString()}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Tab 2: Projects */}
                            <Box hidden={currentTab !== 1} sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">Projects</Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        size="small"
                                        onClick={() => {
                                            showNotification('New project creation coming soon!', 'success');
                                        }}
                                    >
                                        New Project
                                    </Button>
                                </Box>

                                {selectedClient.projects.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                            No projects found for this client.
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Create a new project to get started.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Project Name</TableCell>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell>Event Date</TableCell>
                                                    <TableCell>Created</TableCell>
                                                    <TableCell>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {selectedClient.projects.map((project) => (
                                                    <TableRow key={project.id}>
                                                        <TableCell>
                                                            <Link
                                                                href={`/projects/active?id=${project.id}`}
                                                                sx={{
                                                                    textDecoration: 'none',
                                                                    color: 'primary.main',
                                                                    fontWeight: 500,
                                                                    '&:hover': { textDecoration: 'underline' }
                                                                }}
                                                            >
                                                                {project.name}
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={project.status}
                                                                size="small"
                                                                color={getProjectStatusColor(project.status) as 'success' | 'primary' | 'warning' | 'error' | 'default'}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {project.start_date
                                                                ? project.start_date.toLocaleDateString()
                                                                : '-'
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {project.created_at.toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                onClick={() => {
                                                                    window.open(`/projects/active?id=${project.id}`, '_blank');
                                                                }}
                                                            >
                                                                View
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Box>

                            {/* Tab 3: Inquiry History */}
                            <Box hidden={currentTab !== 2} sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>Original Inquiry</Typography>
                                {selectedClient.inquiry ? (
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                Lead Source
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {selectedClient.inquiry.source || 'Not specified'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                Status
                                            </Typography>
                                            <Chip
                                                label={selectedClient.inquiry.status}
                                                size="small"
                                                color="primary"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                Event Date
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedClient.inquiry.event_date
                                                    ? selectedClient.inquiry.event_date.toLocaleDateString()
                                                    : 'Not specified'
                                                }
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                Inquiry Date
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedClient.inquiry.created_at.toLocaleDateString()}
                                            </Typography>
                                        </Grid>
                                        {selectedClient.inquiry.notes && (
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    Original Notes
                                                </Typography>
                                                <Box sx={{
                                                    p: 2,
                                                    bgcolor: 'grey.50',
                                                    borderRadius: 1,
                                                    border: '1px solid',
                                                    borderColor: 'grey.200'
                                                }}>
                                                    <Typography variant="body2">
                                                        {selectedClient.inquiry.notes}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        )}
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                Contact at Inquiry Time
                                            </Typography>
                                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                <Typography variant="body2">
                                                    <strong>Name:</strong> {selectedClient.inquiry.contact.full_name}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Email:</strong> {selectedClient.inquiry.contact.email}
                                                </Typography>
                                                {selectedClient.inquiry.contact.phone_number && (
                                                    <Typography variant="body2">
                                                        <strong>Phone:</strong> {selectedClient.inquiry.contact.phone_number}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                                            No inquiry history found for this client.
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            This client may have been created directly or the inquiry data is not linked.
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setViewDialogOpen(false); setSelectedClient(null); setCurrentTab(0); }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create/Edit Client Dialog */}
            <Dialog
                open={formDialogOpen}
                onClose={() => setFormDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {editingClient ? 'Edit Client' : 'Create New Client'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    value={formData.first_name}
                                    onChange={(e) => handleFormChange('first_name', e.target.value)}
                                    error={!!formErrors.first_name}
                                    helperText={formErrors.first_name}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    value={formData.last_name}
                                    onChange={(e) => handleFormChange('last_name', e.target.value)}
                                    error={!!formErrors.last_name}
                                    helperText={formErrors.last_name}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleFormChange('email', e.target.value)}
                                    error={!!formErrors.email}
                                    helperText={formErrors.email}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    value={formData.phone_number}
                                    onChange={(e) => handleFormChange('phone_number', e.target.value)}
                                    error={!!formErrors.phone_number}
                                    helperText={formErrors.phone_number}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Company Name"
                                    value={formData.company_name}
                                    onChange={(e) => handleFormChange('company_name', e.target.value)}
                                    error={!!formErrors.company_name}
                                    helperText={formErrors.company_name}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setFormDialogOpen(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
                    >
                        {isSubmitting
                            ? (editingClient ? 'Updating...' : 'Creating...')
                            : (editingClient ? 'Update Client' : 'Create Client')
                        }
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Archive Client</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        Are you sure you want to archive this client? This action will hide them from the main list but preserve all project data.
                    </Typography>
                    {deletingClient && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {deletingClient.contact.first_name} {deletingClient.contact.last_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {deletingClient.contact.email}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        variant="contained"
                    >
                        Archive Client
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={!!notification}
                autoHideDuration={6000}
                onClose={() => setNotification(null)}
            >
                <Alert
                    onClose={() => setNotification(null)}
                    severity={notification?.severity || 'info'}
                    sx={{ width: '100%' }}
                >
                    {notification?.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
