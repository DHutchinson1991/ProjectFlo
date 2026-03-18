"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    Box,
    Button,
    Menu,
    MenuItem,
    Typography,
    Avatar,
    Divider,
    Stack,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    Alert,
} from "@mui/material";
import {
    Business as BusinessIcon,
    KeyboardArrowDown as ArrowDownIcon,
    Launch as LaunchIcon,
    Check as CheckIcon,
} from "@mui/icons-material";
import { useBrand } from "../providers/BrandProvider";

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

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleBrandSwitch = async (brandId: number) => {
        try {
            await switchBrand(brandId);
            handleClose();
        } catch (error) {
            console.error("Failed to switch brand:", error);
        }
    };

    // Brand avatar component
    const BrandAvatar = ({ brand }: { brand: any }) => (
        <Avatar
            sx={{
                width: 24,
                height: 24,
                bgcolor: "primary.main",
                fontSize: 12,
                fontWeight: "bold",
            }}
        >
            {brand.name.charAt(0).toUpperCase()}
        </Avatar>
    );

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", minWidth: 120 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" sx={{ ml: 1 }}>
                    Loading...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ minWidth: 200 }}>
                Failed to load brands
            </Alert>
        );
    }

    if (!availableBrands || availableBrands.length === 0) {
        return (
            <Alert severity="info" sx={{ minWidth: 200 }}>
                No brands available
            </Alert>
        );
    }

    return (
        <Box className={className}>
            <Button
                onClick={handleClick}
                variant="outlined"
                size={size}
                endIcon={<ArrowDownIcon />}
                sx={{
                    minWidth: 160,
                    justifyContent: "space-between",
                    textTransform: "none",
                    borderColor: "divider",
                    color: "text.primary",
                    bgcolor: "background.paper",
                    "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: "action.hover",
                    },
                    "& .MuiButton-endIcon": {
                        marginLeft: "auto",
                    },
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                    {currentBrand ? (
                        <>
                            <BrandAvatar brand={currentBrand} />
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 500,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: 100,
                                }}
                            >
                                {currentBrand.name}
                            </Typography>
                        </>
                    ) : (
                        <>
                            <BusinessIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                            <Typography variant="body2" color="text.secondary">
                                Select Brand
                            </Typography>
                        </>
                    )}
                </Stack>
            </Button>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                PaperProps={{
                    sx: {
                        minWidth: 220,
                        mt: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        boxShadow: 3,
                    },
                }}
            >
                {/* Current Brand Section */}
                {currentBrand && (
                    <>
                        <Box sx={{ px: 2, py: 1, bgcolor: "action.hover" }}>
                            <Typography variant="overline" color="text.secondary">
                                Current Brand
                            </Typography>
                        </Box>
                        <MenuItem
                            component={Link}
                            href={`/studio/brands/${currentBrand.id}`}
                            onClick={handleClose}
                            sx={{
                                py: 1.5,
                                "&:hover": {
                                    bgcolor: "primary.50",
                                },
                            }}
                        >
                            <ListItemIcon>
                                <BrandAvatar brand={currentBrand} />
                            </ListItemIcon>
                            <ListItemText
                                primary={currentBrand.name}
                                secondary={currentBrand.description || "Brand Overview"}
                                primaryTypographyProps={{
                                    fontWeight: 600,
                                    variant: "body2",
                                }}
                                secondaryTypographyProps={{
                                    variant: "caption",
                                    color: "text.secondary",
                                }}
                            />
                            <LaunchIcon sx={{ fontSize: 16, color: "text.secondary", ml: 1 }} />
                        </MenuItem>
                        <Divider />
                    </>
                )}

                {/* Brand Switcher Section */}
                <Box sx={{ px: 2, py: 1, bgcolor: "action.hover" }}>
                    <Typography variant="overline" color="text.secondary">
                        Switch Brand
                    </Typography>
                </Box>
                {availableBrands.map((brand) => (
                    <MenuItem
                        key={brand.id}
                        onClick={() => handleBrandSwitch(brand.id)}
                        selected={currentBrand?.id === brand.id}
                        sx={{
                            py: 1.5,
                            "&:hover": {
                                bgcolor: "action.hover",
                            },
                            "&.Mui-selected": {
                                bgcolor: "primary.50",
                                "&:hover": {
                                    bgcolor: "primary.100",
                                },
                            },
                        }}
                    >
                        <ListItemIcon>
                            <BrandAvatar brand={brand} />
                        </ListItemIcon>
                        <ListItemText
                            primary={brand.name}
                            secondary={brand.description || "Brand"}
                            primaryTypographyProps={{
                                fontWeight: currentBrand?.id === brand.id ? 600 : 400,
                                variant: "body2",
                            }}
                            secondaryTypographyProps={{
                                variant: "caption",
                                color: "text.secondary",
                            }}
                        />
                        {currentBrand?.id === brand.id && (
                            <CheckIcon sx={{ fontSize: 16, color: "primary.main", ml: 1 }} />
                        )}
                    </MenuItem>
                ))}

                {/* Brand Management Section */}
                <Divider />
                <MenuItem
                    component={Link}
                    href="/studio/brands"
                    onClick={handleClose}
                    sx={{
                        py: 1.5,
                        color: "text.secondary",
                        "&:hover": {
                            bgcolor: "action.hover",
                            color: "text.primary",
                        },
                    }}
                >
                    <ListItemIcon>
                        <BusinessIcon sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Manage Brands"
                        primaryTypographyProps={{
                            variant: "body2",
                            fontWeight: 500,
                        }}
                    />
                    <LaunchIcon sx={{ fontSize: 16, ml: 1 }} />
                </MenuItem>
            </Menu>
        </Box>
    );
}

export default BrandSelector;
