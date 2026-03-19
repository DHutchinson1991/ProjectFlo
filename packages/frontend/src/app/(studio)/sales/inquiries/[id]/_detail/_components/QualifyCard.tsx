"use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { CheckCircle, Email, Person, WarningAmber } from "@mui/icons-material";
import { Inquiry, InquiryTask, NeedsAssessmentSubmission } from "@/lib/types";
import { api } from "@/lib/api";
import WelcomeEmailDialog, { type WelcomeEmailDraft } from "./WelcomeEmailDialog";

interface QualifyCardProps {
  inquiry: Inquiry;
  inquiryTasks: InquiryTask[];
  submission: NeedsAssessmentSubmission | null;
  onRefresh: () => Promise<void>;
}

type SubtaskLite = {
  id: number;
  subtask_key: string;
  status: string;
};

function formatDate(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function formatCurrency(amount: number | null | undefined, currency = "GBP"): string | null {
  if (amount == null) return null;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

type DiscoveryCallData = {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  meeting_type: 'ONLINE' | 'PHONE_CALL' | 'IN_PERSON' | 'VIDEO_CALL' | null;
  meeting_url: string | null;
  location: string | null;
} | null;

function formatTime(d: Date | string): string {
  const parsed = new Date(d);
  return parsed.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
}

function meetingTypeLabel(type: DiscoveryCallData extends null ? never : NonNullable<DiscoveryCallData>['meeting_type']): string {
  switch (type) {
    case 'VIDEO_CALL': return 'Video Call';
    case 'ONLINE': return 'Online Meeting';
    case 'PHONE_CALL': return 'Phone Call';
    case 'IN_PERSON': return 'In Person';
    default: return 'Meeting';
  }
}

function buildWelcomeDraft(
  inquiry: Inquiry,
  leadProducer: Inquiry["lead_producer"],
  preferredContactMethod: string,
  preferredContactTime: string,
  missingDataQuestions: string[],
  portalUrl?: string | null,
  discoveryCall?: DiscoveryCallData,
): WelcomeEmailDraft | null {
  if (!inquiry.contact?.email) {
    return null;
  }

  const clientName = `${inquiry.contact?.first_name ?? ""} ${inquiry.contact?.last_name ?? ""}`.trim() || "there";
  const signOffName = leadProducer?.name || "ProjectFlo Team";
  const eventLabel = inquiry.event_type ?? null;

  // Opening paragraph
  const openingLine = leadProducer
    ? `Thank you so much for reaching out – I'm ${leadProducer.name}, your lead producer at ProjectFlo, and I'm thrilled to be involved in helping shape your${eventLabel ? ` ${eventLabel.toLowerCase()}` : " special day"}.`
    : `Thank you so much for reaching out. We're thrilled to be involved in helping shape your${eventLabel ? ` ${eventLabel.toLowerCase()}` : " special day"}.`;

  const lines: string[] = [
    `Hi ${clientName},`,
    "",
    openingLine,
    "",
  ];

  // ── Confirmed details block ────────────────────────────────────────
  const confirmedDetails: string[] = [];
  if (eventLabel) confirmedDetails.push(`Event Type: ${eventLabel}`);
  const formattedDate = formatDate(inquiry.event_date);
  if (formattedDate) confirmedDetails.push(`Event Date: ${formattedDate}`);
  const venue = inquiry.venue_details || inquiry.venue_address;
  if (venue) confirmedDetails.push(`Venue: ${venue}`);
  const packageName = inquiry.selected_package?.name ?? inquiry.package_contents_snapshot?.package_name;
  if (packageName) confirmedDetails.push(`Package: ${packageName}`);
  const estimateStr = formatCurrency(inquiry.primary_estimate_total, inquiry.selected_package?.currency ?? "GBP");
  if (estimateStr) confirmedDetails.push(`Estimate: ${estimateStr}`);
  confirmedDetails.push(`Preferred Contact: ${preferredContactMethod} (${preferredContactTime})`);

  lines.push("Here's a summary of what we have on file for you:");
  lines.push("");
  confirmedDetails.forEach((detail) => lines.push(`  • ${detail}`));
  lines.push("");

  // ── Discovery call block ─────────────────────────────────────────
  if (discoveryCall) {
    const callDate = formatDate(discoveryCall.start_time);
    const callTimeFrom = formatTime(discoveryCall.start_time);
    const callTimeTo = formatTime(discoveryCall.end_time);
    const typeLabel = meetingTypeLabel(discoveryCall.meeting_type);
    const isVirtual = discoveryCall.meeting_type === 'VIDEO_CALL' || discoveryCall.meeting_type === 'ONLINE';

    lines.push('Your Discovery Call:');
    lines.push('');
    if (callDate) lines.push(`  • Date: ${callDate}`);
    lines.push(`  • Time: ${callTimeFrom} – ${callTimeTo}`);
    lines.push(`  • Type: ${typeLabel}`);
    if (isVirtual) {
      const link = discoveryCall.meeting_url ?? '[Video call link — to be confirmed]';
      lines.push(`  • Link: ${link}`);
    } else if (discoveryCall.location) {
      lines.push(`  • Location: ${discoveryCall.location}`);
    }
    lines.push('');
  }

  // ── Missing data questions ────────────────────────────────────────
  if (missingDataQuestions.length > 0) {
    lines.push("To help us get everything in order, we just have a couple of quick questions:");
    missingDataQuestions.forEach((question) => lines.push(`  - ${question}`));
    lines.push("");
  }

  // ── Client portal link ────────────────────────────────────────────
  if (portalUrl) {
    lines.push("You can access your client portal at any time to view your proposals, contracts, and all booking documents:");
    lines.push(portalUrl);
    lines.push("");
  }

  lines.push("Please don't hesitate to get in touch if you have any questions in the meantime – we're always happy to help.");
  lines.push("");
  lines.push("Warm regards,");
  lines.push(signOffName);

  return {
    recipientEmail: inquiry.contact.email,
    recipientName: clientName,
    subject: `Thank you for your inquiry – ProjectFlo`,
    body: lines.join("\n"),
  };
}

export default function QualifyCard({ inquiry, inquiryTasks, submission, onRefresh }: QualifyCardProps) {
  const [busy, setBusy] = useState<"qualify" | "welcome" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);
  const [welcomeDraft, setWelcomeDraft] = useState<WelcomeEmailDraft | null>(null);

  const responses = (submission?.responses as Record<string, unknown> | undefined) ?? {};
  const preferredContactMethod = String(responses.preferred_contact_method ?? "Email");
  const preferredContactTime = String(responses.preferred_contact_time ?? "Anytime");
  const leadProducer = inquiry.lead_producer ?? null;

  const allSubtasks = useMemo(() => {
    const tasks = inquiryTasks ?? [];
    const subtasks: SubtaskLite[] = [];
    for (const task of tasks) {
      if (!task.subtasks) continue;
      for (const subtask of task.subtasks) {
        subtasks.push({
          id: subtask.id,
          subtask_key: subtask.subtask_key,
          status: subtask.status,
        });
      }
    }
    return subtasks;
  }, [inquiryTasks]);

  const qualifySubtask = allSubtasks.find((subtask) => subtask.subtask_key === "mark_inquiry_qualified");
  const welcomeSubtask = allSubtasks.find((subtask) => subtask.subtask_key === "send_welcome_response");
  const resolveConflictsSubtask = allSubtasks.find((subtask) => subtask.subtask_key === "resolve_availability_conflicts");

  const warnings = useMemo(() => {
    const items: { text: string; href: string }[] = [];

    if (!inquiry.event_date) {
      items.push({ text: "No event date set", href: "#needs-assessment-section" });
    }

    if (!inquiry.selected_package_id) {
      items.push({ text: "No package selected", href: "#needs-assessment-section" });
    }

    if ((inquiry.estimates?.length ?? 0) === 0) {
      items.push({ text: "No estimate created", href: "#estimates-section" });
    }

    if (!resolveConflictsSubtask || resolveConflictsSubtask.status !== "Completed") {
      items.push({ text: "Crew and equipment not confirmed", href: "#availability-section" });
    }

    if (!leadProducer) {
      items.push({ text: "No lead producer assigned", href: "#availability-section" });
    }

    return items;
  }, [inquiry.event_date, inquiry.selected_package_id, inquiry.estimates?.length, resolveConflictsSubtask, leadProducer]);

  const missingDataQuestions = useMemo(() => {
    const lines: string[] = [];
    if (!inquiry.event_type) lines.push("Could you confirm your event type?");
    if (!inquiry.event_date) lines.push("Could you confirm your event date?");
    if (!inquiry.venue_details && !inquiry.venue_address) lines.push("Do you already have a venue in mind?");
    if (!inquiry.budget_range && !responses.guest_count) lines.push("Approximately how many guests are expected?");
    return lines;
  }, [inquiry, responses.guest_count]);

  const handleQualify = async () => {
    if (!qualifySubtask || qualifySubtask.status === "Completed") {
      return;
    }

    try {
      setError(null);
      setBusy("qualify");
      await api.inquiryTasks.toggleSubtask(inquiry.id, qualifySubtask.id);
      await onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to qualify inquiry");
    } finally {
      setBusy(null);
    }
  };

  const handleOpenWelcomeDialog = async () => {
    setBusy("welcome");
    let portalUrl: string | null = null;
    let discoveryCall: DiscoveryCallData = null;
    try {
      const [portalResult, callResult] = await Promise.allSettled([
        api.clientPortal.generateToken(inquiry.id),
        api.inquiries.getDiscoveryCall(inquiry.id),
      ]);
      if (portalResult.status === 'fulfilled' && portalResult.value?.portal_token) {
        portalUrl = `${window.location.origin}/portal/${portalResult.value.portal_token}`;
      }
      if (callResult.status === 'fulfilled') {
        discoveryCall = callResult.value;
      }
    } catch {
      // Non-fatal
    } finally {
      setBusy(null);
    }

    const draft = buildWelcomeDraft(
      inquiry,
      leadProducer,
      preferredContactMethod,
      preferredContactTime,
      missingDataQuestions,
      portalUrl,
      discoveryCall,
    );
    if (!draft) {
      setError("Inquiry contact email is required before sending welcome response");
      return;
    }
    setWelcomeDraft(draft);
    setWelcomeDialogOpen(true);
  };

  const handleConfirmWelcome = async () => {
    if (!welcomeDraft) {
      return;
    }

    try {
      setError(null);
      setBusy("welcome");
      const subject = encodeURIComponent(welcomeDraft.subject);
      const body = encodeURIComponent(welcomeDraft.body);
      window.location.href = `mailto:${encodeURIComponent(welcomeDraft.recipientEmail)}?subject=${subject}&body=${body}`;

      if (welcomeSubtask && welcomeSubtask.status !== "Completed") {
        await api.inquiryTasks.toggleSubtask(inquiry.id, welcomeSubtask.id);
      }

      await onRefresh();
      setWelcomeDialogOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send welcome response");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Box
      id="qualify-section"
      sx={{
        border: "1px solid rgba(148, 163, 184, 0.18)",
        borderRadius: 2,
        p: 2,
        bgcolor: "rgba(15, 23, 42, 0.45)",
      }}
    >
      <Stack spacing={1.5}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: "0.95rem", fontWeight: 700 }}>Qualify & Respond</Typography>
          <Chip
            size="small"
            label={inquiry.status}
            color={inquiry.status === "Qualified" ? "success" : "default"}
            variant={inquiry.status === "Qualified" ? "filled" : "outlined"}
          />
        </Box>

        {warnings.length > 0 && (
          <Alert severity="warning" icon={<WarningAmber fontSize="small" />}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, mb: 0.5 }}>
              Qualification checks need attention:
            </Typography>
            <Stack spacing={0.25}>
              {warnings.map((warning) => (
                <Typography key={warning.text} component="a" href={warning.href} sx={{ color: "inherit", fontSize: "0.75rem" }}>
                  • {warning.text}
                </Typography>
              ))}
            </Stack>
          </Alert>
        )}

        <Box>
          <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Preferred Contact</Typography>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>
            {preferredContactMethod} · {preferredContactTime}
          </Typography>
        </Box>

        <Box>
          <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Lead Producer</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}>
            <Person sx={{ fontSize: 15, color: leadProducer ? "#60a5fa" : "#64748b" }} />
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: leadProducer ? "text.primary" : "text.secondary" }}>
              {leadProducer?.name || "Not assigned yet"}
            </Typography>
          </Box>
          {leadProducer?.job_role_name && (
            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mt: 0.25 }}>
              {leadProducer.job_role_name}
            </Typography>
          )}
        </Box>

        <Divider sx={{ borderColor: "rgba(148, 163, 184, 0.18)" }} />

        <Box sx={{ p: 1.25, borderRadius: 1.5, border: "1px solid rgba(148, 163, 184, 0.15)", bgcolor: "rgba(15, 23, 42, 0.28)" }}>
          <Typography sx={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", mb: 0.45 }}>
            Welcome Draft Summary
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
            Recipient: {inquiry.contact?.email || "No email"}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
            Missing-data prompts: {missingDataQuestions.length}
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            fullWidth
            variant="contained"
            startIcon={busy === "qualify" ? <CircularProgress size={14} color="inherit" /> : <CheckCircle />}
            onClick={handleQualify}
            disabled={busy !== null || !qualifySubtask || qualifySubtask.status === "Completed"}
          >
            {qualifySubtask?.status === "Completed" ? "Inquiry Qualified" : "Qualify Inquiry"}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={busy === "welcome" ? <CircularProgress size={14} color="inherit" /> : <Email />}
            onClick={handleOpenWelcomeDialog}
            disabled={busy !== null || !inquiry.contact?.email}
          >
            {welcomeSubtask?.status === "Completed" ? "Welcome Logged" : "Send Welcome"}
          </Button>
        </Stack>
      </Stack>

      <WelcomeEmailDialog
        open={welcomeDialogOpen}
        onClose={() => setWelcomeDialogOpen(false)}
        draft={welcomeDraft}
        onDraftChange={setWelcomeDraft}
        onConfirm={handleConfirmWelcome}
        loading={busy === "welcome"}
        error={error}
      />
    </Box>
  );
}
