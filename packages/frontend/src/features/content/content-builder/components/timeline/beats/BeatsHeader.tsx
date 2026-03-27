"use client";

import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import type { TimelineScene } from "@/features/content/content-builder/types/timeline";
import type { SceneBeat } from "@/features/content/scenes/types/beats";

interface BeatsHeaderProps {
  beats: SceneBeat[];
  primaryScene: TimelineScene;
  shotCount?: number | null;
  draggingBeatId: number | null;
  onBeatClick: (e: React.MouseEvent, beat: SceneBeat, scene: TimelineScene) => void;
  onAddBeat: (scene: TimelineScene) => void;
  onBeatDragStart: (e: React.DragEvent, beatId: number, index: number, scene: TimelineScene) => void;
  onBeatDragOver: (e: React.DragEvent) => void;
  onBeatDrop: (e: React.DragEvent, dropIndex: number, targetScene: TimelineScene) => void;
}

const BeatsHeader: React.FC<BeatsHeaderProps> = ({
  beats,
  primaryScene,
  shotCount,
  draggingBeatId,
  onBeatClick,
  onAddBeat,
  onBeatDragStart,
  onBeatDragOver,
  onBeatDrop,
}) => {
  const totalDuration = beats.reduce((acc, beat) => acc + (beat.duration_seconds || 0), 0);

  return (
    <Box
      sx={{
        height: "32px",
        display: "flex",
        width: "100%",
        bgcolor: "rgba(0,0,0,0.3)",
        alignItems: "stretch",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          right: 8,
          top: 4,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          zIndex: 5,
        }}
      >
        <Typography sx={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>
          Shots: {typeof shotCount === "number" ? shotCount : "—"}
        </Typography>
        <IconButton size="small" onClick={() => onAddBeat(primaryScene)} sx={{ color: "#7B61FF", p: 0.5 }}>
          <AddIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      {beats.length > 0 ? (
        beats.map((beat, index) => {
          const beatDuration = beat.duration_seconds || 0;
          const flexVal = totalDuration > 0 ? beatDuration / totalDuration : 1;

          return (
            <Box
              key={`beat-header-${beat.id || index}`}
              draggable
              onDragStart={(e) => onBeatDragStart(e, beat.id, index, primaryScene)}
              onDragOver={onBeatDragOver}
              onDrop={(e) => onBeatDrop(e, index, primaryScene)}
              onClick={(e) => onBeatClick(e, beat, primaryScene)}
              sx={{
                flex: flexVal,
                minWidth: 0,
                borderRight: "1px solid rgba(255,255,255,0.1)",
                borderLeft: index > 0 ? "1px solid rgba(0,0,0,0.5)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                cursor: "pointer",
                bgcolor: "rgba(255,255,255,0.02)",
                userSelect: "none",
                opacity: draggingBeatId === beat.id ? 0.6 : 1,
                transition: "all 0.1s ease",
                "&:hover": {
                  bgcolor: "rgba(123, 97, 255, 0.2)",
                  zIndex: 2,
                  "& .edit-icon": { opacity: 1 },
                  "& .beat-header-text": { color: "rgba(255,255,255,0.95)" },
                },
              }}
            >
              <Typography
                className="beat-header-text"
                sx={{
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.8)",
                  px: 0.5,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  opacity: 1,
                  transition: "color 0.15s ease-out",
                }}
              >
                {beat.name}{typeof beat.shot_count === "number" ? ` · ${beat.shot_count} shots` : ""}
              </Typography>

              <EditIcon
                className="edit-icon"
                sx={{
                  fontSize: 12,
                  color: "white",
                  ml: 0.5,
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
              />
            </Box>
          );
        })
      ) : (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography
            sx={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.3)",
              fontStyle: "italic",
            }}
          >
            No Beats
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BeatsHeader;
