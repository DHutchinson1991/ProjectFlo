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
    Groups as CrewIcon,
    LocationOn as LocationsIcon,
    Inventory as EquipmentIcon,
} from "@mui/icons-material";
import Link from "next/link";

export default function ResourcesHubScreen() {
    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Resources
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage your crew, locations, and equipment inventory.
                </Typography>
            </Box>

            {/* Resource Cards */}
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
                            href="/manager/crew"
                            sx={{ height: "100%" }}
                        >
                            <CardContent sx={{ p: 3, height: "100%" }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <CrewIcon
                                        sx={{
                                            fontSize: 32,
                                            color: "info.main",
                                            mr: 2,
                                        }}
                                    />
                                    <Typography variant="h6" component="h2">
                                        Crew Management
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Manage crew members and configure payment brackets for each role.
                                </Typography>
                                <Chip
                                    label="Crew"
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
                            href="/resources/locations"
                            sx={{ height: "100%" }}
                        >
                            <CardContent sx={{ p: 3, height: "100%" }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <LocationsIcon
                                        sx={{
                                            fontSize: 32,
                                            color: "success.main",
                                            mr: 2,
                                        }}
                                    />
                                    <Typography variant="h6" component="h2">
                                        Locations
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Manage venue and shooting locations, addresses, and availability
                                    for projects.
                                </Typography>
                                <Chip
                                    label="Venues"
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
        </Box>
    );
}
