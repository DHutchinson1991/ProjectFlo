"use client";

import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1">
        Welcome to your dashboard! This is the main content area.
      </Typography>
      {/* TODO: Add dashboard widgets and content here */}
    </Box>
  );
}
