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

/** Compact dialog TextField override (blue accent, no border-radius). */
export const compactFieldSx = {
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
} as const;

/* ── Section colours ──────────────────────────────────────── */

/**
 * Canonical section/resource → colour mapping.
 * Used for ambient glows, accent tints, and header colours on tables.
 *
 * Grouped by how the studio sidebar organises them:
 *   Pipeline:  inquiries, clients, projects
 *   Resources: crew, locations, equipment
 *   Catalog:   packages, tasks
 *   Finance:   estimates, contracts
 */
export const sectionColors = {
  // Pipeline
  inquiries: "#f59e0b",   // amber
  clients: "#8b5cf6",     // violet
  projects: "#3b82f6",    // blue

  // Resources
  crew: "#06b6d4",        // cyan
  locations: "#10b981",   // emerald
  equipment: "#f97316",   // orange

  // Catalog
  packages: "#ec4899",    // pink
  tasks: "#579BFC",       // sky

  // Finance
  estimates: "#6366f1",   // indigo
  contracts: "#14b8a6",   // teal
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
  Viewed: colors.accent,
  Accepted: colors.success,
  Signed: colors.success,
  Declined: colors.error,
  ChangesRequested: colors.warning,
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
