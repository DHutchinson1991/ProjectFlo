"use client";

import React from "react";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Button,
    Chip,
} from "@mui/material";
import {
    Movie as ContentIcon,
    Handyman as EquipmentIcon,
    Inventory as PackageIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { SubjectsManagerCard } from "./components/SubjectsManagerCard";

export default function DesignerPage() {
    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Designer Studio
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Create and manage your production scenes and assets
                </Typography>
            </Box>

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
                            href="/designer/films"
                            sx={{ height: "100%" }}
                        >
                            <CardContent sx={{ p: 3, height: "100%" }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <ContentIcon
                                        sx={{
                                            fontSize: 32,
                                            color: "success.main",
                                            mr: 2,
                                        }}
                                    />
                                    <Typography variant="h6" component="h2">
                                        Film Manager
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Create and manage film templates with visual builder. Design
                                    complete production workflows.
                                </Typography>
                                <Chip
                                    label="Builder"
                                    color="success"
                                    size="small"
                                    sx={{ mt: 1 }}
                                />
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                    <SubjectsManagerCard />
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
                                            color: "info.main",
                                            mr: 2,
                                        }}
                                    />
                                    <Typography variant="h6" component="h2">
                                        Crew & Equipment
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Manage equipment kits and crew operators — define camera &amp; audio setups
                                    and assign default gear to your production roles.
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                    <Chip
                                        label="Kits"
                                        color="info"
                                        size="small"
                                    />
                                    <Chip
                                        label="Crew"
                                        color="secondary"
                                        size="small"
                                    />
                                </Box>
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
                            href="/designer/packages"
                            sx={{ height: "100%" }}
                        >
                            <CardContent sx={{ p: 3, height: "100%" }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <PackageIcon
                                        sx={{
                                            fontSize: 32,
                                            color: "warning.main",
                                            mr: 2,
                                        }}
                                    />
                                    <Typography variant="h6" component="h2">
                                        Package Library
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Build and manage service packages — bundle films, crew, equipment,
                                    and scheduling into ready-to-sell offerings.
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                    <Chip
                                        label="Bundles"
                                        color="warning"
                                        size="small"
                                    />
                                    <Chip
                                        label="Pricing"
                                        color="default"
                                        size="small"
                                    />
                                </Box>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>

                {/* Quick Actions */}
                <Grid item xs={12}>
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Quick Actions
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                            <Button
                                variant="outlined"
                                startIcon={<ContentIcon />}
                                component={Link}
                                href="/designer/films/new"
                                sx={{ minWidth: 160 }}
                            >
                                Create Film
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<PackageIcon />}
                                component={Link}
                                href="/designer/packages/new"
                                sx={{ minWidth: 160 }}
                            >
                                Create Package
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
