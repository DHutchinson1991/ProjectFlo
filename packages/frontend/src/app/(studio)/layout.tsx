"use client";

import React from "react";
import { Box } from "@mui/material";
import StudioSidebar from "./components/StudioSidebar";
import StudioHeader from "./components/StudioHeader";

interface StudioLayoutProps {
  children: React.ReactNode;
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Header - spans across full width */}
      <StudioHeader />

      {/* Sidebar - positioned below header */}
      <StudioSidebar />

      {/* Main content area */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          marginLeft: "280px", // Account for fixed sidebar width
          marginTop: "64px", // Account for fixed header height
        }}
      >
        {/* Page content */}
        <Box
          sx={{
            flexGrow: 1,
            p: 3,
            overflow: "auto",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
