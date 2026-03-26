"use client";

import React from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Stack,
    Divider,
    Button,
} from "@mui/material";
import {
    TrendingUp as TrendingUpIcon,
    AttachMoney as MoneyIcon,
    CalendarToday as CalendarIcon,
    Assignment as RentalIcon,
} from "@mui/icons-material";
import {
    Equipment,
    EquipmentRental,
    EquipmentMaintenance,
} from "@/features/workflow/equipment/types/equipment.types";
import { formatCurrency } from "@/lib/utils/formatUtils";

interface EquipmentStatsCardProps {
    equipment: Equipment;
    rentals: EquipmentRental[];
    maintenance: EquipmentMaintenance[];
    currencyCode: string;
}

export function EquipmentStatsCard({ equipment, rentals, maintenance, currencyCode }: EquipmentStatsCardProps) {
    return (
        <Card
            sx={{
                borderRadius: 3,
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                border: "1px solid rgba(52, 58, 68, 0.3)",
                background: "rgba(16, 18, 22, 0.95)",
                backdropFilter: "blur(10px)",
                height: "fit-content",
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2.5 }}>
                    <TrendingUpIcon sx={{ mr: 1.5, color: "#6b7280", fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#d1d5db" }}>
                        Quick Stats
                    </Typography>
                </Box>
                <Stack spacing={2}>
                    {[
                        {
                            label: "Purchase Price",
                            value: equipment.purchase_price ? formatCurrency(Number(equipment.purchase_price), currencyCode) : "N/A",
                            color: "#10b981",
                        },
                        { label: "Total Rentals", value: rentals.length, color: "#60a5fa" },
                        { label: "Active Rentals", value: rentals.filter((r) => r.status === "Active").length, color: "#f59e0b" },
                        { label: "Maintenance", value: maintenance.length, color: "#a78bfa" },
                    ].map(({ label, value, color }) => (
                        <Box
                            key={label}
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                py: 1.5,
                                px: 2,
                                borderRadius: 1.5,
                                background: "rgba(30, 41, 59, 0.4)",
                                border: "1px solid rgba(52, 58, 68, 0.2)",
                            }}
                        >
                            <Typography variant="body2" sx={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                                {label}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color }}>
                                {value}
                            </Typography>
                        </Box>
                    ))}

                    <Divider sx={{ my: 1.5, borderColor: "rgba(52, 58, 68, 0.3)" }} />

                    <Stack spacing={1.5}>
                        <Typography
                            variant="caption"
                            sx={{ fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}
                        >
                            Quick Actions
                        </Typography>
                        <Button
                            fullWidth
                            size="small"
                            startIcon={<CalendarIcon sx={{ fontSize: 16 }} />}
                            sx={{
                                py: 1,
                                borderRadius: 1.5,
                                color: "#9ca3af",
                                backgroundColor: "rgba(30, 41, 59, 0.4)",
                                border: "1px solid rgba(52, 58, 68, 0.2)",
                                fontSize: "0.8rem",
                                textTransform: "none",
                                "&:hover": { background: "rgba(52, 58, 68, 0.4)", color: "#d1d5db", borderColor: "rgba(75, 85, 99, 0.4)" },
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
                                color: "#9ca3af",
                                backgroundColor: "rgba(30, 41, 59, 0.4)",
                                border: "1px solid rgba(52, 58, 68, 0.2)",
                                fontSize: "0.8rem",
                                textTransform: "none",
                                "&:hover": { background: "rgba(52, 58, 68, 0.4)", color: "#d1d5db", borderColor: "rgba(75, 85, 99, 0.4)" },
                            }}
                        >
                            Create Rental
                        </Button>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}
