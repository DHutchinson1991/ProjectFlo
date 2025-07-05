"use client";

import React from "react";
import { Typography, Box } from "@mui/material";

export default function ClientPortalPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Client Portal
      </Typography>
      <Typography variant="body1">
        Welcome to the ProjectFlo Client Portal. Here you can view your
        projects, timelines, and communicate with our team.
      </Typography>
    </Box>
  );
}
