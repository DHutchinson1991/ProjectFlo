"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Avatar,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Stack,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Menu,
    ListItemIcon,
    ListItemText,
    IconButton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Edit as EditIcon,
    MoreVert as MoreVertIcon,
    PersonAdd as PersonAddIcon,
    Block as BlockIcon,
    Restore as RestoreIcon,
    CheckCircle as CheckCircleIcon,
    PeopleOutline as UsersIcon,
} from "@mui/icons-material";
import { rolesApi } from "@/features/platform/settings/api";
import { crewMembersApi } from "@/features/workflow/crew/api";
import { CrewMember, Role } from "@/shared/types/users";
import { useAuth } from "@/features/platform/auth";

export function UsersSettings() {
    const [crewMembers, setContributors] = useState<CrewMember[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const { user } = useAuth();

    // Dialog states
    const [inviteOpen, setInviteOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [archiveOpen, setArchiveOpen] = useState(false);
    const [selected, setSelected] = useState<CrewMember | null>(null);

    // Invite form
    const [inviteData, setInviteData] = useState({ email: "", first_name: "", last_name: "", password: "", role_id: 0 });
    const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});

    // Edit form
    const [editData, setEditData] = useState({ first_name: "", last_name: "", email: "", role_id: 0 });
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});

    const [submitting, setSubmitting] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuUserId, setMenuUserId] = useState<number | null>(null);

    // Filters
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const [contribData, rolesData] = await Promise.all([
                crewMembersApi.getAll(),
                rolesApi.getAll(),
            ]);
            setContributors(contribData);
            setRoles(rolesData);
        } catch {
            setError("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const activeUsers = contributors.filter((c) => !c.archived_at);
    const archivedUsers = contributors.filter((c) => !!c.archived_at);
    const displayedUsers = showArchived ? archivedUsers : activeUsers;

    // Menu
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: number) => {
        setAnchorEl(event.currentTarget);
        setMenuUserId(id);
    };
    const handleMenuClose = () => { setAnchorEl(null); setMenuUserId(null); };

    // Invite
    const openInvite = () => {
        setInviteData({ email: "", first_name: "", last_name: "", password: "", role_id: roles[0]?.id || 0 });
        setInviteErrors({});
        setInviteOpen(true);
    };
    const validateInvite = () => {
        const errs: Record<string, string> = {};
        if (!inviteData.email.trim()) errs.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteData.email)) errs.email = "Invalid email";
        if (!inviteData.first_name.trim()) errs.first_name = "First name is required";
        if (!inviteData.password || inviteData.password.length < 6) errs.password = "Min 6 characters";
        if (!inviteData.role_id) errs.role_id = "Select a role";
        setInviteErrors(errs);
        return Object.keys(errs).length === 0;
    };
    const handleInviteSubmit = async () => {
        if (!validateInvite()) return;
        try {
            setSubmitting(true); setError(null);
            await crewMembersApi.create({
                email: inviteData.email.trim(),
                first_name: inviteData.first_name.trim(),
                last_name: inviteData.last_name.trim() || undefined,
                password: inviteData.password,
                role_id: inviteData.role_id,
            });
            await loadUsers();
            setInviteOpen(false);
            setSuccess("User invited successfully!");
        } catch {
            setError("Failed to create user");
        } finally {
            setSubmitting(false);
        }
    };

    // Edit
    const openEdit = (c: CrewMember) => {
        setSelected(c);
        setEditData({ first_name: c.first_name || "", last_name: c.last_name || "", email: c.email, role_id: c.role_id });
        setEditErrors({});
        setEditOpen(true);
        handleMenuClose();
    };
    const validateEdit = () => {
        const errs: Record<string, string> = {};
        if (!editData.email.trim()) errs.email = "Email is required";
        if (!editData.first_name.trim()) errs.first_name = "First name is required";
        setEditErrors(errs);
        return Object.keys(errs).length === 0;
    };
    const handleEditSubmit = async () => {
        if (!selected || !validateEdit()) return;
        try {
            setSubmitting(true); setError(null);
            await crewMembersApi.update(selected.id, {
                first_name: editData.first_name.trim(),
                last_name: editData.last_name.trim() || undefined,
                email: editData.email.trim(),
                role_id: editData.role_id,
            });
            await loadUsers();
            setEditOpen(false); setSelected(null);
            setSuccess("User updated successfully!");
        } catch {
            setError("Failed to update user");
        } finally {
            setSubmitting(false);
        }
    };

    // Archive / Restore
    const openArchive = (c: CrewMember) => {
        setSelected(c);
        setArchiveOpen(true);
        handleMenuClose();
    };
    const handleArchiveSubmit = async () => {
        if (!selected) return;
        try {
            setSubmitting(true); setError(null);
            await crewMembersApi.delete(selected.id);
            await loadUsers();
            setArchiveOpen(false); setSelected(null);
            setSuccess(selected.archived_at ? "User restored!" : "User archived!");
        } catch {
            setError("Failed to update user status");
        } finally {
            setSubmitting(false);
        }
    };

    const getRoleName = (roleId: number) => roles.find((r) => r.id === roleId)?.name || "Unknown";

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            {/* ─── Users Header ─── */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 2,
                    mb: 3,
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                    border: 1,
                    borderColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                }}
            >
                <Box
                    sx={{
                        width: 48, height: 48, borderRadius: 2,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                    }}
                >
                    <UsersIcon sx={{ color: "primary.main", fontSize: 24 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1.1rem" }}>
                            Team Members
                        </Typography>
                        <Chip
                            label={`${activeUsers.length} active`}
                            size="small"
                            sx={{
                                fontWeight: 600, height: 22, fontSize: "0.7rem",
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                                color: "primary.main",
                            }}
                        />
                        {archivedUsers.length > 0 && (
                            <Chip
                                label={`${archivedUsers.length} archived`}
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 500, height: 22, fontSize: "0.7rem", opacity: 0.6 }}
                            />
                        )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Manage who has access to your workspace
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                    {archivedUsers.length > 0 && (
                        <Button
                            variant={showArchived ? "contained" : "outlined"}
                            size="small"
                            onClick={() => setShowArchived(!showArchived)}
                            disableElevation
                            sx={{ borderRadius: 2, fontWeight: 500, textTransform: "none", fontSize: "0.8rem" }}
                        >
                            {showArchived ? "Show Active" : "Show Archived"}
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<PersonAddIcon />}
                        onClick={openInvite}
                        size="small"
                        disableElevation
                        sx={{ fontWeight: 600, borderRadius: 2 }}
                    >
                        Add User
                    </Button>
                </Box>
            </Box>

            {/* Alerts */}
            {success && (
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}
            {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* ─── Users Table ─── */}
            <Box
                sx={{
                    borderRadius: 2.5,
                    border: 1,
                    borderColor: "divider",
                    overflow: "hidden",
                    bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
                }}
            >
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {displayedUsers.map((c) => {
                                const isSelf = user?.id === c.id;
                                return (
                                    <TableRow key={c.id} hover sx={{ opacity: c.archived_at ? 0.55 : 1 }}>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Avatar
                                                    sx={{
                                                        width: 32, height: 32, fontSize: "0.75rem", fontWeight: 700,
                                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                                                        color: "primary.main",
                                                    }}
                                                >
                                                    {c.initials}
                                                </Avatar>
                                                <Box>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {c.full_name}
                                                        </Typography>
                                                        {isSelf && (
                                                            <Chip label="You" size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600 }} />
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">{c.email}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getRoleName(c.role_id)}
                                                size="small"
                                                sx={{
                                                    fontWeight: 600, height: 22, fontSize: "0.7rem",
                                                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                                    color: "primary.main",
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={c.archived_at ? <BlockIcon sx={{ fontSize: 14 }} /> : <CheckCircleIcon sx={{ fontSize: 14 }} />}
                                                label={c.archived_at ? "Archived" : "Active"}
                                                size="small"
                                                color={c.archived_at ? "default" : "success"}
                                                variant="outlined"
                                                sx={{ fontWeight: 500, height: 22, fontSize: "0.7rem" }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={(e) => handleMenuOpen(e, c.id)} size="small" disabled={isSelf}>
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {displayedUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {showArchived ? "No archived users" : "No active users"}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Action Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => { const c = contributors.find((u) => u.id === menuUserId); if (c) openEdit(c); }}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Edit User</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem
                    onClick={() => { const c = contributors.find((u) => u.id === menuUserId); if (c) openArchive(c); }}
                    sx={{ color: contributors.find((u) => u.id === menuUserId)?.archived_at ? "success.main" : "error.main" }}
                >
                    <ListItemIcon>
                        {contributors.find((u) => u.id === menuUserId)?.archived_at
                            ? <RestoreIcon fontSize="small" color="success" />
                            : <BlockIcon fontSize="small" color="error" />}
                    </ListItemIcon>
                    <ListItemText>
                        {contributors.find((u) => u.id === menuUserId)?.archived_at ? "Restore User" : "Archive User"}
                    </ListItemText>
                </MenuItem>
            </Menu>

            {/* Invite Dialog */}
            <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Add New User</DialogTitle>
                <Divider />
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField label="First Name" value={inviteData.first_name} onChange={(e) => setInviteData({ ...inviteData, first_name: e.target.value })} error={!!inviteErrors.first_name} helperText={inviteErrors.first_name} fullWidth required size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField label="Last Name" value={inviteData.last_name} onChange={(e) => setInviteData({ ...inviteData, last_name: e.target.value })} fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                            </Grid>
                        </Grid>
                        <TextField label="Email" type="email" value={inviteData.email} onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })} error={!!inviteErrors.email} helperText={inviteErrors.email} fullWidth required size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                        <TextField label="Password" type="password" value={inviteData.password} onChange={(e) => setInviteData({ ...inviteData, password: e.target.value })} error={!!inviteErrors.password} helperText={inviteErrors.password || "Minimum 6 characters"} fullWidth required size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                        <FormControl fullWidth size="small" error={!!inviteErrors.role_id}>
                            <InputLabel>Role</InputLabel>
                            <Select value={inviteData.role_id || ""} onChange={(e) => setInviteData({ ...inviteData, role_id: Number(e.target.value) })} label="Role" sx={{ borderRadius: 2 }}>
                                {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                            </Select>
                            {inviteErrors.role_id && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{inviteErrors.role_id}</Typography>}
                        </FormControl>
                    </Stack>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setInviteOpen(false)} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleInviteSubmit} variant="contained" disabled={submitting} disableElevation startIcon={submitting ? <CircularProgress size={14} /> : <PersonAddIcon />} sx={{ borderRadius: 2, fontWeight: 600 }}>
                        {submitting ? "Creating…" : "Add User"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Edit User</DialogTitle>
                <Divider />
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField label="First Name" value={editData.first_name} onChange={(e) => setEditData({ ...editData, first_name: e.target.value })} error={!!editErrors.first_name} helperText={editErrors.first_name} fullWidth required size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField label="Last Name" value={editData.last_name} onChange={(e) => setEditData({ ...editData, last_name: e.target.value })} fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                            </Grid>
                        </Grid>
                        <TextField label="Email" type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} error={!!editErrors.email} helperText={editErrors.email} fullWidth required size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                        <FormControl fullWidth size="small">
                            <InputLabel>Role</InputLabel>
                            <Select value={editData.role_id} onChange={(e) => setEditData({ ...editData, role_id: Number(e.target.value) })} label="Role" sx={{ borderRadius: 2 }}>
                                {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setEditOpen(false)} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleEditSubmit} variant="contained" disabled={submitting} disableElevation startIcon={submitting ? <CircularProgress size={14} /> : <EditIcon />} sx={{ borderRadius: 2, fontWeight: 600 }}>
                        {submitting ? "Saving…" : "Save Changes"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Archive / Restore Dialog */}
            <Dialog open={archiveOpen} onClose={() => setArchiveOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {selected?.archived_at ? "Restore User" : "Archive User"}
                </DialogTitle>
                <Divider />
                <DialogContent>
                    <Alert severity={selected?.archived_at ? "info" : "warning"} sx={{ mb: 2, borderRadius: 2 }}>
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                            {selected?.archived_at
                                ? "This will restore the user's access to the workspace."
                                : "This will revoke the user's access to the workspace."}
                        </Typography>
                        <Typography variant="body2">
                            {selected?.archived_at
                                ? "They will be able to log in and use the system again."
                                : "They will no longer be able to log in. You can restore them later."}
                        </Typography>
                    </Alert>
                    {selected && (
                        <Box sx={{ p: 2, borderRadius: 2, border: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 2 }}>
                            <Avatar sx={{ width: 36, height: 36, fontSize: "0.8rem", fontWeight: 700, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15), color: "primary.main" }}>
                                {selected.initials}
                            </Avatar>
                            <Box>
                                <Typography variant="body2" fontWeight={600}>{selected.full_name}</Typography>
                                <Typography variant="caption" color="text.secondary">{selected.email} · {getRoleName(selected.role_id)}</Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setArchiveOpen(false)} disabled={submitting}>Cancel</Button>
                    <Button
                        onClick={handleArchiveSubmit}
                        variant="contained"
                        color={selected?.archived_at ? "primary" : "error"}
                        disabled={submitting}
                        disableElevation
                        startIcon={submitting ? <CircularProgress size={14} /> : (selected?.archived_at ? <RestoreIcon /> : <BlockIcon />)}
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                    >
                        {submitting ? "Processing…" : (selected?.archived_at ? "Restore User" : "Archive User")}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default UsersSettings;
