"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Grid, CircularProgress, Paper, Typography } from "@mui/material";

import { deliverableAPI } from "../../_shared/api";
import { DeliverableTemplate } from "../../_shared/types";
import {
  DeliverableHeader,
  StyleManagementSection,
  DeliverableDangerZone,
} from "./components";
import UniversalTaskManager from "../../../../_components/UniversalTaskManager";
import VisualTimelineBuilder from "../../../../_components/VisualTimelineBuilder";

// Timeline-related interfaces for typing
interface TimelineComponent {
  id: number;
  name: string;
  start_time: number;
  duration: number;
  track_id: number;
  component_type: "video" | "audio" | "graphics" | "music";
  color: string;
  description?: string;
  thumbnail?: string;
  locked?: boolean;
  database_type?:
    | "GRAPHICS"
    | "VIDEO"
    | "AUDIO"
    | "MUSIC"
    | "EDIT"
    | "COVERAGE_LINKED";
}

interface DefaultTask {
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

export default function DeliverableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [deliverable, setDeliverable] = useState<DeliverableTemplate | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const deliverableId = params.id as string;

  useEffect(() => {
    if (deliverableId) {
      loadDeliverable();
    }
  }, [deliverableId]);

  const loadDeliverable = async () => {
    try {
      const data = await deliverableAPI.getTemplate(parseInt(deliverableId));
      setDeliverable(data);
    } catch (error) {
      console.error("Error loading deliverable:", error);
      router.push("/app-crm/settings/services/deliverables");
    } finally {
      setLoading(false);
    }
  };

  // Save timeline components to deliverable
  const saveTimelineComponents = async (components: TimelineComponent[]) => {
    if (!deliverable) return;

    try {
      console.log("Saving timeline components:", components);

      // Convert timeline components to deliverable format
      const deliverableComponents = components.map((comp, index) => ({
        component_id: comp.id,
        order_index: index,
        editing_style: comp.component_type,
        duration_override: comp.duration,
      }));

      // Save to backend
      if (deliverableComponents.length > 0) {
        const updatedDeliverable = await deliverableAPI.updateComponents(
          deliverable.id,
          deliverableComponents,
        );
        setDeliverable(updatedDeliverable);
      }
    } catch (error) {
      console.error("Error saving timeline components:", error);
    }
  };

  const handleDelete = async () => {
    if (!deliverable) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete "${deliverable.name}"? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    try {
      setDeleting(true);
      await deliverableAPI.deleteTemplate(deliverable.id);
      router.push("/app-crm/settings/services/deliverables");
    } catch (error) {
      console.error("Error deleting deliverable:", error);
      alert("Error deleting deliverable. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!deliverable) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: "100%", mx: "auto", p: 3 }}>
      <DeliverableHeader
        deliverable={deliverable}
        onDeliverableUpdated={setDeliverable}
      />

      <Grid container spacing={3}>
        {/* Style Management Section */}
        <Grid item xs={12}>
          <StyleManagementSection
            deliverable={deliverable}
            onDeliverableUpdated={setDeliverable}
          />
        </Grid>

        {/* Visual Timeline Builder */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Visual Timeline Builder
            </Typography>
            <VisualTimelineBuilder
              deliverableId={deliverable.id}
              initialComponents={[]}
              onSave={saveTimelineComponents}
              onComponentAdded={async (
                componentId: number,
                defaultTasks: DefaultTask[],
              ) => {
                console.log(
                  "Component added to timeline:",
                  componentId,
                  defaultTasks,
                );
                // Here you can add logic to handle when a component is added to timeline
              }}
            />
          </Paper>
        </Grid>

        {/* Default Tasks */}
        <Grid item xs={12}>
          {deliverable && (
            <UniversalTaskManager
              entityType="deliverable"
              entityId={deliverable.id}
              entityName={deliverable.name}
            />
          )}
        </Grid>

        <Grid item xs={12}>
          <DeliverableDangerZone onDelete={handleDelete} deleting={deleting} />
        </Grid>
      </Grid>
    </Box>
  );
}
