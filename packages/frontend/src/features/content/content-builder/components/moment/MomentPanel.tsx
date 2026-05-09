"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  Box, Typography, Chip, Divider, Select, MenuItem,
  FormControl, Checkbox, ListItemText, TextField, IconButton,
  Tooltip, CircularProgress, keyframes,
} from '@mui/material';
import CenterFocusStrongRoundedIcon from '@mui/icons-material/CenterFocusStrongRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { useQueryClient } from '@tanstack/react-query';
import { useContentBuilder } from '../../context/ContentBuilderContext';
import { useFilmSchedule } from '../../hooks/data';
import { useBrand } from '@/features/platform/brand';
import { scenesApi } from '@/features/content/scenes/api';
import { subjectsApi } from '@/features/content/subjects/api/subjects.api';
import { useSpaceSlotsByActivity, spaceSlotKeys } from '@/features/workflow/locations/hooks/useSpaceSlotSpatial';
import { useGenerateBlocking } from '@/features/ai/blocking/hooks/useGenerateBlocking';
import { useGenerateShotPreview, useCritiquePreview } from '@/features/content/shot-previews/hooks/useShotPreviews';
import type { PrepResult } from '@/features/content/shot-previews/api/shot-previews.api';
import type { SceneSubjectAssignment } from '@/features/content/subjects/types';
import { ShimmerOverlay, TextShimmer } from '../shared/ShimmerOverlay';

/* ─── Constants ─── */

const SHOT_TYPES = [
  "ESTABLISHING_SHOT", "WIDE_SHOT", "MEDIUM_SHOT", "TWO_SHOT",
  "CLOSE_UP", "EXTREME_CLOSE_UP", "DETAIL_SHOT", "REACTION_SHOT",
  "OVER_SHOULDER", "CUTAWAY", "INSERT_SHOT", "MASTER_SHOT",
] as const;

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const formatShotLabel = (value?: string | null): string => {
  if (!value) return 'None';
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

/**
 * Moment Panel — Right side panel (editable)
 * Shows details for the moment at the current playback cursor.
 * Camera shot types and subjects can be edited inline with auto-save.
 */
export const MomentPanel: React.FC = () => {
  const {
    currentMoment, currentScene, tracks, packageSubjects,
    packageActivities, filmId, packageId, scenes, setScenes,
    instanceOwnerType, instanceOwnerId, readOnly,
    setAiBlockingPending,
  } = useContentBuilder();

  const moment = currentMoment;
  const recordingSetup = moment?.recording_setup || (currentScene as any)?.recording_setup || null;

  // Look up the activity linked to the current scene via film schedule
  const { currentBrand } = useBrand();
  const { getSceneSchedule } = useFilmSchedule(filmId ? Number(filmId) : null, currentBrand?.id ?? null, packageId ?? null, instanceOwnerType, instanceOwnerId);

  const sceneActivity = React.useMemo(() => {
    const sceneId = currentScene?.id;
    if (!sceneId || packageActivities.length === 0) return null;
    const schedule = getSceneSchedule(sceneId);
    const activityId = (schedule as any)?.package_activity_id ?? (schedule as any)?.project_activity_id;
    if (!activityId) return null;
    return packageActivities.find((a) => a.id === activityId) ?? null;
  }, [currentScene?.id, packageActivities, getSceneSchedule]);

  // Derive inherited subjects (same filter as useMomentEditorState)
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
    // Deduplicate by name — keep first occurrence (lowest ID)
    const seen = new Set<string>();
    return raw.filter((s) => {
      const key = (s.name || '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [packageSubjects, sceneActivity]);

  const cameraAssignments: Array<{
    id?: number;
    track_id: number;
    track_name?: string;
    subject_ids?: number[];
    shot_type?: string | null;
    enabled?: boolean;
    director_notes?: { emotionalTone: string; compositionNotes: string; source?: string } | null;
  }> = recordingSetup?.camera_assignments || [];
  const audioTrackIds: number[] = recordingSetup?.audio_track_ids || [];
  const audioAssignments: Array<{
    track_id: number;
    subject_ids?: number[];
  }> = recordingSetup?.audio_assignments || [];

  // Split tracks into audio for the toggle list
  const audioTracks = React.useMemo(
    () => tracks.filter((t) => (t.track_type || '').toLowerCase().includes('audio')),
    [tracks],
  );

  const videoTracks = React.useMemo(
    () => tracks.filter((t) => (t.track_type || '').toLowerCase() === 'video')
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })),
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

  // Graphics enabled state from recording setup
  const graphicsEnabled = !!recordingSetup?.graphics_enabled;

  // Which equipment icon is selected to show its detail panel
  // (state moved to after equipmentTracks computation below)

  // Editable moment name
  const [editingName, setEditingName] = React.useState(false);
  const [nameValue, setNameValue] = React.useState('');

  const handleNameEdit = () => {
    setNameValue(moment?.name || '');
    setEditingName(true);
  };

  const handleNameSave = async () => {
    if (!moment?.id || readOnly) return;
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== moment.name) {
      try {
        await scenesApi.moments.update(moment.id, { name: trimmed });
        // Update local state
        setScenes((prev: any[]) => prev.map((scene: any) => {
          const originalScene = scene.original_scene || scene;
          const moments = originalScene.moments || [];
          const momentIdx = moments.findIndex((m: any) => m.id === moment.id);
          if (momentIdx === -1) return scene;
          const updatedMoments = [...moments];
          updatedMoments[momentIdx] = { ...updatedMoments[momentIdx], name: trimmed };
          if (scene.original_scene) {
            return { ...scene, original_scene: { ...originalScene, moments: updatedMoments }, moments: updatedMoments };
          }
          return { ...scene, moments: updatedMoments };
        }));
      } catch (err) {
        console.error('[MomentPanel] Failed to save name', err);
      }
    }
    setEditingName(false);
  };

  // Editable moment description
  const [editingDescription, setEditingDescription] = React.useState(false);
  const [descriptionValue, setDescriptionValue] = React.useState('');

  const handleDescriptionEdit = () => {
    setDescriptionValue(moment?.description || '');
    setEditingDescription(true);
  };

  const handleDescriptionSave = async () => {
    if (!moment?.id || readOnly) return;
    const trimmed = descriptionValue.trim();
    if (trimmed !== (moment.description || '')) {
      try {
        await scenesApi.moments.update(moment.id, { description: trimmed || undefined });
        setScenes((prev: any[]) => prev.map((scene: any) => {
          const originalScene = scene.original_scene || scene;
          const moments = originalScene.moments || [];
          const momentIdx = moments.findIndex((m: any) => m.id === moment.id);
          if (momentIdx === -1) return scene;
          const updatedMoments = [...moments];
          updatedMoments[momentIdx] = { ...updatedMoments[momentIdx], description: trimmed || null };
          if (scene.original_scene) {
            return { ...scene, original_scene: { ...originalScene, moments: updatedMoments }, moments: updatedMoments };
          }
          return { ...scene, moments: updatedMoments };
        }));
      } catch (err) {
        console.error('[MomentPanel] Failed to save description', err);
      }
    }
    setEditingDescription(false);
  };

  const getTrackName = (trackId: number, fallback?: string) => {
    const track = tracks.find((t) => t.id === trackId);
    return track?.name || fallback || `Track ${trackId}`;
  };

  const getSubjectName = (subjectId: number): string => {
    // PackageDaySubject lookup (direct — subject_ids now reference PackageDaySubject)
    const pkg = (packageSubjects || []).find((s: any) => s.id === subjectId);
    if ((pkg as any)?.name) return (pkg as any).name;
    // Fallback: check moment subject assignment
    const ms = momentSubjects.find((m) => m.subject_id === subjectId);
    if (ms?.subject?.name) return ms.subject.name;
    return `Subject ${subjectId}`;
  };

  const momentMusic = moment?.moment_music || moment?.music || null;
  const sceneMusic = (currentScene as any)?.scene_music || null;
  const music = momentMusic || sceneMusic;

  // ─── Moment-subject action descriptions ────────────────────────────────
  const [momentSubjects, setMomentSubjects] = React.useState<SceneSubjectAssignment[]>([]);
  const [actionDrafts, setActionDrafts] = React.useState<Record<number, string>>({});

  React.useEffect(() => {
    if (!moment?.id) { setMomentSubjects([]); return; }
    let cancelled = false;
    subjectsApi.getMomentSubjects(moment.id).then((data) => {
      if (!cancelled) {
        setMomentSubjects(data);
        const drafts: Record<number, string> = {};
        for (const ms of data) {
          drafts[ms.subject_id] = ms.action_description || '';
        }
        setActionDrafts(drafts);
      }
    }).catch(() => {/* ignore */});
    return () => { cancelled = true; };
  }, [moment?.id]);

  // Map PackageSubject IDs (camera assignments) → moment subject IDs
  // Now that FilmSceneMomentSubject.subject_id points directly to PackageDaySubject,
  // this is an identity mapping — kept only for action description lookups.
  const momentSubjectIds = React.useMemo(() => {
    return new Set(momentSubjects.map(ms => ms.subject_id));
  }, [momentSubjects]);

  const handleActionBlur = React.useCallback(async (subjectId: number) => {
    if (!moment?.id || readOnly) return;
    const value = actionDrafts[subjectId] ?? '';
    const existing = momentSubjects.find(ms => ms.subject_id === subjectId);
    if (existing && (existing.action_description || '') === value) return;
    try {
      await subjectsApi.updateMomentAssignment(moment.id, subjectId, {
        action_description: value || null,
      });
      setMomentSubjects(prev => prev.map(ms =>
        ms.subject_id === subjectId ? { ...ms, action_description: value || null } : ms,
      ));
    } catch (err) {
      console.error('[MomentPanel] Failed to save action description', err);
    }
  }, [moment?.id, readOnly, actionDrafts, momentSubjects]);

  // ─── AI Blocking Director + Shot Prep ────────────────────────────────
  const queryClient = useQueryClient();
  const { data: spaceSlots } = useSpaceSlotsByActivity(sceneActivity?.id ?? undefined);
  const primarySpaceSlotId = spaceSlots?.[0]?.id ?? null;
  const generateBlocking = useGenerateBlocking();
  const generateShotPreview = useGenerateShotPreview();
  const critiquePreview = useCritiquePreview();
  const [directorNotes, setDirectorNotes] = React.useState<Record<number, PrepResult['director']>>({});

  // Hydrate director notes from persisted pipeline_data on camera assignments
  React.useEffect(() => {
    const notes: Record<number, PrepResult['director']> = {};
    for (const cam of cameraAssignments) {
      if (cam.id && cam.director_notes) {
        notes[cam.id] = {
          subjects: [],
          ...cam.director_notes,
        };
      }
    }
    if (Object.keys(notes).length > 0) {
      setDirectorNotes(notes);
    }
  }, [moment?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Optimistic local update — applies immediately so playback screen reflects changes
  const updateScenesLocally = React.useCallback((
    momentId: number,
    data: {
      camera_assignments: Array<{ track_id: number; subject_ids?: number[]; shot_type?: string | null; enabled?: boolean }>;
      audio_track_ids: number[];
      audio_assignments?: Array<{ track_id: number; subject_ids?: number[] }>;
      graphics_enabled?: boolean;
      graphics_title?: string;
    }
  ) => {
    setScenes((prev: any[]) => prev.map((scene: any) => {
      const originalScene = scene.original_scene || scene;
      const moments = originalScene.moments || [];
      const momentIdx = moments.findIndex((m: any) => m.id === momentId);
      if (momentIdx === -1) return scene;

      // Merge new camera data into existing assignments, preserving backend fields
      // (id, track_type, track_name, etc.) that the PlaybackScreen needs
      const existingCameras: any[] = moments[momentIdx].recording_setup?.camera_assignments || [];
      const mergedCameras = data.camera_assignments.map(newCam => {
        const existing = existingCameras.find((e: any) => e.track_id === newCam.track_id);
        if (existing) {
          // Merge: keep backend fields (id, track_type, track_name), update editable fields
          return { ...existing, subject_ids: newCam.subject_ids, shot_type: newCam.shot_type, enabled: newCam.enabled };
        }
        // New assignment — look up track_type from tracks list so PlaybackScreen filters correctly
        const track = tracks.find(t => t.id === newCam.track_id);
        return { ...newCam, track_type: track?.track_type || 'video' };
      });

      // Merge audio assignments similarly
      const existingAudio: any[] = moments[momentIdx].recording_setup?.audio_assignments || [];
      const mergedAudioAssignments = (data.audio_assignments ?? []).map(newAudio => {
        const existing = existingAudio.find((e: any) => e.track_id === newAudio.track_id);
        return existing ? { ...existing, subject_ids: newAudio.subject_ids } : newAudio;
      });

      const updatedMoments = [...moments];
      updatedMoments[momentIdx] = {
        ...updatedMoments[momentIdx],
        recording_setup: {
          ...updatedMoments[momentIdx].recording_setup,
          camera_assignments: mergedCameras,
          audio_track_ids: data.audio_track_ids,
          audio_assignments: mergedAudioAssignments,
          ...(data.graphics_enabled !== undefined && { graphics_enabled: data.graphics_enabled }),
          ...(data.graphics_title !== undefined && { graphics_title: data.graphics_title }),
        },
        has_recording_setup: true,
      };

      if (scene.original_scene) {
        return { ...scene, original_scene: { ...originalScene, moments: updatedMoments }, moments: updatedMoments };
      }
      return { ...scene, moments: updatedMoments };
    }));
  }, [setScenes, tracks]);

  const handleAiBlock = React.useCallback(async () => {
    if (!moment?.id || !primarySpaceSlotId || readOnly) return;
    setAiBlockingPending(true);
    try {
      const result = await generateBlocking.mutateAsync({
        sceneMomentId: moment.id,
        spaceSlotId: primarySpaceSlotId,
        activityId: sceneActivity?.id,
      });

      // Update local drafts with AI-generated action descriptions
      const newDrafts: Record<number, string> = { ...actionDrafts };
      for (const s of result.subjects) {
        if (s.daySubjectId) {
          newDrafts[s.daySubjectId] = s.actionDescription;
        }
      }
      setActionDrafts(newDrafts);

      // Optimistically inject camera + subject moment overrides into the
      // space-slot query cache so the floorplan updates in real-time.
      // SpaceSlotMomentSubject / SpaceSlotMomentCamera are FK'd to
      // PackageActivityMoment, not SceneMoment — use that FK here so the
      // optimistic rows match what the backend later returns.
      const packageActivityMomentId: number | null =
        (moment as any)?.package_activity_moment_id ?? null;
      const brandId = String(currentBrand?.id ?? '');
      const actId = sceneActivity?.id;
      if (actId && brandId && packageActivityMomentId) {
        const cacheKey = spaceSlotKeys.byActivity(brandId, actId);
        queryClient.setQueryData(cacheKey, (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.map((slot: any) => {
            if (slot.id !== primarySpaceSlotId) return slot;

            // Inject subject overrides
            const updatedSubjects = (slot.subject_positions ?? []).map((sp: any) => {
              const aiSubject = result.subjects.find((s: any) => s.positionId === sp.id);
              if (!aiSubject) return sp;
              const existing = (sp.moment_overrides ?? []).filter((o: any) => o.moment_id !== packageActivityMomentId);
              return {
                ...sp,
                moment_overrides: [...existing, {
                  id: -Date.now() - sp.id, // temp id
                  moment_id: packageActivityMomentId,
                  x: aiSubject.x,
                  y: aiSubject.y,
                  rotation: aiSubject.rotation ?? sp.rotation ?? 0,
                }],
              };
            });

            // Inject camera overrides
            const updatedCameras = (slot.camera_positions ?? []).map((cp: any) => {
              const aiCam = result.cameras?.find((c: any) => c.cameraPositionId === cp.id);
              if (!aiCam) return cp;
              const existing = (cp.moment_overrides ?? []).filter((o: any) => o.moment_id !== packageActivityMomentId);
              return {
                ...cp,
                moment_overrides: [...existing, {
                  id: -Date.now() - cp.id, // temp id
                  moment_id: packageActivityMomentId,
                  x: aiCam.x,
                  y: aiCam.y,
                  rotation: aiCam.rotation ?? cp.rotation ?? 0,
                }],
              };
            });

            return {
              ...slot,
              subject_positions: updatedSubjects,
              camera_positions: updatedCameras,
            };
          });
        });
      }

      // Optimistically update the moment's description + duration in scenes state
      if (result.momentDescription || result.durationSeconds) {
        setScenes((prev: any[]) => prev.map((scene: any) => {
          const originalScene = scene.original_scene || scene;
          const moments = originalScene.moments || [];
          const mIdx = moments.findIndex((m: any) => m.id === moment!.id);
          if (mIdx === -1) return scene;
          const updated = [...moments];
          updated[mIdx] = {
            ...updated[mIdx],
            ...(result.momentDescription ? { description: result.momentDescription } : {}),
            ...(result.durationSeconds ? { duration: result.durationSeconds, duration_seconds: result.durationSeconds } : {}),
          };
          if (scene.original_scene) {
            return { ...scene, original_scene: { ...originalScene, moments: updated } };
          }
          return { ...scene, moments: updated };
        }));
      }

      // Refresh moment subjects to get updated data
      subjectsApi.getMomentSubjects(moment.id).then(setMomentSubjects).catch(() => {});

      console.log('[MomentPanel] AI blocking complete');
    } catch (err) {
      console.error('[MomentPanel] AI blocking failed', err);
    } finally {
      setAiBlockingPending(false);
    }
  }, [moment?.id, primarySpaceSlotId, readOnly, sceneActivity?.id, actionDrafts, generateBlocking, queryClient, currentBrand?.id, filmId, recordingSetup, setAiBlockingPending, cameraAssignments, audioTrackIds, audioAssignments, updateScenesLocally]);

  // ─── Auto-save debounce ────────────────────────────────────────────────
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const momentIdRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    momentIdRef.current = moment?.id ?? null;
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [moment?.id]);

  // Persist to backend (fire-and-forget, local state already updated)
  const persistRecordingSetup = React.useCallback(async (
    momentId: number,
    data: {
      camera_assignments: Array<{ track_id: number; subject_ids?: number[]; shot_type?: string | null; enabled?: boolean }>;
      audio_track_ids: number[];
      audio_assignments?: Array<{ track_id: number; subject_ids?: number[] }>;
      graphics_enabled?: boolean;
      graphics_title?: string;
    }
  ) => {
    try {
      await scenesApi.moments.upsertRecordingSetup(momentId, data);
    } catch (err) {
      console.error('[MomentPanel] Failed to save recording setup', err);
    }
  }, []);

  // Update local state immediately, debounce the API call
  const debouncedSave = React.useCallback((
    momentId: number,
    data: Parameters<typeof persistRecordingSetup>[1] & {
      camera_assignments: Array<{ track_id: number; subject_ids?: number[]; shot_type?: string | null; enabled?: boolean }>;
    }
  ) => {
    // Optimistic update — keeps ALL cameras so toggling back restores data
    updateScenesLocally(momentId, data);
    // API persistence — send all cameras with their enabled state
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (momentIdRef.current === momentId) {
        persistRecordingSetup(momentId, data);
      }
    }, 600);
  }, [updateScenesLocally, persistRecordingSetup]);

  const buildPayloadAndSave = React.useCallback((
    overrideCamIdx: number,
    patch: { shot_type?: string | null; subject_ids?: number[] }
  ) => {
    if (!moment?.id || readOnly) return;
    const currentCameras = [...cameraAssignments];
    currentCameras[overrideCamIdx] = { ...currentCameras[overrideCamIdx], ...patch };
    debouncedSave(moment.id, {
      camera_assignments: currentCameras.map(c => ({
        track_id: c.track_id,
        subject_ids: c.subject_ids || [],
        shot_type: c.shot_type || null,
        enabled: c.enabled !== false,
      })),
      audio_track_ids: audioTrackIds,
      audio_assignments: audioAssignments.map(a => ({
        track_id: a.track_id,
        subject_ids: a.subject_ids || [],
      })),
    });
  }, [moment?.id, readOnly, cameraAssignments, audioTrackIds, audioAssignments, debouncedSave]);

  const handleShotChange = (camIdx: number, value: string) => {
    buildPayloadAndSave(camIdx, { shot_type: value || null });
  };

  const handleSubjectChange = (camIdx: number, value: number[]) => {
    buildPayloadAndSave(camIdx, { subject_ids: value });
  };

  const handleVideoToggle = (trackId: number) => {
    if (!moment?.id || readOnly) return;
    const existing = cameraAssignments.find(a => a.track_id === trackId);
    let newCameras;
    if (existing) {
      // Soft-toggle: flip enabled flag, preserving all shot/subject data
      newCameras = cameraAssignments.map(a =>
        a.track_id === trackId ? { ...a, enabled: a.enabled === false ? true : false } : a
      );
    } else {
      // Brand new assignment
      newCameras = [...cameraAssignments, { track_id: trackId, subject_ids: [] as number[], shot_type: null as string | null, enabled: true }];
    }
    debouncedSave(moment.id, {
      camera_assignments: newCameras.map(c => ({
        track_id: c.track_id,
        subject_ids: c.subject_ids || [],
        shot_type: c.shot_type || null,
        enabled: c.enabled !== false,
      })),
      audio_track_ids: audioTrackIds,
      audio_assignments: audioAssignments.map(a => ({
        track_id: a.track_id,
        subject_ids: a.subject_ids || [],
      })),
    });
  };

  const handleAudioToggle = (trackId: number) => {
    if (!moment?.id || readOnly) return;
    const isEnabled = audioTrackIds.includes(trackId);
    const newAudioIds = isEnabled
      ? audioTrackIds.filter((id) => id !== trackId)
      : [...audioTrackIds, trackId];
    const newAudioAssignments = isEnabled
      ? audioAssignments.filter(a => a.track_id !== trackId)
      : [...audioAssignments, { track_id: trackId, subject_ids: [] as number[] }];
    debouncedSave(moment.id, {
      camera_assignments: cameraAssignments.map(c => ({
        track_id: c.track_id,
        subject_ids: c.subject_ids || [],
        shot_type: c.shot_type || null,
        enabled: c.enabled !== false,
      })),
      audio_track_ids: newAudioIds,
      audio_assignments: newAudioAssignments.map(a => ({
        track_id: a.track_id,
        subject_ids: a.subject_ids || [],
      })),
    });
  };

  const handleAudioSubjectChange = (trackId: number, subjectIds: number[]) => {
    if (!moment?.id || readOnly) return;
    const newAudioAssignments = audioAssignments.map(a =>
      a.track_id === trackId ? { ...a, subject_ids: subjectIds } : a
    );
    if (!newAudioAssignments.find(a => a.track_id === trackId)) {
      newAudioAssignments.push({ track_id: trackId, subject_ids: subjectIds });
    }
    debouncedSave(moment.id, {
      camera_assignments: cameraAssignments.map(c => ({
        track_id: c.track_id,
        subject_ids: c.subject_ids || [],
        shot_type: c.shot_type || null,
        enabled: c.enabled !== false,
      })),
      audio_track_ids: audioTrackIds,
      audio_assignments: newAudioAssignments.map(a => ({
        track_id: a.track_id,
        subject_ids: a.subject_ids || [],
      })),
    });
  };

  const handleGraphicsToggle = () => {
    if (!moment?.id || readOnly) return;
    const newEnabled = !graphicsEnabled;
    debouncedSave(moment.id, {
      camera_assignments: cameraAssignments.map(c => ({
        track_id: c.track_id,
        subject_ids: c.subject_ids || [],
        shot_type: c.shot_type || null,
        enabled: c.enabled !== false,
      })),
      audio_track_ids: audioTrackIds,
      audio_assignments: audioAssignments.map(a => ({
        track_id: a.track_id,
        subject_ids: a.subject_ids || [],
      })),
      graphics_enabled: newEnabled,
    });
  };

  // Check if a video track has an active (enabled) assignment in this moment
  const isVideoTrackAssigned = (trackId: number) => {
    const a = cameraAssignments.find(c => c.track_id === trackId);
    return !!a && a.enabled !== false;
  };

  // Get the camera assignment for a specific track
  const getCameraAssignment = (trackId: number) =>
    cameraAssignments.find(a => a.track_id === trackId);

  const getCameraIdx = (trackId: number) =>
    cameraAssignments.findIndex(a => a.track_id === trackId);

  // All equipment tracks (video + audio) for the icon grid
  const equipmentTracks = React.useMemo(
    () => [...videoTracks, ...audioTracks],
    [videoTracks, audioTracks],
  );

  // Selection can be a track id, or 'graphics' / 'music'
  type SelectionId = number | 'graphics' | 'music';
  const [selectedId, setSelectedId] = React.useState<SelectionId | null>(null);

  // Auto-select first equipment track on moment change
  React.useEffect(() => {
    setSelectedId(null);
    setEditingName(false);
  }, [moment?.id]);

  React.useEffect(() => {
    if (moment && selectedId === null && equipmentTracks.length > 0) {
      setSelectedId(equipmentTracks[0].id);
    }
  }, [moment, selectedId, equipmentTracks]);

  const selectedTrack = typeof selectedId === 'number' ? tracks.find(t => t.id === selectedId) : null;
  const selectedIsVideo = selectedTrack?.track_type?.toLowerCase() === 'video';
  const selectedIsAudio = selectedTrack?.track_type?.toLowerCase() === 'audio';

  const handleIconClick = (id: SelectionId) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  return (
    <Box sx={{
      width: "35%",
      minWidth: "320px",
      maxWidth: "480px",
      flexShrink: 0,
      borderLeft: "1px solid rgba(255,255,255,0.08)",
      background: "#0d0d0d",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
    }}>
      {/* Panel Header */}
      <Box sx={{
        px: 2,
        py: 1.5,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        bgcolor: "#111",
        flexShrink: 0,
        gap: 1.5,
      }}>
        <Box sx={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0, pt: 0.25 }}>
          Moment
        </Box>
      </Box>

      {/* Panel Content */}
      <Box sx={{
        flex: 1,
        overflow: "auto",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}>
        {!moment ? (
          /* Empty state */
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            py: 4,
          }}>
            <CenterFocusStrongRoundedIcon sx={{ fontSize: 32, color: 'rgba(255,255,255,0.15)' }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', textAlign: 'center' }}>
              Scrub the playback cursor over a moment to view details
            </Typography>
          </Box>
        ) : (
          <>
            {/* ─── Editable Moment Name + Duration ─── */}
            <Box>
              {editingName ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TextField
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNameSave();
                      if (e.key === 'Escape') setEditingName(false);
                    }}
                    autoFocus
                    size="small"
                    variant="standard"
                    sx={{
                      flex: 1,
                      '& .MuiInput-input': {
                        color: '#fff', fontSize: '0.95rem', fontWeight: 600, py: 0,
                      },
                      '& .MuiInput-underline:before': { borderColor: 'rgba(255,255,255,0.2)' },
                      '& .MuiInput-underline:after': { borderColor: '#7B61FF' },
                    }}
                  />
                  <IconButton size="small" onClick={handleNameSave} sx={{ color: '#4ECDC4', p: 0.25 }}>
                    <CheckRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{
                    color: '#fff',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    lineHeight: 1.3,
                    flex: 1,
                    cursor: readOnly ? 'default' : 'text',
                    borderBottom: readOnly ? 'none' : '1px solid transparent',
                    transition: 'border-color 0.15s',
                    '&:hover': readOnly ? {} : { borderBottomColor: 'rgba(255,255,255,0.2)' },
                    borderRadius: 0,
                    pb: 0.25,
                  }}
                    onClick={readOnly ? undefined : handleNameEdit}
                  >
                    {moment.name || 'Untitled Moment'}
                  </Typography>
                  {primarySpaceSlotId && !readOnly && (
                    <Tooltip title={generateBlocking.isPending ? 'Generating blocking…' : 'Generate Blocking'} arrow>
                      <span>
                        <IconButton
                          size="small"
                          onClick={generateBlocking.isPending ? undefined : handleAiBlock}
                          disabled={generateBlocking.isPending}
                          sx={{
                            p: 0.4,
                            color: '#B388FF',
                            '&:hover': { bgcolor: 'rgba(179,136,255,0.12)' },
                          }}
                        >
                          {generateBlocking.isPending
                            ? <CircularProgress size={14} sx={{ color: '#B388FF' }} />
                            : <AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Box>
              )}
              <TextShimmer active={generateBlocking.isPending}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                  <AccessTimeRoundedIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                    {formatDuration(moment.duration || moment.duration_seconds || 0)}
                  </Typography>
                </Box>
                {editingDescription ? (
                  <Box sx={{ mt: 0.75 }}>
                    <TextField
                      value={descriptionValue}
                      onChange={(e) => setDescriptionValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditingDescription(false);
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleDescriptionSave(); }
                      }}
                      onBlur={handleDescriptionSave}
                      autoFocus
                      multiline
                      maxRows={5}
                      size="small"
                      variant="standard"
                      placeholder="Add a description…"
                      sx={{
                        width: '100%',
                        '& .MuiInput-input': {
                          color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', lineHeight: 1.4, fontStyle: 'italic',
                        },
                        '& .MuiInput-underline:before': { borderColor: 'rgba(255,255,255,0.15)' },
                        '& .MuiInput-underline:after': { borderColor: '#7B61FF' },
                      }}
                    />
                  </Box>
                ) : (
                  <Tooltip title="Generated by cinematography director" placement="top" arrow disableHoverListener={!moment.description}>
                  <Typography
                    onClick={readOnly ? undefined : handleDescriptionEdit}
                    sx={{
                      color: moment.description ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.25)',
                      fontSize: '0.78rem',
                      lineHeight: 1.4,
                      mt: 0.75,
                      fontStyle: 'italic',
                      cursor: readOnly ? 'default' : 'text',
                      borderBottom: readOnly ? 'none' : '1px solid transparent',
                      transition: 'border-color 0.15s',
                      '&:hover': readOnly ? {} : { borderBottomColor: 'rgba(255,255,255,0.15)' },
                      pb: 0.25,
                      borderRadius: 0,
                    }}
                  >
                    {moment.description || (readOnly ? '' : 'Add a description…')}
                  </Typography>
                  </Tooltip>
                )}
              </TextShimmer>
            </Box>

            {/* ─── Track Icon Grid ─── */}
            {(equipmentTracks.length > 0 || graphicsTracks.length > 0 || musicTracks.length > 0) && (
              <>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <Box>
                  {/* Icon row */}
                  <Box sx={{
                    display: 'flex',
                    gap: 0.5,
                    p: 0.75,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    {/* Equipment icons (cameras + mics) */}
                    {equipmentTracks.map((track) => {
                      const isVideo = track.track_type?.toLowerCase() === 'video';
                      const isActive = isVideo
                        ? isVideoTrackAssigned(track.id)
                        : audioTrackIds.includes(track.id);
                      const isSelected = selectedId === track.id;
                      const trackColor = track.color || (isVideo ? '#5B8DEF' : '#4ECDC4');

                      return (
                        <TrackIconButton
                          key={track.id}
                          icon={isVideo
                            ? <VideocamRoundedIcon sx={{ fontSize: 20 }} />
                            : <MicRoundedIcon sx={{ fontSize: 20 }} />}
                          label={track.name}
                          color={trackColor}
                          isActive={isActive}
                          isSelected={isSelected}
                          onClick={() => handleIconClick(track.id)}
                          shimmer={generateBlocking.isPending}
                        />
                      );
                    })}

                    {/* Separator between equipment and media */}
                    {equipmentTracks.length > 0 && (graphicsTracks.length > 0 || musicTracks.length > 0 || music) && (
                      <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 0.25 }} />
                    )}

                    {/* Graphics icon */}
                    {graphicsTracks.length > 0 && (
                      <TrackIconButton
                        icon={<PaletteRoundedIcon sx={{ fontSize: 20 }} />}
                        label="Graphics"
                        color="#FFAB00"
                        isActive={graphicsEnabled}
                        isSelected={selectedId === 'graphics'}
                        onClick={() => handleIconClick('graphics')}
                      />
                    )}

                    {/* Music icon */}
                    {(musicTracks.length > 0 || music) && (
                      <TrackIconButton
                        icon={<MusicNoteRoundedIcon sx={{ fontSize: 20 }} />}
                        label="Music"
                        color="#CE93D8"
                        isActive={!!music}
                        isSelected={selectedId === 'music'}
                        onClick={() => handleIconClick('music')}
                      />
                    )}
                  </Box>

                  {/* ─── Detail Panel for selected icon ─── */}
                  {selectedId !== null && (
                    <Box sx={{
                      mt: 1.5,
                      px: 1.5, py: 1.25,
                      borderRadius: 1.5,
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      {/* Video track detail */}
                      {selectedTrack && selectedIsVideo && (() => {
                        const trackColor = selectedTrack.color || '#5B8DEF';
                        const isEnabled = isVideoTrackAssigned(selectedTrack.id);
                        const assignment = getCameraAssignment(selectedTrack.id);
                        const camIdx = getCameraIdx(selectedTrack.id);
                        return (
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <DetailHeader
                                label={selectedTrack.name}
                                color={trackColor}
                                icon={<VideocamRoundedIcon sx={{ fontSize: 15 }} />}
                                noMargin
                              />
                              <Checkbox
                                checked={isEnabled}
                                onChange={() => handleVideoToggle(selectedTrack.id)}
                                disabled={readOnly}
                                size="small"
                                sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 18 }, color: 'rgba(255,255,255,0.25)', '&.Mui-checked': { color: trackColor } }}
                              />
                            </Box>
                            {isEnabled && assignment && camIdx !== -1 ? (
                              <>
                                <TextShimmer active={generateBlocking.isPending}>
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
                                    {/* Targeted Subjects Section */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                      <Typography sx={{ color: trackColor, fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        🎯 Targeted Subjects ({(assignment.subject_ids || []).length})
                                      </Typography>

                                      {/* Subject selector */}
                                      <SubjectMultiSelect
                                        value={assignment.subject_ids || []}
                                        onChange={(ids) => handleSubjectChange(camIdx, ids)}
                                        subjects={inheritedSubjects}
                                        getSubjectName={getSubjectName}
                                        disabled={readOnly}
                                        accentColor={trackColor}
                                      />

                                      {/* Subject chips row */}
                                      {(assignment.subject_ids || []).length > 0 && (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                          {(assignment.subject_ids || []).map((sid: number) => {
                                            const subjectName = getSubjectName(sid);
                                            return (
                                              <Chip
                                                key={sid}
                                                label={subjectName}
                                                size="small"
                                                onDelete={readOnly ? undefined : () => handleSubjectChange(camIdx, (assignment.subject_ids || []).filter(id => id !== sid))}
                                                sx={{
                                                  height: 22,
                                                  fontSize: '0.7rem',
                                                  fontWeight: 600,
                                                  color: trackColor,
                                                  bgcolor: `${trackColor}14`,
                                                  border: `1px solid ${trackColor}33`,
                                                  '& .MuiChip-deleteIcon': { color: `${trackColor}66`, fontSize: 14, '&:hover': { color: trackColor } },
                                                }}
                                              />
                                            );
                                          })}
                                        </Box>
                                      )}

                                      {/* Subject action descriptions */}
                                      {(assignment.subject_ids || []).length > 0 && (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                          {(assignment.subject_ids || []).map((sid: number) => {
                                            const hasMomentEntry = momentSubjectIds.has(sid);
                                            const subjectName = getSubjectName(sid);
                                            return (
                                              <Box key={sid} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 500 }}>
                                                  {subjectName}
                                                </Typography>
                                                <Tooltip title="Generated by moment actions" placement="top" arrow disableHoverListener={!actionDrafts[sid]}>
                                                  <TextField
                                                    size="small"
                                                    placeholder="e.g. standing at lectern, reading from book"
                                                    value={hasMomentEntry ? (actionDrafts[sid] ?? '') : ''}
                                                    onChange={(e) => { if (hasMomentEntry) setActionDrafts(prev => ({ ...prev, [sid]: e.target.value })); }}
                                                    onBlur={() => { if (hasMomentEntry) handleActionBlur(sid); }}
                                                    disabled={readOnly}
                                                    multiline
                                                    maxRows={2}
                                                    sx={{
                                                      '& .MuiInputBase-root': { fontSize: '0.7rem', color: '#fff', bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 0.75 },
                                                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
                                                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                                                      '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                                                    }}
                                                  />
                                                </Tooltip>
                                              </Box>
                                            );
                                          })}
                                        </Box>
                                      )}

                                      {(assignment.subject_ids || []).length === 0 && (
                                        <Typography sx={{ color: `${trackColor}66`, fontSize: '0.7rem', fontStyle: 'italic', py: 1 }}>
                                          No subjects targeted yet. Add one below.
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                </TextShimmer>

                                {/* ─── AI Composition Notes ─── */}
                                {(() => {
                                  const cam = cameraAssignments.find(c => c.track_id === selectedTrack.id);
                                  const notes = cam?.id ? directorNotes[cam.id] : undefined;
                                  if (!notes?.compositionNotes) return null;
                                  return (
                                    <Box sx={{ mt: 1, px: 0.75, py: 0.5, borderRadius: 0.75, bgcolor: 'rgba(179,136,255,0.05)', border: '1px solid rgba(179,136,255,0.1)' }}>
                                      <Tooltip title={`Generated by ${(notes.source || 'shot-director').replace(/-/g, ' ')}`} placement="top" arrow>
                                        <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4, cursor: 'default' }}>
                                          {notes.compositionNotes}
                                        </Typography>
                                      </Tooltip>
                                    </Box>
                                  );
                                })()}
                              </>
                            ) : !isEnabled ? (
                              <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                Disabled for this moment
                              </Typography>
                            ) : null}
                          </>
                        );
                      })()}

                      {/* Audio track detail */}
                      {selectedTrack && selectedIsAudio && (() => {
                        const isEnabled = audioTrackIds.includes(selectedTrack.id);
                        const trackColor = selectedTrack.color || '#4ECDC4';
                        return (
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <DetailHeader
                                label={selectedTrack.name}
                                color={trackColor}
                                icon={<MicRoundedIcon sx={{ fontSize: 15 }} />}
                                noMargin
                              />
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
                                getSubjectName={getSubjectName}
                                disabled={readOnly}
                                accentColor={trackColor}
                              />
                            ) : (
                              <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                Disabled for this moment
                              </Typography>
                            )}
                          </>
                        );
                      })()}

                      {/* Graphics detail */}
                      {selectedId === 'graphics' && (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <DetailHeader
                              label="Graphics"
                              color="#FFAB00"
                              icon={<PaletteRoundedIcon sx={{ fontSize: 15 }} />}
                              noMargin
                            />
                            <Checkbox
                              checked={graphicsEnabled}
                              onChange={handleGraphicsToggle}
                              disabled={readOnly}
                              size="small"
                              sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 18 }, color: 'rgba(255,255,255,0.25)', '&.Mui-checked': { color: '#FFAB00' } }}
                            />
                          </Box>
                          <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                            {graphicsEnabled ? 'Graphics overlay enabled' : 'Graphics overlay disabled'}
                          </Typography>
                        </>
                      )}

                      {/* Music detail */}
                      {selectedId === 'music' && (
                        <>
                          <DetailHeader
                            label="Music"
                            color="#CE93D8"
                            icon={<MusicNoteRoundedIcon sx={{ fontSize: 15 }} />}
                          />
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
                              No music assigned
                            </Typography>
                          )}
                        </>
                      )}
                    </Box>
                  )}
                </Box>
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

/* ─── Helper Components ─── */

const selectSx = {
  height: 34, fontSize: '0.8rem',
  color: 'rgba(255,255,255,0.8)',
  bgcolor: 'rgba(255,255,255,0.04)',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
  '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.3)' },
};

const menuProps = { PaperProps: { sx: { bgcolor: '#1a1a1a', maxHeight: 280 } } };

const iconPulse = keyframes`
  0%, 100% { opacity: 0.45; transform: scale(1); filter: drop-shadow(0 0 0px transparent); }
  50% { opacity: 1; transform: scale(1.18); filter: drop-shadow(0 0 8px currentColor); }
`;

const TrackIconButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  color: string;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
  shimmer?: boolean;
}> = ({ icon, label, color, isActive, isSelected, onClick, shimmer }) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0.5,
      px: 1,
      py: 0.75,
      borderRadius: 1,
      cursor: 'pointer',
      flex: 1,
      minWidth: 0,
      bgcolor: isSelected ? `${color}18` : 'transparent',
      transition: 'all 0.12s ease',
      position: 'relative',
      '&:hover': { bgcolor: `${color}12` },
      // Bottom indicator for selected state
      '&::after': isSelected ? {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: '20%',
        right: '20%',
        height: 2,
        borderRadius: 1,
        bgcolor: color,
      } : {},
    }}
  >
    <Box sx={{
      color: isActive || shimmer ? color : 'rgba(255,255,255,0.2)',
      display: 'flex',
      transition: 'color 0.12s',
      opacity: isActive ? 1 : 0.5,
      ...(shimmer && {
        opacity: 1,
        animation: `${iconPulse} 1.5s ease-in-out infinite`,
      }),
    }}>
      {icon}
    </Box>
    <Typography sx={{
      fontSize: '0.6rem',
      color: isSelected ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.3)',
      fontWeight: isSelected ? 600 : 400,
      textAlign: 'center',
      lineHeight: 1.1,
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      ...(shimmer && {
        animation: `${iconPulse} 1.8s ease-in-out infinite`,
        color: `${color}99`,
      }),
    }}>
      {label}
    </Typography>
  </Box>
);

const DetailHeader: React.FC<{
  label: string;
  color: string;
  icon: React.ReactNode;
  noMargin?: boolean;
}> = ({ label, color, icon, noMargin }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: noMargin ? 0 : 1 }}>
    <Box sx={{ color, display: 'flex', opacity: 0.7 }}>{icon}</Box>
    <Typography sx={{
      color: 'rgba(255,255,255,0.55)',
      fontSize: '0.72rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }}>
      {label}
    </Typography>
  </Box>
);

const SubjectMultiSelect: React.FC<{
  value: number[];
  onChange: (ids: number[]) => void;
  subjects: Array<{ id: number; name: string; [k: string]: unknown }>;
  getSubjectName: (id: number) => string;
  disabled?: boolean;
  accentColor: string;
}> = ({ value, onChange, subjects, getSubjectName, disabled, accentColor }) => {
  const handleRemove = (id: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== id));
  };

  return (
    <FormControl fullWidth size="small">
      <Select
        multiple
        value={value}
        onChange={(e) => onChange(e.target.value as number[])}
        disabled={disabled}
        displayEmpty
        renderValue={(selected) => {
          const sel = selected as number[];
          if (!sel || sel.length === 0)
            return <em style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>Select subjects…</em>;
          return <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>{sel.length} selected</span>;
        }}
        sx={{
          minHeight: 34, fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.8)',
          bgcolor: 'rgba(255,255,255,0.04)',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
          '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.3)' },
        }}
        MenuProps={{
          PaperProps: { sx: { bgcolor: '#1a1a1a', maxHeight: 300 } },
          autoFocus: false,
          disableAutoFocusItem: true,
          variant: 'menu',
        }}
      >
        {subjects.map((s: any) => (
          <MenuItem key={s.id} value={s.id} sx={{ fontSize: '0.78rem', py: 0.4 }}>
            <Checkbox checked={value.includes(s.id)} size="small"
              sx={{ p: 0.25, mr: 0.75, color: 'rgba(255,255,255,0.4)', '&.Mui-checked': { color: accentColor } }}
            />
            <ListItemText primary={s.name} primaryTypographyProps={{ fontSize: '0.78rem' }} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
