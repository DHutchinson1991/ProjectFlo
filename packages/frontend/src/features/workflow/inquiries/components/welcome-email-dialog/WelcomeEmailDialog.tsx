"use client";

import React from "react";
import { Box, TextField, Typography } from "@mui/material";
import { Email } from "@mui/icons-material";
import { ActionDialog } from '@/shared/ui/ActionDialog';
import { compactFieldSx as textFieldSx } from '@/shared/theme/tokens';
import type { WelcomeEmailDialogProps } from './types';

export default function WelcomeEmailDialog({
  open,
  onClose,
  draft,
  onDraftChange,
  onConfirm,
  loading = false,
  error,
}: WelcomeEmailDialogProps) {
  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title="Review Welcome Email"
      subtitle="Confirm the message before opening your email client"
      icon={<Email sx={{ color: "#60a5fa", fontSize: 20 }} />}
      primaryLabel="Open Email Draft"
      primaryAction={onConfirm}
      loading={loading}
      error={error}
      primaryDisabled={!draft?.recipientEmail}
    >
      {!draft ? null : (
        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Typography sx={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            To:{" "}
            <span style={{ color: "#e2e8f0" }}>
              {draft.recipientName || draft.recipientEmail} ({draft.recipientEmail})
            </span>
          </Typography>
          <TextField
            label="Subject"
            fullWidth
            size="small"
            value={draft.subject}
            onChange={(e) => onDraftChange({ ...draft, subject: e.target.value })}
            sx={textFieldSx}
          />
          <TextField
            label="Body"
            fullWidth
            multiline
            minRows={14}
            value={draft.body}
            onChange={(e) => onDraftChange({ ...draft, body: e.target.value })}
            sx={textFieldSx}
          />
        </Box>
      )}
    </ActionDialog>
  );
}
