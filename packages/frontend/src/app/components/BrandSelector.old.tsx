"use client";

import React, { useState } from "react";
import {
    Select,
    MenuItem,
    FormControl,
    Box,
    Typography,
    Avatar,
    CircularProgress,
    Chip,
    Alert,
    Button,
    ButtonGroup,
    Paper,
    Divider,
    Tooltip,
} from "@mui/material";
import { 
    Business, 
    OpenInNew as OpenIcon,
    ArrowDropDown as ArrowDropDownIcon,
} from "@mui/icons-material";
import { useBrand } from "../providers/BrandProvider";
import { useRouter } from "next/navigation";

interface BrandSelectorProps {
    variant?: "header" | "standalone";
    size?: "small" | "medium";
    showLabel?: boolean;
    className?: string;
}

export function BrandSelector({
    variant = "header",
    size = "medium",
    showLabel = false,
    className,
}: BrandSelectorProps) {
    const {
        currentBrand,
        availableBrands,
        isLoading,
        error,
        switchBrand,
        isBrandSelected,
    } = useBrand();
    
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);

    const handleBrandChange = async (brandId: number) => {
        if (brandId === currentBrand?.id) return;

        try {
            await switchBrand(brandId);
        } catch (err) {
            // Error is already handled in the context
            console.error("Failed to switch brand:", err);
        }
    };

    const handleBrandPageClick = () => {
        if (currentBrand?.id) {
            router.push(`/manager/brands/${currentBrand.id}`);
        }
    };

    if (error) {
        return (
            <Alert severity="error" sx={{ maxWidth: 300 }}>
                {error}
            </Alert>
        );
    }

    if (!isBrandSelected && availableBrands.length === 0 && !isLoading) {
        return (
            <Alert severity="warning" sx={{ maxWidth: 300 }}>
                No brands available
            </Alert>
        );
    }

    const isHeaderVariant = variant === "header";

    return (
        <Box className={className}>
            {showLabel && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1, fontSize: "0.875rem" }}
                >
                    Current Brand
                </Typography>
            )}

            <Paper
                elevation={isHovered ? 4 : 1}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                sx={{
                    transition: "all 0.2s ease-in-out",
                    borderRadius: 2,
                    overflow: "hidden",
                    background: isHeaderVariant 
                        ? "rgba(255, 255, 255, 0.1)" 
                        : "background.paper",
                    backdropFilter: isHeaderVariant ? "blur(10px)" : "none",
                    border: isHeaderVariant 
                        ? "1px solid rgba(255, 255, 255, 0.2)" 
                        : "1px solid",
                    borderColor: isHeaderVariant 
                        ? "rgba(255, 255, 255, 0.2)" 
                        : "divider",
                    minWidth: isHeaderVariant ? 280 : 320,
                    maxWidth: isHeaderVariant ? 400 : 500,
                    transform: isHovered ? "translateY(-1px)" : "none",
                }}
            >
                {currentBrand ? (
                    <ButtonGroup 
                        variant="text" 
                        size={size}
                        sx={{ 
                            width: "100%",
                            "& .MuiButton-root": {
                                textTransform: "none",
                                justifyContent: "flex-start",
                            }
                        }}
                    >
                        {/* Brand Page Navigation Button */}
                        <Button
                            onClick={handleBrandPageClick}
                            sx={{
                                flex: 1,
                                py: isHeaderVariant ? 1 : 1.5,
                                px: 2,
                                color: isHeaderVariant ? "white" : "text.primary",
                                "&:hover": {
                                    backgroundColor: isHeaderVariant 
                                        ? "rgba(255, 255, 255, 0.1)" 
                                        : "action.hover",
                                },
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                minHeight: isHeaderVariant ? 48 : 56,
                            }}
                        >
                            <Avatar
                                src={currentBrand.logo_url}
                                sx={{
                                    width: isHeaderVariant ? 28 : 36,
                                    height: isHeaderVariant ? 28 : 36,
                                    bgcolor: "primary.main",
                                    border: isHeaderVariant 
                                        ? "2px solid rgba(255, 255, 255, 0.3)" 
                                        : "2px solid",
                                    borderColor: isHeaderVariant 
                                        ? "rgba(255, 255, 255, 0.3)" 
                                        : "divider",
                                }}
                            >
                                <Business fontSize="small" />
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                                <Typography
                                    variant={isHeaderVariant ? "body2" : "body1"}
                                    sx={{
                                        fontWeight: 600,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        color: "inherit",
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {currentBrand.display_name || currentBrand.name}
                                </Typography>
                                {!isHeaderVariant && currentBrand.business_type && (
                                    <Typography
                                        variant="caption"
                                        sx={{ 
                                            color: isHeaderVariant 
                                                ? "rgba(255, 255, 255, 0.7)" 
                                                : "text.secondary",
                                            display: "block",
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {currentBrand.business_type}
                                    </Typography>
                                )}
                            </Box>
                            <Tooltip title="Go to brand page">
                                <OpenIcon 
                                    fontSize="small" 
                                    sx={{ 
                                        opacity: 0.7,
                                        color: isHeaderVariant 
                                            ? "rgba(255, 255, 255, 0.8)" 
                                            : "text.secondary",
                                    }} 
                                />
                            </Tooltip>
                        </Button>

                        {/* Brand Switcher Dropdown */}
                        {availableBrands.length > 1 && (
                            <>
                                <Divider 
                                    orientation="vertical" 
                                    flexItem 
                                    sx={{ 
                                        borderColor: isHeaderVariant 
                                            ? "rgba(255, 255, 255, 0.2)" 
                                            : "divider",
                                    }} 
                                />
                                <FormControl size={size} sx={{ minWidth: 60 }}>
                                    <Select
                                        value={currentBrand?.id || ""}
                                        onChange={(e) => handleBrandChange(Number(e.target.value))}
                                        disabled={isLoading}
                                        IconComponent={isLoading ? () => <CircularProgress size={16} /> : ArrowDropDownIcon}
                                        displayEmpty
                                        renderValue={() => null}
                                        sx={{
                                            "& .MuiSelect-select": {
                                                py: isHeaderVariant ? 1 : 1.5,
                                                px: 1,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                minHeight: isHeaderVariant ? 48 : 56,
                                                color: isHeaderVariant ? "white" : "text.primary",
                                            },
                                            "& .MuiOutlinedInput-notchedOutline": {
                                                border: "none",
                                            },
                                            "&:hover": {
                                                backgroundColor: isHeaderVariant 
                                                    ? "rgba(255, 255, 255, 0.1)" 
                                                    : "action.hover",
                                            },
                                        }}
                                    >
                                        {availableBrands.map((brand) => (
                                            <MenuItem 
                                                key={brand.id} 
                                                value={brand.id}
                                                sx={{
                                                    minHeight: 64,
                                                    py: 1,
                                                }}
                                            >
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                                                    <Avatar
                                                        src={brand.logo_url}
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            bgcolor: brand.id === currentBrand?.id ? "primary.main" : "grey.300",
                                                        }}
                                                    >
                                                        <Business fontSize="small" />
                                                    </Avatar>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {brand.display_name || brand.name}
                                                        </Typography>
                                                        {brand.business_type && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {brand.business_type}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    {brand.id === currentBrand?.id && (
                                                        <Chip
                                                            label="Current"
                                                            size="small"
                                                            color="primary"
                                                            sx={{ fontSize: "0.75rem" }}
                                                        />
                                                    )}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </>
                        )}
                    </ButtonGroup>
                ) : (
                    <Box sx={{ p: 2, textAlign: "center" }}>
                        <Business 
                            fontSize="large" 
                            sx={{ 
                                color: isHeaderVariant 
                                    ? "rgba(255, 255, 255, 0.5)" 
                                    : "text.secondary",
                                mb: 1,
                            }} 
                        />
                        <Typography 
                            variant="body2"
                            sx={{ 
                                color: isHeaderVariant 
                                    ? "rgba(255, 255, 255, 0.7)" 
                                    : "text.secondary",
                            }}
                        >
                            {isLoading ? "Loading brands..." : "No brand selected"}
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}
