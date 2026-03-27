"use client";

import React from "react";
import { Box, Typography } from "@mui/material";

export default function DashboardPage() {
    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
                Welcome to ProjectFlo Studio - Your production management hub
            </Typography>
        </Box>
    );
}
