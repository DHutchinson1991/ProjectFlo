"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    Chip,
    Stack,
    Breadcrumbs,
    Link,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
} from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Group as GroupIcon,
    Shield as ShieldIcon,
    Settings as SettingsIcon,
    AdminPanelSettings as AdminIcon,
    Person as PersonIcon,
    CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import { Role } from "@/lib/types";

interface RoleWithUserCount extends Role {
    userCount?: number;
}

export default function RolesPage() {
    const [roles, setRoles] = useState<RoleWithUserCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    // Form states
    const [formData, setFormData] = useState({ name: "", description: "" });
    const [formErrors, setFormErrors] = useState<{ name?: string; description?: string }>({});
    const [submitting, setSubmitting] = useState(false);

    // Menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuRoleId, setMenuRoleId] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load roles and contributors in parallel
            const [rolesData, contributorsData] = await Promise.all([
                api.roles.getAll(),
                api.contributors.getAll()
            ]);

            // Calculate user count for each role
            const rolesWithCount = rolesData.map(role => ({
                ...role,
                userCount: contributorsData.filter(contributor => contributor.role_id === role.id).length
            }));

            setRoles(rolesWithCount);
        } catch (err) {
            setError("Failed to load roles data");
            console.error("Error loading roles:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, roleId: number) => {
        setAnchorEl(event.currentTarget);
        setMenuRoleId(roleId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuRoleId(null);
    };

    const handleCreateRole = () => {
        setFormData({ name: "", description: "" });
        setFormErrors({});
        setCreateDialogOpen(true);
    };

    const handleEditRole = (role: Role) => {
        setSelectedRole(role);
        setFormData({ name: role.name, description: role.description || "" });
        setFormErrors({});
        setEditDialogOpen(true);
        handleMenuClose();
    };

    const handleDeleteRole = (role: Role) => {
        setSelectedRole(role);
        setDeleteDialogOpen(true);
        handleMenuClose();
    };

    const validateForm = () => {
        const errors: { name?: string; description?: string } = {};

        if (!formData.name.trim()) {
            errors.name = "Role name is required";
        } else if (formData.name.length < 2) {
            errors.name = "Role name must be at least 2 characters";
        }

        if (formData.description && formData.description.length > 500) {
            errors.description = "Description must be less than 500 characters";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitCreate = async () => {
        if (!validateForm()) return;

        try {
            setSubmitting(true);
            setError(null);

            await api.roles.create({
                name: formData.name.trim(),
                description: formData.description.trim() || undefined
            });

            await loadData();
            setCreateDialogOpen(false);
            setSuccess("Role created successfully!");
        } catch (err) {
            setError("Failed to create role");
            console.error("Error creating role:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitEdit = async () => {
        if (!selectedRole || !validateForm()) return;

        try {
            setSubmitting(true);
            setError(null);

            await api.roles.update(selectedRole.id, {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined
            });

            await loadData();
            setEditDialogOpen(false);
            setSelectedRole(null);
            setSuccess("Role updated successfully!");
        } catch (err) {
            setError("Failed to update role");
            console.error("Error updating role:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitDelete = async () => {
        if (!selectedRole) return;

        try {
            setSubmitting(true);
            setError(null);

            await api.roles.delete(selectedRole.id);

            await loadData();
            setDeleteDialogOpen(false);
            setSelectedRole(null);
            setSuccess("Role deleted successfully!");
        } catch (err) {
            setError("Failed to delete role");
            console.error("Error deleting role:", err);
        } finally {
            setSubmitting(false);
        }
    };



    const getRoleIcon = (roleName: string) => {
        const name = roleName.toLowerCase();
        if (name.includes("admin")) return <AdminIcon />;
        if (name.includes("manager")) return <ShieldIcon />;
        if (name.includes("lead")) return <GroupIcon />;
        return <PersonIcon />;
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh" }}>
            {/* Header Section */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                            Role Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Manage user roles and permissions across the system
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateRole}
                        size="large"
                        sx={{ fontWeight: 600 }}
                    >
                        Create Role
                    </Button>
                </Box>

                {/* Breadcrumbs */}
                <Breadcrumbs aria-label="breadcrumb">
                    <Link
                        underline="hover"
                        color="inherit"
                        href="/manager"
                        sx={{ display: "flex", alignItems: "center" }}
                    >
                        <SettingsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                        Management
                    </Link>
                    <Typography color="text.primary" sx={{ fontWeight: 600 }}>
                        Roles
                    </Typography>
                </Breadcrumbs>
            </Box>

            {/* Main Content */}
            <Box sx={{ p: 3 }}>
                {/* Success/Error Alerts */}
                {success && (
                    <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                        {success}
                    </Alert>
                )}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Roles Table */}
                <Card>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Users</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {roles.map((role) => (
                                    <TableRow key={role.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                {getRoleIcon(role.name)}
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                        {role.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        ID: {role.id}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {role.description || "No description"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${role.userCount || 0} users`}
                                                size="small"
                                                color={role.userCount && role.userCount > 0 ? "primary" : "default"}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={<CheckCircleIcon />}
                                                label="Active"
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                onClick={(e) => handleMenuOpen(e, role.id)}
                                                size="small"
                                            >
                                                <MoreVertIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {roles.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body1" color="text.secondary">
                                                No roles available
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            </Box>

            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem
                    onClick={() => {
                        const role = roles.find(r => r.id === menuRoleId);
                        if (role) handleEditRole(role);
                    }}
                >
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit Role</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem
                    onClick={() => {
                        const role = roles.find(r => r.id === menuRoleId);
                        if (role) handleDeleteRole(role);
                    }}
                    sx={{ color: "error.main" }}
                >
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Delete Role</ListItemText>
                </MenuItem>
            </Menu>

            {/* Create Role Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            label="Role Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            error={!!formErrors.name}
                            helperText={formErrors.name}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            error={!!formErrors.description}
                            helperText={formErrors.description}
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Describe the role's responsibilities and permissions..."
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmitCreate}
                        variant="contained"
                        disabled={submitting}
                        startIcon={submitting ? <CircularProgress size={16} /> : <AddIcon />}
                    >
                        {submitting ? "Creating..." : "Create Role"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Role</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            label="Role Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            error={!!formErrors.name}
                            helperText={formErrors.name}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            error={!!formErrors.description}
                            helperText={formErrors.description}
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Describe the role's responsibilities and permissions..."
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmitEdit}
                        variant="contained"
                        disabled={submitting}
                        startIcon={submitting ? <CircularProgress size={16} /> : <EditIcon />}
                    >
                        {submitting ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Role Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Delete Role</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                            Are you sure you want to delete this role?
                        </Typography>
                        <Typography variant="body2">
                            This action cannot be undone. Users assigned to this role may lose access to certain features.
                        </Typography>
                    </Alert>
                    {selectedRole && (
                        <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {selectedRole.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {selectedRole.description || "No description"}
                            </Typography>
                            <Typography variant="caption" color="error">
                                {roles.find(r => r.id === selectedRole.id)?.userCount || 0} users currently have this role
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmitDelete}
                        variant="contained"
                        color="error"
                        disabled={submitting}
                        startIcon={submitting ? <CircularProgress size={16} /> : <DeleteIcon />}
                    >
                        {submitting ? "Deleting..." : "Delete Role"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
