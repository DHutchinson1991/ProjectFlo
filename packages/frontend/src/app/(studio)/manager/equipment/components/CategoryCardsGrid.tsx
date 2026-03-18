"use client";

import React from "react";
import {
    Box,
    Card,
    Typography,
    Chip,
    LinearProgress,
} from "@mui/material";
import { Equipment } from "@/lib/types";
import { getCategoryIcon, getCategoryColor } from "../utils/categoryConfig";
import { useBrand } from "@/app/providers/BrandProvider";
import { formatCurrency } from "@/lib/utils/formatUtils";

interface CategoryCardsGridProps {
    categoryStats: Array<{
        category: string;
        label: string;
        count: number;
        availableCount: number;
        totalValue: number;
    }>;
    equipmentByCategory: Record<string, Equipment[]>;
    onCategoryCardClick: (category: string) => void;
}

export const CategoryCardsGrid: React.FC<CategoryCardsGridProps> = ({
    categoryStats,
    onCategoryCardClick,
}) => {
    const { currentBrand } = useBrand();
    const currencyCode = currentBrand?.currency || 'USD';

    return (
        <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(4, 1fr)',
                lg: 'repeat(6, 1fr)',
            },
            gap: 2,
            mb: 4,
        }}>
            {categoryStats.filter(stat => stat.count > 0).map((stat) => {
                const availabilityRate = stat.count > 0 ? (stat.availableCount / stat.count) * 100 : 0;
                const categoryColor = getCategoryColor(stat.category);
                const IconComponent = getCategoryIcon(stat.category);

                return (
                    <Card
                        key={stat.category}
                        elevation={0}
                        sx={{
                            p: 2.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 3,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                                borderColor: categoryColor,
                                boxShadow: `0 4px 20px ${categoryColor}20`,
                                transform: 'translateY(-2px)',
                            },
                        }}
                        onClick={() => onCategoryCardClick(stat.category)}
                    >
                        {/* Background Pattern */}
                        <Box sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 60,
                            height: 60,
                            background: `linear-gradient(135deg, ${categoryColor}10, ${categoryColor}05)`,
                            borderRadius: '0 0 0 60px',
                        }} />

                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            {/* Header */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                <Box sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 2,
                                    color: 'white',
                                }}>
                                    <IconComponent sx={{ fontSize: 20 }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, color: 'white', fontSize: '0.95rem' }}>
                                        {stat.label}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        {stat.count} {stat.count === 1 ? 'item' : 'items'}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Availability Status */}
                            <Box sx={{ mb: 1.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        Availability
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                        {availabilityRate.toFixed(0)}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={availabilityRate}
                                    sx={{
                                        height: 5,
                                        borderRadius: 3,
                                        backgroundColor: 'grey.200',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 3,
                                            backgroundColor: categoryColor,
                                        },
                                    }}
                                />
                            </Box>

                            {/* Stats */}
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                <Chip
                                    label={`${stat.availableCount} Available`}
                                    size="small"
                                    sx={{
                                        backgroundColor: `${categoryColor}15`,
                                        color: categoryColor,
                                        fontWeight: 600,
                                        fontSize: '0.7rem',
                                        height: 24,
                                    }}
                                />
                                {stat.totalValue > 0 && (
                                    <Chip
                                        label={formatCurrency(stat.totalValue, currencyCode)}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            borderColor: categoryColor,
                                            color: categoryColor,
                                            fontSize: '0.7rem',
                                            height: 24,
                                        }}
                                    />
                                )}
                            </Box>
                        </Box>
                    </Card>
                );
            })}
        </Box>
    );
};
