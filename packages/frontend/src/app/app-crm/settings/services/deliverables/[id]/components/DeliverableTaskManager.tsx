"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Analytics as AnalyticsIcon,
  Assignment as AssignmentIcon,
  ViewModule as ViewModuleIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import TaskTemplatesAccordion from "../../../../../_components/TaskTemplatesAccordion";

interface DeliverableTaskManagerProps {
  deliverableId: number;
  deliverableName: string;
  componentIds: number[];
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

interface ComponentTaskData {
  componentId: number;
  componentName: string;
  tasks: EntityDefaultTask[];
}

const DeliverableTaskManager: React.FC<DeliverableTaskManagerProps> = ({
  deliverableId,
  deliverableName,
  componentIds,
}) => {
  const [componentTasks, setComponentTasks] = useState<ComponentTaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComponentTasks();
  }, [componentIds]);

  const fetchComponentTasks = async () => {
    if (componentIds.length === 0) {
      setComponentTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const componentTasksData: ComponentTaskData[] = [];

      // Fetch tasks for each component
      for (const componentId of componentIds) {
        try {
          // First get component details
          const componentResponse = await fetch(
            `http://localhost:3002/components/${componentId}`,
          );
          const componentData = await componentResponse.json();

          // Then get component tasks
          const tasksResponse = await fetch(
            `http://localhost:3002/api/entities/component/${componentId}/default-tasks`,
          );

          if (tasksResponse.ok) {
            const tasksResult = await tasksResponse.json();
            const tasks = tasksResult.data || [];

            if (tasks.length > 0) {
              componentTasksData.push({
                componentId,
                componentName: componentData.name || `Component ${componentId}`,
                tasks,
              });
            }
          }
        } catch (err) {
          console.error(
            `Error fetching tasks for component ${componentId}:`,
            err,
          );
        }
      }

      setComponentTasks(componentTasksData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load component tasks",
      );
    } finally {
      setLoading(false);
    }
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

  // Calculate aggregate analytics
  const calculateAggregateAnalytics = () => {
    const allTasks = componentTasks.flatMap((comp) => comp.tasks);
    if (allTasks.length === 0) return null;

    const totalHours = allTasks.reduce(
      (sum, task) => sum + task.estimated_hours,
      0,
    );
    const totalFixedCost = allTasks.reduce((sum, task) => {
      return (
        sum +
        (task.task_template?.pricing_type === "Fixed"
          ? task.task_template?.fixed_price || 0
          : 0)
      );
    }, 0);
    const hourlyTasks = allTasks.filter(
      (task) => task.task_template?.pricing_type === "Hourly",
    ).length;
    const fixedTasks = allTasks.filter(
      (task) => task.task_template?.pricing_type === "Fixed",
    ).length;

    return {
      totalTasks: allTasks.length,
      totalComponents: componentTasks.length,
      totalHours,
      totalFixedCost,
      hourlyTasks,
      fixedTasks,
      averageHours: totalHours / allTasks.length,
    };
  };

  const aggregateAnalytics = calculateAggregateAnalytics();

  return (
    <Box sx={{ width: "100%" }}>
      {/* Deliverable Direct Tasks */}
      <TaskTemplatesAccordion
        entityType="deliverable"
        entityId={deliverableId}
        entityName={deliverableName}
      />

      {/* Component Tasks Section */}
      <Box sx={{ mt: 2 }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ViewModuleIcon color="secondary" />
              <Typography variant="h6">Component Tasks</Typography>
              <Chip
                label={`${componentTasks.length} components`}
                size="small"
                color="secondary"
                variant="outlined"
              />
              {aggregateAnalytics && (
                <Chip
                  label={`${aggregateAnalytics.totalTasks} tasks`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ width: "100%" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Tasks inherited from components included in this deliverable
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : componentTasks.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 3 }}
                >
                  No component tasks found. Components may not have configured
                  default tasks.
                </Typography>
              ) : (
                <>
                  {/* Aggregate Analytics */}
                  {aggregateAnalytics && (
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <AnalyticsIcon color="primary" />
                        Component Tasks Summary
                      </Typography>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card variant="outlined">
                            <CardContent sx={{ textAlign: "center", py: 2 }}>
                              <Typography variant="h4" color="primary">
                                {aggregateAnalytics.totalTasks}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Total Tasks
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card variant="outlined">
                            <CardContent sx={{ textAlign: "center", py: 2 }}>
                              <Typography variant="h4" color="success.main">
                                {aggregateAnalytics.totalHours}h
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Total Hours
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card variant="outlined">
                            <CardContent sx={{ textAlign: "center", py: 2 }}>
                              <Typography variant="h4" color="success.main">
                                {formatPrice(aggregateAnalytics.totalFixedCost)}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Fixed Cost
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card variant="outlined">
                            <CardContent sx={{ textAlign: "center", py: 2 }}>
                              <Typography variant="h4" color="info.main">
                                {aggregateAnalytics.averageHours.toFixed(1)}h
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Avg/Task
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* Component Tasks Lists */}
                  {componentTasks.map((componentData, index) => (
                    <Box key={componentData.componentId} sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <AssignmentIcon color="action" fontSize="small" />
                        {componentData.componentName}
                        <Chip
                          label={`${componentData.tasks.length} tasks`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Typography>

                      <List disablePadding>
                        {componentData.tasks.map((task) => (
                          <ListItem
                            key={task.id}
                            sx={{
                              bgcolor: "background.paper",
                              borderRadius: 1,
                              mb: 1,
                              border: 1,
                              borderColor: "divider",
                              ml: 2,
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
                                  {task.task_template?.pricing_type ===
                                    "Fixed" &&
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
                                  {task.task_template?.pricing_type ===
                                    "Hourly" && (
                                    <Chip
                                      label="Hourly Rate"
                                      size="small"
                                      variant="outlined"
                                      color="info"
                                    />
                                  )}{" "}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                aria-label="edit"
                                onClick={() =>
                                  (window.location.href = `/app-crm/settings/services/tasks/component/${componentData.componentId}/${task.id}`)
                                }
                                size="small"
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>

                      {index < componentTasks.length - 1 && (
                        <Divider sx={{ my: 2 }} />
                      )}
                    </Box>
                  ))}
                </>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};

export default DeliverableTaskManager;
