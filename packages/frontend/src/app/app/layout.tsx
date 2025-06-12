// filepath: c:\Users\info\Documents\Website Files\ProjectFlo\packages\frontend\src\app\app\layout.tsx
"use client";

import React from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Sidebar from "./_components/Sidebar"; // We'll create this next

const DRAWER_WIDTH = 240;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Sidebar drawerWidth={DRAWER_WIDTH} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: ["48px", "56px", "64px"], // Adjust top margin to account for potential AppBar height
        }}
      >
        {/* TODO: Add a Top AppBar here if needed later */}
        {children}
      </Box>
    </Box>
  );
}
