"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Analytics as AnalyticsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";

interface TaskTemplate {
  id: number;
  name: string;
  phase: string;
  pricing_type: "Hourly" | "Fixed";
  fixed_price?: number;
  effort_hours: string;
  usage_count?: number;
  effectiveness_score?: number;
  average_completion_time?: number;
  accuracy_score?: number;
  revenue_generated?: number;
}

interface TemplateAnalytics {
  totalTemplates: number;
  totalUsage: number;
  averageEffectiveness: number;
  topPerforming: TaskTemplate[];
  underPerforming: TaskTemplate[];
  recentTrends: {
    period: string;
    usage: number;
    effectiveness: number;
  }[];
  phaseBreakdown: {
    phase: string;
    count: number;
    usage: number;
  }[];
}

const TaskTemplateAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<TemplateAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch templates
      const templatesResponse = await fetch(
        "http://localhost:3002/task-templates",
      );
      if (!templatesResponse.ok) {
        throw new Error(
          `Failed to fetch templates: ${templatesResponse.status}`,
        );
      }

      const templatesData = await templatesResponse.json();

      // Calculate analytics from templates data
      const calculatedAnalytics = calculateAnalytics(templatesData);
      setAnalytics(calculatedAnalytics);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch analytics",
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (
    templatesData: TaskTemplate[],
  ): TemplateAnalytics => {
    const totalTemplates = templatesData.length;
    const totalUsage = templatesData.reduce(
      (sum, t) => sum + (t.usage_count || 0),
      0,
    );
    const averageEffectiveness =
      templatesData.reduce((sum, t) => sum + (t.effectiveness_score || 75), 0) /
      totalTemplates;

    // Top performing templates (high usage and effectiveness)
    const topPerforming = templatesData
      .filter(
        (t) => (t.usage_count || 0) > 5 && (t.effectiveness_score || 75) > 80,
      )
      .sort(
        (a, b) =>
          (b.effectiveness_score || 75) +
          (b.usage_count || 0) -
          ((a.effectiveness_score || 75) + (a.usage_count || 0)),
      )
      .slice(0, 5);

    // Under performing templates (low effectiveness or accuracy)
    const underPerforming = templatesData
      .filter(
        (t) =>
          (t.effectiveness_score || 75) < 60 || (t.accuracy_score || 80) < 70,
      )
      .sort(
        (a, b) => (a.effectiveness_score || 75) - (b.effectiveness_score || 75),
      )
      .slice(0, 5);

    // Phase breakdown
    const phaseMap = new Map<string, { count: number; usage: number }>();
    templatesData.forEach((template) => {
      const phase = template.phase || "Unclassified";
      const current = phaseMap.get(phase) || { count: 0, usage: 0 };
      phaseMap.set(phase, {
        count: current.count + 1,
        usage: current.usage + (template.usage_count || 0),
      });
    });

    const phaseBreakdown = Array.from(phaseMap.entries()).map(
      ([phase, data]) => ({
        phase,
        count: data.count,
        usage: data.usage,
      }),
    );

    // Mock recent trends (in production, this would come from time-series data)
    const recentTrends = [
      {
        period: "Last Week",
        usage: Math.floor(totalUsage * 0.3),
        effectiveness: averageEffectiveness + 2,
      },
      {
        period: "Last Month",
        usage: Math.floor(totalUsage * 0.7),
        effectiveness: averageEffectiveness - 1,
      },
      {
        period: "Last Quarter",
        usage: totalUsage,
        effectiveness: averageEffectiveness,
      },
    ];

    return {
      totalTemplates,
      totalUsage,
      averageEffectiveness,
      topPerforming,
      underPerforming,
      recentTrends,
      phaseBreakdown,
    };
  };

  const getEffectivenessColor = (score: number) => {
    if (score >= 85) return "success";
    if (score >= 70) return "warning";
    return "error";
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

  if (error || !analytics) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error || "Failed to load analytics"}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <AnalyticsIcon color="primary" />
        Task Template Analytics
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="primary">
                {analytics.totalTemplates}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Templates
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="success.main">
                {analytics.totalUsage}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Usage
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="info.main">
                {analytics.averageEffectiveness.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Effectiveness
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="warning.main">
                {analytics.phaseBreakdown.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Phases
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top Performing Templates */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <StarIcon color="primary" />
                Top Performing Templates
              </Typography>
              {analytics.topPerforming.length === 0 ? (
                <Alert severity="info">
                  No top performing templates yet. Templates need more usage
                  data to appear here.
                </Alert>
              ) : (
                <List>
                  {analytics.topPerforming.map((template, index) => (
                    <React.Fragment key={template.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography variant="body1">
                                {template.name}
                              </Typography>
                              <Chip
                                size="small"
                                label={`#${index + 1}`}
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                                <Chip
                                  size="small"
                                  icon={<TrendingUpIcon />}
                                  label={`${template.usage_count || 0} uses`}
                                  color="success"
                                  variant="outlined"
                                />
                                <Chip
                                  size="small"
                                  icon={<SpeedIcon />}
                                  label={`${template.effectiveness_score || 75}% effective`}
                                  color={getEffectivenessColor(
                                    template.effectiveness_score || 75,
                                  )}
                                  variant="outlined"
                                />
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={template.effectiveness_score || 75}
                                color={getEffectivenessColor(
                                  template.effectiveness_score || 75,
                                )}
                                sx={{ height: 4, borderRadius: 2 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < analytics.topPerforming.length - 1 && (
                        <Divider />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Under Performing Templates */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <WarningIcon color="warning" />
                Templates Needing Improvement
              </Typography>
              {analytics.underPerforming.length === 0 ? (
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  Great! All templates are performing well.
                </Alert>
              ) : (
                <List>
                  {analytics.underPerforming.map((template, index) => (
                    <React.Fragment key={template.id}>
                      <ListItem>
                        <ListItemText
                          primary={template.name}
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                                <Chip
                                  size="small"
                                  icon={<ScheduleIcon />}
                                  label={`${template.effort_hours}h est`}
                                  variant="outlined"
                                />
                                <Chip
                                  size="small"
                                  icon={<SpeedIcon />}
                                  label={`${template.effectiveness_score || 60}% effective`}
                                  color="error"
                                  variant="outlined"
                                />
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={template.effectiveness_score || 60}
                                color="error"
                                sx={{ height: 4, borderRadius: 2 }}
                              />
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            size="small"
                            label="Needs Review"
                            color="warning"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < analytics.underPerforming.length - 1 && (
                        <Divider />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Phase Breakdown */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Templates by Phase
              </Typography>
              <Grid container spacing={2}>
                {analytics.phaseBreakdown.map((phase) => (
                  <Grid item xs={12} sm={6} md={4} key={phase.phase}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: "center", py: 2 }}>
                        <Typography variant="h6" color="primary">
                          {phase.count}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          {phase.phase}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${phase.usage} total uses`}
                          color="primary"
                          variant="outlined"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaskTemplateAnalytics;
