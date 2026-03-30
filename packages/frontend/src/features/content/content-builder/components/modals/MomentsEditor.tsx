"use client";

import React from "react";
import { Box, Typography, TextField, Button, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import { formatTime } from "@/shared/utils/formatUtils";

interface Moment {
  id?: string;
  name: string;
  duration: number;
  sourceType?: string;
  sourceActivityId?: number;
}

interface MomentGroup {
  key: string;
  groupType: string;
  title: string;
  subtitle: string;
  moments: Moment[];
  accent: string;
  accentBg: string;
  accentBorder: string;
}

interface NewMoment {
  name: string;
  duration: number;
}

interface MomentsEditorProps {
  groupedMoments: MomentGroup[];
  totalDuration: number;
  momentCount: number;
  selectedActivitiesCount: number;
  newMoment: NewMoment;
  editingMomentId: string | null;
  onNewMomentChange: (m: NewMoment) => void;
  onAddMoment: () => void;
  onRemoveMoment: (id?: string) => void;
  onUpdateMoment: (
    id: string | undefined,
    updates: { name?: string; duration?: number },
  ) => void;
  onEditingIdChange: (id: string | null) => void;
}

export function MomentsEditor({
  groupedMoments,
  totalDuration,
  momentCount,
  selectedActivitiesCount,
  newMoment,
  editingMomentId,
  onNewMomentChange,
  onAddMoment,
  onRemoveMoment,
  onUpdateMoment,
  onEditingIdChange,
}: MomentsEditorProps) {
  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, gap: 1 }}>
      {/* Section Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography
            sx={{
              fontSize: 11,
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
              fontWeight: 600,
              letterSpacing: 0.8,
            }}
          >
            Moments
          </Typography>
          {momentCount > 0 && (
            <Typography sx={{ color: "rgba(255,255,255,0.22)", fontSize: 11 }}>
              {momentCount} total &middot; {formatTime(totalDuration)}
            </Typography>
          )}
        </Box>
        {selectedActivitiesCount > 1 && (
          <Typography sx={{ color: "rgba(123,97,255,0.45)", fontSize: 10, fontWeight: 500 }}>
            {selectedActivitiesCount} activities combined
          </Typography>
        )}
      </Box>

      {/* Scrollable Grouped Moments */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
          overflow: "auto",
          maxHeight: 340,
          pr: 0.5,
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
        {groupedMoments.map((group) => {
          const groupDuration = group.moments.reduce((sum, m) => sum + m.duration, 0);
          return (
            <Box
              key={group.key}
              sx={{
                borderLeft: `3px solid ${group.accent}`,
                borderRadius: "0 8px 8px 0",
                bgcolor: group.accentBg,
                transition: "background 0.15s ease",
              }}
            >
              {/* Group Header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 1.5,
                  pt: 0.875,
                  pb: group.moments.length > 0 ? 0.5 : 0.875,
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{
                      color: group.accent,
                      fontSize: 12,
                      fontWeight: 600,
                      lineHeight: 1.3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {group.title}
                  </Typography>
                  {group.subtitle && (
                    <Typography sx={{ color: "rgba(255,255,255,0.22)", fontSize: 10, lineHeight: 1.4 }}>
                      {group.subtitle}
                    </Typography>
                  )}
                </Box>
                {group.moments.length > 0 && (
                  <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0, ml: 1 }}>
                    {[group.moments.length, formatTime(groupDuration)].map((label, i) => (
                      <Typography
                        key={i}
                        component="span"
                        sx={{
                          color: "rgba(255,255,255,0.35)",
                          fontSize: 10,
                          bgcolor: "rgba(0,0,0,0.2)",
                          px: 0.75,
                          py: 0.125,
                          borderRadius: 0.75,
                          fontWeight: 500,
                          lineHeight: 1.5,
                        }}
                      >
                        {label}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>

              {/* Moment Rows */}
              {group.moments.length > 0 ? (
                <Box sx={{ px: 0.5, pb: 0.5 }}>
                  {group.moments.map((moment) => (
                    <Box
                      key={moment.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        pl: 1,
                        pr: 0.5,
                        py: 0.375,
                        borderRadius: 0.75,
                        "&:hover": { bgcolor: "rgba(0,0,0,0.15)" },
                        "&:hover .moment-actions": { opacity: 1 },
                        transition: "background 0.1s ease",
                      }}
                    >
                      {editingMomentId === moment.id ? (
                        <Box sx={{ display: "flex", gap: 0.75, width: "100%", alignItems: "center" }}>
                          <TextField
                            value={moment.name}
                            onChange={(e) => onUpdateMoment(moment.id, { name: e.target.value })}
                            placeholder="Moment name"
                            size="small"
                            autoFocus
                            sx={{
                              flex: 1,
                              "& .MuiOutlinedInput-root": {
                                color: "white",
                                fontSize: 12,
                                "& input": { py: 0.5, px: 1 },
                                "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                                "&.Mui-focused fieldset": { borderColor: "#7B61FF" },
                              },
                            }}
                          />
                          <TextField
                            type="number"
                            value={moment.duration}
                            onChange={(e) =>
                              onUpdateMoment(moment.id, { duration: parseInt(e.target.value) || 1 })
                            }
                            inputProps={{ min: 1, step: 1 }}
                            size="small"
                            sx={{
                              width: 60,
                              "& .MuiOutlinedInput-root": {
                                color: "white",
                                fontSize: 12,
                                "& input": { py: 0.5, px: 0.75 },
                                "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                                "&.Mui-focused fieldset": { borderColor: "#7B61FF" },
                              },
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => onEditingIdChange(null)}
                            sx={{ p: 0.375 }}
                          >
                            <CheckIcon sx={{ fontSize: 14, color: "#7B61FF" }} />
                          </IconButton>
                        </Box>
                      ) : (
                        <>
                          <Box
                            sx={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              bgcolor: group.accent,
                              flexShrink: 0,
                              opacity: 0.4,
                            }}
                          />
                          <Typography
                            sx={{
                              color: "rgba(255,255,255,0.72)",
                              fontSize: 12.5,
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              lineHeight: 1.4,
                            }}
                          >
                            {moment.name}
                          </Typography>
                          <Typography sx={{ color: "rgba(255,255,255,0.28)", fontSize: 11, flexShrink: 0 }}>
                            {moment.duration}s
                          </Typography>
                          <Box
                            className="moment-actions"
                            sx={{ display: "flex", gap: 0, opacity: 0, transition: "opacity 0.15s ease", flexShrink: 0 }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => onEditingIdChange(moment.id ?? null)}
                              sx={{ p: 0.375 }}
                            >
                              <EditIcon sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => onRemoveMoment(moment.id)}
                              sx={{ p: 0.375 }}
                            >
                              <DeleteIcon sx={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }} />
                            </IconButton>
                          </Box>
                        </>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : group.key !== "manual" ? (
                <Box sx={{ px: 1.5, pb: 0.875 }}>
                  <Typography sx={{ color: "rgba(255,255,255,0.18)", fontSize: 11, fontStyle: "italic" }}>
                    No moments loaded
                  </Typography>
                </Box>
              ) : null}
            </Box>
          );
        })}
      </Box>

      {/* Add Moment Form */}
      <Box
        sx={{
          display: "flex",
          gap: 0.75,
          pt: 1,
          borderTop: "1px solid rgba(255,255,255,0.04)",
          alignItems: "center",
        }}
      >
        <TextField
          placeholder="Add custom moment..."
          value={newMoment.name}
          onChange={(e) => onNewMomentChange({ ...newMoment, name: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newMoment.name.trim()) onAddMoment();
          }}
          size="small"
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              color: "white",
              fontSize: 12,
              "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.12)" },
              "&.Mui-focused fieldset": { borderColor: "#7B61FF" },
            },
            "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.2)", opacity: 1 },
          }}
        />
        <TextField
          type="number"
          value={newMoment.duration}
          onChange={(e) =>
            onNewMomentChange({ ...newMoment, duration: parseInt(e.target.value) || 1 })
          }
          inputProps={{ min: 1, step: 1 }}
          size="small"
          sx={{
            width: 64,
            "& .MuiOutlinedInput-root": {
              color: "white",
              fontSize: 12,
              "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.12)" },
              "&.Mui-focused fieldset": { borderColor: "#7B61FF" },
            },
          }}
        />
        <Button
          onClick={onAddMoment}
          size="small"
          sx={{
            minWidth: 36,
            color: "rgba(255,255,255,0.4)",
            fontSize: 12,
            textTransform: "none",
            fontWeight: 500,
            "&:hover": { color: "#a78bfa", bgcolor: "rgba(123,97,255,0.08)" },
          }}
        >
          + Add
        </Button>
      </Box>
    </Box>
  );
}
