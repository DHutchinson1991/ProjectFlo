"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Divider,
    Chip,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Person as ProfileIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Group as GroupIcon,
    Shield as ShieldFilledIcon,
    AdminPanelSettings as AdminIcon,
    CheckCircle as CheckCircleIcon,
    SupervisorAccount as RolesIcon,
} from "@mui/icons-material";
import { rolesApi } from "@/features/platform/settings/api";
import { crewMembersApi } from "@/features/workflow/crew/api";
import { Role } from "@/shared/types/users";

interface RoleWithUserCount extends Role {
    userCount?: number;
}

export default function RolesSettings() {
    const [roles, setRoles] = useState<RoleWithUserCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    const [roleFormData, setRoleFormData] = useState({ name: "", description: "" });
    const [roleFormErrors, setRoleFormErrors] = useState<{ name?: string; description?: string }>({});
    const [submitting, setSubmitting] = useState(false);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuRoleId, setMenuRoleId] = useState<number | null>(null);

    useEffect(() => { loadRoles(); }, []);

    const loadRoles = async () => {
        try {
            setLoading(true); setError(null);
            const [rolesData, contributorsData] = await Promise.all([rolesApi.getAll(), crewMembersApi.getAll()]);
            const rolesWithCount = rolesData.map((role) => ({ ...role, userCount: contributorsData.filter((c) => c.role_id === role.id).length }));
            setRoles(rolesWithCount);
        } catch { setError("Failed to load roles data"); }
        finally { setLoading(false); }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, roleId: number) => { setAnchorEl(event.currentTarget); setMenuRoleId(roleId); };
    const handleMenuClose = () => { setAnchorEl(null); setMenuRoleId(null); };

    const handleCreateRole = () => { setRoleFormData({ name: "", description: "" }); setRoleFormErrors({}); setCreateDialogOpen(true); };
    const handleEditRole = (role: Role) => { setSelectedRole(role); setRoleFormData({ name: role.name, description: role.description || "" }); setRoleFormErrors({}); setEditDialogOpen(true); handleMenuClose(); };
    const handleDeleteRole = (role: Role) => { setSelectedRole(role); setDeleteDialogOpen(true); handleMenuClose(); };

    const validateRoleForm = () => {
        const errors: { name?: string; description?: string } = {};
        if (!roleFormData.name.trim()) errors.name = "Role name is required";
        else if (roleFormData.name.length < 2) errors.name = "Role name must be at least 2 characters";
        if (roleFormData.description && roleFormData.description.length > 500) errors.description = "Description must be less than 500 characters";
        setRoleFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitCreate = async () => {
        if (!validateRoleForm()) return;
        try { setSubmitting(true); setError(null); await rolesApi.create({ name: roleFormData.name.trim(), description: roleFormData.description.trim() || undefined }); await loadRoles(); setCreateDialogOpen(false); setSuccess("Role created successfully!"); }
        catch { setError("Failed to create role"); } finally { setSubmitting(false); }
    };

    const handleSubmitEdit = async () => {
        if (!selectedRole || !validateRoleForm()) return;
        try { setSubmitting(true); setError(null); await rolesApi.update(selectedRole.id, { name: roleFormData.name.trim(), description: roleFormData.description.trim() || undefined }); await loadRoles(); setEditDialogOpen(false); setSelectedRole(null); setSuccess("Role updated successfully!"); }
        catch { setError("Failed to update role"); } finally { setSubmitting(false); }
    };

    const handleSubmitDelete = async () => {
        if (!selectedRole) return;
        try { setSubmitting(true); setError(null); await rolesApi.delete(selectedRole.id); await loadRoles(); setDeleteDialogOpen(false); setSelectedRole(null); setSuccess("Role deleted successfully!"); }
        catch { setError("Failed to delete role"); } finally { setSubmitting(false); }
    };

    const getRoleIcon = (roleName: string) => {
        const name = roleName.toLowerCase();
        if (name.includes("admin")) return <AdminIcon sx={{ fontSize: 20, color: "primary.main" }} />;
        if (name.includes("manager")) return <ShieldFilledIcon sx={{ fontSize: 20, color: "primary.main" }} />;
        if (name.includes("lead")) return <GroupIcon sx={{ fontSize: 20, color: "primary.main" }} />;
        return <ProfileIcon sx={{ fontSize: 20, color: "text.secondary" }} />;
    };

    if (loading) return <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}><CircularProgress /></Box>;

    return (
        <>
            <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3, p: 2.5, borderRadius: 3, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04), border: 1, borderColor: (theme) => alpha(theme.palette.primary.main, 0.1) }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12) }}>
                    <RolesIcon sx={{ color: "primary.main", fontSize: 24 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1.1rem" }}>Roles & Permissions</Typography>
                    <Typography variant="body2" color="text.secondary">Manage user roles and permissions across the system</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateRole} size="small" disableElevation sx={{ fontWeight: 600, borderRadius: 2, flexShrink: 0 }}>Create Role</Button>
            </Box>

            {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <Box sx={{ borderRadius: 2.5, border: 1, borderColor: "divider", overflow: "hidden", bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }}>Description</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }}>Users</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {roles.map((role) => (
                                <TableRow key={role.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            {getRoleIcon(role.name)}
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>{role.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">ID: {role.id}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell><Typography variant="body2" color="text.secondary">{role.description || "No description"}</Typography></TableCell>
                                    <TableCell>
                                        <Chip label={`${role.userCount || 0} users`} size="small" sx={{ fontWeight: 600, height: 22, fontSize: "0.7rem", bgcolor: (theme) => role.userCount && role.userCount > 0 ? alpha(theme.palette.primary.main, 0.12) : undefined, color: role.userCount && role.userCount > 0 ? "primary.main" : undefined }} />
                                    </TableCell>
                                    <TableCell>
                                        <Chip icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} label="Active" size="small" color="success" variant="outlined" sx={{ fontWeight: 500, height: 22, fontSize: "0.7rem" }} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={(e) => handleMenuOpen(e, role.id)} size="small"><MoreVertIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {roles.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><Typography variant="body2" color="text.secondary">No roles available</Typography></TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => { const role = roles.find((r) => r.id === menuRoleId); if (role) handleEditRole(role); }}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon><ListItemText>Edit Role</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { const role = roles.find((r) => r.id === menuRoleId); if (role) handleDeleteRole(role); }} sx={{ color: "error.main" }}>
                    <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon><ListItemText>Delete Role</ListItemText>
                </MenuItem>
            </Menu>

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Create New Role</DialogTitle><Divider />
                <DialogContent><Stack spacing={2.5} sx={{ mt: 1 }}>
                    <TextField label="Role Name" value={roleFormData.name} onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })} error={!!roleFormErrors.name} helperText={roleFormErrors.name} fullWidth required size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                    <TextField label="Description" value={roleFormData.description} onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })} error={!!roleFormErrors.description} helperText={roleFormErrors.description} fullWidth multiline rows={3} size="small" placeholder="Describe the role's responsibilities…" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                </Stack></DialogContent><Divider />
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setCreateDialogOpen(false)} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleSubmitCreate} variant="contained" disabled={submitting} disableElevation startIcon={submitting ? <CircularProgress size={14} /> : <AddIcon />} sx={{ borderRadius: 2, fontWeight: 600 }}>{submitting ? "Creating…" : "Create Role"}</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Edit Role</DialogTitle><Divider />
                <DialogContent><Stack spacing={2.5} sx={{ mt: 1 }}>
                    <TextField label="Role Name" value={roleFormData.name} onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })} error={!!roleFormErrors.name} helperText={roleFormErrors.name} fullWidth required size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                    <TextField label="Description" value={roleFormData.description} onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })} error={!!roleFormErrors.description} helperText={roleFormErrors.description} fullWidth multiline rows={3} size="small" placeholder="Describe the role's responsibilities…" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                </Stack></DialogContent><Divider />
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setEditDialogOpen(false)} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleSubmitEdit} variant="contained" disabled={submitting} disableElevation startIcon={submitting ? <CircularProgress size={14} /> : <EditIcon />} sx={{ borderRadius: 2, fontWeight: 600 }}>{submitting ? "Saving…" : "Save Changes"}</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Delete Role</DialogTitle><Divider />
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Are you sure you want to delete this role?</Typography>
                        <Typography variant="body2">This action cannot be undone. Users assigned to this role may lose access.</Typography>
                    </Alert>
                    {selectedRole && (
                        <Box sx={{ p: 2, borderRadius: 2, border: 1, borderColor: "divider" }}>
                            <Typography variant="body2" fontWeight={600}>{selectedRole.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{selectedRole.description || "No description"}</Typography>
                            <Typography variant="caption" display="block" color="error.main" sx={{ mt: 0.5 }}>{roles.find((r) => r.id === selectedRole.id)?.userCount || 0} users currently have this role</Typography>
                        </Box>
                    )}
                </DialogContent><Divider />
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleSubmitDelete} variant="contained" color="error" disabled={submitting} disableElevation startIcon={submitting ? <CircularProgress size={14} /> : <DeleteIcon />} sx={{ borderRadius: 2, fontWeight: 600 }}>{submitting ? "Deleting…" : "Delete Role"}</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
