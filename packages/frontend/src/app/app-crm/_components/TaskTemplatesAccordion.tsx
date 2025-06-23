"use client";

import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Analytics as AnalyticsIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import TaskTemplateCreation from "./TaskTemplateCreation";

interface TaskTemplatesAccordionProps {
  entityType: "component" | "deliverable" | "coverage_scene";
  entityId: number;
  entityName: string;
}

interface EntityDefaultTask {
  id: number;
  task_name: string;
  estimated_hours: number;
  order_index: number;
  task_template_id?: number;
  task_template?: {
    id: number;
    name: string;
    phase?: string;
    pricing_type: "Hourly" | "Fixed";
    fixed_price?: number;
    effort_hours?: number;
  };
}

const TaskTemplatesAccordion: React.FC<TaskTemplatesAccordionProps> = ({
  entityType,
  entityId,
  entityName,
}) => {
  const [tasks, setTasks] = useState<EntityDefaultTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3002/api/entities/${entityType}/${entityId}/default-tasks`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const result = await response.json();
      setTasks(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [entityType, entityId]);

  const handleDeleteTask = async (taskId: number) => {
    try {
      const response = await fetch(
        `http://localhost:3002/api/entities/${entityType}/${entityId}/default-tasks/${taskId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      await fetchTasks(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  const handleTaskTemplateCreated = () => {
    fetchTasks(); // Refresh the list after creating a new task
  };

  const formatHours = (hours: number) => {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Calculate analytics
  const calculateAnalytics = () => {
    if (tasks.length === 0) return null;

    const totalHours = tasks.reduce(
      (sum, task) => sum + task.estimated_hours,
      0,
    );
    const totalFixedCost = tasks.reduce((sum, task) => {
      return (
        sum +
        (task.task_template?.pricing_type === "Fixed"
          ? task.task_template?.fixed_price || 0
          : 0)
      );
    }, 0);
    const hourlyTasks = tasks.filter(
      (task) => task.task_template?.pricing_type === "Hourly",
    ).length;
    const fixedTasks = tasks.filter(
      (task) => task.task_template?.pricing_type === "Fixed",
    ).length;

    // Group by phase
    const phaseGroups = tasks.reduce(
      (acc, task) => {
        const phase = task.task_template?.phase || "Unassigned";
        if (!acc[phase]) acc[phase] = { count: 0, hours: 0 };
        acc[phase].count++;
        acc[phase].hours += task.estimated_hours;
        return acc;
      },
      {} as Record<string, { count: number; hours: number }>,
    );

    const averageHours = totalHours / tasks.length;

    return {
      totalHours,
      totalFixedCost,
      hourlyTasks,
      fixedTasks,
      phaseGroups,
      averageHours,
    };
  };

  const analytics = calculateAnalytics();

  return (
    <>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6">Default Tasks</Typography>
            <Chip
              label={tasks.length}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ width: "100%" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Tasks that will be automatically created for {entityName}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                size="small"
              >
                Add Task Template
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : tasks.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", py: 3 }}
              >
                No default tasks configured. Add a task template to get started.
              </Typography>
            ) : (
              <List disablePadding>
                {tasks.map((task, index) => (
                  <React.Fragment key={task.id}>
                    <ListItem
                      sx={{
                        bgcolor: "background.paper",
                        borderRadius: 1,
                        mb: 1,
                        border: 1,
                        borderColor: "divider",
                      }}
                    >
                      <ListItemText
                        primary={task.task_name}
                        secondary={
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 1,
                              mt: 0.5,
                            }}
                          >
                            {task.task_template?.phase && (
                              <Chip
                                label={task.task_template.phase}
                                size="small"
                                variant="outlined"
                                color="secondary"
                              />
                            )}
                            <Chip
                              icon={<ScheduleIcon />}
                              label={formatHours(task.estimated_hours)}
                              size="small"
                              variant="outlined"
                            />
                            {task.task_template?.pricing_type === "Fixed" &&
                              task.task_template?.fixed_price && (
                                <Chip
                                  icon={<MoneyIcon />}
                                  label={formatPrice(
                                    task.task_template.fixed_price,
                                  )}
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                />
                              )}
                            {task.task_template?.pricing_type === "Hourly" && (
                              <Chip
                                label="Hourly Rate"
                                size="small"
                                variant="outlined"
                                color="info"
                              />
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() =>
                              (window.location.href = `/app-crm/settings/services/tasks/${entityType}/${entityId}/${task.id}`)
                            }
                            size="small"
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteTask(task.id)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < tasks.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}

            {/* Analytics Section */}
            {analytics && (
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography
                  variant="h6"
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <AnalyticsIcon color="primary" />
                  Task Analytics
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  {/* Total Hours Card */}
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "background.default",
                      borderRadius: 1,
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="h4" color="primary">
                      {analytics.totalHours}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Hours
                    </Typography>
                  </Box>

                  {/* Fixed Cost Card */}
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "background.default",
                      borderRadius: 1,
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="h4" color="success.main">
                      {formatPrice(analytics.totalFixedCost)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fixed Cost
                    </Typography>
                  </Box>

                  {/* Average Hours Card */}
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "background.default",
                      borderRadius: 1,
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="h4" color="info.main">
                      {analytics.averageHours.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Hours/Task
                    </Typography>
                  </Box>
                </Box>

                {/* Pricing Breakdown */}
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      flex: 1,
                      p: 2,
                      bgcolor: "background.default",
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <PieChartIcon color="primary" fontSize="small" />
                      Pricing Breakdown
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        Hourly Tasks: {analytics.hourlyTasks} (
                        {((analytics.hourlyTasks / tasks.length) * 100).toFixed(
                          0,
                        )}
                        %)
                      </Typography>
                      <Typography variant="body2">
                        Fixed Tasks: {analytics.fixedTasks} (
                        {((analytics.fixedTasks / tasks.length) * 100).toFixed(
                          0,
                        )}
                        %)
                      </Typography>
                    </Box>
                  </Box>

                  {/* Phase Distribution */}
                  <Box
                    sx={{
                      flex: 1,
                      p: 2,
                      bgcolor: "background.default",
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <TrendingUpIcon color="primary" fontSize="small" />
                      Phase Distribution
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {Object.entries(analytics.phaseGroups).map(
                        ([phase, data]) => (
                          <Typography key={phase} variant="body2">
                            {phase}: {data.count} tasks ({data.hours}h)
                          </Typography>
                        ),
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}

            {tasks.length > 0 && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "background.default",
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  <strong>Total estimated hours:</strong>{" "}
                  {tasks.reduce((sum, task) => sum + task.estimated_hours, 0)}{" "}
                  hours
                </Typography>
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      <TaskTemplateCreation
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onTaskTemplateCreated={handleTaskTemplateCreated}
        entityType={entityType}
        entityId={entityId}
      />
    </>
  );
};

export default TaskTemplatesAccordion;
