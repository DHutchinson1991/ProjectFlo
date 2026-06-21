"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  Box, Typography, Chip, Divider, Select, MenuItem,
  FormControl, Checkbox, IconButton, Tooltip, CircularProgress,
} from '@mui/material';
import MovieFilterRoundedIcon from '@mui/icons-material/MovieFilterRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { useQueryClient } from '@tanstack/react-query';
import { useContentBuilder } from '../../context/ContentBuilderContext';
import { useFilmSchedule } from '../../hooks/data';
import { useBrand } from '@/features/platform/brand';
import { scenesApi } from '@/features/content/scenes/api';
import { useSpaceSlotsByActivity, spaceSlotKeys } from '@/features/workflow/locations/hooks/useSpaceSlotSpatial';
import { useGenerateSceneBlocking } from '@/features/ai/blocking/hooks/useGenerateSceneBlocking';
import { capSubjectIds, editorialSubjectCapLabel } from '@projectflo/shared';
import { TextShimmer } from '../shared/ShimmerOverlay';
import {
  SHOT_TYPES,
  formatDuration,
  formatShotLabel,
  selectSx,
  menuProps,
  TrackIconButton,
  DetailHeader,
  SubjectMultiSelect,
  buildRecordingSetupPayload,
  getMomentsFromScene,
  getFilmSceneId,
  type RecordingSetupPayload,
} from '../inspector/recordingSetupInspectorShared';

function recordingSetupsDiffer(moments: any[]): boolean {
  if (moments.length <= 1) return false;
  const baseline = JSON.stringify(moments[0]?.recording_setup ?? null);
  return moments.some((m, i) => i > 0 && JSON.stringify(m?.recording_setup ?? null) !== baseline);
}

export const ScenePanel: React.FC = () => {
  const {
    currentScene, tracks, packageSubjects, packageActivities, filmId, packageId,
    setScenes, instanceOwnerType, instanceOwnerId, readOnly,
    setAiBlockingPending, aiBlockingPending, sceneBlockingProgress, setSceneBlockingProgress,
  } = useContentBuilder();

  const sceneMoments = React.useMemo(() => getMomentsFromScene(currentScene), [currentScene]);
  const filmSceneId = React.useMemo(() => getFilmSceneId(currentScene), [currentScene]);
  const seedMoment = sceneMoments[0] ?? null;
  const recordingSetup = seedMoment?.recording_setup || (currentScene as any)?.recording_setup || null;
  const momentsDiffer = React.useMemo(() => recordingSetupsDiffer(sceneMoments), [sceneMoments]);

  const sceneTotalDuration = React.useMemo(
    () => sceneMoments.reduce((sum, m) => sum + (m.duration || m.duration_seconds || 0), 0),
    [sceneMoments],
  );

  const { currentBrand } = useBrand();
  const { getSceneSchedule } = useFilmSchedule(
    filmId ? Number(filmId) : null,
    currentBrand?.id ?? null,
    packageId ?? null,
    instanceOwnerType,
    instanceOwnerId,
  );

  const sceneActivity = React.useMemo(() => {
    const sceneId = currentScene?.id;
    if (!sceneId || packageActivities.length === 0) return null;
    const schedule = getSceneSchedule(sceneId);
    const activityId = (schedule as any)?.package_activity_id ?? (schedule as any)?.project_activity_id;
    if (!activityId) return null;
    return packageActivities.find((a) => a.id === activityId) ?? null;
  }, [currentScene?.id, packageActivities, getSceneSchedule]);

  const inheritedSubjects = React.useMemo(() => {
    let raw: Array<{ id: number; name: string; [k: string]: unknown }>;
    if (!sceneActivity) {
      raw = packageSubjects as Array<{ id: number; name: string; [k: string]: unknown }>;
    } else {
      raw = (packageSubjects as any[]).filter((s: any) => {
        if (s.activity_assignments?.some((a: any) => a.package_activity_id === sceneActivity.id)) return true;
        const noAssign = !s.package_activity_id && (!s.activity_assignments || s.activity_assignments.length === 0);
        const eventDayId = (sceneActivity as any).event_day_template_id ?? (sceneActivity as any).package_event_day_id;
        return noAssign && s.event_day_template_id === eventDayId;
      });
    }
    const seen = new Set<string>();
    return raw.filter((s) => {
      const key = (s.name || '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [packageSubjects, sceneActivity]);

  const cameraAssignments: Array<{
    track_id: number;
    subject_ids?: number[];
    shot_type?: string | null;
    enabled?: boolean;
  }> = recordingSetup?.camera_assignments || [];
  const audioTrackIds: number[] = recordingSetup?.audio_track_ids || [];
  const audioAssignments: Array<{ track_id: number; subject_ids?: number[] }> =
    recordingSetup?.audio_assignments || [];
  const graphicsEnabled = !!recordingSetup?.graphics_enabled;

  const videoTracks = React.useMemo(
    () => tracks.filter((t) => (t.track_type || '').toLowerCase() === 'video')
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })),
    [tracks],
  );
  const audioTracks = React.useMemo(
    () => tracks.filter((t) => (t.track_type || '').toLowerCase().includes('audio')),
    [tracks],
  );
  const graphicsTracks = React.useMemo(
    () => tracks.filter((t) => (t.track_type || '').toLowerCase() === 'graphics'),
    [tracks],
  );
  const musicTracks = React.useMemo(
    () => tracks.filter((t) => (t.track_type || '').toLowerCase() === 'music'),
    [tracks],
  );
  const equipmentTracks = React.useMemo(() => [...videoTracks, ...audioTracks], [videoTracks, audioTracks]);

  const sceneMusic = (currentScene as any)?.scene_music || null;
  const music = sceneMusic;

  const queryClient = useQueryClient();
  const { data: spaceSlots } = useSpaceSlotsByActivity(sceneActivity?.id ?? undefined);
  const primarySpaceSlotId = spaceSlots?.[0]?.id ?? null;
  const generateSceneBlocking = useGenerateSceneBlocking();

  const getSubjectName = (subjectId: number): string => {
    const pkg = (packageSubjects || []).find((s: any) => s.id === subjectId);
    if ((pkg as any)?.name) return (pkg as any).name;
    return `Subject ${subjectId}`;
  };

  const updateAllMomentsLocally = React.useCallback((payload: RecordingSetupPayload) => {
    if (!currentScene?.id) return;
    const sceneId = currentScene.id;
    setScenes((prev: any[]) => prev.map((scene: any) => {
      const sid = scene.id;
      const originalId = (scene as any).original_scene?.id;
      if (sid !== sceneId && originalId !== sceneId) return scene;

      const originalScene = scene.original_scene || scene;
      const moments = originalScene.moments || [];
      if (moments.length === 0) return scene;

      const updatedMoments = moments.map((m: any) => {
        const existingCameras: any[] = m.recording_setup?.camera_assignments || [];
        const mergedCameras = payload.camera_assignments.map((newCam) => {
          const existing = existingCameras.find((e: any) => e.track_id === newCam.track_id);
          if (existing) {
            const preserveShot = existing.shot_type_locked === true;
            return {
              ...existing,
              subject_ids: newCam.subject_ids,
              shot_type: preserveShot ? existing.shot_type : newCam.shot_type,
              enabled: newCam.enabled,
            };
          }
          const track = tracks.find(t => t.id === newCam.track_id);
          return { ...newCam, track_type: track?.track_type || 'video' };
        });
        const existingAudio: any[] = m.recording_setup?.audio_assignments || [];
        const mergedAudio = (payload.audio_assignments ?? []).map((newAudio) => {
          const existing = existingAudio.find((e: any) => e.track_id === newAudio.track_id);
          return existing ? { ...existing, subject_ids: newAudio.subject_ids } : newAudio;
        });
        return {
          ...m,
          recording_setup: {
            ...m.recording_setup,
            camera_assignments: mergedCameras,
            audio_track_ids: payload.audio_track_ids,
            audio_assignments: mergedAudio,
            ...(payload.graphics_enabled !== undefined && { graphics_enabled: payload.graphics_enabled }),
            ...(payload.graphics_title !== undefined && { graphics_title: payload.graphics_title }),
          },
          has_recording_setup: true,
        };
      });

      if (scene.original_scene) {
        return { ...scene, original_scene: { ...originalScene, moments: updatedMoments }, moments: updatedMoments };
      }
      return { ...scene, moments: updatedMoments };
    }));
  }, [currentScene?.id, setScenes, tracks]);

  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistToAllMoments = React.useCallback(async (payload: RecordingSetupPayload) => {
    const momentIds = sceneMoments.map((m) => m.id).filter(Boolean);
    await Promise.all(
      momentIds.map((momentId) => scenesApi.moments.upsertRecordingSetup(momentId, payload)),
    );
  }, [sceneMoments]);

  const debouncedSaveAll = React.useCallback((payload: RecordingSetupPayload) => {
    updateAllMomentsLocally(payload);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void persistToAllMoments(payload);
    }, 600);
  }, [updateAllMomentsLocally, persistToAllMoments]);

  React.useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  const buildCurrentPayload = React.useCallback((
    cameras = cameraAssignments,
    audioIds = audioTrackIds,
    audioAssigns = audioAssignments,
    gfx = graphicsEnabled,
  ): RecordingSetupPayload =>
    buildRecordingSetupPayload(cameras, audioIds, audioAssigns, gfx),
  [cameraAssignments, audioTrackIds, audioAssignments, graphicsEnabled]);

  const handleShotChange = (camIdx: number, value: string) => {
    if (readOnly) return;
    const shotType = value || null;
    const currentCameras = [...cameraAssignments];
    const currentIds = currentCameras[camIdx]?.subject_ids ?? [];
    currentCameras[camIdx] = {
      ...currentCameras[camIdx],
      shot_type: shotType,
      subject_ids: capSubjectIds(currentIds, shotType),
    };
    debouncedSaveAll(buildCurrentPayload(currentCameras));
  };

  const handleSubjectChange = (camIdx: number, value: number[]) => {
    if (readOnly) return;
    const currentCameras = [...cameraAssignments];
    const shotType = currentCameras[camIdx]?.shot_type ?? null;
    currentCameras[camIdx] = { ...currentCameras[camIdx], subject_ids: capSubjectIds(value, shotType) };
    debouncedSaveAll(buildCurrentPayload(currentCameras));
  };

  const handleVideoToggle = (trackId: number) => {
    if (readOnly) return;
    const existing = cameraAssignments.find(a => a.track_id === trackId);
    let newCameras;
    if (existing) {
      newCameras = cameraAssignments.map(a =>
        a.track_id === trackId ? { ...a, enabled: a.enabled === false ? true : false } : a,
      );
    } else {
      newCameras = [...cameraAssignments, { track_id: trackId, subject_ids: [] as number[], shot_type: null as string | null, enabled: true }];
    }
    debouncedSaveAll(buildCurrentPayload(newCameras));
  };

  const handleAudioToggle = (trackId: number) => {
    if (readOnly) return;
    const isEnabled = audioTrackIds.includes(trackId);
    const newAudioIds = isEnabled ? audioTrackIds.filter((id) => id !== trackId) : [...audioTrackIds, trackId];
    const newAudioAssignments = isEnabled
      ? audioAssignments.filter(a => a.track_id !== trackId)
      : [...audioAssignments, { track_id: trackId, subject_ids: [] as number[] }];
    debouncedSaveAll(buildCurrentPayload(cameraAssignments, newAudioIds, newAudioAssignments));
  };

  const handleAudioSubjectChange = (trackId: number, subjectIds: number[]) => {
    if (readOnly) return;
    const newAudioAssignments = audioAssignments.map(a =>
      a.track_id === trackId ? { ...a, subject_ids: subjectIds } : a,
    );
    if (!newAudioAssignments.find(a => a.track_id === trackId)) {
      newAudioAssignments.push({ track_id: trackId, subject_ids: subjectIds });
    }
    debouncedSaveAll(buildCurrentPayload(cameraAssignments, audioTrackIds, newAudioAssignments));
  };

  const handleGraphicsToggle = () => {
    if (readOnly) return;
    debouncedSaveAll(buildCurrentPayload(cameraAssignments, audioTrackIds, audioAssignments, !graphicsEnabled));
  };

  const isVideoTrackAssigned = (trackId: number) => {
    const a = cameraAssignments.find(c => c.track_id === trackId);
    return !!a && a.enabled !== false;
  };

  const getCameraAssignment = (trackId: number) => cameraAssignments.find(a => a.track_id === trackId);
  const getCameraIdx = (trackId: number) => cameraAssignments.findIndex(a => a.track_id === trackId);

  type SelectionId = number | 'graphics' | 'music';
  const [selectedId, setSelectedId] = React.useState<SelectionId | null>(null);

  React.useEffect(() => {
    setSelectedId(null);
  }, [currentScene?.id]);

  React.useEffect(() => {
    if (currentScene && selectedId === null && equipmentTracks.length > 0) {
      setSelectedId(equipmentTracks[0].id);
    }
  }, [currentScene, selectedId, equipmentTracks]);

  const selectedTrack = typeof selectedId === 'number' ? tracks.find(t => t.id === selectedId) : null;
  const selectedIsVideo = selectedTrack?.track_type?.toLowerCase() === 'video';
  const selectedIsAudio = selectedTrack?.track_type?.toLowerCase() === 'audio';

  const handleAiBlockScene = React.useCallback(async () => {
    if (!filmSceneId || !primarySpaceSlotId || readOnly || sceneMoments.length === 0) return;
    setAiBlockingPending(true);
    setSceneBlockingProgress({
      current: 0,
      total: sceneMoments.length,
      momentName: 'Running AI blocking…',
    });

    try {
      const result = await generateSceneBlocking.mutateAsync({
        filmSceneId,
        spaceSlotId: primarySpaceSlotId,
        activityId: sceneActivity?.id,
      });

      const brandId = String(currentBrand?.id ?? '');
      const actId = sceneActivity?.id;

      for (let i = 0; i < result.moments.length; i++) {
        const entry = result.moments[i];
        setSceneBlockingProgress({
          current: i + 1,
          total: result.total,
          momentName: entry.momentName,
        });

        if (entry.status !== 'completed' || !entry.result) continue;

        const blockingResult = entry.result;
        const sceneMoment = sceneMoments.find((m) => m.id === entry.sceneMomentId);
        const packageActivityMomentId: number | null =
          sceneMoment?.package_activity_moment_id ?? null;

        if (actId && brandId && packageActivityMomentId) {
          const cacheKey = spaceSlotKeys.byActivity(brandId, actId);
          queryClient.setQueryData(cacheKey, (old: any) => {
            if (!Array.isArray(old)) return old;
            return old.map((slot: any) => {
              if (slot.id !== primarySpaceSlotId) return slot;

              const updatedSubjects = (slot.subject_positions ?? []).map((sp: any) => {
                const aiSubject = blockingResult.subjects.find((s: any) => s.positionId === sp.id);
                if (!aiSubject) return sp;
                const existing = (sp.moment_overrides ?? []).filter((o: any) => o.moment_id !== packageActivityMomentId);
                return {
                  ...sp,
                  moment_overrides: [...existing, {
                    id: -Date.now() - sp.id - i,
                    moment_id: packageActivityMomentId,
                    x: aiSubject.x,
                    y: aiSubject.y,
                    rotation: aiSubject.rotation ?? sp.rotation ?? 0,
                  }],
                };
              });

              const updatedCameras = (slot.camera_positions ?? []).map((cp: any) => {
                const aiCam = blockingResult.cameras?.find((c: any) => c.cameraPositionId === cp.id);
                if (!aiCam) return cp;
                const existing = (cp.moment_overrides ?? []).filter((o: any) => o.moment_id !== packageActivityMomentId);
                return {
                  ...cp,
                  moment_overrides: [...existing, {
                    id: -Date.now() - cp.id - i,
                    moment_id: packageActivityMomentId,
                    x: aiCam.x,
                    y: aiCam.y,
                    rotation: aiCam.rotation ?? cp.rotation ?? 0,
                  }],
                };
              });

              return { ...slot, subject_positions: updatedSubjects, camera_positions: updatedCameras };
            });
          });
        }

        if (blockingResult.momentDescription || blockingResult.durationSeconds) {
          setScenes((prev: any[]) => prev.map((scene: any) => {
            const originalScene = scene.original_scene || scene;
            const moments = originalScene.moments || [];
            const mIdx = moments.findIndex((m: any) => m.id === entry.sceneMomentId);
            if (mIdx === -1) return scene;
            const updated = [...moments];
            updated[mIdx] = {
              ...updated[mIdx],
              ...(blockingResult.momentDescription ? { description: blockingResult.momentDescription } : {}),
              ...(blockingResult.durationSeconds ? { duration: blockingResult.durationSeconds, duration_seconds: blockingResult.durationSeconds } : {}),
            };
            if (scene.original_scene) {
              return { ...scene, original_scene: { ...originalScene, moments: updated } };
            }
            return { ...scene, moments: updated };
          }));
        }
      }
      if (result.failed > 0) {
        console.warn(`[ScenePanel] Scene blocking: ${result.completed}/${result.total} succeeded, ${result.failed} failed`);
      }
    } catch (err) {
      console.error('[ScenePanel] AI scene blocking failed', err);
    } finally {
      setAiBlockingPending(false);
      setSceneBlockingProgress(null);
    }
  }, [
    filmSceneId, primarySpaceSlotId, readOnly, sceneMoments, generateSceneBlocking,
    sceneActivity?.id, setAiBlockingPending, setSceneBlockingProgress, currentBrand?.id,
    queryClient, setScenes,
  ]);

  const isBlocking = aiBlockingPending || generateSceneBlocking.isPending;

  if (!currentScene) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', textAlign: 'center' }}>
          Scrub the playback cursor over a scene to edit scene-level settings
        </Typography>
      </Box>
    );
  }

  const sceneName = (currentScene.name || '').replace(/ - (VIDEO|AUDIO|MUSIC|GRAPHICS)$/i, '') || 'Untitled Scene';

  return (
    <Box sx={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Scene header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.3, flex: 1 }}>
            {sceneName}
          </Typography>
          {primarySpaceSlotId && !readOnly && sceneMoments.length > 0 && (
            <Tooltip
              title={isBlocking ? 'Generating blocking for all moments…' : 'Generate Blocking for all moments'}
              arrow
            >
              <span>
                <IconButton
                  size="small"
                  onClick={isBlocking ? undefined : handleAiBlockScene}
                  disabled={isBlocking}
                  sx={{ p: 0.4, color: '#B388FF', '&:hover': { bgcolor: 'rgba(179,136,255,0.12)' } }}
                >
                  {isBlocking
                    ? <CircularProgress size={14} sx={{ color: '#B388FF' }} />
                    : <AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>

        <TextShimmer active={isBlocking}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
            <AccessTimeRoundedIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
              {formatDuration(sceneTotalDuration)} · {sceneMoments.length} moment{sceneMoments.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          {sceneBlockingProgress && (
            <Typography sx={{ color: 'rgba(179,136,255,0.7)', fontSize: '0.72rem', mt: 0.5 }}>
              Generating blocking {sceneBlockingProgress.current}/{sceneBlockingProgress.total}
              {sceneBlockingProgress.momentName ? ` — ${sceneBlockingProgress.momentName}` : ''}
            </Typography>
          )}
          {momentsDiffer && (
            <Typography sx={{ color: 'rgba(255,180,80,0.65)', fontSize: '0.68rem', mt: 0.5, fontStyle: 'italic' }}>
              Moments have different setups — edits apply to all {sceneMoments.length} moments
            </Typography>
          )}
          {sceneActivity && (sceneActivity as { name?: string }).name && (
            <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', mt: 0.75, fontStyle: 'italic' }}>
              {(sceneActivity as { name?: string }).name}
            </Typography>
          )}
        </TextShimmer>
      </Box>

      {sceneMoments.length === 0 ? (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <MovieFilterRoundedIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.12)', mb: 1 }} />
          <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>
            No moments in this scene yet
          </Typography>
        </Box>
      ) : (equipmentTracks.length > 0 || graphicsTracks.length > 0 || musicTracks.length > 0) && (
        <>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
          <Box>
            <Box sx={{
              display: 'flex', gap: 0.5, p: 0.75, borderRadius: 1.5,
              bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            }}>
              {equipmentTracks.map((track) => {
                const isVideo = track.track_type?.toLowerCase() === 'video';
                const isActive = isVideo ? isVideoTrackAssigned(track.id) : audioTrackIds.includes(track.id);
                const isSelected = selectedId === track.id;
                const trackColor = track.color || (isVideo ? '#5B8DEF' : '#4ECDC4');
                return (
                  <TrackIconButton
                    key={track.id}
                    icon={isVideo ? <VideocamRoundedIcon sx={{ fontSize: 20 }} /> : <MicRoundedIcon sx={{ fontSize: 20 }} />}
                    label={track.name}
                    color={trackColor}
                    isActive={isActive}
                    isSelected={isSelected}
                    onClick={() => setSelectedId(prev => prev === track.id ? null : track.id)}
                    shimmer={isBlocking}
                  />
                );
              })}
              {equipmentTracks.length > 0 && (graphicsTracks.length > 0 || musicTracks.length > 0 || music) && (
                <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 0.25 }} />
              )}
              {graphicsTracks.length > 0 && (
                <TrackIconButton
                  icon={<PaletteRoundedIcon sx={{ fontSize: 20 }} />}
                  label="Graphics"
                  color="#FFAB00"
                  isActive={graphicsEnabled}
                  isSelected={selectedId === 'graphics'}
                  onClick={() => setSelectedId(prev => prev === 'graphics' ? null : 'graphics')}
                />
              )}
              {(musicTracks.length > 0 || music) && (
                <TrackIconButton
                  icon={<MusicNoteRoundedIcon sx={{ fontSize: 20 }} />}
                  label="Music"
                  color="#CE93D8"
                  isActive={!!music}
                  isSelected={selectedId === 'music'}
                  onClick={() => setSelectedId(prev => prev === 'music' ? null : 'music')}
                />
              )}
            </Box>

            {selectedId !== null && (
              <Box sx={{ mt: 1.5, px: 1.5, py: 1.25, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {selectedTrack && selectedIsVideo && (() => {
                  const trackColor = selectedTrack.color || '#5B8DEF';
                  const isEnabled = isVideoTrackAssigned(selectedTrack.id);
                  const assignment = getCameraAssignment(selectedTrack.id);
                  const camIdx = getCameraIdx(selectedTrack.id);
                  return (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <DetailHeader label={selectedTrack.name} color={trackColor} icon={<VideocamRoundedIcon sx={{ fontSize: 15 }} />} noMargin />
                        <Checkbox
                          checked={isEnabled}
                          onChange={() => handleVideoToggle(selectedTrack.id)}
                          disabled={readOnly}
                          size="small"
                          sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 18 }, color: 'rgba(255,255,255,0.25)', '&.Mui-checked': { color: trackColor } }}
                        />
                      </Box>
                      {isEnabled && assignment && camIdx !== -1 ? (
                        <TextShimmer active={isBlocking}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <FormControl fullWidth size="small">
                              <Select
                                value={assignment.shot_type || ''}
                                onChange={(e) => handleShotChange(camIdx, e.target.value as string)}
                                disabled={readOnly}
                                displayEmpty
                                sx={selectSx}
                                MenuProps={menuProps}
                              >
                                <MenuItem value="" sx={{ fontSize: '0.78rem' }}><em>No shot type</em></MenuItem>
                                {SHOT_TYPES.map((st) => (
                                  <MenuItem key={st} value={st} sx={{ fontSize: '0.78rem' }}>{formatShotLabel(st)}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <Typography sx={{ color: trackColor, fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Targeted Subjects ({(assignment.subject_ids || []).length}) — all moments
                            </Typography>
                            <SubjectMultiSelect
                              value={assignment.subject_ids || []}
                              onChange={(ids) => handleSubjectChange(camIdx, ids)}
                              subjects={inheritedSubjects}
                              disabled={readOnly}
                              accentColor={trackColor}
                              shotType={assignment.shot_type}
                            />
                            {assignment.shot_type ? (
                              <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.62rem' }}>
                                {editorialSubjectCapLabel(assignment.shot_type)}
                              </Typography>
                            ) : null}
                            {(assignment.subject_ids || []).length > 0 && (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {(assignment.subject_ids || []).map((sid: number) => (
                                  <Chip
                                    key={sid}
                                    label={getSubjectName(sid)}
                                    size="small"
                                    onDelete={readOnly ? undefined : () => handleSubjectChange(camIdx, (assignment.subject_ids || []).filter(id => id !== sid))}
                                    sx={{
                                      height: 22, fontSize: '0.7rem', fontWeight: 600, color: trackColor,
                                      bgcolor: `${trackColor}14`, border: `1px solid ${trackColor}33`,
                                    }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                        </TextShimmer>
                      ) : !isEnabled ? (
                        <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                          Disabled for all moments in this scene
                        </Typography>
                      ) : null}
                    </>
                  );
                })()}

                {selectedTrack && selectedIsAudio && (() => {
                  const isEnabled = audioTrackIds.includes(selectedTrack.id);
                  const trackColor = selectedTrack.color || '#4ECDC4';
                  return (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <DetailHeader label={selectedTrack.name} color={trackColor} icon={<MicRoundedIcon sx={{ fontSize: 15 }} />} noMargin />
                        <Checkbox
                          checked={isEnabled}
                          onChange={() => handleAudioToggle(selectedTrack.id)}
                          disabled={readOnly}
                          size="small"
                          sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 18 }, color: 'rgba(255,255,255,0.25)', '&.Mui-checked': { color: trackColor } }}
                        />
                      </Box>
                      {isEnabled ? (
                        <SubjectMultiSelect
                          value={audioAssignments.find(a => a.track_id === selectedTrack.id)?.subject_ids || []}
                          onChange={(ids) => handleAudioSubjectChange(selectedTrack.id, ids)}
                          subjects={inheritedSubjects}
                          disabled={readOnly}
                          accentColor={trackColor}
                        />
                      ) : (
                        <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                          Disabled for all moments in this scene
                        </Typography>
                      )}
                    </>
                  );
                })()}

                {selectedId === 'graphics' && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <DetailHeader label="Graphics" color="#FFAB00" icon={<PaletteRoundedIcon sx={{ fontSize: 15 }} />} noMargin />
                      <Checkbox
                        checked={graphicsEnabled}
                        onChange={handleGraphicsToggle}
                        disabled={readOnly}
                        size="small"
                        sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 18 }, color: 'rgba(255,255,255,0.25)', '&.Mui-checked': { color: '#FFAB00' } }}
                      />
                    </Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                      {graphicsEnabled ? 'Graphics overlay enabled for all moments' : 'Graphics overlay disabled for all moments'}
                    </Typography>
                  </>
                )}

                {selectedId === 'music' && (
                  <>
                    <DetailHeader label="Music" color="#CE93D8" icon={<MusicNoteRoundedIcon sx={{ fontSize: 15 }} />} />
                    {music ? (
                      <Box>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 500 }}>
                          {music.music_name || 'Untitled'}
                        </Typography>
                        {music.artist && (
                          <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', mt: 0.25 }}>
                            {music.artist}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                        No music assigned to scene
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default ScenePanel;
