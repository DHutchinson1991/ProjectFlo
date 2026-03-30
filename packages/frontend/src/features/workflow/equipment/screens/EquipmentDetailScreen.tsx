"use client";

import React from "react";
import {
    Box,
    Typography,
    Button,
    Alert,
    Snackbar,
    CircularProgress,
    Grid,
    Tabs,
    Tab,
} from "@mui/material";
import {
    Info as InfoIcon,
    Build as MaintenanceIcon,
    Assignment as RentalIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useEquipmentDetail } from "@/features/workflow/equipment/hooks/useEquipmentDetail";
import { EquipmentDetailHeader } from "@/features/workflow/equipment/components/EquipmentDetailHeader";
import { EquipmentInfoCard } from "@/features/workflow/equipment/components/EquipmentInfoCard";
import { EquipmentStatsCard } from "@/features/workflow/equipment/components/EquipmentStatsCard";
import { EquipmentRentalTab } from "@/features/workflow/equipment/components/EquipmentRentalTab";
import { EquipmentMaintenanceTab } from "@/features/workflow/equipment/components/EquipmentMaintenanceTab";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`equipment-tabpanel-${index}`}
            aria-labelledby={`equipment-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

interface EquipmentDetailScreenProps {
    equipmentId: number;
}

export function EquipmentDetailScreen({ equipmentId }: EquipmentDetailScreenProps) {
    const router = useRouter();
    const {
        equipment,
        rentals,
        maintenance,
        crew,
        loading,
        error,
        isEditing,
        editData,
        tabValue,
        snackbarOpen,
        snackbarMessage,
        snackbarSeverity,
        currencyCode,
        handleStartEdit,
        handleCancelEdit,
        handleSaveEdit,
        updateEditData,
        handleTabChange,
        setSnackbarOpen,
    } = useEquipmentDetail(equipmentId);

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
                <Button onClick={() => router.push("/equipment")} sx={{ mt: 2 }}>
                    Back to Equipment
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", pb: 4 }}>
            <EquipmentDetailHeader
                equipment={equipment}
                isEditing={isEditing}
                currencyCode={currencyCode}
                onStartEdit={handleStartEdit}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onBack={() => router.push("/equipment")}
                onBackToResources={() => router.push("/resources")}
            />

            <Box sx={{ px: 3 }}>
                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 0 }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        sx={{
                            "& .MuiTab-root": {
                                minHeight: 64,
                                fontWeight: 600,
                                fontSize: "1rem",
                                textTransform: "none",
                                borderRadius: "12px 12px 0 0",
                                mx: 0.5,
                                transition: "all 0.2s",
                                "&:hover": { background: "rgba(52, 58, 68, 0.2)", transform: "translateY(-2px)" },
                                "&.Mui-selected": { background: "rgba(52, 58, 68, 0.3)", color: "#d1d5db" },
                            },
                            "& .MuiTabs-indicator": {
                                height: 3,
                                borderRadius: "3px 3px 0 0",
                                background: "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)",
                            },
                        }}
                    >
                        <Tab icon={<InfoIcon />} label="Details" iconPosition="start" sx={{ minWidth: 140 }} />
                        <Tab icon={<RentalIcon />} label={`Rentals (${rentals.length})`} iconPosition="start" sx={{ minWidth: 140 }} />
                        <Tab icon={<MaintenanceIcon />} label={`Maintenance (${maintenance.length})`} iconPosition="start" sx={{ minWidth: 180 }} />
                    </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={8}>
                            <EquipmentInfoCard
                                equipment={equipment}
                                isEditing={isEditing}
                                editData={editData}
                                crew={crew}
                                onUpdate={updateEditData}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <EquipmentStatsCard
                                equipment={equipment}
                                rentals={rentals}
                                maintenance={maintenance}
                                currencyCode={currencyCode}
                            />
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <EquipmentRentalTab rentals={rentals} currency={currencyCode} />
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <EquipmentMaintenanceTab maintenance={maintenance} currency={currencyCode} />
                </TabPanel>
            </Box>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
