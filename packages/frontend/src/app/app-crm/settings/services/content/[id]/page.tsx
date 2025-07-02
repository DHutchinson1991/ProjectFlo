"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Grid, CircularProgress, Paper, Typography } from "@mui/material";

import { contentAPI } from "../../_shared/api";
import { ContentTemplate } from "../../_shared/types";
import {
  ContentHeader,
  ContentDangerZone,
} from "./components";
import FilmBuilder from "./components/FilmBuilder";

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

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [content, setContent] = useState<ContentTemplate | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const contentId = params.id as string;

  useEffect(() => {
    if (contentId) {
      loadContent();
    }
  }, [contentId]);

  const loadContent = async () => {
    try {
      const data = await contentAPI.getById(parseInt(contentId));
      setContent(data);
    } catch (error) {
      console.error("Error loading content:", error);
      router.push("/app-crm/settings/services/content");
    } finally {
      setLoading(false);
    }
  };

  // Save timeline components to content
  const saveTimelineComponents = async (components: TimelineComponent[]) => {
    if (!content) return;

    try {
      console.log("Saving timeline components:", components);

      // Convert timeline components to content format
      const contentComponents = components.map((comp, index) => ({
        component_id: comp.id,
        order_index: index,
        editing_style: comp.component_type,
        duration_override: comp.duration,
      }));

      // Save to backend
      if (contentComponents.length > 0) {
        const updatedContent = await contentAPI.updateComponents(
          content.id,
          contentComponents,
        );
        setContent(updatedContent);
      }
    } catch (error) {
      console.error("Error saving timeline components:", error);
    }
  };

  const handleDelete = async () => {
    if (!content) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete "${content.name}"? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    try {
      setDeleting(true);
      await contentAPI.delete(content.id);
      router.push("/app-crm/settings/services/content");
    } catch (error) {
      console.error("Error deleting content:", error);
      alert("Error deleting content. Please try again.");
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

  if (!content) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: "100%", mx: "auto", p: 3 }}>
      <ContentHeader
        content={content}
        onContentUpdated={setContent}
      />

      <Grid container spacing={3}>
        {/* Visual Timeline Builder */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Film Builder
            </Typography>
            <FilmBuilder
              initialComponents={[]}
              onSave={saveTimelineComponents}
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <ContentDangerZone onDelete={handleDelete} deleting={deleting} />
        </Grid>
      </Grid>
    </Box>
  );
}
