"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Stack,
  Skeleton,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  PlayArrow as PlayIcon,
  AutoAwesome as AutoIcon,
  Timeline as TimelineIcon,
  Task as TaskIcon,
  AccountTree as WorkflowIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

// Types for the universal workflow component
interface WorkflowTemplate {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  stages: WorkflowStage[];
  created_at: string;
  updated_at: string;
}

interface WorkflowStage {
  id: number;
  name: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  task_generation_rules: TaskGenerationRule[];
}

interface TaskGenerationRule {
  id: number;
  task_template_id: number;
  component_type?: string;
  coverage_scene_id?: number;
  is_required: boolean;
  auto_assign_to_role?: string;
  conditions?: Record<string, unknown>;
  task_template?: {
    id: number;
    name: string;
    description?: string;
    estimated_duration: number;
  };
}

export interface UniversalWorkflowProps {
  entityType: "deliverable" | "component" | "coverage_scene" | "editing_style";
  entityId: number;
  entityName: string;
  currentWorkflowId?: number;
  onWorkflowChange?: (workflowId: number | null) => void;
  showTaskGeneration?: boolean;
  readonly?: boolean;
}

export default function UniversalWorkflowManager({
  entityType,
  entityId,
  entityName,
  currentWorkflowId,
  onWorkflowChange,
  showTaskGeneration = true,
  readonly = false,
}: UniversalWorkflowProps) {
  // State management
  const [loading, setLoading] = useState(true);
  const [workflow, setWorkflow] = useState<WorkflowTemplate | null>(null);
  const [availableWorkflows, setAvailableWorkflows] = useState<
    WorkflowTemplate[]
  >([]);
  const [addStageDialog, setAddStageDialog] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageDescription, setNewStageDescription] = useState("");
  const [assignWorkflowDialog, setAssignWorkflowDialog] = useState(false);

  // Load workflow data
  useEffect(() => {
    loadWorkflowData();
  }, [entityId, currentWorkflowId]);

  const loadWorkflowData = async () => {
    try {
      setLoading(true);

      // Load current workflow if assigned
      if (currentWorkflowId) {
        const workflowResponse = await fetch(
          `http://localhost:3002/workflows/${currentWorkflowId}`,
        );
        if (workflowResponse.ok) {
          const workflowData = await workflowResponse.json();
          setWorkflow(workflowData);
        }
      }

      // Load available workflows for assignment
      const availableResponse = await fetch("http://localhost:3002/workflows");
      if (availableResponse.ok) {
        const availableData = await availableResponse.json();
        setAvailableWorkflows(availableData);
      }
    } catch (error) {
      console.error("Error loading workflow data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEntityDisplayName = () => {
    switch (entityType) {
      case "deliverable":
        return "Deliverable";
      case "component":
        return "Component";
      case "coverage_scene":
        return "Coverage Scene";
      case "editing_style":
        return "Editing Style";
      default:
        return "Entity";
    }
  };

  const getEntityIcon = () => {
    switch (entityType) {
      case "deliverable":
        return "📋";
      case "component":
        return "🔧";
      case "coverage_scene":
        return "🎬";
      case "editing_style":
        return "🎨";
      default:
        return "📄";
    }
  };

  const handleAssignWorkflow = async (workflowId: number) => {
    try {
      // Update the entity with the new workflow
      const response = await fetch(
        `http://localhost:3002/${entityType}s/${entityId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workflow_template_id: workflowId }),
        },
      );

      if (response.ok) {
        setAssignWorkflowDialog(false);
        onWorkflowChange?.(workflowId);
        await loadWorkflowData();
      }
    } catch (error) {
      console.error("Error assigning workflow:", error);
    }
  };

  const handleRemoveWorkflow = async () => {
    try {
      const response = await fetch(
        `http://localhost:3002/${entityType}s/${entityId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workflow_template_id: null }),
        },
      );

      if (response.ok) {
        setWorkflow(null);
        onWorkflowChange?.(null);
        await loadWorkflowData();
      }
    } catch (error) {
      console.error("Error removing workflow:", error);
    }
  };

  const handleAddStage = async () => {
    if (!newStageName.trim() || !workflow) return;

    try {
      const response = await fetch(
        `http://localhost:3002/workflows/${workflow.id}/stages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newStageName,
            description: newStageDescription,
            order_index: workflow.stages.length + 1,
          }),
        },
      );

      if (response.ok) {
        setNewStageName("");
        setNewStageDescription("");
        setAddStageDialog(false);
        await loadWorkflowData();
      }
    } catch (error) {
      console.error("Error adding stage:", error);
    }
  };

  const handleDeleteStage = async (stageId: number) => {
    try {
      const response = await fetch(
        `http://localhost:3002/workflows/stages/${stageId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        await loadWorkflowData();
      }
    } catch (error) {
      console.error("Error deleting stage:", error);
    }
  };

  const getTotalEstimatedHours = () => {
    if (!workflow) return 0;
    return workflow.stages.reduce((total, stage) => {
      return (
        total +
        stage.task_generation_rules.reduce((stageTotal, rule) => {
          return stageTotal + (rule.task_template?.estimated_duration || 0);
        }, 0)
      );
    }, 0);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Workflow Management" />
        <CardContent>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="rectangular" height={40} />
            <Skeleton variant="rectangular" height={40} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <WorkflowIcon />
            <Typography variant="h6">Workflow Management</Typography>
            <Chip
              label={`${getEntityIcon()} ${getEntityDisplayName()}`}
              size="small"
              variant="outlined"
            />
          </Box>
        }
        subheader={`Configure workflow for: ${entityName}`}
        action={
          !readonly && (
            <Stack direction="row" spacing={1}>
              {workflow && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setAddStageDialog(true)}
                  size="small"
                >
                  Add Stage
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={workflow ? <EditIcon /> : <AddIcon />}
                onClick={() => setAssignWorkflowDialog(true)}
                size="small"
              >
                {workflow ? "Change" : "Assign"} Workflow
              </Button>
            </Stack>
          )
        }
      />
      <CardContent>
        {!workflow ? (
          <Alert
            severity="info"
            action={
              !readonly && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setAssignWorkflowDialog(true)}
                >
                  Assign Workflow
                </Button>
              )
            }
          >
            No workflow template assigned to this{" "}
            {getEntityDisplayName().toLowerCase()}.
            {!readonly && " Assign one to enable automated task generation."}
          </Alert>
        ) : (
          <Box>
            {/* Workflow Summary */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: "center", py: 2 }}>
                    <TimelineIcon
                      sx={{ fontSize: 32, color: "primary.main", mb: 1 }}
                    />
                    <Typography variant="h5" color="primary">
                      {workflow.stages.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stages
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: "center", py: 2 }}>
                    <TaskIcon
                      sx={{ fontSize: 32, color: "secondary.main", mb: 1 }}
                    />
                    <Typography variant="h5" color="secondary">
                      {workflow.stages.reduce(
                        (total, stage) =>
                          total + stage.task_generation_rules.length,
                        0,
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Task Rules
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: "center", py: 2 }}>
                    <AutoIcon
                      sx={{ fontSize: 32, color: "success.main", mb: 1 }}
                    />
                    <Typography variant="h5" color="success.main">
                      {getTotalEstimatedHours()}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Est. Duration
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: "center", py: 2 }}>
                    <PlayIcon
                      sx={{ fontSize: 32, color: "warning.main", mb: 1 }}
                    />
                    <Typography variant="h5" color="warning.main">
                      {workflow.is_active ? "Active" : "Inactive"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Workflow Details */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {workflow.name}
              </Typography>
              {workflow.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {workflow.description}
                </Typography>
              )}
            </Box>

            {/* Workflow Stages */}
            <Typography variant="h6" gutterBottom>
              Workflow Stages
            </Typography>
            {workflow.stages.length === 0 ? (
              <Alert severity="warning">
                No stages defined. Add stages to create a complete workflow.
              </Alert>
            ) : (
              <List>
                {workflow.stages
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((stage, index) => (
                    <React.Fragment key={stage.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              backgroundColor: "primary.main",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "bold",
                            }}
                          >
                            {index + 1}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 600 }}
                              >
                                {stage.name}
                              </Typography>
                              <Chip
                                label={`${stage.task_generation_rules.length} tasks`}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={stage.description}
                        />
                        {!readonly && (
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() =>
                                console.log("Edit stage:", stage.name)
                              }
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteStage(stage.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        )}
                      </ListItem>
                      {index < workflow.stages.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
              </List>
            )}

            {/* Task Generation Preview */}
            {showTaskGeneration && (
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<PlayIcon />}
                  onClick={() =>
                    console.log("Preview task generation for:", entityName)
                  }
                  fullWidth
                >
                  Preview Task Generation
                </Button>
              </Box>
            )}

            {/* Remove Workflow */}
            {!readonly && (
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleRemoveWorkflow}
                >
                  Remove Workflow
                </Button>
              </Box>
            )}
          </Box>
        )}
      </CardContent>

      {/* Assign Workflow Dialog */}
      <Dialog
        open={assignWorkflowDialog}
        onClose={() => setAssignWorkflowDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {workflow ? "Change" : "Assign"} Workflow Template
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a workflow template to assign to this{" "}
            {getEntityDisplayName().toLowerCase()}:
          </Typography>
          <List>
            {availableWorkflows.map((availableWorkflow) => (
              <ListItem
                key={availableWorkflow.id}
                button
                onClick={() => handleAssignWorkflow(availableWorkflow.id)}
                selected={availableWorkflow.id === currentWorkflowId}
              >
                <ListItemIcon>
                  <WorkflowIcon />
                </ListItemIcon>
                <ListItemText
                  primary={availableWorkflow.name}
                  secondary={`${availableWorkflow.stages.length} stages • ${availableWorkflow.description || "No description"}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignWorkflowDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Add Stage Dialog */}
      <Dialog
        open={addStageDialog}
        onClose={() => setAddStageDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Workflow Stage</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Stage Name"
              fullWidth
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="e.g., Review Footage, Color Correction"
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newStageDescription}
              onChange={(e) => setNewStageDescription(e.target.value)}
              placeholder="Describe what happens in this stage..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddStageDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddStage}
            variant="contained"
            disabled={!newStageName.trim()}
          >
            Add Stage
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
