"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
    Videocam as VideoIcon,
    VolumeUp as AudioIcon,
    Palette as GraphicsIcon,
    MusicNote as MusicIcon,
} from "@mui/icons-material";
import { useDroppable } from "@dnd-kit/core";
import { TimelineTrack as TimelineTrackType } from "@/features/content/content-builder/types/timeline";
import { ViewState } from "@/features/content/content-builder/types/timeline";
import { useContentBuilder } from "../../../context/ContentBuilderContext";
import { getEquipmentLabelForTrackName } from "@/features/content/films/utils/equipmentAssignments";
import TrackDefaultDialog from "./TrackDefaultDialog";

interface TimelineTrackProps {
    track: TimelineTrackType;
    trackPosition: number;
    isValidDropTarget: boolean;
    viewState: ViewState;
    children: React.ReactNode;
}

const Track: React.FC<TimelineTrackProps> = ({
    track,
    trackPosition,
    isValidDropTarget,
    viewState,
    children,
}) => {
    const { equipmentAssignmentsBySlot, trackDefaults, setTrackDefault, scenes, packageSubjects } = useContentBuilder();
    const [defaultDialogOpen, setDefaultDialogOpen] = React.useState(false);

    const { isOver, setNodeRef } = useDroppable({
        id: `timeline-track-${track.id}`,
        data: {
            type: 'timeline-track',
            trackId: track.id,
            trackType: track.track_type,
        },
    });

    const getTrackIcon = (trackType: string) => {
        const type = trackType.toUpperCase();
        switch (type) {
            case 'VIDEO': return <VideoIcon />;
            case 'AUDIO': return <AudioIcon />;
            case 'GRAPHICS': return <GraphicsIcon />;
            case 'MUSIC': return <MusicIcon />;
            default: return <VideoIcon />;
        }
    };

    const normalizedTrackType = track.track_type?.toString().toLowerCase();
    const showEquipmentLabel = normalizedTrackType === "video" || normalizedTrackType === "audio";
    const equipmentLabel = showEquipmentLabel
        ? getEquipmentLabelForTrackName(track.name, equipmentAssignmentsBySlot)
        : "";

    // Crew info from track assignment
    const crewMember = track.crew;
    const crewColor = crewMember?.crew_color || null;
    const crewName = crewMember?.contact
        ? [crewMember.contact.first_name, crewMember.contact.last_name].filter(Boolean).join(" ")
        : null;
    const isUnmanned = track.is_unmanned === true;

    return (
        <Box
            ref={setNodeRef}
            sx={{
                position: "absolute",
                width: "100%",
                height: 40,
                top: trackPosition,
                left: 0,
                right: 0,
            }}
        >
            {/* Track background */}
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 40,
                    bgcolor: track.visible
                        ? (isValidDropTarget || isOver)
                            ? `${track.color}40`
                            : `${track.color}25`
                        : "rgba(255, 255, 255, 0.04)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                    transition: "background-color 0.2s ease-in-out",
                    ...(isOver && {
                        bgcolor: `${track.color}60`,
                        boxShadow: `inset 0 0 0 2px ${track.color}80`,
                    }),
                }}
            />

            {/* Floating Track Header */}
            <Box
                sx={{
                    position: "absolute",
                    top: 8,
                    left: viewState.viewportLeft + 8,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    zIndex: 300,
                    transition: "left 0.1s ease-out",
                    "&:hover .track-text": {
                        opacity: 1,
                        transform: "translateX(0)",
                    },
                }}
            >
                <Box
                    onClick={() => setDefaultDialogOpen(true)}
                    sx={{
                        p: 0.5,
                        borderRadius: 0.75,
                        bgcolor: trackDefaults[track.id]
                            ? `${track.color}30`
                            : "rgba(0, 0, 0, 0.7)",
                        color: track.color,
                        display: "flex",
                        alignItems: "center",
                        width: 24,
                        height: 24,
                        justifyContent: "center",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
                        border: trackDefaults[track.id]
                            ? `1px solid ${track.color}80`
                            : "1px solid rgba(255,255,255,0.15)",
                        backdropFilter: "blur(4px)",
                        transition: "all 0.2s ease-in-out",
                        cursor: "pointer",
                        "&:hover": {
                            transform: "scale(1.1)",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.7)",
                            bgcolor: `${track.color}30`,
                            border: `1px solid ${track.color}60`,
                        },
                    }}
                >
                    {getTrackIcon(track.track_type)}
                </Box>

                {/* Track Text - Only Visible on Hover */}
                <Box
                    className="track-text"
                    sx={{
                        ml: 0.75,
                        opacity: 0,
                        transform: "translateX(-6px)",
                        transition: "opacity 0.15s ease-out, transform 0.15s ease-out",
                        bgcolor: "rgba(0,0,0,0.9)",
                        px: 0.75,
                        py: 0.4,
                        borderRadius: 0.5,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, fontSize: "0.75rem", color: "#fff", lineHeight: 1.1 }}
                    >
                        {track.name}
                    </Typography>
                    {showEquipmentLabel && equipmentLabel && (
                        <Typography
                            variant="caption"
                            sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.65rem", lineHeight: 1.2, fontWeight: 500, mt: 0.15, display: 'block' }}
                        >
                            {equipmentLabel}
                        </Typography>
                    )}
                    {crewName && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                            <Box sx={{
                                width: 6, height: 6, borderRadius: "50%",
                                bgcolor: crewColor || "#EC4899",
                                flexShrink: 0,
                            }} />
                            <Typography
                                variant="caption"
                                sx={{ color: crewColor || "#EC4899", fontSize: "0.65rem", lineHeight: 1.1, fontWeight: 600 }}
                            >
                                {crewName}
                            </Typography>
                        </Box>
                    )}
                    {isUnmanned && (
                        <Typography
                            variant="caption"
                            sx={{ color: "rgba(255,200,50,0.85)", fontSize: "0.6rem", lineHeight: 1.1, fontStyle: "italic", fontWeight: 600 }}
                        >
                            Unmanned
                        </Typography>
                    )}
                    {!crewName && !isUnmanned && showEquipmentLabel && !equipmentLabel && (
                        <Typography
                            variant="caption"
                            sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", lineHeight: 1.1, fontStyle: "italic" }}
                        >
                            No equipment assigned
                        </Typography>
                    )}
                    <Box sx={{
                        mt: 0.5,
                        pt: 0.4,
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                    }}>
                        <Typography
                            variant="caption"
                            sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.6rem", lineHeight: 1.1, fontStyle: "italic" }}
                        >
                            Click to set track default
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {children}

            {defaultDialogOpen && (
                <TrackDefaultDialog
                    open={defaultDialogOpen}
                    track={track}
                    currentDefault={trackDefaults[track.id]}
                    packageSubjects={packageSubjects as Array<{ id: number; name: string }>}
                    scenes={scenes}
                    onClose={() => setDefaultDialogOpen(false)}
                    onSaveDefault={(trackId, defaults) => {
                        setTrackDefault(trackId, defaults);
                        setDefaultDialogOpen(false);
                    }}
                />
            )}
        </Box>
    );
};

export default React.memo(Track);
