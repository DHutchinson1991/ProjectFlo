/**
 * ProjectFlo — Shared Design Tokens
 *
 * Single source of truth for colours, surfaces, and style primitives
 * used across the studio app, portal, and wizard.
 *
 * Import from here instead of duplicating colour values or sx objects.
 */
import { alpha } from "@mui/material/styles";

/* ── Core palette ────────────────────────────────────────────── */

export const colors = {
  /** Primary brand accent (purple) */
  accent: "#7c4dff",
  accentLight: "#a855f7",
  accentSoft: "#1e1b4b",

  /** Semantic */
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#38bdf8",

  /** Neutrals (dark-mode oriented — light mode uses MUI palette) */
  text: "#fafafa",
  muted: "#b0b0be",
  border: "#2a2a38",

  /** Surfaces */
  bg: "#0c0c10",
  card: "#16161e",
  elevated: "#1e1e2a",
} as const;

export const gradients = {
  accent: [colors.accent, colors.accentLight] as const,
  success: [colors.success, colors.info] as const,
  warm: ["#fb7185", "#e879f9"] as const,
} as const;

/* ── Reusable sx helpers ─────────────────────────────────────── */

/** Glass-morphism card surface. Use as `sx={{ ...glassSx }}`. */
export const glassSx = {
  bgcolor: alpha(colors.card, 0.55),
  backdropFilter: "blur(24px) saturate(1.8)",
  border: `1px solid ${alpha(colors.border, 0.6)}`,
  borderRadius: 4,
  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

/** Glass-style TextField override. Use as `sx={{ ...fieldSx }}`. */
export const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: colors.text,
    borderRadius: "14px",
    fontSize: "1rem",
    bgcolor: alpha(colors.card, 0.6),
    backdropFilter: "blur(8px)",
    "& fieldset": { borderColor: alpha(colors.border, 0.6) },
    "&:hover fieldset": { borderColor: alpha(colors.accent, 0.4) },
    "&.Mui-focused fieldset": {
      borderColor: colors.accent,
      borderWidth: "1.5px",
    },
  },
  "& .MuiInputLabel-root": { color: colors.muted },
  "& .MuiInputLabel-root.Mui-focused": { color: colors.accent },
} as const;

/* ── Status colour map ───────────────────────────────────────── */

/**
 * Canonical status → colour mapping.
 * Use with StatusChip or any status display.
 */
export const statusColors: Record<string, string> = {
  // General
  Active: colors.success,
  Inactive: colors.muted,
  Archived: colors.muted,

  // Documents (estimates, quotes, contracts)
  Draft: colors.muted,
  Sent: colors.info,
  Accepted: colors.success,
  Signed: colors.success,
  Declined: colors.error,
  Expired: colors.warning,

  // Inquiries / pipeline
  New: colors.info,
  Qualified: colors.accent,
  Booked: colors.success,
  Lost: colors.error,

  // Tasks
  Pending: colors.warning,
  "In Progress": colors.info,
  Completed: colors.success,
  Overdue: colors.error,

  // Payment
  Paid: colors.success,
  Unpaid: colors.warning,
  Partial: colors.warning,
};
