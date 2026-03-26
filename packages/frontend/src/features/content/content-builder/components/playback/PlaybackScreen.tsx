import React, { useMemo } from 'react';
import { PlaybackScreenProps } from '@/lib/types/timeline';
import { Box, Typography, Divider } from '@mui/material';
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import MicOutlinedIcon from "@mui/icons-material/MicOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import MusicNoteOutlinedIcon from "@mui/icons-material/MusicNoteOutlined";
import { useContentBuilder } from "../../context/ContentBuilderContext";
import { getEquipmentShortLabelForTrackName } from "@/lib/utils/equipmentAssignments";

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
    tracks = []
}) => {
    const { equipmentAssignmentsBySlot, packageSubjects, packageLocations, linkedActivityId } = useContentBuilder();
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
            // Deprecated aliases fallback to closest standard
            ESTABLISHING_SHOT: "WS",
            DETAIL_SHOT: "CU",
            INSERT_SHOT: "CU",
            MASTER_SHOT: "WS",
            TWO_SHOT: "MS",      // Fallback if strict shot type needed
            OVER_SHOULDER: "MS", // Fallback
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
        
        // Map based strictly on requested list: ECU, CU, MCU, MS, MWS, WS, EWS
        if (type.includes('EXTREME CLOSE')) return { scale: 6.5, yOffset: 35, label: 'ECU' }; // Eyes/Face
        if (type.includes('MEDIUM CLOSE')) return { scale: 2.8, yOffset: 15, label: 'MCU' };  // Chest up
        if (type.includes('CLOSE')) return { scale: 4.2, yOffset: 25, label: 'CU' };          // Head/Shoulders
        if (type.includes('MEDIUM WIDE')) return { scale: 1.2, yOffset: 5, label: 'MWS' };    // Knees up
        if (type.includes('MEDIUM')) return { scale: 1.9, yOffset: 10, label: 'MS' };         // Waist up
        if (type.includes('EXTREME WIDE')) return { scale: 0.25, yOffset: 0, label: 'EWS' };  // Tiny figures
        if (type.includes('WIDE')) return { scale: 0.55, yOffset: 0, label: 'WS' };           // Full body with space
        
        // Fallbacks for legacy types mapping to closest standard
        if (type.includes('ESTABLISHING') || type.includes('MASTER')) return { scale: 0.55, yOffset: 0, label: 'WS' };
        if (type.includes('DETAIL') || type.includes('INSERT')) return { scale: 4.2, yOffset: 25, label: 'CU' };
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

    // Realistic silhouette path (Person standing)
    const PersonSilhouette = ({ color = "#fff", opacity = 1 }) => (
        <svg viewBox="0 0 24 60" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }}>
            <path 
                d="M12,2 C14.5,2 16.5,4 16.5,6.5 C16.5,9 14.5,11 12,11 C9.5,11 7.5,9 7.5,6.5 C7.5,4 9.5,2 12,2 Z M6,14 C6,12.5 7,12 8.5,12 L15.5,12 C17,12 18,12.5 18,14 L19.5,28 C19.6,29 18.8,30 18,30 L16.5,30 L16.5,58 C16.5,59 15.5,60 14.5,60 L9.5,60 C8.5,60 7.5,59 7.5,58 L7.5,30 L6,30 C5.2,30 4.4,29 4.5,28 L6,14 Z" 
                fill={color} 
                opacity={opacity}
            />
        </svg>
    );

    // Calculate current moment based on currentTime
    const { moment, sceneName } = useMemo(() => {
        console.group('[PlaybackScreen] Computing moment');
        console.log('[PlaybackScreen] currentScene:', currentScene ? {
            id: (currentScene as any).id,
            name: (currentScene as any).name,
            start_time: (currentScene as any).start_time,
            duration: (currentScene as any).duration,
            hasOriginalScene: !!(currentScene as any).original_scene,
            hasMoments: !!(currentScene as any).moments,
            momentsCount: ((currentScene as any).moments || []).length,
        } : null);
        console.groupEnd();

        if (!currentScene) return { moment: null, sceneName: '' };

        const originalScene = (currentScene as any).original_scene || currentScene;
        const moments = originalScene.moments || [];

        console.log('[PlaybackScreen] Moments from scene:', moments.map((m: any) => ({
            id: m.id,
            name: m.name,
            duration: m.duration,
            has_recording_setup: m.has_recording_setup,
            recording_setup: m.recording_setup ? {
                camera_assignments_count: (m.recording_setup.camera_assignments || []).length,
                audio_track_ids: m.recording_setup.audio_track_ids,
                graphics_enabled: m.recording_setup.graphics_enabled,
            } : null,
        })));

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

    console.log('[PlaybackScreen] Active moment:', moment ? {
        id: (moment as any).id,
        name: (moment as any).name,
        has_recording_setup: (moment as any).has_recording_setup,
        recording_setup_raw: (moment as any).recording_setup,
        recording_setup_keys: (moment as any).recording_setup ? Object.keys((moment as any).recording_setup) : null,
    } : null);
    console.log('[PlaybackScreen] recordingSetup resolved:', recordingSetup ? {
        camera_assignments: recordingSetup.camera_assignments,
        audio_track_ids: recordingSetup.audio_track_ids,
        graphics_enabled: recordingSetup.graphics_enabled,
    } : 'NULL — no cards will render');

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

    const locationName = packageLocationName ||
        (moment as any)?.location?.name ||
        (moment as any)?.location_name ||
        (currentScene as any)?.location?.name ||
        (currentScene as any)?.location_name ||
        '';
    const sceneOrderIndex = typeof (currentScene as any)?.order_index === "number" ? (currentScene as any).order_index : undefined;
    const sceneLabel = typeof sceneOrderIndex === "number" ? `Scene ${sceneOrderIndex + 1}` : "Scene";

    const cameraAssignments = (recordingSetup?.camera_assignments || []) as Array<{
        track_id: number;
        track_name?: string;
        track_type?: string;
        subject_ids?: number[];
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
            const trackType = assignment.track_type?.toString().toLowerCase();
            if (trackType && trackType !== "video") return false;
            return true;
        })
        .map((assignment) => {
            const rawLabel = getTrackName(assignment.track_id, assignment.track_name);
            const [trackLabel, equipmentLabel] = rawLabel.split(" · ");
            const shortLabel = trackLabel.replace(/Camera/i, "Cam");
            const label = equipmentLabel ? `${shortLabel} · ${equipmentLabel}` : shortLabel;
            return {
                id: assignment.track_id,
                label: label,
                shot: formatShotLabel(assignment.shot_type),
                shotType: assignment.shot_type,
                subjects: buildSubjectLabel(assignment.subject_ids),
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

    const momentMusic = (moment as any)?.moment_music || (moment as any)?.music || null;
    const sceneMusic = (currentScene as any)?.scene_music || null;
    const musicSource = momentMusic || sceneMusic || null;

    const graphicsCards = graphicsEnabled ? [{ id: 'gfx', title: graphicsTitle, subtitle: 'Overlay' }] : [];
    const musicCards = musicSource ? [{ id: 'music', trackName: musicSource.music_name || 'Untitled', artist: musicSource.artist }] : [];

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
                padding: 3,
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
                    gap: 2,
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

                        {locationName && (
                            <>
                                <Typography sx={{ color: 'rgba(255,255,255,0.2)' }}>|</Typography>

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
                                        {locationName}
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Box>

                    {/* Storyboard Section */}
                    {moment && (
                        <>
                            <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                            {/* <Box> Note: Storyboard title removed as per request </Box> */}
                            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
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
                                                    display: 'grid', 
                                                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                                                    gap: 2 
                                                }}
                                            >
                                                {videoCards.map((card) => (
                                                    <Box
                                                        key={`video-card-${card.id}`}
                                                        sx={{
                                                            borderRadius: 2,
                                                            bgcolor: '#000',
                                                            aspectRatio: '16/9',
                                                            position: 'relative',
                                                            overflow: 'hidden',
                                                            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                                                            border: '1px solid rgba(255,255,255,0.08)',
                                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            '&:hover': {
                                                                transform: 'translateY(-4px) scale(1.01)',
                                                                boxShadow: '0 12px 30px rgba(33, 150, 243, 0.15)',
                                                                borderColor: 'rgba(33, 150, 243, 0.4)',
                                                                '& .viewfinder-mark': {
                                                                    borderColor: '#2196f3',
                                                                    opacity: 0.8
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        {/* Cinematic Background */}
                                                        <Box sx={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            background: 'radial-gradient(circle at 50% 30%, #1a232e 0%, #05080a 100%)',
                                                            zIndex: 0
                                                        }}>
                                                            {/* Rule of Thirds Grid (Subtle) */}
                                                            <Box sx={{
                                                                position: 'absolute',
                                                                inset: 0,
                                                                backgroundImage: `
                                                                    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                                                                    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                                                                `,
                                                                backgroundSize: '33.33% 33.33%',
                                                                opacity: 0.5
                                                            }} />
                                                            
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

                                                        {/* Shot Visualization */}
                                                        <Box sx={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            zIndex: 10,
                                                        }}>
                                                            {(() => {
                                                                const subjectNames = card.subjects
                                                                    ? card.subjects.split(',').map((name) => name.trim()).filter(Boolean)
                                                                    : [];
                                                                const count = subjectNames.length;
                                                                const { scale, yOffset } = count > 2 ? { scale: 0.65, yOffset: 0 } : getShotProfile(card.shotType);
                                                                const layout = getSubjectLayout(count, scale);
                                                                const opacity = scale < 0.5 ? 0.8 : 1;
                                                                const color = '#e3f2fd';

                                                                return count > 0 ? (
                                                                    layout.map((item, idx) => (
                                                                        <React.Fragment key={`${card.id}-person-group-${idx}`}>
                                                                            {/* Silhouette */}
                                                                            <Box
                                                                                sx={{
                                                                                    position: 'absolute',
                                                                                    left: `${item.x}%`,
                                                                                    bottom: '40%',
                                                                                    width: '24px',
                                                                                    height: '60px',
                                                                                    transform: `translateX(-50%) scale(${scale}) translateY(${yOffset}%)`,
                                                                                    transformOrigin: '50% 30%',
                                                                                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                                                    zIndex: 10
                                                                                }}
                                                                            >
                                                                                <PersonSilhouette color={color} opacity={opacity} />
                                                                            </Box>
                                                                            
                                                                            {/* Floating Name Label - Pinned to bottom, separate from zoom */}
                                                                            <Box
                                                                                sx={{
                                                                                    position: 'absolute',
                                                                                    left: `${item.x}%`,
                                                                                    bottom: '16px',
                                                                                    transform: 'translateX(-50%)',
                                                                                    zIndex: 40,
                                                                                    maxWidth: '90%',
                                                                                    display: 'flex',
                                                                                    justifyContent: 'center',
                                                                                    transition: 'left 0.3s ease'
                                                                                }}
                                                                            >
                                                                                <Box sx={{
                                                                                    bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                                                    borderRadius: '12px',
                                                                                    padding: '4px 10px',
                                                                                    backdropFilter: 'blur(8px)',
                                                                                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                                                                                }}>
                                                                                    <Typography sx={{
                                                                                        color: '#fff',
                                                                                        fontSize: '10px',
                                                                                        fontWeight: 700,
                                                                                        letterSpacing: '0.5px',
                                                                                        whiteSpace: 'nowrap',
                                                                                        overflow: 'hidden',
                                                                                        textOverflow: 'ellipsis',
                                                                                        maxWidth: '120px'
                                                                                    }}>
                                                                                        {subjectNames[idx]}
                                                                                    </Typography>
                                                                                </Box>
                                                                            </Box>
                                                                        </React.Fragment>
                                                                    ))
                                                                ) : (
                                                                    <Box sx={{ 
                                                                        position: 'absolute', 
                                                                        inset: 0, 
                                                                        display: 'flex', 
                                                                        alignItems: 'center', 
                                                                        justifyContent: 'center',
                                                                        opacity: 0.3,
                                                                        flexDirection: 'column',
                                                                        gap: 1
                                                                    }}>
                                                                        <Typography sx={{ fontSize: '10px', letterSpacing: '2px', color: '#fff' }}>EMPTY FRAME</Typography>
                                                                    </Box>
                                                                );
                                                            })()}
                                                        </Box>

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
                                                ))}
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
