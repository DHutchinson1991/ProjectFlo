"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useBrand } from "@/app/providers/BrandProvider";
import { useQueryClient } from "@tanstack/react-query";
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
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar,
    CircularProgress,
    Avatar,
    Stack,
} from "@mui/material";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Person as PersonIcon,
    AdminPanelSettings as AdminIcon,
    Work as WorkIcon,
    CheckCircle as ActiveIcon,
    Cancel as InactiveIcon,
    Pending as PendingIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import { NewContributorData, UpdateContributorDto } from "@/lib/types";

interface User {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    role?: {
        id: number;
        name: string;
    } | null;
    contributor_type?: string;
    status?: "active" | "inactive" | "pending";
    last_login?: string;
    created_at?: string;
}

export default function UsersPage() {
    const router = useRouter();
    const { currentBrand } = useBrand();
    const queryClient = useQueryClient();

    // React Query for contributors data
    const {
        data: contributors = [],
        isLoading: contributorsLoading,
        error: contributorsError,
    } = useQuery({
        queryKey: ["contributors", currentBrand?.id],
        queryFn: () => api.contributors.getAll(),
        enabled: !!currentBrand,
    });

    // React Query for roles data
    const {
        data: roles = [],
        isLoading: rolesLoading,
        error: rolesError,
    } = useQuery({
        queryKey: ["roles"],
        queryFn: () => api.roles.getAll(),
    });

    // Transform contributors to users format
    const users = contributors.map((contributor) => ({
        id: contributor.id,
        email: contributor.contact?.email || "",
        first_name: contributor.contact?.first_name || "",
        last_name: contributor.contact?.last_name || "",
        role: contributor.role,
        contributor_type: contributor.contributor_type,
        status: "active" as const,
        last_login: undefined,
        created_at: undefined,
    }));

    const loading = contributorsLoading || rolesLoading;

    console.log("Raw usersResponse:", contributors);
    console.log("Raw rolesResponse:", roles);
    console.log("Transformed users:", users);
    console.log("Admin count:", users.filter((u) => u.role?.name === "Admin").length);
    console.log("Current brand:", currentBrand);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        role_id: "",
        contributor_type: "Internal",
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const handleOpenDialog = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                email: user.email,
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                password: "",
                role_id: user.role?.id?.toString() || "",
                contributor_type: user.contributor_type || "Internal",
            });
        } else {
            setEditingUser(null);
            setFormData({
                email: "",
                first_name: "",
                last_name: "",
                password: "",
                role_id: "",
                contributor_type: "Internal",
            });
        }
        setErrors({});
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingUser(null);
        setFormData({
            email: "",
            first_name: "",
            last_name: "",
            password: "",
            role_id: "",
            contributor_type: "Internal",
        });
        setErrors({});
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!formData.first_name) {
            newErrors.first_name = "First name is required";
        }

        if (!formData.last_name) {
            newErrors.last_name = "Last name is required";
        }

        if (!editingUser && !formData.password) {
            newErrors.password = "Password is required for new users";
        } else if (formData.password && formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters long";
        }

        if (!formData.role_id) {
            newErrors.role_id = "Role is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            if (editingUser) {
                // Update user
                const updateData: UpdateContributorDto = {
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    role_id: parseInt(formData.role_id),
                    contributor_type: formData.contributor_type,
                };

                if (formData.password) {
                    updateData.password = formData.password;
                }

                await api.contributors.update(editingUser.id, updateData);
                setSnackbar({
                    open: true,
                    message: "User updated successfully",
                    severity: "success",
                });
            } else {
                // Create new user
                const newUserData: NewContributorData = {
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    password: formData.password,
                    role_id: parseInt(formData.role_id),
                    contributor_type: formData.contributor_type,
                };

                await api.contributors.create(newUserData);
                setSnackbar({
                    open: true,
                    message: "User created successfully",
                    severity: "success",
                });
            }

            handleCloseDialog();
            // Invalidate and refetch contributors and roles data
            queryClient.invalidateQueries({ queryKey: ["contributors"] });
            queryClient.invalidateQueries({ queryKey: ["roles"] });
        } catch (error) {
            console.error("Error saving user:", error);
            setSnackbar({
                open: true,
                message: `Failed to ${editingUser ? "update" : "create"} user`,
                severity: "error",
            });
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            await api.contributors.delete(userToDelete.id);
            setSnackbar({
                open: true,
                message: "User deleted successfully",
                severity: "success",
            });
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            // Invalidate and refetch contributors data
            queryClient.invalidateQueries({ queryKey: ["contributors"] });
        } catch (error) {
            console.error("Error deleting user:", error);
            setSnackbar({
                open: true,
                message: "Failed to delete user",
                severity: "error",
            });
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "active":
                return <ActiveIcon sx={{ color: "success.main" }} />;
            case "inactive":
                return <InactiveIcon sx={{ color: "error.main" }} />;
            case "pending":
                return <PendingIcon sx={{ color: "warning.main" }} />;
            default:
                return <ActiveIcon sx={{ color: "success.main" }} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "success";
            case "inactive":
                return "error";
            case "pending":
                return "warning";
            default:
                return "success";
        }
    };

    const getRoleIcon = (roleName: string) => {
        switch (roleName.toLowerCase()) {
            case "admin":
                return <AdminIcon />;
            case "contributor":
                return <WorkIcon />;
            default:
                return <PersonIcon />;
        }
    };

    const handleUserClick = (userId: number) => {
        router.push(`/manager/users/${userId}`);
    };

    const getUserInitials = (firstName?: string, lastName?: string) => {
        const first = firstName?.charAt(0) || "";
        const last = lastName?.charAt(0) || "";
        return `${first}${last}`.toUpperCase();
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

    if (contributorsError || rolesError) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "400px",
                }}
            >
                <Alert severity="error">
                    Failed to load users data. Please try again.
                </Alert>
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
                        Users Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage user accounts, roles, and permissions
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: 2 }}
                >
                    Add New User
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
                                <PersonIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="h6">{users.length}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Users
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
                                    {users.filter((u) => u.status === "active").length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Active Users
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: "info.main" }}>
                                <AdminIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="h6">
                                    {users.filter((u) => u.role?.name === "Admin").length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Administrators
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>

            {/* Users Table */}
            <Card>
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>User</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow
                                        key={user.id}
                                        hover
                                        onClick={() => handleUserClick(user.id)}
                                        sx={{
                                            cursor: "pointer",
                                            "&:hover": {
                                                backgroundColor: "action.hover",
                                            },
                                        }}
                                    >
                                        <TableCell>
                                            <Box
                                                sx={{ display: "flex", alignItems: "center", gap: 2 }}
                                            >
                                                <Avatar sx={{ bgcolor: "primary.main" }}>
                                                    {getUserInitials(user.first_name, user.last_name)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2">
                                                        {user.first_name} {user.last_name}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        ID: {user.id}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{user.email}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={getRoleIcon(user.role?.name || 'Unknown')}
                                                label={user.role?.name || 'No Role'}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{ textTransform: "capitalize" }}
                                            >
                                                {user.contributor_type || "Internal"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={getStatusIcon(user.status || "active")}
                                                label={user.status || "Active"}
                                                size="small"
                                                color={
                                                    getStatusColor(user.status || "active") as
                                                    | "success"
                                                    | "error"
                                                    | "warning"
                                                }
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent row click
                                                    setUserToDelete(user);
                                                    setDeleteDialogOpen(true);
                                                }}
                                                sx={{
                                                    color: "error.main",
                                                    "&:hover": {
                                                        backgroundColor: "error.light",
                                                        opacity: 0.1,
                                                    }
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Add/Edit User Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "grid", gap: 2, pt: 2 }}>
                        <TextField
                            label="Email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            error={!!errors.email}
                            helperText={errors.email}
                            required
                            fullWidth
                        />
                        <Box
                            sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
                        >
                            <TextField
                                label="First Name"
                                value={formData.first_name}
                                onChange={(e) =>
                                    setFormData({ ...formData, first_name: e.target.value })
                                }
                                error={!!errors.first_name}
                                helperText={errors.first_name}
                                required
                            />
                            <TextField
                                label="Last Name"
                                value={formData.last_name}
                                onChange={(e) =>
                                    setFormData({ ...formData, last_name: e.target.value })
                                }
                                error={!!errors.last_name}
                                helperText={errors.last_name}
                                required
                            />
                        </Box>
                        <TextField
                            label="Password"
                            type="password"
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                            error={!!errors.password}
                            helperText={
                                errors.password ||
                                (editingUser ? "Leave blank to keep current password" : "")
                            }
                            required={!editingUser}
                            fullWidth
                        />
                        <Box
                            sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
                        >
                            <FormControl required error={!!errors.role_id}>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={formData.role_id}
                                    onChange={(e) =>
                                        setFormData({ ...formData, role_id: e.target.value })
                                    }
                                    label="Role"
                                >
                                    {roles.map((role) => (
                                        <MenuItem key={role.id} value={role.id.toString()}>
                                            {role.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={formData.contributor_type}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            contributor_type: e.target.value,
                                        })
                                    }
                                    label="Type"
                                >
                                    <MenuItem value="Internal">Internal</MenuItem>
                                    <MenuItem value="External">External</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editingUser ? "Update" : "Create"} User
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete user &quot;
                        {userToDelete?.first_name} {userToDelete?.last_name}&quot;? This
                        action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteUser} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
