"use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import { CheckCircle, Email, VerifiedUser } from "@mui/icons-material";
import { Inquiry, InquiryCrewAvailabilityRow, InquiryEquipmentAvailabilityRow, InquiryTask } from "@/features/workflow/inquiries/types";
import { NeedsAssessmentSubmission } from "@/features/workflow/inquiries/types/needs-assessment";
import { inquiriesApi } from '@/features/workflow/inquiries';
import { inquiryWizardSubmissionsApi } from '@/features/workflow/inquiry-wizard';
import { computeTaxBreakdown } from '@/shared/utils/pricing';
import { formatCurrency } from '@/shared/utils/formatUtils';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { useBrand } from "@/features/platform/brand";
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

type DiscoveryCallData = {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  meeting_type: 'ONLINE' | 'PHONE_CALL' | 'IN_PERSON' | 'VIDEO_CALL' | null;
  meeting_url: string | null;
  location: string | null;
  is_confirmed?: boolean;
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
  missingDataQuestions: string[],
  brandName: string,
  portalUrl?: string | null,
  discoveryCall?: DiscoveryCallData,
  callInterest?: string,
  crew?: InquiryCrewAvailabilityRow[],
  equipment?: InquiryEquipmentAvailabilityRow[],
): WelcomeEmailDraft | null {
  if (!inquiry.contact?.email) {
    return null;
  }

  const firstName = inquiry.contact?.first_name?.trim() || "there";
  const signOffName = leadProducer?.name || `The ${brandName} Team`;
  const eventLabel = inquiry.event_type ?? null;

  // Opening paragraph
  const openingLine = leadProducer
    ? `Thank you so much for reaching out – I'm ${leadProducer.name}, and I'll be looking after your${eventLabel ? ` ${eventLabel.toLowerCase()}` : " event"} from start to finish. We're really excited to be part of it!`
    : `Thank you so much for getting in touch! We're really excited to be involved in your${eventLabel ? ` ${eventLabel.toLowerCase()}` : " event"} and can't wait to get started.`;

  const lines: string[] = [
    `Hi ${firstName},`,
    "",
    openingLine,
    "",
  ];

  // ── Confirmed details block ────────────────────────────────────────
  const confirmedDetails: string[] = [];
  if (eventLabel) confirmedDetails.push(`Event Type: ${eventLabel}`);
  const formattedDate = formatDate(inquiry.event_date);
  if (formattedDate) confirmedDetails.push(`Event Date: ${formattedDate}`);
  // venue_address (Google Places) already includes the venue name as the first part
  const venueDisplay = inquiry.venue_address || inquiry.venue_details;
  if (venueDisplay) confirmedDetails.push(`Venue: ${venueDisplay}`);
  const packageName = inquiry.selected_package?.name ?? inquiry.package_contents_snapshot?.package_name;
  // Get best estimate: prefer primary, then most recent. Use total_with_tax or compute from total_amount + tax_rate.
  const estimates = inquiry.estimates ?? [];
  const bestEstimate = estimates.find((e) => e.is_primary) ?? estimates[0] ?? null;
  const estimateTotal = bestEstimate
    ? (bestEstimate.total_with_tax
        ? Number(bestEstimate.total_with_tax)
        : computeTaxBreakdown(Number(bestEstimate.total_amount), Number(bestEstimate.tax_rate ?? 0)).total)
    : (inquiry.primary_estimate_total ?? 0);
  const currency = bestEstimate?.currency ?? inquiry.selected_package?.currency ?? inquiry.package_contents_snapshot?.currency ?? DEFAULT_CURRENCY;
  const packagePriceStr = estimateTotal > 0 ? formatCurrency(estimateTotal, currency) : null;
  if (packageName && packagePriceStr) confirmedDetails.push(`Package: ${packageName} (estimated ${packagePriceStr})`);
  else if (packageName) confirmedDetails.push(`Package: ${packageName}`);
  const paymentScheduleName = inquiry.preferred_payment_schedule_template?.name;
  if (paymentScheduleName) confirmedDetails.push(`Payment Schedule: ${paymentScheduleName}`);

  lines.push("Here's a quick summary of what we have so far:");
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
    const confirmed = discoveryCall.is_confirmed;

    lines.push(confirmed ? 'Your Discovery Call is confirmed:' : 'Your Discovery Call:');
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
    if (!confirmed) {
      lines.push('');
      lines.push('If you need to reschedule, simply reply to this email and we\'ll find a time that works better.');
    }
    lines.push('');
  } else if (callInterest !== 'no') {
    // No call scheduled yet — let the client know we'll arrange one
    lines.push('Discovery Call:');
    lines.push('');
    lines.push('We\'d love to schedule a discovery call to discuss your vision and answer any questions. We\'ll be in touch shortly to arrange a time that works for you. If you\'d like to suggest a time, feel free to reply to this email.');
    lines.push('');
  }

  // ── Crew confirmation block ──────────────────────────────────────
  const confirmedCrew = (crew ?? []).filter(
    (r) => r.assigned_crew_member && (r.availability_request_status === 'confirmed' || r.status === 'available'),
  );
  if (confirmedCrew.length > 0) {
    lines.push('Your Crew:');
    lines.push('');
    confirmedCrew.forEach((r) => {
      const role = r.job_role?.display_name ?? r.job_role?.name ?? r.label ?? 'Crew';
      const name = r.assigned_crew_member!.name;
      const confirmed = r.availability_request_status === 'confirmed' ? ' ✓ Confirmed' : '';
      lines.push(`  • ${role}: ${name}${confirmed}`);
    });
    lines.push('');
  }

  // ── Equipment block ──────────────────────────────────────────────
  const confirmedEquipment = (equipment ?? []).filter(
    (r) => r.equipment_reservation_status === 'confirmed' || r.equipment_reservation_status === 'reserved',
  );
  if (confirmedEquipment.length > 0) {
    lines.push('Your Equipment:');
    lines.push('');
    confirmedEquipment.forEach((r) => {
      const status = r.equipment_reservation_status === 'confirmed' ? ' ✓ Confirmed' : ' (Reserved)';
      lines.push(`  • ${r.equipment.item_name}${status}`);
    });
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
    lines.push("You can also access your client portal to view your proposals, contracts, and booking documents:");
    lines.push("");
    lines.push(`  ${portalUrl}`);
    lines.push("");
  }

  lines.push("If you have any questions in the meantime, don't hesitate to reach out – we're always happy to help.");
  lines.push("");
  lines.push("Warm regards,");
  lines.push(signOffName);

  return {
    recipientEmail: inquiry.contact.email,
    recipientName: firstName,
    subject: `Thank you for your inquiry – ${brandName}`,
    body: lines.join("\n"),
  };
}

export default function QualifyCard({ inquiry, inquiryTasks, submission, onRefresh }: QualifyCardProps) {
  const [busy, setBusy] = useState<"qualify" | "welcome" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);
  const [welcomeDraft, setWelcomeDraft] = useState<WelcomeEmailDraft | null>(null);

  const responses = (submission?.responses as Record<string, unknown> | undefined) ?? {};
  const leadProducer = inquiry.lead_producer ?? null;
  const { currentBrand } = useBrand();
  const brandName = currentBrand?.name || "Our Team";

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
  const discoveryCallSubtask = allSubtasks.find((subtask) => subtask.subtask_key === "schedule_discovery_call");

  const missingDataQuestions = useMemo(() => {
    const lines: string[] = [];
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
      await inquiriesApi.inquiryTasks.toggleSubtask(inquiry.id, qualifySubtask.id);
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
    let crew: InquiryCrewAvailabilityRow[] = [];
    let equipment: InquiryEquipmentAvailabilityRow[] = [];
    try {
      const [portalResult, callResult, crewResult, equipmentResult] = await Promise.allSettled([
        inquiryWizardSubmissionsApi.generatePortalToken(inquiry.id),
        inquiriesApi.getDiscoveryCall(inquiry.id),
        inquiriesApi.getCrewAvailability(inquiry.id),
        inquiriesApi.getEquipmentAvailability(inquiry.id),
      ]);
      if (portalResult.status === 'fulfilled' && portalResult.value?.portal_token) {
        portalUrl = `${window.location.origin}/portal/${portalResult.value.portal_token}`;
      }
      if (callResult.status === 'fulfilled') {
        discoveryCall = callResult.value;
      }
      if (crewResult.status === 'fulfilled') {
        crew = crewResult.value.rows;
      }
      if (equipmentResult.status === 'fulfilled') {
        equipment = equipmentResult.value.rows;
      }
    } catch {
      // Non-fatal
    } finally {
      setBusy(null);
    }

    const draft = buildWelcomeDraft(
      inquiry,
      leadProducer,
      missingDataQuestions,
      brandName,
      portalUrl,
      discoveryCall,
      String(responses.discovery_call_interest ?? ''),
      crew,
      equipment,
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

      if (welcomeSubtask && welcomeSubtask.status !== "Completed") {
        await inquiriesApi.inquiryTasks.toggleSubtask(inquiry.id, welcomeSubtask.id);
      }

      await onRefresh();
      setWelcomeDialogOpen(false);

      const subject = encodeURIComponent(welcomeDraft.subject);
      const body = encodeURIComponent(welcomeDraft.body);
      window.location.href = `mailto:${encodeURIComponent(welcomeDraft.recipientEmail)}?subject=${subject}&body=${body}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send welcome response");
    } finally {
      setBusy(null);
    }
  };

  const isQualified = qualifySubtask?.status === "Completed";
  const isWelcomeSent = welcomeSubtask?.status === "Completed";
  const isComplete = isQualified && isWelcomeSent;

  const qualifyDisabled = busy !== null || !qualifySubtask || isQualified || !discoveryCallSubtask || discoveryCallSubtask.status !== "Completed";
  const welcomeDisabled = busy !== null || !inquiry.contact?.email || isWelcomeSent;

  // ── Completed state ────────────────────────────────────────────────
  if (isComplete) {
    return (
      <Box
        id="qualify-section"
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          background: "linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(6,78,59,0.12) 100%)",
          border: "1px solid rgba(16,185,129,0.25)",
          p: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #10b981, #059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(16,185,129,0.25)",
          }}
        >
          <CheckCircle sx={{ fontSize: "1.3rem", color: "#fff" }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: "#e2e8f0" }}>
            Qualified &amp; Welcome Sent
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#64748b", mt: 0.25 }} noWrap>
            {inquiry.contact?.email ?? "Client notified"}
          </Typography>
        </Box>
      </Box>
    );
  }

  // ── Active state ───────────────────────────────────────────────────
  return (
    <Box
      id="qualify-section"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        background: "linear-gradient(160deg, rgba(99,102,241,0.07) 0%, rgba(15,23,42,0.6) 50%, rgba(139,92,246,0.05) 100%)",
        border: "1px solid rgba(99,102,241,0.2)",
      }}
    >
      {/* Header bar */}
      <Box
        sx={{
          px: 2.5, py: 1.5,
          background: "linear-gradient(90deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))",
          borderBottom: "1px solid rgba(99,102,241,0.12)",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <VerifiedUser sx={{ fontSize: "1rem", color: "#818cf8" }} />
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#c7d2fe", letterSpacing: "0.02em" }}>
          Qualify &amp; Respond
        </Typography>
      </Box>

      {error && (
        <Box sx={{ px: 2, pt: 1.5 }}>
          <Alert severity="error" sx={{ py: 0.25, "& .MuiAlert-message": { fontSize: "0.75rem" } }}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Action buttons */}
      <Box sx={{ p: 2, display: "flex", gap: 1.5 }}>
        {/* Qualify button */}
        <Button
          fullWidth
          variant="contained"
          onClick={!isQualified ? handleQualify : undefined}
          disabled={qualifyDisabled}
          startIcon={
            busy === "qualify"
              ? <CircularProgress size={16} sx={{ color: "inherit" }} />
              : <CheckCircle sx={{ fontSize: "1.1rem" }} />
          }
          sx={{
            py: 1.25,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.8rem",
            ...(isQualified
              ? {
                  bgcolor: "rgba(16,185,129,0.12)",
                  color: "#10b981",
                  border: "1px solid rgba(16,185,129,0.3)",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "rgba(16,185,129,0.16)" },
                  "&.Mui-disabled": {
                    bgcolor: "rgba(16,185,129,0.12)",
                    color: "#10b981",
                    border: "1px solid rgba(16,185,129,0.3)",
                  },
                }
              : {
                  background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                  boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #4f46e5, #6d28d9)",
                    boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
                  },
                  "&.Mui-disabled": {
                    background: "rgba(99,102,241,0.15)",
                    color: "rgba(148,163,184,0.5)",
                  },
                }),
          }}
        >
          {isQualified ? "Qualified" : "Qualify"}
        </Button>

        {/* Send Welcome button */}
        <Button
          fullWidth
          variant="outlined"
          onClick={!isWelcomeSent ? handleOpenWelcomeDialog : undefined}
          disabled={welcomeDisabled}
          startIcon={
            busy === "welcome"
              ? <CircularProgress size={16} sx={{ color: "inherit" }} />
              : <Email sx={{ fontSize: "1.1rem" }} />
          }
          sx={{
            py: 1.25,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.8rem",
            ...(isWelcomeSent
              ? {
                  bgcolor: "rgba(16,185,129,0.12)",
                  color: "#10b981",
                  borderColor: "rgba(16,185,129,0.3)",
                  "&:hover": { bgcolor: "rgba(16,185,129,0.16)", borderColor: "rgba(16,185,129,0.4)" },
                  "&.Mui-disabled": {
                    bgcolor: "rgba(16,185,129,0.12)",
                    color: "#10b981",
                    borderColor: "rgba(16,185,129,0.3)",
                  },
                }
              : {
                  borderColor: "rgba(99,102,241,0.35)",
                  color: "#a5b4fc",
                  bgcolor: "rgba(99,102,241,0.06)",
                  "&:hover": {
                    borderColor: "rgba(99,102,241,0.6)",
                    bgcolor: "rgba(99,102,241,0.12)",
                  },
                  "&.Mui-disabled": {
                    borderColor: "rgba(99,102,241,0.12)",
                    color: "rgba(148,163,184,0.4)",
                  },
                }),
          }}
        >
          {isWelcomeSent ? "Welcome Sent" : "Send Welcome"}
        </Button>
      </Box>

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
