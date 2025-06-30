"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import {
  Compare as CompareIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";

interface TaskTemplate {
  id: number;
  name: string;
  phase: string;
  pricing_type: "Hourly" | "Fixed";
  fixed_price?: number;
  effort_hours: string;
  description?: string;
  usage_count?: number;
  success_rate?: number;
  avg_completion_time?: number;
  profitability_score?: number;
  created_at?: string;
  updated_at?: string;
}

interface ComparisonMetric {
  name: string;
  template1Value: string | number;
  template2Value: string | number;
  better: "template1" | "template2" | "equal";
  icon?: React.ReactNode;
  description?: string;
}

interface TemplateComparisonProps {
  open: boolean;
  onClose: () => void;
  initialTemplate1?: TaskTemplate;
  initialTemplate2?: TaskTemplate;
}

const TemplateComparison: React.FC<TemplateComparisonProps> = ({
  open,
  onClose,
  initialTemplate1,
  initialTemplate2,
}) => {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [template1, setTemplate1] = useState<TaskTemplate | null>(
    initialTemplate1 || null,
  );
  const [template2, setTemplate2] = useState<TaskTemplate | null>(
    initialTemplate2 || null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  useEffect(() => {
    if (initialTemplate1) setTemplate1(initialTemplate1);
    if (initialTemplate2) setTemplate2(initialTemplate2);
  }, [initialTemplate1, initialTemplate2]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3002/task-templates");
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch templates",
      );
    } finally {
      setLoading(false);
    }
  };

  const generateComparison = (): ComparisonMetric[] => {
    if (!template1 || !template2) return [];

    const metrics: ComparisonMetric[] = [
      {
        name: "Name",
        template1Value: template1.name,
        template2Value: template2.name,
        better: "equal",
      },
      {
        name: "Phase",
        template1Value: template1.phase,
        template2Value: template2.phase,
        better: "equal",
      },
      {
        name: "Effort Hours",
        template1Value: template1.effort_hours,
        template2Value: template2.effort_hours,
        better:
          parseFloat(template1.effort_hours) <
          parseFloat(template2.effort_hours)
            ? "template1"
            : parseFloat(template1.effort_hours) >
                parseFloat(template2.effort_hours)
              ? "template2"
              : "equal",
        icon: <ScheduleIcon fontSize="small" />,
        description: "Lower effort hours typically indicate more efficiency",
      },
      {
        name: "Pricing Type",
        template1Value: template1.pricing_type,
        template2Value: template2.pricing_type,
        better: "equal",
        icon: <MoneyIcon fontSize="small" />,
      },
    ];

    if (template1.fixed_price && template2.fixed_price) {
      metrics.push({
        name: "Fixed Price",
        template1Value: `$${template1.fixed_price}`,
        template2Value: `$${template2.fixed_price}`,
        better:
          template1.fixed_price < template2.fixed_price
            ? "template1"
            : template1.fixed_price > template2.fixed_price
              ? "template2"
              : "equal",
        icon: <MoneyIcon fontSize="small" />,
        description: "Lower price may be more competitive",
      });
    }

    if (
      template1.usage_count !== undefined &&
      template2.usage_count !== undefined
    ) {
      metrics.push({
        name: "Usage Count",
        template1Value: template1.usage_count,
        template2Value: template2.usage_count,
        better:
          template1.usage_count > template2.usage_count
            ? "template1"
            : template1.usage_count < template2.usage_count
              ? "template2"
              : "equal",
        icon: <TrendingIcon fontSize="small" />,
        description: "Higher usage indicates popularity and reliability",
      });
    }

    if (
      template1.success_rate !== undefined &&
      template2.success_rate !== undefined
    ) {
      metrics.push({
        name: "Success Rate",
        template1Value: `${(template1.success_rate * 100).toFixed(1)}%`,
        template2Value: `${(template2.success_rate * 100).toFixed(1)}%`,
        better:
          template1.success_rate > template2.success_rate
            ? "template1"
            : template1.success_rate < template2.success_rate
              ? "template2"
              : "equal",
        icon: <CheckIcon fontSize="small" />,
        description: "Higher success rate indicates better execution",
      });
    }

    if (
      template1.avg_completion_time !== undefined &&
      template2.avg_completion_time !== undefined
    ) {
      metrics.push({
        name: "Avg Completion Time",
        template1Value: `${template1.avg_completion_time.toFixed(1)}h`,
        template2Value: `${template2.avg_completion_time.toFixed(1)}h`,
        better:
          template1.avg_completion_time < template2.avg_completion_time
            ? "template1"
            : template1.avg_completion_time > template2.avg_completion_time
              ? "template2"
              : "equal",
        icon: <ScheduleIcon fontSize="small" />,
        description: "Faster completion is generally better",
      });
    }

    if (
      template1.profitability_score !== undefined &&
      template2.profitability_score !== undefined
    ) {
      metrics.push({
        name: "Profitability Score",
        template1Value: template1.profitability_score.toFixed(2),
        template2Value: template2.profitability_score.toFixed(2),
        better:
          template1.profitability_score > template2.profitability_score
            ? "template1"
            : template1.profitability_score < template2.profitability_score
              ? "template2"
              : "equal",
        icon: <MoneyIcon fontSize="small" />,
        description: "Higher profitability score indicates better ROI",
      });
    }

    return metrics;
  };

  const getBetterIndicator = (better: string) => {
    switch (better) {
      case "template1":
        return <CheckIcon color="success" fontSize="small" />;
      case "template2":
        return <CancelIcon color="error" fontSize="small" />;
      default:
        return null;
    }
  };

  const getBetterColor = (
    better: string,
    position: "template1" | "template2",
  ) => {
    if (better === "equal") return "inherit";
    if (better === position) return "success.light";
    return "error.light";
  };

  const comparison = generateComparison();
  const template1Wins = comparison.filter(
    (m) => m.better === "template1",
  ).length;
  const template2Wins = comparison.filter(
    (m) => m.better === "template2",
  ).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <CompareIcon />
          <Typography variant="h6">Template Comparison</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Template 1</InputLabel>
              <Select
                value={template1?.id || ""}
                onChange={(e: SelectChangeEvent<number>) => {
                  const selectedTemplate = templates.find(
                    (t) => t.id === e.target.value,
                  );
                  setTemplate1(selectedTemplate || null);
                }}
                disabled={loading}
              >
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name} ({template.phase})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Template 2</InputLabel>
              <Select
                value={template2?.id || ""}
                onChange={(e: SelectChangeEvent<number>) => {
                  const selectedTemplate = templates.find(
                    (t) => t.id === e.target.value,
                  );
                  setTemplate2(selectedTemplate || null);
                }}
                disabled={loading}
              >
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name} ({template.phase})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {template1 && template2 && (
              <>
                {/* Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Card
                      sx={{
                        bgcolor: getBetterColor(
                          template1Wins > template2Wins
                            ? "template1"
                            : template2Wins > template1Wins
                              ? "template2"
                              : "equal",
                          "template1",
                        ),
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {template1.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {template1.phase} • {template1.effort_hours} hours
                        </Typography>
                        <Box mt={2}>
                          <Chip
                            label={`${template1Wins} advantages`}
                            color={
                              template1Wins > template2Wins
                                ? "success"
                                : "default"
                            }
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card
                      sx={{
                        bgcolor: getBetterColor(
                          template2Wins > template1Wins
                            ? "template2"
                            : template1Wins > template2Wins
                              ? "template1"
                              : "equal",
                          "template2",
                        ),
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {template2.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {template2.phase} • {template2.effort_hours} hours
                        </Typography>
                        <Box mt={2}>
                          <Chip
                            label={`${template2Wins} advantages`}
                            color={
                              template2Wins > template1Wins
                                ? "success"
                                : "default"
                            }
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Detailed Comparison Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell align="center">{template1.name}</TableCell>
                        <TableCell align="center">Winner</TableCell>
                        <TableCell align="center">{template2.name}</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {comparison.map((metric, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              {metric.icon}
                              {metric.name}
                            </Box>
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              bgcolor: getBetterColor(
                                metric.better,
                                "template1",
                              ),
                            }}
                          >
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              gap={1}
                            >
                              {metric.better === "template1" &&
                                getBetterIndicator(metric.better)}
                              {metric.template1Value}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            {metric.better === "equal" ? (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Equal
                              </Typography>
                            ) : (
                              <Chip
                                label={
                                  metric.better === "template1"
                                    ? template1.name
                                    : template2.name
                                }
                                size="small"
                                color={
                                  metric.better === "template1"
                                    ? "success"
                                    : "error"
                                }
                              />
                            )}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              bgcolor: getBetterColor(
                                metric.better,
                                "template2",
                              ),
                            }}
                          >
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              gap={1}
                            >
                              {metric.better === "template2" &&
                                getBetterIndicator(metric.better)}
                              {metric.template2Value}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {metric.description || "—"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Recommendation */}
                <Alert
                  severity={
                    template1Wins > template2Wins
                      ? "success"
                      : template2Wins > template1Wins
                        ? "warning"
                        : "info"
                  }
                  sx={{ mt: 3 }}
                >
                  <Typography variant="subtitle2">
                    Recommendation:{" "}
                    {template1Wins > template2Wins
                      ? `${template1.name} appears to be the better choice`
                      : template2Wins > template1Wins
                        ? `${template2.name} appears to be the better choice`
                        : "Both templates are comparable - choose based on your specific needs"}
                  </Typography>
                </Alert>
              </>
            )}

            {(!template1 || !template2) && (
              <Alert severity="info">
                Please select two templates to compare their features,
                performance, and metrics.
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateComparison;
