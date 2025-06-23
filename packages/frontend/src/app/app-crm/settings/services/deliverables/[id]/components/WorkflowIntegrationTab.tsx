"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
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
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Timeline as TimelineIcon,
  Autorenew as AutorenewIcon,
} from "@mui/icons-material";

interface WorkflowStep {
  id: number;
  name: string;
  description: string;
  order_index: number;
  estimated_hours: number;
  dependencies: number[];
  auto_generate_tasks: boolean;
}

interface ComponentWorkflow {
  component_id: number;
  component_name: string;
  component_type: "COVERAGE_LINKED" | "EDIT";
  workflow_template_id: number;
  workflow_name: string;
  steps: WorkflowStep[];
  is_customizable: boolean;
}

interface DeliverableWorkflow {
  deliverable_id: number;
  inherited_workflows: ComponentWorkflow[];
  custom_steps: WorkflowStep[];
  total_estimated_hours: number;
  total_tasks_to_generate: number;
}

interface WorkflowIntegrationTabProps {
  deliverableId: number;
}

export default function WorkflowIntegrationTab({
  deliverableId,
}: WorkflowIntegrationTabProps) {
  const [workflows, setWorkflows] = useState<DeliverableWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] =
    useState<ComponentWorkflow | null>(null);

  useEffect(() => {
    loadDeliverableWorkflows();
  }, [deliverableId]);

  const loadDeliverableWorkflows = async () => {
    try {
      setLoading(true);

      // Mock data for now - will connect to real API
      const mockWorkflows: DeliverableWorkflow = {
        deliverable_id: deliverableId,
        inherited_workflows: [
          {
            component_id: 1,
            component_name: "Ceremony Processional",
            component_type: "COVERAGE_LINKED",
            workflow_template_id: 1,
            workflow_name: "Coverage Scene Workflow",
            is_customizable: true,
            steps: [
              {
                id: 1,
                name: "Setup Equipment",
                description: "Position cameras for processional shots",
                order_index: 1,
                estimated_hours: 0.5,
                dependencies: [],
                auto_generate_tasks: true,
              },
              {
                id: 2,
                name: "Capture Processional",
                description: "Film the processional with multiple angles",
                order_index: 2,
                estimated_hours: 1.0,
                dependencies: [1],
                auto_generate_tasks: true,
              },
              {
                id: 3,
                name: "Review Footage",
                description: "Quick review of captured footage",
                order_index: 3,
                estimated_hours: 0.25,
                dependencies: [2],
                auto_generate_tasks: true,
              },
            ],
          },
          {
            component_id: 3,
            component_name: "Opening Title Sequence",
            component_type: "EDIT",
            workflow_template_id: 2,
            workflow_name: "Edit Component Workflow",
            is_customizable: true,
            steps: [
              {
                id: 4,
                name: "Design Title Graphics",
                description: "Create custom title graphics and animations",
                order_index: 1,
                estimated_hours: 2.0,
                dependencies: [],
                auto_generate_tasks: true,
              },
              {
                id: 5,
                name: "Color Correction",
                description: "Apply color grading to title sequence",
                order_index: 2,
                estimated_hours: 1.0,
                dependencies: [4],
                auto_generate_tasks: true,
              },
            ],
          },
        ],
        custom_steps: [],
        total_estimated_hours: 4.75,
        total_tasks_to_generate: 5,
      };

      setWorkflows(mockWorkflows);
    } catch (error) {
      console.error("Error loading deliverable workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditWorkflow = (workflow: ComponentWorkflow) => {
    setSelectedWorkflow(workflow);
    setEditDialogOpen(true);
  };

  const handleGenerateTasks = async () => {
    try {
      // This will call the backend API to generate tasks from workflow
      const response = await fetch(
        `/api/deliverables/${deliverableId}/generate-tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.ok) {
        alert("Tasks generated successfully!");
        // Refresh the workflows to show updated task count
        loadDeliverableWorkflows();
      }
    } catch (error) {
      console.error("Error generating tasks:", error);
    }
  };

  if (loading) {
    return <Box sx={{ p: 2 }}>Loading workflows...</Box>;
  }

  if (!workflows) {
    return <Box sx={{ p: 2 }}>No workflows found</Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Workflow Integration
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Components and coverage scenes bring their predefined workflows.
          Customize them here and generate tasks automatically.
        </Typography>
      </Box>

      {/* Workflow Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="primary">
                {workflows.inherited_workflows.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inherited Workflows
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="secondary">
                {workflows.total_estimated_hours}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Estimated Hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="success.main">
                {workflows.total_tasks_to_generate}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tasks to Generate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}>
            <Button
              variant="contained"
              startIcon={<AutorenewIcon />}
              onClick={handleGenerateTasks}
              fullWidth
              size="large"
            >
              Generate Tasks
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>How it works:</strong> Each component and coverage scene comes
          with predefined workflows. These workflows define the steps needed to
          complete that component. You can customize the workflows here, and
          then generate tasks automatically for your team.
        </Typography>
      </Alert>

      {/* Inherited Workflows */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Component Workflows
      </Typography>

      {workflows.inherited_workflows.map((workflow) => (
        <Accordion key={workflow.component_id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
              <TimelineIcon sx={{ mr: 2, color: "primary.main" }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1">
                  {workflow.component_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {workflow.workflow_name} • {workflow.steps.length} steps •
                  {workflow.steps.reduce(
                    (acc, step) => acc + step.estimated_hours,
                    0,
                  )}
                  h estimated
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={workflow.component_type}
                  size="small"
                  color={
                    workflow.component_type === "COVERAGE_LINKED"
                      ? "primary"
                      : "secondary"
                  }
                />
                {workflow.is_customizable && (
                  <Chip label="Customizable" size="small" variant="outlined" />
                )}
              </Stack>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Step</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Hours</TableCell>
                    <TableCell align="center">Auto-Task</TableCell>
                    <TableCell align="center">Dependencies</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workflow.steps.map((step) => (
                    <TableRow key={step.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {step.order_index}. {step.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {step.description}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={step.estimated_hours + "h"}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={step.auto_generate_tasks ? "Yes" : "No"}
                          size="small"
                          color={
                            step.auto_generate_tasks ? "success" : "default"
                          }
                        />
                      </TableCell>
                      <TableCell align="center">
                        {step.dependencies.length > 0 ? (
                          <Chip
                            label={step.dependencies.length + " deps"}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            None
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleEditWorkflow(workflow)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Edit Workflow Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit Workflow: {selectedWorkflow?.component_name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Customize the workflow steps for this component. Changes will affect
            task generation.
          </Typography>
          {/* Workflow editing interface would go here */}
          <Alert severity="info">
            Workflow editing interface coming soon. This will allow you to:
            <ul>
              <li>Modify step descriptions and estimated hours</li>
              <li>Add or remove workflow steps</li>
              <li>Configure task auto-generation settings</li>
              <li>Set up step dependencies</li>
            </ul>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setEditDialogOpen(false)}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
