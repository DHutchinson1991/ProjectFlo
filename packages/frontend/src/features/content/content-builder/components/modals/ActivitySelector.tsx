"use client";

import React from "react";
import { Box, Typography, CircularProgress, Chip } from "@mui/material";

interface Activity {
  id: number;
  name: string;
  package_event_day_id: number;
  [key: string]: unknown;
}

interface EventDay {
  id: number;
  _joinId: number;
  name: string;
  order_index?: number;
  [key: string]: unknown;
}

interface ActivitySelectorProps {
  pkgActivities: Activity[];
  pkgEventDays: EventDay[];
  activitiesLoading: boolean;
  selectedActivityIds: number[];
  onToggle: (activityId: number) => void;
}

export function ActivitySelector({
  pkgActivities,
  pkgEventDays,
  activitiesLoading,
  selectedActivityIds,
  onToggle,
}: ActivitySelectorProps) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 11,
          color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase",
          fontWeight: 600,
          letterSpacing: 0.8,
          mb: 1,
        }}
      >
        Activities{selectedActivityIds.length > 0 ? ` · ${selectedActivityIds.length}` : ""}
      </Typography>
      {activitiesLoading ? (
        <CircularProgress size={14} sx={{ color: "rgba(255,255,255,0.3)" }} />
      ) : pkgActivities.length === 0 ? (
        <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
          No activities available
        </Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            maxHeight: 160,
            overflowY: "auto",
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(255,255,255,0.08)",
              borderRadius: 2,
              "&:hover": { background: "rgba(255,255,255,0.14)" },
            },
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.08) transparent",
          }}
        >
          {pkgEventDays
            .slice()
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((day) => {
              const dayActivities = pkgActivities.filter(
                (a) => a.package_event_day_id === day._joinId,
              );
              if (dayActivities.length === 0) return null;
              return (
                <Box key={day._joinId ?? day.id}>
                  <Typography
                    sx={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.2)",
                      fontWeight: 600,
                      mb: 0.5,
                      letterSpacing: 0.4,
                    }}
                  >
                    {day.name}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {dayActivities.map((act) => {
                      const isSelected = selectedActivityIds.includes(act.id);
                      return (
                        <Chip
                          key={act.id}
                          label={act.name}
                          size="small"
                          onClick={() => onToggle(act.id)}
                          sx={{
                            cursor: "pointer",
                            height: 26,
                            fontSize: 12,
                            borderRadius: "6px",
                            bgcolor: isSelected
                              ? "rgba(123,97,255,0.15)"
                              : "rgba(255,255,255,0.04)",
                            color: isSelected ? "#a78bfa" : "rgba(255,255,255,0.5)",
                            border: `1px solid ${isSelected ? "rgba(123,97,255,0.4)" : "rgba(255,255,255,0.08)"}`,
                            fontWeight: isSelected ? 500 : 400,
                            "& .MuiChip-label": { px: 1.25 },
                            "&:hover": {
                              bgcolor: isSelected
                                ? "rgba(123,97,255,0.22)"
                                : "rgba(255,255,255,0.07)",
                            },
                            transition: "all 0.15s ease",
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
        </Box>
      )}
    </Box>
  );
}
