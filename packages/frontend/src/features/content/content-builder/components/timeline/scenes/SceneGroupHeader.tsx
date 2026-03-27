"use client";

import React from "react";
import {
    Box,
    IconButton,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import TuneIcon from "@mui/icons-material/Tune";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MovieFilterIcon from "@mui/icons-material/MovieFilter";
import MomentsHeader from "../moments/MomentsHeader";
import BeatsHeader from "../beats/BeatsHeader";
import type { SceneHeaderGroup } from "../../../hooks/scenes/useSceneHeaderGroups";
import type { TimelineScene } from "@/features/content/content-builder/types/timeline";
import type { TimelineSceneMoment } from "@/features/content/moments/types";
import type { SceneBeat } from "@/features/content/scenes/types/beats";
import type { ViewState } from "@/features/content/content-builder/types/timeline";

interface SceneGroupHeaderProps {
    group: SceneHeaderGroup;
    index: number;
    sceneGroupsLength: number;
    scenes: TimelineScene[];
    viewState: ViewState;
    zoomLevel: number;
    /** Schedule start time for this scene (HH:MM) */
    scheduleStartTime?: string | null;
    /** Schedule end time for this scene (HH:MM) */
    scheduleEndTime?: string | null;
    /** Name of the event day this scene is assigned to */
    scheduleEventDayName?: string | null;
    onReorderScene?: (direction: "left" | "right", sceneName: string) => void;
    onDeleteScene?: (sceneIds: number[]) => void | Promise<void>;
    onUpdateScene?: (scene: TimelineScene) => void;
    onMomentHover?: (momentId: number | null) => void;
    editingSceneName: string | null;
    sceneNameDraft: string;
    setSceneNameDraft: (next: string) => void;
    startSceneNameEdit: (sceneName: string) => void;
    cancelSceneNameEdit: () => void;
    saveSceneNameEdit: (sceneName: string) => void;
    openRecordingSetup: (sceneName: string, sceneLabel?: string) => void;
    resizingMomentId: number | null;
    draggingMomentId: number | null;
    onMomentDragStart: (e: React.DragEvent, momentId: number, index: number, scene: TimelineScene) => void;
    onMomentDragOver: (e: React.DragEvent) => void;
    onMomentDrop: (e: React.DragEvent, dropIndex: number, targetScene: TimelineScene) => void;
    onMomentClick: (e: React.MouseEvent, moment: TimelineSceneMoment, scene: TimelineScene) => void;
    onResizeStart: (e: React.MouseEvent, momentId: number, currentDuration: number, scene: TimelineScene) => void;
    onBeatClick: (e: React.MouseEvent, beat: SceneBeat, scene: TimelineScene) => void;
    onAddBeat: (scene: TimelineScene) => void;
    draggingBeatId: number | null;
    onBeatDragStart: (e: React.DragEvent, beatId: number, index: number, scene: TimelineScene) => void;
    onBeatDragOver: (e: React.DragEvent) => void;
    onBeatDrop: (e: React.DragEvent, dropIndex: number, targetScene: TimelineScene) => void;
}

const SceneGroupHeader: React.FC<SceneGroupHeaderProps> = ({
    group,
    index,
    sceneGroupsLength,
    scenes,
    viewState,
    zoomLevel,
    scheduleStartTime,
    scheduleEndTime,
    scheduleEventDayName,
    onReorderScene,
    onDeleteScene,
    onUpdateScene,
    onMomentHover,
    editingSceneName,
    sceneNameDraft,
    setSceneNameDraft,
    startSceneNameEdit,
    cancelSceneNameEdit,
    saveSceneNameEdit,
    openRecordingSetup,
    resizingMomentId,
    draggingMomentId,
    onMomentDragStart,
    onMomentDragOver,
    onMomentDrop,
    onMomentClick,
    onResizeStart,
    onBeatClick,
    onAddBeat,
    draggingBeatId,
    onBeatDragStart,
    onBeatDragOver,
    onBeatDrop,
}) => {
    const safeZoomLevel = Number.isFinite(zoomLevel) && zoomLevel > 0 ? zoomLevel : 5;
    const startPixels = group.startTime * safeZoomLevel;
    const endPixels = group.endTime * safeZoomLevel;
    const widthPixels = Math.max(endPixels - startPixels, 120);

    // ── Graduated layout levels based on available scene width ──
    // Level 4 (full):     >= 400px — all badges, location, schedule, all buttons
    // Level 3 (standard): >= 250px — scene label, mode icon, name, buttons on hover
    // Level 2 (compact):  >=  85px — "Scene {n}", mode icon, name only if room (>=150px)
    // Level 1 (minimal):  <   85px — S{n} + mode icon only, tooltip for details
    const layoutLevel = widthPixels >= 400 ? 4 : widthPixels >= 250 ? 3 : widthPixels >= 85 ? 2 : 1;
    const canShowName = widthPixels >= 150;

    const visibleLeft = startPixels - viewState.viewportLeft;
    const locationName = (group.primaryScene as any)?.location_assignment?.location?.name as string | undefined;
    const sceneNumber = typeof group.order_index === "number" ? group.order_index + 1 : index + 1;
    const primaryScene = group.primaryScene;
    const hasMoments = Array.isArray((primaryScene as any)?.moments) && (primaryScene as any).moments.length > 0;
    const hasBeats = Array.isArray((primaryScene as any)?.beats) && (primaryScene as any).beats.length > 0;
    const hasShotCount = (primaryScene as any)?.shot_count !== null && typeof (primaryScene as any)?.shot_count !== "undefined";
    const hasDurationSeconds = (primaryScene as any)?.duration_seconds !== null && typeof (primaryScene as any)?.duration_seconds !== "undefined";
    const rawTemplateId = (primaryScene as any)?.scene_template_id;
    const hasTemplateId = Number.isFinite(rawTemplateId) && Number(rawTemplateId) > 0;
    const isMontageScene = primaryScene?.scene_template_type === "MONTAGE"
        || (primaryScene as any)?.scene_mode === "MONTAGE";
    const montageStyleRaw = (primaryScene as any)?.montage_style as string | undefined;
    const montageStyleLabel = montageStyleRaw
        ? montageStyleRaw.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        : undefined;
    const montageSourceCount = isMontageScene && hasMoments
        ? new Set(((primaryScene as any)?.moments ?? []).map((m: any) => m.source_activity_id).filter(Boolean)).size
        : 0;
    const montageDurationSec = isMontageScene ? ((primaryScene as any)?.duration_seconds ?? (primaryScene as any)?.duration ?? null) : null;
    const sceneModeLabel = isMontageScene ? "Montage Scene" : "Realtime Scene";
    const SceneModeIcon = isMontageScene ? MovieFilterIcon : AccessTimeIcon;
    const sceneModeColor = isMontageScene ? "#FFB020" : "#4CAF50";

    if (visibleLeft + widthPixels < 0 || visibleLeft > viewState.viewportWidth) {
        return null;
    }

    // Build tooltip summary for compact/minimal modes
    const tooltipParts: string[] = [];
    if (layoutLevel < 3 || !canShowName) tooltipParts.push(`Scene ${sceneNumber}: ${group.name}`);
    if (layoutLevel < 4 && isMontageScene) tooltipParts.push(sceneModeLabel);
    if (layoutLevel < 4 && montageStyleLabel) tooltipParts.push(montageStyleLabel);
    if (layoutLevel < 4 && montageSourceCount >= 2) tooltipParts.push(`${montageSourceCount} activities`);
    if (layoutLevel < 4 && montageDurationSec != null) tooltipParts.push(`${montageDurationSec}s`);
    if (layoutLevel < 4 && locationName) tooltipParts.push(locationName);
    if (layoutLevel < 4 && scheduleStartTime) tooltipParts.push(scheduleStartTime + (scheduleEndTime ? ' -> ' + scheduleEndTime : ''));
    const compactTooltip = tooltipParts.length > 0 ? tooltipParts.join(' - ') : undefined;

    return (
        <Box
            sx={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: `${widthPixels}px`,
                transform: `translateX(${visibleLeft}px)`,
                backgroundColor: "rgba(35, 35, 45, 0.6)",
                borderLeft: "4px solid #7B61FF",
                borderRight: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                transition: "all 0.2s ease",
                zIndex: 10,
                "&:hover": {
                    backgroundColor: "rgba(45, 45, 55, 0.8)",
                    borderLeftColor: "#9D8AFF",
                },
            }}
        >
            <Box title={compactTooltip} sx={{ flex: 1, display: "flex", alignItems: "center", px: layoutLevel <= 2 ? 1 : 2, borderBottom: "1px solid rgba(255,255,255,0.05)", minHeight: "36px", overflow: "hidden" }}>
                {/* Scene number label — graduated: S1 at minimal, Scene 1 otherwise */}
                <Typography
                    variant="overline"
                    sx={{
                        fontSize: "10px",
                        fontWeight: 800,
                        color: "#7B61FF",
                        lineHeight: 1,
                        letterSpacing: layoutLevel <= 1 ? "0.5px" : "1px",
                        textTransform: "uppercase",
                        mr: layoutLevel <= 1 ? 0.5 : 1,
                        flexShrink: 0,
                    }}
                >
                    {layoutLevel <= 1 ? `S${sceneNumber}` : `Scene ${sceneNumber}`}
                </Typography>
                {/* Mode icon — always visible */}
                <Tooltip title={sceneModeLabel} arrow>
                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            color: sceneModeColor,
                            mr: 0.5,
                            flexShrink: 0,
                        }}
                    >
                        <SceneModeIcon sx={{ fontSize: 14 }} />
                    </Box>
                </Tooltip>
                {/* Montage badges — level 4 only */}
                {layoutLevel >= 4 && isMontageScene && montageStyleLabel && (
                    <Typography sx={{ fontSize: "9px", fontWeight: 700, color: "#FFB020", textTransform: "uppercase", letterSpacing: "0.5px", mr: 0.5 }}>
                        {montageStyleLabel}
                    </Typography>
                )}
                {layoutLevel >= 4 && isMontageScene && montageSourceCount >= 2 && (
                    <Typography sx={{ fontSize: "9px", fontWeight: 500, color: "rgba(255,255,255,0.4)", mr: 0.5 }}>
                        {montageSourceCount} activities
                    </Typography>
                )}
                {layoutLevel >= 4 && isMontageScene && montageDurationSec != null && (
                    <Box sx={{ px: 0.75, py: 0.125, borderRadius: 0.5, bgcolor: "rgba(255,176,32,0.15)", mr: 1 }}>
                        <Typography sx={{ fontSize: "8px", fontWeight: 600, color: "rgba(255,176,32,0.7)", fontFamily: "monospace", lineHeight: 1 }}>
                            {montageDurationSec}s
                        </Typography>
                    </Box>
                )}

                {editingSceneName === group.name && layoutLevel >= 3 ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <TextField
                            value={sceneNameDraft}
                            onChange={(e) => setSceneNameDraft(e.target.value)}
                            size="small"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") saveSceneNameEdit(group.name);
                                if (e.key === "Escape") cancelSceneNameEdit();
                            }}
                            sx={{
                                input: {
                                    color: "rgba(255,255,255,0.85)",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                },
                            }}
                        />
                        <IconButton size="small" onClick={() => saveSceneNameEdit(group.name)} sx={{ color: "#7B61FF" }}>
                            <CheckIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton size="small" onClick={cancelSceneNameEdit} sx={{ color: "#FF6B9D" }}>
                            <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Box>
                ) : (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, overflow: "hidden", minWidth: 0 }}>
                        {/* Scene name — only when there's genuinely room */}
                        {canShowName && layoutLevel >= 2 && (
                            <Typography sx={{
                                color: "rgba(255,255,255,0.7)",
                                fontSize: layoutLevel <= 2 ? "10px" : "12px",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: layoutLevel <= 2 ? 80 : layoutLevel === 3 ? 140 : "none",
                                minWidth: 0,
                            }}>
                                {group.name}
                            </Typography>
                        )}
                        {/* Edit pencil — level 3+ */}
                        {layoutLevel >= 3 && onUpdateScene && (
                            <IconButton size="small" onClick={() => startSceneNameEdit(group.name)} sx={{ color: "#7B61FF", flexShrink: 0 }}>
                                <EditIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                        )}
                        {/* Location — level 4 only */}
                        {layoutLevel >= 4 && locationName && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                                <LocationOnOutlinedIcon sx={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }} />
                                <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "11px", fontWeight: 500 }}>
                                    {locationName}
                                </Typography>
                            </Box>
                        )}
                        {/* Schedule — level 4 only */}
                        {layoutLevel >= 4 && scheduleStartTime && (
                            <Tooltip title={scheduleEventDayName ? `${scheduleEventDayName}: ${scheduleStartTime}${scheduleEndTime ? ` -> ${scheduleEndTime}` : ""}` : `Scheduled: ${scheduleStartTime}${scheduleEndTime ? ` -> ${scheduleEndTime}` : ""}`} arrow>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 0.5, px: 0.75, py: 0.25, borderRadius: 1, bgcolor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", flexShrink: 0 }}>
                                    <AccessTimeIcon sx={{ fontSize: 10, color: "#f59e0b" }} />
                                    <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#f59e0b", fontFamily: "monospace", lineHeight: 1 }}>
                                        {scheduleStartTime}
                                    </Typography>
                                    {scheduleEndTime && (
                                        <>
                                            <Typography sx={{ fontSize: "8px", color: "rgba(245,158,11,0.5)", lineHeight: 1 }}>-&gt;</Typography>
                                            <Typography sx={{ fontSize: "10px", fontWeight: 600, color: "rgba(59,130,246,0.8)", fontFamily: "monospace", lineHeight: 1 }}>
                                                {scheduleEndTime}
                                            </Typography>
                                        </>
                                    )}
                                </Box>
                            </Tooltip>
                        )}
                    </Box>
                )}

                {/* Action buttons — level 3+: settings, reorder, delete */}
                {layoutLevel >= 3 && (
                    <Box sx={{ display: "flex", ml: "auto", alignItems: "center", flexShrink: 0 }}>
                        <Tooltip title="Scene Settings">
                            <IconButton size="small" onClick={() => openRecordingSetup(group.name, `Scene ${sceneNumber}`)} sx={{ color: "#7B61FF", p: 0.5 }}>
                                <TuneIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                        {layoutLevel >= 4 && onReorderScene && (
                            <>
                                <IconButton size="small" onClick={() => onReorderScene?.("left", group.name)} disabled={index === 0} sx={{ ml: 0.5, color: index === 0 ? "#444" : "#7B61FF" }}>
                                    <ArrowBackIosNewIcon sx={{ fontSize: 12 }} />
                                </IconButton>
                                <IconButton size="small" onClick={() => onReorderScene?.("right", group.name)} disabled={index === sceneGroupsLength - 1} sx={{ ml: 0.5, color: index === sceneGroupsLength - 1 ? "#444" : "#7B61FF" }}>
                                    <ArrowForwardIosIcon sx={{ fontSize: 12 }} />
                                </IconButton>
                            </>
                        )}
                        {onDeleteScene && (
                            <IconButton
                                size="small"
                                onClick={() => {
                                    const groupSceneIds = scenes
                                        .filter((scene) => scene.name === group.name)
                                        .map((scene) => scene.id);
                                    if (groupSceneIds.length > 0) {
                                        onDeleteScene(groupSceneIds);
                                    }
                                }}
                                sx={{ ml: 0.5, color: "#FF6B9D", opacity: 0.7, "&:hover": { opacity: 1 } }}
                            >
                                <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        )}
                    </Box>
                )}
            </Box>

            {!hasMoments && hasBeats ? (
                <BeatsHeader
                    beats={group.beats}
                    primaryScene={group.primaryScene}
                    shotCount={(group.primaryScene as any)?.shot_count ?? null}
                    draggingBeatId={draggingBeatId}
                    onBeatClick={onBeatClick}
                    onAddBeat={onAddBeat}
                    onBeatDragStart={onBeatDragStart}
                    onBeatDragOver={onBeatDragOver}
                    onBeatDrop={onBeatDrop}
                />
            ) : (
                <MomentsHeader
                    moments={group.moments}
                    primaryScene={group.primaryScene}
                    zoomLevel={zoomLevel}
                    mode="moments"
                    shotCount={(group.primaryScene as any)?.shot_count ?? null}
                    resizingMomentId={resizingMomentId}
                    draggingMomentId={draggingMomentId}
                    onMomentDragStart={onMomentDragStart}
                    onMomentDragOver={onMomentDragOver}
                    onMomentDrop={onMomentDrop}
                    onMomentClick={onMomentClick}
                    onResizeStart={onResizeStart}
                    onMomentHover={onMomentHover}
                />
            )}
        </Box>
    );
};

export default SceneGroupHeader;
