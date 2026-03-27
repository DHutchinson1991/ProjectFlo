"use client";

import React from "react";
import {
  Box,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

/* ── Types ─────────────────────────────────────────────────── */

export interface StudioColumn<T> {
  /** Unique key for the column */
  key: string;
  /** Header label */
  label: string;
  /** Flex width (default 1) */
  flex?: number;
  /** Fixed width in px (overrides flex) */
  width?: number;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Optional icon shown before the header label */
  headerIcon?: React.ReactNode;
  /** Render cell content */
  render: (row: T, index: number) => React.ReactNode;
}

export interface StudioTableProps<T> {
  columns: StudioColumn<T>[];
  rows: T[];
  /** Unique key extractor */
  getRowKey: (row: T, index: number) => string | number;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Row hover handler — called with row on enter, null on leave */
  onRowHover?: (row: T | null, index: number) => void;
  /** Section colour — tints header icons and hover accent. Use sectionColors from tokens. */
  sectionColor?: string;
  /** Extra sx on the root container */
  sx?: SxProps<Theme>;
  /** Shown when rows is empty */
  emptyMessage?: string;
}

/* ── Styling constants ─────────────────────────────────────── */

const DEFAULT_SECTION = "#94a3b8";

/* ── Component ─────────────────────────────────────────────── */

export function StudioTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  onRowHover,
  sectionColor = DEFAULT_SECTION,
  sx: rootSx,
  emptyMessage = "No items yet",
}: StudioTableProps<T>) {
  const gridCols = columns
    .map((c) => (c.width ? `${c.width}px` : `${c.flex ?? 1}fr`))
    .join(" ");

  return (
    <Box
      sx={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 2.5,
        overflow: "hidden",
        bgcolor: "rgba(255,255,255,0.01)",
        ...rootSx,
      }}
    >
      {/* ── Header ───────────────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: gridCols,
          alignItems: "center",
          bgcolor: "rgba(255,255,255,0.015)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          borderLeft: `3px solid ${alpha(sectionColor, 0.4)}`,
          px: 1.5,
        }}
      >
        {columns.map((col) => (
          <Typography
            key={col.key}
            sx={{
              fontWeight: 800,
              fontSize: "0.625rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
              whiteSpace: "nowrap",
              userSelect: "none",
              px: 1.5,
              py: 1,
              textAlign: col.align ?? "left",
            }}
          >
            {col.label}
          </Typography>
        ))}
      </Box>

      {/* ── Body ─────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 100,
          }}
        >
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.25)" }}>
            {emptyMessage}
          </Typography>
        </Box>
      ) : (
        rows.map((row, idx) => (
          <Box
            key={getRowKey(row, idx)}
            onClick={onRowClick ? () => onRowClick(row, idx) : undefined}
            onMouseEnter={onRowHover ? () => onRowHover(row, idx) : undefined}
            onMouseLeave={onRowHover ? () => onRowHover(null, idx) : undefined}
            sx={{
              display: "grid",
              gridTemplateColumns: gridCols,
              alignItems: "center",
              minHeight: 48,
              px: 1.5,
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              borderLeft: `3px solid ${sectionColor}`,
              cursor: onRowClick ? "pointer" : "default",
              transition: "background-color 0.12s",
              "&:hover": {
                bgcolor: onRowClick
                  ? `${sectionColor}09`
                  : "rgba(255,255,255,0.028)",
              },
              "&:last-child": { borderBottom: "none" },
            }}
          >
            {columns.map((col, colIdx) => (
              <Box
                key={col.key}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  textAlign: col.align ?? "left",
                  overflow: "hidden",
                  ...(colIdx === 0 && {
                    "& .MuiTypography-subtitle2, & .MuiTypography-body2:first-of-type":
                      {
                        color: "rgba(255,255,255,0.88)",
                        fontWeight: 600,
                      },
                  }),
                }}
              >
                {col.render(row, idx)}
              </Box>
            ))}
          </Box>
        ))
      )}
    </Box>
  );
}
