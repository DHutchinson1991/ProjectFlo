"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  History as HistoryIcon,
  Compare as CompareIcon,
  Restore as RestoreIcon,
  Save as SaveIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  Cancel as RejectedIcon,
  CheckCircle,
} from "@mui/icons-material";

interface TemplateVersion {
  id: number;
  template_id: number;
  version: string;
  name: string;
  description?: string;
  effort_hours: string;
  pricing_type: "Hourly" | "Fixed";
  fixed_price?: number;
  phase: string;
  created_at: string;
  created_by: string;
  status: "draft" | "pending_approval" | "approved" | "rejected";
  approval_notes?: string;
  approved_by?: string;
  approved_at?: string;
  is_current: boolean;
  change_summary?: string;
}

interface TemplateVersioningProps {
  templateId: number;
  open: boolean;
  onClose: () => void;
  onVersionSelected?: (version: TemplateVersion) => void;
}

const TemplateVersioningManager: React.FC<TemplateVersioningProps> = ({
  templateId,
  open,
  onClose,
  onVersionSelected,
}) => {
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">(
    "approve",
  );
  const [versionToApprove, setVersionToApprove] =
    useState<TemplateVersion | null>(null);
  const [newVersionDialogOpen, setNewVersionDialogOpen] = useState(false);
  const [newVersionData, setNewVersionData] = useState({
    name: "",
    description: "",
    changeSummary: "",
  });

  useEffect(() => {
    if (open && templateId) {
      fetchVersions();
    }
  }, [open, templateId]);

  const fetchVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:3002/task-templates/${templateId}/versions`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch template versions");
      }
      const data = await response.json();
      setVersions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch versions");
    } finally {
      setLoading(false);
    }
  };

  const createNewVersion = async () => {
    try {
      const response = await fetch(
        `http://localhost:3002/task-templates/${templateId}/versions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newVersionData.name,
            description: newVersionData.description,
            change_summary: newVersionData.changeSummary,
            status: "draft",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create new version");
      }

      await fetchVersions();
      setNewVersionDialogOpen(false);
      setNewVersionData({ name: "", description: "", changeSummary: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create version");
    }
  };

  const submitForApproval = async (versionId: number) => {
    try {
      const response = await fetch(
        `http://localhost:3002/task-templates/versions/${versionId}/submit-approval`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to submit for approval");
      }

      await fetchVersions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit for approval",
      );
    }
  };

  const handleApprovalAction = async () => {
    if (!versionToApprove) return;

    try {
      const response = await fetch(
        `http://localhost:3002/task-templates/versions/${versionToApprove.id}/approve`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: approvalAction,
            notes: approvalNotes,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to process approval");
      }

      await fetchVersions();
      setApprovalDialogOpen(false);
      setApprovalNotes("");
      setVersionToApprove(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process approval",
      );
    }
  };

  const restoreVersion = async (versionId: number) => {
    try {
      const response = await fetch(
        `http://localhost:3002/task-templates/versions/${versionId}/restore`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to restore version");
      }

      await fetchVersions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to restore version",
      );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <ApprovedIcon color="success" />;
      case "pending_approval":
        return <PendingIcon color="warning" />;
      case "rejected":
        return <RejectedIcon color="error" />;
      default:
        return <EditIcon color="disabled" />;
    }
  };

  const getStatusColor = (
    status: string,
  ): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case "approved":
        return "success";
      case "pending_approval":
        return "warning";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <HistoryIcon />
            <Typography variant="h6">Template Version History</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box mb={2} display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => setNewVersionDialogOpen(true)}
            >
              Create New Version
            </Button>
            <Button variant="outlined" startIcon={<CompareIcon />} disabled>
              Compare Versions (Coming Soon)
            </Button>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Select</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Created By</TableCell>
                    <TableCell>Current</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedVersions.includes(version.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVersions((prev) => [
                                ...prev,
                                version.id,
                              ]);
                            } else {
                              setSelectedVersions((prev) =>
                                prev.filter((id) => id !== version.id),
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{version.version}</TableCell>
                      <TableCell>{version.name}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(version.status)}
                          label={version.status.replace("_", " ")}
                          color={getStatusColor(version.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(version.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{version.created_by}</TableCell>
                      <TableCell>
                        {version.is_current && (
                          <Chip label="Current" color="primary" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => onVersionSelected?.(version)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          {version.status === "draft" && (
                            <Tooltip title="Submit for Approval">
                              <IconButton
                                size="small"
                                onClick={() => submitForApproval(version.id)}
                              >
                                <PendingIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {version.status === "pending_approval" && (
                            <Tooltip title="Review">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setVersionToApprove(version);
                                  setApprovalDialogOpen(true);
                                }}
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                          )}
                          {version.status === "approved" &&
                            !version.is_current && (
                              <Tooltip title="Restore Version">
                                <IconButton
                                  size="small"
                                  onClick={() => restoreVersion(version.id)}
                                >
                                  <RestoreIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* New Version Dialog */}
      <Dialog
        open={newVersionDialogOpen}
        onClose={() => setNewVersionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Version</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Version Name"
              value={newVersionData.name}
              onChange={(e) =>
                setNewVersionData((prev) => ({ ...prev, name: e.target.value }))
              }
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={newVersionData.description}
              onChange={(e) =>
                setNewVersionData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Change Summary"
              value={newVersionData.changeSummary}
              onChange={(e) =>
                setNewVersionData((prev) => ({
                  ...prev,
                  changeSummary: e.target.value,
                }))
              }
              fullWidth
              multiline
              rows={2}
              helperText="Briefly describe what changed in this version"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewVersionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={createNewVersion}
            variant="contained"
            disabled={!newVersionData.name}
          >
            Create Version
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog
        open={approvalDialogOpen}
        onClose={() => setApprovalDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Review Template Version</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel>Action</InputLabel>
              <Select
                value={approvalAction}
                onChange={(e) =>
                  setApprovalAction(e.target.value as "approve" | "reject")
                }
              >
                <MenuItem value="approve">Approve</MenuItem>
                <MenuItem value="reject">Reject</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Review Notes"
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              fullWidth
              multiline
              rows={4}
              helperText="Provide feedback or reason for approval/rejection"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleApprovalAction}
            variant="contained"
            color={approvalAction === "approve" ? "success" : "error"}
          >
            {approvalAction === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TemplateVersioningManager;
