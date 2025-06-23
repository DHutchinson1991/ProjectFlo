"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Autocomplete,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

interface TaskTemplateCreationProps {
  open: boolean;
  onClose: () => void;
  onTaskTemplateCreated: (taskTemplate: TaskTemplate) => void;
  entityType: "component" | "deliverable" | "coverage_scene";
  entityId: number;
}

interface TaskTemplate {
  id: number;
  name: string;
  phase?: string;
  effort_hours?: number;
  pricing_type?: "Hourly" | "Fixed";
  fixed_price?: number;
  average_duration_hours?: number;
  effort_calculation_rules?: Record<string, unknown>;
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

const TaskTemplateCreation: React.FC<TaskTemplateCreationProps> = ({
  open,
  onClose,
  onTaskTemplateCreated,
  entityType,
  entityId,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    phase: "",
    category: "",
    priority: "Medium",
    effort_hours: "",
    pricing_type: "Hourly" as "Hourly" | "Fixed",
    fixed_price: "",
    average_duration_hours: "",
    skill_requirements: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create task template
      const templateData = {
        name: formData.name,
        phase: formData.phase || undefined,
        effort_hours: formData.effort_hours
          ? parseFloat(formData.effort_hours)
          : undefined,
        pricing_type: formData.pricing_type,
        fixed_price: formData.fixed_price
          ? parseFloat(formData.fixed_price)
          : undefined,
        average_duration_hours: formData.average_duration_hours
          ? parseFloat(formData.average_duration_hours)
          : undefined,
      };

      const templateResponse = await fetch(
        "http://localhost:3002/task-templates",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templateData),
        },
      );

      if (!templateResponse.ok) {
        const errorData = await templateResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create task template");
      }

      const createdTemplate = await templateResponse.json();

      // Create entity default task from template
      const entityTaskData = {
        templateId: createdTemplate.id,
      };

      const entityTaskResponse = await fetch(
        `http://localhost:3002/api/entities/${entityType}/${entityId}/default-tasks/from-template`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(entityTaskData),
        },
      );

      if (!entityTaskResponse.ok) {
        const errorData = await entityTaskResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add task to entity");
      }

      onTaskTemplateCreated(createdTemplate);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      phase: "",
      category: "",
      priority: "Medium",
      effort_hours: "",
      pricing_type: "Hourly",
      fixed_price: "",
      average_duration_hours: "",
      skill_requirements: "",
      notes: "",
    });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Task Template</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Task Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              fullWidth
              placeholder="e.g., Video Setup, Audio Recording, Color Correction"
            />

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
            />

            <Box sx={{ display: "flex", gap: 2 }}>
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
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Estimated Hours"
                type="number"
                value={formData.effort_hours}
                onChange={(e) =>
                  setFormData({ ...formData, effort_hours: e.target.value })
                }
                inputProps={{ min: 0, step: 0.25 }}
                sx={{ flex: 1 }}
              />

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

            <FormControl fullWidth>
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
                fullWidth
              />
            )}

            <TextField
              label="Skill Requirements"
              value={formData.skill_requirements}
              onChange={(e) =>
                setFormData({ ...formData, skill_requirements: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
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
              rows={3}
              placeholder="Additional notes, special instructions, or dependencies..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.name}
            startIcon={<AddIcon />}
          >
            {loading ? "Creating..." : "Create Task Template"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskTemplateCreation;
