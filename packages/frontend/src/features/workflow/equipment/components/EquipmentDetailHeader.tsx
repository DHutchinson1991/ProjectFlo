"use client";

import React from "react";
import {
    Box,
    Typography,
    Button,
    Avatar,
    Stack,
    Chip,
    Breadcrumbs,
    Link,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    PhotoCamera as CameraIcon,
} from "@mui/icons-material";
import {
    Equipment,
    EQUIPMENT_AVAILABILITY_COLORS,
    EQUIPMENT_CONDITION_COLORS,
} from "@/features/workflow/equipment/types/equipment.types";
import { formatCurrency } from "@/shared/utils/formatUtils";

interface EquipmentDetailHeaderProps {
    equipment: Equipment;
    isEditing: boolean;
    currencyCode: string;
    onStartEdit: () => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onBack: () => void;
    onBackToResources: () => void;
}

export function EquipmentDetailHeader({
    equipment,
    isEditing,
    currencyCode,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onBack,
    onBackToResources,
}: EquipmentDetailHeaderProps) {

    return (
        <Box sx={{ mb: 3, overflow: "hidden" }}>
            <Box sx={{ p: 3 }}>
                {/* Avatar + name row */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                    <Box sx={{ position: "relative", mr: 4 }}>
                        <Avatar
                            sx={{
                                width: 72,
                                height: 72,
                                background: "rgba(52, 58, 68, 0.8)",
                                border: "2px solid rgba(156, 163, 175, 0.2)",
                                backdropFilter: "blur(8px)",
                            }}
                        >
                            <CameraIcon sx={{ fontSize: 32, color: "#9ca3af" }} />
                        </Avatar>
                        <Box
                            sx={{
                                position: "absolute",
                                bottom: -4,
                                right: -4,
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                backgroundColor: EQUIPMENT_CONDITION_COLORS[equipment.condition],
                                border: "3px solid rgba(16, 18, 22, 0.95)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    backgroundColor: "white",
                                    opacity: 0.9,
                                }}
                            />
                        </Box>
                    </Box>

                    <Box flex={1}>
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{ fontWeight: 800, color: "#f8fafc", mb: 0.5, letterSpacing: "-0.025em" }}
                        >
                            {equipment.item_name}
                        </Typography>
                        <Typography
                            variant="subtitle1"
                            sx={{ color: "#9ca3af", fontWeight: 500, mb: 3, fontSize: "1.1rem" }}
                        >
                            {equipment.brand_name} {equipment.model}
                        </Typography>

                        <Stack direction="row" spacing={2}>
                            <Chip
                                label={equipment.availability_status}
                                size="small"
                                sx={{
                                    backgroundColor: alpha(EQUIPMENT_AVAILABILITY_COLORS[equipment.availability_status], 0.15),
                                    color: EQUIPMENT_AVAILABILITY_COLORS[equipment.availability_status],
                                    border: `1px solid ${alpha(EQUIPMENT_AVAILABILITY_COLORS[equipment.availability_status], 0.3)}`,
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                    height: 28,
                                    "& .MuiChip-label": { px: 1.5 },
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
                                    fontSize: "0.75rem",
                                    height: 28,
                                    backgroundColor: alpha(EQUIPMENT_CONDITION_COLORS[equipment.condition], 0.05),
                                    "& .MuiChip-label": { px: 1.5 },
                                }}
                            />
                            <Chip
                                label={`${formatCurrency(Number(equipment.rental_price_per_day || 0), currencyCode)}/day`}
                                size="small"
                                sx={{
                                    backgroundColor: "rgba(52, 58, 68, 0.4)",
                                    color: "#d1d5db",
                                    border: "1px solid rgba(75, 85, 99, 0.3)",
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                    height: 28,
                                    "& .MuiChip-label": { px: 1.5 },
                                }}
                            />
                        </Stack>
                    </Box>
                </Box>

                {/* Breadcrumbs + edit buttons */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Breadcrumbs sx={{ opacity: 0.7 }}>
                        <Link
                            color="inherit"
                            onClick={onBackToResources}
                            sx={{ cursor: "pointer", "&:hover": { color: "primary.main" }, transition: "color 0.2s" }}
                        >
                            Manager
                        </Link>
                        <Link
                            color="inherit"
                            onClick={onBack}
                            sx={{ cursor: "pointer", "&:hover": { color: "primary.main" }, transition: "color 0.2s" }}
                        >
                            Equipment
                        </Link>
                        <Typography color="text.primary" fontWeight={600}>
                            {equipment.item_name}
                        </Typography>
                    </Breadcrumbs>

                    <Box display="flex" gap={1.5} alignItems="center">
                        {isEditing ? (
                            <>
                                <Button
                                    startIcon={<SaveIcon />}
                                    onClick={onSaveEdit}
                                    variant="contained"
                                    size="small"
                                    sx={{
                                        background: "rgba(16, 185, 129, 0.2)",
                                        color: "#10b981",
                                        border: "1px solid rgba(16, 185, 129, 0.3)",
                                        "&:hover": { background: "rgba(16, 185, 129, 0.3)", borderColor: "rgba(16, 185, 129, 0.5)", transform: "translateY(-1px)" },
                                        transition: "all 0.2s",
                                        borderRadius: 1.5,
                                        px: 2,
                                        py: 1,
                                        textTransform: "none",
                                        fontWeight: 600,
                                    }}
                                >
                                    Save
                                </Button>
                                <Button
                                    startIcon={<CancelIcon />}
                                    onClick={onCancelEdit}
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                        borderColor: "rgba(239, 68, 68, 0.4)",
                                        color: "#ef4444",
                                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                                        "&:hover": { background: "rgba(239, 68, 68, 0.2)", borderColor: "rgba(239, 68, 68, 0.6)", transform: "translateY(-1px)" },
                                        transition: "all 0.2s",
                                        borderRadius: 1.5,
                                        px: 2,
                                        py: 1,
                                        textTransform: "none",
                                        fontWeight: 600,
                                    }}
                                >
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <Button
                                startIcon={<EditIcon />}
                                onClick={onStartEdit}
                                variant="contained"
                                size="small"
                                sx={{
                                    background: "rgba(52, 58, 68, 0.6)",
                                    color: "#d1d5db",
                                    border: "1px solid rgba(75, 85, 99, 0.4)",
                                    "&:hover": { background: "rgba(75, 85, 99, 0.6)", borderColor: "rgba(107, 114, 128, 0.6)", transform: "translateY(-1px)" },
                                    transition: "all 0.2s",
                                    borderRadius: 1.5,
                                    px: 2,
                                    py: 1,
                                    textTransform: "none",
                                    fontWeight: 600,
                                }}
                            >
                                Edit
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
