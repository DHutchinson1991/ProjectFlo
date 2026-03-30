"use client";

import React from "react";
import { Box, Card, Typography, Chip } from "@mui/material";
import { getCategoryIcon, getCategoryColor } from "../constants/categoryConfig";
import { EquipmentCategory, EQUIPMENT_CATEGORY_LABELS } from "../types/equipment.types";
import { hexToRgba } from "@/shared/ui/tasks";
import { useBrand } from "@/features/platform/brand";
import { formatCurrency, DEFAULT_CURRENCY } from "@projectflo/shared";

interface CategoryStat {
    category: string;
    count: number;
    totalValue?: number;
}

interface CategoryCardsGridProps {
    categoryStats: CategoryStat[];
    selectedCategory: string;
    totalCount: number;
    onSelect: (category: string) => void;
}

export const CategoryCardsGrid: React.FC<CategoryCardsGridProps> = ({
    categoryStats,
    selectedCategory,
    onSelect,
}) => {
    const nonEmpty = categoryStats.filter((s) => s.count > 0);
    const { currentBrand } = useBrand();
    const currencyCode = currentBrand?.currency ?? DEFAULT_CURRENCY;

    return (
        <Box sx={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: "1fr",
            gap: 2,
            mb: 4,
        }}>
            {nonEmpty.map((stat) => {
                const color = getCategoryColor(stat.category);
                const IconComponent = getCategoryIcon(stat.category);
                const isSelected = selectedCategory === stat.category;
                const label = EQUIPMENT_CATEGORY_LABELS[stat.category as EquipmentCategory] ?? stat.category;
                const gradient = `linear-gradient(135deg, ${color} 0%, ${hexToRgba(color, 0.7)} 100%)`;
                const hoverColor = hexToRgba(color, 0.2);

                return (
                    <Card
                        key={stat.category}
                        elevation={0}
                        onClick={() => onSelect(isSelected ? "all" : stat.category)}
                        sx={{
                            p: 2.5,
                            border: "2px solid",
                            borderColor: isSelected ? "rgba(255,255,255,0.6)" : "divider",
                            borderRadius: 3,
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            minHeight: "130px",
                            position: "relative",
                            overflow: "hidden",
                            background: gradient,
                            backgroundSize: "200% 200%",
                            opacity: isSelected ? 1 : 0.85,
                            "&:hover": {
                                borderColor: "rgba(255,255,255,0.5)",
                                transform: "translateY(-4px)",
                                boxShadow: `0 8px 25px ${hoverColor}`,
                                opacity: 1,
                                backgroundPosition: "right center",
                            },
                        }}
                    >
                        {/* Background Icon */}
                        <Box sx={{
                            position: "absolute",
                            top: -10,
                            right: -10,
                            opacity: 0.2,
                            zIndex: 0,
                        }}>
                            <IconComponent sx={{ fontSize: 60, color: "white" }} />
                        </Box>

                        {/* Content */}
                        <Box sx={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column" }}>
                            <Typography variant="subtitle2" sx={{
                                fontWeight: 400,
                                color: "white",
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                mb: 0.5,
                            }}>
                                {label}
                            </Typography>

                            <Typography variant="body2" sx={{
                                color: "rgba(255,255,255,0.55)",
                                mb: 2,
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                            }}>
                                {stat.count} {stat.count === 1 ? "item" : "items"}
                            </Typography>

                            <Box sx={{ mt: "auto" }}>
                                <Chip
                                    size="small"
                                    label={stat.totalValue ? formatCurrency(stat.totalValue, currencyCode) : "No value"}
                                    sx={{
                                        bgcolor: "rgba(255,255,255,0.9)",
                                        color: "rgba(0,0,0,0.8)",
                                        fontWeight: 600,
                                        fontSize: "0.75rem",
                                        boxShadow: 1,
                                    }}
                                />
                            </Box>
                        </Box>
                    </Card>
                );
            })}
        </Box>
    );
};
