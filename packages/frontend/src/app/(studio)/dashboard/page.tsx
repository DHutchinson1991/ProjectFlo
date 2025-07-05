"use client";

import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  People as PeopleIcon,
  MovieFilter as ScenesIcon,
} from "@mui/icons-material";

export default function DashboardPage() {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to ProjectFlo Studio - Your production management hub
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <ScenesIcon color="primary" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="h6" component="div">
                    0
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Total Scenes
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <PeopleIcon color="secondary" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="h6" component="div">
                    0
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Active Users
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <AnalyticsIcon color="success" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="h6" component="div">
                    0
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Projects
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <DashboardIcon color="warning" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="h6" component="div">
                    Online
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    System Status
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Overview */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography color="text.secondary">
                No recent activity to display. Start by creating scenes or
                managing users.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Stack spacing={2}>
                <Chip
                  label="Create New Scene"
                  clickable
                  color="primary"
                  size="small"
                />
                <Chip
                  label="Manage Users"
                  clickable
                  color="secondary"
                  size="small"
                />
                <Chip
                  label="View Analytics"
                  clickable
                  color="default"
                  size="small"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
