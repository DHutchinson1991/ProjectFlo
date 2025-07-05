"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import {
  Edit as EditIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";
import Link from "next/link";

// Scene data interface
interface ScenesLibrary {
  id: number;
  name: string;
  description: string;
  media_type: "VIDEO" | "AUDIO" | "MUSIC";
  complexity_score: number;
  estimated_duration: number;
  base_task_hours: string;
  is_coverage_linked: boolean;
  usage_count: number;
  performance_score: string;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
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
      id={`scene-tabpanel-${index}`}
      aria-labelledby={`scene-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SceneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sceneId = params.id as string;

  const [scene, setScene] = useState<ScenesLibrary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  // Fetch scene details
  const fetchScene = async () => {
    try {
      const response = await fetch(`http://localhost:3002/scenes/${sceneId}`);
      if (!response.ok) {
        throw new Error(`Scene not found: ${response.status}`);
      }
      const data = await response.json();
      setScene(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch scene");
    }
  };

  // Load scene data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchScene();
      setLoading(false);
    };

    if (sceneId) {
      loadData();
    }
  }, [sceneId]);

  // Get media type color
  const getMediaTypeColor = (
    mediaType: string,
  ): "primary" | "secondary" | "success" => {
    switch (mediaType) {
      case "VIDEO":
        return "primary";
      case "AUDIO":
        return "secondary";
      case "MUSIC":
        return "success";
      default:
        return "primary";
    }
  };

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
        <Alert severity="error">{error || "Scene not found"}</Alert>
        <Button variant="outlined" onClick={() => router.back()} sx={{ mt: 2 }}>
          Back to Scenes
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/scenes" passHref legacyBehavior>
          <MuiLink underline="hover" color="inherit">
            Scenes
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
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {scene.description}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={scene.media_type}
              color={getMediaTypeColor(scene.media_type)}
            />
            <Chip
              label={
                scene.is_coverage_linked ? "Coverage Linked" : "Standalone"
              }
              color={scene.is_coverage_linked ? "success" : "default"}
              variant="outlined"
            />
            <Chip
              label={`Complexity: ${scene.complexity_score}`}
              variant="outlined"
            />
            <Chip
              label={`${scene.estimated_duration} minutes`}
              variant="outlined"
            />
            <Chip label={`${scene.base_task_hours}h base`} variant="outlined" />
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => router.push(`/scenes/${sceneId}/edit`)}
        >
          Edit Scene
        </Button>
      </Box>

      {/* Scene Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6">{scene.usage_count}</Typography>
              <Typography color="text.secondary">Total Usage</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6">{scene.performance_score}</Typography>
              <Typography color="text.secondary">Performance Score</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6">
                {scene.last_used_at
                  ? new Date(scene.last_used_at).toLocaleDateString()
                  : "Never"}
              </Typography>
              <Typography color="text.secondary">Last Used</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6">
                {new Date(scene.created_at).toLocaleDateString()}
              </Typography>
              <Typography color="text.secondary">Created</Typography>
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
            <Tab label="Timeline Usage" icon={<TimelineIcon />} />
            <Tab label="Analytics" icon={<AnalyticsIcon />} />
          </Tabs>
        </Box>

        {/* Timeline Usage Tab */}
        <TabPanel value={currentTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Timeline Usage
          </Typography>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Phase 2 Feature:</strong> This will show where this scene
              is used across different timelines, including deliverable
              assignments, timeline positions, and usage patterns. For
              coverage-linked scenes, it will also show associated coverage
              data.
            </Typography>
          </Alert>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={currentTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Scene Analytics
          </Typography>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Enhanced Analytics:</strong> Detailed performance metrics,
              efficiency trends, media type optimization, and workflow
              recommendations will be available here. This includes
              scene-specific insights for video, audio, and music elements.
            </Typography>
          </Alert>
        </TabPanel>
      </Card>
    </Box>
  );
}
