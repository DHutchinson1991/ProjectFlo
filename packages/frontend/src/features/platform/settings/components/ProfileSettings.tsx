"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    Typography,
    Divider,
    Switch,
    Chip,
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
    InputAdornment,
    IconButton,
    Tooltip,
    Collapse,
    Snackbar,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Save as SaveIcon,
    Key as KeyIcon,
    PhoneOutlined as PhoneIcon,
    CameraAlt as CameraAltIcon,
    DevicesOther as DevicesIcon,
    ChevronRight as ChevronRightIcon,
    PersonOutlined as PersonOutlinedIcon,
    ShieldOutlined as ShieldOutlinedIcon,
    EmailOutlined as EmailOutlinedIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import {
    Contributor,
    UpdateContributorDto,
    UpdateContactDto,
    getUserInitials,
    getUserDisplayName,
} from "@/lib/types";
import { useAuth } from "@/features/platform/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EditFormData {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
}

// ---------------------------------------------------------------------------
// ProfileSettings
// ---------------------------------------------------------------------------

export default function ProfileSettings() {
    const { user: authUser, refreshAuth } = useAuth();

    const [contributor, setContributor] = useState<Contributor | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Form state — always-editable, single save
    const [editFormData, setEditFormData] = useState<EditFormData>({});
    const [originalData, setOriginalData] = useState<EditFormData>({});
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Password change
    const [changePasswordDialog, setChangePasswordDialog] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Track unsaved changes
    const hasChanges = JSON.stringify(editFormData) !== JSON.stringify(originalData);

    // ---- Data loading -------------------------------------------------------

    const loadProfile = useCallback(async () => {
        if (!authUser?.id) return;
        try {
            setLoading(true);
            setLoadError(null);
            const data = await api.contributors.getById(authUser.id);
            setContributor(data);
            const formValues: EditFormData = {
                first_name: data.contact?.first_name ?? "",
                last_name: data.contact?.last_name ?? "",
                email: data.contact?.email ?? "",
                phone_number: data.contact?.phone_number ?? "",
            };
            setEditFormData(formValues);
            setOriginalData(formValues);
        } catch {
            setLoadError("Failed to load your profile.");
        } finally {
            setLoading(false);
        }
    }, [authUser?.id]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    // ---- Handlers -----------------------------------------------------------

    const handleFieldChange = (field: keyof EditFormData, value: string) => {
        setEditFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!contributor) return;
        try {
            setSaving(true);

            const contributorData: UpdateContributorDto = {};
            if (editFormData.first_name !== undefined) contributorData.first_name = editFormData.first_name;
            if (editFormData.last_name !== undefined) contributorData.last_name = editFormData.last_name;
            if (editFormData.email !== undefined) contributorData.email = editFormData.email;

            await api.contributors.update(contributor.id, contributorData);

            if (editFormData.phone_number !== undefined) {
                const contactData: UpdateContactDto = { phone_number: editFormData.phone_number };
                await api.contacts.update(contributor.contact_id, contactData);
            }

            setContributor((prev) =>
                prev
                    ? {
                          ...prev,
                          contact: {
                              ...prev.contact!,
                              first_name: editFormData.first_name || prev.contact?.first_name || "",
                              last_name: editFormData.last_name || prev.contact?.last_name || "",
                              email: editFormData.email || prev.contact?.email || "",
                              phone_number: editFormData.phone_number || prev.contact?.phone_number || "",
                          },
                      }
                    : null,
            );

            setOriginalData({ ...editFormData });
            try { await refreshAuth(); } catch { /* non-critical */ }
            setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Failed to save profile.', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        setEditFormData({ ...originalData });
    };

    // ---- Render ------------------------------------------------------------

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (loadError || !contributor) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {loadError || "Unable to load profile."}
            </Alert>
        );
    }

    return (
        <>
            {/* ─── Profile Header ─── */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 2.5,
                    mb: 3,
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                    border: 1,
                    borderColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                }}
            >
                {/* Avatar */}
                <Box sx={{ position: "relative" }}>
                    <Avatar
                        sx={{
                            width: 60,
                            height: 60,
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                            color: "primary.main",
                            fontSize: "1.3rem",
                            fontWeight: 700,
                            border: "2px solid",
                            borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
                        }}
                    >
                        {getUserInitials(contributor)}
                    </Avatar>
                    <Tooltip title="Change photo" arrow>
                        <IconButton
                            size="small"
                            sx={{
                                position: "absolute",
                                bottom: -2,
                                right: -2,
                                bgcolor: "primary.main",
                                color: "white",
                                width: 24,
                                height: 24,
                                boxShadow: 2,
                                "&:hover": { bgcolor: "primary.dark" },
                            }}
                        >
                            <CameraAltIcon sx={{ fontSize: 12 }} />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1.1rem" }}>
                            {getUserDisplayName(contributor)}
                        </Typography>
                        <Chip
                            label={contributor.role?.name || "No Role"}
                            size="small"
                            sx={{
                                fontWeight: 600,
                                height: 22,
                                fontSize: "0.7rem",
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                                color: "primary.main",
                            }}
                        />
                        <Chip
                            label={contributor.contributor_type || "Internal"}
                            variant="outlined"
                            size="small"
                            sx={{ fontWeight: 500, height: 22, fontSize: "0.7rem" }}
                        />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {contributor.contact?.email}
                    </Typography>
                </Box>

                {/* Save / Discard */}
                <Collapse in={hasChanges} orientation="horizontal">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                        <Chip
                            label="Unsaved"
                            size="small"
                            color="warning"
                            sx={{ fontWeight: 600, height: 24, fontSize: "0.7rem" }}
                        />
                        <Button
                            variant="text"
                            onClick={handleDiscard}
                            disabled={saving}
                            size="small"
                            sx={{ minWidth: 0 }}
                        >
                            Discard
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={saving ? <CircularProgress size={14} /> : <SaveIcon />}
                            onClick={handleSave}
                            disabled={saving}
                            size="small"
                            disableElevation
                            sx={{ fontWeight: 600, borderRadius: 2 }}
                        >
                            {saving ? "Saving…" : "Save"}
                        </Button>
                    </Box>
                </Collapse>
            </Box>

            {/* ─── Two-column layout ─── */}
            <Grid container spacing={3}>
                {/* LEFT COLUMN — form sections */}
                <Grid item xs={12} md={8}>
                    {/* Personal Information */}
                    <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <PersonOutlinedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography variant="subtitle2" fontWeight={700}>
                                Personal Information
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                p: 2.5,
                                borderRadius: 2.5,
                                border: 1,
                                borderColor: "divider",
                                bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
                            }}
                        >
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="First Name"
                                        value={editFormData.first_name || ""}
                                        onChange={(e) => handleFieldChange("first_name", e.target.value)}
                                        fullWidth
                                        size="small"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonOutlinedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Last Name"
                                        value={editFormData.last_name || ""}
                                        onChange={(e) => handleFieldChange("last_name", e.target.value)}
                                        fullWidth
                                        size="small"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonOutlinedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Email"
                                        value={editFormData.email || ""}
                                        onChange={(e) => handleFieldChange("email", e.target.value)}
                                        fullWidth
                                        size="small"
                                        type="email"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <EmailOutlinedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Phone Number"
                                        value={editFormData.phone_number || ""}
                                        onChange={(e) => handleFieldChange("phone_number", e.target.value)}
                                        fullWidth
                                        size="small"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PhoneIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    {/* Account Security */}
                    <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <ShieldOutlinedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography variant="subtitle2" fontWeight={700}>
                                Security
                            </Typography>
                        </Box>

                        <Stack spacing={1.5}>
                            {/* Password */}
                            <Box
                                onClick={() => setChangePasswordDialog(true)}
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    px: 2.5,
                                    py: 2,
                                    borderRadius: 2.5,
                                    border: 1,
                                    borderColor: "divider",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        borderColor: "primary.main",
                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                                    },
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Box
                                        sx={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: 2,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                        }}
                                    >
                                        <KeyIcon sx={{ fontSize: 20, color: "primary.main" }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600}>
                                            Password
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Last changed 30+ days ago
                                        </Typography>
                                    </Box>
                                </Box>
                                <ChevronRightIcon sx={{ fontSize: 20, color: "text.disabled" }} />
                            </Box>

                            {/* Sessions */}
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    px: 2.5,
                                    py: 2,
                                    borderRadius: 2.5,
                                    border: 1,
                                    borderColor: "divider",
                                    opacity: 0.55,
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Box
                                        sx={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: 2,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.1),
                                        }}
                                    >
                                        <DevicesIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600}>
                                            Active Sessions
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Manage logged-in devices
                                        </Typography>
                                    </Box>
                                </Box>
                                <Chip label="Soon" size="small" variant="outlined" sx={{ height: 22, fontSize: "0.68rem" }} />
                            </Box>
                        </Stack>
                    </Box>
                </Grid>

                {/* RIGHT COLUMN — placeholder */}
                <Grid item xs={12} md={4}>
                    <Box
                        sx={{
                            border: "1px dashed",
                            borderColor: (theme) => alpha(theme.palette.divider, 0.5),
                            borderRadius: 2.5,
                            p: 3,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            minHeight: 200,
                        }}
                    >
                        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>
                            More profile features coming soon
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* ─── Change Password Dialog ─── */}
            <Dialog
                open={changePasswordDialog}
                onClose={() => setChangePasswordDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }}>
                            <KeyIcon sx={{ fontSize: 18, color: "primary.main" }} />
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700}>Change Password</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Choose a strong password with at least 8 characters
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 3 }}>
                    <Stack spacing={2.5}>
                        <TextField
                            label="Current Password"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="New Password"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Confirm New Password"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            fullWidth
                            size="small"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setChangePasswordDialog(false)} sx={{ borderRadius: 2 }}>
                        Cancel
                    </Button>
                    <Button variant="contained" disableElevation sx={{ borderRadius: 2, fontWeight: 600 }}>
                        Update Password
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: "100%", borderRadius: 2 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
