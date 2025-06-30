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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Analytics as AnalyticsIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
  AccountTree as RelationIcon,
} from "@mui/icons-material";
import TaskTemplatesAccordion from "./TaskTemplatesAccordion";
import AdvancedTaskTemplateManager from "./AdvancedTaskTemplateManager";
import AdvancedTimelineManager from "./AdvancedTimelineManager";

interface UniversalTaskManagerProps {
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

interface RelatedEntityData {
  entityId: number;
  entityName: string;
  entityType: string;
}

interface RelatedEntityTaskData {
  entityId: number;
  entityName: string;
  entityType: string;
  tasks: EntityDefaultTask[];
}

interface RelationshipMapping {
  component: string[];
  deliverable: string[];
  coverage_scene: string[];
}

interface CoverageScene {
  id: number;
  name: string;
  components?: { id: number; name: string }[];
}

interface DeliverableTemplate {
  id: number;
  name: string;
  assigned_components?: {
    component_id: number;
    component?: { id: number; name: string };
  }[];
}

const UniversalTaskManager: React.FC<UniversalTaskManagerProps> = ({
  entityType,
  entityId,
  entityName,
}) => {
  const [relatedEntityTasks, setRelatedEntityTasks] = useState<
    RelatedEntityTaskData[]
  >([]);
  const [relatedEntities, setRelatedEntities] = useState<RelatedEntityData[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // In-place editing state
  const [editingTask, setEditingTask] = useState<{
    taskId: number;
    originalTask: EntityDefaultTask;
    sourceEntityId: number;
    sourceEntityType: string;
  } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedTaskName, setEditedTaskName] = useState("");
  const [editedHours, setEditedHours] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Define relationship mappings based on requirements
  const relationshipMappings: RelationshipMapping = {
    component: ["coverage_scene", "deliverable"], // Components show coverage scenes AND deliverables
    deliverable: ["component"], // Deliverables show components they contain
    coverage_scene: ["component"], // Coverage scenes show components that reference them
  };

  useEffect(() => {
    fetchRelatedEntityTasks();
  }, [entityType, entityId]);

  const fetchRelatedEntityTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const relatedTasksData: RelatedEntityTaskData[] = [];
      const relatedEntitiesData: RelatedEntityData[] = [];

      if (entityType === "deliverable") {
        // Deliverable → Components relationship (with tasks)
        const deliverableResponse = await fetch(
          `http://localhost:3002/deliverables/templates/${entityId}`,
        );
        if (deliverableResponse.ok) {
          const deliverable = await deliverableResponse.json();
          const assignedComponents = deliverable.assigned_components || [];

          // Fetch tasks for each assigned component
          for (const assignment of assignedComponents) {
            try {
              const componentId =
                assignment.component_id || assignment.component?.id;
              if (!componentId) continue;

              const tasksResponse = await fetch(
                `http://localhost:3002/api/entities/component/${componentId}/default-tasks`,
              );

              if (tasksResponse.ok) {
                const tasksResult = await tasksResponse.json();
                const tasks = tasksResult.data || [];

                if (tasks.length > 0) {
                  relatedTasksData.push({
                    entityId: componentId,
                    entityName:
                      assignment.component?.name || `Component ${componentId}`,
                    entityType: "component",
                    tasks,
                  });
                }
              }
            } catch (err) {
              console.error(
                `Error fetching tasks for component ${assignment.component_id}:`,
                err,
              );
            }
          }
        }
      } else if (entityType === "component") {
        // Component → Coverage Scenes + Deliverables relationship (without tasks, just list)
        try {
          const coverageScenesResponse = await fetch(
            `http://localhost:3002/coverage-scenes`,
          );
          if (coverageScenesResponse.ok) {
            const allCoverageScenes = await coverageScenesResponse.json();

            // Filter scenes that reference this component
            const relatedScenes = allCoverageScenes.filter(
              (scene: CoverageScene) =>
                scene.components &&
                scene.components.some((comp) => comp.id === entityId),
            );

            for (const scene of relatedScenes) {
              relatedEntitiesData.push({
                entityId: scene.id,
                entityName: scene.name || `Coverage Scene ${scene.id}`,
                entityType: "coverage_scene",
              });
            }
          }
        } catch (err) {
          console.error("Error fetching coverage scenes:", err);
        }

        // Component → Deliverables relationship (without tasks, just list)
        try {
          const deliverablesResponse = await fetch(
            `http://localhost:3002/deliverables/templates`,
          );
          if (deliverablesResponse.ok) {
            const allDeliverables = await deliverablesResponse.json();

            // Filter deliverables that contain this component
            const relatedDeliverables = allDeliverables.filter(
              (deliverable: DeliverableTemplate) =>
                deliverable.assigned_components &&
                deliverable.assigned_components.some(
                  (assignment) =>
                    assignment.component_id === entityId ||
                    assignment.component?.id === entityId,
                ),
            );

            for (const deliverable of relatedDeliverables) {
              relatedEntitiesData.push({
                entityId: deliverable.id,
                entityName: deliverable.name || `Deliverable ${deliverable.id}`,
                entityType: "deliverable",
              });
            }
          }
        } catch (err) {
          console.error("Error fetching deliverables:", err);
        }
      } else if (entityType === "coverage_scene") {
        // Coverage Scene → Components relationship (with tasks)
        try {
          const sceneResponse = await fetch(
            `http://localhost:3002/coverage-scenes/${entityId}`,
          );
          if (sceneResponse.ok) {
            const scene = await sceneResponse.json();
            const sceneComponents = scene.components || [];

            for (const component of sceneComponents) {
              const tasksResponse = await fetch(
                `http://localhost:3002/api/entities/component/${component.id}/default-tasks`,
              );

              if (tasksResponse.ok) {
                const tasksResult = await tasksResponse.json();
                const tasks = tasksResult.data || [];

                if (tasks.length > 0) {
                  relatedTasksData.push({
                    entityId: component.id,
                    entityName: component.name || `Component ${component.id}`,
                    entityType: "component",
                    tasks,
                  });
                }
              }
            }
          }
        } catch (err) {
          console.error("Error fetching coverage scene components:", err);
        }
      }

      setRelatedEntityTasks(relatedTasksData);
      setRelatedEntities(relatedEntitiesData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load related entity tasks",
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

  // Calculate analytics for current entity only (as specified)
  const [currentEntityTasks, setCurrentEntityTasks] = useState<
    EntityDefaultTask[]
  >([]);

  // Fetch current entity's own tasks for analytics
  useEffect(() => {
    const fetchCurrentEntityTasks = async () => {
      try {
        const response = await fetch(
          `http://localhost:3002/api/entities/${entityType}/${entityId}/default-tasks`,
        );
        if (response.ok) {
          const result = await response.json();
          setCurrentEntityTasks(result.data || []);
        }
      } catch (err) {
        console.error(
          "Error fetching current entity tasks for analytics:",
          err,
        );
      }
    };

    fetchCurrentEntityTasks();
  }, [entityType, entityId]);

  const calculateEntityAnalytics = () => {
    // Analytics for current entity tasks only
    if (currentEntityTasks.length === 0) return null;

    const totalHours = currentEntityTasks.reduce(
      (sum, task) => sum + task.estimated_hours,
      0,
    );
    const totalFixedCost = currentEntityTasks.reduce((sum, task) => {
      return (
        sum +
        (task.task_template?.pricing_type === "Fixed"
          ? task.task_template?.fixed_price || 0
          : 0)
      );
    }, 0);
    const hourlyTasks = currentEntityTasks.filter(
      (task) => task.task_template?.pricing_type === "Hourly",
    ).length;
    const fixedTasks = currentEntityTasks.filter(
      (task) => task.task_template?.pricing_type === "Fixed",
    ).length;

    return {
      totalTasks: currentEntityTasks.length,
      totalEntities: 1, // Current entity only
      totalHours,
      totalFixedCost,
      hourlyTasks,
      fixedTasks,
      averageHours:
        currentEntityTasks.length > 0
          ? totalHours / currentEntityTasks.length
          : 0,
    };
  };

  const analytics = calculateEntityAnalytics();

  const getRelatedEntityDisplayName = (entityType: string) => {
    const names = {
      component: "Component",
      deliverable: "Deliverable",
      coverage_scene: "Coverage Scene",
    };
    return names[entityType as keyof typeof names] || entityType;
  };

  const getRelatedEntitiesDisplayName = (entityType: string) => {
    const names = {
      component: "Components",
      deliverable: "Deliverables",
      coverage_scene: "Coverage Scenes",
    };
    return names[entityType as keyof typeof names] || entityType;
  };

  // Functions for in-place editing with entity-specific overrides
  const handleEditTask = (
    task: EntityDefaultTask,
    sourceEntityId: number,
    sourceEntityType: string,
  ) => {
    setEditingTask({
      taskId: task.id,
      originalTask: task,
      sourceEntityId,
      sourceEntityType,
    });
    setEditedTaskName(task.task_name);
    setEditedHours(task.estimated_hours);
    setEditDialogOpen(true);
  };

  const handleSaveTaskOverride = async () => {
    if (!editingTask) return;

    setSaving(true);
    try {
      // Create entity-specific override by posting a new default task for this entity
      const overrideTaskData = {
        task_name: editedTaskName,
        estimated_hours: editedHours,
        task_template_id: editingTask.originalTask.task_template_id,
        order_index: editingTask.originalTask.order_index,
        // Mark this as an override from another entity
        override_source_entity_type: editingTask.sourceEntityType,
        override_source_entity_id: editingTask.sourceEntityId,
        override_source_task_id: editingTask.taskId,
      };

      const response = await fetch(
        `http://localhost:3002/api/entities/${entityType}/${entityId}/default-tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(overrideTaskData),
        },
      );

      if (response.ok) {
        // Close dialog and refresh the related tasks
        setEditDialogOpen(false);
        setEditingTask(null);
        await fetchRelatedEntityTasks();
      } else {
        const errorData = await response.json();
        setError(
          `Failed to save task override: ${errorData.message || "Unknown error"}`,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save task override",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setEditingTask(null);
    setEditedTaskName("");
    setEditedHours(0);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Visual Timeline Management (Phase 2C) */}
      {(entityType === "deliverable" || entityType === "coverage_scene") && (
        <Box sx={{ mb: 1 }}>
          <AdvancedTimelineManager
            entityType={entityType}
            entityId={entityId}
            entityName={entityName}
          />
        </Box>
      )}

      {/* Legacy Task Templates (keeping for backward compatibility) */}
      <Box sx={{ mb: 1 }}>
        <TaskTemplatesAccordion
          entityType={entityType}
          entityId={entityId}
          entityName={entityName}
        />
      </Box>

      {/* Related Entity Tasks Section */}
      <Box sx={{ mb: 2 }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <RelationIcon color="secondary" />
              <Typography variant="h6">
                Related{" "}
                {relationshipMappings[entityType]
                  .map((type) => getRelatedEntitiesDisplayName(type))
                  .join(" & ")}{" "}
                Tasks
              </Typography>
              <Chip
                label={`${relatedEntityTasks.length + relatedEntities.length} entities`}
                size="small"
                color="secondary"
                variant="outlined"
              />
              {analytics && (
                <Chip
                  label={`${analytics.totalTasks} tasks`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {entityType === "component" && relatedEntities.length > 0 && (
                <Chip
                  label="Relationships only"
                  size="small"
                  color="info"
                  variant="outlined"
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ width: "100%" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Tasks from related entities. Edit in-place to create{" "}
                {entityType}-specific overrides.
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
              ) : relatedEntityTasks.length === 0 &&
                relatedEntities.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 3 }}
                >
                  No related entities found. This {entityType} may not be
                  referenced by other entities yet.
                </Typography>
              ) : (
                <>
                  {/* Analytics Dashboard - only show if we have tasks */}
                  {analytics && relatedEntityTasks.length > 0 && (
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
                        Related Tasks Summary
                      </Typography>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card variant="outlined">
                            <CardContent sx={{ textAlign: "center", py: 2 }}>
                              <Typography variant="h4" color="primary">
                                {analytics.totalTasks}
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
                                {analytics.totalHours}h
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
                                {formatPrice(analytics.totalFixedCost)}
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
                                {analytics.averageHours.toFixed(1)}h
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

                  {/* Related Entity Tasks Lists */}
                  {relatedEntityTasks.map((relatedEntityData, index) => (
                    <Box key={relatedEntityData.entityId} sx={{ mb: 2 }}>
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
                        {getRelatedEntityDisplayName(
                          relatedEntityData.entityType,
                        )}
                        : {relatedEntityData.entityName}
                        <Chip
                          label={`${relatedEntityData.tasks.length} tasks`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Typography>

                      <List disablePadding>
                        {relatedEntityData.tasks.map((task) => (
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
                                  )}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                aria-label="edit override"
                                onClick={() => {
                                  handleEditTask(
                                    task,
                                    relatedEntityData.entityId,
                                    relatedEntityData.entityType,
                                  );
                                }}
                                size="small"
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>

                      {index < relatedEntityTasks.length - 1 && (
                        <Divider sx={{ my: 2 }} />
                      )}
                    </Box>
                  ))}

                  {/* Related Entities List (without tasks) */}
                  {relatedEntities.length > 0 && (
                    <Box sx={{ mt: relatedEntityTasks.length > 0 ? 3 : 0 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <RelationIcon color="action" fontSize="small" />
                        Related Entities
                        <Chip
                          label={`${relatedEntities.length} entities`}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      </Typography>

                      <List disablePadding>
                        {relatedEntities.map((entity) => (
                          <ListItem
                            key={`${entity.entityType}-${entity.entityId}`}
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
                              primary={
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Typography variant="body1">
                                    {entity.entityName}
                                  </Typography>
                                  <Chip
                                    label={getRelatedEntityDisplayName(
                                      entity.entityType,
                                    )}
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                  />
                                </Box>
                              }
                              secondary={`This component is used in this ${entity.entityType.replace("_", " ")}`}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                aria-label="view entity"
                                onClick={() => {
                                  const basePath =
                                    entity.entityType === "coverage_scene"
                                      ? "/app-crm/settings/services/coverage-scenes"
                                      : entity.entityType === "deliverable"
                                        ? "/app-crm/settings/services/deliverables"
                                        : "/app-crm/components";
                                  window.location.href = `${basePath}/${entity.entityId}`;
                                }}
                                size="small"
                                color="primary"
                              >
                                <RelationIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Direct Entity Tasks with Advanced Template Management */}
      <Box sx={{ mt: 2 }}>
        <AdvancedTaskTemplateManager
          entityType={entityType}
          entityId={entityId}
          entityName={entityName}
        />
      </Box>

      {/* Edit Task Override Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCancelEdit}>
        <DialogTitle>Edit Task Override</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Name"
            type="text"
            fullWidth
            variant="outlined"
            value={editedTaskName}
            onChange={(e) => setEditedTaskName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Estimated Hours"
            type="number"
            fullWidth
            variant="outlined"
            value={editedHours}
            onChange={(e) => setEditedHours(Number(e.target.value))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleSaveTaskOverride}
            color="primary"
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : "Save Override"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UniversalTaskManager;
