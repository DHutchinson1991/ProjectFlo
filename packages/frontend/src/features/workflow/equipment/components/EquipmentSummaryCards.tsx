"use client";

import React from "react";
import {
    Box,
    Card,
    Typography,
} from "@mui/material";
import {
    Inventory as InventoryIcon,
} from "@mui/icons-material";

interface EquipmentSummaryCardsProps {
    totalEquipment: number;
    categoryStats: Array<{
        category: string;
        label: string;
        count: number;
        totalValue: number;
    }>;
}

export const EquipmentSummaryCards: React.FC<EquipmentSummaryCardsProps> = ({
    totalEquipment,
    categoryStats,
}) => {
    const categoryCount = categoryStats.filter((c) => c.count > 0).length;

    return (
        <Card
            elevation={0}
            sx={{
                p: 3,
                mb: 3,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                background: "linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(33, 150, 243, 0.08) 100%)",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <Box sx={{ position: "absolute", top: -20, right: -20, opacity: 0.1 }}>
                <InventoryIcon sx={{ fontSize: 120, color: "primary.main" }} />
            </Box>
            <Box sx={{ position: "relative", display: "flex", alignItems: "center", gap: 3 }}>
                <Box sx={{
                    width: 56, height: 56, borderRadius: 2, flexShrink: 0,
                    background: "linear-gradient(135deg, #1976d2 0%, #2196f3 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center", boxShadow: 2,
                }}>
                    <InventoryIcon sx={{ fontSize: 28, color: "white" }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight={700}>Equipment Library</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {categoryCount} {categoryCount === 1 ? "category" : "categories"} · studio inventory
                    </Typography>
                </Box>
                <Typography variant="h2" sx={{
                    fontWeight: 800,
                    lineHeight: 1,
                    background: "linear-gradient(135deg, #1976d2 0%, #2196f3 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                }}>
                    {totalEquipment}
                </Typography>
            </Box>
        </Card>
    );
};
