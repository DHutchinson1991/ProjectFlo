"use client";

import React from "react";
import {
    Box,
    Card,
    Typography,
} from "@mui/material";
import {
    Inventory as InventoryIcon,
    Add as AddIcon,
} from "@mui/icons-material";

interface EquipmentSummaryCardsProps {
    totalEquipment: number;
    totalAvailable: number;
    categoryStats: Array<{
        category: string;
        count: number;
        availableCount: number;
        totalValue: number;
    }>;
}

export const EquipmentSummaryCards: React.FC<EquipmentSummaryCardsProps> = ({
    totalEquipment,
    totalAvailable,
}) => {
    const totalNeedsAttention = totalEquipment - totalAvailable;

    return (
        <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
            mb: 3
        }}>
            {/* Equipment Summary Card */}
            <Card
                elevation={0}
                sx={{
                    p: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(33, 150, 243, 0.08) 100%)',
                    position: 'relative',
                    overflow: 'hidden'
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
                    <InventoryIcon sx={{ fontSize: 120, color: 'primary.main' }} />
                </Box>

                <Box sx={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Box sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 3,
                        boxShadow: 2
                    }}>
                        <InventoryIcon sx={{ fontSize: 28, color: 'white' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                            Equipment
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Studio inventory management
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {totalAvailable} available • {totalNeedsAttention} needs attention
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h2" sx={{
                            fontWeight: 800,
                            lineHeight: 1,
                            background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                            mr: 1
                        }}>
                            {totalEquipment}
                        </Typography>
                    </Box>
                </Box>
            </Card>

            {/* Feature Placeholder Card */}
            <Card
                elevation={0}
                sx={{
                    p: 4,
                    border: '1px dashed',
                    borderColor: 'grey.300',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(158, 158, 158, 0.05) 0%, rgba(189, 189, 189, 0.08) 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: 0.7,
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
                    <AddIcon sx={{ fontSize: 120, color: 'grey.400' }} />
                </Box>

                <Box sx={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Box sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #757575 0%, #9e9e9e 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 3,
                        boxShadow: 1
                    }}>
                        <AddIcon sx={{ fontSize: 28, color: 'white' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: 'grey.600' }}>
                            Coming Soon
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            New feature placeholder
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            More analytics • Enhanced insights
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h2" sx={{
                            fontWeight: 800,
                            lineHeight: 1,
                            color: 'grey.400',
                            mr: 1
                        }}>
                            ?
                        </Typography>
                    </Box>
                </Box>
            </Card>
        </Box>
    );
};
