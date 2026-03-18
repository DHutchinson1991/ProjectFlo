"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Divider,
    Tooltip,
    CircularProgress,
} from "@mui/material";
import {
    Notifications as NotificationIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
} from "@mui/icons-material";
import { useAuth } from "../../providers/AuthProvider";
import { BrandSelector } from "../../components/BrandSelector";

export default function StudioHeader() {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleClose();
        logout();
        // Explicitly redirect to login page
        router.push('/login');
    };

    const handleNavigateToSettings = () => {
        handleClose();
        router.push('/settings');
    };

    // Generate initials from user first and last name - same logic as user management table
    const getUserInitials = (firstName?: string, lastName?: string) => {
        const first = firstName?.charAt(0) || "";
        const last = lastName?.charAt(0) || "";
        return `${first}${last}`.toUpperCase();
    };

    const getUserDisplayName = (firstName?: string, lastName?: string, email?: string) => {
        // If we have both first and last name, use them
        if (firstName && lastName) {
            return `${firstName} ${lastName}`;
        }
        // If we have only first name or only last name
        if (firstName || lastName) {
            return firstName || lastName || "";
        }
        // Fall back to email username if no name is available
        if (email) {
            const username = email.split("@")[0];
            // Convert email username (e.g. john.doe) to capitalized name (e.g. John Doe)
            return username
                .replace(/[._]/g, " ")
                .split(" ")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
        }
        return "User";
    };

    // Get current date in a nice format
    const getCurrentDay = () => {
        const today = new Date();
        return today.getDate().toString();
    };

    const handleNavigateToCalendar = () => {
        router.push('/calendar');
    };

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                bgcolor: "background.paper",
                borderBottom: 1,
                borderColor: "divider",
                zIndex: 1300, // Higher than sidebar
                backdropFilter: "blur(20px)",
                background: "rgba(18, 18, 18, 0.8)",
            }}
        >
            <Toolbar sx={{ minHeight: 64 }}>
                <Box sx={{ flexGrow: 0 }}>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            fontWeight: 600,
                            fontSize: "1.375rem",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                        }}
                    >
                        <Box
                            component="span"
                            sx={{
                                background: "linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)",
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                fontWeight: 700,
                            }}
                        >
                            ProjectFlo
                        </Box>
                        <Box
                            component="span"
                            sx={{
                                color: "text.secondary",
                                fontWeight: 400,
                                fontSize: "1.125rem",
                            }}
                        >
                            Studio
                        </Box>
                    </Typography>
                </Box>

                {/* Brand Selector */}
                <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", mx: 3 }}>
                    <BrandSelector />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {/* Calendar Button */}
                    <Tooltip title="Go to Calendar" arrow>
                        <Box
                            onClick={handleNavigateToCalendar}
                            sx={{
                                position: "relative",
                                width: 40,
                                height: 40,
                                cursor: "pointer",
                                borderRadius: 2,
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                "&:hover": {
                                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                                    transform: "translateY(-1px)",
                                },
                            }}
                        >
                            {/* Calendar Outline */}
                            <Box
                                sx={{
                                    position: "relative",
                                    width: 28,
                                    height: 28,
                                    border: "2px solid",
                                    borderColor: "text.secondary",
                                    borderRadius: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {/* Calendar Top Line */}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: 4,
                                        left: 4,
                                        right: 4,
                                        height: "1px",
                                        backgroundColor: "text.secondary",
                                    }}
                                />

                                {/* Calendar Rings */}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: -4,
                                        left: 6,
                                        width: "2px",
                                        height: 8,
                                        backgroundColor: "text.secondary",
                                        borderRadius: 1,
                                    }}
                                />
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: -4,
                                        right: 6,
                                        width: "2px",
                                        height: 8,
                                        backgroundColor: "text.secondary",
                                        borderRadius: 1,
                                    }}
                                />

                                {/* Day Number */}
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "text.primary",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        lineHeight: 1,
                                        mt: 0.5,
                                    }}
                                >
                                    {getCurrentDay()}
                                </Typography>
                            </Box>
                        </Box>
                    </Tooltip>

                    <IconButton
                        size="large"
                        aria-label="notifications"
                        color="inherit"
                        sx={{ color: "text.secondary" }}
                    >
                        <NotificationIcon />
                    </IconButton>

                    {/* User Info Section with Clickable Avatar */}
                    {isLoading ? (
                        <CircularProgress size={24} sx={{ color: "text.secondary" }} />
                    ) : user ? (
                        <Tooltip title="Account settings" arrow>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    cursor: "pointer",
                                    borderRadius: 2,
                                    padding: 1,
                                    transition: "background-color 0.2s",
                                    "&:hover": {
                                        backgroundColor: "action.hover",
                                    },
                                }}
                                onClick={handleMenu}
                                aria-label="account menu"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                            >
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "text.primary",
                                            fontWeight: 500,
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {getUserDisplayName(user.first_name, user.last_name, user.email)}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: "text.secondary",
                                            lineHeight: 1,
                                        }}
                                    >
                                        {user.email}
                                    </Typography>
                                </Box>
                                <Avatar
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: "primary.main",
                                        fontSize: "0.875rem",
                                        fontWeight: 600,
                                    }}
                                >
                                    {getUserInitials(user.first_name, user.last_name)}
                                </Avatar>
                            </Box>
                        </Tooltip>
                    ) : null}

                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "right",
                        }}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                        PaperProps={{
                            elevation: 3,
                            sx: {
                                minWidth: '200px',
                                mt: 1,
                                borderRadius: 2,
                                padding: '4px 0'
                            }
                        }}
                    >
                        <MenuItem onClick={handleNavigateToSettings}>
                            <SettingsIcon fontSize="small" sx={{ mr: 1.5 }} />
                            Settings
                        </MenuItem>
                        <Divider sx={{ my: 1 }} />
                        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                            Logout
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
