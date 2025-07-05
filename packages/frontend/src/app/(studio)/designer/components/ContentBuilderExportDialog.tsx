"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  Alert,
} from "@mui/material";
import {
  Description as JsonIcon,
  TableChart as CsvIcon,
  Code as XmlIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";

interface ContentBuilderExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: string) => void | Promise<void>;
  sceneCount: number;
  duration: number;
}

const ContentBuilderExportDialog: React.FC<ContentBuilderExportDialogProps> = ({
  open,
  onClose,
  onExport,
  sceneCount,
  duration,
}) => {
  const [selectedFormat, setSelectedFormat] = useState("json");
  const [isExporting, setIsExporting] = useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const exportFormats = [
    {
      value: "json",
      label: "JSON",
      description: "Complete timeline data in JSON format",
      icon: <JsonIcon />,
      fileSize: "~5-10 KB",
    },
    {
      value: "csv",
      label: "CSV",
      description: "Component data in CSV spreadsheet format",
      icon: <CsvIcon />,
      fileSize: "~2-5 KB",
    },
    {
      value: "xml",
      label: "XML",
      description: "Structured timeline data in XML format",
      icon: <XmlIcon />,
      fileSize: "~8-15 KB",
    },
    {
      value: "pdf",
      label: "PDF Report",
      description: "Visual timeline report for printing/sharing",
      icon: <PdfIcon />,
      fileSize: "~50-100 KB",
    },
  ];

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await onExport(selectedFormat);
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedFormatInfo = exportFormats.find(
    (f) => f.value === selectedFormat,
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Timeline</DialogTitle>

      <DialogContent>
        {/* Timeline Summary */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Timeline Summary:</strong>
            <br />
            Scenes: {sceneCount} | Duration: {formatTime(duration)}
          </Typography>
        </Alert>

        {/* Format Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Export Format</InputLabel>
          <Select
            value={selectedFormat}
            label="Export Format"
            onChange={(e) => setSelectedFormat(e.target.value)}
          >
            {exportFormats.map((format) => (
              <MenuItem key={format.value} value={format.value}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {format.icon}
                  <Box>
                    <Typography variant="body2">{format.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format.description}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Selected Format Details */}
        {selectedFormatInfo && (
          <Box
            sx={{
              p: 2,
              bgcolor: "background.default",
              borderRadius: 1,
              border: 1,
              borderColor: "divider",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              {selectedFormatInfo.icon}
              <Typography variant="subtitle2">
                {selectedFormatInfo.label}
              </Typography>
              <Chip
                label={selectedFormatInfo.fileSize}
                size="small"
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {selectedFormatInfo.description}
            </Typography>

            {/* Format-specific details */}
            {selectedFormat === "json" && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                Includes: Components, tracks, timing, metadata, and template
                information
              </Typography>
            )}
            {selectedFormat === "csv" && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                Includes: Component name, start time, duration, track, and type
                data
              </Typography>
            )}
            {selectedFormat === "xml" && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                Includes: Structured timeline data with component hierarchy
              </Typography>
            )}
            {selectedFormat === "pdf" && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                Includes: Visual timeline representation with component details
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          disabled={isExporting}
          startIcon={selectedFormatInfo?.icon}
        >
          {isExporting ? "Exporting..." : `Export ${selectedFormatInfo?.label}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContentBuilderExportDialog;
