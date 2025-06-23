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

// Editing Style data interface
interface EditingStyle {
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
      id={`editing-style-tabpanel-${index}`}
      aria-labelledby={`editing-style-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EditingStyleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const styleId = params.id as string;

  const [style, setStyle] = useState<EditingStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  // Fetch editing style details
  const fetchStyle = async () => {
    try {
      // TODO: Replace with actual API call
      // For now, simulate with mock data
      const mockStyle: EditingStyle = {
        id: Number(styleId),
        name: `Editing Style ${styleId}`,
        description: "A professional editing style for video production",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setStyle(mockStyle);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch editing style",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStyle();
  }, [styleId]);

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

  if (error || !style) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || "Editing style not found"}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          Back to Editing Styles
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
          href="/app-crm/settings/services/editing-styles"
          passHref
          legacyBehavior
        >
          <MuiLink underline="hover" color="inherit">
            Editing Styles
          </MuiLink>
        </Link>
        <Typography color="text.primary">{style.name}</Typography>
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
            {style.name}
          </Typography>
          {style.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {style.description}
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => {
            // TODO: Navigate to edit page when created
            console.log("Edit editing style:", styleId);
          }}
        >
          Edit Style
        </Button>
      </Box>

      {/* Style Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6">
                {new Date(style.created_at).toLocaleDateString()}
              </Typography>
              <Typography color="text.secondary">Created</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6">
                {new Date(style.updated_at).toLocaleDateString()}
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
            Editing Style Usage
          </Typography>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Phase 2 Feature:</strong> This will show where this
              editing style is used across different deliverables, projects, and
              templates.
            </Typography>
          </Alert>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={currentTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Editing Style Analytics
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
