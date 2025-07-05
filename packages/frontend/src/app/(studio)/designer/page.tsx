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
  MovieFilter as ScenesIcon,
  Add as AddIcon,
  Movie as ContentIcon,
} from "@mui/icons-material";
import Link from "next/link";

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
              href="/designer/scenes"
              sx={{ height: "100%" }}
            >
              <CardContent sx={{ p: 3, height: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <ScenesIcon
                    sx={{
                      fontSize: 32,
                      color: "primary.main",
                      mr: 2,
                    }}
                  />
                  <Typography variant="h6" component="h2">
                    Scenes Library
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Browse, create, and manage all your production scenes. Define
                  shot types, compositions, and scene requirements.
                </Typography>
                <Chip
                  label="Primary"
                  color="primary"
                  size="small"
                  sx={{ mt: 1 }}
                />
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

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component={Link}
                href="/designer/scenes"
                sx={{ minWidth: 160 }}
              >
                New Scene
              </Button>
              <Button
                variant="outlined"
                startIcon={<ContentIcon />}
                component={Link}
                href="/designer/films/new"
                sx={{ minWidth: 160 }}
              >
                Create Film
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
