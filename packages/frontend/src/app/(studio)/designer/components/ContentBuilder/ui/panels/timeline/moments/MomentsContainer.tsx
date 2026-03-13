"use client";

import React from 'react';

import { Box, Typography } from "@mui/material";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import { alpha, lighten } from "@mui/material/styles";
import { getDefaultTrackColor } from "../../../../utils/colorUtils";
import { TimelineScene } from "@/lib/types/timeline";
import { isLogEnabled } from "@/lib/debug/log-flags";
import { useContentBuilder } from "../../../../context/ContentBuilderContext";

interface MomentsContainerProps {
    scene: TimelineScene;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    moments: any[];
    trackId?: number;
    trackType?: string;
    trackName?: string;
    readOnly?: boolean;
    hoveredMomentId?: number | null;
    sceneWidth?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onMomentInfoClick: (e: React.MouseEvent<HTMLElement>, moment: any) => void;
}

export const MomentsContainer: React.FC<MomentsContainerProps> = ({
    scene,
    moments,
    trackId,
    trackType,
    trackName,
    readOnly,
    hoveredMomentId,
    sceneWidth,
    onMomentInfoClick,
}) => {
    const { packageSubjects, sceneActivityCrewMap } = useContentBuilder();
    const shouldLog = isLogEnabled("moments");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isMomentsContainer = (scene as any).database_type === 'MOMENTS_CONTAINER';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mediaComponents = (scene as any).media_components || [];

    if (!isMomentsContainer || moments.length === 0) return null;

    // Check if this is exclusively a music track
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isMusicTrack = mediaComponents.some((c: any) => c.media_type === 'MUSIC');

    // Use the scene's full duration as the denominator so moments occupy
    // their real proportion of the scene, leaving gaps for unfilmed time.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalMomentsDuration = moments.reduce((sum: number, m: any) => {
        return sum + (m.duration || m.duration_seconds || 0);
    }, 0);

    if (totalMomentsDuration === 0) return null;

    const sceneDuration = scene.duration || totalMomentsDuration;

    const rawTrackType = (trackType || scene.scene_type || 'video').toString();
    const normalizedTrackType = rawTrackType.toUpperCase();
    const trackBaseColor = getDefaultTrackColor(rawTrackType);
    const isMusicTrackType = normalizedTrackType === 'MUSIC';
    const sceneMusic = (scene as any).scene_music || (scene as any).music || null;
    const hasSceneMusic = !!sceneMusic;
    
    const momentBaseColor = lighten(trackBaseColor, 0.35);
    const momentHoverColor = alpha(momentBaseColor, 0.9);

    const formatShotLabel = (value?: string | null) => {
        if (!value) return "";
        const map: Record<string, string> = {
            ESTABLISHING_SHOT: "EST",
            WIDE_SHOT: "WS",
            MEDIUM_SHOT: "MS",
            TWO_SHOT: "TS",
            CLOSE_UP: "CU",
            EXTREME_CLOSE_UP: "ECU",
            DETAIL_SHOT: "DET",
            REACTION_SHOT: "RXN",
            OVER_SHOULDER: "OS",
            CUTAWAY: "CA",
            INSERT_SHOT: "INS",
            MASTER_SHOT: "MST",
        };
        return map[value] || value;
    };

    const formatGraphicsTitle = (value?: string | null) => {
        if (!value) return "";
        return value
            .replace(/[_-]+/g, " ")
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    // Calculate cumulative positions for moments using scene duration
    // so they occupy their real time proportion with gaps between them.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cumulativePercent = 0;
    const momentPositions = moments.map((moment: any) => {
        const momentDuration = moment.duration || moment.duration_seconds || 0;
        const widthPercent = (momentDuration / sceneDuration) * 100;
        const leftPercent = cumulativePercent;
        cumulativePercent += widthPercent;
        // Use actual pixel width for label thresholds so zoom level is respected.
        // Falls back to a width-percent heuristic if sceneWidth is not yet known.
        const blockPx = sceneWidth ? (widthPercent / 100) * sceneWidth : widthPercent * 6;
        return { moment, widthPercent, leftPercent, blockPx };
    });

    return (
        <Box
            className="moments-container"
            sx={{
                position: 'absolute',
                top: 1, // Slight inset
                left: 0, // Starts from edge of content area (which is offset by header)
                right: 0,
                bottom: 1,
                display: 'block',
                pointerEvents: 'none',
                borderRadius: 1,
                backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(255,255,255,0.015) 3px, rgba(255,255,255,0.015) 4px)',
            }}
        >
            {isMusicTrackType && hasSceneMusic && (
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        bgcolor: alpha(trackBaseColor, 0.45),
                        backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)',
                        borderRadius: 1,
                        border: '1px solid rgba(255,255,255,0.12)',
                        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                        pointerEvents: 'none',
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            pointerEvents: 'none',
                        }}
                    >
                        {sceneMusic?.music_name || 'Scene Music'}
                    </Typography>
                </Box>
            )}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {momentPositions.map(({ moment, widthPercent, leftPercent, blockPx }: any, idx: number) => {
                const momentDuration = moment.duration || moment.duration_seconds || 0;
                const isHovered = hoveredMomentId === moment.id;
                // Recording setup assignments (Option A)
                const fallbackRecordingSetup = moment.recording_setup || (scene as any).recording_setup;
                const momentSubjects = (moment.subjects || []) as Array<{
                    subject_id: number;
                    subject?: { 
                        name?: string | null;
                        role?: {
                            role_name?: string | null;
                        } | null;
                    } | null;
                }>;
                
                const momentMusic = (moment as any).moment_music || moment.music || null;
                const momentOverridesScene = !!momentMusic && (momentMusic.overrides_scene_music ?? true);

                let showContent = false;
                if (isMusicTrackType) {
                    if (hasSceneMusic) {
                        showContent = !!momentMusic && momentOverridesScene;
                    } else {
                        showContent = !!momentMusic;
                    }
                } else if (fallbackRecordingSetup) {
                    const recording = fallbackRecordingSetup as {
                        camera_assignments?: Array<{ track_id: number }>;
                        camera_track_ids?: number[];
                        audio_track_ids?: number[];
                        graphics_enabled?: boolean;
                        graphics_title?: string | null;
                    };
                    const cameraAssignments = (recording.camera_assignments?.length ? recording.camera_assignments : undefined)
                        || (recording.camera_track_ids || []).map((id) => ({ track_id: id }));
                    const audioTrackIds = recording.audio_track_ids || [];
                    const graphicsEnabled = !!recording.graphics_enabled;

                    const isVideoTrack = normalizedTrackType === 'VIDEO';
                    const isAudioTrack = normalizedTrackType === 'AUDIO';
                    const isGraphicsTrack = normalizedTrackType === 'GRAPHICS';

                    if (isVideoTrack && trackId) {
                        showContent = cameraAssignments.some((a: any) => a.track_id === trackId);
                    } else if (isAudioTrack && trackId) {
                        showContent = audioTrackIds.includes(trackId);
                    } else if (isGraphicsTrack) {
                        showContent = graphicsEnabled;
                    }

                    if (typeof window !== "undefined" && (window as any).__debugMomentId === moment.id) {
                        console.info("[MOMENT] Visibility check", {
                            momentId: moment.id,
                            trackId,
                            trackType: normalizedTrackType,
                            camera_assignments: cameraAssignments.map((a) => a.track_id),
                            audio_track_ids: audioTrackIds,
                            graphics_enabled: graphicsEnabled,
                            showContent,
                        });
                    }
                } else {
                    // Default: if no recording setup exists yet, show on video/audio tracks only.
                    // Graphics tracks are excluded by default — users opt-in via recording setup.
                    showContent = ['VIDEO', 'AUDIO'].includes(normalizedTrackType);
                    if (typeof window !== "undefined" && (window as any).__debugMomentId === moment.id) {
                        console.info("[MOMENT] Visibility check - no setup", {
                            momentId: moment.id,
                            trackId,
                            trackType: normalizedTrackType,
                            showContent,
                            momentRecordingSetup: (moment as any)?.recording_setup,
                            sceneRecordingSetup: (scene as any)?.recording_setup,
                        });
                    }
                }
                
                // Equipment-first: all tracks with equipment show content.
                // Activity-aware filtering removed — recording_setup controls visibility.

                // Music fallback logic if coverage not defined
                if (!showContent && isMusicTrack) {
                    const hasMusic = momentMusic && (momentMusic.music_type !== 'NONE' || momentMusic.music_name);
                    showContent = !!hasMusic;
                }



                if (!showContent) {
                        // Spacer
                        return (
                        <Box 
                            key={`moment-spacer-${moment.id || idx}`}
                            sx={{
                                position: 'absolute',
                                left: `${leftPercent}%`,
                                width: `${widthPercent}%`,
                                height: '100%',
                                top: 0,
                                pointerEvents: 'none', 
                                bgcolor: isHovered ? 'rgba(123, 97, 255, 0.14)' : 'transparent',
                                boxShadow: isHovered ? 'inset 0 0 0 1px rgba(123, 97, 255, 0.5), inset 0 0 16px rgba(123, 97, 255, 0.2)' : 'none',
                            }}
                        />
                        );
                }

                const assignmentForTrack = (() => {
                    if (!trackId || !moment.recording_setup) return null;
                    const recording = moment.recording_setup as {
                        camera_assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: string | null }>;
                        graphics_title?: string | null;
                    };
                    return recording.camera_assignments?.find((a) => a.track_id === trackId) || null;
                })();

                const assignedSubjectIds = assignmentForTrack?.subject_ids || [];
                const shotLabel = formatShotLabel(assignmentForTrack?.shot_type);

                const assignedSubjectNames = assignedSubjectIds.length > 0
                    ? assignedSubjectIds
                        .map((id) => {
                             // Try package subjects first (PackageEventDaySubject.id)
                             const pkg = (packageSubjects || []).find((s: any) => s.id === id);
                             if (pkg) return pkg.name;
                             // Fallback to old moment subjects (Subject.id via MomentSubject)
                             const ms = momentSubjects.find((item) => item.subject_id === id);
                             return ms?.subject?.role?.role_name || ms?.subject?.name;
                        })
                        .filter(Boolean)
                    : [];

                if (typeof window !== "undefined" && (window as any).__debugMomentRoles) {
                    console.info("[MOMENT][DEBUG] Track label mapping", {
                        sceneId: scene.id,
                        momentId: moment.id,
                        trackId,
                        trackName,
                        normalizedTrackType,
                        assignedSubjectIds,
                        assignedSubjectNames,
                        subjectsCount: momentSubjects.length,
                        firstSubject: momentSubjects[0],
                        firstSubjectRole: momentSubjects[0]?.subject?.role,
                        firstSubjectRoleName: momentSubjects[0]?.subject?.role?.role_name,
                        assignmentForTrack,
                    });
                }

                const subjectLabel = assignedSubjectNames.length > 0
                    ? assignedSubjectNames.join(", ")
                    : "";
                const hasShot = !!shotLabel;
                const hasSubjects = !!subjectLabel;
                const strongLabel = hasShot && hasSubjects
                    ? `${shotLabel} • ${subjectLabel}`
                    : (shotLabel || subjectLabel);
                const graphicsTitle = typeof (moment.recording_setup as any)?.graphics_title === 'string'
                    ? formatGraphicsTitle((moment.recording_setup as any).graphics_title)
                    : "";
                const isGraphicsTrack = normalizedTrackType === 'GRAPHICS';
                const graphicsLabel = isGraphicsTrack ? graphicsTitle : "";
                const displayLabel = graphicsLabel || strongLabel;

                // Stronger variation for distinction
                const isEven = idx % 2 === 0;
                const tileColor = isEven 
                    ? alpha(momentBaseColor, 0.95)
                    : alpha(momentBaseColor, 0.85);

                return (
                        <Box
                            key={`moment-${moment.id || idx}`}
                            onClick={(e) => {
                                if (shouldLog) {
                                    console.info("[MOMENT] Open editor", {
                                        momentId: moment.id,
                                        momentName: moment.name,
                                        sceneId: scene.id,
                                        trackName,
                                    });
                                }
                                onMomentInfoClick(e, moment);
                            }}
                            sx={{
                                position: 'absolute',
                                left: `${leftPercent}%`,
                                top: 0,
                                width: `${widthPercent}%`,
                                height: '100%',
                                minWidth: 4, 
                                
                                // Visual Styling
                                bgcolor: tileColor,
                                backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)`,
                                
                                boxSizing: 'border-box',
                                borderRight: idx < moments.length - 1 ? `1px solid rgba(0,0,0,0.5)` : 'none',
                                
                                borderRadius: 1, 
                                transition: 'all 0.15s ease-out',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 2, 
                                pointerEvents: 'auto', 
                                cursor: readOnly ? 'default' : 'pointer',
                                userSelect: 'none',
                                boxShadow: isHovered ? '0 0 0 1px rgba(123, 97, 255, 0.7), 0 0 14px rgba(123, 97, 255, 0.55)' : 'none',
                                backgroundBlendMode: 'screen',
                                outline: isHovered ? '1px solid rgba(123, 97, 255, 0.35)' : 'none',

                                '&:hover': {
                                    bgcolor: momentHoverColor,
                                    zIndex: 10,
                                    '& .moment-label-text': { opacity: 1 },
                                    '& .remove-btn': { opacity: 1 }
                                },
                            }}
                        >
                            {/* ── Graphics track label ─────────────────────────────── */}
                            {blockPx > 30 && graphicsLabel && (
                                <Box
                                    className="moment-label-text"
                                    sx={{
                                        display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                        fontSize: '0.65rem', color: 'rgba(255,255,255,0.95)', fontWeight: 500,
                                        overflow: 'hidden', whiteSpace: 'nowrap', px: 0.5, pointerEvents: 'none',
                                        opacity: isHovered ? 1 : 0.95,
                                    }}
                                >
                                    <PaletteOutlinedIcon sx={{ fontSize: '0.75rem', color: 'white', flexShrink: 0 }} />
                                    {blockPx > 50 && (
                                        <Typography variant="caption" sx={{ color: 'inherit', fontSize: '0.65rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {graphicsLabel}
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {/* ── Camera / Audio track label — progressive degradation ── */}
                            {!graphicsLabel && displayLabel && (() => {
                                // Full: shot icon + shot + person icon + subjects
                                if (blockPx > 60) {
                                    return (
                                        <Box
                                            className="moment-label-text"
                                            sx={{
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                gap: 0.75, fontSize: '0.65rem', color: 'rgba(255,255,255,0.95)',
                                                fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap',
                                                px: 0.5, pointerEvents: 'none', opacity: isHovered ? 1 : 0.95,
                                            }}
                                        >
                                            {hasShot && (
                                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                                    <CameraAltOutlinedIcon sx={{ fontSize: '0.75rem', color: 'white', flexShrink: 0 }} />
                                                    <Typography variant="caption" sx={{ color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit' }}>{shotLabel}</Typography>
                                                </Box>
                                            )}
                                            {hasSubjects && (
                                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                                    <PersonOutlineIcon sx={{ fontSize: '0.75rem', color: 'white', flexShrink: 0 }} />
                                                    <Typography variant="caption" sx={{ color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit' }}>{subjectLabel}</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                }
                                // Medium: shot icon + shot only (drop subjects)
                                if (blockPx > 35 && hasShot) {
                                    return (
                                        <Box
                                            className="moment-label-text"
                                            sx={{
                                                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                                fontSize: '0.65rem', color: 'rgba(255,255,255,0.95)',
                                                fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap',
                                                px: 0.5, pointerEvents: 'none', opacity: isHovered ? 1 : 0.95,
                                            }}
                                        >
                                            <CameraAltOutlinedIcon sx={{ fontSize: '0.7rem', color: 'white', flexShrink: 0 }} />
                                            <Typography variant="caption" sx={{ color: 'inherit', fontSize: '0.6rem', fontWeight: 600 }}>{shotLabel}</Typography>
                                        </Box>
                                    );
                                }
                                // Small: just shot text, no icon
                                if (blockPx > 18 && hasShot) {
                                    return (
                                        <Typography
                                            className="moment-label-text"
                                            variant="caption"
                                            sx={{
                                                fontSize: '0.58rem', color: 'rgba(255,255,255,0.9)', fontWeight: 700,
                                                overflow: 'hidden', whiteSpace: 'nowrap', px: 0.25, pointerEvents: 'none',
                                                opacity: isHovered ? 1 : 0.9, letterSpacing: '-0.01em',
                                            }}
                                        >
                                            {shotLabel}
                                        </Typography>
                                    );
                                }
                                // Subjects-only fallback (no shot set, only subjects)
                                if (blockPx > 50 && hasSubjects) {
                                    return (
                                        <Box
                                            className="moment-label-text"
                                            sx={{
                                                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                                fontSize: '0.65rem', color: 'rgba(255,255,255,0.95)',
                                                fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap',
                                                px: 0.5, pointerEvents: 'none', opacity: isHovered ? 1 : 0.95,
                                            }}
                                        >
                                            <PersonOutlineIcon sx={{ fontSize: '0.7rem', color: 'white', flexShrink: 0 }} />
                                            {blockPx > 60 && (
                                                <Typography variant="caption" sx={{ color: 'inherit', fontSize: '0.65rem' }}>{subjectLabel}</Typography>
                                            )}
                                        </Box>
                                    );
                                }
                                return null;
                            })()}

                            {/* ── Fallback: moment name when no recording setup ────── */}
                            {!displayLabel && !graphicsLabel && blockPx > 45 && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontSize: '0.63rem',
                                        color: 'rgba(255, 255, 255, 0.85)',
                                        fontWeight: 500,
                                        textAlign: 'center',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        pointerEvents: 'none',
                                        opacity: isHovered ? 1 : 0.75,
                                        transition: 'opacity 0.15s ease-out',
                                        px: 0.5,
                                    }}
                                >
                                    {moment.name}
                                </Typography>
                            )}

                        </Box>
                );
            })}

            {/* ── Gap zone: diagonal stripes for unplanned time ─── */}
            {cumulativePercent < 99 && (
                <Box
                    sx={{
                        position: 'absolute',
                        left: `${cumulativePercent}%`,
                        top: 0,
                        width: `${100 - cumulativePercent}%`,
                        height: '100%',
                        pointerEvents: 'none',
                        borderRadius: 1,
                        backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(123, 97, 255, 0.03) 3px, rgba(123, 97, 255, 0.03) 4px)',
                    }}
                />
            )}
        </Box>
    );
};
