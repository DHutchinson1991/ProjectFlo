"use client";

import React from "react";
import { Box, Chip, Stack, TextField, Typography } from "@mui/material";
import { CalendarToday, Send, WorkOutline } from "@mui/icons-material";
import type { InquiryCrewAvailabilityRow, TaskAutoGenerationPreviewTask } from "@/lib/types";
import InquiryActionDialog from "./InquiryActionDialog";

type RequestStatus = "pending" | "confirmed" | "declined" | "cancelled";

interface CrewAvailabilityRequestDialogProps {
  open: boolean;
  onClose: () => void;
  contributorName: string;
  contributorEmail?: string | null;
  rows: InquiryCrewAvailabilityRow[];
  requestStatus?: RequestStatus | null;
  emailSubject: string;
  emailBody: string;
  onEmailSubjectChange: (value: string) => void;
  onEmailBodyChange: (value: string) => void;
  onConfirm: () => void;
  loading?: boolean;
  error?: string | null;
  previewTasks?: TaskAutoGenerationPreviewTask[];
  eventDate?: Date | string | null;
  venueDetails?: string | null;
  eventType?: string | null;
  clientName?: string;
  brandName?: string;
}

const ADMIN_PHASES = new Set(["Lead", "Inquiry", "Booking"]);

function buildTaskSummary(
  rows: InquiryCrewAvailabilityRow[],
  contributorName: string,
  previewTasks: TaskAutoGenerationPreviewTask[],
): { before: number; onday: number; after: number; totalCost: number } | null {
  const roleNames = new Set(
    rows
      .flatMap((r) => [r.job_role?.display_name, r.job_role?.name, r.position_name])
      .filter((n): n is string => Boolean(n)),
  );
  const normName = contributorName.trim().toLowerCase();

  const tasks = previewTasks.filter((t) => {
    if (ADMIN_PHASES.has(t.phase)) return false;
    if (t.assigned_to_name && t.assigned_to_name.trim().toLowerCase() === normName) return true;
    if (t.role_name && roleNames.has(t.role_name)) return true;
    return false;
  });

  if (tasks.length === 0) return null;

  const sum = (phase: string[]) =>
    tasks.filter((t) => phase.includes(t.phase)).reduce((s, t) => s + (t.total_hours ?? 0), 0);

  // Phase enum values use underscores (Post_Production, Pre_Production, Creative_Development)
  return {
    before: sum(["Creative_Development", "Pre_Production"]),
    onday: sum(["Production"]),
    after: sum(["Post_Production", "Delivery"]),
    totalCost: tasks.reduce((s, t) => s + (t.estimated_cost ?? 0), 0),
  };
}

export default function CrewAvailabilityRequestDialog({
  open,
  onClose,
  contributorName,
  contributorEmail,
  rows,
  requestStatus,
  emailSubject,
  emailBody,
  onEmailSubjectChange,
  onEmailBodyChange,
  onConfirm,
  loading = false,
  error,
  previewTasks,
  eventDate,
  venueDetails,
  eventType,
  clientName,
  brandName,
}: CrewAvailabilityRequestDialogProps) {
  const onSiteRows = rows.filter((r) => r.is_on_site ?? r.job_role?.on_site ?? false);
  const offSiteRows = rows.filter((r) => !(r.is_on_site ?? r.job_role?.on_site ?? false));
  const taskSummary = previewTasks ? buildTaskSummary(rows, contributorName, previewTasks) : null;
  const formattedEventDate = eventDate
    ? new Date(eventDate).toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric", year: "numeric" })
    : null;
  // Per-role estimated cost from previewTasks
  const costByRole = new Map<string, number>();
  for (const t of (previewTasks ?? [])) {
    if (!ADMIN_PHASES.has(t.phase) && t.role_name && (t.estimated_cost ?? 0) > 0) {
      costByRole.set(t.role_name, (costByRole.get(t.role_name) ?? 0) + (t.estimated_cost ?? 0));
    }
  }

  const fmtHours = (h: number) => (h > 0 ? `${h}h` : null);
  const fmtCost = (n: number) => `£${Number.isInteger(n) ? n : n.toFixed(2)}`;

  return (
    <InquiryActionDialog
      open={open}
      onClose={onClose}
      title="Send Crew Availability Request"
      subtitle="Review and edit the email before sending"
      icon={<Send sx={{ color: "#60a5fa", fontSize: 20 }} />}
      primaryLabel={requestStatus && requestStatus !== "cancelled" ? "Resend Request" : "Send Request"}
      primaryAction={onConfirm}
      loading={loading}
      error={error}
      primaryDisabled={rows.length === 0 || !contributorEmail}
      maxWidth="lg"
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(260px, 32%) minmax(0, 1fr)" },
          gap: 1.5,
          alignItems: "start",
        }}
      >
        {/* ── Left column: contributor info + roles ── */}
        <Stack spacing={1}>
          <Stack spacing={0.5}>
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#e2e8f0" }}>
              {contributorName}
            </Typography>
            {contributorEmail ? (
              <Typography sx={{ fontSize: "0.75rem", color: "#94a3b8" }}>{contributorEmail}</Typography>
            ) : (
              <Typography sx={{ fontSize: "0.75rem", color: "#f59e0b" }}>No email on file — cannot send</Typography>
            )}
            {requestStatus ? (
              <Chip
                size="small"
                label={`Current status: ${requestStatus}`}
                sx={{ width: "fit-content", color: "#f8fafc", border: "1px solid rgba(148,163,184,0.3)", bgcolor: "rgba(15,23,42,0.3)" }}
              />
            ) : null}
          </Stack>

          <Box>
            <Typography sx={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75 }}>
              Roles covered
            </Typography>
            <Box
              sx={{
                p: 1,
                bgcolor: "rgba(15,23,42,0.3)",
                borderRadius: 1,
                border: "1px solid rgba(52,58,68,0.3)",
                maxHeight: { xs: 220, md: 420 },
                overflowY: "auto",
              }}
            >
              {/* Event context: client name, event type, event date, brand */}
              {(clientName || formattedEventDate) && (
                <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mb: 0.75, flexWrap: "wrap" }}>
                  {clientName && (
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#e2e8f0" }}>
                      {clientName}{eventType ? `'s ${eventType}` : ""}
                    </Typography>
                  )}
                  {formattedEventDate && (
                    <>
                      <Typography sx={{ fontSize: "0.72rem", color: "#475569" }}>·</Typography>
                      <Typography sx={{ fontSize: "0.76rem", color: "#94a3b8" }}>{formattedEventDate}</Typography>
                    </>
                  )}
                  {brandName && (
                    <>
                      <Typography sx={{ fontSize: "0.72rem", color: "#475569" }}>·</Typography>
                      <Typography sx={{ fontSize: "0.72rem", color: "#64748b" }}>{brandName}</Typography>
                    </>
                  )}
                </Stack>
              )}
              <Stack spacing={0.5}>
                {/* On-site rows — use inquiry event_date for canonical event date */}
                {onSiteRows.map((row) => {
                  const role = row.position_name || row.job_role?.display_name || row.job_role?.name || "Role";
                  const date = eventDate
                    ? new Date(eventDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
                    : row.event_day?.date
                      ? new Date(row.event_day.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
                      : null;
                  const time = row.event_day?.start_time
                    ? new Date(row.event_day.start_time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true })
                    : null;
                  const roleKey = row.job_role?.display_name || row.job_role?.name || row.position_name;
                  const roleCost = roleKey ? costByRole.get(roleKey) : undefined;
                  return (
                    <Box key={row.id} sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
                      <CalendarToday sx={{ fontSize: 12, color: "#60a5fa", flexShrink: 0, mt: 0.35 }} />
                      <Box>
                        <Typography sx={{ fontSize: "0.78rem", color: "#cbd5e1" }}>
                          {role} — on site{date ? ` · ${date}` : ""}
                          {time ? ` from ${time}` : ""}
                          {roleCost ? <span style={{ color: "#34d399", marginLeft: 6 }}>{fmtCost(roleCost)}</span> : null}
                        </Typography>
                        {venueDetails && (
                          <Typography sx={{ fontSize: "0.72rem", color: "#64748b", mt: 0.1 }}>
                            {venueDetails}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}

                {/* Off-site / project-level rows */}
                {offSiteRows.map((row) => {
                  const role = row.position_name || row.job_role?.display_name || row.job_role?.name || "Role";
                  const roleKey = row.job_role?.display_name || row.job_role?.name || row.position_name;
                  const roleCost = roleKey ? costByRole.get(roleKey) : undefined;
                  return (
                    <Box key={row.id} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <WorkOutline sx={{ fontSize: 12, color: "#64748b", flexShrink: 0 }} />
                      <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                        {role} — remote / project work
                        {roleCost ? <span style={{ color: "#34d399", marginLeft: 6 }}>{fmtCost(roleCost)}</span> : null}
                      </Typography>
                    </Box>
                  );
                })}

                {/* Task commitment summary from previewAutoGeneration */}
                {taskSummary && (
                  <Box sx={{ mt: 0.5, px: 1, py: 0.75, borderRadius: 1.5, bgcolor: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)" }}>
                    <Typography sx={{ fontSize: "0.7rem", color: "#64748b", mb: 0.4 }}>
                      Estimated commitment
                    </Typography>
                    <Stack direction="row" spacing={1.5} flexWrap="wrap">
                      {taskSummary.before > 0 && (
                        <Typography sx={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                          Before: <strong style={{ color: "#cbd5e1" }}>{fmtHours(taskSummary.before)}</strong>
                        </Typography>
                      )}
                      {taskSummary.onday > 0 && (
                        <Typography sx={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                          On day: <strong style={{ color: "#cbd5e1" }}>{fmtHours(taskSummary.onday)}</strong>
                        </Typography>
                      )}
                      {taskSummary.after > 0 && (
                        <Typography sx={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                          After: <strong style={{ color: "#cbd5e1" }}>{fmtHours(taskSummary.after)}</strong>
                        </Typography>
                      )}
                      {taskSummary.totalCost > 0 && (
                        <Typography sx={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                          Est. <strong style={{ color: "#34d399" }}>{fmtCost(taskSummary.totalCost)}</strong>
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Box>
          </Box>
        </Stack>

        {/* ── Right column: email ── */}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>
            Email message
          </Typography>
          <Stack spacing={1}>
            <TextField
              size="small"
              label="Subject"
              value={emailSubject}
              onChange={(e) => onEmailSubjectChange(e.target.value)}
              fullWidth
              disabled={!contributorEmail}
              sx={textFieldSx}
            />
            <TextField
              size="small"
              label="Body"
              value={emailBody}
              onChange={(e) => onEmailBodyChange(e.target.value)}
              fullWidth
              multiline
              rows={22}
              disabled={!contributorEmail}
              sx={textFieldSx}
            />
          </Stack>
        </Box>
      </Box>
    </InquiryActionDialog>
  );
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
  "& .MuiInputBase-input": { color: "#e2e8f0", fontSize: "0.8rem" },
  "& .MuiInputBase-inputMultiline": { fontSize: "0.78rem" },
};
