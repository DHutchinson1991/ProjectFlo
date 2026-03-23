"use client";

import Box, { BoxProps } from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ReactNode } from "react";

export interface PageHeaderProps extends Omit<BoxProps, "children"> {
  /** Page title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Action buttons rendered on the right */
  actions?: ReactNode;
}

/**
 * Consistent page title + optional subtitle + action buttons row.
 *
 * ```tsx
 * <PageHeader
 *   title="Inquiries"
 *   subtitle="Manage your sales pipeline"
 *   actions={<Button>New Inquiry</Button>}
 * />
 * ```
 */
export function PageHeader({ title, subtitle, actions, sx, ...rest }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 3,
        ...sx,
      }}
      {...rest}
    >
      <Box>
        <Typography variant="h5" fontWeight={600}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Box sx={{ display: "flex", gap: 1 }}>{actions}</Box>}
    </Box>
  );
}
