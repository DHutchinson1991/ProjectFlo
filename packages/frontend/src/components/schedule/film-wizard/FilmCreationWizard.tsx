'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  CircularProgress,
  Stack,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MovieIcon from '@mui/icons-material/Movie';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { api } from '@/lib/api';
import { useBrand } from '@/app/providers/BrandProvider';
import { FilmType } from '@/lib/types/domains/film';
import { MontageStyle } from '@/lib/types/domains/scenes';
import type { MontagePreset } from '@/lib/types/domains/montage-presets';
import type { FilmStructureTemplate, FilmStructureTemplateScene } from '@/lib/types/domains/film-structure-templates';
import { AudioSourceType, AudioTrackType } from '@/lib/types/domains/audio-sources';

import { FilmTypeStep } from './steps/FilmTypeStep';
import { MontagePresetStep } from './steps/MontagePresetStep';
import { ActivitySelectionStep } from './steps/ActivitySelectionStep';
import { StructureTemplateStep } from './steps/StructureTemplateStep';
import { SceneAssignmentStep } from './steps/SceneAssignmentStep';
import { AudioSourceStep } from './steps/AudioSourceStep';
import { DurationReviewStep } from './steps/DurationReviewStep';
import { SceneConfigStep } from './steps/SceneConfigStep';
import { buildDefaultSceneOrder, type SceneOrderEntry } from './steps/SceneOrderStep';

// ─── Types ───────────────────────────────────────────────────────────

export interface PackageActivityRecord {
  id: number;
  name: string;
  start_time?: string | null;
  end_time?: string | null;
  duration_minutes?: number | null;
  package_event_day_id: number;
  moments?: Array<{ id: number; name: string; duration_seconds?: number }>;
  package_event_day?: { event_day?: { name?: string } };
}

export interface CreatedFilmResult {
  filmId: number;
  filmName: string;
  packageFilmId: number;
  scenesCreated: number;
  momentsPopulated: number;
  activityIds: number[];
}

export interface InstanceOwner {
  type: 'project' | 'inquiry';
  id: number;
}

/** Per-scene assignment: which activities/moments provide footage */
export interface SceneSourceAssignment {
  sceneIndex: number;
  activityIds: number[];
  /** Specific moment IDs cherry-picked per activity */
  momentIdsByActivity: Record<number, number[]>;
}

/** Per-scene audio source config */
export interface SceneAudioConfig {
  sceneIndex: number;
  sourceType: 'ACTIVITY' | 'MOMENT' | 'SCENE' | null;
  sourceActivityId?: number;
  sourceMomentId?: number;
  trackType: 'SPEECH' | 'AMBIENT' | 'MUSIC';
  notes?: string;
}

/** Scene duration override from the review step */
export interface SceneDurationOverride {
  sceneIndex: number;
  durationSeconds: number;
}

/** Per-activity scene config for FEATURE films */
export interface ActivitySceneConfig {
  mode: 'REALTIME' | 'MONTAGE';
  montageDurationSeconds?: number;
  montageStyle?: MontageStyle;
  montageBpm?: number;
}

interface FilmCreationWizardProps {
  open: boolean;
  onClose: () => void;
  packageId: number | null;
  activities: PackageActivityRecord[];
  packageName?: string;
  onFilmCreated: (result: CreatedFilmResult) => void;
  instanceOwner?: InstanceOwner;
  externalOperators?: Record<string, unknown>[];
}

// ─── Wizard Steps Config ─────────────────────────────────────────────

type WizardStepId =
  | 'film-type'
  | 'preset'
  | 'activities'
  | 'scene-config'
  | 'structure'
  | 'scene-assignment'
  | 'audio'
  | 'duration-review';

interface StepConfig {
  id: WizardStepId;
  label: string;
  appliesTo: (filmType: FilmType) => boolean;
}

const ALL_STEPS: StepConfig[] = [
  { id: 'film-type', label: 'Film Type', appliesTo: () => true },
  { id: 'preset', label: 'Preset', appliesTo: (t) => t === FilmType.MONTAGE },
  { id: 'activities', label: 'Activities', appliesTo: () => true },
  { id: 'scene-config', label: 'Scene Config', appliesTo: (t) => t === FilmType.FEATURE },
  { id: 'structure', label: 'Structure', appliesTo: (t) => t === FilmType.MONTAGE },
  { id: 'scene-assignment', label: 'Scene Assignment', appliesTo: (t) => t === FilmType.MONTAGE },
  { id: 'audio', label: 'Audio Sources', appliesTo: (t) => t === FilmType.MONTAGE },
  { id: 'duration-review', label: 'Review', appliesTo: (t) => t === FilmType.MONTAGE },
];

// ─── Component ───────────────────────────────────────────────────────

export function FilmCreationWizard({
  open,
  onClose,
  packageId,
  activities,
  packageName,
  onFilmCreated,
  instanceOwner,
  externalOperators,
}: FilmCreationWizardProps) {
  const { currentBrand } = useBrand();

  // ─── Wizard State ──────────────────────────────────────────────────
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [filmType, setFilmType] = useState<FilmType>(FilmType.FEATURE);
  const [filmName, setFilmName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<MontagePreset | null>(null);
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<number>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<FilmStructureTemplate | null>(null);
  const [sceneConfigs, setSceneConfigs] = useState<Record<number, ActivitySceneConfig>>({});
  const [sceneAssignments, setSceneAssignments] = useState<SceneSourceAssignment[]>([]);
  const [audioConfigs, setAudioConfigs] = useState<SceneAudioConfig[]>([]);
  const [durationOverrides, setDurationOverrides] = useState<SceneDurationOverride[]>([]);
  const [combineMontage, setCombineMontage] = useState(true);
  const [combinedMontageStyle, setCombinedMontageStyle] = useState<MontageStyle>(MontageStyle.HIGHLIGHTS);
  const [combinedMontageDuration, setCombinedMontageDuration] = useState<number>(120);
  const [sceneOrder, setSceneOrder] = useState<SceneOrderEntry[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedFilmResult | null>(null);

  // Debug wizard initialization
  // ─── Derived Steps ─────────────────────────────────────────────────

  const visibleSteps = useMemo(
    () => ALL_STEPS.filter(s => s.appliesTo(filmType)),
    [filmType],
  );

  const currentStep = visibleSteps[activeStepIndex];

  // ─── Navigation ────────────────────────────────────────────────────

  const canGoNext = useMemo(() => {
    if (!currentStep) return false;
    const result = (() => {
      switch (currentStep.id) {
        case 'film-type':
          return filmName.trim().length > 0;
        case 'preset':
          return selectedPreset !== null;
        case 'activities':
          const isActivityMode = filmType === FilmType.ACTIVITY;
          if (isActivityMode) return selectedActivityIds.size === 1;
          return selectedActivityIds.size > 0;
        case 'scene-config':
          return selectedActivityIds.size > 0;
        case 'structure':
          return selectedTemplate !== null;
        case 'scene-assignment':
          return true; // optional assignments
        case 'audio':
          return true; // optional audio
        case 'duration-review':
          return true;
        default:
          return false;
      }
    })();
    return result;
  }, [currentStep, filmName, selectedPreset, selectedActivityIds, filmType, selectedTemplate]);

  const isLastStep = activeStepIndex === visibleSteps.length - 1;

  const handleNext = useCallback(() => {
    // Initialize scene configs for all selected activities when entering scene-config step
    if (currentStep?.id === 'activities' && filmType === FilmType.FEATURE) {
      const newConfigs = { ...sceneConfigs };
      for (const actId of selectedActivityIds) {
        if (!newConfigs[actId]) {
          newConfigs[actId] = {
            mode: 'REALTIME',
            montageDurationSeconds: 60,
            montageStyle: MontageStyle.HIGHLIGHTS,
            montageBpm: undefined,
          };
        }
      }
      setSceneConfigs(newConfigs);
    }
    
    if (isLastStep) {
      handleCreate();
    } else {
      setActiveStepIndex(prev => Math.min(prev + 1, visibleSteps.length - 1));
    }
  }, [isLastStep, visibleSteps.length, activeStepIndex, selectedActivityIds, currentBrand, currentStep, filmType, sceneConfigs, sceneOrder]);

  const handleBack = useCallback(() => {
    setActiveStepIndex(prev => Math.max(prev - 1, 0));
  }, []);

  // When film type changes, reset dependent state and jump to step 0
  const handleFilmTypeChange = useCallback((newType: FilmType) => {
    setFilmType(newType);
    setSelectedPreset(null);
    setSelectedTemplate(null);
    setSceneConfigs({});
    setSceneAssignments([]);
    setAudioConfigs([]);
    setDurationOverrides([]);
    setCombineMontage(true);
    setCombinedMontageStyle(MontageStyle.HIGHLIGHTS);
    setCombinedMontageDuration(120);
    setSceneOrder([]);
    // Don't reset activities or name — those can carry over
  }, []);

  // ─── Scenes from template (for assignment/audio/review steps) ─────

  const templateScenes: FilmStructureTemplateScene[] = useMemo(
    () => (selectedTemplate?.scenes ?? []).sort((a, b) => a.order_index - b.order_index),
    [selectedTemplate],
  );

  // ─── Create Film ──────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!currentBrand?.id) {
      setError('Brand context is not available. Please refresh the page or select a brand.');
      return;
    }
    
    if (selectedActivityIds.size === 0) {
      setError('No activities selected. Please select at least one activity.');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const name = filmName.trim() || `${packageName || 'Package'} Film`;

      // Count cameras + audio from equipment (reuse existing logic)
      let numCameras = 0;
      let numAudio = 0;
      try {
        const seenCameraIds = new Set<number>();
        const seenAudioIds = new Set<number>();
        const operators = externalOperators ?? (packageId ? await api.operators.packageDay.getAll(packageId) : []);
        (operators || []).forEach((op: Record<string, unknown>) => {
          ((op.equipment as Record<string, unknown>[]) || []).forEach((eq: Record<string, unknown>) => {
            const eqInner = eq.equipment as Record<string, unknown> | undefined;
            const cat = ((eqInner?.category as string) || '').toUpperCase();
            const eqId = (eq.equipment_id ?? eqInner?.id) as number | undefined;
            if (cat === 'CAMERA' && eqId && !seenCameraIds.has(eqId)) { seenCameraIds.add(eqId); numCameras++; }
            else if (cat === 'AUDIO' && eqId && !seenAudioIds.has(eqId)) { seenAudioIds.add(eqId); numAudio++; }
          });
        });
        if (packageId) {
          try {
            const pkgData = await api.servicePackages.getOne(currentBrand.id, packageId);
            const dayEquipMap = ((pkgData?.contents as Record<string, unknown>)?.day_equipment || {}) as Record<string, unknown[]>;
            Object.values(dayEquipMap).forEach((items) => {
              (items || []).forEach((item: unknown) => {
                const rec = item as Record<string, unknown>;
                const eqId = rec.equipment_id as number | undefined;
                if (rec.slot_type === 'CAMERA' && eqId && !seenCameraIds.has(eqId)) { seenCameraIds.add(eqId); numCameras++; }
                else if (rec.slot_type === 'AUDIO' && eqId && !seenAudioIds.has(eqId)) { seenAudioIds.add(eqId); numAudio++; }
              });
            });
          } catch { /* skip day_equipment count */ }
        }
      } catch (err) {
        console.warn('Could not count equipment:', err);
      }

      // 1. Create the film
      const newFilm = await api.films.create({
        name,
        brand_id: currentBrand.id,
        film_type: filmType,
        montage_preset_id: selectedPreset?.id,
        target_duration_min: selectedPreset?.min_duration_seconds,
        target_duration_max: selectedPreset?.max_duration_seconds,
        num_cameras: numCameras,
        num_audio: numAudio,
      });

      // 2. Link film to owner (package / project / inquiry)
      let ownerFilmId: number;
      if (instanceOwner) {
        const linkApi = instanceOwner.type === 'project'
          ? api.schedule.projectFilms
          : api.schedule.inquiryFilms;
        const linked = await linkApi.create(instanceOwner.id, {
          film_id: newFilm.id,
          order_index: 0,
        });
        ownerFilmId = linked.id;
      } else {
        const packageFilm = await api.schedule.packageFilms.create(packageId!, {
          film_id: newFilm.id,
          order_index: 0,
        });
        ownerFilmId = packageFilm.id;
      }

      // 3. Create scenes
      const selectedActivities = [...activities]
        .filter(a => selectedActivityIds.has(a.id))
        .sort((a, b) => {
          if (a.package_event_day_id !== b.package_event_day_id) return a.package_event_day_id - b.package_event_day_id;
          if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
          return a.name.localeCompare(b.name);
        });

      let totalMomentsPopulated = 0;
      let scenesCreated = 0;

      const upsertScene = instanceOwner
        ? (instanceOwner.type === 'project'
          ? api.schedule.projectFilms.upsertSceneSchedule
          : api.schedule.inquiryFilms.upsertSceneSchedule)
        : api.schedule.packageFilms.upsertSceneSchedule;
      const shouldCreateMomentsManually = Boolean(instanceOwner);
      const activityFkField = instanceOwner ? 'project_activity_id' : 'package_activity_id';

      if (filmType === FilmType.MONTAGE && templateScenes.length > 0) {
        // MONTAGE: create scenes from template, with source assignments
        for (let i = 0; i < templateScenes.length; i++) {
          const tplScene = templateScenes[i];
          const override = durationOverrides.find(d => d.sceneIndex === i);
          const duration = override?.durationSeconds ?? tplScene.suggested_duration_seconds ?? undefined;

          const scene = await api.films.localScenes.create(newFilm.id, {
            name: tplScene.name,
            order_index: i,
            mode: tplScene.mode as 'MOMENTS' | 'MONTAGE',
            duration_seconds: duration,
          });

          // Create beats from scene assignments (source references)
          const assignment = sceneAssignments.find(a => a.sceneIndex === i);
          if (assignment) {
            let beatIndex = 0;
            for (const actId of assignment.activityIds) {
              const momentIds = assignment.momentIdsByActivity[actId] || [];
              const activity = activities.find(a => a.id === actId);
              if (momentIds.length > 0) {
                // Cherry-picked moments — one beat per moment
                for (const momId of momentIds) {
                  const moment = activity?.moments?.find(m => m.id === momId);
                  await api.beats.create(scene.id, {
                    name: moment?.name || `Beat ${beatIndex + 1}`,
                    duration_seconds: moment?.duration_seconds || 10,
                    order_index: beatIndex,
                  });
                  beatIndex++;
                }
              } else {
                // Entire activity as single beat
                await api.beats.create(scene.id, {
                  name: activity?.name || `Beat ${beatIndex + 1}`,
                  duration_seconds: 30,
                  order_index: beatIndex,
                });
                beatIndex++;
              }
            }
          }

          // Create audio sources if configured
          const audioConfig = audioConfigs.find(a => a.sceneIndex === i);
          if (audioConfig && audioConfig.sourceType) {
            await api.sceneAudioSources.create(scene.id, {
              source_type: audioConfig.sourceType as AudioSourceType,
              source_activity_id: audioConfig.sourceActivityId,
              source_moment_id: audioConfig.sourceMomentId,
              track_type: audioConfig.trackType as AudioTrackType,
              order_index: 0,
              notes: audioConfig.notes,
            });
          }

          scenesCreated++;
        }
      } else if (filmType === FilmType.FEATURE) {
        // FEATURE: create scenes in user-defined order from the Scene Order step
        const montageActivities = selectedActivities.filter(a =>
          (sceneConfigs[a.id] ?? { mode: 'REALTIME' as const }).mode === 'MONTAGE'
        );
        const activityMap = new Map(selectedActivities.map(a => [a.id, a]));

        // Helper: 2-pass proportional scaling for montage moments
        const scaleMoments = (
          sourceMoments: Array<{ name: string; duration_seconds?: number; activityId: number }>,
          targetDuration: number,
        ) => {
          const MIN_DURATION = 3;
          if (sourceMoments.length === 0) return [];

          const totalOriginal = sourceMoments.reduce((s, m) => s + (m.duration_seconds || 60), 0);
          const rawDurations = sourceMoments.map(m => ((m.duration_seconds || 60) / totalOriginal) * targetDuration);

          // Pass 2: enforce minimum, redistribute deficit
          const finalDurations = [...rawDurations];
          let deficit = 0;
          const aboveMinIndices: number[] = [];
          for (let j = 0; j < finalDurations.length; j++) {
            if (finalDurations[j] < MIN_DURATION) {
              deficit += MIN_DURATION - finalDurations[j];
              finalDurations[j] = MIN_DURATION;
            } else {
              aboveMinIndices.push(j);
            }
          }
          if (deficit > 0 && aboveMinIndices.length > 0) {
            const aboveMinTotal = aboveMinIndices.reduce((s, idx) => s + finalDurations[idx], 0);
            for (const idx of aboveMinIndices) {
              finalDurations[idx] -= (finalDurations[idx] / aboveMinTotal) * deficit;
              if (finalDurations[idx] < MIN_DURATION) finalDurations[idx] = MIN_DURATION;
            }
          }

          // Round and fix last
          const rounded = finalDurations.map(d => Math.max(MIN_DURATION, Math.round(d)));
          const roundedSum = rounded.reduce((s, d) => s + d, 0);
          const diff = targetDuration - roundedSum;
          if (diff !== 0 && rounded.length > 0) {
            rounded[rounded.length - 1] = Math.max(MIN_DURATION, rounded[rounded.length - 1] + diff);
          }

          // Overflow: drop from end
          let result = sourceMoments.map((m, idx) => ({
            name: m.name,
            duration: rounded[idx],
            order_index: idx,
            activityId: m.activityId,
          }));
          let total = result.reduce((s, m) => s + m.duration, 0);
          while (total > targetDuration && result.length > 1) {
            result.pop();
            total = result.reduce((s, m) => s + m.duration, 0);
            if (result.length > 0) {
              const remaining = targetDuration - result.slice(0, -1).reduce((s, m) => s + m.duration, 0);
              result[result.length - 1].duration = Math.max(MIN_DURATION, remaining);
            }
          }
          return result;
        };

        // Iterate scene order entries (user-defined order from Scene Order step).
        // Guard: if sceneOrder is empty (stale closure), derive it on the fly.
        const effectiveSceneOrder = sceneOrder.length > 0
          ? sceneOrder
          : buildDefaultSceneOrder(
              activities, selectedActivityIds, sceneConfigs,
              combineMontage, combinedMontageStyle, combinedMontageDuration,
            );
        for (let sceneIndex = 0; sceneIndex < effectiveSceneOrder.length; sceneIndex++) {
          const entry = effectiveSceneOrder[sceneIndex];

          if (entry.isCombined) {
            // Combined montage scene
            const scene = await api.films.localScenes.create(newFilm.id, {
              name: entry.label,
              order_index: sceneIndex,
              mode: 'MONTAGE',
              duration_seconds: combinedMontageDuration,
              montage_style: combinedMontageStyle,
              montage_bpm: combinedMontageStyle === MontageStyle.RHYTHMIC ? 120 : undefined,
            });

            await upsertScene(ownerFilmId, {
              scene_id: scene.id,
              [activityFkField]: null as unknown as number,
              order_index: sceneIndex,
            });

            // Gather all source moments across montage activities
            const allSourceMoments: Array<{ name: string; duration_seconds?: number; activityId: number }> = [];
            for (const actId of entry.activityIds) {
              const ma = activityMap.get(actId);
              if (!ma) continue;
              const actMoments = ma.moments || [];
              if (actMoments.length > 0) {
                for (const m of actMoments) {
                  allSourceMoments.push({ name: m.name, duration_seconds: m.duration_seconds, activityId: ma.id });
                }
              } else {
                allSourceMoments.push({ name: ma.name, activityId: ma.id });
              }
            }

            const scaled = scaleMoments(allSourceMoments, combinedMontageDuration);
            for (const moment of scaled) {
              await api.moments.create(scene.id, {
                name: moment.name,
                duration: moment.duration,
                order_index: moment.order_index,
                source_activity_id: moment.activityId,
              });
            }
            totalMomentsPopulated += scaled.length;
            scenesCreated++;
          } else if (entry.mode === 'REALTIME') {
            // Individual realtime scene
            const activity = activityMap.get(entry.activityIds[0]);
            if (!activity) continue;
            const durationSec = activity.duration_minutes ? activity.duration_minutes * 60 : undefined;

            const scene = await api.films.localScenes.create(newFilm.id, {
              name: activity.name,
              order_index: sceneIndex,
              mode: 'MOMENTS',
              duration_seconds: durationSec,
            });

            await upsertScene(ownerFilmId, {
              scene_id: scene.id,
              [activityFkField]: activity.id,
              order_index: sceneIndex,
              scheduled_start_time: activity.start_time || undefined,
              scheduled_duration_minutes: activity.duration_minutes || undefined,
            });

            if (shouldCreateMomentsManually) {
              for (const [momentIndex, moment] of (activity.moments || []).entries()) {
                await api.moments.create(scene.id, {
                  name: moment.name,
                  duration: moment.duration_seconds || 60,
                  order_index: momentIndex,
                });
              }
            }
            totalMomentsPopulated += activity.moments?.length || 0;
            scenesCreated++;
          } else {
            // Individual montage scene
            const activity = activityMap.get(entry.activityIds[0]);
            if (!activity) continue;
            const config = sceneConfigs[activity.id] ?? { mode: 'MONTAGE' as const };
            const targetDuration = config.montageDurationSeconds ?? 60;

            const scene = await api.films.localScenes.create(newFilm.id, {
              name: activity.name,
              order_index: sceneIndex,
              mode: 'MONTAGE',
              duration_seconds: targetDuration,
              montage_style: config.montageStyle ?? MontageStyle.HIGHLIGHTS,
              montage_bpm: config.montageStyle === MontageStyle.RHYTHMIC ? 120 : config.montageBpm,
            });

            await upsertScene(ownerFilmId, {
              scene_id: scene.id,
              [activityFkField]: activity.id,
              order_index: sceneIndex,
              scheduled_start_time: activity.start_time || undefined,
              scheduled_duration_minutes: activity.duration_minutes || undefined,
            });

            const actMoments = activity.moments || [];
            const sourceMoments = actMoments.length > 0
              ? actMoments.map(m => ({ name: m.name, duration_seconds: m.duration_seconds, activityId: activity.id }))
              : [{ name: activity.name, activityId: activity.id }];

            const scaled = scaleMoments(sourceMoments, targetDuration);
            for (const moment of scaled) {
              await api.moments.create(scene.id, {
                name: moment.name,
                duration: moment.duration,
                order_index: moment.order_index,
                source_activity_id: moment.activityId,
              });
            }
            totalMomentsPopulated += scaled.length;
            scenesCreated++;
          }
        }
      } else {
        // ACTIVITY: one scene per selected activity with moments (existing behavior)
        for (let i = 0; i < selectedActivities.length; i++) {
          const activity = selectedActivities[i];

          const scene = await api.films.localScenes.create(newFilm.id, {
            name: activity.name,
            order_index: i,
            mode: 'MOMENTS',
            duration_seconds: activity.duration_minutes ? activity.duration_minutes * 60 : undefined,
          });

          await upsertScene(ownerFilmId, {
            scene_id: scene.id,
            [activityFkField]: activity.id,
            order_index: i,
            scheduled_start_time: activity.start_time || undefined,
            scheduled_duration_minutes: activity.duration_minutes || undefined,
          });

          if (shouldCreateMomentsManually) {
            for (const [momentIndex, moment] of (activity.moments || []).entries()) {
              await api.moments.create(scene.id, {
                name: moment.name,
                duration: moment.duration_seconds || 60,
                order_index: momentIndex,
              });
            }
          }

          totalMomentsPopulated += activity.moments?.length || 0;
          scenesCreated++;
        }
      }

      if (instanceOwner) {
        await api.instanceFilms.cloneFromLibrary(ownerFilmId);
      }

      const createdResult: CreatedFilmResult = {
        filmId: newFilm.id,
        filmName: name,
        packageFilmId: ownerFilmId,
        scenesCreated,
        momentsPopulated: totalMomentsPopulated,
        activityIds: selectedActivities.map(a => a.id),
      };

      setResult(createdResult);
      onFilmCreated(createdResult);
    } catch (err) {
      console.error('Failed to create film:', err);
      setError(err instanceof Error ? err.message : 'Failed to create film. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // ─── Reset & Close ─────────────────────────────────────────────────

  const handleClose = () => {
    setActiveStepIndex(0);
    setFilmType(FilmType.FEATURE);
    setFilmName('');
    setSelectedPreset(null);
    setSelectedActivityIds(new Set());
    setSelectedTemplate(null);
    setSceneConfigs({});
    setSceneAssignments([]);
    setAudioConfigs([]);
    setDurationOverrides([]);
    setCombineMontage(true);
    setCombinedMontageStyle(MontageStyle.HIGHLIGHTS);
    setCombinedMontageDuration(120);
    setError(null);
    setResult(null);
    setIsCreating(false);
    onClose();
  };

  // ─── Render Step Content ───────────────────────────────────────────

  const renderStep = () => {
    if (!currentStep) return null;
    switch (currentStep.id) {
      case 'film-type':
        return (
          <FilmTypeStep
            filmType={filmType}
            filmName={filmName}
            packageName={packageName}
            onFilmTypeChange={handleFilmTypeChange}
            onFilmNameChange={setFilmName}
            disabled={isCreating}
          />
        );
      case 'preset':
        return (
          <MontagePresetStep
            brandId={currentBrand?.id}
            selectedPreset={selectedPreset}
            onSelectPreset={setSelectedPreset}
            disabled={isCreating}
          />
        );
      case 'activities':
        return (
          <ActivitySelectionStep
            activities={activities}
            selectedActivityIds={selectedActivityIds}
            filmType={filmType}
            onToggleActivity={(id: number) => {
              setSelectedActivityIds(prev => {
                const next = new Set(prev);
                if (filmType === FilmType.ACTIVITY) {
                  // ACTIVITY: single select
                  if (next.has(id)) { next.delete(id); } else { next.clear(); next.add(id); }
                } else {
                  if (next.has(id)) { next.delete(id); } else { next.add(id); }
                }
                return next;
              });
            }}
            onToggleAll={() => {
              if (filmType === FilmType.ACTIVITY) return;
              if (selectedActivityIds.size === activities.length) {
                setSelectedActivityIds(new Set());
              } else {
                setSelectedActivityIds(new Set(activities.map(a => a.id)));
              }
            }}
            disabled={isCreating}
          />
        );
      case 'scene-config':
        return (
          <SceneConfigStep
            activities={activities}
            selectedActivityIds={selectedActivityIds}
            sceneConfigs={sceneConfigs}
            onSceneConfigsChange={setSceneConfigs}
            combineMontage={combineMontage}
            combinedMontageStyle={combinedMontageStyle}
            combinedMontageDuration={combinedMontageDuration}
            onCombineMontageChange={setCombineMontage}
            onCombinedStyleChange={setCombinedMontageStyle}
            onCombinedDurationChange={setCombinedMontageDuration}
            sceneOrder={sceneOrder}
            onSceneOrderChange={setSceneOrder}
            disabled={isCreating}
          />
        );
      case 'structure':
        return (
          <StructureTemplateStep
            brandId={currentBrand?.id}
            filmType={filmType}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
            disabled={isCreating}
          />
        );
      case 'scene-assignment':
        return (
          <SceneAssignmentStep
            templateScenes={templateScenes}
            activities={activities.filter(a => selectedActivityIds.has(a.id))}
            assignments={sceneAssignments}
            onAssignmentsChange={setSceneAssignments}
            disabled={isCreating}
          />
        );
      case 'audio':
        return (
          <AudioSourceStep
            templateScenes={templateScenes}
            activities={activities.filter(a => selectedActivityIds.has(a.id))}
            audioConfigs={audioConfigs}
            onAudioConfigsChange={setAudioConfigs}
            disabled={isCreating}
          />
        );
      case 'duration-review':
        return (
          <DurationReviewStep
            templateScenes={templateScenes}
            selectedPreset={selectedPreset}
            durationOverrides={durationOverrides}
            onDurationOverridesChange={setDurationOverrides}
          />
        );
      default:
        return null;
    }
  };

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onClose={isCreating ? undefined : handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(16, 18, 22, 0.95)',
          border: '1px solid rgba(52, 58, 68, 0.4)',
          borderRadius: 3,
          backdropFilter: 'blur(20px)',
          minHeight: 520,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }} component="div">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon sx={{ fontSize: 20, color: '#a78bfa' }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
              Create Film
            </Typography>
            <Typography variant="caption" component="span" sx={{ color: '#64748b', display: 'block' }}>
              {result ? 'Film created successfully' : `Step ${activeStepIndex + 1} of ${visibleSteps.length}`}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        {/* ─── Success State ─── */}
        {result && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: '#10b981', mb: 1.5 }} />
            <Typography variant="h6" sx={{ color: '#f1f5f9', fontWeight: 700, mb: 0.5 }}>
              Film Created!
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
              &ldquo;{result.filmName}&rdquo;
            </Typography>
            <Stack direction="row" spacing={1.5} justifyContent="center">
              <Chip
                icon={<MovieIcon sx={{ fontSize: '14px !important' }} />}
                label={`${result.scenesCreated} scene${result.scenesCreated !== 1 ? 's' : ''}`}
                size="small"
                sx={{ bgcolor: 'rgba(100, 140, 255, 0.12)', color: '#648CFF', fontWeight: 600, fontSize: '0.75rem' }}
              />
              <Chip
                label={`${result.momentsPopulated} moment${result.momentsPopulated !== 1 ? 's' : ''}`}
                size="small"
                sx={{ bgcolor: 'rgba(167, 139, 250, 0.12)', color: '#a78bfa', fontWeight: 600, fontSize: '0.75rem' }}
              />
            </Stack>
          </Box>
        )}

        {/* ─── Wizard Content ─── */}
        {!result && (
          <Stack spacing={2.5}>
            {/* Error */}
            {error && (
              <Alert severity="error" sx={{ bgcolor: 'rgba(239, 68, 68, 0.08)', color: '#fca5a5' }}>
                {error}
              </Alert>
            )}

            {/* Stepper */}
            <Stepper
              activeStep={activeStepIndex}
              alternativeLabel
              sx={{
                '& .MuiStepLabel-label': { color: '#64748b', fontSize: '0.7rem' },
                '& .MuiStepLabel-label.Mui-active': { color: '#a78bfa' },
                '& .MuiStepLabel-label.Mui-completed': { color: '#10b981' },
                '& .MuiStepIcon-root': { color: 'rgba(52, 58, 68, 0.4)' },
                '& .MuiStepIcon-root.Mui-active': { color: '#a78bfa' },
                '& .MuiStepIcon-root.Mui-completed': { color: '#10b981' },
                '& .MuiStepConnector-line': { borderColor: 'rgba(52, 58, 68, 0.4)' },
              }}
            >
              {visibleSteps.map((step) => (
                <Step key={step.id}>
                  <StepLabel>{step.label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step Content */}
            <Box sx={{ minHeight: 280 }}>
              {renderStep()}
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        {result ? (
          <Button
            variant="contained"
            onClick={handleClose}
            sx={{ bgcolor: '#648CFF', '&:hover': { bgcolor: '#5A7BF0' }, borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}
          >
            Done
          </Button>
        ) : (
          <>
            <Button
              onClick={activeStepIndex === 0 ? handleClose : handleBack}
              disabled={isCreating}
              sx={{ color: '#64748b', textTransform: 'none' }}
            >
              {activeStepIndex === 0 ? 'Cancel' : 'Back'}
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canGoNext || isCreating}
              startIcon={isCreating ? <CircularProgress size={16} color="inherit" /> : isLastStep ? <AutoAwesomeIcon sx={{ fontSize: 16 }} /> : undefined}
              title={!canGoNext ? `Current step (${currentStep?.id}): validation required` : ''}
              sx={{
                bgcolor: isLastStep ? '#a78bfa' : '#648CFF',
                '&:hover': { bgcolor: isLastStep ? '#8b5cf6' : '#5A7BF0' },
                '&.Mui-disabled': { bgcolor: 'rgba(167, 139, 250, 0.2)', color: 'rgba(255,255,255,0.3)' },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
              }}
            >
              {isCreating ? 'Creating...' : isLastStep ? 'Create Film' : 'Next'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
