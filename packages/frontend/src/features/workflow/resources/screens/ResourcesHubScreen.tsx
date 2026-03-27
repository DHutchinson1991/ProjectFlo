"use client";

import React from "react";
import { Box, Typography } from "@mui/material";

export default function ResourcesHubScreen() {
    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Resources
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage your crew, locations, and equipment inventory.
                </Typography>
            </Box>
        </Box>
    );
}
