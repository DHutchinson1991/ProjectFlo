"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  Box, Typography, Divider, Switch, TextField, FormControl,
  InputLabel, Select, MenuItem, Checkbox, FormControlLabel,
  FormGroup, Stack, IconButton,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MovieFilterIcon from '@mui/icons-material/MovieFilter';
import { useContentBuilder } from '../../context/ContentBuilderContext';
import { useFilmSchedule } from '../../hooks/data';
import { useBrand } from '@/features/platform/brand';
import { scenesApi } from '@/features/content/scenes/api';
import { MusicType, MUSIC_TYPE_LABELS } from '@/features/content/music/types';
import { useSceneSubjects } from '@/features/content/subjects';
import { getEquipmentLabelForTrackName } from '@/features/content/films/utils/equipmentAssignments';
import { crewSlotsApi, scheduleApi } from '@/features/workflow/scheduling/api';
import type { TimelineTrack } from '../../types/timeline';

/* ─── Helpers ─── */
const fmtTime = (t: string | null | undefined) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return t;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

/**
 * SceneSettingsPanel — Right-side panel replacing the old Scene Settings modal.
 * Renders inline in the same slot as MomentPanel with auto-save.
 */
export const SceneSettingsPanel: React.FC = () => {
  const {
    selectedSceneForSettings, setSelectedSceneForSettings,
    scenes, setScenes, tracks, readOnly, deleteScene,
    equipmentAssignmentsBySlot, packageId,
    filmId, instanceOwnerType, instanceOwnerId,
  } = useContentBuilder();

  const selection = selectedSceneForSettings;
  const sceneIds = selection?.sceneIds ?? [];
  const sceneName = selection?.sceneName ?? '';
  const sceneLabel = selection?.sceneLabel ?? '';

  // ─── Tracks ────────────────────────────────────────────────────────
  const normalize = (v?: string | null) => (v || '').toLowerCase();
  const videoTracks = React.useMemo(() => tracks.filter(t => normalize(t.track_type) === 'video'), [tracks]);
  const audioTracks = React.useMemo(() => tracks.filter(t => normalize(t.track_type) === 'audio'), [tracks]);

  const getTrackDisplayName = (track: TimelineTrack) => {
    const n = normalize(track.track_type);
    if (n !== 'video' && n !== 'audio') return track.name;
    const eq = getEquipmentLabelForTrackName(track.name, equipmentAssignmentsBySlot);
    return eq ? `${track.name} · ${eq}` : track.name;
  };

  // ─── Resolve existing scene data ─────────────────────────────────
  const groupScenes = React.useMemo(
    () => scenes.filter(s => s.name === sceneName && typeof s.id === 'number'),
    [scenes, sceneName],
  );
  const setupSource: any = groupScenes.find(s => (s as any).recording_setup)?.recording_setup ?? null;
  const musicSource: any = groupScenes.find(s => (s as any).scene_music)?.scene_music ?? null;

  // ─── Scene mode (realtime vs montage) ─────────────────────────────
  const primaryScene = groupScenes[0] as any;
  const isMontageScene = primaryScene?.scene_template_type === 'MONTAGE' || primaryScene?.scene_mode === 'MONTAGE';
  const sceneModeLabel = isMontageScene ? 'Montage' : 'Realtime';
  const sceneModeColor = isMontageScene ? '#FFB020' : '#4CAF50';
  const SceneModeIcon = isMontageScene ? MovieFilterIcon : AccessTimeIcon;

  // ─── Local form state (populated from scene data) ────────────────
  const [selectedCameraTrackIds, setSelectedCameraTrackIds] = React.useState<number[]>([]);
  const [selectedAudioTrackIds, setSelectedAudioTrackIds] = React.useState<number[]>([]);
  const [graphicsEnabled, setGraphicsEnabled] = React.useState(false);
  const [sceneMusicEnabled, setSceneMusicEnabled] = React.useState(false);
  const [sceneMusicForm, setSceneMusicForm] = React.useState({
    music_name: '', artist: '', music_type: MusicType.MODERN,
  });

  // Re-populate when the selected scene changes
  const sceneKey = sceneIds.join(',');
  React.useEffect(() => {
    const defaultCam = videoTracks.map(t => t.id);
    const defaultAudio = audioTracks.map(t => t.id);
    setSelectedCameraTrackIds(setupSource?.camera_assignments?.map((a: any) => a.track_id) ?? defaultCam);
    setSelectedAudioTrackIds(setupSource?.audio_track_ids ?? defaultAudio);
    setGraphicsEnabled(setupSource ? !!setupSource.graphics_enabled : false);
    setSceneMusicEnabled(!!musicSource);
    setSceneMusicForm({
      music_name: musicSource?.music_name || '',
      artist: musicSource?.artist || '',
      music_type: (musicSource?.music_type as MusicType) || MusicType.MODERN,
    });
  }, [sceneKey]);

  // ─── Scene name editing ────────────────────────────────────────────
  const [editingName, setEditingName] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState(sceneName);
  React.useEffect(() => { setNameDraft(sceneName); setEditingName(false); }, [sceneName]);

  const saveNameEdit = () => {
    const next = nameDraft.trim();
    if (!next || next === sceneName) { setEditingName(false); return; }
    setScenes((prev: any[]) => prev.map((s: any) =>
      sceneIds.includes(s.id) ? { ...s, name: next } : s,
    ));
    setSelectedSceneForSettings({ ...selection!, sceneName: next });
    setEditingName(false);
  };

  const handleDeleteScene = async () => {
    if (!sceneIds.length) return;
    setSelectedSceneForSettings(null);
    for (const id of sceneIds) {
      try { await deleteScene(String(id)); } catch { /* ignore */ }
    }
  };

  // ─── Subjects & crew ──────────────────────────────────────────────
  const { subjects: sceneSubjects } = useSceneSubjects({ sceneIds });

  const isInstanceOwner = Boolean(instanceOwnerType && instanceOwnerId);
  const [packageActivities, setPackageActivities] = React.useState<any[]>([]);
  const [packageSubjects, setPackageSubjects] = React.useState<any[]>([]);
  const [packageCrewSlots, setPackageCrewSlots] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (isInstanceOwner && instanceOwnerId) {
      const getActivities = instanceOwnerType === 'project'
        ? scheduleApi.projectAllActivities.getAll
        : scheduleApi.inquiryActivities.getAll;
      const getEventDays = instanceOwnerType === 'project'
        ? scheduleApi.projectInstanceEventDays.getAll
        : scheduleApi.inquiryEventDays.getAll;
      const getSubjects = instanceOwnerType === 'project'
        ? scheduleApi.instanceSubjects.getForProject
        : scheduleApi.instanceSubjects.getForInquiry;
      const getCrewSlots = instanceOwnerType === 'project'
        ? scheduleApi.instanceCrewSlots.getForProject
        : scheduleApi.instanceCrewSlots.getForInquiry;
      Promise.all([getActivities(instanceOwnerId), getEventDays(instanceOwnerId), getSubjects(instanceOwnerId), getCrewSlots(instanceOwnerId)])
        .then(([acts, days, subj, crew]) => {
          const dayNameMap = new Map<number, string>();
          (days as any[] || []).forEach((d: any) => dayNameMap.set(d.id, d.name));
          setPackageActivities((acts as any[] || []).map((a: any) => ({
            ...a, dayName: dayNameMap.get(a.project_event_day_id) ?? 'Day',
            package_event_day_id: a.project_event_day_id ?? a.package_event_day_id,
            event_day_template_id: a.project_event_day_id ?? a.event_day_template_id,
          })));
          setPackageSubjects(subj as any[] || []);
          setPackageCrewSlots(crew as any[] || []);
        }).catch(() => {});
      return;
    }
    if (!packageId) return;
    Promise.all([
      scheduleApi.packageActivities.getAll(packageId),
      scheduleApi.packageEventDays.getAll(packageId),
      scheduleApi.packageEventDaySubjects.getAll(packageId),
      crewSlotsApi.packageDay.getAll(packageId),
    ]).then(([acts, days, subj, crew]) => {
      const dayNameMap = new Map<number, string>();
      const joinToTemplate = new Map<number, number>();
      (days as any[]).forEach((d: any) => {
        const joinId = d._joinId ?? d.id;
        dayNameMap.set(joinId, d.name);
        if (d._joinId != null) joinToTemplate.set(d._joinId, d.id);
      });
      setPackageActivities((acts || []).map((a: any) => ({
        ...a, dayName: dayNameMap.get(a.package_event_day_id) ?? 'Day',
        event_day_template_id: joinToTemplate.get(a.package_event_day_id) ?? a.package_event_day_id,
      })));
      setPackageSubjects(subj || []);
      setPackageCrewSlots(crew || []);
    }).catch(() => {});
  }, [packageId, isInstanceOwner, instanceOwnerType, instanceOwnerId]);

  // ─── Schedule ─────────────────────────────────────────────────────
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const numericFilmId = typeof filmId === 'string' ? parseInt(filmId, 10) : (filmId ?? null);
  const { getSceneSchedule, updateSceneSchedule, saveSceneSchedule } = useFilmSchedule(
    numericFilmId, brandId ?? null, packageId ?? null, instanceOwnerType, instanceOwnerId,
  );

  const sceneSchedule = React.useMemo(
    () => (sceneIds[0] ? getSceneSchedule(sceneIds[0]) : null),
    [sceneIds, getSceneSchedule],
  );

  const selectedActivity = React.useMemo(
    () => packageActivities.find((a: any) => a.id === sceneSchedule?.package_activity_id) ?? null,
    [packageActivities, sceneSchedule],
  );

  // Inherited subjects & crew (same logic as old modal)
  const inheritedSubjects = React.useMemo(() => {
    if (!selectedActivity) return [];
    const eventDayId = selectedActivity.event_day_template_id ?? selectedActivity.package_event_day_id;
    return packageSubjects.filter((s: any) => {
      const directId = s.package_activity_id ?? s.project_activity_id;
      if (directId === selectedActivity.id) return true;
      if (s.activity_assignments?.some((a: any) => (a.package_activity_id ?? a.project_activity_id) === selectedActivity.id)) return true;
      const noAssign = !directId && (!s.activity_assignments || s.activity_assignments.length === 0);
      return noAssign && (s.event_day_template_id ?? s.project_event_day_id) === eventDayId;
    });
  }, [packageSubjects, selectedActivity]);

  const inheritedCrew = React.useMemo(() => {
    if (!selectedActivity) return [];
    const eventDayId = selectedActivity.event_day_template_id ?? selectedActivity.package_event_day_id;
    const matched = packageCrewSlots.filter((o: any) => {
      const directId = o.package_activity_id ?? o.project_activity_id;
      if (directId === selectedActivity.id) return true;
      if (o.activity_assignments?.some((a: any) => (a.package_activity_id ?? a.project_activity_id) === selectedActivity.id)) return true;
      const noAssign = !directId && (!o.activity_assignments || o.activity_assignments.length === 0);
      return noAssign && (o.event_day_template_id ?? o.project_event_day_id) === eventDayId;
    });
    const seen = new Map<number, any>();
    matched.forEach((o: any) => { const k = o.crew_id ?? o.id; if (!seen.has(k)) seen.set(k, o); });
    return Array.from(seen.values());
  }, [packageCrewSlots, selectedActivity]);

  const activitiesByDay = React.useMemo(() => {
    const map = new Map<string, any[]>();
    packageActivities.forEach((a: any) => {
      const day = a.dayName ?? 'Day';
      const list = map.get(day) ?? [];
      list.push(a);
      map.set(day, list);
    });
    return Array.from(map.entries());
  }, [packageActivities]);

  // ─── Auto-save (debounced) ────────────────────────────────────────
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerMusicRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistRecordingSetup = React.useCallback(async (
    camIds: number[], audioIds: number[], gfx: boolean,
  ) => {
    if (!sceneIds.length) return;
    const payload = {
      camera_track_ids: Array.from(new Set(camIds)),
      audio_track_ids: Array.from(new Set(audioIds)),
      graphics_enabled: gfx,
    };
    try {
      const results = await Promise.all(sceneIds.map(id => scenesApi.scenes.recordingSetup.upsert(id, payload)));
      // Update local scenes state
      const trackLookup = new Map(tracks.map(t => [t.id, t]));
      const nextSetup = {
        id: results.find(r => r?.id)?.id || 0,
        audio_track_ids: audioIds,
        graphics_enabled: gfx,
        camera_assignments: camIds.map(trackId => {
          const track = trackLookup.get(trackId);
          return { track_id: trackId, track_name: track?.name, track_type: track?.track_type?.toUpperCase(), subject_ids: [] };
        }),
      };
      setScenes((prev: any[]) => prev.map((scene: any) => {
        if (sceneIds.includes(scene.id)) return { ...scene, recording_setup: nextSetup };
        return scene;
      }));
    } catch (err) {
      console.error('[SceneSettingsPanel] Save recording setup failed', err);
    }
  }, [sceneIds, tracks, setScenes]);

  const persistMusic = React.useCallback(async (enabled: boolean, form: typeof sceneMusicForm) => {
    if (!sceneIds.length) return;
    try {
      const results = await Promise.all(sceneIds.map(async id => {
        if (enabled && form.music_name.trim()) {
          return scenesApi.scenes.music.upsert(id, {
            music_name: form.music_name.trim(),
            artist: form.artist.trim() || undefined,
            music_type: form.music_type,
          });
        }
        try { await scenesApi.scenes.music.delete(id); } catch { /* ignore */ }
        return null;
      }));
      setScenes((prev: any[]) => prev.map((scene: any) => {
        const idx = sceneIds.indexOf(scene.id);
        if (idx === -1) return scene;
        return { ...scene, scene_music: results[idx] ?? null };
      }));
    } catch (err) {
      console.error('[SceneSettingsPanel] Save music failed', err);
    }
  }, [sceneIds, setScenes]);

  // Debounced saves
  const debouncedSaveSetup = React.useCallback((cam: number[], audio: number[], gfx: boolean) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => persistRecordingSetup(cam, audio, gfx), 800);
  }, [persistRecordingSetup]);

  const debouncedSaveMusic = React.useCallback((enabled: boolean, form: typeof sceneMusicForm) => {
    if (saveTimerMusicRef.current) clearTimeout(saveTimerMusicRef.current);
    saveTimerMusicRef.current = setTimeout(() => persistMusic(enabled, form), 800);
  }, [persistMusic]);

  React.useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (saveTimerMusicRef.current) clearTimeout(saveTimerMusicRef.current);
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────
  const toggleCameraTrack = (trackId: number) => {
    setSelectedCameraTrackIds(prev => {
      const next = prev.includes(trackId) ? prev.filter(id => id !== trackId) : [...prev, trackId];
      debouncedSaveSetup(next, selectedAudioTrackIds, graphicsEnabled);
      return next;
    });
  };

  const toggleAudioTrack = (trackId: number) => {
    setSelectedAudioTrackIds(prev => {
      const next = prev.includes(trackId) ? prev.filter(id => id !== trackId) : [...prev, trackId];
      debouncedSaveSetup(selectedCameraTrackIds, next, graphicsEnabled);
      return next;
    });
  };

  const handleGraphicsToggle = (enabled: boolean) => {
    setGraphicsEnabled(enabled);
    debouncedSaveSetup(selectedCameraTrackIds, selectedAudioTrackIds, enabled);
  };

  const handleMusicToggle = (enabled: boolean) => {
    setSceneMusicEnabled(enabled);
    debouncedSaveMusic(enabled, sceneMusicForm);
  };

  const handleMusicFormChange = (next: typeof sceneMusicForm) => {
    setSceneMusicForm(next);
    if (sceneMusicEnabled) debouncedSaveMusic(true, next);
  };

  const handleScheduleChange = (field: string, value: any) => {
    if (!sceneIds[0]) return;
    updateSceneSchedule(sceneIds[0], { [field]: value });
    // Persist schedule after short delay
    setTimeout(() => saveSceneSchedule(sceneIds[0]), 300);
  };

  if (!selection) return null;

  const hasContext = packageActivities.length > 0 || inheritedSubjects.length > 0 || inheritedCrew.length > 0 || sceneSubjects.length > 0;

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <Box sx={{
      width: '35%', minWidth: '320px', maxWidth: '480px', flexShrink: 0,
      borderLeft: '1px solid rgba(255,255,255,0.08)', background: '#0d0d0d',
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
    }}>
      {/* Header */}
      <Box sx={{
        px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#111',
      }}>
        <Box sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Scene Settings
        </Box>
        <IconButton size="small" onClick={() => setSelectedSceneForSettings(null)} sx={{ color: 'rgba(255,255,255,0.4)' }}>
          <CloseRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Scrollable body */}
      <Box sx={{ flex: 1, overflow: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 } }}>

        {/* Scene title bar — editable name + delete */}
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#7B61FF', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
              {sceneLabel}
            </Typography>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, bgcolor: `${sceneModeColor}15`, border: `1px solid ${sceneModeColor}30`, borderRadius: 0.5, px: 0.5, py: 0.1 }}>
              <SceneModeIcon sx={{ fontSize: 10, color: sceneModeColor }} />
              <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: sceneModeColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {sceneModeLabel}
              </Typography>
            </Box>
            {!readOnly && !editingName && (
              <IconButton size="small" onClick={handleDeleteScene} sx={{ ml: 'auto', color: 'rgba(255,107,157,0.5)', p: 0.25, '&:hover': { color: '#FF6B9D' } }}>
                <DeleteOutlineIcon sx={{ fontSize: 14 }} />
              </IconButton>
            )}
          </Box>
          {editingName ? (
            <TextField size="small" fullWidth autoFocus value={nameDraft}
              onChange={e => setNameDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveNameEdit(); if (e.key === 'Escape') setEditingName(false); }}
              onBlur={saveNameEdit}
              sx={{ mt: 0.5, input: { color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, py: 0.5 }, '& fieldset': { borderColor: 'rgba(123,97,255,0.3)' } }}
            />
          ) : (
            <Typography onClick={() => !readOnly && setEditingName(true)}
              sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3, cursor: readOnly ? 'default' : 'pointer', '&:hover': readOnly ? {} : { color: '#fff' }, mt: 0.25 }}>
              {sceneName || 'Untitled scene'}
            </Typography>
          )}
        </Box>

        {/* ═══════════════════════════════════════════
            ZONE 1 — RECORDING (editable)
            ═══════════════════════════════════════════ */}
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Stack spacing={1.5}>

            {/* ── Video Tracks ── */}
            <SectionLabel>Video Tracks</SectionLabel>
            {videoTracks.length === 0 ? (
              <Muted>No video tracks</Muted>
            ) : (
              <FormGroup sx={{ gap: 0 }}>
                {videoTracks.map(track => (
                  <FormControlLabel
                    key={track.id}
                    control={<Checkbox size="small" checked={selectedCameraTrackIds.includes(track.id)} onChange={() => toggleCameraTrack(track.id)} disabled={readOnly}
                      sx={{ color: 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: '#5B8DEF' }, p: 0.5 }} />}
                    label={<Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>{getTrackDisplayName(track)}</Typography>}
                    sx={{ ml: 0 }}
                  />
                ))}
              </FormGroup>
            )}

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

            {/* ── Audio Tracks ── */}
            <SectionLabel>Audio Tracks</SectionLabel>
            {audioTracks.length === 0 ? (
              <Muted>No audio tracks</Muted>
            ) : (
              <FormGroup sx={{ gap: 0 }}>
                {audioTracks.map(track => (
                  <FormControlLabel
                    key={track.id}
                    control={<Checkbox size="small" checked={selectedAudioTrackIds.includes(track.id)} onChange={() => toggleAudioTrack(track.id)} disabled={readOnly}
                      sx={{ color: 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: '#4ECDC4' }, p: 0.5 }} />}
                    label={<Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>{getTrackDisplayName(track)}</Typography>}
                    sx={{ ml: 0 }}
                  />
                ))}
              </FormGroup>
            )}

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

            {/* ── Graphics + Music row ── */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <SectionLabel>Graphics</SectionLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <Switch size="small" checked={graphicsEnabled} onChange={e => handleGraphicsToggle(e.target.checked)} disabled={readOnly}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#FFAB00' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#FFAB00' } }} />
                  <Typography sx={{ fontSize: '0.7rem', color: graphicsEnabled ? '#FFAB00' : 'rgba(255,255,255,0.35)' }}>
                    {graphicsEnabled ? 'On' : 'Off'}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <SectionLabel>Music</SectionLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <Switch size="small" checked={sceneMusicEnabled} onChange={e => handleMusicToggle(e.target.checked)} disabled={readOnly}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#CE93D8' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#CE93D8' } }} />
                  <Typography sx={{ fontSize: '0.7rem', color: sceneMusicEnabled ? '#CE93D8' : 'rgba(255,255,255,0.35)' }}>
                    {sceneMusicEnabled ? 'On' : 'Off'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Music fields (collapsed when off) */}
            {sceneMusicEnabled && (
              <Stack spacing={0.75} sx={{ pl: 0.5 }}>
                <TextField size="small" placeholder="Song name" value={sceneMusicForm.music_name} disabled={readOnly}
                  onChange={e => handleMusicFormChange({ ...sceneMusicForm, music_name: e.target.value })}
                  sx={{ input: { color: 'white', fontSize: '0.75rem', py: 0.75 }, '& fieldset': { borderColor: 'rgba(206,147,216,0.2)' } }} fullWidth />
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                  <TextField size="small" placeholder="Artist" value={sceneMusicForm.artist} disabled={readOnly}
                    onChange={e => handleMusicFormChange({ ...sceneMusicForm, artist: e.target.value })}
                    sx={{ flex: 1, input: { color: 'white', fontSize: '0.75rem', py: 0.75 }, '& fieldset': { borderColor: 'rgba(206,147,216,0.2)' } }} />
                  <FormControl size="small" sx={{ minWidth: 90 }} disabled={readOnly}>
                    <Select value={sceneMusicForm.music_type} onChange={e => handleMusicFormChange({ ...sceneMusicForm, music_type: e.target.value as MusicType })}
                      sx={{ color: '#CE93D8', fontSize: '0.7rem', '& fieldset': { borderColor: 'rgba(206,147,216,0.2)' } }}>
                      {Object.values(MusicType).map(t => <MenuItem key={t} value={t} sx={{ fontSize: '0.7rem' }}>{MUSIC_TYPE_LABELS[t]}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
              </Stack>
            )}
          </Stack>
        </Box>

        {/* ═══════════════════════════════════════════
            ZONE 2 — CONTEXT (read-only)
            ═══════════════════════════════════════════ */}
        {hasContext && (
          <Box sx={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            bgcolor: 'rgba(255,255,255,0.015)',
            px: 2, pt: 1.25, pb: 1.5,
          }}>
            <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', mb: 1 }}>
              Context
            </Typography>

            <Stack spacing={1.25}>
              {/* Schedule time */}
              {sceneSchedule?.scheduled_start_time && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.75, py: 0.4, borderRadius: 0.75, bgcolor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                  <AccessTimeIcon sx={{ fontSize: 12, color: '#f59e0b' }} />
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>
                    {fmtTime(sceneSchedule.scheduled_start_time)}
                  </Typography>
                  {sceneSchedule.scheduled_duration_minutes && (() => {
                    const [h, m] = sceneSchedule.scheduled_start_time!.split(':').map(Number);
                    const total = h * 60 + m + sceneSchedule.scheduled_duration_minutes;
                    const endStr = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
                    return (
                      <>
                        <Typography sx={{ fontSize: '0.55rem', color: 'rgba(245,158,11,0.4)' }}>&rarr;</Typography>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(59,130,246,0.8)', fontFamily: 'monospace' }}>
                          {fmtTime(endStr)}
                        </Typography>
                      </>
                    );
                  })()}
                  {sceneSchedule.scheduled_duration_minutes && (
                    <Box sx={{ ml: 'auto', bgcolor: 'rgba(245,158,11,0.1)', borderRadius: 0.5, px: 0.4, py: 0.1 }}>
                      <Typography sx={{ fontSize: '0.55rem', color: 'rgba(245,158,11,0.7)', fontWeight: 600 }}>{sceneSchedule.scheduled_duration_minutes}m</Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Activity select */}
              {packageActivities.length > 0 && (
                <FormControl size="small" fullWidth disabled={readOnly}>
                  <InputLabel sx={{ color: 'rgba(245,158,11,0.4)', fontSize: '0.75rem' }}>Activity</InputLabel>
                  <Select label="Activity" value={sceneSchedule?.package_activity_id ?? ''}
                    onChange={e => {
                      const actId = e.target.value ? Number(e.target.value) : null;
                      handleScheduleChange('package_activity_id', actId);
                      const act = packageActivities.find((a: any) => a.id === actId);
                      handleScheduleChange('scheduled_start_time', act?.start_time ?? null);
                      const dur = act?.duration_minutes ?? (act?.start_time && act?.end_time ? (() => {
                        const [sh, sm] = act.start_time!.split(':').map(Number);
                        const [eh, em] = act.end_time!.split(':').map(Number);
                        return (eh * 60 + em) - (sh * 60 + sm);
                      })() : null);
                      handleScheduleChange('scheduled_duration_minutes', dur ?? null);
                    }}
                    sx={{ color: 'rgba(245,158,11,0.8)', fontSize: '0.75rem', '& fieldset': { borderColor: 'rgba(245,158,11,0.15)' } }}>
                    <MenuItem value=""><em>No activity</em></MenuItem>
                    {activitiesByDay.map(([dayName, acts]) => [
                      <MenuItem key={`day-${dayName}`} disabled sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', py: 0.25 }}>{dayName}</MenuItem>,
                      ...acts.map((act: any) => (
                        <MenuItem key={act.id} value={act.id} sx={{ pl: 3, fontSize: '0.75rem' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, width: '100%' }}>
                            {act.color && <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: act.color, flexShrink: 0 }} />}
                            <Box sx={{ flex: 1 }}>{act.name}</Box>
                            {act.start_time && <Box sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', ml: 'auto' }}>{fmtTime(act.start_time)}</Box>}
                          </Box>
                        </MenuItem>
                      )),
                    ])}
                  </Select>
                </FormControl>
              )}

              {/* Activity time + location inline */}
              {selectedActivity && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                  {selectedActivity.start_time && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.35 }}>
                      <Typography sx={{ fontSize: '0.7rem', color: 'rgba(245,158,11,0.8)', fontWeight: 600 }}>
                        {fmtTime(selectedActivity.start_time)}
                        {selectedActivity.end_time && ` – ${fmtTime(selectedActivity.end_time)}`}
                      </Typography>
                      {(selectedActivity.duration_minutes ?? 0) > 0 && (
                        <Box sx={{ bgcolor: 'rgba(245,158,11,0.1)', borderRadius: 0.5, px: 0.4, py: 0.1 }}>
                          <Typography sx={{ fontSize: '0.55rem', color: 'rgba(245,158,11,0.7)', fontWeight: 600 }}>{selectedActivity.duration_minutes}m</Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <LocationOnOutlinedIcon sx={{ color: 'rgba(249,115,22,0.5)', fontSize: 12 }} />
                    <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>{selectedActivity.name}</Typography>
                  </Box>
                </Box>
              )}

              {/* Subjects — compact chip row */}
              {(inheritedSubjects.length > 0 || sceneSubjects.length > 0) && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <Box sx={{ width: 3, height: 10, borderRadius: 1, bgcolor: 'rgba(167,139,250,0.5)' }} />
                    <Typography sx={{ fontSize: '0.55rem', color: 'rgba(167,139,250,0.6)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
                      Subjects
                    </Typography>
                    <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)' }}>
                      {inheritedSubjects.length > 0 ? `${inheritedSubjects.length} from activity` : `${sceneSubjects.length}`}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                    {(inheritedSubjects.length > 0 ? inheritedSubjects : sceneSubjects.map((a: any) => ({ id: a.subject_id, name: a.subject?.name }))).map((s: any) => (
                      <Box key={s.id} sx={{
                        bgcolor: 'rgba(167,139,250,0.08)', color: '#c4b5fd',
                        px: 0.6, py: 0.15, borderRadius: 0.5, fontSize: '0.6rem', fontWeight: 500,
                        border: '1px solid rgba(167,139,250,0.12)',
                      }}>
                        {s.name}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Crew — compact chip row */}
              {inheritedCrew.length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <Box sx={{ width: 3, height: 10, borderRadius: 1, bgcolor: 'rgba(236,72,153,0.5)' }} />
                    <Typography sx={{ fontSize: '0.55rem', color: 'rgba(236,72,153,0.6)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
                      Crew
                    </Typography>
                    <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)' }}>
                      {inheritedCrew.length} from activity
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                    {inheritedCrew.map((c: any) => (
                      <Box key={c.id} sx={{
                        bgcolor: 'rgba(236,72,153,0.08)', color: '#f9a8d4',
                        px: 0.6, py: 0.15, borderRadius: 0.5, fontSize: '0.6rem', fontWeight: 500,
                        border: '1px solid rgba(236,72,153,0.12)',
                      }}>
                        {c.label || c.job_role?.display_name || c.job_role?.name || 'Crew'}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Empty state when no activity linked */}
              {!selectedActivity && inheritedSubjects.length === 0 && sceneSubjects.length === 0 && inheritedCrew.length === 0 && (
                <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                  Assign an activity to inherit location, subjects &amp; crew.
                </Typography>
              )}
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
};

/* ─── Tiny shared presentational helpers ─── */
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>
    {children}
  </Typography>
);
const Muted: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>{children}</Typography>
);

export default SceneSettingsPanel;
