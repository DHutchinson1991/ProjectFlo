"use client";

import React from "react";
import {
    Box,
    Card,
    Typography,
} from "@mui/material";
import {
    Inventory as InventoryIcon,
    AttachMoney as MoneyIcon,
    Build as MaintenanceIcon,
    TrendingUp as ValueIcon,
} from "@mui/icons-material";
import { EquipmentByCategory } from "@/features/workflow/equipment/types/equipment.types";
import { useBrand } from "@/features/platform/brand";
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { formatCurrency } from "@/shared/utils/formatUtils";
import { roundMoney } from '@/shared/utils/pricing';

interface EquipmentMetricsProps {
    equipmentByCategory: EquipmentByCategory;
}

export const EquipmentMetrics: React.FC<EquipmentMetricsProps> = ({
    equipmentByCategory,
}) => {
    const { currentBrand } = useBrand();
    const currencyCode = currentBrand?.currency ?? DEFAULT_CURRENCY;

    // Calculate summary statistics
    const allEquipment = Object.values(equipmentByCategory).flatMap(group => group.equipment || []);

    const totalItems = allEquipment.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const totalValue = allEquipment.reduce((sum, item) =>
        sum + roundMoney(parseFloat(String(item.purchase_price || 0)) * (item.quantity || 1)), 0
    );
    const dailyRentalValue = allEquipment.reduce((sum, item) =>
        sum + roundMoney(parseFloat(String(item.rental_price_per_day || 0)) * (item.quantity || 1)), 0
    );
    const maintenanceNeeded = allEquipment.filter(item => {
        if (!item.next_maintenance_due) return false;
        const nextMaintenance = new Date(item.next_maintenance_due);
        const now = new Date();
        const daysUntilMaintenance = Math.ceil((nextMaintenance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilMaintenance <= 30; // Equipment needing maintenance within 30 days
    }).length;

    const summaryCards = [
        {
            title: "Total Equipment",
            value: totalItems.toLocaleString(),
            subtitle: `${Object.keys(equipmentByCategory).length} Categories`,
            icon: InventoryIcon,
            color: "#1976d2",
            gradient: "linear-gradient(135deg, #1976d2 0%, #2196f3 100%)",
            bgGradient: "linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(33, 150, 243, 0.08) 100%)",
        },
        {
            title: "Total Asset Value",
            value: formatCurrency(totalValue, currencyCode),
            subtitle: "Purchase Price Total",
            icon: ValueIcon,
            color: "#388e3c",
            gradient: "linear-gradient(135deg, #388e3c 0%, #4caf50 100%)",
            bgGradient: "linear-gradient(135deg, rgba(56, 142, 60, 0.05) 0%, rgba(76, 175, 80, 0.08) 100%)",
        },
        {
            title: "Daily Rental Value",
            value: formatCurrency(dailyRentalValue, currencyCode),
            subtitle: "Max Daily Income",
            icon: MoneyIcon,
            color: "#f57c00",
            gradient: "linear-gradient(135deg, #f57c00 0%, #ff9800 100%)",
            bgGradient: "linear-gradient(135deg, rgba(245, 124, 0, 0.05) 0%, rgba(255, 152, 0, 0.08) 100%)",
        },
        {
            title: "Maintenance Due",
            value: maintenanceNeeded.toString(),
            subtitle: "Items (Next 30 Days)",
            icon: MaintenanceIcon,
            color: maintenanceNeeded > 0 ? "#d32f2f" : "#388e3c",
            gradient: maintenanceNeeded > 0
                ? "linear-gradient(135deg, #d32f2f 0%, #f44336 100%)"
                : "linear-gradient(135deg, #388e3c 0%, #4caf50 100%)",
            bgGradient: maintenanceNeeded > 0
                ? "linear-gradient(135deg, rgba(211, 47, 47, 0.05) 0%, rgba(244, 67, 54, 0.08) 100%)"
                : "linear-gradient(135deg, rgba(56, 142, 60, 0.05) 0%, rgba(76, 175, 80, 0.08) 100%)",
        },
    ];

    return (
        <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                lg: '1fr 1fr 1fr 1fr'
            },
            gap: 3,
            mb: 4
        }}>
            {summaryCards.map((card, index) => {
                const IconComponent = card.icon;

                return (
                    <Card
                        key={index}
                        elevation={0}
                        sx={{
                            p: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 3,
                            background: card.bgGradient,
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 3,
                            }
                        }}
                    >
                        {/* Background Icon */}
                        <Box sx={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            opacity: 0.1,
                            zIndex: 0
                        }}>
                            <IconComponent sx={{ fontSize: 100, color: card.color }} />
                        </Box>

                        <Box sx={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <Box sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                background: card.gradient,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2,
                                boxShadow: 2
                            }}>
                                <IconComponent sx={{ fontSize: 24, color: 'white' }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    {card.value}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {card.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {card.subtitle}
                                </Typography>
                            </Box>
                        </Box>
                    </Card>
                );
            })}
        </Box>
    );
};
