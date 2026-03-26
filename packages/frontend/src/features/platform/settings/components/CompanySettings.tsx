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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Snackbar,
    IconButton,
    Tooltip,
    Collapse,
    ListSubheader,
    FormHelperText,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Business as CompanyIcon,
    Tune as WorkflowIcon,
    Save as SaveIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    AutoAwesome as AutoAwesomeIcon,
    Email as EmailIcon,
    LocationOn as LocationIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import { useBrand } from "@/features/platform/brand";
import { Brand } from "@/lib/types/brand";

// ---------------------------------------------------------------------------
// Brand constants
// ---------------------------------------------------------------------------

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
    'United Kingdom': 'GB', 'United States': 'US', 'United States of America': 'US',
    'Canada': 'CA', 'Australia': 'AU', 'Ireland': 'IE', 'New Zealand': 'NZ',
    'France': 'FR', 'Germany': 'DE', 'Spain': 'ES', 'Italy': 'IT',
    'Netherlands': 'NL', 'Portugal': 'PT', 'South Africa': 'ZA',
};
const normaliseCountryCode = (value: string | undefined | null): string => {
    if (!value) return 'GB';
    return COUNTRY_NAME_TO_CODE[value] ?? value;
};

const BUSINESS_STRUCTURES: Record<string, string[]> = {
    GB: ['Sole Trader', 'Limited Company (Ltd)', 'Limited Liability Partnership (LLP)', 'Partnership', 'Community Interest Company (CIC)', 'Charity'],
    US: ['Sole Proprietorship', 'LLC', 'S-Corp', 'C-Corp', 'Partnership', 'Non-Profit (501c3)'],
    CA: ['Sole Proprietorship', 'Corporation', 'Partnership', 'Co-operative', 'Non-Profit'],
    AU: ['Sole Trader', 'Pty Ltd', 'Partnership', 'Trust', 'Non-Profit'],
    NZ: ['Sole Trader', 'Limited Company (Ltd)', 'Partnership', 'Trust', 'Charitable Trust'],
    IE: ['Sole Trader', 'Limited Company (Ltd)', 'Partnership', 'Designated Activity Company (DAC)', 'Charity'],
    DE: ['Einzelunternehmen', 'GmbH', 'UG (haftungsbeschränkt)', 'GbR', 'OHG', 'KG', 'e.V.'],
    FR: ['Auto-entrepreneur', 'SARL', 'SAS', 'EURL', 'SA', 'Association'],
    _default: ['Sole Trader / Proprietor', 'Limited Company / LLC', 'Partnership', 'Corporation', 'Non-Profit / Charity', 'Other'],
};
const getBusinessStructures = (country: string): string[] =>
    BUSINESS_STRUCTURES[country] ?? BUSINESS_STRUCTURES._default;
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
// CompanySettings
// ---------------------------------------------------------------------------

export default function CompanySettings() {
    const { currentBrand, refreshBrands } = useBrand();

    const [brand, setBrand] = useState<Brand | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [validationErrors, setValidationErrors] = useState<BrandValidationErrors>({});

    // ---- Services Offered state ---------------------------------------------
    const [serviceTypes, setServiceTypes] = useState<string[]>([]);
    const [confirmingServiceType, setConfirmingServiceType] = useState<{ key: string; label: string; icon: string } | null>(null);
    const [provisioningType, setProvisioningType] = useState<string | null>(null);

    const SERVICE_TYPE_OPTIONS = [
        { key: 'WEDDING',    label: 'Weddings',    icon: '💒', color: '#ec4899', description: 'Full wedding day coverage — ceremony, reception, portraits and more.' },
        { key: 'BIRTHDAY',   label: 'Birthdays',   icon: '🎂', color: '#f59e0b', description: 'Birthday celebrations — cake, speeches, dancing and party coverage.' },
        { key: 'ENGAGEMENT', label: 'Engagements', icon: '💍', color: '#8b5cf6', description: 'Engagement shoots and parties — portraits, golden hour, and celebrations.' },
    ];

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

    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);

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
            country: normaliseCountryCode(b.country),
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
        setServiceTypes(b.service_types ?? []);
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

    const handleConfirmEnableServiceType = async () => {
        if (!brand || !confirmingServiceType) return;
        const key = confirmingServiceType.key;
        setConfirmingServiceType(null);
        setProvisioningType(key);
        try {
            const newTypes = [...serviceTypes, key];
            const updated = await api.brands.update(brand.id, { service_types: newTypes } as any);
            setBrand(updated);
            setServiceTypes(updated.service_types ?? newTypes);
            await refreshBrands();
            setSnackbar({ open: true, message: `${confirmingServiceType?.label ?? key} service enabled and templates created.`, severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Failed to enable service type. Please try again.', severity: 'error' });
        } finally {
            setProvisioningType(null);
        }
    };

    const loadAllBrands = useCallback(async () => {
        try {
            setLoadingBrands(true);
            const brands = await api.brands.getAll();
            setAllBrands(brands);
        } catch {
            // silent
        } finally {
            setLoadingBrands(false);
        }
    }, []);

    useEffect(() => { loadAllBrands(); }, [loadAllBrands]);

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

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
    }

    if (loadError || !brand) {
        return <Alert severity="error" sx={{ mb: 2 }}>{loadError || 'No active brand selected.'}</Alert>;
    }

    const businessStructureOptions = getBusinessStructures(formData.country);
    const allBusinessStructureOptions = formData.business_type && !businessStructureOptions.includes(formData.business_type)
        ? [formData.business_type, ...businessStructureOptions]
        : businessStructureOptions;

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
                        width: 60, height: 60,
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                        color: "primary.main", fontSize: "1.3rem", fontWeight: 700,
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
                        <Chip label={formData.business_type || "Business"} size="small" sx={{ fontWeight: 600, height: 22, fontSize: "0.7rem", bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12), color: "primary.main" }} />
                        <Chip label={formData.is_active ? "Active" : "Inactive"} variant="outlined" size="small" color={formData.is_active ? "success" : "default"} sx={{ fontWeight: 500, height: 22, fontSize: "0.7rem" }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {formData.email || "No email provided"} · {formData.currency} · {formData.timezone}
                    </Typography>
                </Box>

                <Collapse in={hasChanges} orientation="horizontal">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                        <Chip label="Unsaved" size="small" color="warning" sx={{ fontWeight: 600, height: 24, fontSize: "0.7rem" }} />
                        <Button variant="text" onClick={handleDiscard} disabled={saving} size="small" sx={{ minWidth: 0 }}>Discard</Button>
                        <Button variant="contained" startIcon={saving ? <CircularProgress size={14} /> : <SaveIcon />} onClick={handleSave} disabled={saving} size="small" disableElevation sx={{ fontWeight: 600, borderRadius: 2 }}>
                            {saving ? "Saving…" : "Save"}
                        </Button>
                    </Box>
                </Collapse>

                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenCreateDialog} size="small" sx={{ fontWeight: 600, borderRadius: 2, flexShrink: 0 }}>
                    New Brand
                </Button>
            </Box>

            {/* ─── Two-column layout ─── */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    {/* Basic Information */}
                    <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <CompanyIcon sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography variant="subtitle2" fontWeight={700}>Basic Information</Typography>
                        </Box>
                        <Box sx={{ p: 2.5, borderRadius: 2.5, border: 1, borderColor: "divider", bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={6}><TextField label="Brand Name" value={formData.name} onChange={(e) => handleFormChange("name", e.target.value)} fullWidth required size="small" error={!!validationErrors.name} helperText={validationErrors.name || "Internal name"} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} /></Grid>
                                <Grid item xs={12} sm={6}><TextField label="Display Name" value={formData.display_name} onChange={(e) => handleFormChange("display_name", e.target.value)} fullWidth size="small" helperText="Public facing name" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} /></Grid>
                                <Grid item xs={12}><TextField label="Description" value={formData.description} onChange={(e) => handleFormChange("description", e.target.value)} fullWidth multiline rows={3} size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} /></Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Business Structure</InputLabel>
                                        <Select value={formData.business_type} onChange={(e) => handleFormChange("business_type", e.target.value)} label="Business Structure" sx={{ borderRadius: 2 }}>
                                            {allBusinessStructureOptions.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                        </Select>
                                        <FormHelperText>Legal entity type — options based on your country</FormHelperText>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    {/* Services Offered */}
                    <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <AutoAwesomeIcon sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography variant="subtitle2" fontWeight={700}>Services Offered</Typography>
                        </Box>
                        <Box sx={{ p: 2.5, borderRadius: 2.5, border: 1, borderColor: "divider", bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Enable a service to auto-create its event templates, activities, subjects and a default package set.
                            </Typography>
                            <Stack spacing={1.5}>
                                {SERVICE_TYPE_OPTIONS.map((opt) => {
                                    const enabled = serviceTypes.includes(opt.key);
                                    const isLoading = provisioningType === opt.key;
                                    return (
                                        <Box key={opt.key} sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, borderRadius: 2, border: 1, borderColor: enabled ? opt.color : "divider", bgcolor: enabled ? (theme) => alpha(opt.color, 0.06) : "transparent", transition: "all 0.2s ease" }}>
                                            <Typography sx={{ fontSize: "1.5rem", lineHeight: 1, flexShrink: 0 }}>{opt.icon}</Typography>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="body2" fontWeight={700}>{opt.label}</Typography>
                                                <Typography variant="caption" color="text.secondary">{opt.description}</Typography>
                                            </Box>
                                            {enabled ? (
                                                <Chip label="Enabled" size="small" sx={{ height: 24, fontWeight: 700, fontSize: "0.7rem", bgcolor: alpha(opt.color, 0.12), color: opt.color, border: "none", flexShrink: 0 }} />
                                            ) : (
                                                <Button size="small" variant="outlined" disabled={isLoading} onClick={() => setConfirmingServiceType(opt)} startIcon={isLoading ? <CircularProgress size={12} /> : <AddIcon />} sx={{ borderRadius: 2, fontWeight: 600, minWidth: 90, flexShrink: 0 }}>
                                                    {isLoading ? "Enabling…" : "Enable"}
                                                </Button>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    </Box>

                    {/* Contact Information */}
                    <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <EmailIcon sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography variant="subtitle2" fontWeight={700}>Contact Information</Typography>
                        </Box>
                        <Box sx={{ p: 2.5, borderRadius: 2.5, border: 1, borderColor: "divider", bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={6}><TextField label="Email" type="email" value={formData.email} onChange={(e) => handleFormChange("email", e.target.value)} fullWidth size="small" error={!!validationErrors.email} helperText={validationErrors.email} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} /></Grid>
                                <Grid item xs={12} sm={6}><TextField label="Phone" value={formData.phone} onChange={(e) => handleFormChange("phone", e.target.value)} fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} /></Grid>
                                <Grid item xs={12} sm={6}><TextField label="Website" value={formData.website} onChange={(e) => handleFormChange("website", e.target.value)} fullWidth size="small" error={!!validationErrors.website} helperText={validationErrors.website || "Include https://"} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} /></Grid>
                            </Grid>
                        </Box>
                    </Box>

                    {/* Address */}
                    <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <LocationIcon sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography variant="subtitle2" fontWeight={700}>Address</Typography>
                        </Box>
                        <Box sx={{ p: 2.5, borderRadius: 2.5, border: 1, borderColor: "divider", bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
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

                {/* RIGHT COLUMN */}
                <Grid item xs={12} md={4}>
                    {/* Business Settings */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <WorkflowIcon sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography variant="subtitle2" fontWeight={700}>Business Settings</Typography>
                        </Box>
                        <Box sx={{ p: 2.5, borderRadius: 2.5, border: 1, borderColor: "divider", bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
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
                            <Typography variant="subtitle2" fontWeight={700}>Your Brands</Typography>
                            <Chip label={allBrands.length} size="small" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600, ml: "auto" }} />
                        </Box>
                        <Box sx={{ borderRadius: 2.5, border: 1, borderColor: "divider", bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6), overflow: "hidden" }}>
                            {loadingBrands ? (
                                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress size={24} /></Box>
                            ) : allBrands.length === 0 ? (
                                <Box sx={{ p: 3, textAlign: "center" }}><Typography variant="body2" color="text.secondary">No brands yet</Typography></Box>
                            ) : (
                                <Stack divider={<Divider />}>
                                    {allBrands.map((b) => (
                                        <Box key={b.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5, bgcolor: b.id === brand.id ? (theme: { palette: { primary: { main: string } } }) => alpha(theme.palette.primary.main, 0.04) : "transparent" }}>
                                            <Avatar sx={{ width: 32, height: 32, fontSize: "0.75rem", fontWeight: 700, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12), color: "primary.main" }}>
                                                {(b.display_name || b.name).substring(0, 2).toUpperCase()}
                                            </Avatar>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="body2" fontWeight={600} noWrap>
                                                    {b.display_name || b.name}
                                                    {b.id === brand.id && <Chip label="Current" size="small" color="primary" variant="outlined" sx={{ ml: 1, height: 18, fontSize: "0.6rem", fontWeight: 600 }} />}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" noWrap>{b.business_type || "Business"} · {b.currency || "USD"}</Typography>
                                            </Box>
                                            <Chip label={b.is_active ? "Active" : "Inactive"} size="small" color={b.is_active ? "success" : "default"} variant="outlined" sx={{ height: 20, fontSize: "0.6rem" }} />
                                            {b.id !== brand.id && (
                                                <Tooltip title="Delete brand">
                                                    <IconButton size="small" onClick={() => { if (window.confirm(`Delete "${b.display_name || b.name}"? This cannot be undone.`)) handleDeleteBrand(b.id); }} sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}>
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
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert onClose={() => setSnackbar((p) => ({ ...p, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: "100%", borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Enable Service Type Confirmation Dialog */}
            <Dialog open={!!confirmingServiceType} onClose={() => setConfirmingServiceType(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Typography sx={{ fontSize: "1.8rem", lineHeight: 1 }}>{confirmingServiceType?.icon}</Typography>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700}>Enable {confirmingServiceType?.label}?</Typography>
                            <Typography variant="caption" color="text.secondary">This will create templates, activities, and subjects for this service type.</Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>The following will be automatically created for your brand:</Typography>
                    <Stack spacing={1}>
                        {[
                            { icon: '📅', label: 'Event days (e.g. Ceremony Day, Getting Ready)' },
                            { icon: '🎬', label: 'Activities with key moment markers' },
                            { icon: '👥', label: 'Subject types with standard roles' },
                            { icon: '📦', label: 'Package category and default package set' },
                        ].map((item) => (
                            <Box key={item.label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <Typography sx={{ fontSize: '1rem', mt: 0.1 }}>{item.icon}</Typography>
                                <Typography variant="body2">{item.label}</Typography>
                            </Box>
                        ))}
                    </Stack>
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>Enabling a service doesn&apos;t affect existing data. You can customise everything after it&apos;s created.</Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setConfirmingServiceType(null)} sx={{ borderRadius: 2 }}>Cancel</Button>
                    <Button variant="contained" onClick={handleConfirmEnableServiceType} disableElevation startIcon={provisioningType ? <CircularProgress size={14} /> : <AutoAwesomeIcon />} disabled={!!provisioningType} sx={{ fontWeight: 600, borderRadius: 2 }}>
                        {provisioningType ? 'Enabling…' : `Enable ${confirmingServiceType?.label ?? ''}`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Brand Dialog */}
            <Dialog open={createDialogOpen} onClose={() => !creating && setCreateDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Create New Brand</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField label="Brand Name" value={newBrandData.name} onChange={(e) => handleNewBrandChange("name", e.target.value)} fullWidth required size="small" error={!!newBrandErrors.name} helperText={newBrandErrors.name || "Internal identifier"} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                        <TextField label="Display Name" value={newBrandData.display_name} onChange={(e) => handleNewBrandChange("display_name", e.target.value)} fullWidth size="small" helperText="Public facing name (optional)" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                        <FormControl fullWidth size="small">
                            <InputLabel>Business Structure</InputLabel>
                            <Select value={newBrandData.business_type} onChange={(e) => handleNewBrandChange("business_type", e.target.value)} label="Business Structure" sx={{ borderRadius: 2 }}>
                                {getBusinessStructures(newBrandData.country || 'GB').map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </Select>
                            <FormHelperText>Options based on selected country</FormHelperText>
                        </FormControl>
                        <TextField label="Email" type="email" value={newBrandData.email} onChange={(e) => handleNewBrandChange("email", e.target.value)} fullWidth size="small" error={!!newBrandErrors.email} helperText={newBrandErrors.email} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}><TextField label="Country" value={newBrandData.country} onChange={(e) => handleNewBrandChange("country", e.target.value)} fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} /></Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Timezone</InputLabel>
                                    <Select value={newBrandData.timezone} onChange={(e) => handleNewBrandChange("timezone", e.target.value)} label="Timezone" sx={{ borderRadius: 2 }}>
                                        {TIMEZONES.map((tz) => <MenuItem key={tz} value={tz}>{tz}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Currency</InputLabel>
                                    <Select value={newBrandData.currency} onChange={(e) => handleNewBrandChange("currency", e.target.value)} label="Currency" sx={{ borderRadius: 2 }}>
                                        {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setCreateDialogOpen(false)} disabled={creating}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateBrand} disabled={creating} disableElevation startIcon={creating ? <CircularProgress size={14} /> : <AddIcon />} sx={{ fontWeight: 600, borderRadius: 2 }}>
                        {creating ? "Creating…" : "Create Brand"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
