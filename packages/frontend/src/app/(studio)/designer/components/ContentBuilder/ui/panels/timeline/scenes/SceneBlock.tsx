"use client";

import React from "react";
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Chip } from "@mui/material";
import { alpha, lighten } from "@mui/material/styles";
import { TimelineScene } from "@/lib/types/timeline";
import { ViewState } from "@/lib/types/timeline";
import { formatTime } from "@/lib/utils/formatUtils";
import { getSceneColorByType } from "../../../../utils/colorUtils";
import MomentEditor from "../moments/MomentEditor";
import { useSceneLayout, useMomentOperations } from "@/hooks/content-builder";
import { useContentBuilder } from "../../../../context/ContentBuilderContext";
import { MomentsContainer } from "../moments/MomentsContainer";
import { BeatsContainer } from "../beats/BeatsContainer";
import { SceneActions } from "./SceneActions";
import type { SceneMoment } from "@/lib/types/domains/moments";
import { createScenesApi } from "@/lib/api/scenes.api";
import { apiClient } from "@/lib/api";
import type { ApiClient } from "@/lib/api/api-client.types";
import { TimelineTrack } from "@/lib/types/timeline";
import { isLogEnabled } from "@/lib/debug/log-flags";
import { createRecordingSetupApi } from "@/lib/api/recording-setup.api";
import type { MomentRecordingSetup, SceneRecordingSetup } from "@/lib/types/domains/recording-setup";

type MomentWithSetup = Omit<SceneMoment, "recording_setup"> & {
    recording_setup?: unknown;
    has_recording_setup?: boolean;
};

interface SceneBlockProps {
    scene: TimelineScene;
    trackPosition: number;
    trackId?: number;
    trackType?: string;
    trackName?: string;
    allTracks?: TimelineTrack[];
    viewState: ViewState;
    onMouseDown?: (e: React.MouseEvent, scene: TimelineScene) => void;
    onDelete?: (scene: TimelineScene) => void;
    readOnly?: boolean;
    hoveredMomentId?: number | null;
}

const SceneBlock: React.FC<SceneBlockProps> = ({
    scene,
    trackPosition,
    trackId,
    trackType,
    trackName,
    allTracks,
    viewState,
    onMouseDown,
    onDelete,
    readOnly = false,
    hoveredMomentId,
}) => {
    const scenesApi = React.useMemo(() => createScenesApi(apiClient as unknown as ApiClient), []);
    const recordingSetupApi = React.useMemo(() => createRecordingSetupApi(apiClient as unknown as ApiClient), []);
    const { setScenes } = useContentBuilder();
    // 1. Scene Layout Hook
    const { width: sceneWidth, left: sceneLeft, showText } = useSceneLayout(scene, viewState);
    
    // Check if this is a moments-container with nested moments
    const databaseType = (scene as { database_type?: string }).database_type;
    const isMomentsContainer = databaseType === 'MOMENTS_CONTAINER';
    const moments = (scene.moments ?? []) as MomentWithSetup[];
    const beats = (scene as any).beats || [];
    const [localMoments, setLocalMoments] = React.useState<MomentWithSetup[]>(moments);
    const shouldLog = isLogEnabled("moments");

    const sceneTypeForColor = isMomentsContainer ? 'VIDEO' : (scene.scene_type || 'VIDEO');
    const sceneBaseColor = getSceneColorByType(sceneTypeForColor);
    const resolvedSceneColor = scene.color || sceneBaseColor;
    
    // For music tracks, use the darker music track color (#4a148c) instead of scene color
    const trackColorForMusic = trackType?.toLowerCase() === 'music' ? '#4a148c' : null;

    // Moment Editing State
    const [editingMoment, setEditingMoment] = React.useState<SceneMoment | null>(null);
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    const [selectedCoverageKey, setSelectedCoverageKey] = React.useState<string | null>(null);
    const [selectedTrackLabel, setSelectedTrackLabel] = React.useState<string | null>(null);
    const [infoMoment, setInfoMoment] = React.useState<SceneMoment | null>(null);
    const [infoOpen, setInfoOpen] = React.useState(false);
    const [infoRecordingSetup, setInfoRecordingSetup] = React.useState<MomentRecordingSetup | null>(null);
    const [infoSceneRecordingSetup, setInfoSceneRecordingSetup] = React.useState<SceneRecordingSetup | null>(null);
    const [infoSetupLoading, setInfoSetupLoading] = React.useState(false);
    const [infoSceneSetupLoading, setInfoSceneSetupLoading] = React.useState(false);

    const handleClosePopover = () => {
        setEditingMoment(null);
        setAnchorEl(null);
        setSelectedCoverageKey(null);
        setSelectedTrackLabel(null);
    };

    const handleCloseInfo = () => {
        setInfoMoment(null);
        setInfoOpen(false);
        setInfoRecordingSetup(null);
        setInfoSceneRecordingSetup(null);
        setInfoSetupLoading(false);
        setInfoSceneSetupLoading(false);
    };

    React.useEffect(() => {
        setLocalMoments(moments);
    }, [moments]);

    // 3. Moment Operations Hook — propagate moment name/duration edits to global scenes state
    const handleSceneMomentsUpdate = React.useCallback((updatedMoments: MomentWithSetup[]) => {
        setLocalMoments(updatedMoments);
        setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, moments: updatedMoments as any } : s));
    }, [scene.id, setScenes]);
    const { handleSaveMoment } = useMomentOperations(scene, localMoments, handleClosePopover, handleSceneMomentsUpdate);

    const handleMomentClick = (event: React.MouseEvent<HTMLElement>, moment: SceneMoment) => {
        if (readOnly) return;
        event.stopPropagation();
        setEditingMoment(moment);
        setAnchorEl(event.currentTarget);

        const normalizedTrackType = (trackType || scene.scene_type || 'VIDEO').toString().toUpperCase();
        const coverageKey = trackName || normalizedTrackType;
        setSelectedCoverageKey(coverageKey);
        setSelectedTrackLabel(trackName || normalizedTrackType);
    };

    const handleMomentInfoClick = (event: React.MouseEvent<HTMLElement>, moment: SceneMoment) => {
        if (readOnly) return;
        event.stopPropagation();
        if (shouldLog) {
            console.info("[MOMENT] Open info modal", {
                momentId: moment.id,
                momentName: moment.name,
                trackId,
                trackName,
                trackType,
                sceneId: scene.id,
            });
        }
        setInfoMoment(moment);
        setInfoOpen(true);
    };

    React.useEffect(() => {
        if (!infoOpen || !infoMoment?.id) return;

        let isActive = true;
        const fallbackSetup = (infoMoment as any).recording_setup || null;
        setInfoRecordingSetup(fallbackSetup);
        setInfoSceneRecordingSetup(null);
        setInfoSetupLoading(true);
        setInfoSceneSetupLoading(true);

        if (shouldLog) {
            console.info("[MOMENT] Info setup fetch start", {
                momentId: infoMoment.id,
                sceneId: scene.id,
                trackId,
                trackName,
                trackType,
                hasFallbackSetup: !!fallbackSetup,
                fallbackSetup,
            });
        }

        recordingSetupApi.recordingSetup
            .getByMoment(infoMoment.id)
            .then((setup) => {
                if (!isActive) return;
                const normalizedSetup = setup && Object.keys(setup).length > 0 ? setup : null;
                if (shouldLog) {
                    console.info("[MOMENT] Info setup fetch success", {
                        momentId: infoMoment.id,
                        setup: normalizedSetup,
                    });
                }
                setInfoRecordingSetup(normalizedSetup);

                if (!normalizedSetup) {
                    scenesApi.scenes.recordingSetup
                        .get(scene.id)
                        .then((sceneSetup) => {
                            if (!isActive) return;
                            if (shouldLog) {
                                console.info("[MOMENT] Scene setup fetch success", {
                                    momentId: infoMoment.id,
                                    sceneId: scene.id,
                                    sceneSetup,
                                });
                            }
                            setInfoSceneRecordingSetup(sceneSetup || null);
                        })
                        .catch((error) => {
                            if (!isActive) return;
                            if (shouldLog) {
                                console.warn("[MOMENT] Scene setup fetch failed", {
                                    momentId: infoMoment.id,
                                    sceneId: scene.id,
                                    error,
                                });
                            }
                        })
                        .finally(() => {
                            if (!isActive) return;
                            setInfoSceneSetupLoading(false);
                        });
                } else {
                    setInfoSceneSetupLoading(false);
                }
            })
            .catch((error) => {
                if (!isActive) return;
                if (shouldLog) {
                    console.warn("[MOMENT] Info setup fetch failed", {
                        momentId: infoMoment.id,
                        error,
                    });
                }
                setInfoRecordingSetup(fallbackSetup);
                if (!fallbackSetup) {
                    scenesApi.scenes.recordingSetup
                        .get(scene.id)
                        .then((sceneSetup) => {
                            if (!isActive) return;
                            if (shouldLog) {
                                console.info("[MOMENT] Scene setup fetch success", {
                                    momentId: infoMoment.id,
                                    sceneId: scene.id,
                                    sceneSetup,
                                });
                            }
                            setInfoSceneRecordingSetup(sceneSetup || null);
                        })
                        .catch((sceneError) => {
                            if (!isActive) return;
                            if (shouldLog) {
                                console.warn("[MOMENT] Scene setup fetch failed", {
                                    momentId: infoMoment.id,
                                    sceneId: scene.id,
                                    error: sceneError,
                                });
                            }
                        })
                        .finally(() => {
                            if (!isActive) return;
                            setInfoSceneSetupLoading(false);
                        });
                } else {
                    setInfoSceneSetupLoading(false);
                }
            })
            .finally(() => {
                if (!isActive) return;
                if (shouldLog) {
                    console.info("[MOMENT] Info setup fetch finished", {
                        momentId: infoMoment.id,
                    });
                }
                setInfoSetupLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [infoOpen, infoMoment, recordingSetupApi, scenesApi, scene.id, shouldLog, trackId, trackName, trackType]);

    const handleMomentRecordingSetupSave = async (momentId: number, data: { camera_track_ids?: number[]; camera_assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: string | null }>; audio_track_ids?: number[]; graphics_enabled?: boolean; graphics_title?: string | null }) => {
        console.info("[MOMENT] Upsert recording setup request", {
            momentId,
            data,
        });
        const setup = await scenesApi.moments.upsertRecordingSetup(momentId, data);
        const hasResponseBody = !!setup && (
            (setup as any).camera_assignments?.length ||
            (setup as any).camera_track_ids?.length ||
            (setup as any).audio_track_ids?.length ||
            typeof (setup as any).graphics_enabled !== "undefined" ||
            typeof (setup as any).graphics_title !== "undefined"
        );
        const setupSource = hasResponseBody
            ? setup
            : {
                camera_track_ids: data.camera_track_ids || [],
                audio_track_ids: data.audio_track_ids || [],
                graphics_enabled: data.graphics_enabled || false,
                graphics_title: data.graphics_title ?? null,
            };
        const normalizedSetup = {
            ...setupSource,
            camera_assignments: (setupSource as any)?.camera_assignments?.length
                ? (setupSource as any).camera_assignments
                : ((setupSource as any)?.camera_track_ids || []).map((id: number) => {
                    const source = data.camera_assignments?.find((assignment) => assignment.track_id === id);
                    return { track_id: id, subject_ids: source?.subject_ids || [], shot_type: source?.shot_type };
                }),
        };
        console.info("[MOMENT] Recording setup response", {
            momentId,
            responseBodyPresent: hasResponseBody,
            camera_assignments: normalizedSetup?.camera_assignments?.map((a) => a.track_id),
            audio_track_ids: normalizedSetup?.audio_track_ids,
            graphics_enabled: normalizedSetup?.graphics_enabled,
            graphics_title: normalizedSetup?.graphics_title,
        });
        setLocalMoments((prev) => {
            const next = prev.map((m) =>
                m.id === momentId ? { ...m, recording_setup: normalizedSetup, has_recording_setup: true } : m
            );
            (scene as TimelineScene & { moments?: MomentWithSetup[] }).moments = next;
            // Propagate to global scenes state so all tracks re-render instantly
            setScenes(prevScenes => prevScenes.map(s => s.id === scene.id ? { ...s, moments: next as any } : s));
            const updated = next.find((m) => m.id === momentId);
            console.info("[MOMENT] Local moment setup updated", {
                momentId,
                has_recording_setup: updated?.has_recording_setup,
                camera_assignments: (updated as any)?.recording_setup?.camera_assignments?.map((a: any) => a.track_id),
                audio_track_ids: (updated as any)?.recording_setup?.audio_track_ids,
                graphics_enabled: (updated as any)?.recording_setup?.graphics_enabled,
                graphics_title: (updated as any)?.recording_setup?.graphics_title,
            });
            return next;
        });
    };

    // Determine scene type for display logic
    const hasMoments = Array.isArray((scene as any)?.moments) && (scene as any).moments.length > 0;
    const hasBeats = Array.isArray((scene as any)?.beats) && (scene as any).beats.length > 0;
    const hasShotCount = (scene as any)?.shot_count !== null && typeof (scene as any)?.shot_count !== "undefined";
    const hasDurationSeconds = (scene as any)?.duration_seconds !== null && typeof (scene as any)?.duration_seconds !== "undefined";
    const rawTemplateId = (scene as any)?.scene_template_id;
    const hasTemplateId = Number.isFinite(rawTemplateId) && Number(rawTemplateId) > 0;
    const isMontageScene = (scene as any)?.scene_template_type === "MONTAGE"
        || (scene as any)?.scene_mode === "MONTAGE";
    const isMusicTrack = trackType?.toLowerCase() === 'music';
    
    // For montage scenes on music tracks, show solid background instead of transparent
    const shouldShowSolidBackground = !isMomentsContainer;

    return (
        <Box
            style={{
                position: "absolute",
                left: sceneLeft,
                top: trackPosition + 4, // 4px from top of track
                width: Math.max(sceneWidth, 20), // Minimum 20px width
                height: 32, // Track height minus padding
            }}
            onMouseDown={(e) => onMouseDown?.(e, scene)}
            sx={{
                bgcolor: shouldShowSolidBackground ? (trackColorForMusic || resolvedSceneColor) : 'transparent', 
                borderRadius: 1,
                border: isMomentsContainer 
                    ? `none` // Removing main border for moments container to let tiles handle it
                    : `1px solid rgba(255, 255, 255, 0.1)`,
                cursor: readOnly ? "default" : "grab",
                display: "flex", // Enable Flex for layout
                alignItems: "stretch", // Stretch children to full height
                transition: "all 0.2s ease-in-out",
                position: "relative", // Position context for nested elements
                "&:hover": readOnly ? {} : {
                    boxShadow: isMomentsContainer ? "none" : "0 2px 8px rgba(0, 0, 0, 0.3)", 
                    border: isMomentsContainer 
                        ? `none` 
                        : "1px solid rgba(255, 255, 255, 0.3)",
                    transform: "translateY(-1px)",
                },
                "&:active": readOnly ? {} : {
                    cursor: "grabbing",
                    transform: "translateY(0)",
                },
            }}
        >
            {/* CONTENT AREA: Moments & Labels */}
            <Box sx={{
                flex: 1, // Takes remaining width
                position: 'relative', // Context for absolute moments which will fill THIS box naturally
                display: 'flex',
                alignItems: 'center',
                overflow: 'visible' 
            }}>
                
                {/* Render moments visualization inside - Now relative to Content Area */}
                {isMomentsContainer && hasMoments && (
                    <MomentsContainer
                        scene={scene}
                        moments={localMoments}
                        trackId={trackId}
                        trackType={trackType}
                        trackName={trackName}
                        readOnly={readOnly}
                        onMomentInfoClick={handleMomentInfoClick}
                        hoveredMomentId={hoveredMomentId}
                        sceneWidth={sceneWidth}
                    />
                )}

                {isMomentsContainer && !hasMoments && hasBeats && trackType?.toLowerCase() !== 'music' && (
                    <BeatsContainer
                        scene={scene}
                        beats={beats}
                        trackId={trackId}
                        trackType={trackType}
                        trackName={trackName}
                        readOnly={readOnly}
                    />
                )}

                {/* Music track tile for montage scenes without moments (legacy) - styled to match moment tiles */}
                {isMomentsContainer && !hasMoments && isMusicTrack && (
                     (() => {
                        const trackBaseColor = '#4a148c'; // Dark purple base
                        // Use 0.35 lighten to match MomentsContainer logic exactly
                        const momentBaseColor = lighten(trackBaseColor, 0.35);
                        // Use 0.95 alpha to match 'even' items in MomentsContainer
                        const tileColor = alpha(momentBaseColor, 0.95);
                        const hoverColor = alpha(momentBaseColor, 0.90);
                        
                        return (
                            <Box
                                sx={{
                                    position: 'relative',
                                    width: '100%',
                                    height: '100%',
                                    
                                    // Match moment tile styling
                                    bgcolor: tileColor,
                                    backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)`,
                                    
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    px: 0.5,
                                    boxSizing: 'border-box',
                                    backgroundBlendMode: 'screen',
                                    transition: 'all 0.15s ease-out',
                                    cursor: readOnly ? 'default' : 'pointer',
                                    
                                    "&:hover": readOnly ? {} : {
                                        bgcolor: hoverColor,
                                        zIndex: 10,
                                        boxShadow: '0 0 0 1px rgba(123, 97, 255, 0.7), 0 0 14px rgba(123, 97, 255, 0.55)',
                                        outline: '1px solid rgba(123, 97, 255, 0.35)',
                                    },
                                }}
                            >
                                {sceneWidth > 60 && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontSize: '0.65rem',
                                            color: 'rgba(255, 255, 255, 0.95)',
                                            fontWeight: 500,
                                            textAlign: 'center',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            pointerEvents: 'none',
                                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                        }}
                                    >
                                        {scene.name || 'Music'}
                                    </Typography>
                                )}
                            </Box>
                        );
                     })()
                )}

                {/* Duration indicator for simple scenes (Not moments) */}
                {!isMomentsContainer && !showText && sceneWidth > 25 && (
                     <Typography
                         variant="caption"
                         sx={{
                             color: "rgba(255, 255, 255, 0.9)",
                             fontSize: "0.6rem",
                             lineHeight: 1,
                             textAlign: "center",
                             width: '100%',
                             zIndex: 5
                         }}
                     >
                         {formatTime(scene.duration)}
                     </Typography>
                )}

            </Box>

            {/* Scene Controls Overlay (Add Moment, Drag, Delete) - Visible on Hover */}
            { !readOnly && (
                <SceneActions scene={scene} onDelete={onDelete} />
            )}

            {/* Moment Editor Popover */}
            <MomentEditor
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                moment={editingMoment}
                trackLabel={selectedTrackLabel || undefined}
                trackKey={selectedCoverageKey || undefined}
                allTracks={allTracks}
                sceneRecordingSetup={(scene as TimelineScene & { recording_setup?: unknown }).recording_setup || null}
                onUpsertRecordingSetup={handleMomentRecordingSetupSave}
                onSave={handleSaveMoment}
            />

            <Dialog
                open={infoOpen}
                onClose={handleCloseInfo}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: "#141416",
                        backgroundImage: "none",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 3,
                        p: 0,
                    },
                }}
            >
                <DialogTitle sx={{ color: "white", fontWeight: 700, px: 3, pt: 2.5, pb: 1 }}>
                    Recording Setup
                </DialogTitle>
                <DialogContent sx={{ px: 3, pb: 2.5 }}>
                    {infoMoment && (
                        <Stack spacing={2.5}>
                            <Box>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", textTransform: "uppercase", fontWeight: 700, display: "block", mb: 0.75 }}>
                                    Moment
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.92)", fontWeight: 600, fontSize: "0.95rem" }}>
                                    {infoMoment.name || "Untitled Moment"}
                                </Typography>
                                {(trackName || trackType) && (
                                    <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.75rem", mt: 0.5 }}>
                                        Track: {trackName || trackType}
                                    </Typography>
                                )}
                            </Box>

                            <Box sx={{ height: 1, bgcolor: "rgba(255,255,255,0.06)", borderRadius: 999 }} />

                            {(() => {
                                if (infoSetupLoading || infoSceneSetupLoading) {
                                    return (
                                        <Box>
                                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", textTransform: "uppercase", fontWeight: 700, display: "block", mb: 0.75 }}>
                                                Assignments
                                            </Typography>
                                            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>
                                                Loading recording setup…
                                            </Typography>
                                        </Box>
                                    );
                                }

                                const setup = infoRecordingSetup || infoSceneRecordingSetup;
                                const normalizeTrackType = (trackType || "").toString().toLowerCase();
                                const isGraphicsTrack = normalizeTrackType === "graphics";
                                const isAudioTrack = ["audio", "music"].includes(normalizeTrackType);
                                const isVideoTrack = normalizeTrackType === "video";
                                const isSetupEmpty = !setup;
                                const setupScope = infoRecordingSetup ? "moment" : (infoSceneRecordingSetup ? "scene" : "none");
                                
                                let content = null;

                                if (isGraphicsTrack) {
                                    // Graphics tracks are always active if they exist as momentary blocks
                                    content = (
                                         <Box>
                                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", textTransform: "uppercase", fontWeight: 700, display: "block", mb: 0.75 }}>
                                                Graphics Status
                                            </Typography>
                                            <Chip
                                                label="Active"
                                                size="small"
                                                sx={{ bgcolor: "rgba(236,72,153,0.18)", color: "white" }}
                                            />
                                        </Box>
                                    );
                                } else if (isVideoTrack) {
                                    // Check if THIS track is assigned in the setup
                                    // If setup is empty (default state), we assume implicit assignment (matches visual rendering)
                                    const isAssigned = isSetupEmpty || (setup?.camera_assignments || []).some((a: any) => a.track_id === trackId);
                                    
                                    content = (
                                        <Box>
                                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", textTransform: "uppercase", fontWeight: 700, display: "block", mb: 0.75 }}>
                                                Camera Status
                                            </Typography>
                                            <Chip 
                                                label={isAssigned ? "Recording Enabled" : "Not Recording"} 
                                                size="small" 
                                                sx={{ 
                                                    bgcolor: isAssigned ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.08)", 
                                                    color: isAssigned ? "white" : "rgba(255,255,255,0.5)" 
                                                }} 
                                            />
                                        </Box>
                                    );
                                } else if (isAudioTrack) {
                                    // Check if THIS track is in the audio list
                                    // If setup is empty, we assume implicit assignment for all audio tracks
                                    const isEnabled = isSetupEmpty || (setup?.audio_track_ids || []).includes(trackId);
                                    
                                    content = (
                                        <Box>
                                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", textTransform: "uppercase", fontWeight: 700, display: "block", mb: 0.75 }}>
                                                Audio Status
                                            </Typography>
                                            <Chip 
                                                label={isEnabled ? "Quick Mix Enabled" : "Muted"} 
                                                size="small" 
                                                sx={{ 
                                                    bgcolor: isEnabled ? "rgba(80,200,120,0.18)" : "rgba(255,255,255,0.08)", 
                                                    color: isEnabled ? "white" : "rgba(255,255,255,0.5)" 
                                                }} 
                                            />
                                        </Box>
                                    );
                                } else {
                                    content = (
                                        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>
                                            No configuration available for this track type.
                                        </Typography>
                                    );
                                }

                                return (
                                    <Stack spacing={2}>
                                        {setupScope === "scene" && (
                                            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem" }}>
                                                Using scene default
                                            </Typography>
                                        )}
                                        {content}
                                    </Stack>
                                );
                            })()}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
                    <Button onClick={handleCloseInfo} variant="contained" sx={{ textTransform: "none" }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default React.memo(SceneBlock);
