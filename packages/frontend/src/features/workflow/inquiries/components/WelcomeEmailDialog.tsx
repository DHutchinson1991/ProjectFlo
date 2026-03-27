"use client";

import React from "react";
import { Box, TextField, Typography } from "@mui/material";
import { Email } from "@mui/icons-material";
import InquiryActionDialog from "./InquiryActionDialog";

export interface WelcomeEmailDraft {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
}

interface WelcomeEmailDialogProps {
  open: boolean;
  onClose: () => void;
  draft: WelcomeEmailDraft | null;
  onDraftChange: (draft: WelcomeEmailDraft) => void;
  onConfirm: () => void;
  loading?: boolean;
  error?: string | null;
}

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "rgba(15,23,42,0.3)",
    "& fieldset": { borderColor: "rgba(52,58,68,0.6)" },
    "&:hover fieldset": { borderColor: "rgba(96,165,250,0.4)" },
    "&.Mui-focused fieldset": { borderColor: "#60a5fa" },
  },
  "& .MuiInputLabel-root": { color: "#64748b" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#60a5fa" },
  "& .MuiInputBase-input": { color: "#e2e8f0", fontSize: "0.82rem" },
  "& .MuiInputBase-inputMultiline": { fontSize: "0.8rem", lineHeight: 1.6 },
};

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
    <InquiryActionDialog
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
    </InquiryActionDialog>
  );
}
