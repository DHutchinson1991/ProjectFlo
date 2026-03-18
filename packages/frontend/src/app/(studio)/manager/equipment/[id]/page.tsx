"use client";

import React, { useState, useEffect } from "react";
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
    Chip,
    Avatar,
    Stack,
    Tabs,
    Tab,
    Breadcrumbs,
    Link,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    PhotoCamera as CameraIcon,
    Build as MaintenanceIcon,
    Info as InfoIcon,
    Assignment as RentalIcon,
    TrendingUp as TrendingUpIcon,
    AttachMoney as MoneyIcon,
    CalendarToday as CalendarIcon,
    LocationOn as LocationIcon,
    Inventory as InventoryIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import { useBrand } from "@/app/providers/BrandProvider";
import { formatCurrency } from "@/lib/utils/formatUtils";
import EquipmentAvailabilityCalendar from "@/components/equipment/EquipmentAvailabilityCalendar";
import {
    Equipment,
    EquipmentRental,
    EquipmentMaintenance,
    EquipmentAvailability,
    EquipmentCondition,
    EQUIPMENT_AVAILABILITY_COLORS,
    EQUIPMENT_CONDITION_COLORS,
} from "@/lib/types";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`equipment-tabpanel-${index}`}
            aria-labelledby={`equipment-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function EquipmentDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const equipmentId = parseInt(params.id as string);
    const { currentBrand } = useBrand();
    const currencyCode = currentBrand?.currency || 'USD';

    // State
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [rentals, setRentals] = useState<EquipmentRental[]>([]);
    const [maintenance, setMaintenance] = useState<EquipmentMaintenance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Equipment>>({});
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
    const [tabValue, setTabValue] = useState(0);

    // Load equipment data
    const loadEquipment = async () => {
        try {
            setLoading(true);
            setError(null);

            const equipmentData = await api.equipment.getById(equipmentId);

            // Map backend field names to frontend expectations
            const mappedEquipment = {
                ...equipmentData,
                rentals: equipmentData.rental_bookings || [],
                maintenance_records: equipmentData.maintenance_logs || []
            };

            setEquipment(mappedEquipment);
            setRentals(equipmentData.rental_bookings || []);
            setMaintenance(equipmentData.maintenance_logs || []);
            setEditData(mappedEquipment);
        } catch (err) {
            console.error("Failed to load equipment:", err);
            setError("Failed to load equipment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (equipmentId) {
            loadEquipment();
        }
    }, [equipmentId]);

    // Snackbar helper
    const showSnackbar = (message: string, severity: "success" | "error" = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    // Edit handlers
    const handleStartEdit = () => {
        setIsEditing(true);
        setEditData({ ...equipment });
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditData({ ...equipment });
    };

    const handleSaveEdit = async () => {
        if (!equipment || !editData) return;

        try {
            // Ensure numeric fields are properly converted
            const processedEditData = {
                ...editData,
                rental_price_per_day: editData.rental_price_per_day ? Number(editData.rental_price_per_day) : undefined,
                purchase_price: editData.purchase_price ? Number(editData.purchase_price) : undefined
            };

            const updatedEquipment = await api.equipment.update(equipment.id, processedEditData);
            setEquipment(updatedEquipment);
            setIsEditing(false);
            showSnackbar("Equipment updated successfully");
        } catch (err) {
            console.error("Failed to update equipment:", err);
            showSnackbar("Failed to update equipment", "error");
        }
    };

    const updateEditData = (field: keyof Equipment, value: unknown) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error || !equipment) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error || "Equipment not found"}</Alert>
                <Button
                    onClick={() => router.push('/manager/equipment')}
                    sx={{ mt: 2 }}
                >
                    Back to Equipment
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            pb: 4
        }}>
            {/* Header Section */}
            <Box sx={{
                mb: 3,
                overflow: 'hidden'
            }}>
                <Box sx={{ p: 3 }}>
                    {/* Main Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <Box sx={{
                            position: 'relative',
                            mr: 4
                        }}>
                            <Avatar
                                sx={{
                                    width: 72,
                                    height: 72,
                                    background: 'rgba(52, 58, 68, 0.8)',
                                    border: '2px solid rgba(156, 163, 175, 0.2)',
                                    backdropFilter: 'blur(8px)',
                                }}
                            >
                                <CameraIcon sx={{ fontSize: 32, color: '#9ca3af' }} />
                            </Avatar>
                            {/* Compact status indicator */}
                            <Box sx={{
                                position: 'absolute',
                                bottom: -4,
                                right: -4,
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                backgroundColor: EQUIPMENT_CONDITION_COLORS[equipment.condition],
                                border: '3px solid rgba(16, 18, 22, 0.95)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Box sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: 'white',
                                    opacity: 0.9
                                }} />
                            </Box>
                        </Box>

                        <Box flex={1}>
                            <Typography variant="h4" component="h1" sx={{
                                fontWeight: 800,
                                color: '#f8fafc',
                                mb: 0.5,
                                letterSpacing: '-0.025em'
                            }}>
                                {equipment.item_name}
                            </Typography>
                            <Typography variant="subtitle1" sx={{
                                color: '#9ca3af',
                                fontWeight: 500,
                                mb: 3,
                                fontSize: '1.1rem'
                            }}>
                                {equipment.brand_name} {equipment.model}
                            </Typography>

                            {/* Compact Status Chips */}
                            <Stack direction="row" spacing={2} sx={{ mb: 0 }}>
                                <Chip
                                    label={equipment.availability_status}
                                    size="small"
                                    sx={{
                                        backgroundColor: alpha(EQUIPMENT_AVAILABILITY_COLORS[equipment.availability_status], 0.15),
                                        color: EQUIPMENT_AVAILABILITY_COLORS[equipment.availability_status],
                                        border: `1px solid ${alpha(EQUIPMENT_AVAILABILITY_COLORS[equipment.availability_status], 0.3)}`,
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        height: 28,
                                        '& .MuiChip-label': { px: 1.5 }
                                    }}
                                />
                                <Chip
                                    label={equipment.condition}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        borderColor: alpha(EQUIPMENT_CONDITION_COLORS[equipment.condition], 0.4),
                                        color: EQUIPMENT_CONDITION_COLORS[equipment.condition],
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        height: 28,
                                        backgroundColor: alpha(EQUIPMENT_CONDITION_COLORS[equipment.condition], 0.05),
                                        '& .MuiChip-label': { px: 1.5 }
                                    }}
                                />
                                <Chip
                                    label={`${formatCurrency(Number(equipment.rental_price_per_day || 0), currencyCode)}/day`}
                                    size="small"
                                    sx={{
                                        backgroundColor: 'rgba(52, 58, 68, 0.4)',
                                        color: '#d1d5db',
                                        border: '1px solid rgba(75, 85, 99, 0.3)',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        height: 28,
                                        '& .MuiChip-label': { px: 1.5 }
                                    }}
                                />
                            </Stack>
                        </Box>
                    </Box>

                    {/* Breadcrumbs - moved below title/chips */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Breadcrumbs sx={{ opacity: 0.7 }}>
                            <Link
                                color="inherit"
                                onClick={() => router.push('/manager')}
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': { color: 'primary.main' },
                                    transition: 'color 0.2s'
                                }}
                            >
                                Manager
                            </Link>
                            <Link
                                color="inherit"
                                onClick={() => router.push('/manager/equipment')}
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': { color: 'primary.main' },
                                    transition: 'color 0.2s'
                                }}
                            >
                                Equipment
                            </Link>
                            <Typography color="text.primary" fontWeight={600}>
                                {equipment.item_name}
                            </Typography>
                        </Breadcrumbs>

                        {/* Edit Button - moved to right side of breadcrumbs */}
                        <Box display="flex" gap={1.5} alignItems="center">
                            {isEditing ? (
                                <>
                                    <Button
                                        startIcon={<SaveIcon />}
                                        onClick={handleSaveEdit}
                                        variant="contained"
                                        size="small"
                                        sx={{
                                            background: 'rgba(16, 185, 129, 0.2)',
                                            color: '#10b981',
                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                            '&:hover': {
                                                background: 'rgba(16, 185, 129, 0.3)',
                                                borderColor: 'rgba(16, 185, 129, 0.5)',
                                                transform: 'translateY(-1px)',
                                            },
                                            transition: 'all 0.2s',
                                            borderRadius: 1.5,
                                            px: 2,
                                            py: 1,
                                            textTransform: 'none',
                                            fontWeight: 600
                                        }}
                                    >
                                        Save
                                    </Button>
                                    <Button
                                        startIcon={<CancelIcon />}
                                        onClick={handleCancelEdit}
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            borderColor: 'rgba(239, 68, 68, 0.4)',
                                            color: '#ef4444',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            '&:hover': {
                                                background: 'rgba(239, 68, 68, 0.2)',
                                                borderColor: 'rgba(239, 68, 68, 0.6)',
                                                transform: 'translateY(-1px)',
                                            },
                                            transition: 'all 0.2s',
                                            borderRadius: 1.5,
                                            px: 2,
                                            py: 1,
                                            textTransform: 'none',
                                            fontWeight: 600
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    startIcon={<EditIcon />}
                                    onClick={handleStartEdit}
                                    variant="contained"
                                    size="small"
                                    sx={{
                                        background: 'rgba(52, 58, 68, 0.6)',
                                        color: '#d1d5db',
                                        border: '1px solid rgba(75, 85, 99, 0.4)',
                                        '&:hover': {
                                            background: 'rgba(75, 85, 99, 0.6)',
                                            borderColor: 'rgba(107, 114, 128, 0.6)',
                                            transform: 'translateY(-1px)',
                                        },
                                        transition: 'all 0.2s',
                                        borderRadius: 1.5,
                                        px: 2,
                                        py: 1,
                                        textTransform: 'none',
                                        fontWeight: 600
                                    }}
                                >
                                    Edit
                                </Button>
                            )}
                        </Box>
                    </Box>

                    {/* Enhanced Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            sx={{
                                '& .MuiTab-root': {
                                    minHeight: 64,
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    textTransform: 'none',
                                    borderRadius: '12px 12px 0 0',
                                    mx: 0.5,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        background: 'rgba(52, 58, 68, 0.2)',
                                        transform: 'translateY(-2px)'
                                    },
                                    '&.Mui-selected': {
                                        background: 'rgba(52, 58, 68, 0.3)',
                                        color: '#d1d5db'
                                    }
                                },
                                '& .MuiTabs-indicator': {
                                    height: 3,
                                    borderRadius: '3px 3px 0 0',
                                    background: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'
                                }
                            }}
                        >
                            <Tab
                                icon={<InfoIcon />}
                                label="Details"
                                iconPosition="start"
                                sx={{ minWidth: 140 }}
                            />
                            <Tab
                                icon={<RentalIcon />}
                                label={`Rentals (${rentals.length})`}
                                iconPosition="start"
                                sx={{ minWidth: 140 }}
                            />
                            <Tab
                                icon={<MaintenanceIcon />}
                                label={`Maintenance (${maintenance.length})`}
                                iconPosition="start"
                                sx={{ minWidth: 180 }}
                            />
                        </Tabs>
                    </Box>
                </Box>
            </Box>

            {/* Content Area */}
            <Box sx={{ px: 3 }}>                {/* Tab Panels */}
                <TabPanel value={tabValue} index={0}>
                    {/* Equipment Details */}
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={8}>
                            <Card sx={{
                                borderRadius: 3,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                                border: '1px solid rgba(52, 58, 68, 0.3)',
                                background: 'rgba(16, 18, 22, 0.95)',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <InventoryIcon sx={{ mr: 2, color: '#9ca3af', fontSize: 28 }} />
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                                            Equipment Information
                                        </Typography>
                                    </Box>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Equipment Name"
                                                value={isEditing ? editData.item_name || '' : equipment.item_name}
                                                onChange={(e) => updateEditData('item_name', e.target.value)}
                                                disabled={!isEditing}
                                                fullWidth
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'rgba(75, 85, 99, 0.6)',
                                                        },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#6b7280',
                                                        },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#9ca3af',
                                                        }
                                                    },
                                                    '& .MuiInputLabel-root': {
                                                        color: '#9ca3af',
                                                        '&.Mui-focused': {
                                                            color: '#d1d5db',
                                                        }
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        color: '#f3f4f6'
                                                    }
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Serial Number"
                                                value={isEditing ? editData.serial_number || '' : equipment.serial_number || ''}
                                                onChange={(e) => updateEditData('serial_number', e.target.value)}
                                                disabled={!isEditing}
                                                fullWidth
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'rgba(75, 85, 99, 0.6)',
                                                        },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#6b7280',
                                                        },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#9ca3af',
                                                        }
                                                    },
                                                    '& .MuiInputLabel-root': {
                                                        color: '#9ca3af',
                                                        '&.Mui-focused': {
                                                            color: '#d1d5db',
                                                        }
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        color: '#f3f4f6'
                                                    }
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Description"
                                                value={isEditing ? editData.description || '' : equipment.description || ''}
                                                onChange={(e) => updateEditData('description', e.target.value)}
                                                disabled={!isEditing}
                                                fullWidth
                                                multiline
                                                rows={3}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'rgba(75, 85, 99, 0.6)',
                                                        },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#6b7280',
                                                        },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#9ca3af',
                                                        }
                                                    },
                                                    '& .MuiInputLabel-root': {
                                                        color: '#9ca3af',
                                                        '&.Mui-focused': {
                                                            color: '#d1d5db',
                                                        }
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        color: '#f3f4f6'
                                                    }
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Manufacturer"
                                                value={isEditing ? editData.brand_name || '' : equipment.brand_name || ''}
                                                onChange={(e) => updateEditData('brand_name', e.target.value)}
                                                disabled={!isEditing}
                                                fullWidth
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'rgba(75, 85, 99, 0.6)',
                                                        },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#6b7280',
                                                        },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#9ca3af',
                                                        }
                                                    },
                                                    '& .MuiInputLabel-root': {
                                                        color: '#9ca3af',
                                                        '&.Mui-focused': {
                                                            color: '#d1d5db',
                                                        }
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        color: '#f3f4f6'
                                                    }
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Model"
                                                value={isEditing ? editData.model || '' : equipment.model || ''}
                                                onChange={(e) => updateEditData('model', e.target.value)}
                                                disabled={!isEditing}
                                                fullWidth
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'rgba(75, 85, 99, 0.6)',
                                                        },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#6b7280',
                                                        },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#9ca3af',
                                                        }
                                                    },
                                                    '& .MuiInputLabel-root': {
                                                        color: '#9ca3af',
                                                        '&.Mui-focused': {
                                                            color: '#d1d5db',
                                                        }
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        color: '#f3f4f6'
                                                    }
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth>
                                                <InputLabel sx={{
                                                    color: '#9ca3af',
                                                    '&.Mui-focused': { color: '#d1d5db' }
                                                }}>
                                                    Status
                                                </InputLabel>
                                                <Select
                                                    value={isEditing ? editData.availability_status || equipment.availability_status : equipment.availability_status}
                                                    onChange={(e) => updateEditData('availability_status', e.target.value)}
                                                    disabled={!isEditing}
                                                    label="Status"
                                                    sx={{
                                                        borderRadius: 2,
                                                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'rgba(75, 85, 99, 0.6)',
                                                        },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#6b7280',
                                                        },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#9ca3af',
                                                        },
                                                        '& .MuiSelect-select': {
                                                            color: '#f3f4f6'
                                                        }
                                                    }}
                                                >
                                                    {Object.values(EquipmentAvailability).map((status) => (
                                                        <MenuItem key={status} value={status}>
                                                            <Chip
                                                                label={status}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: EQUIPMENT_AVAILABILITY_COLORS[status],
                                                                    color: 'white',
                                                                    fontWeight: 600,
                                                                }}
                                                            />
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth>
                                                <InputLabel sx={{
                                                    color: '#9ca3af',
                                                    '&.Mui-focused': { color: '#d1d5db' }
                                                }}>
                                                    Condition
                                                </InputLabel>
                                                <Select
                                                    value={isEditing ? editData.condition || equipment.condition : equipment.condition}
                                                    onChange={(e) => updateEditData('condition', e.target.value)}
                                                    disabled={!isEditing}
                                                    label="Condition"
                                                    sx={{
                                                        borderRadius: 2,
                                                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'rgba(75, 85, 99, 0.6)',
                                                        },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#6b7280',
                                                        },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#9ca3af',
                                                        },
                                                        '& .MuiSelect-select': {
                                                            color: '#f3f4f6'
                                                        }
                                                    }}
                                                >
                                                    {Object.values(EquipmentCondition).map((condition) => (
                                                        <MenuItem key={condition} value={condition}>
                                                            <Chip
                                                                label={condition}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{
                                                                    borderColor: EQUIPMENT_CONDITION_COLORS[condition],
                                                                    color: EQUIPMENT_CONDITION_COLORS[condition],
                                                                    fontWeight: 600,
                                                                }}
                                                            />
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Location"
                                                value={isEditing ? editData.location || '' : equipment.location || ''}
                                                onChange={(e) => updateEditData('location', e.target.value)}
                                                disabled={!isEditing}
                                                fullWidth
                                                InputProps={{
                                                    startAdornment: <LocationIcon sx={{ mr: 1, color: '#9ca3af' }} />,
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'rgba(75, 85, 99, 0.6)',
                                                        },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#6b7280',
                                                        },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#9ca3af',
                                                        }
                                                    },
                                                    '& .MuiInputLabel-root': {
                                                        color: '#9ca3af',
                                                        '&.Mui-focused': {
                                                            color: '#d1d5db',
                                                        }
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        color: '#f3f4f6'
                                                    }
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Daily Rental Rate"
                                                type="number"
                                                value={isEditing ? editData.rental_price_per_day || 0 : equipment.rental_price_per_day || 0}
                                                onChange={(e) => updateEditData('rental_price_per_day', parseFloat(e.target.value) || 0)}
                                                disabled={!isEditing}
                                                fullWidth
                                                InputProps={{
                                                    startAdornment: <MoneyIcon sx={{ mr: 1, color: '#9ca3af' }} />,
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'rgba(75, 85, 99, 0.6)',
                                                        },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#6b7280',
                                                        },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#9ca3af',
                                                        }
                                                    },
                                                    '& .MuiInputLabel-root': {
                                                        color: '#9ca3af',
                                                        '&.Mui-focused': {
                                                            color: '#d1d5db',
                                                        }
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        color: '#f3f4f6'
                                                    }
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card sx={{
                                borderRadius: 3,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                border: '1px solid rgba(52, 58, 68, 0.3)',
                                background: 'rgba(16, 18, 22, 0.95)',
                                backdropFilter: 'blur(10px)',
                                height: 'fit-content'
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                                        <TrendingUpIcon sx={{ mr: 1.5, color: '#6b7280', fontSize: 20 }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#d1d5db' }}>
                                            Quick Stats
                                        </Typography>
                                    </Box>
                                    <Stack spacing={2}>
                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            py: 1.5,
                                            px: 2,
                                            borderRadius: 1.5,
                                            background: 'rgba(30, 41, 59, 0.4)',
                                            border: '1px solid rgba(52, 58, 68, 0.2)'
                                        }}>
                                            <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                                                Purchase Price
                                            </Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#10b981' }}>
                                                {equipment.purchase_price ? formatCurrency(Number(equipment.purchase_price), currencyCode) : 'N/A'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            py: 1.5,
                                            px: 2,
                                            borderRadius: 1.5,
                                            background: 'rgba(30, 41, 59, 0.4)',
                                            border: '1px solid rgba(52, 58, 68, 0.2)'
                                        }}>
                                            <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                                                Total Rentals
                                            </Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#60a5fa' }}>
                                                {rentals.length}
                                            </Typography>
                                        </Box>

                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            py: 1.5,
                                            px: 2,
                                            borderRadius: 1.5,
                                            background: 'rgba(30, 41, 59, 0.4)',
                                            border: '1px solid rgba(52, 58, 68, 0.2)'
                                        }}>
                                            <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                                                Active Rentals
                                            </Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                                                {rentals.filter(r => r.status === 'Active').length}
                                            </Typography>
                                        </Box>

                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            py: 1.5,
                                            px: 2,
                                            borderRadius: 1.5,
                                            background: 'rgba(30, 41, 59, 0.4)',
                                            border: '1px solid rgba(52, 58, 68, 0.2)'
                                        }}>
                                            <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                                                Maintenance
                                            </Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#a78bfa' }}>
                                                {maintenance.length}
                                            </Typography>
                                        </Box>

                                        <Divider sx={{ my: 1.5, borderColor: 'rgba(52, 58, 68, 0.3)' }} />

                                        {/* Compact Quick Actions */}
                                        <Stack spacing={1.5}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Quick Actions
                                            </Typography>
                                            <Button
                                                fullWidth
                                                size="small"
                                                startIcon={<CalendarIcon sx={{ fontSize: 16 }} />}
                                                sx={{
                                                    py: 1,
                                                    borderRadius: 1.5,
                                                    color: '#9ca3af',
                                                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                                                    border: '1px solid rgba(52, 58, 68, 0.2)',
                                                    fontSize: '0.8rem',
                                                    textTransform: 'none',
                                                    '&:hover': {
                                                        background: 'rgba(52, 58, 68, 0.4)',
                                                        color: '#d1d5db',
                                                        borderColor: 'rgba(75, 85, 99, 0.4)'
                                                    }
                                                }}
                                            >
                                                Schedule Maintenance
                                            </Button>
                                            <Button
                                                fullWidth
                                                size="small"
                                                startIcon={<RentalIcon sx={{ fontSize: 16 }} />}
                                                sx={{
                                                    py: 1,
                                                    borderRadius: 1.5,
                                                    color: '#9ca3af',
                                                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                                                    border: '1px solid rgba(52, 58, 68, 0.2)',
                                                    fontSize: '0.8rem',
                                                    textTransform: 'none',
                                                    '&:hover': {
                                                        background: 'rgba(52, 58, 68, 0.4)',
                                                        color: '#d1d5db',
                                                        borderColor: 'rgba(75, 85, 99, 0.4)'
                                                    }
                                                }}
                                            >
                                                Create Rental
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Equipment Availability Calendar */}
                    <EquipmentAvailabilityCalendar
                        equipmentId={equipment.id}
                        equipmentName={equipment.item_name}
                    />
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    {/* Rental History */}
                    <Card sx={{
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(52, 58, 68, 0.3)',
                        background: 'rgba(16, 18, 22, 0.95)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <RentalIcon sx={{ mr: 2, color: '#6b7280', fontSize: 24 }} />
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                                    Rental History
                                </Typography>
                            </Box>
                            {rentals.length > 0 ? (
                                <TableContainer component={Paper} sx={{
                                    borderRadius: 2,
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
                                    border: '1px solid rgba(52, 58, 68, 0.3)',
                                    background: 'rgba(22, 32, 43, 0.6)',
                                    overflow: 'hidden'
                                }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{
                                                background: 'rgba(30, 41, 59, 0.8)',
                                                '& .MuiTableCell-head': {
                                                    color: '#d1d5db',
                                                    fontWeight: 600,
                                                    fontSize: '0.8rem',
                                                    py: 1.5,
                                                    borderBottom: '1px solid rgba(52, 58, 68, 0.4)'
                                                }
                                            }}>
                                                <TableCell>Renter</TableCell>
                                                <TableCell>Start Date</TableCell>
                                                <TableCell>End Date</TableCell>
                                                <TableCell>Daily Rate</TableCell>
                                                <TableCell>Total Cost</TableCell>
                                                <TableCell>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {rentals.map((rental) => (
                                                <TableRow
                                                    key={rental.id}
                                                    sx={{
                                                        '&:nth-of-type(odd)': {
                                                            backgroundColor: 'rgba(30, 41, 59, 0.3)'
                                                        },
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(52, 58, 68, 0.4)',
                                                            transform: 'translateY(-1px)'
                                                        },
                                                        transition: 'all 0.2s',
                                                        '& .MuiTableCell-root': {
                                                            borderBottom: '1px solid rgba(52, 58, 68, 0.2)',
                                                            py: 1.5,
                                                            fontSize: '0.85rem'
                                                        }
                                                    }}
                                                >
                                                    <TableCell sx={{ fontWeight: 600, color: '#f3f4f6' }}>{rental.renter_name}</TableCell>
                                                    <TableCell sx={{ color: '#9ca3af' }}>
                                                        {new Date(rental.start_date).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#9ca3af' }}>
                                                        {new Date(rental.end_date).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#10b981' }}>
                                                        ${Number(rental.daily_rate).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 700, color: '#60a5fa' }}>
                                                        ${Number(rental.total_cost).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={rental.status}
                                                            size="small"
                                                            sx={{
                                                                ...(rental.status === 'Active' && {
                                                                    backgroundColor: alpha('#f59e0b', 0.2),
                                                                    color: '#f59e0b',
                                                                    border: '1px solid rgba(245, 158, 11, 0.3)'
                                                                }),
                                                                ...(rental.status === 'Completed' && {
                                                                    backgroundColor: alpha('#10b981', 0.2),
                                                                    color: '#10b981',
                                                                    border: '1px solid rgba(16, 185, 129, 0.3)'
                                                                }),
                                                                ...(rental.status !== 'Active' && rental.status !== 'Completed' && {
                                                                    backgroundColor: alpha('#6b7280', 0.2),
                                                                    color: '#9ca3af',
                                                                    border: '1px solid rgba(107, 114, 128, 0.3)'
                                                                }),
                                                                fontWeight: 600,
                                                                fontSize: '0.75rem'
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Box sx={{
                                    textAlign: 'center',
                                    py: 6,
                                    background: 'rgba(30, 41, 59, 0.4)',
                                    borderRadius: 2,
                                    border: '2px dashed rgba(52, 58, 68, 0.6)'
                                }}>
                                    <RentalIcon sx={{ fontSize: 48, color: '#6b7280', mb: 2 }} />
                                    <Typography variant="h6" sx={{ color: '#9ca3af', fontWeight: 600 }}>
                                        No rental history available
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                        This equipment hasn&apos;t been rented out yet
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    {/* Maintenance History */}
                    <Card sx={{
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(52, 58, 68, 0.3)',
                        background: 'rgba(16, 18, 22, 0.95)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <MaintenanceIcon sx={{ mr: 2, color: '#6b7280', fontSize: 24 }} />
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                                    Maintenance History
                                </Typography>
                            </Box>
                            {maintenance.length > 0 ? (
                                <TableContainer component={Paper} sx={{
                                    borderRadius: 2,
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
                                    border: '1px solid rgba(52, 58, 68, 0.3)',
                                    background: 'rgba(22, 32, 43, 0.6)',
                                    overflow: 'hidden'
                                }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{
                                                background: 'rgba(30, 41, 59, 0.8)',
                                                '& .MuiTableCell-head': {
                                                    color: '#d1d5db',
                                                    fontWeight: 600,
                                                    fontSize: '0.8rem',
                                                    py: 1.5,
                                                    borderBottom: '1px solid rgba(52, 58, 68, 0.4)'
                                                }
                                            }}>
                                                <TableCell>Type</TableCell>
                                                <TableCell>Description</TableCell>
                                                <TableCell>Scheduled Date</TableCell>
                                                <TableCell>Completed Date</TableCell>
                                                <TableCell>Cost</TableCell>
                                                <TableCell>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {maintenance.map((record) => (
                                                <TableRow
                                                    key={record.id}
                                                    sx={{
                                                        '&:nth-of-type(odd)': {
                                                            backgroundColor: 'rgba(30, 41, 59, 0.3)'
                                                        },
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(52, 58, 68, 0.4)',
                                                            transform: 'translateY(-1px)'
                                                        },
                                                        transition: 'all 0.2s',
                                                        '& .MuiTableCell-root': {
                                                            borderBottom: '1px solid rgba(52, 58, 68, 0.2)',
                                                            py: 1.5,
                                                            fontSize: '0.85rem'
                                                        }
                                                    }}
                                                >
                                                    <TableCell sx={{ fontWeight: 600, color: '#f3f4f6' }}>{record.maintenance_type}</TableCell>
                                                    <TableCell sx={{ color: '#9ca3af', maxWidth: '200px' }}>
                                                        {record.description}
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#9ca3af' }}>
                                                        {new Date(record.scheduled_date).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#9ca3af' }}>
                                                        {record.completed_date ?
                                                            new Date(record.completed_date).toLocaleDateString() :
                                                            <Chip
                                                                label="Not completed"
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: alpha('#6b7280', 0.2),
                                                                    color: '#9ca3af',
                                                                    border: '1px solid rgba(107, 114, 128, 0.3)',
                                                                    fontSize: '0.7rem'
                                                                }}
                                                            />
                                                        }
                                                    </TableCell>
                                                    <TableCell sx={{
                                                        fontWeight: 600,
                                                        color: record.cost ? '#ef4444' : '#6b7280'
                                                    }}>
                                                        {record.cost ? `$${Number(record.cost).toFixed(2)}` : 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={record.status}
                                                            size="small"
                                                            sx={{
                                                                ...(record.status === 'Completed' && {
                                                                    backgroundColor: alpha('#10b981', 0.2),
                                                                    color: '#10b981',
                                                                    border: '1px solid rgba(16, 185, 129, 0.3)'
                                                                }),
                                                                ...(record.status === 'In_Progress' && {
                                                                    backgroundColor: alpha('#f59e0b', 0.2),
                                                                    color: '#f59e0b',
                                                                    border: '1px solid rgba(245, 158, 11, 0.3)'
                                                                }),
                                                                ...(record.status !== 'Completed' && record.status !== 'In_Progress' && {
                                                                    backgroundColor: alpha('#6b7280', 0.2),
                                                                    color: '#9ca3af',
                                                                    border: '1px solid rgba(107, 114, 128, 0.3)'
                                                                }),
                                                                fontWeight: 600,
                                                                fontSize: '0.75rem'
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Box sx={{
                                    textAlign: 'center',
                                    py: 6,
                                    background: 'rgba(30, 41, 59, 0.4)',
                                    borderRadius: 2,
                                    border: '2px dashed rgba(52, 58, 68, 0.6)'
                                }}>
                                    <MaintenanceIcon sx={{ fontSize: 48, color: '#6b7280', mb: 2 }} />
                                    <Typography variant="h6" sx={{ color: '#9ca3af', fontWeight: 600 }}>
                                        No maintenance history available
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                        This equipment has no recorded maintenance activities
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </TabPanel>

                {/* Snackbar */}
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={6000}
                    onClose={() => setSnackbarOpen(false)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert
                        onClose={() => setSnackbarOpen(false)}
                        severity={snackbarSeverity}
                        sx={{ width: '100%' }}
                    >
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </Box>
        </Box>
    );
}
