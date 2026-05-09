import React, { useMemo, useCallback, useState } from 'react';
import { PlaybackScreenProps } from '@/features/content/content-builder/types/timeline';
import { Box, Typography, Divider, IconButton, Tooltip, CircularProgress } from '@mui/material';
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import MicOutlinedIcon from "@mui/icons-material/MicOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import MusicNoteOutlinedIcon from "@mui/icons-material/MusicNoteOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useContentBuilder } from "../../context/ContentBuilderContext";
import { getEquipmentShortLabelForTrackName } from "@/features/content/films/utils/equipmentAssignments";
import { ShotPreviewOverlay } from "@/features/content/shot-previews/components/ShotPreviewOverlay";
import { useGenerateShotPreview } from "@/features/content/shot-previews/hooks/useShotPreviews";

/**
 * PlaybackScreen Component
 * 
 * Displays dynamically as you scrub through the timeline:
 * - Scene name
 * - Current moment and its details
 * - Coverage assignments split by type (Video, Audio, Music)
 */
export const PlaybackScreen: React.FC<PlaybackScreenProps> = ({
    currentScene = null,
    totalDuration,
    currentTime,
    className = '',
    tracks = [],
    showControlnetGuide = false,
    showSpatialOverlay = false,
    showSpatialGrid = true,
}) => {
    const { equipmentAssignmentsBySlot, packageSubjects, packageLocations, linkedActivityId, filmId, instanceOwnerType, setSelectedCameraId, setSelectedCameraSubjectIds, setCameraSubjectsByCamNum, setCameraVisibleSubjectsByCamNum } = useContentBuilder();

    // SD preview generation (triggered per-card via sparkle button)
    const generateShotPreview = useGenerateShotPreview();
    const [generatingIds, setGeneratingIds] = useState<Set<number>>(new Set());

    const handleGeneratePreview = useCallback(async (assignmentId: number) => {
        if (!filmId || !assignmentId) return;
        setGeneratingIds(prev => new Set(prev).add(assignmentId));
        try {
            await generateShotPreview.mutateAsync({
                camera_assignment_id: assignmentId,
                film_id: typeof filmId === 'string' ? parseInt(filmId, 10) : filmId,
            });
        } catch (err) {
            console.error('[PlaybackScreen] SD preview generation failed', err);
        } finally {
            setGeneratingIds(prev => {
                const next = new Set(prev);
                next.delete(assignmentId);
                return next;
            });
        }
    }, [filmId, generateShotPreview]);

    // Track which camera frame is expanded for larger view
    const [expandedCameraId, setExpandedCameraId] = useState<number | null>(null);

    const formatShotLabel = (value?: string | null) => {
        if (!value) return "";
        const map: Record<string, string> = {
            EXTREME_CLOSE_UP: "ECU",
            CLOSE_UP: "CU",
            MEDIUM_CLOSE_UP: "MCU",
            MEDIUM_SHOT: "MS",
            MEDIUM_WIDE_SHOT: "MWS",
            WIDE_SHOT: "WS",
            EXTREME_WIDE_SHOT: "EWS",
            ESTABLISHING_SHOT: "EST",
            DETAIL_SHOT: "DET",
            INSERT_SHOT: "INS",
            MASTER_SHOT: "MST",
            TWO_SHOT: "TS",
            REACTION_SHOT: "RXN",
            OVER_SHOULDER: "OTS",
            CUTAWAY: "CA",
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

    const getShotProfile = (shotType?: string | null) => {
        if (!shotType) return { scale: 1, yOffset: 0, label: 'Full' };
        
        // Normalize shot type
        const type = shotType.toString().toUpperCase().replace(/_/g, ' ');
        
        // Purpose-built mappings for both editorial shot names and camera-size labels
        if (type.includes('EXTREME CLOSE')) return { scale: 6.5, yOffset: 35, label: 'ECU' };
        if (type.includes('DETAIL')) return { scale: 5.2, yOffset: 30, label: 'DET' };
        if (type.includes('INSERT')) return { scale: 5.6, yOffset: 32, label: 'INS' };
        if (type.includes('REACTION')) return { scale: 3.6, yOffset: 18, label: 'RXN' };
        if (type.includes('MEDIUM CLOSE')) return { scale: 2.8, yOffset: 15, label: 'MCU' };
        if (type.includes('OVER SHOULDER')) return { scale: 2.3, yOffset: 14, label: 'OTS' };
        if (type.includes('CLOSE')) return { scale: 4.2, yOffset: 25, label: 'CU' };
        if (type.includes('TWO SHOT')) return { scale: 1.35, yOffset: 6, label: 'TS' };
        if (type.includes('MEDIUM WIDE')) return { scale: 1.2, yOffset: 5, label: 'MWS' };
        if (type.includes('MEDIUM')) return { scale: 1.9, yOffset: 10, label: 'MS' };
        if (type.includes('MASTER')) return { scale: 0.7, yOffset: 0, label: 'MST' };
        if (type.includes('ESTABLISHING')) return { scale: 0.38, yOffset: 0, label: 'EST' };
        if (type.includes('EXTREME WIDE')) return { scale: 0.25, yOffset: 0, label: 'EWS' };
        if (type.includes('CUTAWAY')) return { scale: 1.4, yOffset: 8, label: 'CA' };
        if (type.includes('WIDE')) return { scale: 0.55, yOffset: 0, label: 'WS' };
        if (type.includes('FULL')) return { scale: 0.85, yOffset: 0, label: 'WS' };
        
        // Default
        return { scale: 0.85, yOffset: 0, label: shotType };
    };

    const getSubjectLayout = (count: number, scale: number) => {
        // Base spacing logic based on shot scale (zoom level)
        // As we zoom in (scale up), subjects need to be closer together to fit in frame
        const spread = scale > 2 ? 15 : scale > 1 ? 25 : 40; // Percent spread from center
        
        if (count <= 1) return [{ x: 50 }];
        if (count === 2) return [{ x: 50 - spread/2 }, { x: 50 + spread/2 }];
        // For > 2, we just evenly distribute for the "basic silhouette" view
        if (count === 3) return [{ x: 25 }, { x: 50 }, { x: 75 }];
        return [{ x: 20 }, { x: 40 }, { x: 60 }, { x: 80 }];
    };

    // Calculate current moment based on currentTime
    const { moment, sceneName } = useMemo(() => {
        if (!currentScene) return { moment: null, sceneName: '' };

        const originalScene = (currentScene as any).original_scene || currentScene;
        const moments = originalScene.moments || [];

        if (moments.length === 0) return { moment: null, sceneName: currentScene?.name || '' };

        // Normalize currentTime relative to the scene's start time
        const relativeTime = currentTime - (currentScene.start_time || 0);

        // Calculate which moment is active based on relativeTime
        let cumulativeTime = 0;
        for (const m of moments) {
            const momentDuration = m.duration || m.duration_seconds || 0;
            if (relativeTime >= cumulativeTime && relativeTime < cumulativeTime + momentDuration) {
                return { moment: m, sceneName: currentScene?.name || '' };
            }
            cumulativeTime += momentDuration;
        }

        // If past all moments, show the last one
        return { moment: moments[moments.length - 1], sceneName: currentScene?.name || '' };
    }, [currentScene, currentTime]);

    const recordingSetup = (moment as any)?.recording_setup || (currentScene as any)?.recording_setup || null;

    const momentSubjects = ((moment as any)?.subjects || []) as Array<{
        subject_id: number;
        subject?: { name?: string | null } | null;
    }>;
    // Build location label from package location slots (numbered slot system)
    // When linkedActivityId is set, filter to that activity's slots; otherwise show all assigned
    const packageLocationName = React.useMemo(() => {
        if (!packageLocations || packageLocations.length === 0) return '';
        const activitySlots = linkedActivityId
            ? packageLocations.filter((s: any) =>
                (s.activity_assignments || []).some((a: any) => a.package_activity_id === linkedActivityId)
              )
            : packageLocations;
        if (activitySlots.length === 0) return '';
        const slot = activitySlots[0] as any;
        const num = slot.location_number;
        const actName = (slot.activity_assignments || [])
            .find((a: any) => !linkedActivityId || a.package_activity_id === linkedActivityId)
            ?.package_activity?.name;
        return actName ? `Location ${num} \u2013 ${actName}` : `Location ${num}`;
    }, [packageLocations, linkedActivityId]);

    // Extract space name + ID from the location slot's space_slots (returned nested by backend)
    const spaceInfo = React.useMemo(() => {
        if (!packageLocations || packageLocations.length === 0) return { name: '', id: undefined as number | undefined };
        const activitySlots = linkedActivityId
            ? packageLocations.filter((s: any) =>
                (s.activity_assignments || []).some((a: any) => a.package_activity_id === linkedActivityId)
              )
            : packageLocations;
        if (activitySlots.length === 0) return { name: '', id: undefined };
        const slot = activitySlots[0] as any;
        const spaces: any[] = slot.space_slots || [];
        if (spaces.length === 0) return { name: '', id: undefined };
        // If we have a linked activity, find the space assigned to that activity
        if (linkedActivityId) {
            const matched = spaces.find((sp: any) =>
                (sp.activity_assignments || []).some((a: any) => a.package_activity_id === linkedActivityId)
            );
            const sp = matched || spaces[0];
            return { name: sp?.label || '', id: sp?.id as number | undefined };
        }
        return { name: spaces[0]?.label || '', id: spaces[0]?.id as number | undefined };
    }, [packageLocations, linkedActivityId]);
    const spaceName = spaceInfo.name;
    const spaceSlotId = spaceInfo.id;

    const locationName = packageLocationName ||
        (moment as any)?.location?.name ||
        (moment as any)?.location_name ||
        (currentScene as any)?.location?.name ||
        (currentScene as any)?.location_name ||
        '';
    const sceneOrderIndex = typeof (currentScene as any)?.order_index === "number" ? (currentScene as any).order_index : undefined;
    const sceneLabel = typeof sceneOrderIndex === "number" ? `Scene ${sceneOrderIndex + 1}` : "Scene";

    const cameraAssignments = (recordingSetup?.camera_assignments || []) as Array<{
        id?: number;
        track_id: number;
        track_name?: string;
        track_type?: string;
        subject_ids?: number[];
        visible_subject_ids?: number[];
        shot_type?: string | null;
    }>;
    const audioTrackIds = (recordingSetup?.audio_track_ids || []) as number[];
    const graphicsEnabled = !!recordingSetup?.graphics_enabled;
    const graphicsTitle = formatGraphicsTitle(recordingSetup?.graphics_title);

    const getTrackName = (trackId: number, fallback?: string) => {
        const track = tracks.find((t) => t.id === trackId);
        const baseName = track?.name || fallback || `Track ${trackId}`;
        const trackType = track?.track_type?.toString().toLowerCase();
        const shouldShowEquipment = trackType === "video" || trackType === "audio";
        const equipmentLabel = shouldShowEquipment
            ? getEquipmentShortLabelForTrackName(baseName, equipmentAssignmentsBySlot)
            : "";
        return equipmentLabel ? `${baseName} · ${equipmentLabel}` : baseName;
    };

    const buildSubjectLabel = (subjectIds?: number[]) => {
        const names = (subjectIds || [])
            .map((id) => {
                // Try inherited/package subjects first (PackageEventDaySubject.id)
                const pkg = (packageSubjects || []).find((s: any) => s.id === id);
                if (pkg) return pkg.name;
                // Fallback to old moment subjects (Subject.id via MomentSubject)
                const ms = momentSubjects.find((item) => item.subject_id === id);
                return ms?.subject?.name;
            })
            .filter(Boolean);
        return names.length ? names.join(", ") : "";
    };

    // Equipment-first: show all tracks from recording_setup, no activity crew filtering.

    const videoCards = cameraAssignments
        .filter((assignment) => {
            // Skip disabled cameras (toggled off in MomentPanel but data preserved)
            if ((assignment as any).enabled === false) return false;
            const trackType = assignment.track_type?.toString().toLowerCase();
            if (trackType && trackType !== "video") return false;
            // Exclude audio tracks that ended up in camera_assignments for subject storage
            if (audioTrackIds.includes(assignment.track_id)) return false;
            return true;
        })
        .map((assignment) => {
            const rawLabel = getTrackName(assignment.track_id, assignment.track_name);
            const [trackLabel, equipmentLabel] = rawLabel.split(" · ");
            const shortLabel = trackLabel.replace(/Camera/i, "Cam");
            const label = equipmentLabel ? `${shortLabel} · ${equipmentLabel}` : shortLabel;
            return {
                id: assignment.track_id,
                assignmentId: assignment.id,
                label: label,
                shot: formatShotLabel(assignment.shot_type),
                shotType: assignment.shot_type,
                subjects: buildSubjectLabel(assignment.subject_ids),
                subjectIds: assignment.subject_ids || [],
                visibleSubjectIds: assignment.visible_subject_ids || [],
            };
        })
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

    const audioCards = audioTrackIds
        .map((trackId) => {
            const assignment = cameraAssignments.find((entry) => entry.track_id === trackId);
            return {
                id: trackId,
                label: getTrackName(trackId, assignment?.track_name),
                subjects: buildSubjectLabel(assignment?.subject_ids),
            };
        });

    const cameraGridColumns =
        videoCards.length <= 1
            ? 1
            : videoCards.length <= 2
                ? 2
                : videoCards.length <= 4
                    ? 2
                    : 3;
    const cameraRowCount = Math.ceil(videoCards.length / cameraGridColumns);
    const isCompactCameraLayout = cameraRowCount > 1;
    const cameraCardAspectRatio = '16 / 9';
    const storyboardGap = isCompactCameraLayout ? 1.5 : 2.5;
    const cameraSectionMaxWidth =
        videoCards.length <= 1
            ? 620
            : videoCards.length <= 2
                ? 860
                : cameraGridColumns === 2
                    ? 700
                    : 900;
    const cameraCardFlexBasis =
        videoCards.length <= 1
            ? 'min(100%, 560px)'
            : cameraGridColumns === 2
                ? 'calc((100% - 12px) / 2)'
                : 'calc((100% - 24px) / 3)';

    const momentMusic = (moment as any)?.moment_music || (moment as any)?.music || null;
    const sceneMusic = (currentScene as any)?.scene_music || null;
    const musicSource = momentMusic || sceneMusic || null;

    const graphicsCards = graphicsEnabled ? [{ id: 'gfx', title: graphicsTitle, subtitle: 'Overlay' }] : [];
    const musicCards = musicSource ? [{ id: 'music', trackName: musicSource.music_name || 'Untitled', artist: musicSource.artist }] : [];

    // Publish camera → subject mapping to context so floor plan can resolve clicks.
    // Keyed by camera number (1-based) extracted from the card's short label ("Cam 1" → 1).
    // Use a stable key to avoid infinite re-render loops (videoCards is recreated every render)
    const cameraSubjectsKey = videoCards.map((c) => `${c.label}:${c.subjectIds.join(',')}:${c.visibleSubjectIds.join(',')}`).join('|');
    React.useEffect(() => {
        const map: Record<number, number[]> = {};
        const visibleMap: Record<number, number[]> = {};
        videoCards.forEach((c) => {
            const numMatch = c.label.match(/\d+/);
            const camNum = numMatch ? parseInt(numMatch[0], 10) : 0;
            if (camNum > 0) {
                map[camNum] = c.subjectIds;
                visibleMap[camNum] = c.visibleSubjectIds;
            }
        });
        setCameraSubjectsByCamNum(map);
        setCameraVisibleSubjectsByCamNum(visibleMap);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cameraSubjectsKey]);

    // Split coverage by type - include ALL coverage items
    const coverageByType = useMemo(() => {
        if (!moment || !moment.coverage_items) {
            return { video: [], audio: [], music: [] };
        }

        const coverage = moment.coverage_items || [];
        
        const video = coverage.filter((cov: any) => {
            // Check coverage_type first, then fallback to assignment prefix
            const type = cov.coverage?.coverage_type?.toUpperCase();
            const assignment = cov.coverage?.assignment || '';
            const name = cov.coverage?.name || '';
            return type === 'VIDEO' || assignment.toUpperCase().startsWith('V') || 
                   (name && name.toLowerCase().includes('camera'));
        });

        const audio = coverage.filter((cov: any) => {
            // Check coverage_type first, then fallback to assignment prefix
            const type = cov.coverage?.coverage_type?.toUpperCase();
            const assignment = cov.coverage?.assignment || '';
            const name = cov.coverage?.name || '';
            return type === 'AUDIO' || assignment.toUpperCase().startsWith('A') ||
                   (name && (name.toLowerCase().includes('mic') || name.toLowerCase().includes('audio')));
        });

        const music = coverage.filter((cov: any) => {
            // Check coverage_type first, then fallback to assignment prefix
            const type = cov.coverage?.coverage_type?.toUpperCase();
            const assignment = cov.coverage?.assignment || '';
            return type === 'MUSIC' || assignment.toUpperCase().startsWith('M');
        });

        return { video, audio, music };
    }, [moment]);

    // Helper to get proper label for coverage item
    const getCoverageLabel = (coverage: any, coverageType: 'video' | 'audio' | 'music'): string => {
        // Try moment-level assignment first (most specific)
        if (coverage.assignment) {
            return coverage.assignment;
        }
        
        // Try coverage template assignment
        if (coverage.coverage?.assignment) {
            return coverage.coverage.assignment;
        }
        
        // Try equipment name for audio
        if (coverageType === 'audio' && coverage.coverage?.audio_equipment) {
            return coverage.coverage.audio_equipment;
        }
        
        // Try generic name
        if (coverage.coverage?.name) {
            return coverage.coverage.name;
        }
        
        // Fallback with proper type-based label
        const typeLabel = coverageType === 'video' ? 'Camera' : coverageType === 'audio' ? 'Microphone' : 'Source';
        return `${typeLabel} ${coverage.priority_order}`;
    };

    // Coverage Item Component
    const CoverageItem = ({ coverage, type }: { coverage: any; type: 'video' | 'audio' | 'music' }) => (
        <Box
            sx={{
                p: 1,
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'left'
            }}
        >
            <Typography
                variant="body2"
                sx={{
                    color: '#fff',
                    fontWeight: 500,
                    fontSize: '12px'
                }}
            >
                {getCoverageLabel(coverage, type)}
            </Typography>
            {coverage.coverage?.name && (
                <Typography
                    variant="caption"
                    sx={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '10px',
                        display: 'block'
                    }}
                >
                    {coverage.coverage.name}
                </Typography>
            )}
            {coverage.coverage?.shot_type && (
                <Typography
                    variant="caption"
                    sx={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '10px',
                        display: 'block'
                    }}
                >
                    {coverage.coverage.shot_type}
                </Typography>
            )}
        </Box>
    );

    // Coverage Column Component
    const CoverageColumn = ({ title, items, color, type }: { title: string; items: any[]; color: string; type: 'video' | 'audio' | 'music' }) => (
        <Box sx={{ flex: 1 }}>
            <Typography
                variant="caption"
                sx={{
                    color: color,
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 600,
                    display: 'block',
                    mb: 0.8
                }}
            >
                {title}
            </Typography>
            {items.length === 0 ? (
                <Typography
                    variant="caption"
                    sx={{
                        color: 'rgba(255, 255, 255, 0.3)',
                        fontSize: '11px',
                        fontStyle: 'italic'
                    }}
                >
                    None
                </Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                    {items.map((cov: any, idx: number) => (
                        <CoverageItem key={idx} coverage={cov} type={type} />
                    ))}
                </Box>
            )}
        </Box>
    );

    return (
        <Box
            className={className}
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#000',
                color: '#fff',
                padding: isCompactCameraLayout ? 2 : 3,
                textAlign: 'center',
                overflowY: 'auto'
            }}
        >
            {!currentScene ? (
                <Typography
                    variant="h6"
                    sx={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontWeight: 400
                    }}
                >
                    No scene at this time
                </Typography>
            ) : (
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: storyboardGap,
                    width: '100%',
                    maxWidth: 900
                }}>
                    {/* Combined Header: Scene & Moment */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'center',
                        gap: 3,
                        width: '100%',
                        mb: 0.5
                    }}>
                        {/* Scene Part */}
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: '11px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    fontWeight: 700,
                                }}
                            >
                                {sceneLabel}
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontSize: '18px'
                                }}
                            >
                                {sceneName}
                            </Typography>
                        </Box>

                        {moment && (
                            <>
                                <Typography sx={{ color: 'rgba(255,255,255,0.2)' }}>|</Typography> 

                                {/* Moment Part */}
                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: 'rgba(255, 255, 255, 0.6)',
                                            fontSize: '11px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            fontWeight: 700,
                                        }}
                                    >
                                        Moment
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: '#fff',
                                            fontWeight: 600,
                                            fontSize: '18px'
                                        }}
                                    >
                                        {moment.name || 'Unnamed Moment'}
                                    </Typography>
                                </Box>
                            </>
                        )}

                        {(locationName || spaceName) && (
                            <>
                                <Typography sx={{ color: 'rgba(255,255,255,0.2)' }}>|</Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: 'rgba(255, 255, 255, 0.6)',
                                                fontSize: '11px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                fontWeight: 700,
                                            }}
                                        >
                                            Location
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: '#fff',
                                                fontWeight: 600,
                                                fontSize: '18px'
                                            }}
                                        >
                                            {spaceName
                                                ? locationName
                                                    ? `${locationName.replace(/\s*[-–]\s*\w+$/, '')} – ${spaceName}`
                                                    : spaceName
                                                : locationName}
                                        </Typography>
                                    </Box>
                                </Box>
                            </>
                        )}
                    </Box>

                    {/* Storyboard Section */}
                    {moment && (
                        <>
                            <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                            {/* <Box> Note: Storyboard title removed as per request </Box> */}
                            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: storyboardGap, mt: isCompactCameraLayout ? 1.25 : 2 }}>
                                    {/* 1. GRAPHICS (Top) */}
                                    {graphicsCards.length > 0 && (
                                        <Box sx={{ width: '100%' }}>
                                            <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                    color: 'rgba(255, 152, 0, 0.8)', 
                                                    fontSize: '10px', 
                                                    fontWeight: 700, 
                                                    letterSpacing: '1px', 
                                                    textTransform: 'uppercase',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    mb: 1
                                                }}
                                            >
                                                <PaletteOutlinedIcon sx={{ fontSize: 14 }} /> GRAPHICS · {graphicsCards.length}
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                {graphicsCards.map((card) => (
                                                    <Box
                                                        key={`gfx-card-${card.id}`}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1.5,
                                                            p: 1.5,
                                                            borderRadius: 1.5,
                                                            bgcolor: 'rgba(255, 152, 0, 0.1)',
                                                            border: '1px solid rgba(255, 152, 0, 0.3)',
                                                            transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
                                                            '&:hover': {
                                                                transform: 'translateY(-2px) scale(1.01)',
                                                                boxShadow: '0 6px 16px rgba(255, 152, 0, 0.2)',
                                                                borderColor: 'rgba(255, 152, 0, 0.5)',
                                                            }
                                                        }}
                                                    >
                                                        <Box sx={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: '50%',
                                                            bgcolor: 'rgba(255, 152, 0, 0.2)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0
                                                        }}>
                                                            <PaletteOutlinedIcon sx={{ fontSize: 18, color: '#ff9800' }} />
                                                        </Box>
                                                        <Box sx={{ textAlign: 'left' }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffe0b2' }}>
                                                                {card.title || 'Untitled Graphic'}
                                                            </Typography>
                                                            {card.subtitle && (
                                                                <Typography variant="caption" sx={{ color: 'rgba(255, 224, 178, 0.7)' }}>
                                                                    {card.subtitle}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                    )}

                                    {/* 2. CAMERAS (Middle - Grouped) */}
                                    {videoCards.length > 0 && (
                                        <Box sx={{ width: '100%' }}>
                                            <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                    color: 'rgba(33, 150, 243, 0.8)', 
                                                    fontSize: '10px', 
                                                    fontWeight: 700, 
                                                    letterSpacing: '1px', 
                                                    textTransform: 'uppercase',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    mb: 1
                                                }}
                                            >
                                                <CameraAltOutlinedIcon sx={{ fontSize: 14 }} /> CAMERAS · {videoCards.length}
                                            </Typography>
                                            <Box 
                                                sx={{ 
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    justifyContent: 'center',
                                                    gap: isCompactCameraLayout ? 1.5 : 2,
                                                    maxWidth: cameraSectionMaxWidth,
                                                    mx: 'auto',
                                                    width: '100%',
                                                }}
                                            >
                                                {videoCards.map((card) => {
                                                    const isExpanded = expandedCameraId === card.id;
                                                    const handleCameraClick = () => {
                                                        const newExpanded = isExpanded ? null : card.id;
                                                        setExpandedCameraId(newExpanded);
                                                        // Update context for floor plan highlighting
                                                        if (newExpanded) {
                                                            setSelectedCameraId(card.id);
                                                            // Phase D: highlight intersection of editorial ∩ visible.
                                                            // Subjects editorially targeted but not geometrically
                                                            // visible are surfaced by ConflictListPanel, not glowed.
                                                            const visibleSet = new Set(card.visibleSubjectIds);
                                                            const highlighted = card.visibleSubjectIds.length > 0
                                                                ? card.subjectIds.filter((id) => visibleSet.has(id))
                                                                : card.subjectIds;
                                                            setSelectedCameraSubjectIds(highlighted);
                                                        } else {
                                                            setSelectedCameraId(null);
                                                            setSelectedCameraSubjectIds([]);
                                                        }
                                                    };
                                                    return (
                                                    <Box
                                                        key={`video-card-${card.id}`}
                                                        onClick={handleCameraClick}
                                                        sx={{
                                                            flex: {
                                                                xs: '1 1 100%',
                                                                md: `0 0 ${cameraCardFlexBasis}`,
                                                            },
                                                            maxWidth: {
                                                                xs: '100%',
                                                                md: cameraGridColumns === 1 ? 560 : 'none',
                                                            },
                                                            width: '100%',
                                                            borderRadius: 2,
                                                            bgcolor: '#000',
                                                            aspectRatio: isExpanded ? 'auto' : cameraCardAspectRatio,
                                                            height: isExpanded ? '100vh' : 'auto',
                                                            position: 'relative',
                                                            overflow: 'hidden',
                                                            boxShadow: isExpanded ? '0 0 60px rgba(33, 150, 243, 0.3)' : '0 4px 20px rgba(0,0,0,0.4)',
                                                            border: isExpanded ? '2px solid rgba(33, 150, 243, 0.6)' : '1px solid rgba(255,255,255,0.08)',
                                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            cursor: 'pointer',
                                                            zIndex: isExpanded ? 1000 : 'auto',
                                                            ...(isExpanded && {
                                                                position: 'fixed',
                                                                top: 0,
                                                                left: 0,
                                                                right: 0,
                                                                bottom: 0,
                                                                borderRadius: 0,
                                                                margin: 0,
                                                            }),
                                                            '&:hover': !isExpanded ? {
                                                                transform: 'translateY(-4px) scale(1.01)',
                                                                boxShadow: '0 12px 30px rgba(33, 150, 243, 0.15)',
                                                                borderColor: 'rgba(33, 150, 243, 0.4)',
                                                                '& .viewfinder-mark': {
                                                                    borderColor: '#2196f3',
                                                                    opacity: 0.8
                                                                }
                                                            } : {},
                                                        }}
                                                    >
                                                        {/* Cinematic Background */}
                                                        <Box sx={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            background: 'radial-gradient(circle at 50% 30%, #1a232e 0%, #05080a 100%)',
                                                            zIndex: 0
                                                        }}>
                                                            {/* Horizon line */}
                                                            <Box sx={{ 
                                                                position: 'absolute', 
                                                                bottom: '40%', 
                                                                left: 0, 
                                                                right: 0, 
                                                                height: '1px', 
                                                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' 
                                                            }} />
                                                        </Box>

                                                        {/* AI Shot Preview Overlay */}
                                                        <ShotPreviewOverlay
                                                            assignmentId={card.assignmentId}
                                                            filmId={typeof filmId === 'string' ? parseInt(filmId, 10) : filmId}
                                                            showControlnetGuide={showControlnetGuide}
                                                            showSpatialOverlay={showSpatialOverlay}
                                                            showSpatialGrid={showSpatialGrid}
                                                        />

                                                        {/* Generate Preview Sparkle Button */}
                                                        {card.assignmentId && (
                                                            <Tooltip title="Generate AI preview" placement="left">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleGeneratePreview(card.assignmentId!)}
                                                                    disabled={generatingIds.has(card.assignmentId)}
                                                                    sx={{
                                                                        position: 'absolute',
                                                                        top: 6,
                                                                        right: 6,
                                                                        zIndex: 35,
                                                                        width: 28,
                                                                        height: 28,
                                                                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                                                                        backdropFilter: 'blur(4px)',
                                                                        color: '#a78bfa',
                                                                        opacity: 0.7,
                                                                        transition: 'all 0.2s ease',
                                                                        '&:hover': {
                                                                            bgcolor: 'rgba(167, 139, 250, 0.2)',
                                                                            opacity: 1,
                                                                        },
                                                                        '&.Mui-disabled': {
                                                                            color: '#a78bfa',
                                                                        },
                                                                    }}
                                                                >
                                                                    {generatingIds.has(card.assignmentId) ? (
                                                                        <CircularProgress size={14} sx={{ color: '#a78bfa' }} />
                                                                    ) : (
                                                                        <AutoAwesomeIcon sx={{ fontSize: 14 }} />
                                                                    )}
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}

                                                        {/* Info Overlay (Top) */}
                                                        <Box sx={{ 
                                                            position: 'absolute', 
                                                            top: 0, 
                                                            left: 0, 
                                                            right: 0, 
                                                            display: 'flex', 
                                                            justifyContent: 'center',
                                                            alignItems: 'flex-start',
                                                            zIndex: 30,
                                                            height: '42px',
                                                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)'
                                                        }}>
                                                            <Box sx={{ 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                gap: 1,
                                                                bgcolor: 'rgba(15, 23, 42, 0.8)',
                                                                border: '1px solid rgba(33, 150, 243, 0.3)',
                                                              
                                                                borderRadius: '0 0 6px 6px',
                                                                padding: '4px 10px',
                                                                backdropFilter: 'blur(4px)',
                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                                            }}>
                                                                <Typography sx={{ 
                                                                    fontSize: '9px', 
                                                                    fontWeight: 700, 
                                                                    color: '#64b5f6',
                                                                    letterSpacing: '0.5px',
                                                                    textTransform: 'uppercase'
                                                                }}>
                                                                    {card.label}
                                                                </Typography>
                                                                
                                                                <Box sx={{ width: '1px', height: '8px', bgcolor: 'rgba(33, 150, 243, 0.3)' }} />

                                                                <Typography sx={{ 
                                                                    fontSize: '9px', 
                                                                    fontWeight: 700, 
                                                                    color: '#fff', 
                                                                    letterSpacing: '0.5px'
                                                                }}>
                                                                    {card.shot}
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        {/* Subject name labels were removed — targeted-subject names now live
                                                            inside the AI ShotPreviewOverlay SVG (gold pill under the figure). */}

                                                        {/* Viewfinder Corners */}
                                                        {[
                                                            { top: 10, left: 10, borderTop: 2, borderLeft: 2 },
                                                            { top: 10, right: 10, borderTop: 2, borderRight: 2 },
                                                            { bottom: 10, left: 10, borderBottom: 2, borderLeft: 2 },
                                                            { bottom: 10, right: 10, borderBottom: 2, borderRight: 2 }
                                                        ].map((style, i) => (
                                                            <Box
                                                                key={i}
                                                                className="viewfinder-mark"
                                                                sx={{
                                                                    position: 'absolute',
                                                                    width: 10,
                                                                    height: 10,
                                                                    borderColor: 'rgba(255,255,255,0.15)',
                                                                    borderStyle: 'solid',
                                                                    borderWidth: 0,
                                                                    ...style,
                                                                    zIndex: 20,
                                                                    transition: 'opacity 0.2s ease, border-color 0.2s ease',
                                                                    opacity: 0.6
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                    );
                                                })}
                                            </Box>
                                        </Box>
                                    )}

                                    {/* 3. AUDIO + MUSIC (Same Row) */}
                                    {(audioCards.length > 0 || musicCards.length > 0) && (
                                        <Box
                                            sx={{
                                                width: '100%',
                                                display: 'grid',
                                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                                gap: 2
                                            }}
                                        >
                                            {audioCards.length > 0 && (
                                                <Box sx={{ width: '100%' }}>
                                                    <Typography 
                                                        variant="caption" 
                                                        sx={{ 
                                                            color: 'rgba(76, 175, 80, 0.8)', 
                                                            fontSize: '10px', 
                                                            fontWeight: 700, 
                                                            letterSpacing: '1px', 
                                                            textTransform: 'uppercase',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            mb: 1
                                                        }}
                                                    >
                                                        <MicOutlinedIcon sx={{ fontSize: 14 }} /> AUDIO · {audioCards.length}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                                        {audioCards.map((card) => (
                                                            <Box
                                                                key={`audio-card-${card.id}`}
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 1.5,
                                                                    pr: 2,
                                                                    pl: 0.5,
                                                                    py: 0.5,
                                                                    borderRadius: '30px',
                                                                    border: '1px solid rgba(76, 175, 80, 0.3)',
                                                                    bgcolor: 'rgba(76, 175, 80, 0.08)',
                                                                    transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
                                                                    '&:hover': {
                                                                        transform: 'translateY(-2px) scale(1.02)',
                                                                        boxShadow: '0 6px 14px rgba(76, 175, 80, 0.2)',
                                                                        borderColor: 'rgba(76, 175, 80, 0.5)',
                                                                    }
                                                                }}
                                                            >
                                                                <Box sx={{
                                                                    width: 28,
                                                                    height: 28,
                                                                    borderRadius: '50%',
                                                                    bgcolor: 'rgba(76, 175, 80, 0.2)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}>
                                                                    <MicOutlinedIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                                                                </Box>
                                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#a5d6a7', fontSize: '11px', lineHeight: 1 }}>
                                                                        {card.label}
                                                                    </Typography>
                                                                    {card.subjects && (
                                                                        <Typography variant="caption" sx={{ color: 'rgba(165, 214, 167, 0.7)', fontSize: '9px', lineHeight: 1, mt: 0.5 }}>
                                                                            {card.subjects}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}

                                            {musicCards.length > 0 && (
                                                <Box sx={{ width: '100%' }}>
                                                    <Typography 
                                                        variant="caption" 
                                                        sx={{ 
                                                            color: 'rgba(156, 39, 176, 0.8)', 
                                                            fontSize: '10px', 
                                                            fontWeight: 700, 
                                                            letterSpacing: '1px', 
                                                            textTransform: 'uppercase',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            mb: 1
                                                        }}
                                                    >
                                                        <MusicNoteOutlinedIcon sx={{ fontSize: 14 }} /> MUSIC · {musicCards.length}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                                        {musicCards.map((card) => (
                                                            <Box
                                                                key={`music-card-${card.id}`}
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 1.5,
                                                                    pr: 2,
                                                                    pl: 0.5,
                                                                    py: 0.5,
                                                                    borderRadius: '30px',
                                                                    border: '1px solid rgba(156, 39, 176, 0.3)',
                                                                    bgcolor: 'rgba(156, 39, 176, 0.08)',
                                                                    transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
                                                                    '&:hover': {
                                                                        transform: 'translateY(-2px) scale(1.02)',
                                                                        boxShadow: '0 6px 14px rgba(156, 39, 176, 0.25)',
                                                                        borderColor: 'rgba(156, 39, 176, 0.5)',
                                                                    }
                                                                }}
                                                            >
                                                                <Box sx={{
                                                                    width: 28,
                                                                    height: 28,
                                                                    borderRadius: '50%',
                                                                    bgcolor: 'rgba(156, 39, 176, 0.2)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}>
                                                                    <MusicNoteOutlinedIcon sx={{ fontSize: 16, color: '#ab47bc' }} />
                                                                </Box>
                                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#e1bee7', fontSize: '11px', lineHeight: 1 }}>
                                                                        {card.trackName}
                                                                    </Typography>
                                                                    {card.artist && (
                                                                        <Typography variant="caption" sx={{ color: 'rgba(225, 190, 231, 0.6)', fontSize: '9px', lineHeight: 1, mt: 0.5 }}>
                                                                            {card.artist}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                        </>
                    )}

                    {/* Coverage Section - Split by Type */}
                    {moment && (coverageByType.video.length > 0 || coverageByType.audio.length > 0 || coverageByType.music.length > 0) && (
                        <>
                            <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                            <Box>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        fontSize: '11px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        fontWeight: 600,
                                        display: 'block',
                                        mb: 1.5
                                    }}
                                >
                                    Coverage
                                </Typography>
                            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                <CoverageColumn 
                                    title="Video" 
                                    items={coverageByType.video} 
                                    color="#2196f3"
                                    type="video"
                                />
                                <CoverageColumn 
                                    title="Audio" 
                                    items={coverageByType.audio} 
                                    color="#4caf50"
                                    type="audio"
                                />
                                <Box sx={{ flex: 1 }}>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: '#9c27b0',
                                            fontSize: '10px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            fontWeight: 600,
                                            display: 'block',
                                            mb: 0.8
                                        }}
                                    >
                                        Music
                                    </Typography>
                                    {moment.music ? (
                                        <Box
                                            sx={{
                                                p: 1,
                                                bgcolor: 'rgba(255, 255, 255, 0.08)',
                                                borderRadius: '4px',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: '#fff',
                                                    fontWeight: 500,
                                                    fontSize: '12px'
                                                }}
                                            >
                                                {moment.music.music_name || 'Untitled'}
                                            </Typography>
                                            {moment.music.artist && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: 'rgba(255, 255, 255, 0.6)',
                                                        fontSize: '10px',
                                                        display: 'block'
                                                    }}
                                                >
                                                    {moment.music.artist}
                                                </Typography>
                                            )}
                                            {moment.music.music_type && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: 'rgba(255, 255, 255, 0.5)',
                                                        fontSize: '10px',
                                                        display: 'block'
                                                    }}
                                                >
                                                    {moment.music.music_type}
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        <>
                                            {coverageByType.music.length === 0 ? (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: 'rgba(255, 255, 255, 0.3)',
                                                        fontSize: '11px',
                                                        fontStyle: 'italic'
                                                    }}
                                                >
                                                    None
                                                </Typography>
                                            ) : (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                                                    {coverageByType.music.map((cov: any, idx: number) => (
                                                        <CoverageItem key={idx} coverage={cov} type="music" />
                                                    ))}
                                                </Box>
                                            )}
                                        </>
                                    )}
                                </Box>
                            </Box>
                            </Box>
                        </>
                    )}
                </Box>
            )}
        </Box>
    );
};
