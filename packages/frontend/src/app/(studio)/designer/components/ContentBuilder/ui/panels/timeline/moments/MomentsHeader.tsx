"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Chip, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import { alpha } from "@mui/material/styles";
import { formatTime } from "@/lib/utils/formatUtils";
import { TimelineScene } from "@/lib/types/timeline";
import { useContentBuilder } from "../../../../context/ContentBuilderContext";

interface MomentsHeaderProps {
  moments: any[];
  primaryScene: TimelineScene;
  zoomLevel: number;
  mode?: "moments" | "montage";
  shotCount?: number | null;
  resizingMomentId: number | null;
  draggingMomentId: number | null;
  onMomentDragStart: (e: React.DragEvent, momentId: number, index: number, scene: TimelineScene) => void;
  onMomentDragOver: (e: React.DragEvent) => void;
  onMomentDrop: (e: React.DragEvent, dropIndex: number, targetScene: TimelineScene) => void;
  onMomentClick: (e: React.MouseEvent, moment: any, scene: TimelineScene) => void;
  onResizeStart: (e: React.MouseEvent, momentId: number, currentDuration: number, scene: TimelineScene) => void;
  onMomentHover?: (momentId: number | null) => void;
}

/**
 * MomentsHeader Component
 * 
 * Displays the moment headers below scene headers.
 * Shows individual moments as clickable, draggable, and resizable boxes.
 * Allows editing moment assignments and reordering.
 */
const MomentsHeader: React.FC<MomentsHeaderProps> = ({
  moments,
  primaryScene,
  zoomLevel,
  mode = "moments",
  shotCount = null,
  resizingMomentId,
  draggingMomentId,
  onMomentDragStart,
  onMomentDragOver,
  onMomentDrop,
  onMomentClick,
  onResizeStart,
  onMomentHover,
}) => {
  if (mode === "montage") {
    return (
      <Box
        sx={{
          height: "32px",
          display: "flex",
          width: "100%",
          bgcolor: "rgba(0,0,0,0.3)",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          borderRight: "2px solid #7B61FF",
          backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 24px)",
        }}
      >
        <Typography
          sx={{
            fontSize: "10px",
            color: "rgba(255,255,255,0.6)",
            fontStyle: "italic",
          }}
        >
          Shots: {typeof shotCount === "number" ? shotCount : "—"}
        </Typography>
      </Box>
    );
  }

  const { packageId } = useContentBuilder();
  const router = useRouter();

  // Use scene duration so moments show at their real proportions (with gaps).
  const totalMomentDuration = moments.reduce((acc: number, m: any) => acc + (m.duration || m.duration_seconds || 0), 0);
  const totalDuration = primaryScene.duration || totalMomentDuration;
  const hasGap = totalMomentDuration < totalDuration;

  return (
    <Box
      sx={{
        height: "32px",
        display: "flex",
        width: "100%",
        bgcolor: "rgba(0,0,0,0.3)",
        alignItems: "stretch",
      }}
    >
      {moments.length > 0 ? (
        <>
        {moments.map((moment, mIdx) => {
          const momentDuration = moment.duration || moment.duration_seconds || 0;
          const widthPercent = totalDuration > 0 ? (momentDuration / totalDuration) * 100 : 0;

          return (
            <Box
              key={`moment-header-${moment.id || mIdx}`}
              draggable
              onDragStart={(e) => onMomentDragStart(e, moment.id, mIdx, primaryScene)}
              onDragOver={onMomentDragOver}
              onDrop={(e) => onMomentDrop(e, mIdx, primaryScene)}
              onClick={(e) => onMomentClick(e, moment, primaryScene)}
              onMouseEnter={() => onMomentHover?.(moment.id)}
              onMouseLeave={() => onMomentHover?.(null)}
              sx={{
                flex: 'none',
                width: `${widthPercent}%`,
                minWidth: 0,
                borderRight: "1px solid rgba(255,255,255,0.1)",
                borderLeft: mIdx > 0 ? "1px solid rgba(0,0,0,0.5)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                cursor: "pointer",
                bgcolor: "rgba(255,255,255,0.02)",
                userSelect: "none",
                opacity: draggingMomentId === moment.id ? 0.6 : 1,
                transition: "all 0.1s ease",
                "&:hover": {
                  bgcolor: "rgba(123, 97, 255, 0.2)",
                  zIndex: 2,
                  "& .resize-handle": { opacity: 1 },
                  "& .edit-icon": { opacity: 1 },
                  "& .moment-header-text": { color: "rgba(255,255,255,0.95)" },
                },
              }}
            >
              <Typography
                className="moment-header-text"
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
                {moment.name}
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

              {/* Resize Handle - right edge */}
              <Box
                className="resize-handle"
                onMouseDown={(e) => onResizeStart(e, moment.id, momentDuration, primaryScene)}
                sx={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: "6px",
                  cursor: "ew-resize",
                  opacity: resizingMomentId === moment.id ? 1 : 0,
                  bgcolor: resizingMomentId === moment.id ? "#7B61FF" : "rgba(123,97,255,0.5)",
                  zIndex: 20,
                  transition: "opacity 0.1s",
                  "&:hover": { bgcolor: "#7B61FF", opacity: 1 },
                }}
              />
            </Box>
          );
        })}
        {/* Gap fill — remaining unplanned time with manage button */}
        {hasGap && (
            <Box
                onClick={packageId ? (e) => {
                    e.stopPropagation();
                    router.push(`/designer/packages/${packageId}`);
                } : undefined}
                sx={{
                    flex: 'none',
                    width: `${((totalDuration - totalMomentDuration) / totalDuration) * 100}%`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: packageId ? 'pointer' : 'default',
                    backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px)',
                    transition: 'all 0.15s ease-out',
                    '&:hover': {
                        bgcolor: 'rgba(123, 97, 255, 0.08)',
                        '& .gap-chip': {
                            bgcolor: alpha('#7B61FF', 0.18),
                            borderColor: alpha('#7B61FF', 0.35),
                        },
                    },
                }}
            >
                <Chip
                    className="gap-chip"
                    icon={<EditNoteRoundedIcon sx={{ fontSize: 13 }} />}
                    label={`${formatTime(totalDuration - totalMomentDuration)} unplanned`}
                    size="small"
                    variant="outlined"
                    sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        fontWeight: 500,
                        color: alpha('#7B61FF', 0.7),
                        borderColor: alpha('#7B61FF', 0.18),
                        bgcolor: alpha('#7B61FF', 0.06),
                        transition: 'all 0.15s ease-out',
                        '& .MuiChip-icon': { color: alpha('#7B61FF', 0.5), ml: 0.5 },
                        '& .MuiChip-label': { px: 0.5 },
                        pointerEvents: 'none',
                    }}
                />
            </Box>
        )}
        </>
      ) : (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography
            sx={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.3)",
              fontStyle: "italic",
            }}
          >
            No Moments
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MomentsHeader;
