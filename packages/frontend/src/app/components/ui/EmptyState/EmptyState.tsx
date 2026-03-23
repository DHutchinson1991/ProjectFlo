"use client";

import Box, { BoxProps } from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { SvgIconComponent } from "@mui/icons-material";

export interface EmptyStateProps extends Omit<BoxProps, "children"> {
  /** MUI icon component to display */
  icon?: SvgIconComponent;
  /** Primary message */
  message: string;
  /** Secondary / helper text */
  description?: string;
  /** CTA button label */
  actionLabel?: string;
  /** Called when CTA is clicked */
  onAction?: () => void;
}

/**
 * Standard "nothing here yet" placeholder.
 *
 * ```tsx
 * <EmptyState
 *   icon={InboxIcon}
 *   message="No estimates yet"
 *   description="Create an estimate to get started."
 *   actionLabel="Create Estimate"
 *   onAction={() => setOpen(true)}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  message,
  description,
  actionLabel,
  onAction,
  sx,
  ...rest
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        textAlign: "center",
        py: 8,
        px: 3,
        borderRadius: 2,
        border: "2px dashed",
        borderColor: "divider",
        ...sx,
      }}
      {...rest}
    >
      {Icon && <Icon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />}
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {message}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: actionLabel ? 3 : 0 }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
