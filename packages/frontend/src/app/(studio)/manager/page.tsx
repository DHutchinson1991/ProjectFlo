"use client";

import React from "react";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Chip,
} from "@mui/material";
import {
    Security as RolesIcon,
    People as UsersIcon,
    Business as BrandsIcon,
    Assignment as TasksIcon,
    Inventory as EquipmentIcon,
} from "@mui/icons-material";
import Link from "next/link";

export default function ManagerPage() {
    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Manager
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage users, roles, and permissions for your studio
                </Typography>
            </Box>

            {/* Management Cards */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6} lg={4}>
                    <Card
                        elevation={2}
                        sx={{
                            height: "100%",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                                elevation: 4,
                                transform: "translateY(-4px)",
                            },
                        }}
                    >
                        <CardActionArea
                            component={Link}
                            href="/manager/roles"
                            sx={{ height: "100%" }}
                        >
                            <CardContent sx={{ p: 3, height: "100%" }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <RolesIcon
                                        sx={{
                                            fontSize: 32,
                                            color: "primary.main",
                                            mr: 2,
                                        }}
                                    />
                                    <Typography variant="h6" component="h2">
                                        Roles & Permissions
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Define user roles and manage access permissions for different
                                    parts of the studio application.
                                </Typography>
                                <Chip
                                    label="Security"
                                    color="primary"
                                    size="small"
                                    sx={{ mt: 1 }}
                                />
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                    <Card
                        elevation={2}
                        sx={{
                            height: "100%",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                                elevation: 4,
                                transform: "translateY(-4px)",
                            },
                        }}
                    >
                        <CardActionArea
                            component={Link}
                            href="/manager/users"
                            sx={{ height: "100%" }}
                        >
                            <CardContent sx={{ p: 3, height: "100%" }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <UsersIcon
                                        sx={{
                                            fontSize: 32,
                                            color: "secondary.main",
                                            mr: 2,
                                        }}
                                    />
                                    <Typography variant="h6" component="h2">
                                        User Management
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Add, edit, and manage user accounts. Assign roles and monitor
                                    user activity across the platform.
                                </Typography>
                                <Chip
                                    label="Administration"
                                    color="secondary"
                                    size="small"
                                    sx={{ mt: 1 }}
                                />
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                    <Card
                        elevation={2}
                        sx={{
                            height: "100%",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                                elevation: 4,
                                transform: "translateY(-4px)",
                            },
                        }}
                    >
                        <CardActionArea
                            component={Link}
                            href="/manager/brands"
                            sx={{ height: "100%" }}
                        >
                            <CardContent sx={{ p: 3, height: "100%" }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <BrandsIcon
                                        sx={{
                                            fontSize: 32,
                                            color: "success.main",
                                            mr: 2,
                                        }}
                                    />
                                    <Typography variant="h6" component="h2">
                                        Brand Management
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Create and manage brands, configure brand settings, and control
                                    brand access permissions.
                                </Typography>
                                <Chip
                                    label="Multi-tenant"
                                    color="success"
                                    size="small"
                                    sx={{ mt: 1 }}
                                />
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                    <Card
                        elevation={2}
                        sx={{
                            height: "100%",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                                elevation: 4,
                                transform: "translateY(-4px)",
                            },
                        }}
                    >
                        <CardActionArea
                            component={Link}
                            href="/manager/tasks"
                            sx={{ height: "100%" }}
                        >
                            <CardContent sx={{ p: 3, height: "100%" }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <TasksIcon
                                        sx={{
                                            fontSize: 32,
                                            color: "info.main",
                                            mr: 2,
                                        }}
                                    />
                                    <Typography variant="h6" component="h2">
                                        Tasks Library
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Manage task definitions, effort estimates, and skill requirements
                                    organized by project phases.
                                </Typography>
                                <Chip
                                    label="Project Management"
                                    color="info"
                                    size="small"
                                    sx={{ mt: 1 }}
                                />
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                    <Card
                        elevation={2}
                        sx={{
                            height: "100%",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                                elevation: 4,
                                transform: "translateY(-4px)",
                            },
                        }}
                    >
                        <CardActionArea
                            component={Link}
                            href="/manager/equipment"
                            sx={{ height: "100%" }}
                        >
                            <CardContent sx={{ p: 3, height: "100%" }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <EquipmentIcon
                                        sx={{
                                            fontSize: 32,
                                            color: "warning.main",
                                            mr: 2,
                                        }}
                                    />
                                    <Typography variant="h6" component="h2">
                                        Equipment Management
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Manage equipment inventory, track rentals, schedule maintenance,
                                    and monitor equipment condition and availability.
                                </Typography>
                                <Chip
                                    label="Inventory"
                                    color="warning"
                                    size="small"
                                    sx={{ mt: 1 }}
                                />
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>
            </Grid>

            {/* Quick Overview */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Quick Stats
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={1}>
                            <CardContent sx={{ textAlign: "center", py: 2 }}>
                                <Typography variant="h5" color="primary">
                                    0
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Users
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={1}>
                            <CardContent sx={{ textAlign: "center", py: 2 }}>
                                <Typography variant="h5" color="secondary">
                                    0
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Active Roles
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={1}>
                            <CardContent sx={{ textAlign: "center", py: 2 }}>
                                <Typography variant="h5" color="success.main">
                                    0
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Online Now
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={1}>
                            <CardContent sx={{ textAlign: "center", py: 2 }}>
                                <Typography variant="h5" color="warning.main">
                                    0
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Pending Invites
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
