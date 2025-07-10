"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Box,
    Typography,
    Breadcrumbs,
    Link,
    Avatar,
    Tabs,
    Tab,
    Grid,
    Card,
    CardContent,
    Chip,
    IconButton,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    FormControl,
    Select,
    MenuItem,
    SelectChangeEvent,
} from "@mui/material";
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Person as PersonIcon,
    Work as WorkIcon,
    Security as SecurityIcon,
    History as HistoryIcon,
    Settings as SettingsIcon,
    Shield as ShieldIcon,
    Key as KeyIcon,
    CheckCircle as CheckCircleIcon,
    AdminPanelSettings as AdminIcon,
    Group as GroupIcon,
    VpnKey as VpnKeyIcon,
    AccountCircle as AccountIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import { Contributor, UpdateContributorDto, UpdateContactDto, Role, getUserInitials, getUserDisplayName } from "@/lib/types";
import { useTheme } from "@/app/theme/ThemeProvider";
import { useAuth } from "@/app/providers/AuthProvider";

// Types
interface EditFormData {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    company_name?: string;
    default_hourly_rate?: number;
}

// Tab panel component for the user profile tabs
interface TabPanelProps {
    children?: React.ReactNode;
    value: number;
    index: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && <Box>{children}</Box>}
        </div>
    );
}

export default function UserProfilePage() {
    const router = useRouter();
    const params = useParams();
    const { mode } = useTheme();
    const { refreshAuth } = useAuth();
    const userId = params?.id as string;

    const [user, setUser] = useState<Contributor | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [tabValue, setTabValue] = useState(0);

    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [isEditingWork, setIsEditingWork] = useState(false);
    const [editFormData, setEditFormData] = useState<EditFormData>({});
    const [personalSuccess, setPersonalSuccess] = useState<string | null>(null);
    const [personalError, setPersonalError] = useState<string | null>(null);
    const [workSuccess, setWorkSuccess] = useState<string | null>(null);
    const [workError, setWorkError] = useState<string | null>(null);
    const [savingPersonal, setSavingPersonal] = useState(false);
    const [savingWork, setSavingWork] = useState(false);

    // Role management state
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [roleSuccess, setRoleSuccess] = useState<string | null>(null);
    const [roleError, setRoleError] = useState<string | null>(null);
    const [savingRole, setSavingRole] = useState(false);
    const [changePasswordDialog, setChangePasswordDialog] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        loadUserData();
    }, [userId]);

    const loadUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Validate userId
            const userIdNum = parseInt(userId);
            if (isNaN(userIdNum)) {
                setError("Invalid user ID");
                return;
            }

            // Load user data and roles in parallel
            const [userData, rolesData] = await Promise.all([
                api.contributors.getById(userIdNum),
                api.roles.getAll()
            ]);

            setUser(userData);
            setRoles(rolesData);
            setSelectedRoleId(userData.role_id);
            setEditFormData({
                first_name: userData.contact?.first_name ?? "",
                last_name: userData.contact?.last_name ?? "",
                email: userData.contact?.email ?? "",
                phone_number: userData.contact?.phone_number ?? "",
                company_name: userData.contact?.company_name ?? "",
                default_hourly_rate: userData.default_hourly_rate || 0,
            });
        } catch (err: unknown) {
            const hasResponse = err && typeof err === 'object' && 'response' in err;
            const status = hasResponse && (err as { response: { status: number } }).response?.status;

            if (status === 404) {
                setError("User not found");
            } else {
                setError("Failed to load user data");
            }
            console.error("Error loading user:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handlePersonalEditToggle = () => {
        setIsEditingPersonal(!isEditingPersonal);
        if (isEditingPersonal) {
            // Reset form data if canceling
            setEditFormData({
                ...editFormData,
                first_name: user?.contact?.first_name ?? "",
                last_name: user?.contact?.last_name ?? "",
                email: user?.contact?.email ?? "",
                phone_number: user?.contact?.phone_number ?? "",
            });
            setPersonalError(null);
            setPersonalSuccess(null);
        }
    };

    const handleWorkEditToggle = () => {
        setIsEditingWork(!isEditingWork);
        if (isEditingWork) {
            // Reset form data if canceling
            setEditFormData({
                ...editFormData,
                company_name: user?.contact?.company_name ?? "",
                default_hourly_rate: user?.default_hourly_rate || 0,
            });
            setWorkError(null);
            setWorkSuccess(null);
        }
    };

    const handleSavePersonalInfo = async () => {
        if (!user) return;

        try {
            setSavingPersonal(true);
            setPersonalError(null);
            setPersonalSuccess(null);

            // Update contributor data (contact fields)
            const contributorData: UpdateContributorDto = {};

            // Add contact fields
            if (editFormData.first_name !== undefined) {
                contributorData.first_name = editFormData.first_name;
            }
            if (editFormData.last_name !== undefined) {
                contributorData.last_name = editFormData.last_name;
            }
            if (editFormData.email !== undefined) {
                contributorData.email = editFormData.email;
            }

            await api.contributors.update(user.id, contributorData);

            // Update contact data for fields not handled by contributors API
            if (editFormData.phone_number !== undefined) {
                const contactData: UpdateContactDto = {
                    phone_number: editFormData.phone_number
                };
                await api.contacts.update(user.contact_id, contactData);
            }

            // Update local state instead of reloading
            setUser(prevUser => prevUser ? {
                ...prevUser,
                contact: {
                    ...prevUser.contact!,
                    first_name: editFormData.first_name || prevUser.contact?.first_name || "",
                    last_name: editFormData.last_name || prevUser.contact?.last_name || "",
                    email: editFormData.email || prevUser.contact?.email || "",
                    phone_number: editFormData.phone_number || prevUser.contact?.phone_number || "",
                }
            } : null);

            // Also refresh the global auth context if this is the current user
            try {
                await refreshAuth();
            } catch (error) {
                console.warn("Failed to refresh auth context:", error);
            }

            setIsEditingPersonal(false);
            setPersonalSuccess("Personal information updated successfully!");
        } catch (err) {
            setPersonalError("Failed to save personal information");
            console.error("Error saving personal info:", err);
        } finally {
            setSavingPersonal(false);
        }
    };

    const handleSaveWorkInfo = async () => {
        if (!user) return;

        try {
            setSavingWork(true);
            setWorkError(null);
            setWorkSuccess(null);

            // Update contributor data (default_hourly_rate)
            const contributorData: UpdateContributorDto = {};
            if (editFormData.default_hourly_rate !== undefined) {
                contributorData.default_hourly_rate = editFormData.default_hourly_rate;
            }

            await api.contributors.update(user.id, contributorData);

            // Update contact data for company name
            if (editFormData.company_name !== undefined) {
                const contactData: UpdateContactDto = {
                    company_name: editFormData.company_name
                };
                await api.contacts.update(user.contact_id, contactData);
            }

            // Update local state instead of reloading
            setUser(prevUser => prevUser ? {
                ...prevUser,
                default_hourly_rate: editFormData.default_hourly_rate || prevUser.default_hourly_rate,
                contact: {
                    ...prevUser.contact!,
                    company_name: editFormData.company_name || prevUser.contact?.company_name || "",
                }
            } : null);

            // Also refresh the global auth context if this is the current user
            try {
                await refreshAuth();
            } catch (error) {
                console.warn("Failed to refresh auth context:", error);
            }

            setIsEditingWork(false);
            setWorkSuccess("Work information updated successfully!");
        } catch (err) {
            setWorkError("Failed to save work information");
            console.error("Error saving work info:", err);
        } finally {
            setSavingWork(false);
        }
    };

    const handleSaveRole = async () => {
        if (!user || selectedRoleId === null) return;

        try {
            setSavingRole(true);
            setRoleError(null);
            setRoleSuccess(null);

            // Update user role
            await api.contributors.update(user.id, { role_id: selectedRoleId });

            // Update local state instead of reloading
            const updatedRole = roles.find(role => role.id === selectedRoleId);
            setUser(prevUser => prevUser ? {
                ...prevUser,
                role_id: selectedRoleId,
                role: updatedRole || prevUser.role
            } : null);

            // Also refresh the global auth context if this is the current user
            try {
                await refreshAuth();
            } catch (error) {
                console.warn("Failed to refresh auth context:", error);
            }

            setRoleSuccess("User role updated successfully!");
        } catch (err) {
            setRoleError("Failed to update user role");
            console.error("Error updating role:", err);
        } finally {
            setSavingRole(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Never";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <Box sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "50vh",
                bgcolor: mode === "dark" ? "#0a0a0a" : "#fafafa",
            }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !user) {
        return (
            <Box sx={{
                p: 3,
                bgcolor: mode === "dark" ? "#0a0a0a" : "#fafafa",
                minHeight: "100vh",
            }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error || "User not found"}
                </Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push("/manager/users")}
                    variant="outlined"
                >
                    Back to Users
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh" }}>
            {/* Header Section */}
            <Box sx={{
                borderBottom: 1,
                borderColor: "divider",
                p: 3,
            }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 2 }}>
                    <IconButton
                        onClick={() => router.push("/manager/users")}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                            User Profile
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Manage user account details, permissions, and security settings
                        </Typography>
                    </Box>
                </Box>

                {/* Breadcrumbs */}
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 0 }}>
                    <Link
                        underline="hover"
                        color="inherit"
                        href="/manager"
                        sx={{ display: "flex", alignItems: "center" }}
                    >
                        <SettingsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                        Management
                    </Link>
                    <Link
                        underline="hover"
                        color="inherit"
                        href="/manager/users"
                        sx={{ display: "flex", alignItems: "center" }}
                    >
                        <PersonIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                        Users
                    </Link>
                    <Typography color="text.primary" sx={{ fontWeight: 600 }}>
                        {getUserDisplayName(user)}
                    </Typography>
                </Breadcrumbs>
            </Box>

            {/* Main Content */}
            <Box sx={{ p: 3 }}>
                {/* Identity Bar Card */}
                <Card sx={{
                    mb: 3,
                    background: mode === "dark" ? "#1a1a1a" : "#ffffff",
                    border: mode === "dark" ? "1px solid #333" : "1px solid #e0e0e0",
                }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                        }}>
                            <Avatar
                                sx={{
                                    width: 60,
                                    height: 60,
                                    bgcolor: "primary.main",
                                    fontSize: "1.5rem",
                                    fontWeight: 700,
                                }}
                            >
                                {getUserInitials(user)}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    {getUserDisplayName(user)}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                                    {user.contact?.email}
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                                    <Chip
                                        icon={<WorkIcon />}
                                        label={user.role?.name || "No Role"}
                                        color="primary"
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                    />
                                    <Chip
                                        icon={<CheckCircleIcon />}
                                        label="Active"
                                        color="success"
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                    />
                                    <Chip
                                        label={user.contributor_type || "Internal"}
                                        variant="outlined"
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                    />
                                </Box>
                            </Box>
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Last Login
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {(user as Contributor & { last_login?: string }).last_login
                                        ? formatDate((user as Contributor & { last_login?: string }).last_login)
                                        : "Never"}
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

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

                {/* Tabs */}
                <Box>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                            borderBottom: 1,
                            borderColor: "divider",
                            "& .MuiTab-root": {
                                fontWeight: 600,
                                textTransform: "none",
                                py: 2,
                                fontSize: "0.9rem",
                            },
                        }}
                    >
                        <Tab
                            label="Profile Details"
                            icon={<PersonIcon />}
                            iconPosition="start"
                        />
                        <Tab
                            label="Security & Access"
                            icon={<SecurityIcon />}
                            iconPosition="start"
                        />
                        <Tab
                            label="Activity & Logs"
                            icon={<HistoryIcon />}
                            iconPosition="start"
                        />
                    </Tabs>

                    {/* Tab 1: Profile Details */}
                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={3} sx={{ p: 3 }}>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ p: 3, borderRadius: 1, border: 1, borderColor: "divider" }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                                            <PersonIcon color="primary" fontSize="small" />
                                            Personal Information
                                        </Typography>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            {isEditingPersonal ? (
                                                <>
                                                    <Button
                                                        startIcon={savingPersonal ? <CircularProgress size={16} /> : <SaveIcon />}
                                                        variant="contained"
                                                        onClick={handleSavePersonalInfo}
                                                        disabled={savingPersonal}
                                                        size="small"
                                                    >
                                                        {savingPersonal ? "Saving..." : "Save"}
                                                    </Button>
                                                    <Button
                                                        startIcon={<CancelIcon />}
                                                        variant="outlined"
                                                        onClick={handlePersonalEditToggle}
                                                        disabled={savingPersonal}
                                                        size="small"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    startIcon={<EditIcon />}
                                                    variant="outlined"
                                                    onClick={handlePersonalEditToggle}
                                                    size="small"
                                                >
                                                    Edit
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>

                                    {/* Personal Info Alerts */}
                                    {personalSuccess && (
                                        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPersonalSuccess(null)}>
                                            {personalSuccess}
                                        </Alert>
                                    )}
                                    {personalError && (
                                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPersonalError(null)}>
                                            {personalError}
                                        </Alert>
                                    )}

                                    <Stack spacing={2}>
                                        <TextField
                                            label="First Name"
                                            value={editFormData.first_name || ""}
                                            onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                                            disabled={!isEditingPersonal}
                                            fullWidth
                                            size="small"
                                        />
                                        <TextField
                                            label="Last Name"
                                            value={editFormData.last_name || ""}
                                            onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                                            disabled={!isEditingPersonal}
                                            fullWidth
                                            size="small"
                                        />
                                        <TextField
                                            label="Email"
                                            value={editFormData.email || ""}
                                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                            disabled={!isEditingPersonal}
                                            fullWidth
                                            size="small"
                                            type="email"
                                        />
                                        <TextField
                                            label="Phone Number"
                                            value={editFormData.phone_number || ""}
                                            onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                                            disabled={!isEditingPersonal}
                                            fullWidth
                                            size="small"
                                        />
                                    </Stack>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ p: 3, borderRadius: 1, border: 1, borderColor: "divider" }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                                            <WorkIcon color="primary" fontSize="small" />
                                            Work Information
                                        </Typography>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            {isEditingWork ? (
                                                <>
                                                    <Button
                                                        startIcon={savingWork ? <CircularProgress size={16} /> : <SaveIcon />}
                                                        variant="contained"
                                                        onClick={handleSaveWorkInfo}
                                                        disabled={savingWork}
                                                        size="small"
                                                    >
                                                        {savingWork ? "Saving..." : "Save"}
                                                    </Button>
                                                    <Button
                                                        startIcon={<CancelIcon />}
                                                        variant="outlined"
                                                        onClick={handleWorkEditToggle}
                                                        disabled={savingWork}
                                                        size="small"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    startIcon={<EditIcon />}
                                                    variant="outlined"
                                                    onClick={handleWorkEditToggle}
                                                    size="small"
                                                >
                                                    Edit
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>

                                    {/* Work Info Alerts */}
                                    {workSuccess && (
                                        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setWorkSuccess(null)}>
                                            {workSuccess}
                                        </Alert>
                                    )}
                                    {workError && (
                                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setWorkError(null)}>
                                            {workError}
                                        </Alert>
                                    )}

                                    <Stack spacing={2}>
                                        <TextField
                                            label="Company Name"
                                            value={editFormData.company_name || ""}
                                            onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                                            disabled={!isEditingWork}
                                            fullWidth
                                            size="small"
                                        />
                                        <TextField
                                            label="Default Hourly Rate"
                                            value={editFormData.default_hourly_rate || ""}
                                            onChange={(e) => setEditFormData({ ...editFormData, default_hourly_rate: parseFloat(e.target.value) || 0 })}
                                            disabled={!isEditingWork}
                                            fullWidth
                                            size="small"
                                            type="number"
                                            InputProps={{
                                                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                                            }}
                                        />
                                        <TextField
                                            label="Role"
                                            value={user.role?.name || "No Role"}
                                            disabled
                                            fullWidth
                                            size="small"
                                        />
                                        <TextField
                                            label="User Type"
                                            value={user.contributor_type || "Internal"}
                                            disabled
                                            fullWidth
                                            size="small"
                                        />
                                    </Stack>
                                </Box>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Tab 2: Security & Access */}
                    <TabPanel value={tabValue} index={1}>
                        <Grid container spacing={3} sx={{ p: 3 }}>
                            {/* User Role & Permissions */}
                            <Grid item xs={12} md={6}>
                                <Box sx={{ p: 3, borderRadius: 1, border: 1, borderColor: "divider" }}>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                                        <GroupIcon color="primary" fontSize="small" />
                                        Role & Permissions
                                    </Typography>
                                    <Stack spacing={3}>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                Current Role
                                            </Typography>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                <Chip
                                                    icon={<WorkIcon />}
                                                    label={user.role.name}
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                                                />
                                                {user.role.description && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {user.role.description}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>

                                        <Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                Account Status
                                            </Typography>
                                            <Chip
                                                icon={<CheckCircleIcon />}
                                                label={user.archived_at ? "Inactive" : "Active"}
                                                color={user.archived_at ? "error" : "success"}
                                                size="small"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        </Box>

                                        <Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                Contributor Type
                                            </Typography>
                                            <Chip
                                                label={user.contributor_type || "Internal"}
                                                variant="outlined"
                                                size="small"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        </Box>

                                        {/* Role Change Section (for admins) */}
                                        <Box sx={{ pt: 2, borderTop: 1, borderColor: "divider" }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                Change Role
                                            </Typography>

                                            {/* Role Success/Error Alerts */}
                                            {roleSuccess && (
                                                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setRoleSuccess(null)}>
                                                    {roleSuccess}
                                                </Alert>
                                            )}
                                            {roleError && (
                                                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRoleError(null)}>
                                                    {roleError}
                                                </Alert>
                                            )}

                                            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                                    <Select
                                                        value={selectedRoleId?.toString() || ''}
                                                        onChange={(e: SelectChangeEvent<string>) => setSelectedRoleId(Number(e.target.value))}
                                                        displayEmpty
                                                    >
                                                        {roles.map((role) => (
                                                            <MenuItem key={role.id} value={role.id.toString()}>
                                                                {role.name}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={savingRole ? <CircularProgress size={16} /> : <AdminIcon />}
                                                    onClick={handleSaveRole}
                                                    disabled={savingRole || selectedRoleId === user.role_id}
                                                >
                                                    {savingRole ? "Updating..." : "Update Role"}
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Grid>

                            {/* Security Settings */}
                            <Grid item xs={12} md={6}>
                                <Box sx={{ p: 3, borderRadius: 1, border: 1, borderColor: "divider" }}>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                                        <ShieldIcon color="primary" fontSize="small" />
                                        Security Settings
                                    </Typography>
                                    <Stack spacing={3}>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                Password Security
                                            </Typography>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <KeyIcon color="action" fontSize="small" />
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            Password
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Last changed: Never
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => setChangePasswordDialog(true)}
                                                    startIcon={<VpnKeyIcon />}
                                                >
                                                    Change
                                                </Button>
                                            </Box>
                                        </Box>

                                        <Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                Account Access
                                            </Typography>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <AccountIcon color="action" fontSize="small" />
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            Login Access
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Last login: Never
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Chip
                                                    label={user.archived_at ? "Disabled" : "Enabled"}
                                                    color={user.archived_at ? "error" : "success"}
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>

                                        <Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                Session Management
                                            </Typography>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <SecurityIcon color="action" fontSize="small" />
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            Active Sessions
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            0 active sessions
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    color="error"
                                                    disabled
                                                >
                                                    Revoke All
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Grid>

                            {/* Permissions Summary */}
                            <Grid item xs={12}>
                                <Box sx={{ p: 3, borderRadius: 1, border: 1, borderColor: "divider" }}>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                                        <AdminIcon color="primary" fontSize="small" />
                                        Permissions Summary
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <Box sx={{ p: 2, bgcolor: "success.light", color: "success.contrastText", borderRadius: 1, textAlign: "center" }}>
                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                    {user.role.name === "Admin" || user.role.name === "Global Admin" ? "Full" : "Limited"}
                                                </Typography>
                                                <Typography variant="body2">
                                                    System Access
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Box sx={{ p: 2, bgcolor: "info.light", color: "info.contrastText", borderRadius: 1, textAlign: "center" }}>
                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                    {user.role.name === "Admin" || user.role.name === "Global Admin" ? "Yes" : "No"}
                                                </Typography>
                                                <Typography variant="body2">
                                                    User Management
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Box sx={{ p: 2, bgcolor: "warning.light", color: "warning.contrastText", borderRadius: 1, textAlign: "center" }}>
                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                    {user.role.name === "Global Admin" ? "Yes" : "No"}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Global Settings
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Tab 3: Activity & Logs */}
                    <TabPanel value={tabValue} index={2}>
                        <Card sx={{
                            background: mode === "dark" ? "#1a1a1a" : "#ffffff",
                            border: mode === "dark" ? "1px solid #333" : "1px solid #e0e0e0",
                            borderRadius: 2,
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                                    <HistoryIcon color="primary" fontSize="small" />
                                    Recent Activity
                                </Typography>
                                <Typography color="text.secondary">
                                    No recent activity to display.
                                </Typography>
                            </CardContent>
                        </Card>
                    </TabPanel>
                </Box>
            </Box>

            {/* Change Password Dialog */}
            <Dialog
                open={changePasswordDialog}
                onClose={() => setChangePasswordDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
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
                <DialogActions>
                    <Button onClick={() => setChangePasswordDialog(false)}>Cancel</Button>
                    <Button variant="contained">Update Password</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
