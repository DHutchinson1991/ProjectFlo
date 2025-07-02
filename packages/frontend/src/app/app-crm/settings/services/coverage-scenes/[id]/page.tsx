"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";
import Link from "next/link";

// Coverage Scene data interface
interface CoverageScene {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`coverage-scene-tabpanel-${index}`}
      aria-labelledby={`coverage-scene-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CoverageSceneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sceneId = params.id as string;

  const [scene, setScene] = useState<CoverageScene | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  // Fetch coverage scene details
  const fetchScene = async () => {
    try {
      // TODO: Replace with actual API call
      // For now, simulate with mock data
      const mockScene: CoverageScene = {
        id: Number(sceneId),
        name: `Coverage Scene ${sceneId}`,
        description: "A comprehensive coverage scene for video production",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setScene(mockScene);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch coverage scene",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScene();
  }, [sceneId]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !scene) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || "Coverage scene not found"}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          Back to Coverage Scenes
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/app-crm/settings/services" passHref legacyBehavior>
          <MuiLink underline="hover" color="inherit">
            Services
          </MuiLink>
        </Link>
        <Link
          href="/app-crm/settings/services/coverage-scenes"
          passHref
          legacyBehavior
        >
          <MuiLink underline="hover" color="inherit">
            Coverage Scenes
          </MuiLink>
        </Link>
        <Typography color="text.primary">{scene.name}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {scene.name}
          </Typography>
          {scene.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {scene.description}
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => {
            // TODO: Navigate to edit page when created
            console.log("Edit coverage scene:", sceneId);
          }}
        >
          Edit Scene
        </Button>
      </Box>

      {/* Scene Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6">
                {new Date(scene.created_at).toLocaleDateString()}
              </Typography>
              <Typography color="text.secondary">Created</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6">
                {new Date(scene.updated_at).toLocaleDateString()}
              </Typography>
              <Typography color="text.secondary">Last Updated</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
          >
            <Tab label="Usage" icon={<AssignmentIcon />} />
            <Tab label="Analytics" icon={<AnalyticsIcon />} />
          </Tabs>
        </Box>

        {/* Usage Tab */}
        <TabPanel value={currentTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Coverage Scene Usage
          </Typography>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Phase 2 Feature:</strong> This will show where this
              coverage scene is used across different deliverables, projects,
              and templates.
            </Typography>
          </Alert>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={currentTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Coverage Scene Analytics
          </Typography>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Enhanced Analytics:</strong> Detailed usage metrics,
              performance trends, and optimization recommendations will be
              available here.
            </Typography>
          </Alert>
        </TabPanel>
      </Card>
    </Box>
  );
}
