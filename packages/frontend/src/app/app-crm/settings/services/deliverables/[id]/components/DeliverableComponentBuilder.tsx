import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";
import { Videocam as VideocamIcon } from "@mui/icons-material";
import VisualDeliverableBuilder from "../../../components/VisualDeliverableBuilder";
import { VisualTemplate } from "../types";

interface DeliverableComponentBuilderProps {
  visualTemplate: VisualTemplate | null;
  onTemplateChange: (template: VisualTemplate) => void;
  availableComponents?: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    baseTimeMinutes: number;
    complexityMultiplier: number;
    baseCost: number;
    icon: string;
    color: string;
  }>; // Components for the library
}

export default function DeliverableComponentBuilder({
  visualTemplate,
  onTemplateChange,
  availableComponents,
}: DeliverableComponentBuilderProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <VideocamIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Component Builder</Typography>
        </Box>

        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            overflow: "hidden",
            width: "100%",
            minHeight: "600px",
          }}
        >
          {visualTemplate ? (
            <VisualDeliverableBuilder
              template={visualTemplate}
              onTemplateChange={onTemplateChange}
              availableComponents={availableComponents}
              showComponentLibrary={true}
              compact={false}
            />
          ) : (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography>Loading component builder...</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
