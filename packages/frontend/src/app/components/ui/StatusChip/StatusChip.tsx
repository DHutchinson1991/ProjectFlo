"use client";

import Chip, { ChipProps } from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";
import { statusColors } from "@/lib/theme/tokens";

export interface StatusChipProps extends Omit<ChipProps, "variant" | "color"> {
  /** Status string — auto-resolves colour from tokens.statusColors */
  status: string;
  /** Override the display label (defaults to status) */
  label?: string;
  /** Override the resolved colour */
  statusColor?: string;
}

/**
 * Consistent status badge used across the app.
 *
 * ```tsx
 * <StatusChip status="Accepted" />
 * <StatusChip status="Draft" label="Not sent" />
 * ```
 */
export function StatusChip({ status, label, statusColor, sx, ...rest }: StatusChipProps) {
  const resolved = statusColor ?? statusColors[status] ?? statusColors.Draft;

  return (
    <Chip
      label={label ?? status}
      size="small"
      sx={{
        height: 20,
        fontSize: "0.6rem",
        fontWeight: 700,
        letterSpacing: "0.04em",
        bgcolor: alpha(resolved, 0.12),
        color: resolved,
        border: "none",
        "& .MuiChip-label": { px: 1 },
        ...sx,
      }}
      {...rest}
    />
  );
}
