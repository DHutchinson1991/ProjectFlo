"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar,
    CircularProgress,
    Grid,
    Switch,
    FormControlLabel,
    Avatar,
    IconButton,
    Stack,
    Chip,
    Tabs,
    Tab,
    Breadcrumbs,
    Link,
    Fade,
    Paper,
    keyframes,
} from "@mui/material";
import {
    ArrowBack as BackIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Business as BrandIcon,
    CheckCircle as ActiveIcon,
    Email as EmailIcon,
    LocationOn as LocationIcon,
    AccountBalance as CurrencyIcon,
    Settings as SettingsIcon,
    Palette as DesignIcon,
    Info as InfoIcon,
    Public as PublicIcon,
    Work as WorkIcon,
    CloudUpload as UploadIcon,
    Warning as WarningIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import { Brand } from "@/lib/types/brand";
import { useBrand } from "@/app/providers/BrandProvider";
import { useTheme } from "@/app/theme/ThemeProvider";

// Animation keyframes for visual feedback
const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Define interfaces for type safety
interface ValidationErrors {
    [key: string]: string;
}

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
    is_active: boolean;
}

// Constants for select fields
const BUSINESS_TYPES = [
    'Production House', 'Agency', 'Freelancer', 'Corporate', 'Non-Profit', 'Other'
];
const TIMEZONES = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo',
    'Asia/Shanghai', 'Australia/Sydney', 'UTC'
];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'INR'];

// Helper component for Tabs
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
            id={`brand-tabpanel-${index}`}
            aria-labelledby={`brand-tab-${index}`}
            {...other}
        >
            {value === index && <Box>{children}</Box>}
        </div>
    );
}

// Helper functions for displaying brand data
function getBrandInitials(brand: Brand | null): string {
    if (!brand) return 'B';
    const displayName = brand.display_name || brand.name;
    return displayName.substring(0, 2).toUpperCase();
}

function getBrandDisplayName(brand: Brand | null): string {
    if (!brand) return 'New Brand';
    return brand.display_name || brand.name;
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}

// Main component
export default function BrandEditPage() {
    // Hooks
    const router = useRouter();
    const params = useParams();
    const { refreshBrands } = useBrand();
    const { mode } = useTheme();
    const brandId = params.id as string;
    const isNewBrand = brandId === 'new';
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    // State
    const [brand, setBrand] = useState<Brand | null>(null);
    const [loading, setLoading] = useState(!isNewBrand);
    const [saving, setSaving] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(isNewBrand);
    const [error, setError] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [logoUploading, setLogoUploading] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });

    // Form state
    const [formData, setFormData] = useState<EditBrandData>({
        name: '', display_name: '', description: '', business_type: '',
        website: '', email: '', phone: '', address_line1: '',
        address_line2: '', city: '', state: '', country: 'US',
        postal_code: '', timezone: 'America/New_York', currency: 'USD',
        logo_url: '', is_active: true
    });

    // Effect to load brand data on component mount
    useEffect(() => {
        if (isNewBrand) {
            setLoading(false);
            return;
        }

        const loadBrand = async () => {
            try {
                setLoading(true);
                const brandData = await api.brands.getById(parseInt(brandId));
                setBrand(brandData);
                setFormData({
                    name: brandData.name,
                    display_name: brandData.display_name || '',
                    description: brandData.description || '',
                    business_type: brandData.business_type || '',
                    website: brandData.website || '',
                    email: brandData.email || '',
                    phone: brandData.phone || '',
                    address_line1: brandData.address_line1 || '',
                    address_line2: brandData.address_line2 || '',
                    city: brandData.city || '',
                    state: brandData.state || '',
                    country: brandData.country || 'US',
                    postal_code: brandData.postal_code || '',
                    timezone: brandData.timezone || 'America/New_York',
                    currency: brandData.currency || 'USD',
                    logo_url: brandData.logo_url || '',
                    is_active: brandData.is_active
                });
            } catch (err) {
                setError('Failed to load brand');
                console.error('Error loading brand:', err);
            } finally {
                setLoading(false);
            }
        };

        loadBrand();
    }, [brandId, isNewBrand]);

    // Handler for tab changes
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Auto-save functionality
    const handleAutoSave = useCallback(async (data: EditBrandData) => {
        if (isNewBrand || !isEditing) return;
        try {
            setAutoSaving(true);
            await api.brands.update(parseInt(brandId), data);
            setHasUnsavedChanges(false);
            setSnackbar({ open: true, message: 'Changes saved automatically', severity: 'info' });
        } catch (error) {
            console.error('Auto-save failed:', error);
        } finally {
            setAutoSaving(false);
        }
    }, [brandId, isNewBrand, isEditing]);

    // Form change handler with validation and auto-save trigger
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFormChange = useCallback((field: keyof EditBrandData, value: any) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            if (validationErrors[field]) {
                setValidationErrors(prevErrors => {
                    const newErrors = { ...prevErrors };
                    delete newErrors[field];
                    return newErrors;
                });
            }

            setHasUnsavedChanges(true);

            if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

            if (!isNewBrand && isEditing) {
                autoSaveTimeoutRef.current = setTimeout(() => {
                    handleAutoSave(newData);
                }, 2000);
            }

            return newData;
        });
    }, [validationErrors, isNewBrand, isEditing, handleAutoSave]);

    // Form validation logic
    const validateForm = useCallback((): boolean => {
        const errors: ValidationErrors = {};
        if (!formData.name.trim()) errors.name = 'Brand name is required';
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Please enter a valid email address';
        if (formData.website && !formData.website.startsWith('http')) errors.website = 'Website must start with http:// or https://';
        if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\D/g, ''))) errors.phone = 'Please enter a valid phone number';
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    // Logo upload handler
    const handleLogoUpload = useCallback(async (file: File) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setSnackbar({ open: true, message: 'Please upload an image file', severity: 'error' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setSnackbar({ open: true, message: 'Image size must be less than 5MB', severity: 'error' });
            return;
        }

        try {
            setLogoUploading(true);
            const reader = new FileReader();
            reader.onload = (e) => setLogoPreview(e.target?.result as string);
            reader.readAsDataURL(file);

            // Simulate upload and get a URL
            await new Promise(resolve => setTimeout(resolve, 1000));
            const mockUploadedUrl = URL.createObjectURL(file);
            handleFormChange('logo_url', mockUploadedUrl);

            setSnackbar({ open: true, message: 'Logo uploaded successfully', severity: 'success' });
        } catch (error) {
            console.error('Logo upload failed:', error);
            setSnackbar({ open: true, message: 'Failed to upload logo', severity: 'error' });
        } finally {
            setLogoUploading(false);
        }
    }, [handleFormChange]);

    // Drag and drop handlers for logo
    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) handleLogoUpload(files[0]);
    }, [handleLogoUpload]);

    // Manual save handler
    const handleSave = async () => {
        if (!validateForm()) {
            setSnackbar({ open: true, message: 'Please fix the validation errors before saving', severity: 'error' });
            return;
        }

        try {
            setSaving(true);
            if (isNewBrand) {
                const newBrand = await api.brands.create(formData);
                setSnackbar({ open: true, message: 'Brand created successfully', severity: 'success' });
                await refreshBrands();
                router.push(`/manager/brands/${newBrand.id}`);
            } else {
                const updatedBrand = await api.brands.update(parseInt(brandId), formData);
                setBrand(updatedBrand);
                setSnackbar({ open: true, message: 'Brand updated successfully', severity: 'success' });
                await refreshBrands();
                setIsEditing(false);
                setHasUnsavedChanges(false);
            }
        } catch (err) {
            setSnackbar({ open: true, message: isNewBrand ? 'Failed to create brand' : 'Failed to update brand', severity: 'error' });
            console.error('Error saving brand:', err);
        } finally {
            setSaving(false);
        }
    };

    // Cancel edit handler
    const handleCancel = () => {
        if (isNewBrand) {
            router.push('/manager/brands');
        } else {
            setIsEditing(false);
            if (brand) {
                // Reset form to original data
                setFormData({
                    name: brand.name, display_name: brand.display_name || '', description: brand.description || '',
                    business_type: brand.business_type || '', website: brand.website || '', email: brand.email || '',
                    phone: brand.phone || '', address_line1: brand.address_line1 || '', address_line2: brand.address_line2 || '',
                    city: brand.city || '', state: brand.state || '', country: brand.country || 'US',
                    postal_code: brand.postal_code || '', timezone: brand.timezone || 'America/New_York',
                    currency: brand.currency || 'USD', logo_url: brand.logo_url || '', is_active: brand.is_active
                });
            }
        }
    };

    // Loading and Error states
    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (error) return <Box sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Box>;

    return (
        <Box sx={{ minHeight: "100vh" }}>
            {/* Header Section */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 2 }}>
                    <IconButton onClick={() => router.push("/manager/brands")}><BackIcon /></IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {isNewBrand ? 'Create Brand' : 'Brand Profile'}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {isNewBrand ? 'Set up a new brand for your organization' : 'Manage brand information, settings, and design'}
                        </Typography>
                    </Box>
                </Box>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="/manager" sx={{ display: "flex", alignItems: "center" }}>
                        <SettingsIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Management
                    </Link>
                    <Link underline="hover" color="inherit" href="/manager/brands" sx={{ display: "flex", alignItems: "center" }}>
                        <BrandIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Brands
                    </Link>
                    <Typography color="text.primary" sx={{ fontWeight: 600 }}>{getBrandDisplayName(brand)}</Typography>
                </Breadcrumbs>
            </Box>

            {/* Main Content */}
            <Box sx={{ p: 3 }}>
                {/* Identity Bar Card */}
                <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${mode === "dark" ? "#1a1a1a" : "#ffffff"} 0%, ${mode === "dark" ? "#2d2d2d" : "#f8f9fa"} 100%)`, border: `1px solid ${mode === "dark" ? "#333" : "#e0e0e0"}`, boxShadow: `0 4px 20px ${mode === "dark" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"}` }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                            {/* Logo Section */}
                            <Box sx={{ position: 'relative' }}>
                                <Avatar
                                    src={logoPreview || formData.logo_url || undefined}
                                    sx={{ width: 80, height: 80, bgcolor: "primary.main", fontSize: "1.8rem", fontWeight: 700, cursor: isEditing ? 'pointer' : 'default', transition: 'all 0.3s ease', animation: logoUploading ? `${pulseAnimation} 1s infinite` : 'none', '&:hover': isEditing ? { transform: 'scale(1.05)', boxShadow: 3 } : {} }}
                                    onClick={() => isEditing && logoInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                >
                                    {getBrandInitials(brand)}
                                </Avatar>
                                {isEditing && <Fade in={true}><Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0, 0, 0, 0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.3s ease', '&:hover': { opacity: 1 } }}><UploadIcon sx={{ color: 'white', fontSize: 24 }} /></Box></Fade>}
                                {logoUploading && <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0, 0, 0, 0.7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={24} sx={{ color: 'white' }} /></Box>}
                                <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                            </Box>

                            {/* Brand Info */}
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{getBrandDisplayName(brand)}</Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>{formData.email || 'No email provided'}</Typography>
                                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                                    <Chip icon={formData.is_active ? <ActiveIcon /> : <CancelIcon />} label={formData.is_active ? 'Active' : 'Inactive'} color={formData.is_active ? 'success' : 'error'} size="small" sx={{ fontWeight: 600 }} />
                                    <Chip icon={<WorkIcon />} label={formData.business_type || 'Business'} color="primary" size="small" sx={{ fontWeight: 600 }} />
                                    <Chip icon={<CurrencyIcon />} label={formData.currency} variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                                    <Chip icon={<PublicIcon />} label={formData.timezone} variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                                </Box>
                            </Box>

                            {/* Status Indicators */}
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                                {hasUnsavedChanges && <Chip icon={<WarningIcon />} label="Unsaved changes" color="warning" size="small" sx={{ fontWeight: 600 }} />}
                                {autoSaving && <Chip icon={<CircularProgress size={12} />} label="Auto-saving..." color="info" size="small" sx={{ fontWeight: 600 }} />}
                                <Typography variant="caption" color="text.secondary">Created</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{brand ? formatDate(brand.created_at) : 'New'}</Typography>
                            </Box>

                            {/* Action Buttons */}
                            <Box sx={{ display: "flex", gap: 1 }}>
                                {isEditing ? (
                                    <>
                                        <Button variant="outlined" startIcon={<CancelIcon />} onClick={handleCancel} disabled={saving} size="small">Cancel</Button>
                                        <Button variant="contained" startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />} onClick={handleSave} disabled={saving} size="small">{saving ? 'Saving...' : (isNewBrand ? 'Create' : 'Save')}</Button>
                                    </>
                                ) : (
                                    <Button variant="contained" startIcon={<EditIcon />} onClick={() => setIsEditing(true)} size="small">Edit Brand</Button>
                                )}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Box>
                    <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { fontWeight: 600, textTransform: "none", py: 2, fontSize: "0.9rem" } }}>
                        <Tab label="Brand Details" icon={<InfoIcon />} iconPosition="start" />
                        <Tab label="Brand Design" icon={<DesignIcon />} iconPosition="start" />
                    </Tabs>

                    {/* Tab 1: Brand Details Form */}
                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={3} sx={{ p: 3 }}>
                            <Grid item xs={12} md={6}>
                                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: "divider" }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1, mb: 2 }}><BrandIcon color="primary" fontSize="small" /> Basic Information</Typography>
                                    <Stack spacing={2}>
                                        <TextField label="Brand Name" value={formData.name} onChange={(e) => handleFormChange('name', e.target.value)} fullWidth required disabled={!isEditing} size="small" helperText="Internal name for the brand" error={!!validationErrors.name} />
                                        <TextField label="Display Name" value={formData.display_name} onChange={(e) => handleFormChange('display_name', e.target.value)} fullWidth disabled={!isEditing} size="small" helperText="Public facing name" />
                                        <TextField label="Description" value={formData.description} onChange={(e) => handleFormChange('description', e.target.value)} fullWidth multiline rows={3} disabled={!isEditing} size="small" />
                                        <FormControl fullWidth disabled={!isEditing} size="small">
                                            <InputLabel>Business Type</InputLabel>
                                            <Select value={formData.business_type} onChange={(e) => handleFormChange('business_type', e.target.value)} label="Business Type">
                                                {BUSINESS_TYPES.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                    </Stack>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: "divider" }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1, mb: 2 }}><EmailIcon color="primary" fontSize="small" /> Contact Information</Typography>
                                    <Stack spacing={2}>
                                        <TextField label="Email" type="email" value={formData.email} onChange={(e) => handleFormChange('email', e.target.value)} fullWidth disabled={!isEditing} size="small" error={!!validationErrors.email} helperText={validationErrors.email} />
                                        <TextField label="Phone" value={formData.phone} onChange={(e) => handleFormChange('phone', e.target.value)} fullWidth disabled={!isEditing} size="small" error={!!validationErrors.phone} helperText={validationErrors.phone} />
                                        <TextField label="Website" value={formData.website} onChange={(e) => handleFormChange('website', e.target.value)} fullWidth disabled={!isEditing} size="small" error={!!validationErrors.website} helperText={validationErrors.website || "Include https://"} />
                                    </Stack>
                                </Paper>
                            </Grid>
                            <Grid item xs={12}>
                                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: "divider" }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1, mb: 2 }}><LocationIcon color="primary" fontSize="small" /> Address Information</Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}><TextField label="Address Line 1" value={formData.address_line1} onChange={(e) => handleFormChange('address_line1', e.target.value)} fullWidth disabled={!isEditing} size="small" /></Grid>
                                        <Grid item xs={12}><TextField label="Address Line 2" value={formData.address_line2} onChange={(e) => handleFormChange('address_line2', e.target.value)} fullWidth disabled={!isEditing} size="small" /></Grid>
                                        <Grid item xs={12} md={4}><TextField label="City" value={formData.city} onChange={(e) => handleFormChange('city', e.target.value)} fullWidth disabled={!isEditing} size="small" /></Grid>
                                        <Grid item xs={12} md={4}><TextField label="State/Province" value={formData.state} onChange={(e) => handleFormChange('state', e.target.value)} fullWidth disabled={!isEditing} size="small" /></Grid>
                                        <Grid item xs={12} md={4}><TextField label="Postal Code" value={formData.postal_code} onChange={(e) => handleFormChange('postal_code', e.target.value)} fullWidth disabled={!isEditing} size="small" /></Grid>
                                        <Grid item xs={12}><TextField label="Country" value={formData.country} onChange={(e) => handleFormChange('country', e.target.value)} fullWidth disabled={!isEditing} size="small" /></Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                            <Grid item xs={12}>
                                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: "divider" }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1, mb: 2 }}><SettingsIcon color="primary" fontSize="small" /> Business Settings</Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth disabled={!isEditing} size="small">
                                                <InputLabel>Timezone</InputLabel>
                                                <Select value={formData.timezone} onChange={(e) => handleFormChange('timezone', e.target.value)} label="Timezone">
                                                    {TIMEZONES.map((tz) => <MenuItem key={tz} value={tz}>{tz}</MenuItem>)}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth disabled={!isEditing} size="small">
                                                <InputLabel>Currency</InputLabel>
                                                <Select value={formData.currency} onChange={(e) => handleFormChange('currency', e.target.value)} label="Currency">
                                                    {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12}><FormControlLabel control={<Switch checked={formData.is_active} onChange={(e) => handleFormChange('is_active', e.target.checked)} disabled={!isEditing} />} label="Brand is Active" /></Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Tab 2: Brand Design (Placeholder) */}
                    <TabPanel value={tabValue} index={1}>
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Paper sx={{ p: 4, border: '2px dashed', borderColor: 'divider', borderRadius: 2 }}>
                                <DesignIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary" gutterBottom>Brand Design Studio</Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Customize your brand colors, fonts, and visual identity.</Typography>
                                <Typography variant="body2" color="primary" sx={{ mt: 3, fontWeight: 600 }}>Coming Soon</Typography>
                            </Paper>
                        </Box>
                    </TabPanel>
                </Box>
            </Box>

            {/* Snackbar for notifications */}
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
