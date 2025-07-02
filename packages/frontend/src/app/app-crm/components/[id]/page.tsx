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

// Component data interface
interface ComponentLibrary {
  id: number;
  name: string;
  description: string;
  type: "COVERAGE_LINKED" | "EDIT";
  complexity_score: number;
  estimated_duration: number;
  base_task_hours: string;
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
      id={`component-tabpanel-${index}`}
      aria-labelledby={`component-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ComponentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const componentId = params.id as string;

  const [component, setComponent] = useState<ComponentLibrary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  // Fetch component details
  const fetchComponent = async () => {
    try {
      const response = await fetch(
        `http://localhost:3002/components/${componentId}`,
      );
      if (!response.ok) {
        throw new Error(`Component not found: ${response.status}`);
      }
      const data = await response.json();
      setComponent(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch component",
      );
    }
  };

  // Load component data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchComponent();
      setLoading(false);
    };

    if (componentId) {
      loadData();
    }
  }, [componentId]);

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

  if (error || !component) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || "Component not found"}</Alert>
        <Button variant="outlined" onClick={() => router.back()} sx={{ mt: 2 }}>
          Back to Components
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/app-crm/components" passHref legacyBehavior>
          <MuiLink underline="hover" color="inherit">
            Components
          </MuiLink>
        </Link>
        <Typography color="text.primary">{component.name}</Typography>
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
            {component.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {component.description}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={
                component.type === "COVERAGE_LINKED"
                  ? "Coverage Linked"
                  : "Edit Component"
              }
              color={
                component.type === "COVERAGE_LINKED" ? "primary" : "secondary"
              }
            />
            <Chip
              label={`Complexity: ${component.complexity_score}`}
              variant="outlined"
            />
            <Chip
              label={`${component.estimated_duration} minutes`}
              variant="outlined"
            />
            <Chip
              label={`${component.base_task_hours}h base`}
              variant="outlined"
            />
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => router.push(`/app-crm/components/${componentId}/edit`)}
        >
          Edit Component
        </Button>
      </Box>

      {/* Component Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6">{component.usage_count}</Typography>
              <Typography color="text.secondary">Total Usage</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6">
                {component.performance_score}
              </Typography>
              <Typography color="text.secondary">Performance Score</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6">
                {component.last_used_at
                  ? new Date(component.last_used_at).toLocaleDateString()
                  : "Never"}
              </Typography>
              <Typography color="text.secondary">Last Used</Typography>
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
              <strong>Phase 2 Feature:</strong> This will show where this
              component is used across different timelines, including
              deliverable assignments, timeline positions, and usage patterns.
            </Typography>
          </Alert>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={currentTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Component Analytics
          </Typography>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Enhanced Analytics:</strong> Detailed performance metrics,
              efficiency trends, and optimization recommendations will be
              available here.
            </Typography>
          </Alert>
        </TabPanel>
      </Card>
    </Box>
  );
}
