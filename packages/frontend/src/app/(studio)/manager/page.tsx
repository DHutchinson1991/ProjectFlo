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
    Assignment as TasksIcon,
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
                    Configure task libraries and project workflows.
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
            </Grid>
        </Box>
    );
}
