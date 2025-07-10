"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Snackbar,
    CircularProgress,
    Avatar,
    Stack,
    Tooltip,
} from "@mui/material";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Business as BrandIcon,
    CheckCircle as ActiveIcon,
    Cancel as InactiveIcon,
    LocationOn as LocationIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import { Brand } from "@/lib/types/brand";
import { useBrand } from "@/app/providers/BrandProvider";

export default function BrandsPage() {
    const router = useRouter();
    const { refreshBrands } = useBrand();

    // State
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({
        open: false,
        message: '',
        severity: 'success'
    });

    // Load brands
    const loadBrands = async () => {
        try {
            setLoading(true);
            const brands = await api.brands.getAll();
            setBrands(brands);
        } catch (err) {
            setError('Failed to load brands');
            console.error('Error loading brands:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBrands();
    }, []);

    // Handle delete brand
    const handleDelete = async () => {
        if (!brandToDelete) return;

        try {
            await api.brands.delete(brandToDelete.id);
            setSnackbar({
                open: true,
                message: 'Brand deleted successfully',
                severity: 'success'
            });
            setDeleteConfirmOpen(false);
            setBrandToDelete(null);
            await loadBrands();
            await refreshBrands(); // Refresh brand context
        } catch (err) {
            setSnackbar({
                open: true,
                message: 'Failed to delete brand',
                severity: 'error'
            });
            console.error('Error deleting brand:', err);
        }
    };

    // Handle row click to navigate to brand edit page
    const handleRowClick = (brandId: number) => {
        router.push(`/manager/brands/${brandId}`);
    };

    // Handle create new brand
    const handleCreate = () => {
        router.push('/manager/brands/new');
    };

    // Open delete confirmation
    const handleDeleteConfirm = (e: React.MouseEvent, brand: Brand) => {
        e.stopPropagation(); // Prevent row click
        setBrandToDelete(brand);
        setDeleteConfirmOpen(true);
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "400px",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                }}
            >
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Brand Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage your organization&apos;s brands and their settings
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{ borderRadius: 2 }}
                >
                    Create Brand
                </Button>
            </Box>

            {/* Stats Cards */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 2,
                    mb: 3,
                }}
            >
                <Card>
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: "primary.main" }}>
                                <BrandIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="h6">{brands.length}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Brands
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: "success.main" }}>
                                <ActiveIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="h6">
                                    {brands.filter((b) => b.is_active).length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Active Brands
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: "info.main" }}>
                                <LocationIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="h6">
                                    {new Set(brands.filter(b => b.country).map(b => b.country)).size}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Countries
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: "warning.main" }}>
                                <InactiveIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="h6">
                                    {brands.filter((b) => !b.is_active).length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Inactive Brands
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>

            {/* Brands Table */}
            <Card>
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Brand</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Contact</TableCell>
                                    <TableCell>Location</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {brands.map((brand) => (
                                    <TableRow
                                        key={brand.id}
                                        hover
                                        onClick={() => handleRowClick(brand.id)}
                                        sx={{
                                            cursor: "pointer",
                                            "&:hover": {
                                                backgroundColor: "action.hover",
                                            },
                                        }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                <Avatar
                                                    src={brand.logo_url}
                                                    sx={{ width: 40, height: 40 }}
                                                >
                                                    {brand.display_name ? brand.display_name.charAt(0).toUpperCase() : brand.name.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2">
                                                        {brand.display_name || brand.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {brand.description || `ID: ${brand.id}`}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={brand.business_type || 'Unknown'}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Stack spacing={0.5}>
                                                {brand.email && (
                                                    <Typography variant="body2">
                                                        {brand.email}
                                                    </Typography>
                                                )}
                                                {brand.phone && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {brand.phone}
                                                    </Typography>
                                                )}
                                                {brand.website && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {brand.website}
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Stack spacing={0.5}>
                                                {brand.city && brand.state && (
                                                    <Typography variant="body2">
                                                        {brand.city}, {brand.state}
                                                    </Typography>
                                                )}
                                                {brand.country && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {brand.country}
                                                    </Typography>
                                                )}
                                                <Typography variant="body2" color="text.secondary">
                                                    {brand.timezone} • {brand.currency}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={brand.is_active ? 'Active' : 'Inactive'}
                                                color={brand.is_active ? 'success' : 'error'}
                                                size="small"
                                                icon={brand.is_active ? <ActiveIcon /> : <InactiveIcon />}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Delete Brand">
                                                <IconButton
                                                    onClick={(e) => handleDeleteConfirm(e, brand)}
                                                    color="error"
                                                    size="small"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {brands.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <BrandIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No brands found
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Create your first brand to get started with multi-tenant management
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleCreate}
                                sx={{ borderRadius: 2 }}
                            >
                                Create Your First Brand
                            </Button>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
            >
                <DialogTitle>Delete Brand</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the brand &quot;{brandToDelete?.display_name || brandToDelete?.name}&quot;?
                    </Typography>
                    <Typography color="error" sx={{ mt: 2 }}>
                        This action cannot be undone and will remove all associated data.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        variant="contained"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
