"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Grid,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Note as NoteIcon,
} from "@mui/icons-material";

interface TaskTemplate {
  id: number;
  name: string;
  phase?: string;
  category?: string;
  priority?: string;
  effort_hours?: number;
  pricing_type?: "Hourly" | "Fixed";
  fixed_price?: number;
  average_duration_hours?: number;
  skill_requirements?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface EntityDefaultTask {
  id: number;
  entity_type: "component" | "deliverable" | "coverage_scene";
  entity_id: number;
  task_template_id?: number;
  task_name: string;
  estimated_hours: number;
  order_index: number;
  created_at: string;
  updated_at: string;
  task_template?: TaskTemplate;
}

const COMMON_PHASES = [
  "Pre-Production",
  "Production",
  "Post-Production",
  "Delivery",
  "Review",
  "Approval",
  "Setup",
  "Editing",
  "Color Correction",
  "Audio Mixing",
  "Final Export",
];

const TASK_CATEGORIES = [
  "Setup",
  "Creative",
  "Technical",
  "Review",
  "Administrative",
  "Client Communication",
  "Quality Control",
  "Delivery",
];

const PRIORITY_LEVELS = [
  { value: "Low", label: "Low Priority", color: "#4caf50" },
  { value: "Medium", label: "Medium Priority", color: "#ff9800" },
  { value: "High", label: "High Priority", color: "#f44336" },
  { value: "Critical", label: "Critical", color: "#9c27b0" },
];

export default function TaskEditPage() {
  const params = useParams();
  const router = useRouter();

  const taskId = params.taskId as string;
  const entityType = params.entityType as
    | "component"
    | "deliverable"
    | "coverage_scene";
  const entityId = params.entityId as string;

  const [task, setTask] = useState<EntityDefaultTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    task_name: "",
    estimated_hours: "",
    phase: "",
    category: "",
    priority: "Medium",
    pricing_type: "Hourly" as "Hourly" | "Fixed",
    fixed_price: "",
    average_duration_hours: "",
    skill_requirements: "",
    notes: "",
  });

  useEffect(() => {
    if (taskId && entityType && entityId) {
      loadTask();
    }
  }, [taskId, entityType, entityId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:3002/api/entities/${entityType}/${entityId}/default-tasks`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch task");
      }

      const result = await response.json();
      const taskData = result.data?.find(
        (t: EntityDefaultTask) => t.id === parseInt(taskId),
      );

      if (!taskData) {
        throw new Error("Task not found");
      }

      setTask(taskData);

      // Populate form with task data
      setFormData({
        task_name: taskData.task_name || "",
        estimated_hours: taskData.estimated_hours?.toString() || "",
        phase: taskData.task_template?.phase || "",
        category: taskData.task_template?.category || "",
        priority: taskData.task_template?.priority || "Medium",
        pricing_type: taskData.task_template?.pricing_type || "Hourly",
        fixed_price: taskData.task_template?.fixed_price?.toString() || "",
        average_duration_hours:
          taskData.task_template?.average_duration_hours?.toString() || "",
        skill_requirements: taskData.task_template?.skill_requirements || "",
        notes: taskData.task_template?.notes || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // If task has a template, update the template
      if (task?.task_template_id) {
        const templateData = {
          name: formData.task_name,
          phase: formData.phase || undefined,
          category: formData.category || undefined,
          priority: formData.priority,
          effort_hours: formData.estimated_hours
            ? parseFloat(formData.estimated_hours)
            : undefined,
          pricing_type: formData.pricing_type,
          fixed_price: formData.fixed_price
            ? parseFloat(formData.fixed_price)
            : undefined,
          average_duration_hours: formData.average_duration_hours
            ? parseFloat(formData.average_duration_hours)
            : undefined,
          skill_requirements: formData.skill_requirements || undefined,
          notes: formData.notes || undefined,
        };

        const templateResponse = await fetch(
          `http://localhost:3002/task-templates/${task.task_template_id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(templateData),
          },
        );

        if (!templateResponse.ok) {
          const errorData = await templateResponse.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Failed to update task template",
          );
        }
      }

      // Update the entity default task
      const entityTaskData = {
        task_name: formData.task_name,
        estimated_hours: parseFloat(formData.estimated_hours) || 0,
      };

      const entityResponse = await fetch(
        `http://localhost:3002/api/entities/${entityType}/${entityId}/default-tasks/${taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(entityTaskData),
        },
      );

      if (!entityResponse.ok) {
        const errorData = await entityResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update task");
      }

      // Navigate back to the entity page
      router.push(
        `/app-crm/settings/services/${getEntityTypePlural(entityType)}/${entityId}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      const response = await fetch(
        `http://localhost:3002/api/entities/${entityType}/${entityId}/default-tasks/${taskId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      // Navigate back to the entity page
      router.push(
        `/app-crm/settings/services/${getEntityTypePlural(entityType)}/${entityId}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
      setDeleting(false);
    }
  };

  const getEntityTypePlural = (type: string) => {
    switch (type) {
      case "component":
        return "components";
      case "deliverable":
        return "deliverables";
      case "coverage_scene":
        return "coverage-scenes";
      default:
        return type;
    }
  };

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case "component":
        return "Component";
      case "deliverable":
        return "Deliverable";
      case "coverage_scene":
        return "Coverage Scene";
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority: string) => {
    const level = PRIORITY_LEVELS.find((p) => p.value === priority);
    return level?.color || "#757575";
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!task) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Task not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href={`/app-crm/settings/services/${getEntityTypePlural(entityType)}`}
            sx={{ textDecoration: "none" }}
          >
            {getEntityTypeLabel(entityType)}s
          </Link>
          <Link
            color="inherit"
            href={`/app-crm/settings/services/${getEntityTypePlural(entityType)}/${entityId}`}
            sx={{ textDecoration: "none" }}
          >
            {getEntityTypeLabel(entityType)} #{entityId}
          </Link>
          <Typography color="text.primary">Edit Task</Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => router.back()}
              sx={{ bgcolor: "background.paper" }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography
                variant="h4"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <EditIcon color="primary" />
                Edit Task
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {task.task_name}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              startIcon={<CancelIcon />}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || !formData.task_name}
              startIcon={
                saving ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SaveIcon />
                )
              }
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Task Details
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                label="Task Name"
                value={formData.task_name}
                onChange={(e) =>
                  setFormData({ ...formData, task_name: e.target.value })
                }
                required
                fullWidth
                placeholder="e.g., Video Setup, Audio Recording, Color Correction"
              />

              <Box sx={{ display: "flex", gap: 2 }}>
                <Autocomplete
                  freeSolo
                  options={COMMON_PHASES}
                  value={formData.phase}
                  onChange={(_, value) =>
                    setFormData({ ...formData, phase: value || "" })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Phase"
                      placeholder="e.g., Pre-Production, Post-Production"
                    />
                  )}
                  sx={{ flex: 1 }}
                />

                <Autocomplete
                  freeSolo
                  options={TASK_CATEGORIES}
                  value={formData.category}
                  onChange={(_, value) =>
                    setFormData({ ...formData, category: value || "" })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Category"
                      placeholder="e.g., Creative, Technical"
                    />
                  )}
                  sx={{ flex: 1 }}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    label="Priority"
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                  >
                    {PRIORITY_LEVELS.map((priority) => (
                      <MenuItem key={priority.value} value={priority.value}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              backgroundColor: priority.color,
                            }}
                          />
                          {priority.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Estimated Hours"
                  type="number"
                  value={formData.estimated_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimated_hours: e.target.value,
                    })
                  }
                  inputProps={{ min: 0, step: 0.25 }}
                  sx={{ flex: 1 }}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Pricing Type</InputLabel>
                  <Select
                    value={formData.pricing_type}
                    label="Pricing Type"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing_type: e.target.value as "Hourly" | "Fixed",
                      })
                    }
                  >
                    <MenuItem value="Hourly">Hourly</MenuItem>
                    <MenuItem value="Fixed">Fixed Price</MenuItem>
                  </Select>
                </FormControl>

                {formData.pricing_type === "Fixed" && (
                  <TextField
                    label="Fixed Price ($)"
                    type="number"
                    value={formData.fixed_price}
                    onChange={(e) =>
                      setFormData({ ...formData, fixed_price: e.target.value })
                    }
                    inputProps={{ min: 0, step: 0.01 }}
                    sx={{ flex: 1 }}
                  />
                )}

                <TextField
                  label="Average Duration (hours)"
                  type="number"
                  value={formData.average_duration_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      average_duration_hours: e.target.value,
                    })
                  }
                  inputProps={{ min: 0, step: 0.25 }}
                  sx={{ flex: 1 }}
                />
              </Box>

              <TextField
                label="Skill Requirements"
                value={formData.skill_requirements}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    skill_requirements: e.target.value,
                  })
                }
                fullWidth
                multiline
                rows={3}
                placeholder="e.g., Video editing experience, Adobe Premiere Pro, Color grading knowledge"
              />

              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                fullWidth
                multiline
                rows={4}
                placeholder="Additional notes, special instructions, or dependencies..."
              />
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Task Overview */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Task Overview
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ScheduleIcon color="action" fontSize="small" />
                <Typography variant="body2">
                  <strong>Hours:</strong> {task.estimated_hours}
                </Typography>
              </Box>

              {task.task_template?.priority && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: getPriorityColor(
                        task.task_template.priority,
                      ),
                    }}
                  />
                  <Typography variant="body2">
                    <strong>Priority:</strong> {task.task_template.priority}
                  </Typography>
                </Box>
              )}

              {task.task_template?.pricing_type && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MoneyIcon color="action" fontSize="small" />
                  <Typography variant="body2">
                    <strong>Pricing:</strong> {task.task_template.pricing_type}
                    {task.task_template.pricing_type === "Fixed" &&
                      task.task_template.fixed_price &&
                      ` ($${task.task_template.fixed_price})`}
                  </Typography>
                </Box>
              )}

              {task.task_template?.skill_requirements && (
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <PersonIcon
                    color="action"
                    fontSize="small"
                    sx={{ mt: 0.2 }}
                  />
                  <Typography variant="body2">
                    <strong>Skills:</strong>{" "}
                    {task.task_template.skill_requirements}
                  </Typography>
                </Box>
              )}

              {task.task_template?.notes && (
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <NoteIcon color="action" fontSize="small" sx={{ mt: 0.2 }} />
                  <Typography variant="body2">
                    <strong>Notes:</strong> {task.task_template.notes}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Task History */}
          <Paper sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
            >
              <HistoryIcon color="action" />
              History
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2">
                  {formatDate(task.created_at)}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {formatDate(task.updated_at)}
                </Typography>
              </Box>

              {task.task_template_id && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Template ID
                    </Typography>
                    <Chip
                      label={`#${task.task_template_id}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{task.task_name}&quot;? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={
              deleting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DeleteIcon />
              )
            }
          >
            {deleting ? "Deleting..." : "Delete Task"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
