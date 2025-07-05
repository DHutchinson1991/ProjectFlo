"use client";

import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import Link from "next/link";
import ContentBuilder from "../../components/ContentBuilder";
import { TimelineScene } from "../../components/ContentBuilderTypes";

export default function FilmDetailPage({ params }: { params: { id: string } }) {
  const handleSave = (scenes: TimelineScene[]) => {
    console.log("Saving film template:", scenes);
    // TODO: Implement save functionality
  };

  const handleExport = (format: string) => {
    console.log("Exporting film template:", format);
    // TODO: Implement export functionality
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Button
          component={Link}
          href="/designer/films"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 1 }}
        >
          Back to Films
        </Button>
        <Typography variant="h5" component="h1">
          Film Template #{params.id}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Design and edit your film template using the timeline editor
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <ContentBuilder
          initialScenes={[]}
          onSave={handleSave}
          onExport={handleExport}
          readOnly={false}
        />
      </Box>
    </Box>
  );
}
