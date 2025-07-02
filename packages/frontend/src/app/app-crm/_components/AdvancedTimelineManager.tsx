"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import {
  Timeline as TimelineIcon,
  ViewModule as TemplateIcon,
  ExpandMore as ExpandMoreIcon,
  Build as BuildIcon,
  Save as SaveIcon,
  CloudDownload as ExportIcon,
} from "@mui/icons-material";
import FilmBuilder from "../settings/services/content/[id]/components/FilmBuilder";
import TimelineTemplateManager from "./TimelineTemplateManager";

interface TimelineComponent {
  id: number;
  name: string;
  start_time: number;
  duration: number;
  track_id: number;
  component_type: "video" | "audio" | "graphics" | "music";
  color: string;
  description?: string;
}

interface TimelineTemplate {
  id: number;
  name: string;
  description?: string;
  duration: number;
  tracks_count: number;
  components_count: number;
  category: string;
  components: TimelineComponent[];
}

interface AdvancedTimelineManagerProps {
  entityType: "component" | "content" | "coverage_scene";
  entityId: number;
  entityName: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`timeline-tabpanel-${index}`}
      aria-labelledby={`timeline-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const AdvancedTimelineManager: React.FC<AdvancedTimelineManagerProps> = ({
  entityType,
  entityId,
  entityName,
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [currentTemplate, setCurrentTemplate] =
    useState<TimelineTemplate | null>(null);
  const [timelineComponents, setTimelineComponents] = useState<
    TimelineComponent[]
  >([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load existing timeline data when component mounts
  useEffect(() => {
    if (entityType === "content") {
      loadTimelineData();
    }
  }, [entityType, entityId]);

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:3002/timeline/content/${entityId}/components`,
      );
      if (response.ok) {
        const backendComponents = await response.json();

        // Transform backend data to frontend format
        const transformedComponents: TimelineComponent[] =
          backendComponents.map(
            (comp: {
              id: number;
              component?: { name: string };
              component_id: number;
              start_time_seconds: number;
              duration_seconds: number;
              layer_id?: number;
              timeline_layer?: { color_hex: string };
              notes?: string;
            }) => ({
              id: comp.id,
              name: comp.component?.name || `Component ${comp.component_id}`,
              start_time: comp.start_time_seconds,
              duration: comp.duration_seconds,
              track_id: comp.layer_id || 1,
              component_type: "video" as const, // Default type, could be enhanced
              color: comp.timeline_layer?.color_hex || "#2196f3",
              description: comp.notes,
            }),
          );

        setTimelineComponents(transformedComponents);
      }
    } catch (err) {
      setError("Failed to load timeline data");
      console.error("Timeline load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelected = (template: TimelineTemplate) => {
    setCurrentTemplate(template);
    setTimelineComponents(template.components);
    setCurrentTab(1); // Switch to builder tab
    setHasUnsavedChanges(false);
  };

  const handleTimelineSave = async (components: TimelineComponent[]) => {
    if (entityType !== "content") {
      setError("Timeline save is only supported for content");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Save each component to the backend using the proper timeline endpoints
      for (const component of components) {
        const timelineData = {
          content_id: entityId,
          component_id: component.id,
          layer_id: component.track_id,
          start_time_seconds: component.start_time,
          duration_seconds: component.duration,
          notes: component.description,
        };

        if (component.id > 1000) {
          // Existing component (assuming new ones have IDs > 1000)
          await fetch(
            `http://localhost:3002/timeline/components/${component.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                start_time_seconds: component.start_time,
                duration_seconds: component.duration,
                layer_id: component.track_id,
                notes: component.description,
              }),
            },
          );
        } else {
          await fetch("http://localhost:3002/timeline/components", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(timelineData),
          });
        }
      }

      setTimelineComponents(components);
      setHasUnsavedChanges(false);
      setSuccessMessage("Timeline saved successfully!");

      // Reload timeline data to get updated IDs
      await loadTimelineData();
    } catch (err) {
      setError("Failed to save timeline");
      console.error("Timeline save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleTimelineExport = async (format: string) => {
    try {
      const exportData = {
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        template: currentTemplate,
        components: timelineComponents,
        export_format: format,
        timestamp: new Date().toISOString(),
      };

      switch (format) {
        case "json":
          downloadFile(
            JSON.stringify(exportData, null, 2),
            `${entityName}_timeline.json`,
            "application/json",
          );
          break;
        case "csv":
          const csvData = convertToCSV(timelineComponents);
          downloadFile(csvData, `${entityName}_timeline.csv`, "text/csv");
          break;
        case "xml":
          const xmlData = convertToXML({
            entity_type: entityType,
            entity_id: entityId,
            entity_name: entityName,
            components: timelineComponents,
            timestamp: new Date().toISOString(),
            ...(currentTemplate && { template: currentTemplate }),
          });
          downloadFile(
            xmlData,
            `${entityName}_timeline.xml`,
            "application/xml",
          );
          break;
        case "pdf":
          // PDF export using browser print functionality
          generatePDFExport();
          break;
        default:
          throw new Error("Unsupported export format");
      }
    } catch (error) {
      console.error("Error exporting timeline:", error);
    }
  };

  const downloadFile = (
    content: string,
    filename: string,
    mimeType: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generatePDFExport = () => {
    // Create a print-friendly HTML page for PDF export
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setError("Popup blocked - please allow popups to export PDF");
      return;
    }

    const timelineHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Timeline Export - ${entityName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #1976d2;
            padding-bottom: 20px;
        }
        .timeline-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .components-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .components-table th,
        .components-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        .components-table th {
            background-color: #1976d2;
            color: white;
        }
        .components-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .component-video { background-color: #e3f2fd; }
        .component-audio { background-color: #e8f5e8; }
        .component-graphics { background-color: #fff3e0; }
        .component-text { background-color: #f3e5f5; }
        .timeline-visual {
            margin: 20px 0;
            border: 1px solid #ddd;
            padding: 20px;
            background: white;
        }
        .track {
            height: 40px;
            margin: 5px 0;
            position: relative;
            border: 1px solid #ccc;
            background: #f9f9f9;
        }
        .component-block {
            position: absolute;
            height: 30px;
            top: 5px;
            border-radius: 3px;
            color: white;
            font-size: 10px;
            padding: 2px 5px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Timeline Export</h1>
        <h2>${entityName} (${entityType.replace("_", " ")})</h2>
        <p>Exported on: ${new Date().toLocaleString()}</p>
    </div>

    <div class="timeline-info">
        <h3>Timeline Information</h3>
        <p><strong>Entity:</strong> ${entityName}</p>
        <p><strong>Type:</strong> ${entityType.replace("_", " ")}</p>
        <p><strong>Template:</strong> ${currentTemplate?.name || "Custom Timeline"}</p>
        <p><strong>Total Components:</strong> ${timelineComponents.length}</p>
        <p><strong>Total Duration:</strong> ${Math.max(...timelineComponents.map((c) => c.start_time + c.duration), 0)} seconds</p>
    </div>

    <div class="timeline-visual">
        <h3>Visual Timeline</h3>
        ${Array.from(new Set(timelineComponents.map((c) => c.track_id)))
        .sort()
        .map((trackId) => {
          const trackComponents = timelineComponents.filter(
            (c) => c.track_id === trackId,
          );
          const maxDuration = Math.max(
            ...timelineComponents.map((c) => c.start_time + c.duration),
            100,
          );

          return `
            <div class="track">
                <strong>Track ${trackId}</strong>
                ${trackComponents
              .map(
                (comp) => `
                    <div class="component-block component-${comp.component_type}" 
                         style="left: ${(comp.start_time / maxDuration) * 80}%; 
                                width: ${(comp.duration / maxDuration) * 80}%;
                                background-color: ${comp.color};">
                        ${comp.name}
                    </div>
                `,
              )
              .join("")}
            </div>
          `;
        })
        .join("")}
    </div>

    <table class="components-table">
        <thead>
            <tr>
                <th>Component Name</th>
                <th>Type</th>
                <th>Track</th>
                <th>Start Time</th>
                <th>Duration</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            ${timelineComponents
        .map(
          (comp) => `
                <tr class="component-${comp.component_type}">
                    <td>${comp.name}</td>
                    <td>${comp.component_type}</td>
                    <td>Track ${comp.track_id}</td>
                    <td>${comp.start_time}s</td>
                    <td>${comp.duration}s</td>
                    <td>${comp.description || "-"}</td>
                </tr>
            `,
        )
        .join("")}
        </tbody>
    </table>
</body>
</html>`;

    printWindow.document.write(timelineHTML);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 100);
    };

    setSuccessMessage(
      "PDF export window opened - please use browser print to save as PDF",
    );
  };

  const convertToCSV = (components: TimelineComponent[]): string => {
    const headers = ["Name", "Start Time (s)", "Duration (s)", "Track", "Type"];
    const rows = components.map((comp) => [
      comp.name,
      comp.start_time,
      comp.duration,
      comp.track_id,
      comp.component_type,
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  };

  const convertToXML = (data: {
    entity_type: string;
    entity_id: number;
    entity_name: string;
    timestamp: string;
    template?: TimelineTemplate;
    components: TimelineComponent[];
  }): string => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<timeline>
  <metadata>
    <entity_type>${data.entity_type}</entity_type>
    <entity_id>${data.entity_id}</entity_id>
    <entity_name>${data.entity_name}</entity_name>
    <timestamp>${data.timestamp}</timestamp>
  </metadata>
  ${data.template
        ? `
  <template>
    <id>${data.template.id}</id>
    <name>${data.template.name}</name>
    <category>${data.template.category}</category>
  </template>
  `
        : ""
      }
  <components>
    ${data.components
        .map(
          (comp: TimelineComponent) => `
    <component>
      <id>${comp.id}</id>
      <name>${comp.name}</name>
      <start_time>${comp.start_time}</start_time>
      <duration>${comp.duration}</duration>
      <track_id>${comp.track_id}</track_id>
      <type>${comp.component_type}</type>
    </component>
    `,
        )
        .join("")}
  </components>
</timeline>`;
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {" "}
            <TimelineIcon color="primary" />
            <Typography variant="h6">Content Component Builder</Typography>
            <Chip
              label={`For ${entityName}`}
              size="small"
              color="secondary"
              variant="outlined"
            />
            {currentTemplate && (
              <Chip
                label={currentTemplate.name}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {hasUnsavedChanges && (
              <Chip
                label="Unsaved Changes"
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ width: "100%" }}>
            {/* Error and Success Messages */}
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            {loading && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 2,
                }}
              >
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Loading timeline data...
                </Typography>
              </Box>
            )}

            {/* Timeline Builder Controls */}
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Tabs
                  value={currentTab}
                  onChange={(_, newValue) => setCurrentTab(newValue)}
                >
                  <Tab
                    label="Template Library"
                    icon={<TemplateIcon />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Timeline Builder"
                    icon={<BuildIcon />}
                    iconPosition="start"
                  />
                </Tabs>

                {/* Action Buttons */}
                {currentTab === 1 && currentTemplate && (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={
                        saving ? <CircularProgress size={16} /> : <SaveIcon />
                      }
                      onClick={() => handleTimelineSave(timelineComponents)}
                      disabled={saving || !hasUnsavedChanges}
                      size="small"
                    >
                      {saving ? "Saving..." : "Save Timeline"}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ExportIcon />}
                      onClick={() => {
                        // Quick export as JSON
                        handleTimelineExport("json");
                      }}
                      size="small"
                    >
                      Quick Export
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>

            <TabPanel value={currentTab} index={0}>
              <TimelineTemplateManager
                onTemplateSelected={handleTemplateSelected}
              />
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              {currentTemplate ? (
                <FilmBuilder
                  initialComponents={timelineComponents}
                  onSave={(components) => {
                    setTimelineComponents(components);
                    setHasUnsavedChanges(true);
                    handleTimelineSave(components);
                  }}
                  onExport={handleTimelineExport}
                />
              ) : (
                <Paper sx={{ p: 4, textAlign: "center" }}>
                  <TimelineIcon
                    sx={{ fontSize: 64, color: "grey.400", mb: 2 }}
                  />
                  <Typography variant="h6" gutterBottom>
                    No Timeline Template Selected
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please select a template from the Template Library to start
                    building your timeline.
                  </Typography>
                </Paper>
              )}
            </TabPanel>

            {/* Information Panel */}
            {currentTemplate && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Current Template:</strong> {currentTemplate.name}(
                  {currentTemplate.category}) -{" "}
                  {currentTemplate.components.length} components
                </Typography>
                {currentTemplate.description && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {currentTemplate.description}
                  </Typography>
                )}
              </Alert>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Success Message Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Box>
  );
};

export default AdvancedTimelineManager;
