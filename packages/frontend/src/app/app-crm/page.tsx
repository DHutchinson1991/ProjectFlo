"use client";

import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { useAuth } from "../providers/AuthProvider";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Button variant="outlined" color="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Welcome Back!
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          You are successfully logged in to ProjectFlo.
        </Typography>

        {user && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="body2">
              <strong>Email:</strong> {user.email}
            </Typography>
            <Typography variant="body2">
              <strong>User ID:</strong> {user.id}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <strong>Roles:</strong>
              {user.roles.map((role, index) => (
                <Chip key={index} label={role} size="small" color="primary" />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button variant="contained" disabled>
            Manage Contributors
          </Button>
          <Button variant="contained" disabled>
            Project Management
          </Button>
          <Button variant="contained" disabled>
            Settings
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          These features will be available soon as we continue building ProjectFlo.
        </Typography>
      </Paper>
    </Box>
  );
}
