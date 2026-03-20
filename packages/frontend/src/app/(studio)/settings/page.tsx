"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
    Divider,
    List,
    ListItem,
    ListItemText,
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Snackbar,
    InputAdornment,
    IconButton,
    Tooltip,
    Collapse,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Card,
    CardContent,
    Menu,
    ListItemIcon,
    ListSubheader,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Person as ProfileIcon,
    Business as CompanyIcon,
    Notifications as NotificationsIcon,
    Palette as AppearanceIcon,
    IntegrationInstructions as IntegrationsIcon,
    Security as SecurityIcon,
    Receipt as BillingIcon,
    Tune as WorkflowIcon,
    Save as SaveIcon,
    Work as WorkIcon,
    Key as KeyIcon,
    AccountCircle as AccountIcon,
    Email as EmailIcon,
    LocationOn as LocationIcon,
    AccountBalance as CurrencyIcon,
    Public as PublicIcon,
    PhoneOutlined as PhoneIcon,
    CameraAlt as CameraAltIcon,
    DevicesOther as DevicesIcon,
    ChevronRight as ChevronRightIcon,
    PersonOutlined as PersonOutlinedIcon,
    ShieldOutlined as ShieldOutlinedIcon,
    EmailOutlined as EmailOutlinedIcon,
    EditOutlined as EditOutlinedIcon,
    AutoAwesome as AutoAwesomeIcon,
    TrendingUp as TrendingUpIcon,
    CalendarMonth as CalendarIcon,
    AccessTime as ClockIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Group as GroupIcon,
    Shield as ShieldFilledIcon,
    AdminPanelSettings as AdminIcon,
    CheckCircle as CheckCircleIcon,
    SupervisorAccount as RolesIcon,
    PeopleOutline as UsersIcon,
    PersonAdd as PersonAddIcon,
    Block as BlockIcon,
    Restore as RestoreIcon,
    Payments as PaymentsIcon,
    Schedule as ScheduleIcon,
    Star as StarIcon,
    StarBorder as StarBorderIcon,
    DragIndicator as DragIcon,
    ContentCopy as CopyIcon,
    CreditCard as CreditCardIcon,
    ReceiptLong as ReceiptLongIcon,
    Assignment as FormsIcon,
    Description as ProposalsIcon,
    Gavel as ContractsIcon,
    Language as PortalIcon,
    Share as ShareIcon,
} from "@mui/icons-material";
import ClientPortalSettings from "./_components/ClientPortalSettings";
import ContractSettings from "./_components/ContractSettings";
import SocialLinksSettings from "./_components/SocialLinksSettings";
import { api } from "@/lib/api";
import {
    Contributor,
    UpdateContributorDto,
    UpdateContactDto,
    NewContributorData,
    getUserInitials,
    getUserDisplayName,
    Role,
} from "@/lib/types";
import type {
    PaymentScheduleTemplate,
    PaymentScheduleRule,
    PaymentAmountType,
    PaymentTriggerType,
    CrewPaymentTemplate,
    CrewPaymentTriggerType,
    CrewPaymentRoleType,
    CrewPaymentTerms,
    CrewPaymentFrequency,
} from "@/lib/types";
import type { TaskLibrary } from "@/lib/types";
import { useAuth } from "@/app/providers/AuthProvider";
import { useBrand } from "@/app/providers/BrandProvider";
import { Brand } from "@/lib/types/brand";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

interface SettingsSection {
    label: string;
    icon: React.ReactElement;
    component: React.ReactNode;
    placeholder?: boolean;
}

// ---------------------------------------------------------------------------
// TabPanel wrapper
// ---------------------------------------------------------------------------

function TabPanel({ children, value, index }: TabPanelProps) {
    return (
        <Box
            role="tabpanel"
            hidden={value !== index}
            id={`settings-tabpanel-${index}`}
            aria-labelledby={`settings-tab-${index}`}
            sx={{ flexGrow: 1, minWidth: 0 }}
        >
            {value === index && <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>}
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Section header helper
// ---------------------------------------------------------------------------

function SectionHeader({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={600}>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {description}
            </Typography>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Placeholder row for future settings toggles / inputs
// ---------------------------------------------------------------------------

function PlaceholderRow({
    label,
    description,
    hasToggle = false,
}: {
    label: string;
    description: string;
    hasToggle?: boolean;
}) {
    return (
        <ListItem
            sx={{
                px: 0,
                py: 1.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
            }}
        >
            <ListItemText
                primary={label}
                secondary={description}
                primaryTypographyProps={{ fontWeight: 500, fontSize: "0.9rem" }}
                secondaryTypographyProps={{ fontSize: "0.8rem", mt: 0.25 }}
            />
            {hasToggle && <Switch disabled />}
        </ListItem>
    );
}

// ---------------------------------------------------------------------------
// Section placeholder components
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types for profile editing
// ---------------------------------------------------------------------------

interface EditFormData {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
}

// ---------------------------------------------------------------------------
// ProfileSettings — real, functional component
// ---------------------------------------------------------------------------

function ProfileSettings() {
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

// ---------------------------------------------------------------------------
// Brand constants
// ---------------------------------------------------------------------------

const BUSINESS_TYPES = [
    'Production House', 'Agency', 'Freelancer', 'Corporate', 'Non-Profit', 'Other'
];
const TIMEZONES = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo',
    'Asia/Shanghai', 'Australia/Sydney', 'UTC'
];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'INR'];

interface EditBrandData {
    name: string;
    display_name?: string;
    description?: string;
    business_type?: string;
    website?: string;
    email?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country: string;
    postal_code?: string;
    timezone: string;
    currency: string;
    logo_url?: string;
    default_tax_rate?: number;
    tax_number?: string;
    default_payment_method?: string;
    payment_terms_days?: number;
    bank_name?: string;
    bank_account_name?: string;
    bank_sort_code?: string;
    bank_account_number?: string;
    is_active: boolean;
}

interface BrandValidationErrors {
    [key: string]: string;
}

// ---------------------------------------------------------------------------
// Section placeholder components
// ---------------------------------------------------------------------------

function CompanySettings() {
    const { currentBrand, refreshBrands } = useBrand();

    const [brand, setBrand] = useState<Brand | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [validationErrors, setValidationErrors] = useState<BrandValidationErrors>({});

    // ---- Create Brand dialog state -------------------------------------------
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [allBrands, setAllBrands] = useState<Brand[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(false);
    const emptyNewBrand: EditBrandData = {
        name: '', display_name: '', description: '', business_type: '',
        website: '', email: '', phone: '', address_line1: '',
        address_line2: '', city: '', state: '', country: 'US',
        postal_code: '', timezone: 'America/New_York', currency: 'USD',
        logo_url: '', default_tax_rate: 0, tax_number: '',
        default_payment_method: 'Bank Transfer', payment_terms_days: 30,
        bank_name: '', bank_account_name: '', bank_sort_code: '', bank_account_number: '',
        is_active: true,
    };
    const [newBrandData, setNewBrandData] = useState<EditBrandData>({ ...emptyNewBrand });
    const [newBrandErrors, setNewBrandErrors] = useState<BrandValidationErrors>({});

    const defaultForm: EditBrandData = {
        name: '', display_name: '', description: '', business_type: '',
        website: '', email: '', phone: '', address_line1: '',
        address_line2: '', city: '', state: '', country: 'US',
        postal_code: '', timezone: 'America/New_York', currency: 'USD',
        logo_url: '', default_tax_rate: 0, tax_number: '',
        default_payment_method: 'Bank Transfer', payment_terms_days: 30,
        bank_name: '', bank_account_name: '', bank_sort_code: '', bank_account_number: '',
        is_active: true,
    };
    const [formData, setFormData] = useState<EditBrandData>(defaultForm);
    const [originalFormData, setOriginalFormData] = useState<EditBrandData>(defaultForm);

    // Track unsaved changes
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);

    // ---- Load the active brand ------------------------------------------------

    const populateForm = useCallback((b: Brand) => {
        const values: EditBrandData = {
            name: b.name,
            display_name: b.display_name || '',
            description: b.description || '',
            business_type: b.business_type || '',
            website: b.website || '',
            email: b.email || '',
            phone: b.phone || '',
            address_line1: b.address_line1 || '',
            address_line2: b.address_line2 || '',
            city: b.city || '',
            state: b.state || '',
            country: b.country || 'GB',
            postal_code: b.postal_code || '',
            timezone: b.timezone || 'America/New_York',
            currency: b.currency || 'USD',
            logo_url: b.logo_url || '',
            default_tax_rate: b.default_tax_rate ?? 0,
            tax_number: b.tax_number || '',
            default_payment_method: b.default_payment_method || 'Bank Transfer',
            payment_terms_days: b.payment_terms_days ?? 30,
            bank_name: b.bank_name || '',
            bank_account_name: b.bank_account_name || '',
            bank_sort_code: b.bank_sort_code || '',
            bank_account_number: b.bank_account_number || '',
            is_active: b.is_active,
        };
        setFormData(values);
        setOriginalFormData(values);
    }, []);

    const loadBrand = useCallback(async () => {
        if (!currentBrand?.id) return;
        try {
            setLoading(true);
            setLoadError(null);
            const data = await api.brands.getById(currentBrand.id);
            setBrand(data);
            populateForm(data);
        } catch {
            setLoadError('Failed to load brand details.');
        } finally {
            setLoading(false);
        }
    }, [currentBrand?.id, populateForm]);

    useEffect(() => {
        loadBrand();
    }, [loadBrand]);

    // ---- Form helpers --------------------------------------------------------

    const handleFormChange = (field: keyof EditBrandData, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (validationErrors[field]) {
            setValidationErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
        }
    };

    const validateForm = (): boolean => {
        const errors: BrandValidationErrors = {};
        if (!formData.name.trim()) errors.name = 'Brand name is required';
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email';
        if (formData.website && !formData.website.startsWith('http')) errors.website = 'Must start with http(s)://';
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        if (!brand || !validateForm()) return;
        try {
            setSaving(true);
            const dataToSave = { ...formData };
            if (dataToSave.logo_url?.startsWith('blob:')) dataToSave.logo_url = brand.logo_url || '';
            const updated = await api.brands.update(brand.id, dataToSave);
            setBrand(updated);
            populateForm(updated);
            await refreshBrands();
            setSnackbar({ open: true, message: 'Brand updated successfully', severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Failed to update brand', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        setFormData({ ...originalFormData });
        setValidationErrors({});
    };

    // ---- All brands list (for the brands overview) ---------------------------

    const loadAllBrands = useCallback(async () => {
        try {
            setLoadingBrands(true);
            const brands = await api.brands.getAll();
            setAllBrands(brands);
        } catch {
            // silent – brands list is supplementary
        } finally {
            setLoadingBrands(false);
        }
    }, []);

    useEffect(() => { loadAllBrands(); }, [loadAllBrands]);

    // ---- Create Brand handlers -----------------------------------------------

    const handleOpenCreateDialog = () => {
        setNewBrandData({ ...emptyNewBrand });
        setNewBrandErrors({});
        setCreateDialogOpen(true);
    };

    const handleNewBrandChange = (field: keyof EditBrandData, value: string | boolean) => {
        setNewBrandData((prev) => ({ ...prev, [field]: value }));
        if (newBrandErrors[field]) {
            setNewBrandErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
        }
    };

    const handleCreateBrand = async () => {
        const errors: BrandValidationErrors = {};
        if (!newBrandData.name.trim()) errors.name = 'Brand name is required';
        if (newBrandData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newBrandData.email)) errors.email = 'Invalid email';
        setNewBrandErrors(errors);
        if (Object.keys(errors).length > 0) return;

        try {
            setCreating(true);
            await api.brands.create({
                name: newBrandData.name,
                display_name: newBrandData.display_name || undefined,
                description: newBrandData.description || undefined,
                business_type: newBrandData.business_type || undefined,
                website: newBrandData.website || undefined,
                email: newBrandData.email || undefined,
                phone: newBrandData.phone || undefined,
                address_line1: newBrandData.address_line1 || undefined,
                address_line2: newBrandData.address_line2 || undefined,
                city: newBrandData.city || undefined,
                state: newBrandData.state || undefined,
                country: newBrandData.country || 'GB',
                postal_code: newBrandData.postal_code || undefined,
                timezone: newBrandData.timezone || 'America/New_York',
                currency: newBrandData.currency || 'USD',
                logo_url: newBrandData.logo_url || undefined,
                is_active: newBrandData.is_active,
            });
            setCreateDialogOpen(false);
            await refreshBrands();
            await loadAllBrands();
            setSnackbar({ open: true, message: 'Brand created successfully', severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Failed to create brand', severity: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteBrand = async (brandId: number) => {
        try {
            await api.brands.delete(brandId);
            await refreshBrands();
            await loadAllBrands();
            setSnackbar({ open: true, message: 'Brand deleted successfully', severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Failed to delete brand', severity: 'error' });
        }
    };

    // ---- Render --------------------------------------------------------------

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
    }

    if (loadError || !brand) {
        return <Alert severity="error" sx={{ mb: 2 }}>{loadError || 'No active brand selected.'}</Alert>;
    }

    const businessTypeOptions = [...BUSINESS_TYPES];
    if (formData.business_type && !businessTypeOptions.includes(formData.business_type)) {
        businessTypeOptions.unshift(formData.business_type);
    }

    return (
        <>
            {/* ─── Brand Header ─── */}
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
                <Avatar
                    src={formData.logo_url || undefined}
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
                    {(brand.display_name || brand.name).substring(0, 2).toUpperCase()}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1.1rem" }}>
                            {brand.display_name || brand.name}
                        </Typography>
                        <Chip
                            label={formData.business_type || "Business"}
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
                            label={formData.is_active ? "Active" : "Inactive"}
                            variant="outlined"
                            size="small"
                            color={formData.is_active ? "success" : "default"}
                            sx={{ fontWeight: 500, height: 22, fontSize: "0.7rem" }}
                        />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {formData.email || "No email provided"} · {formData.currency} · {formData.timezone}
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

                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateDialog}
                    size="small"
                    sx={{ fontWeight: 600, borderRadius: 2, flexShrink: 0 }}
                >
                    New Brand
                </Button>
            </Box>

            {/* ─── Two-column layout ─── */}
            <Grid container spacing={3}>
                {/* LEFT COLUMN — main form sections */}
                <Grid item xs={12} md={8}>
                    {/* Basic Information */}
                    <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <CompanyIcon sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography variant="subtitle2" fontWeight={700}>
                                Basic Information
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
                                    <TextField label="Brand Name" value={formData.name} onChange={(e) => handleFormChange("name", e.target.value)} fullWidth required size="small" error={!!validationErrors.name} helperText={validationErrors.name || "Internal name"} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Display Name" value={formData.display_name} onChange={(e) => handleFormChange("display_name", e.target.value)} fullWidth size="small" helperText="Public facing name" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField label="Description" value={formData.description} onChange={(e) => handleFormChange("description", e.target.value)} fullWidth multiline rows={3} size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Business Type</InputLabel>
                                        <Select value={formData.business_type} onChange={(e) => handleFormChange("business_type", e.target.value)} label="Business Type" sx={{ borderRadius: 2 }}>
                                            {businessTypeOptions.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    {/* Contact Information */}
                    <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <EmailIcon sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography variant="subtitle2" fontWeight={700}>
                                Contact Information
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
                                    <TextField label="Email" type="email" value={formData.email} onChange={(e) => handleFormChange("email", e.target.value)} fullWidth size="small" error={!!validationErrors.email} helperText={validationErrors.email} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Phone" value={formData.phone} onChange={(e) => handleFormChange("phone", e.target.value)} fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Website" value={formData.website} onChange={(e) => handleFormChange("website", e.target.value)} fullWidth size="small" error={!!validationErrors.website} helperText={validationErrors.website || "Include https://"} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    {/* Address */}
                    <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <LocationIcon sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography variant="subtitle2" fontWeight={700}>
                                Address
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
                                <Grid item xs={12}><TextField label="Address Line 1" value={formData.address_line1} onChange={(e) => handleFormChange("address_line1", e.target.value)} fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} /></Grid>
                                <Grid item xs={12}><TextField label="Address Line 2" value={formData.address_line2} onChange={(e) => handleFormChange("address_line2", e.target.value)} fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} /></Grid>
                                <Grid item xs={12} sm={4}><TextField label="City" value={formData.city} onChange={(e) => handleFormChange("city", e.target.value)} fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} /></Grid>
                                <Grid item xs={12} sm={4}><TextField label="State / Province" value={formData.state} onChange={(e) => handleFormChange("state", e.target.value)} fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} /></Grid>
                                <Grid item xs={12} sm={4}><TextField label="Postal Code" value={formData.postal_code} onChange={(e) => handleFormChange("postal_code", e.target.value)} fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} /></Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Country</InputLabel>
                                        <Select label="Country" value={formData.country} onChange={(e) => handleFormChange("country", e.target.value)} sx={{ borderRadius: 2 }}>
                                            <ListSubheader>Popular</ListSubheader>
                                            <MenuItem value="GB">United Kingdom</MenuItem>
                                            <MenuItem value="US">United States</MenuItem>
                                            <MenuItem value="CA">Canada</MenuItem>
                                            <MenuItem value="AU">Australia</MenuItem>
                                            <MenuItem value="IE">Ireland</MenuItem>
                                            <MenuItem value="NZ">New Zealand</MenuItem>
                                            <MenuItem value="FR">France</MenuItem>
                                            <MenuItem value="DE">Germany</MenuItem>
                                            <MenuItem value="ES">Spain</MenuItem>
                                            <MenuItem value="IT">Italy</MenuItem>
                                            <MenuItem value="NL">Netherlands</MenuItem>
                                            <MenuItem value="PT">Portugal</MenuItem>
                                            <ListSubheader>All Countries</ListSubheader>
                                            <MenuItem value="AF">Afghanistan</MenuItem>
                                            <MenuItem value="AL">Albania</MenuItem>
                                            <MenuItem value="DZ">Algeria</MenuItem>
                                            <MenuItem value="AR">Argentina</MenuItem>
                                            <MenuItem value="AT">Austria</MenuItem>
                                            <MenuItem value="BH">Bahrain</MenuItem>
                                            <MenuItem value="BD">Bangladesh</MenuItem>
                                            <MenuItem value="BE">Belgium</MenuItem>
                                            <MenuItem value="BR">Brazil</MenuItem>
                                            <MenuItem value="BG">Bulgaria</MenuItem>
                                            <MenuItem value="KH">Cambodia</MenuItem>
                                            <MenuItem value="CL">Chile</MenuItem>
                                            <MenuItem value="CN">China</MenuItem>
                                            <MenuItem value="CO">Colombia</MenuItem>
                                            <MenuItem value="HR">Croatia</MenuItem>
                                            <MenuItem value="CY">Cyprus</MenuItem>
                                            <MenuItem value="CZ">Czech Republic</MenuItem>
                                            <MenuItem value="DK">Denmark</MenuItem>
                                            <MenuItem value="EG">Egypt</MenuItem>
                                            <MenuItem value="EE">Estonia</MenuItem>
                                            <MenuItem value="FI">Finland</MenuItem>
                                            <MenuItem value="GH">Ghana</MenuItem>
                                            <MenuItem value="GR">Greece</MenuItem>
                                            <MenuItem value="HK">Hong Kong</MenuItem>
                                            <MenuItem value="HU">Hungary</MenuItem>
                                            <MenuItem value="IS">Iceland</MenuItem>
                                            <MenuItem value="IN">India</MenuItem>
                                            <MenuItem value="ID">Indonesia</MenuItem>
                                            <MenuItem value="IL">Israel</MenuItem>
                                            <MenuItem value="JM">Jamaica</MenuItem>
                                            <MenuItem value="JP">Japan</MenuItem>
                                            <MenuItem value="JO">Jordan</MenuItem>
                                            <MenuItem value="KE">Kenya</MenuItem>
                                            <MenuItem value="KR">South Korea</MenuItem>
                                            <MenuItem value="KW">Kuwait</MenuItem>
                                            <MenuItem value="LV">Latvia</MenuItem>
                                            <MenuItem value="LB">Lebanon</MenuItem>
                                            <MenuItem value="LT">Lithuania</MenuItem>
                                            <MenuItem value="LU">Luxembourg</MenuItem>
                                            <MenuItem value="MY">Malaysia</MenuItem>
                                            <MenuItem value="MT">Malta</MenuItem>
                                            <MenuItem value="MX">Mexico</MenuItem>
                                            <MenuItem value="MA">Morocco</MenuItem>
                                            <MenuItem value="NG">Nigeria</MenuItem>
                                            <MenuItem value="NO">Norway</MenuItem>
                                            <MenuItem value="OM">Oman</MenuItem>
                                            <MenuItem value="PK">Pakistan</MenuItem>
                                            <MenuItem value="PE">Peru</MenuItem>
                                            <MenuItem value="PH">Philippines</MenuItem>
                                            <MenuItem value="PL">Poland</MenuItem>
                                            <MenuItem value="QA">Qatar</MenuItem>
                                            <MenuItem value="RO">Romania</MenuItem>
                                            <MenuItem value="RU">Russia</MenuItem>
                                            <MenuItem value="SA">Saudi Arabia</MenuItem>
                                            <MenuItem value="RS">Serbia</MenuItem>
                                            <MenuItem value="SG">Singapore</MenuItem>
                                            <MenuItem value="SK">Slovakia</MenuItem>
                                            <MenuItem value="SI">Slovenia</MenuItem>
                                            <MenuItem value="ZA">South Africa</MenuItem>
                                            <MenuItem value="LK">Sri Lanka</MenuItem>
                                            <MenuItem value="SE">Sweden</MenuItem>
                                            <MenuItem value="CH">Switzerland</MenuItem>
                                            <MenuItem value="TW">Taiwan</MenuItem>
                                            <MenuItem value="TH">Thailand</MenuItem>
                                            <MenuItem value="TR">Turkey</MenuItem>
                                            <MenuItem value="UA">Ukraine</MenuItem>
                                            <MenuItem value="AE">United Arab Emirates</MenuItem>
                                            <MenuItem value="UY">Uruguay</MenuItem>
                                            <MenuItem value="VN">Vietnam</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                </Grid>

                {/* RIGHT COLUMN — settings + placeholder */}
                <Grid item xs={12} md={4}>
                    {/* Business Settings */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <WorkflowIcon sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography variant="subtitle2" fontWeight={700}>
                                Business Settings
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
                            <Stack spacing={2.5}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Timezone</InputLabel>
                                    <Select value={formData.timezone} onChange={(e) => handleFormChange("timezone", e.target.value)} label="Timezone" sx={{ borderRadius: 2 }}>
                                        {TIMEZONES.map((tz) => <MenuItem key={tz} value={tz}>{tz}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Currency</InputLabel>
                                    <Select value={formData.currency} onChange={(e) => handleFormChange("currency", e.target.value)} label="Currency" sx={{ borderRadius: 2 }}>
                                        {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <FormControlLabel
                                    control={<Switch checked={formData.is_active} onChange={(e) => handleFormChange("is_active", e.target.checked)} />}
                                    label={<Typography variant="body2" fontWeight={500}>Brand is Active</Typography>}
                                />
                            </Stack>
                        </Box>
                    </Box>

                    {/* Your Brands */}
                    <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <CompanyIcon sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography variant="subtitle2" fontWeight={700}>
                                Your Brands
                            </Typography>
                            <Chip label={allBrands.length} size="small" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600, ml: "auto" }} />
                        </Box>
                        <Box
                            sx={{
                                borderRadius: 2.5,
                                border: 1,
                                borderColor: "divider",
                                bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
                                overflow: "hidden",
                            }}
                        >
                            {loadingBrands ? (
                                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : allBrands.length === 0 ? (
                                <Box sx={{ p: 3, textAlign: "center" }}>
                                    <Typography variant="body2" color="text.secondary">No brands yet</Typography>
                                </Box>
                            ) : (
                                <Stack divider={<Divider />}>
                                    {allBrands.map((b) => (
                                        <Box
                                            key={b.id}
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1.5,
                                                px: 2,
                                                py: 1.5,
                                                bgcolor: b.id === brand.id ? (theme: { palette: { primary: { main: string } } }) => alpha(theme.palette.primary.main, 0.04) : "transparent",
                                            }}
                                        >
                                            <Avatar
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    fontSize: "0.75rem",
                                                    fontWeight: 700,
                                                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                                                    color: "primary.main",
                                                }}
                                            >
                                                {(b.display_name || b.name).substring(0, 2).toUpperCase()}
                                            </Avatar>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="body2" fontWeight={600} noWrap>
                                                    {b.display_name || b.name}
                                                    {b.id === brand.id && (
                                                        <Chip label="Current" size="small" color="primary" variant="outlined" sx={{ ml: 1, height: 18, fontSize: "0.6rem", fontWeight: 600 }} />
                                                    )}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                    {b.business_type || "Business"} · {b.currency || "USD"}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={b.is_active ? "Active" : "Inactive"}
                                                size="small"
                                                color={b.is_active ? "success" : "default"}
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: "0.6rem" }}
                                            />
                                            {b.id !== brand.id && (
                                                <Tooltip title="Delete brand">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => { if (window.confirm(`Delete "${b.display_name || b.name}"? This cannot be undone.`)) handleDeleteBrand(b.id); }}
                                                        sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Box>
                </Grid>
            </Grid>

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

            {/* ─── Create Brand Dialog ─── */}
            <Dialog
                open={createDialogOpen}
                onClose={() => !creating && setCreateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Create New Brand</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField
                            label="Brand Name"
                            value={newBrandData.name}
                            onChange={(e) => handleNewBrandChange("name", e.target.value)}
                            fullWidth
                            required
                            size="small"
                            error={!!newBrandErrors.name}
                            helperText={newBrandErrors.name || "Internal identifier"}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                        />
                        <TextField
                            label="Display Name"
                            value={newBrandData.display_name}
                            onChange={(e) => handleNewBrandChange("display_name", e.target.value)}
                            fullWidth
                            size="small"
                            helperText="Public facing name (optional)"
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Business Type</InputLabel>
                            <Select
                                value={newBrandData.business_type}
                                onChange={(e) => handleNewBrandChange("business_type", e.target.value)}
                                label="Business Type"
                                sx={{ borderRadius: 2 }}
                            >
                                {BUSINESS_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Email"
                            type="email"
                            value={newBrandData.email}
                            onChange={(e) => handleNewBrandChange("email", e.target.value)}
                            fullWidth
                            size="small"
                            error={!!newBrandErrors.email}
                            helperText={newBrandErrors.email}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Country"
                                    value={newBrandData.country}
                                    onChange={(e) => handleNewBrandChange("country", e.target.value)}
                                    fullWidth
                                    size="small"
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Timezone</InputLabel>
                                    <Select
                                        value={newBrandData.timezone}
                                        onChange={(e) => handleNewBrandChange("timezone", e.target.value)}
                                        label="Timezone"
                                        sx={{ borderRadius: 2 }}
                                    >
                                        {TIMEZONES.map((tz) => <MenuItem key={tz} value={tz}>{tz}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Currency</InputLabel>
                                    <Select
                                        value={newBrandData.currency}
                                        onChange={(e) => handleNewBrandChange("currency", e.target.value)}
                                        label="Currency"
                                        sx={{ borderRadius: 2 }}
                                    >
                                        {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setCreateDialogOpen(false)} disabled={creating}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateBrand}
                        disabled={creating}
                        disableElevation
                        startIcon={creating ? <CircularProgress size={14} /> : <AddIcon />}
                        sx={{ fontWeight: 600, borderRadius: 2 }}
                    >
                        {creating ? "Creating…" : "Create Brand"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

function NotificationSettings() {
    return (
        <>
            <SectionHeader
                title="Notifications"
                description="Choose how and when you receive notifications."
            />
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <List disablePadding>
                    <PlaceholderRow
                        label="Email Notifications"
                        description="Receive email updates for project activity."
                        hasToggle
                    />
                    <Divider />
                    <PlaceholderRow
                        label="In-App Notifications"
                        description="Show notification badges inside the app."
                        hasToggle
                    />
                    <Divider />
                    <PlaceholderRow
                        label="Weekly Digest"
                        description="Get a summary email of activity each week."
                        hasToggle
                    />
                    <Divider />
                    <PlaceholderRow
                        label="Inquiry Alerts"
                        description="Notify when a new lead inquiry is received."
                        hasToggle
                    />
                </List>
            </Paper>
        </>
    );
}

function AppearanceSettings() {
    return (
        <>
            <SectionHeader
                title="Appearance"
                description="Customise the look and feel of your workspace."
            />
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <List disablePadding>
                    <PlaceholderRow
                        label="Theme"
                        description="Switch between light, dark, or system theme."
                    />
                    <Divider />
                    <PlaceholderRow
                        label="Accent Colour"
                        description="Choose a primary accent colour for the UI."
                    />
                    <Divider />
                    <PlaceholderRow
                        label="Compact Mode"
                        description="Reduce spacing for denser information display."
                        hasToggle
                    />
                    <Divider />
                    <PlaceholderRow
                        label="Sidebar Behaviour"
                        description="Auto-collapse sidebar on smaller screens."
                        hasToggle
                    />
                </List>
            </Paper>
        </>
    );
}

function IntegrationSettings() {
    return (
        <>
            <SectionHeader
                title="Integrations"
                description="Connect third-party services to enhance your workflow."
            />
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <List disablePadding>
                    <PlaceholderRow
                        label="Calendar Sync"
                        description="Sync project dates with Google Calendar or Outlook."
                    />
                    <Divider />
                    <PlaceholderRow
                        label="Cloud Storage"
                        description="Connect Google Drive, Dropbox, or OneDrive for file management."
                    />
                    <Divider />
                    <PlaceholderRow
                        label="Payment Gateway"
                        description="Link Stripe or PayPal for invoice payments."
                    />
                    <Divider />
                    <PlaceholderRow
                        label="Email Provider"
                        description="Configure SMTP or a transactional email service."
                    />
                </List>
            </Paper>
        </>
    );
}

function SecuritySettings() {
    return (
        <>
            <SectionHeader
                title="Security"
                description="Manage passwords, sessions, and access controls."
            />
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <List disablePadding>
                    <PlaceholderRow
                        label="Change Password"
                        description="Update your account password."
                    />
                    <Divider />
                    <PlaceholderRow
                        label="Two-Factor Authentication"
                        description="Add an extra layer of security to your account."
                        hasToggle
                    />
                    <Divider />
                    <PlaceholderRow
                        label="Active Sessions"
                        description="View and manage devices where you are logged in."
                    />
                    <Divider />
                    <PlaceholderRow
                        label="API Keys"
                        description="Generate and revoke API keys for external access."
                    />
                </List>
            </Paper>
        </>
    );
}

function BillingSettings() {
    return (
        <>
            <SectionHeader
                title="Billing & Plans"
                description="View your subscription, invoices, and payment method."
            />
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <List disablePadding>
                    <PlaceholderRow
                        label="Current Plan"
                        description="View or change your subscription tier."
                    />
                    <Divider />
                    <PlaceholderRow
                        label="Payment Method"
                        description="Manage credit card or payment details on file."
                    />
                    <Divider />
                    <PlaceholderRow
                        label="Billing History"
                        description="Download past invoices and receipts."
                    />
                    <Divider />
                    <PlaceholderRow
                        label="Usage"
                        description="Track storage and feature usage against plan limits."
                    />
                </List>
            </Paper>
        </>
    );
}

function WorkflowSettings() {
    return (
        <>
            <SectionHeader
                title="Workflow & Defaults"
                description="Set default values and automation rules for projects."
            />
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <List disablePadding>
                    <PlaceholderRow
                        label="Default Project Template"
                        description="Template automatically applied to new projects."
                    />
                    <Divider />
                    <PlaceholderRow
                        label="Task Auto-Assignment"
                        description="Automatically assign tasks based on crew roles."
                        hasToggle
                    />
                    <Divider />
                    <PlaceholderRow
                        label="Estimate Defaults"
                        description="Pre-fill tax rate, terms, and payment schedule on new estimates."
                    />
                    <Divider />
                    <PlaceholderRow
                        label="Numbering Format"
                        description="Configure invoice and quote numbering sequences."
                    />
                </List>
            </Paper>
        </>
    );
}

// ---------------------------------------------------------------------------
// Roles Settings
// ---------------------------------------------------------------------------

interface RoleWithUserCount extends Role {
    userCount?: number;
}

function RolesSettings() {
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

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        try {
            setLoading(true);
            setError(null);
            const [rolesData, contributorsData] = await Promise.all([
                api.roles.getAll(),
                api.contributors.getAll(),
            ]);
            const rolesWithCount = rolesData.map((role) => ({
                ...role,
                userCount: contributorsData.filter((c) => c.role_id === role.id).length,
            }));
            setRoles(rolesWithCount);
        } catch {
            setError("Failed to load roles data");
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
        setRoleFormData({ name: "", description: "" });
        setRoleFormErrors({});
        setCreateDialogOpen(true);
    };
    const handleEditRole = (role: Role) => {
        setSelectedRole(role);
        setRoleFormData({ name: role.name, description: role.description || "" });
        setRoleFormErrors({});
        setEditDialogOpen(true);
        handleMenuClose();
    };
    const handleDeleteRole = (role: Role) => {
        setSelectedRole(role);
        setDeleteDialogOpen(true);
        handleMenuClose();
    };

    const validateRoleForm = () => {
        const errors: { name?: string; description?: string } = {};
        if (!roleFormData.name.trim()) errors.name = "Role name is required";
        else if (roleFormData.name.length < 2) errors.name = "Role name must be at least 2 characters";
        if (roleFormData.description && roleFormData.description.length > 500)
            errors.description = "Description must be less than 500 characters";
        setRoleFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitCreate = async () => {
        if (!validateRoleForm()) return;
        try {
            setSubmitting(true);
            setError(null);
            await api.roles.create({ name: roleFormData.name.trim(), description: roleFormData.description.trim() || undefined });
            await loadRoles();
            setCreateDialogOpen(false);
            setSuccess("Role created successfully!");
        } catch {
            setError("Failed to create role");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitEdit = async () => {
        if (!selectedRole || !validateRoleForm()) return;
        try {
            setSubmitting(true);
            setError(null);
            await api.roles.update(selectedRole.id, { name: roleFormData.name.trim(), description: roleFormData.description.trim() || undefined });
            await loadRoles();
            setEditDialogOpen(false);
            setSelectedRole(null);
            setSuccess("Role updated successfully!");
        } catch {
            setError("Failed to update role");
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
            await loadRoles();
            setDeleteDialogOpen(false);
            setSelectedRole(null);
            setSuccess("Role deleted successfully!");
        } catch {
            setError("Failed to delete role");
        } finally {
            setSubmitting(false);
        }
    };

    const getRoleIcon = (roleName: string) => {
        const name = roleName.toLowerCase();
        if (name.includes("admin")) return <AdminIcon sx={{ fontSize: 20, color: "primary.main" }} />;
        if (name.includes("manager")) return <ShieldFilledIcon sx={{ fontSize: 20, color: "primary.main" }} />;
        if (name.includes("lead")) return <GroupIcon sx={{ fontSize: 20, color: "primary.main" }} />;
        return <ProfileIcon sx={{ fontSize: 20, color: "text.secondary" }} />;
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            {/* ─── Roles Header ─── */}
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
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                    }}
                >
                    <RolesIcon sx={{ color: "primary.main", fontSize: 24 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1.1rem" }}>
                        Roles & Permissions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage user roles and permissions across the system
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateRole}
                    size="small"
                    disableElevation
                    sx={{ fontWeight: 600, borderRadius: 2, flexShrink: 0 }}
                >
                    Create Role
                </Button>
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

            {/* ─── Roles Table ─── */}
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
                                                <Typography variant="body2" fontWeight={600}>
                                                    {role.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    ID: {role.id}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {role.description || "No description"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`${role.userCount || 0} users`}
                                            size="small"
                                            sx={{
                                                fontWeight: 600,
                                                height: 22,
                                                fontSize: "0.7rem",
                                                bgcolor: (theme) =>
                                                    role.userCount && role.userCount > 0
                                                        ? alpha(theme.palette.primary.main, 0.12)
                                                        : undefined,
                                                color: role.userCount && role.userCount > 0 ? "primary.main" : undefined,
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                                            label="Active"
                                            size="small"
                                            color="success"
                                            variant="outlined"
                                            sx={{ fontWeight: 500, height: 22, fontSize: "0.7rem" }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={(e) => handleMenuOpen(e, role.id)} size="small">
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {roles.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No roles available
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
                <MenuItem
                    onClick={() => {
                        const role = roles.find((r) => r.id === menuRoleId);
                        if (role) handleEditRole(role);
                    }}
                >
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Edit Role</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem
                    onClick={() => {
                        const role = roles.find((r) => r.id === menuRoleId);
                        if (role) handleDeleteRole(role);
                    }}
                    sx={{ color: "error.main" }}
                >
                    <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText>Delete Role</ListItemText>
                </MenuItem>
            </Menu>

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Create New Role</DialogTitle>
                <Divider />
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField label="Role Name" value={roleFormData.name} onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })} error={!!roleFormErrors.name} helperText={roleFormErrors.name} fullWidth required size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                        <TextField label="Description" value={roleFormData.description} onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })} error={!!roleFormErrors.description} helperText={roleFormErrors.description} fullWidth multiline rows={3} size="small" placeholder="Describe the role's responsibilities…" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                    </Stack>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setCreateDialogOpen(false)} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleSubmitCreate} variant="contained" disabled={submitting} disableElevation startIcon={submitting ? <CircularProgress size={14} /> : <AddIcon />} sx={{ borderRadius: 2, fontWeight: 600 }}>
                        {submitting ? "Creating…" : "Create Role"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Edit Role</DialogTitle>
                <Divider />
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField label="Role Name" value={roleFormData.name} onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })} error={!!roleFormErrors.name} helperText={roleFormErrors.name} fullWidth required size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                        <TextField label="Description" value={roleFormData.description} onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })} error={!!roleFormErrors.description} helperText={roleFormErrors.description} fullWidth multiline rows={3} size="small" placeholder="Describe the role's responsibilities…" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                    </Stack>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setEditDialogOpen(false)} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleSubmitEdit} variant="contained" disabled={submitting} disableElevation startIcon={submitting ? <CircularProgress size={14} /> : <EditIcon />} sx={{ borderRadius: 2, fontWeight: 600 }}>
                        {submitting ? "Saving…" : "Save Changes"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Delete Role</DialogTitle>
                <Divider />
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                            Are you sure you want to delete this role?
                        </Typography>
                        <Typography variant="body2">
                            This action cannot be undone. Users assigned to this role may lose access.
                        </Typography>
                    </Alert>
                    {selectedRole && (
                        <Box sx={{ p: 2, borderRadius: 2, border: 1, borderColor: "divider" }}>
                            <Typography variant="body2" fontWeight={600}>
                                {selectedRole.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {selectedRole.description || "No description"}
                            </Typography>
                            <Typography variant="caption" display="block" color="error.main" sx={{ mt: 0.5 }}>
                                {roles.find((r) => r.id === selectedRole.id)?.userCount || 0} users currently have this role
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleSubmitDelete} variant="contained" color="error" disabled={submitting} disableElevation startIcon={submitting ? <CircularProgress size={14} /> : <DeleteIcon />} sx={{ borderRadius: 2, fontWeight: 600 }}>
                        {submitting ? "Deleting…" : "Delete Role"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

// ---------------------------------------------------------------------------
// Users / Team Management
// ---------------------------------------------------------------------------

function UsersSettings() {
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const { user } = useAuth();

    // Dialog states
    const [inviteOpen, setInviteOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [archiveOpen, setArchiveOpen] = useState(false);
    const [selected, setSelected] = useState<Contributor | null>(null);

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
                api.contributors.getAll(),
                api.roles.getAll(),
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
            await api.contributors.create({
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
    const openEdit = (c: Contributor) => {
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
            await api.contributors.update(selected.id, {
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
    const openArchive = (c: Contributor) => {
        setSelected(c);
        setArchiveOpen(true);
        handleMenuClose();
    };
    const handleArchiveSubmit = async () => {
        if (!selected) return;
        try {
            setSubmitting(true); setError(null);
            // Toggle archive status
            await api.contributors.delete(selected.id);
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

// ---------------------------------------------------------------------------
// Payment Schedule Settings
// ---------------------------------------------------------------------------

type RuleForm = Omit<PaymentScheduleRule, 'id' | 'template_id'>;

/** Derive a human label from trigger type + days — no user input needed */
function autoRuleLabel(rule: RuleForm): string {
    switch (rule.trigger_type) {
        case 'AFTER_BOOKING':
            return rule.trigger_days === 0 ? 'Booking Deposit' : `Deposit (${rule.trigger_days} days after booking)`;
        case 'BEFORE_EVENT':
            if (rule.trigger_days === 0) return 'Final Balance';
            return `Final Balance (${rule.trigger_days} days before)`;
        case 'AFTER_EVENT':
            return 'Post-Event Balance';
        default:
            return 'Payment';
    }
}

/** Derive a template name from the set of rules */
function autoTemplateName(rules: RuleForm[]): string {
    if (rules.length === 0) return '';
    if (rules.every(r => r.amount_type === 'PERCENT')) {
        const pcts = rules.map(r => Number(r.amount_value));
        if (pcts.length === 1 && pcts[0] === 100) return 'Full Upfront';
        if (pcts.length === 2 && pcts[0] === 50 && pcts[1] === 50) return '50/50 Split';
        if (pcts.length === 2 && pcts[0] === 25 && pcts[1] === 75) return '25/75 Split';
        if (pcts.length === 2 && pcts[0] === 30 && pcts[1] === 70) return '30/70 Split';
        if (pcts.length <= 5) return pcts.join('/') + ' Split';
    }
    return rules.map(r => `${r.amount_value}%`).join(' + ') + ' Schedule';
}

const EMPTY_RULE = (): RuleForm => ({
    label: 'Booking Deposit',
    amount_type: 'PERCENT',
    amount_value: 0,
    trigger_type: 'AFTER_BOOKING',
    trigger_days: 0,
    order_index: 0,
});

// Colours for milestone pills indexed by position
const MILESTONE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

// ── Crew payment template helpers ────────────────────────────────────────────
type CrewRuleForm = {
    label: string;
    amount_type: PaymentAmountType;
    amount_value: number;
    trigger_type: CrewPaymentTriggerType;
    trigger_days: number;
    task_library_id: number | null;
    frequency: CrewPaymentFrequency | null;
    order_index: number;
};

type CrewPreset = {
    key: string;
    name: string;
    description: string;
    rules: Omit<CrewRuleForm, 'order_index'>[];
};

type CrewDialogStep = 'preset' | 'editor';
type ProjectMode = 'milestone' | 'recurring' | 'simple';

const PAYMENT_TERMS_OPTIONS: { value: CrewPaymentTerms; label: string }[] = [
    { value: 'DUE_ON_RECEIPT', label: 'Due on receipt' },
    { value: 'NET_7', label: 'Net 7 — 7 days' },
    { value: 'NET_14', label: 'Net 14 — 14 days' },
    { value: 'NET_30', label: 'Net 30 — 30 days' },
    { value: 'NET_60', label: 'Net 60 — 60 days' },
];

const ON_SITE_PRESETS: CrewPreset[] = [
    {
        key: 'single', name: 'Single Payment', description: '100% on shoot day',
        rules: [{ label: 'Shoot Day Payment', amount_type: 'PERCENT', amount_value: 100, trigger_type: 'ON_SHOOT_DAY', trigger_days: 0, task_library_id: null, frequency: null }],
    },
    {
        key: '50_50', name: '50/50 Split', description: '50% on booking, 50% on shoot day',
        rules: [
            { label: 'Booking Payment', amount_type: 'PERCENT', amount_value: 50, trigger_type: 'ON_BOOKING', trigger_days: 0, task_library_id: null, frequency: null },
            { label: 'Shoot Day Payment', amount_type: 'PERCENT', amount_value: 50, trigger_type: 'ON_SHOOT_DAY', trigger_days: 0, task_library_id: null, frequency: null },
        ],
    },
    {
        key: 'deposit_balance', name: 'Deposit + Balance', description: '25% on booking, 75% on shoot day',
        rules: [
            { label: 'Booking Deposit', amount_type: 'PERCENT', amount_value: 25, trigger_type: 'ON_BOOKING', trigger_days: 0, task_library_id: null, frequency: null },
            { label: 'Balance Payment', amount_type: 'PERCENT', amount_value: 75, trigger_type: 'ON_SHOOT_DAY', trigger_days: 0, task_library_id: null, frequency: null },
        ],
    },
    {
        key: '3_stage', name: '3-Stage', description: '30% booking, 40% shoot, 30% delivery',
        rules: [
            { label: 'Booking Deposit', amount_type: 'PERCENT', amount_value: 30, trigger_type: 'ON_BOOKING', trigger_days: 0, task_library_id: null, frequency: null },
            { label: 'Shoot Day Payment', amount_type: 'PERCENT', amount_value: 40, trigger_type: 'ON_SHOOT_DAY', trigger_days: 0, task_library_id: null, frequency: null },
            { label: 'Final Payment', amount_type: 'PERCENT', amount_value: 30, trigger_type: 'AFTER_DELIVERY', trigger_days: 0, task_library_id: null, frequency: null },
        ],
    },
];

const SIMPLE_SPLIT_PRESETS: CrewPreset[] = [
    {
        key: 'full_completion', name: 'On Completion', description: '100% on completion',
        rules: [{ label: 'On Completion', amount_type: 'PERCENT', amount_value: 100, trigger_type: 'ON_COMPLETION', trigger_days: 0, task_library_id: null, frequency: null }],
    },
    {
        key: 'start_delivery', name: 'Start + Delivery', description: '50% on booking, 50% after delivery',
        rules: [
            { label: 'Booking Payment', amount_type: 'PERCENT', amount_value: 50, trigger_type: 'ON_BOOKING', trigger_days: 0, task_library_id: null, frequency: null },
            { label: 'Delivery Payment', amount_type: 'PERCENT', amount_value: 50, trigger_type: 'AFTER_DELIVERY', trigger_days: 0, task_library_id: null, frequency: null },
        ],
    },
];

function autoCrewRuleLabel(rule: CrewRuleForm): string {
    switch (rule.trigger_type) {
        case 'ON_BOOKING':
            return 'Booking Payment';
        case 'ON_SHOOT_DAY':
            return 'Shoot Day Payment';
        case 'ON_COMPLETION':
            return 'On Completion';
        case 'AFTER_DELIVERY':
            return rule.trigger_days === 0 ? 'On Delivery' : `Post-Delivery (${rule.trigger_days}d)`;
        case 'BEFORE_EVENT':
            return rule.trigger_days ? `${rule.trigger_days}d Before Event` : 'Before Event';
        case 'AFTER_EVENT':
            return rule.trigger_days ? `${rule.trigger_days}d After Event` : 'After Event';
        case 'ON_FIRST_EDIT':
            return 'First Edit Begins';
        case 'AFTER_ROUGH_CUT':
            return rule.trigger_days ? `${rule.trigger_days}d After Rough Cut` : 'After Rough Cut';
        case 'NET_DAYS':
            return rule.trigger_days ? `Net ${rule.trigger_days}` : 'Net Days';
        case 'ON_TASK_COMPLETE':
            return 'Task Milestone';
        case 'RECURRING':
            return rule.frequency === 'WEEKLY' ? 'Weekly Payment' : rule.frequency === 'FORTNIGHTLY' ? 'Fortnightly Payment' : 'Monthly Payment';
        default:
            return 'Payment';
    }
}

function autoCrewTemplateName(rules: CrewRuleForm[], roleType: CrewPaymentRoleType): string {
    const prefix = roleType === 'on_site' ? 'On-Location' : 'Project';
    if (rules.length === 0) return prefix;
    if (rules.some(r => r.trigger_type === 'RECURRING')) {
        const freq = rules.find(r => r.trigger_type === 'RECURRING')?.frequency;
        return `${prefix} — ${freq === 'WEEKLY' ? 'Weekly' : freq === 'FORTNIGHTLY' ? 'Fortnightly' : 'Monthly'}`;
    }
    if (rules.some(r => r.trigger_type === 'ON_TASK_COMPLETE')) return `${prefix} — Milestone-Based`;
    if (rules.every(r => r.amount_type === 'PERCENT')) {
        const pcts = rules.map(r => Number(r.amount_value));
        if (pcts.length === 1 && pcts[0] === 100) return `${prefix} — Full Upfront`;
        if (pcts.length === 2 && pcts[0] === 50 && pcts[1] === 50) return `${prefix} — 50/50`;
        if (pcts.length <= 5) return `${prefix} — ${pcts.join('/')}`;
    }
    return `${prefix} Schedule`;
}

const EMPTY_CREW_RULE = (roleType: CrewPaymentRoleType): CrewRuleForm => ({
    label: roleType === 'on_site' ? 'Booking Payment' : 'On Completion',
    amount_type: 'PERCENT',
    amount_value: 0,
    trigger_type: roleType === 'on_site' ? 'ON_BOOKING' : 'ON_COMPLETION',
    trigger_days: 0,
    task_library_id: null,
    frequency: null,
    order_index: 0,
});

function PaymentScheduleSettings() {
    const { currentBrand, refreshBrands } = useBrand();

    // ── Brand payment/tax settings ───────────────────────────────────────────
    const [paymentSettings, setPaymentSettings] = React.useState({
        default_tax_rate: 0 as number,
        tax_number: '',
        default_payment_method: 'Bank Transfer',
        payment_terms_days: 30 as number,
        bank_name: '',
        bank_account_name: '',
        bank_sort_code: '',
        bank_account_number: '',
        late_fee_percent: 2 as number,
        cancellation_tier1_days: 90 as number,
        cancellation_tier2_days: 30 as number,
        cancellation_tier1_percent: 50 as number,
        crew_payment_terms: '50% on booking confirmation, 50% within 7 days of delivery',
        crew_response_deadline_days: 5 as number,
        inquiry_validity_days: 14 as number,
    });
    const [originalPaymentSettings, setOriginalPaymentSettings] = React.useState(paymentSettings);
    const [savingSettings, setSavingSettings] = React.useState(false);
    const paymentSettingsChanged = JSON.stringify(paymentSettings) !== JSON.stringify(originalPaymentSettings);

    const loadPaymentSettings = React.useCallback(async () => {
        if (!currentBrand?.id) return;
        try {
            const b = await api.brands.getById(currentBrand.id);
            const vals = {
                default_tax_rate: b.default_tax_rate ?? 0,
                tax_number: b.tax_number || '',
                default_payment_method: b.default_payment_method || 'Bank Transfer',
                payment_terms_days: b.payment_terms_days ?? 30,
                bank_name: b.bank_name || '',
                bank_account_name: b.bank_account_name || '',
                bank_sort_code: b.bank_sort_code || '',
                bank_account_number: b.bank_account_number || '',
                late_fee_percent: b.late_fee_percent ?? 2,
                cancellation_tier1_days: b.cancellation_tier1_days ?? 90,
                cancellation_tier2_days: b.cancellation_tier2_days ?? 30,
                cancellation_tier1_percent: b.cancellation_tier1_percent ?? 50,
                crew_payment_terms: b.crew_payment_terms || '50% on booking confirmation, 50% within 7 days of delivery',
                crew_response_deadline_days: b.crew_response_deadline_days ?? 5,
                inquiry_validity_days: b.inquiry_validity_days ?? 14,
            };
            setPaymentSettings(vals);
            setOriginalPaymentSettings(vals);
        } catch { /* ignore */ }
    }, [currentBrand?.id]);

    React.useEffect(() => { loadPaymentSettings(); }, [loadPaymentSettings]);

    const handleSaveSettings = async () => {
        if (!currentBrand?.id) return;
        setSavingSettings(true);
        try {
            await api.brands.update(currentBrand.id, paymentSettings);
            setOriginalPaymentSettings({ ...paymentSettings });
            await refreshBrands();
            setSnack('Payment settings saved');
        } catch { setSnack('Failed to save settings'); }
        finally { setSavingSettings(false); }
    };

    const handleDiscardSettings = () => setPaymentSettings({ ...originalPaymentSettings });

    // ── Payment schedule templates ───────────────────────────────────────────
    const [templates, setTemplates] = React.useState<PaymentScheduleTemplate[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<PaymentScheduleTemplate | null>(null);
    const [form, setForm] = React.useState<{ name: string; description: string; is_default: boolean; rules: RuleForm[] }>({
        name: '', description: '', is_default: false, rules: [EMPTY_RULE()],
    });
    const nameIsAuto = React.useRef(true);
    const [saving, setSaving] = React.useState(false);
    const [snack, setSnack] = React.useState('');

    const brandId = currentBrand?.id ?? 1;

    // ── data ─────────────────────────────────────────────────────────────────
    const loadTemplates = React.useCallback(async () => {
        try {
            const res = await api.paymentSchedules.getAll(brandId);
            setTemplates(res);
        } catch {
            try {
                const res = await api.paymentSchedules.getAll(1);
                setTemplates(res);
            } catch { /* ignore */ }
        } finally {
            setLoading(false);
        }
    }, [brandId]);

    React.useEffect(() => { loadTemplates(); }, []);

    // ── open dialog ───────────────────────────────────────────────────────────
    const openNew = () => {
        nameIsAuto.current = true;
        setEditing(null);
        const rules = [EMPTY_RULE()];
        setForm({ name: autoTemplateName(rules), description: '', is_default: templates.length === 0, rules });
        setDialogOpen(true);
    };

    const openEdit = (t: PaymentScheduleTemplate) => {
        nameIsAuto.current = false;
        setEditing(t);
        setForm({
            name: t.name,
            description: t.description ?? '',
            is_default: t.is_default,
            rules: t.rules.map(r => ({
                label: r.label,
                amount_type: r.amount_type,
                amount_value: r.amount_value,
                trigger_type: r.trigger_type,
                trigger_days: r.trigger_days ?? 0,
                order_index: r.order_index ?? 0,
            })),
        });
        setDialogOpen(true);
    };

    // ── rule helpers ─────────────────────────────────────────────────────────
    const addRule = () => {
        const newRule = { ...EMPTY_RULE(), label: autoRuleLabel(EMPTY_RULE()), order_index: form.rules.length };
        const newRules = [...form.rules, newRule];
        setForm(f => ({ ...f, name: nameIsAuto.current ? autoTemplateName(newRules) : f.name, rules: newRules }));
    };

    const removeRule = (i: number) => {
        const newRules = form.rules.filter((_, idx) => idx !== i);
        setForm(f => ({ ...f, name: nameIsAuto.current ? autoTemplateName(newRules) : f.name, rules: newRules }));
    };

    const updateRule = (i: number, patch: Partial<RuleForm>) => {
        setForm(f => {
            const newRules = f.rules.map((r, idx) => {
                if (idx !== i) return r;
                const updated = { ...r, ...patch };
                updated.label = autoRuleLabel(updated);
                return updated;
            });
            return { ...f, name: nameIsAuto.current ? autoTemplateName(newRules) : f.name, rules: newRules };
        });
    };

    // ── save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        const finalName = form.name.trim() || autoTemplateName(form.rules) || 'Payment Schedule';
        setSaving(true);
        try {
            const payload = { ...form, name: finalName, rules: form.rules.map((r, i) => ({ ...r, order_index: i })) };
            if (editing) {
                await api.paymentSchedules.update(brandId, editing.id, payload);
            } else {
                await api.paymentSchedules.create(brandId, payload);
            }
            setSnack(editing ? 'Template updated' : 'Template created');
            setDialogOpen(false);
            loadTemplates();
        } catch (e: any) {
            setSnack(e?.message?.includes('already exists') ? 'A template with that name already exists' : 'Failed to save template');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.paymentSchedules.delete(brandId, id);
            setSnack('Template deleted');
            loadTemplates();
        } catch { setSnack('Failed to delete template'); }
    };

    const handleSetDefault = async (t: PaymentScheduleTemplate) => {
        try {
            await api.paymentSchedules.update(brandId, t.id, { is_default: true });
            setSnack(`"${t.name}" is now the default`);
            loadTemplates();
        } catch { setSnack('Failed to update default'); }
    };

    const pctTotal = form.rules
        .filter(r => r.amount_type === 'PERCENT')
        .reduce((s, r) => s + Number(r.amount_value), 0);

    // ── Crew payment templates ───────────────────────────────────────────────
    const [crewTemplates, setCrewTemplates] = React.useState<CrewPaymentTemplate[]>([]);
    const [crewDialogOpen, setCrewDialogOpen] = React.useState(false);
    const [crewEditing, setCrewEditing] = React.useState<CrewPaymentTemplate | null>(null);
    const [crewDialogStep, setCrewDialogStep] = React.useState<CrewDialogStep>('preset');
    const [crewProjectMode, setCrewProjectMode] = React.useState<ProjectMode | null>(null);
    const [crewForm, setCrewForm] = React.useState<{ name: string; description: string; role_type: CrewPaymentRoleType; payment_terms: CrewPaymentTerms; is_default: boolean; rules: CrewRuleForm[] }>({
        name: '', description: '', role_type: 'on_site', payment_terms: 'DUE_ON_RECEIPT', is_default: false, rules: [EMPTY_CREW_RULE('on_site')],
    });
    const crewNameIsAuto = React.useRef(true);
    const [crewSaving, setCrewSaving] = React.useState(false);
    const [taskLibraryItems, setTaskLibraryItems] = React.useState<TaskLibrary[]>([]);

    const loadCrewTemplates = React.useCallback(async () => {
        try {
            const res = await api.crewPaymentTemplates.getAll(brandId);
            setCrewTemplates(res);
        } catch { /* ignore */ }
    }, [brandId]);

    React.useEffect(() => { loadCrewTemplates(); }, [loadCrewTemplates]);

    // Load task library for milestone-based mode
    React.useEffect(() => {
        if (!crewDialogOpen || crewForm.role_type !== 'off_site') return;
        api.taskLibrary.getAll({ is_active: true }).then(setTaskLibraryItems).catch(() => {});
    }, [crewDialogOpen, crewForm.role_type]);

    const openNewCrew = (roleType: CrewPaymentRoleType = 'on_site') => {
        crewNameIsAuto.current = true;
        setCrewEditing(null);
        setCrewDialogStep('preset');
        setCrewProjectMode(null);
        setCrewForm({ name: '', description: '', role_type: roleType, payment_terms: 'DUE_ON_RECEIPT', is_default: crewTemplates.filter(t => t.role_type === roleType).length === 0, rules: [] });
        setCrewDialogOpen(true);
    };

    const openEditCrew = (t: CrewPaymentTemplate) => {
        crewNameIsAuto.current = false;
        setCrewEditing(t);
        setCrewDialogStep('editor');
        // Detect project mode for off_site templates
        if (t.role_type === 'off_site') {
            if (t.rules.some(r => r.trigger_type === 'ON_TASK_COMPLETE')) setCrewProjectMode('milestone');
            else if (t.rules.some(r => r.trigger_type === 'RECURRING')) setCrewProjectMode('recurring');
            else setCrewProjectMode('simple');
        } else {
            setCrewProjectMode(null);
        }
        setCrewForm({
            name: t.name,
            description: t.description ?? '',
            role_type: t.role_type,
            payment_terms: (t.payment_terms as CrewPaymentTerms) ?? 'DUE_ON_RECEIPT',
            is_default: t.is_default,
            rules: t.rules.map(r => ({
                label: r.label,
                amount_type: r.amount_type,
                amount_value: r.amount_value,
                trigger_type: r.trigger_type as CrewPaymentTriggerType,
                trigger_days: r.trigger_days ?? 0,
                task_library_id: r.task_library_id ?? null,
                frequency: (r.frequency as CrewPaymentFrequency) ?? null,
                order_index: r.order_index ?? 0,
            })),
        });
        setCrewDialogOpen(true);
    };

    const applyCrewPreset = (preset: CrewPreset) => {
        crewNameIsAuto.current = true;
        const rules = preset.rules.map((r, i) => ({ ...r, order_index: i }));
        setCrewForm(f => ({ ...f, name: autoCrewTemplateName(rules, f.role_type), rules }));
        setCrewDialogStep('editor');
    };

    const addCrewRule = () => {
        const newRule = { ...EMPTY_CREW_RULE(crewForm.role_type), label: autoCrewRuleLabel(EMPTY_CREW_RULE(crewForm.role_type)), order_index: crewForm.rules.length };
        const newRules = [...crewForm.rules, newRule];
        setCrewForm(f => ({ ...f, name: crewNameIsAuto.current ? autoCrewTemplateName(newRules, f.role_type) : f.name, rules: newRules }));
    };

    const removeCrewRule = (i: number) => {
        const newRules = crewForm.rules.filter((_, idx) => idx !== i);
        setCrewForm(f => ({ ...f, name: crewNameIsAuto.current ? autoCrewTemplateName(newRules, f.role_type) : f.name, rules: newRules }));
    };

    const updateCrewRule = (i: number, patch: Partial<CrewRuleForm>) => {
        setCrewForm(f => {
            const newRules = f.rules.map((r, idx) => {
                if (idx !== i) return r;
                const updated = { ...r, ...patch };
                updated.label = autoCrewRuleLabel(updated);
                return updated;
            });
            return { ...f, name: crewNameIsAuto.current ? autoCrewTemplateName(newRules, f.role_type) : f.name, rules: newRules };
        });
    };

    const handleSaveCrew = async () => {
        const finalName = crewForm.name.trim() || autoCrewTemplateName(crewForm.rules, crewForm.role_type) || 'Crew Payment Terms';
        setCrewSaving(true);
        try {
            const payload = { ...crewForm, name: finalName, rules: crewForm.rules.map((r, i) => ({ ...r, order_index: i })) };
            if (crewEditing) {
                await api.crewPaymentTemplates.update(brandId, crewEditing.id, payload);
            } else {
                await api.crewPaymentTemplates.create(brandId, payload);
            }
            setSnack(crewEditing ? 'Crew terms updated' : 'Crew terms created');
            setCrewDialogOpen(false);
            loadCrewTemplates();
        } catch (e: any) {
            setSnack(e?.message?.includes('already exists') ? 'A template with that name already exists' : 'Failed to save crew terms');
        } finally { setCrewSaving(false); }
    };

    const handleDeleteCrew = async (id: number) => {
        try {
            await api.crewPaymentTemplates.delete(brandId, id);
            setSnack('Crew terms deleted');
            loadCrewTemplates();
        } catch { setSnack('Failed to delete crew terms'); }
    };

    const handleSetDefaultCrew = async (t: CrewPaymentTemplate) => {
        try {
            await api.crewPaymentTemplates.update(brandId, t.id, { is_default: true });
            setSnack(`"${t.name}" is now the default for ${t.role_type === 'on_site' ? 'on-site' : 'off-site'} roles`);
            loadCrewTemplates();
        } catch { setSnack('Failed to update default'); }
    };

    const crewPctTotal = crewForm.rules
        .filter(r => r.amount_type === 'PERCENT')
        .reduce((s, r) => s + Number(r.amount_value), 0);

    const onSiteTemplates = crewTemplates.filter(t => t.role_type === 'on_site');
    const offSiteTemplates = crewTemplates.filter(t => t.role_type === 'off_site');

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;

    return (
        <>
            {/* Save/Discard bar for payment settings */}
            {paymentSettingsChanged && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
                    <Button onClick={handleDiscardSettings} sx={{ textTransform: 'none' }}>Discard</Button>
                    <Button variant="contained" onClick={handleSaveSettings} disabled={savingSettings} disableElevation
                        sx={{ fontWeight: 600, borderRadius: 2, textTransform: 'none' }}>
                        {savingSettings ? 'Saving…' : 'Save Settings'}
                    </Button>
                </Box>
            )}

            {/* ─── Two-column layout ─── */}
            <Grid container spacing={3}>
                {/* LEFT COLUMN */}
                <Grid item xs={12} md={7}>
                    {/* Payment Defaults */}
                    <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <CreditCardIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant="subtitle2" fontWeight={700}>Payment Defaults</Typography>
                        </Box>
                        <Box sx={{ p: 2.5, borderRadius: 2.5, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Default Payment Method</InputLabel>
                                        <Select label="Default Payment Method"
                                            value={paymentSettings.default_payment_method}
                                            onChange={e => setPaymentSettings(s => ({ ...s, default_payment_method: e.target.value }))}
                                            sx={{ borderRadius: 2 }}>
                                            <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                                            <MenuItem value="Credit Card">Credit Card</MenuItem>
                                            <MenuItem value="PayPal">PayPal</MenuItem>
                                            <MenuItem value="Stripe">Stripe</MenuItem>
                                            <MenuItem value="Cash">Cash</MenuItem>
                                            <MenuItem value="Cheque">Cheque</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Payment Terms</InputLabel>
                                        <Select label="Payment Terms"
                                            value={paymentSettings.payment_terms_days}
                                            onChange={e => setPaymentSettings(s => ({ ...s, payment_terms_days: Number(e.target.value) }))}
                                            sx={{ borderRadius: 2 }}>
                                            <MenuItem value={0}>Due on receipt</MenuItem>
                                            <MenuItem value={7}>Net 7 — 7 days</MenuItem>
                                            <MenuItem value={14}>Net 14 — 14 days</MenuItem>
                                            <MenuItem value={30}>Net 30 — 30 days</MenuItem>
                                            <MenuItem value={45}>Net 45 — 45 days</MenuItem>
                                            <MenuItem value={60}>Net 60 — 60 days</MenuItem>
                                            <MenuItem value={90}>Net 90 — 90 days</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 0.5 }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Bank Details</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Bank Name" fullWidth size="small"
                                        value={paymentSettings.bank_name}
                                        onChange={e => setPaymentSettings(s => ({ ...s, bank_name: e.target.value }))}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Account Name" fullWidth size="small"
                                        value={paymentSettings.bank_account_name}
                                        onChange={e => setPaymentSettings(s => ({ ...s, bank_account_name: e.target.value }))}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Sort Code" fullWidth size="small"
                                        value={paymentSettings.bank_sort_code}
                                        onChange={e => setPaymentSettings(s => ({ ...s, bank_sort_code: e.target.value }))}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Account Number" fullWidth size="small"
                                        value={paymentSettings.bank_account_number}
                                        onChange={e => setPaymentSettings(s => ({ ...s, bank_account_number: e.target.value }))}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    {/* Tax Details */}
                    <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <ReceiptLongIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant="subtitle2" fontWeight={700}>Tax Details</Typography>
                        </Box>
                        <Box sx={{ p: 2.5, borderRadius: 2.5, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                            {(currentBrand?.country === 'GB' || currentBrand?.country === 'United Kingdom') ? (
                                /* ── UK VAT ── */
                                <Grid container spacing={2.5}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>VAT Rate</InputLabel>
                                            <Select label="VAT Rate"
                                                value={paymentSettings.default_tax_rate}
                                                onChange={e => setPaymentSettings(s => ({ ...s, default_tax_rate: Number(e.target.value) }))}
                                                sx={{ borderRadius: 2 }}>
                                                <MenuItem value={20}>Standard Rate — 20%</MenuItem>
                                                <MenuItem value={5}>Reduced Rate — 5%</MenuItem>
                                                <MenuItem value={0}>Zero Rate — 0%</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                                            Applied to new estimates, quotes & invoices
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField label="VAT Number" fullWidth size="small"
                                            value={paymentSettings.tax_number}
                                            onChange={e => setPaymentSettings(s => ({ ...s, tax_number: e.target.value }))}
                                            placeholder="GB 123 4567 89"
                                            helperText="Displayed on invoices & estimates"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="text.disabled">
                                            VAT rates based on HMRC guidelines. Register for VAT if your taxable turnover exceeds £90,000.
                                        </Typography>
                                    </Grid>
                                </Grid>
                            ) : (
                                /* ── Generic / other countries ── */
                                <Grid container spacing={2.5}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField label="Default Tax Rate" fullWidth size="small" type="number"
                                            value={paymentSettings.default_tax_rate}
                                            onChange={e => setPaymentSettings(s => ({ ...s, default_tax_rate: Number(e.target.value) }))}
                                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                            inputProps={{ min: 0, max: 100, step: 0.01 }}
                                            helperText="Applied to new estimates, quotes & invoices"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField label="Tax Number" fullWidth size="small"
                                            value={paymentSettings.tax_number}
                                            onChange={e => setPaymentSettings(s => ({ ...s, tax_number: e.target.value }))}
                                            placeholder="e.g. VAT, GST, EIN"
                                            helperText="Displayed on invoices & estimates"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Grid>
                                </Grid>
                            )}
                        </Box>
                    </Box>

                    {/* Inquiry & Crew Defaults */}
                    <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <ScheduleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant="subtitle2" fontWeight={700}>Inquiry & Crew Defaults</Typography>
                        </Box>
                        <Box sx={{ p: 2.5, borderRadius: 2.5, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Crew Response Deadline" fullWidth size="small" type="number"
                                        value={paymentSettings.crew_response_deadline_days}
                                        onChange={e => setPaymentSettings(s => ({ ...s, crew_response_deadline_days: Number(e.target.value) }))}
                                        InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }}
                                        inputProps={{ min: 1, max: 90 }}
                                        helperText="How long crew have to respond to availability requests"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Inquiry Validity Period" fullWidth size="small" type="number"
                                        value={paymentSettings.inquiry_validity_days}
                                        onChange={e => setPaymentSettings(s => ({ ...s, inquiry_validity_days: Number(e.target.value) }))}
                                        InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }}
                                        inputProps={{ min: 1, max: 365 }}
                                        helperText="How long an inquiry offer stays valid after creation"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    {/* Contract Policies */}
                    <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <ContractsIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant="subtitle2" fontWeight={700}>Contract Policies</Typography>
                        </Box>
                        <Box sx={{ p: 2.5, borderRadius: 2.5, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                These values are used as contract template variables (e.g. {'{{brand.late_fee_percent}}'}) so your clauses stay in sync with your policies.
                            </Typography>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Late Fee" fullWidth size="small" type="number"
                                        value={paymentSettings.late_fee_percent}
                                        onChange={e => setPaymentSettings(s => ({ ...s, late_fee_percent: Number(e.target.value) }))}
                                        InputProps={{ endAdornment: <InputAdornment position="end">% / month</InputAdornment> }}
                                        inputProps={{ min: 0, max: 100, step: 0.5 }}
                                        helperText="Charged on overdue invoices"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Cancellation Fee" fullWidth size="small" type="number"
                                        value={paymentSettings.cancellation_tier1_percent}
                                        onChange={e => setPaymentSettings(s => ({ ...s, cancellation_tier1_percent: Number(e.target.value) }))}
                                        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                        inputProps={{ min: 0, max: 100, step: 5 }}
                                        helperText="Charged when cancelled within tier 1"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Cancellation Tier 1" fullWidth size="small" type="number"
                                        value={paymentSettings.cancellation_tier1_days}
                                        onChange={e => setPaymentSettings(s => ({ ...s, cancellation_tier1_days: Number(e.target.value) }))}
                                        InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }}
                                        inputProps={{ min: 0 }}
                                        helperText="Partial fee applies within this window"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Cancellation Tier 2" fullWidth size="small" type="number"
                                        value={paymentSettings.cancellation_tier2_days}
                                        onChange={e => setPaymentSettings(s => ({ ...s, cancellation_tier2_days: Number(e.target.value) }))}
                                        InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }}
                                        inputProps={{ min: 0 }}
                                        helperText="Full fee applies within this window"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                </Grid>

                {/* RIGHT COLUMN — Payment Schedules */}
                <Grid item xs={12} md={5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <ScheduleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>Payment Schedules</Typography>
                        <Button size="small" startIcon={<AddIcon />} onClick={openNew}
                            sx={{ fontWeight: 600, borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}>
                            New
                        </Button>
                    </Box>
                    <Box sx={{ borderRadius: 2.5, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6), overflow: 'hidden' }}>
                        {templates.length === 0 ? (
                            <Box sx={{ py: 5, textAlign: 'center' }}>
                                <PaymentsIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                                <Typography variant="body2" color="text.secondary" fontWeight={600}>No templates yet</Typography>
                                <Button onClick={openNew} size="small" startIcon={<AddIcon />}
                                    sx={{ mt: 1.5, textTransform: 'none', fontWeight: 600, borderRadius: 2, fontSize: '0.75rem' }}>
                                    Create template
                                </Button>
                            </Box>
                        ) : (
                            <Stack spacing={0} divider={<Divider />}>
                                {templates.map((t) => {
                                    const total = t.rules.reduce((s, r) => s + Number(r.amount_value), 0);
                                    return (
                                        <Box key={t.id}
                                            onClick={() => openEdit(t)}
                                            sx={{
                                                px: 2.5, py: 2, cursor: 'pointer',
                                                transition: 'background 0.15s',
                                                '&:hover': { bgcolor: 'action.hover' },
                                            }}>
                                            {/* Title row — prominent */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                                                <Typography variant="subtitle2" fontWeight={700} color="text.primary"
                                                    sx={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {t.name}
                                                </Typography>
                                                {t.is_default && (
                                                    <Chip label="Default" size="small" color="primary" variant="outlined"
                                                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                                                )}
                                                <Typography variant="caption" fontWeight={700} fontFamily="monospace"
                                                    color={total === 100 ? 'success.main' : 'warning.main'}>
                                                    {total}%
                                                </Typography>
                                                {!t.is_default && (
                                                    <Box sx={{ display: 'flex', gap: 0.25, ml: 0.5 }}>
                                                        <Tooltip title="Set as default">
                                                            <IconButton size="small"
                                                                onClick={e => { e.stopPropagation(); handleSetDefault(t); }}
                                                                sx={{ p: 0.4, color: 'text.disabled', '&:hover': { color: 'warning.main' } }}>
                                                                <StarBorderIcon sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete">
                                                            <IconButton size="small"
                                                                onClick={e => { e.stopPropagation(); handleDelete(t.id); }}
                                                                sx={{ p: 0.4, color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                                                <DeleteIcon sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                )}
                                            </Box>

                                            {/* Segmented bar — subtle */}
                                            <Box sx={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', bgcolor: 'action.hover', mb: 1 }}>
                                                {t.rules.map((r, i) => (
                                                    <Box key={i} sx={{
                                                        flex: Number(r.amount_value) || 1,
                                                        bgcolor: MILESTONE_COLORS[i % MILESTONE_COLORS.length],
                                                        opacity: 0.35,
                                                        mr: i < t.rules.length - 1 ? '2px' : 0,
                                                    }} />
                                                ))}
                                            </Box>

                                            {/* Milestone labels — subdued text, no colored percentages */}
                                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                                {t.rules.map((r, i) => (
                                                    <Typography key={i} variant="caption" color="text.secondary"
                                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, lineHeight: 1.4 }}>
                                                        <Box component="span" sx={{
                                                            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                                                            bgcolor: MILESTONE_COLORS[i % MILESTONE_COLORS.length], opacity: 0.5,
                                                        }} />
                                                        {Number(r.amount_value)}% {r.label}
                                                    </Typography>
                                                ))}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        )}
                    </Box>

                    {/* ─── Crew Payment Terms ─── */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 4 }}>
                        <GroupIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>Crew Payment Terms</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, mt: -1 }}>
                        Role-based payment terms included in crew availability emails.
                    </Typography>

                    {/* On-Site Roles */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                On-Site Roles
                            </Typography>
                            <Chip label="Videographer, Sound" size="small" variant="outlined"
                                sx={{ height: 18, fontSize: '0.6rem', color: 'text.disabled', borderColor: 'divider' }} />
                            <Box sx={{ flex: 1 }} />
                            <Button size="small" onClick={() => openNewCrew('on_site')}
                                sx={{ minWidth: 0, fontSize: '0.7rem', textTransform: 'none', fontWeight: 600, px: 1 }}>
                                + Add
                            </Button>
                        </Box>
                        <Box sx={{ borderRadius: 2.5, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6), overflow: 'hidden' }}>
                            {onSiteTemplates.length === 0 ? (
                                <Box sx={{ py: 3, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.disabled">No on-site terms yet</Typography>
                                </Box>
                            ) : (
                                <Stack spacing={0} divider={<Divider />}>
                                    {onSiteTemplates.map((t) => {
                                        const total = t.rules.reduce((s, r) => s + Number(r.amount_value), 0);
                                        return (
                                            <Box key={t.id} onClick={() => openEditCrew(t)}
                                                sx={{ px: 2.5, py: 2, cursor: 'pointer', transition: 'background 0.15s', '&:hover': { bgcolor: 'action.hover' } }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                                                    <Typography variant="subtitle2" fontWeight={700} color="text.primary"
                                                        sx={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {t.name}
                                                    </Typography>
                                                    {t.is_default && (
                                                        <Chip label="Default" size="small" color="primary" variant="outlined"
                                                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                                                    )}
                                                    <Typography variant="caption" fontWeight={700} fontFamily="monospace"
                                                        color={total === 100 ? 'success.main' : 'warning.main'}>
                                                        {total}%
                                                    </Typography>
                                                    {!t.is_default && (
                                                        <Box sx={{ display: 'flex', gap: 0.25, ml: 0.5 }}>
                                                            <Tooltip title="Set as default">
                                                                <IconButton size="small"
                                                                    onClick={e => { e.stopPropagation(); handleSetDefaultCrew(t); }}
                                                                    sx={{ p: 0.4, color: 'text.disabled', '&:hover': { color: 'warning.main' } }}>
                                                                    <StarBorderIcon sx={{ fontSize: 15 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Delete">
                                                                <IconButton size="small"
                                                                    onClick={e => { e.stopPropagation(); handleDeleteCrew(t.id); }}
                                                                    sx={{ p: 0.4, color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                                                    <DeleteIcon sx={{ fontSize: 15 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', bgcolor: 'action.hover', mb: 1 }}>
                                                    {t.rules.map((r, i) => (
                                                        <Box key={i} sx={{ flex: Number(r.amount_value) || 1, bgcolor: MILESTONE_COLORS[i % MILESTONE_COLORS.length], opacity: 0.35, mr: i < t.rules.length - 1 ? '2px' : 0 }} />
                                                    ))}
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                                    {t.rules.map((r, i) => (
                                                        <Typography key={i} variant="caption" color="text.secondary"
                                                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, lineHeight: 1.4 }}>
                                                            <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: MILESTONE_COLORS[i % MILESTONE_COLORS.length], opacity: 0.5 }} />
                                                            {Number(r.amount_value)}% {r.label}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Box>
                    </Box>

                    {/* Off-Site / Project Roles */}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Project Roles
                            </Typography>
                            <Chip label="Editor, Producer, Director" size="small" variant="outlined"
                                sx={{ height: 18, fontSize: '0.6rem', color: 'text.disabled', borderColor: 'divider' }} />
                            <Box sx={{ flex: 1 }} />
                            <Button size="small" onClick={() => openNewCrew('off_site')}
                                sx={{ minWidth: 0, fontSize: '0.7rem', textTransform: 'none', fontWeight: 600, px: 1 }}>
                                + Add
                            </Button>
                        </Box>
                        <Box sx={{ borderRadius: 2.5, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6), overflow: 'hidden' }}>
                            {offSiteTemplates.length === 0 ? (
                                <Box sx={{ py: 3, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.disabled">No project terms yet</Typography>
                                </Box>
                            ) : (
                                <Stack spacing={0} divider={<Divider />}>
                                    {offSiteTemplates.map((t) => {
                                        const total = t.rules.reduce((s, r) => s + Number(r.amount_value), 0);
                                        return (
                                            <Box key={t.id} onClick={() => openEditCrew(t)}
                                                sx={{ px: 2.5, py: 2, cursor: 'pointer', transition: 'background 0.15s', '&:hover': { bgcolor: 'action.hover' } }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                                                    <Typography variant="subtitle2" fontWeight={700} color="text.primary"
                                                        sx={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {t.name}
                                                    </Typography>
                                                    {t.is_default && (
                                                        <Chip label="Default" size="small" color="primary" variant="outlined"
                                                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                                                    )}
                                                    <Typography variant="caption" fontWeight={700} fontFamily="monospace"
                                                        color={total === 100 ? 'success.main' : 'warning.main'}>
                                                        {total}%
                                                    </Typography>
                                                    {!t.is_default && (
                                                        <Box sx={{ display: 'flex', gap: 0.25, ml: 0.5 }}>
                                                            <Tooltip title="Set as default">
                                                                <IconButton size="small"
                                                                    onClick={e => { e.stopPropagation(); handleSetDefaultCrew(t); }}
                                                                    sx={{ p: 0.4, color: 'text.disabled', '&:hover': { color: 'warning.main' } }}>
                                                                    <StarBorderIcon sx={{ fontSize: 15 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Delete">
                                                                <IconButton size="small"
                                                                    onClick={e => { e.stopPropagation(); handleDeleteCrew(t.id); }}
                                                                    sx={{ p: 0.4, color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                                                    <DeleteIcon sx={{ fontSize: 15 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', bgcolor: 'action.hover', mb: 1 }}>
                                                    {t.rules.map((r, i) => (
                                                        <Box key={i} sx={{ flex: Number(r.amount_value) || 1, bgcolor: MILESTONE_COLORS[i % MILESTONE_COLORS.length], opacity: 0.35, mr: i < t.rules.length - 1 ? '2px' : 0 }} />
                                                    ))}
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                                    {t.rules.map((r, i) => (
                                                        <Typography key={i} variant="caption" color="text.secondary"
                                                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, lineHeight: 1.4 }}>
                                                            <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: MILESTONE_COLORS[i % MILESTONE_COLORS.length], opacity: 0.5 }} />
                                                            {Number(r.amount_value)}% {r.label}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* ─── Create / Edit dialog ─── */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 2.5 } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ScheduleIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                        <Typography variant="h6" fontWeight={700}>{editing ? 'Edit Schedule' : 'New Schedule'}</Typography>
                    </Box>
                </DialogTitle>

                <DialogContent>
                    <Stack spacing={3} sx={{ pt: 1.5 }}>
                        {/* Name + Default row */}
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                            <TextField label="Schedule Name" fullWidth value={form.name}
                                onChange={e => { nameIsAuto.current = false; setForm(f => ({ ...f, name: e.target.value })); }}
                                placeholder="Auto-generated from milestones"
                                inputProps={{ autoComplete: 'off' }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <FormControlLabel
                                control={<Switch checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} />}
                                label={<Typography variant="body2" color="text.secondary" noWrap>Default</Typography>}
                                sx={{ flexShrink: 0, mt: 0.75 }}
                            />
                        </Box>

                        {/* Milestones */}
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight={700}>Milestones</Typography>
                                {pctTotal > 0 && (
                                    <Chip label={`${pctTotal}%`} size="small"
                                        color={pctTotal === 100 ? 'success' : pctTotal > 100 ? 'error' : 'warning'}
                                        variant="outlined"
                                        sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }} />
                                )}
                            </Box>

                            <Stack spacing={1.5}>
                                {form.rules.map((rule, i) => {
                                    const color = MILESTONE_COLORS[i % MILESTONE_COLORS.length];
                                    return (
                                        <Box key={i} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                                            {/* Color accent line */}
                                            <Box sx={{ height: 3, width: 32, borderRadius: 1.5, bgcolor: color, mb: 1.5, opacity: 0.5 }} />

                                            {/* Controls row */}
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                <TextField size="small" type="number" value={rule.amount_value}
                                                    onChange={e => updateRule(i, { amount_value: Number(e.target.value) })}
                                                    inputProps={{ min: 0, autoComplete: 'off' }}
                                                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                                    sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& input': { fontFamily: 'monospace', fontWeight: 700, textAlign: 'center', fontSize: '1rem' } }}
                                                />
                                                <FormControl size="small" sx={{ flex: 1 }}>
                                                    <Select value={rule.trigger_type}
                                                        onChange={e => updateRule(i, { trigger_type: e.target.value as PaymentTriggerType })}
                                                        sx={{ borderRadius: 2 }}>
                                                        <MenuItem value="AFTER_BOOKING">After booking</MenuItem>
                                                        <MenuItem value="BEFORE_EVENT">Before event</MenuItem>
                                                        <MenuItem value="AFTER_EVENT">After event</MenuItem>
                                                        <MenuItem value="ON_DATE">Fixed date</MenuItem>
                                                    </Select>
                                                </FormControl>
                                                {rule.trigger_type !== 'ON_DATE' ? (
                                                    <TextField size="small" type="number" value={rule.trigger_days ?? 0}
                                                        onChange={e => updateRule(i, { trigger_days: Number(e.target.value) })}
                                                        inputProps={{ min: 0, autoComplete: 'off' }}
                                                        InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }}
                                                        sx={{ width: 110, '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& input': { textAlign: 'center' } }}
                                                    />
                                                ) : <Box sx={{ width: 110 }} />}
                                                {form.rules.length > 1 ? (
                                                    <IconButton size="small" onClick={() => removeRule(i)}
                                                        sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                ) : <Box sx={{ width: 34 }} />}
                                            </Box>

                                            {/* Auto label */}
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                                                {rule.label}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Stack>

                            <Button onClick={addRule} size="small" startIcon={<AddIcon />}
                                sx={{ mt: 2, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                                Add milestone
                            </Button>
                        </Box>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving} disableElevation
                        sx={{ fontWeight: 600, borderRadius: 2, textTransform: 'none', px: 3 }}>
                        {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Crew Payment Template dialog ─── */}
            <Dialog open={crewDialogOpen} onClose={() => setCrewDialogOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 2.5 } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <GroupIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                        <Typography variant="h6" fontWeight={700}>
                            {crewEditing ? 'Edit Crew Terms' : crewDialogStep === 'preset' ? 'Choose Pay Structure' : 'Crew Payment Terms'}
                        </Typography>
                        <Chip label={crewForm.role_type === 'on_site' ? 'On-Site' : 'Project'} size="small" variant="outlined"
                            color={crewForm.role_type === 'on_site' ? 'info' : 'secondary'}
                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, ml: 'auto' }} />
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {/* ── STEP 1: Preset selection ── */}
                    {crewDialogStep === 'preset' && (
                        <Stack spacing={2.5} sx={{ pt: 1 }}>
                            {crewForm.role_type === 'on_site' ? (
                                <>
                                    <Typography variant="body2" color="text.secondary">
                                        Choose a pay structure for on-site crew, or start from scratch.
                                    </Typography>
                                    <Stack spacing={1}>
                                        {ON_SITE_PRESETS.map(p => (
                                            <Box key={p.key} onClick={() => applyCrewPreset(p)}
                                                sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', cursor: 'pointer', transition: 'all 0.15s',
                                                    '&:hover': { borderColor: 'primary.main', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) } }}>
                                                <Typography variant="subtitle2" fontWeight={700}>{p.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{p.description}</Typography>
                                                <Box sx={{ display: 'flex', height: 3, borderRadius: 1.5, overflow: 'hidden', mt: 1 }}>
                                                    {p.rules.map((r, i) => (
                                                        <Box key={i} sx={{ flex: Number(r.amount_value) || 1, bgcolor: MILESTONE_COLORS[i % MILESTONE_COLORS.length], opacity: 0.4, mr: i < p.rules.length - 1 ? '2px' : 0 }} />
                                                    ))}
                                                </Box>
                                            </Box>
                                        ))}
                                    </Stack>
                                    <Button size="small" onClick={() => { applyCrewPreset({ key: 'custom', name: 'Custom', description: '', rules: [{ ...EMPTY_CREW_RULE('on_site'), label: 'Booking Payment' }] }); }}
                                        sx={{ textTransform: 'none', fontWeight: 600, alignSelf: 'flex-start' }}>
                                        Start from scratch
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Typography variant="body2" color="text.secondary">
                                        Choose a payment mode for project roles.
                                    </Typography>
                                    <Stack spacing={1}>
                                        {/* Milestone-Based */}
                                        <Box onClick={() => { setCrewProjectMode('milestone'); setCrewDialogStep('editor'); crewNameIsAuto.current = true; setCrewForm(f => ({ ...f, name: 'Project — Milestone-Based', rules: [] })); }}
                                            sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', cursor: 'pointer', transition: 'all 0.15s',
                                                '&:hover': { borderColor: 'primary.main', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) } }}>
                                            <Typography variant="subtitle2" fontWeight={700}>Milestone-Based</Typography>
                                            <Typography variant="caption" color="text.secondary">Link payments to task completions from your task library</Typography>
                                        </Box>
                                        {/* Recurring */}
                                        <Box onClick={() => { setCrewProjectMode('recurring'); setCrewDialogStep('editor'); crewNameIsAuto.current = true; setCrewForm(f => ({ ...f, name: 'Project — Monthly', rules: [{ label: 'Monthly Payment', amount_type: 'PERCENT', amount_value: 100, trigger_type: 'RECURRING', trigger_days: 0, task_library_id: null, frequency: 'MONTHLY', order_index: 0 }] })); }}
                                            sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', cursor: 'pointer', transition: 'all 0.15s',
                                                '&:hover': { borderColor: 'primary.main', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) } }}>
                                            <Typography variant="subtitle2" fontWeight={700}>Recurring</Typography>
                                            <Typography variant="caption" color="text.secondary">Weekly, fortnightly, or monthly payments across the project</Typography>
                                        </Box>
                                        {/* Simple Split */}
                                        <Box sx={{ mt: 0.5 }}>
                                            <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, pl: 0.5, mb: 0.5, display: 'block' }}>
                                                Simple Splits
                                            </Typography>
                                            <Stack spacing={1}>
                                                {SIMPLE_SPLIT_PRESETS.map(p => (
                                                    <Box key={p.key} onClick={() => { setCrewProjectMode('simple'); applyCrewPreset(p); }}
                                                        sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', cursor: 'pointer', transition: 'all 0.15s',
                                                            '&:hover': { borderColor: 'primary.main', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) } }}>
                                                        <Typography variant="subtitle2" fontWeight={700}>{p.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{p.description}</Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </>
                            )}
                        </Stack>
                    )}

                    {/* ── STEP 2: Milestone editor ── */}
                    {crewDialogStep === 'editor' && (
                        <Stack spacing={3} sx={{ pt: 1.5 }}>
                            {/* Name + Default */}
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <TextField label="Template Name" size="small" fullWidth
                                    value={crewForm.name}
                                    inputProps={{ autoComplete: 'off' }}
                                    onChange={e => { crewNameIsAuto.current = false; setCrewForm(f => ({ ...f, name: e.target.value })); }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                                <FormControlLabel
                                    control={<Switch checked={crewForm.is_default} onChange={e => setCrewForm(f => ({ ...f, is_default: e.target.checked }))} />}
                                    label={<Typography variant="body2" color="text.secondary" noWrap>Default</Typography>}
                                    sx={{ flexShrink: 0, mt: 0.75 }}
                                />
                            </Box>

                            {/* Payment Terms (invoice terms) */}
                            <FormControl size="small" fullWidth>
                                <InputLabel>Invoice Terms</InputLabel>
                                <Select label="Invoice Terms" value={crewForm.payment_terms}
                                    onChange={e => setCrewForm(f => ({ ...f, payment_terms: e.target.value as CrewPaymentTerms }))}
                                    sx={{ borderRadius: 2 }}>
                                    {PAYMENT_TERMS_OPTIONS.map(o => (
                                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Recurring mode: frequency selector */}
                            {crewProjectMode === 'recurring' && (
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Payment Frequency</InputLabel>
                                    <Select label="Payment Frequency"
                                        value={crewForm.rules[0]?.frequency ?? 'MONTHLY'}
                                        onChange={e => {
                                            const freq = e.target.value as CrewPaymentFrequency;
                                            const label = freq === 'WEEKLY' ? 'Weekly Payment' : freq === 'FORTNIGHTLY' ? 'Fortnightly Payment' : 'Monthly Payment';
                                            const name = `Project — ${freq === 'WEEKLY' ? 'Weekly' : freq === 'FORTNIGHTLY' ? 'Fortnightly' : 'Monthly'}`;
                                            setCrewForm(f => ({
                                                ...f,
                                                name: crewNameIsAuto.current ? name : f.name,
                                                rules: [{ label, amount_type: 'PERCENT' as PaymentAmountType, amount_value: 100, trigger_type: 'RECURRING' as CrewPaymentTriggerType, trigger_days: 0, task_library_id: null, frequency: freq, order_index: 0 }],
                                            }));
                                        }}
                                        sx={{ borderRadius: 2 }}>
                                        <MenuItem value="WEEKLY">Weekly</MenuItem>
                                        <MenuItem value="FORTNIGHTLY">Fortnightly</MenuItem>
                                        <MenuItem value="MONTHLY">Monthly</MenuItem>
                                    </Select>
                                </FormControl>
                            )}

                            {/* Milestone-based mode: task picker milestones */}
                            {crewProjectMode === 'milestone' && (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="subtitle2" fontWeight={700}>Task Milestones</Typography>
                                        {crewPctTotal > 0 && (
                                            <Chip label={`${crewPctTotal}%`} size="small"
                                                color={crewPctTotal === 100 ? 'success' : crewPctTotal > 100 ? 'error' : 'warning'}
                                                variant="outlined"
                                                sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }} />
                                        )}
                                    </Box>
                                    <Stack spacing={1.5}>
                                        {crewForm.rules.map((rule, i) => {
                                            const color = MILESTONE_COLORS[i % MILESTONE_COLORS.length];
                                            const selectedTask = taskLibraryItems.find(t => t.id === rule.task_library_id);
                                            return (
                                                <Box key={i} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                                                    <Box sx={{ height: 3, width: 32, borderRadius: 1.5, bgcolor: color, mb: 1.5, opacity: 0.5 }} />
                                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                        <TextField size="small" type="number" value={rule.amount_value}
                                                            onChange={e => updateCrewRule(i, { amount_value: Number(e.target.value) })}
                                                            inputProps={{ min: 0, autoComplete: 'off' }}
                                                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                                            sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& input': { fontFamily: 'monospace', fontWeight: 700, textAlign: 'center', fontSize: '1rem' } }}
                                                        />
                                                        <FormControl size="small" sx={{ flex: 1 }}>
                                                            <InputLabel>Task</InputLabel>
                                                            <Select label="Task" value={rule.task_library_id ?? ''}
                                                                onChange={e => {
                                                                    const taskId = Number(e.target.value);
                                                                    const task = taskLibraryItems.find(t => t.id === taskId);
                                                                    updateCrewRule(i, { task_library_id: taskId || null, label: task ? `On: ${task.name}` : 'Task Milestone' });
                                                                }}
                                                                sx={{ borderRadius: 2 }}>
                                                                {taskLibraryItems.filter(t => !t.is_stage).map(t => (
                                                                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                        {crewForm.rules.length > 1 && (
                                                            <IconButton size="small" onClick={() => removeCrewRule(i)}
                                                                sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                    {selectedTask && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block', fontStyle: 'italic' }}>
                                                            {selectedTask.phase?.replace(/_/g, ' ')} — {selectedTask.name}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                    <Button onClick={() => {
                                        const newRule: CrewRuleForm = { label: 'Task Milestone', amount_type: 'PERCENT', amount_value: 0, trigger_type: 'ON_TASK_COMPLETE', trigger_days: 0, task_library_id: null, frequency: null, order_index: crewForm.rules.length };
                                        setCrewForm(f => ({ ...f, rules: [...f.rules, newRule] }));
                                    }} size="small" startIcon={<AddIcon />}
                                        sx={{ mt: 2, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                                        Add task milestone
                                    </Button>
                                </Box>
                            )}

                            {/* Standard milestones for on_site and simple mode */}
                            {crewProjectMode !== 'milestone' && crewProjectMode !== 'recurring' && (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="subtitle2" fontWeight={700}>Milestones</Typography>
                                        {crewPctTotal > 0 && (
                                            <Chip label={`${crewPctTotal}%`} size="small"
                                                color={crewPctTotal === 100 ? 'success' : crewPctTotal > 100 ? 'error' : 'warning'}
                                                variant="outlined"
                                                sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }} />
                                        )}
                                    </Box>
                                    <Stack spacing={1.5}>
                                        {crewForm.rules.map((rule, i) => {
                                            const color = MILESTONE_COLORS[i % MILESTONE_COLORS.length];
                                            const needsDays = ['AFTER_DELIVERY', 'BEFORE_EVENT', 'AFTER_EVENT', 'AFTER_ROUGH_CUT', 'NET_DAYS'].includes(rule.trigger_type);
                                            return (
                                                <Box key={i} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                                                    <Box sx={{ height: 3, width: 32, borderRadius: 1.5, bgcolor: color, mb: 1.5, opacity: 0.5 }} />
                                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                        <TextField size="small" type="number" value={rule.amount_value}
                                                            onChange={e => updateCrewRule(i, { amount_value: Number(e.target.value) })}
                                                            inputProps={{ min: 0, autoComplete: 'off' }}
                                                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                                            sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& input': { fontFamily: 'monospace', fontWeight: 700, textAlign: 'center', fontSize: '1rem' } }}
                                                        />
                                                        <FormControl size="small" sx={{ flex: 1 }}>
                                                            <Select value={rule.trigger_type}
                                                                onChange={e => updateCrewRule(i, { trigger_type: e.target.value as CrewPaymentTriggerType })}
                                                                sx={{ borderRadius: 2 }}>
                                                                <ListSubheader sx={{ fontSize: '0.7rem', fontWeight: 700, lineHeight: '28px', color: 'text.disabled', textTransform: 'uppercase' }}>Booking & Production</ListSubheader>
                                                                <MenuItem value="ON_BOOKING">On booking</MenuItem>
                                                                <MenuItem value="ON_SHOOT_DAY">On shoot day</MenuItem>
                                                                <MenuItem value="ON_FIRST_EDIT">First edit begins</MenuItem>
                                                                <ListSubheader sx={{ fontSize: '0.7rem', fontWeight: 700, lineHeight: '28px', color: 'text.disabled', textTransform: 'uppercase' }}>Completion & Delivery</ListSubheader>
                                                                <MenuItem value="ON_COMPLETION">On completion</MenuItem>
                                                                <MenuItem value="AFTER_ROUGH_CUT">After rough cut</MenuItem>
                                                                <MenuItem value="AFTER_DELIVERY">After final delivery</MenuItem>
                                                                <ListSubheader sx={{ fontSize: '0.7rem', fontWeight: 700, lineHeight: '28px', color: 'text.disabled', textTransform: 'uppercase' }}>Relative to Event</ListSubheader>
                                                                <MenuItem value="BEFORE_EVENT">Before event</MenuItem>
                                                                <MenuItem value="AFTER_EVENT">After event</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                        {needsDays ? (
                                                            <TextField size="small" type="number" value={rule.trigger_days ?? 0}
                                                                onChange={e => updateCrewRule(i, { trigger_days: Number(e.target.value) })}
                                                                inputProps={{ min: 0, autoComplete: 'off' }}
                                                                InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }}
                                                                sx={{ width: 110, '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& input': { textAlign: 'center' } }}
                                                            />
                                                        ) : <Box sx={{ width: 110 }} />}
                                                        {crewForm.rules.length > 1 ? (
                                                            <IconButton size="small" onClick={() => removeCrewRule(i)}
                                                                sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        ) : <Box sx={{ width: 34 }} />}
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                                                        {rule.label}
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                    <Button onClick={addCrewRule} size="small" startIcon={<AddIcon />}
                                        sx={{ mt: 2, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                                        Add milestone
                                    </Button>
                                </Box>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    {crewDialogStep === 'editor' && !crewEditing && (
                        <Button onClick={() => { setCrewDialogStep('preset'); setCrewProjectMode(null); }} sx={{ textTransform: 'none', mr: 'auto' }}>
                            ← Back
                        </Button>
                    )}
                    <Button onClick={() => setCrewDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    {crewDialogStep === 'editor' && (
                        <Button variant="contained" onClick={handleSaveCrew}
                            disabled={crewSaving || (crewProjectMode !== 'recurring' && crewPctTotal !== 100)}
                            disableElevation
                            sx={{ fontWeight: 600, borderRadius: 2, textTransform: 'none', px: 3 }}>
                            {crewSaving ? 'Saving…' : crewEditing ? 'Save Changes' : 'Create'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack('')}
                message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
        </>
    );
}

// ---------------------------------------------------------------------------
// Meetings Settings
// ---------------------------------------------------------------------------

function MeetingsSettings() {
    const { currentBrand } = useBrand();
    const [saving, setSaving] = useState(false);
    const [snack, setSnack] = useState('');
    const [settings, setSettings] = useState({
        duration_minutes: 20,
        description: '',
        available_days: [1, 2, 3, 4, 5] as number[],
        available_from: '09:00',
        available_to: '17:00',
        google_meet_link: '',
    });
    const [loaded, setLoaded] = useState(false);

    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    useEffect(() => {
        if (!currentBrand?.id || loaded) return;
        api.brands.getMeetingSettings(currentBrand.id)
            .then((s) => { setSettings({ ...settings, ...s }); setLoaded(true); })
            .catch(() => setLoaded(true));
    }, [currentBrand?.id]);

    const toggleDay = (day: number) => {
        setSettings(prev => ({
            ...prev,
            available_days: prev.available_days.includes(day)
                ? prev.available_days.filter(d => d !== day)
                : [...prev.available_days, day].sort(),
        }));
    };

    const handleSave = async () => {
        if (!currentBrand?.id) return;
        setSaving(true);
        try {
            await api.brands.saveMeetingSettings(currentBrand.id, settings);
            setSnack('Meeting settings saved');
        } catch {
            setSnack('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <SectionHeader
                title="Meetings"
                description="Configure default settings for discovery calls and other meetings."
            />

            <Stack spacing={3}>
                {/* Discovery Call Settings */}
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                            <ScheduleIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                            <Typography variant="subtitle1" fontWeight={600}>Discovery Call Defaults</Typography>
                        </Box>

                        <Stack spacing={2.5}>
                            {/* Duration */}
                            <TextField
                                label="Default Duration (minutes)"
                                type="number"
                                value={settings.duration_minutes}
                                onChange={e => setSettings(prev => ({ ...prev, duration_minutes: Math.max(5, parseInt(e.target.value) || 20) }))}
                                inputProps={{ min: 5, max: 120, step: 5 }}
                                size="small"
                                sx={{ maxWidth: 240 }}
                                helperText="Used when scheduling a new discovery call"
                            />

                            {/* Google Meet Link */}
                            <TextField
                                label="Google Meet Link"
                                value={settings.google_meet_link}
                                onChange={e => setSettings(prev => ({ ...prev, google_meet_link: e.target.value }))}
                                placeholder="https://meet.google.com/abc-defg-hij"
                                size="small"
                                fullWidth
                                helperText="Pre-populated as the meeting URL when scheduling"
                            />

                            {/* Default Description */}
                            <TextField
                                label="Default Description"
                                multiline
                                minRows={3}
                                value={settings.description}
                                onChange={e => setSettings(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Hi {name}, looking forward to chatting about your big day! Here's the link to join…"
                                fullWidth
                                helperText="Pre-populated in the description field when scheduling a call"
                            />
                        </Stack>
                    </CardContent>
                </Card>

                {/* Availability */}
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                            <CalendarIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                            <Typography variant="subtitle1" fontWeight={600}>Availability</Typography>
                        </Box>

                        <Stack spacing={2.5}>
                            {/* Available Days */}
                            <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                    Available Days
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {DAY_LABELS.map((label, idx) => (
                                        <Chip
                                            key={idx}
                                            label={label}
                                            onClick={() => toggleDay(idx)}
                                            color={settings.available_days.includes(idx) ? 'primary' : 'default'}
                                            variant={settings.available_days.includes(idx) ? 'filled' : 'outlined'}
                                            sx={{ fontWeight: 600, minWidth: 56 }}
                                        />
                                    ))}
                                </Stack>
                            </Box>

                            {/* Time Window */}
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Available From"
                                        type="time"
                                        value={settings.available_from}
                                        onChange={e => setSettings(prev => ({ ...prev, available_from: e.target.value }))}
                                        size="small"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Available Until"
                                        type="time"
                                        value={settings.available_to}
                                        onChange={e => setSettings(prev => ({ ...prev, available_to: e.target.value }))}
                                        size="small"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                            </Grid>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Save */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving…' : 'Save Meeting Settings'}
                    </Button>
                </Box>
            </Stack>

            <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack('')}
                message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
        </>
    );
}

// ---------------------------------------------------------------------------
// Settings sections registry
// ---------------------------------------------------------------------------

const settingsSections: SettingsSection[] = [
    { label: "Profile", icon: <ProfileIcon />, component: <ProfileSettings /> },
    { label: "Brand", icon: <CompanyIcon />, component: <CompanySettings /> },
    { label: "Payment Details", icon: <PaymentsIcon />, component: <PaymentScheduleSettings /> },
    { label: "Meetings", icon: <ScheduleIcon />, component: <MeetingsSettings /> },
    { label: "Roles", icon: <RolesIcon />, component: <RolesSettings /> },
    { label: "Users", icon: <UsersIcon />, component: <UsersSettings /> },
    {
        label: "Notifications",
        icon: <NotificationsIcon />,
        component: <NotificationSettings />,
        placeholder: true,
    },
    {
        label: "Appearance",
        icon: <AppearanceIcon />,
        component: <AppearanceSettings />,
        placeholder: true,
    },
    {
        label: "Integrations",
        icon: <IntegrationsIcon />,
        component: <IntegrationSettings />,
        placeholder: true,
    },
    {
        label: "Security",
        icon: <SecurityIcon />,
        component: <SecuritySettings />,
        placeholder: true,
    },
    {
        label: "Billing & Plans",
        icon: <BillingIcon />,
        component: <BillingSettings />,
        placeholder: true,
    },
    {
        label: "Workflow",
        icon: <WorkflowIcon />,
        component: <WorkflowSettings />,
        placeholder: true,
    },
    {
        label: "Social Links",
        icon: <ShareIcon />,
        component: <SocialLinksSettings />,
    },
    {
        label: "Client Portal",
        icon: <PortalIcon />,
        component: <ClientPortalSettings />,
    },
    {
        label: "Contracts",
        icon: <ContractsIcon />,
        component: <ContractSettings />,
    },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <Box>
            {/* Page heading */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" fontWeight={700}>
                    Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Manage your account, workspace, and application preferences.
                </Typography>
            </Box>

            {/* Two-column layout: vertical tabs + content */}
            <Box
                sx={{
                    display: "flex",
                    gap: 3,
                    minHeight: "calc(100vh - 220px)",
                }}
            >
                {/* Left — vertical tab navigation */}
                <Paper
                    variant="outlined"
                    sx={{
                        width: 220,
                        flexShrink: 0,
                        borderRadius: 2,
                        overflow: "hidden",
                    }}
                >
                    <Tabs
                        orientation="vertical"
                        variant="scrollable"
                        value={activeTab}
                        onChange={(_, newValue) => setActiveTab(newValue)}
                        sx={{
                            "& .MuiTab-root": {
                                justifyContent: "flex-start",
                                textTransform: "none",
                                fontWeight: 500,
                                fontSize: "0.875rem",
                                minHeight: 48,
                                px: 2,
                            },
                            "& .Mui-selected": {
                                fontWeight: 600,
                            },
                        }}
                    >
                        {settingsSections.map((section, idx) => (
                            <Tab
                                key={section.label}
                                icon={section.icon}
                                iconPosition="start"
                                label={
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        {section.label}
                                        {section.placeholder && (
                                            <Chip
                                                label="Soon"
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    height: 20,
                                                    fontSize: "0.65rem",
                                                    opacity: 0.6,
                                                }}
                                            />
                                        )}
                                    </Box>
                                }
                                id={`settings-tab-${idx}`}
                                aria-controls={`settings-tabpanel-${idx}`}
                                sx={{ gap: 1.5 }}
                            />
                        ))}
                    </Tabs>
                </Paper>

                {/* Right — active section content */}
                <Paper
                    variant="outlined"
                    sx={{
                        flexGrow: 1,
                        borderRadius: 2,
                        minWidth: 0,
                        overflow: "auto",
                    }}
                >
                    {settingsSections.map((section, idx) => (
                        <TabPanel key={section.label} value={activeTab} index={idx}>
                            {section.component}
                        </TabPanel>
                    ))}
                </Paper>
            </Box>
        </Box>
    );
}
