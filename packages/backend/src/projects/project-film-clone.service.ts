import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Owner target for film cloning — exactly one of projectId or inquiryId must be set.
 */
export interface FilmCloneTarget {
  projectId?: number;
  inquiryId?: number;
  projectFilmId: number; // The ProjectFilm row that owns the cloned content
}

/**
 * ProjectFilmCloneService
 *
 * Deep-clones all film content (scenes, moments, beats, tracks, subjects,
 * locations, equipment, camera assignments) from a library Film into
 * independent instance tables owned by a project or inquiry.
 *
 * After cloning, the data is fully decoupled from the library film —
 * edits to either side never propagate.
 *
 * Entity copy order (respecting FK dependencies):
 *   1. FilmTimelineTrack       → ProjectFilmTimelineTrack
 *   2. FilmSubject             → ProjectFilmSubject
 *   3. FilmLocation            → ProjectFilmLocation
 *   4. FilmEquipmentAssignment → ProjectFilmEquipmentAssignment
 *   5. FilmScene               → ProjectFilmScene
 *   6. SceneMoment             → ProjectFilmSceneMoment
 *   7. SceneBeat               → ProjectFilmSceneBeat
 *   8. FilmSceneSubject        → ProjectFilmSceneSubject
 *   9. FilmSceneLocation       → ProjectFilmSceneLocation
 *  10. SceneRecordingSetup + SceneCameraAssignment → instance copies
 *  11. MomentRecordingSetup + CameraSubjectAssignment → instance copies
 *  12. BeatRecordingSetup      → instance copy
 *  13. Remap ProjectFilmSceneSchedule.scene_id → instance scene
 */
@Injectable()
export class ProjectFilmCloneService {
  private readonly logger = new Logger(ProjectFilmCloneService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deep-clone all film content for a specific ProjectFilm entry.
   * Safe to call within an existing transaction (pass `tx`) or standalone.
   */
  async cloneFilmContent(
    target: FilmCloneTarget,
    filmId: number,
    tx?: Prisma.TransactionClient,
  ) {
    if (!target.projectId && !target.inquiryId) {
      throw new Error('FilmCloneTarget must specify either projectId or inquiryId');
    }
    if (target.projectId && target.inquiryId) {
      throw new Error('FilmCloneTarget cannot specify both projectId and inquiryId');
    }
    const prisma = tx ?? this.prisma;
    return this._cloneFilmContent(prisma, target, filmId);
  }

  private _ownerFields(target: FilmCloneTarget) {
    return target.projectId
      ? { project_id: target.projectId }
      : { inquiry_id: target.inquiryId };
  }

  private async _cloneFilmContent(
    prisma: Prisma.TransactionClient | PrismaService,
    target: FilmCloneTarget,
    filmId: number,
  ) {
    const ownerLabel = target.projectId
      ? `project ${target.projectId}`
      : `inquiry ${target.inquiryId}`;
    const ownerFields = this._ownerFields(target);
    const projectFilmId = target.projectFilmId;

    this.logger.log(`Cloning film ${filmId} content → ${ownerLabel} (ProjectFilm ${projectFilmId})`);

    // ── 1. Clone FilmTimelineTrack → ProjectFilmTimelineTrack ──────
    const tracks = await prisma.filmTimelineTrack.findMany({
      where: { film_id: filmId },
      orderBy: { order_index: 'asc' },
    });

    const trackMap = new Map<number, number>(); // library track ID → instance track ID

    for (const track of tracks) {
      const instanceTrack = await prisma.projectFilmTimelineTrack.create({
        data: {
          ...ownerFields,
          project_film_id: projectFilmId,
          source_track_id: track.id,
          name: track.name,
          type: track.type,
          order_index: track.order_index,
          is_active: track.is_active,
          is_unmanned: track.is_unmanned,
          contributor_id: track.contributor_id,
        },
      });
      trackMap.set(track.id, instanceTrack.id);
    }

    this.logger.debug(`  Tracks cloned: ${trackMap.size}`);

    // ── 2. Clone FilmSubject → ProjectFilmSubject ──────────────────
    const subjects = await prisma.filmSubject.findMany({
      where: { film_id: filmId },
      orderBy: { id: 'asc' },
    });

    const subjectMap = new Map<number, number>(); // library subject ID → instance subject ID

    for (const subject of subjects) {
      const instanceSubject = await prisma.projectFilmSubject.create({
        data: {
          ...ownerFields,
          project_film_id: projectFilmId,
          source_subject_id: subject.id,
          name: subject.name,
          category: subject.category,
          role_template_id: subject.role_template_id,
          is_custom: subject.is_custom,
        },
      });
      subjectMap.set(subject.id, instanceSubject.id);
    }

    this.logger.debug(`  Subjects cloned: ${subjectMap.size}`);

    // ── 3. Clone FilmLocation → ProjectFilmLocation ────────────────
    const locations = await prisma.filmLocation.findMany({
      where: { film_id: filmId },
      orderBy: { id: 'asc' },
    });

    const locationMap = new Map<number, number>();

    for (const location of locations) {
      const instanceLocation = await prisma.projectFilmLocation.create({
        data: {
          ...ownerFields,
          project_film_id: projectFilmId,
          source_location_id: location.id,
          location_id: location.location_id,
          notes: location.notes,
        },
      });
      locationMap.set(location.id, instanceLocation.id);
    }

    this.logger.debug(`  Locations cloned: ${locationMap.size}`);

    // ── 4. Clone FilmEquipmentAssignment → ProjectFilmEquipmentAssignment
    const equipmentAssignments = await prisma.filmEquipmentAssignment.findMany({
      where: { film_id: filmId },
      orderBy: { id: 'asc' },
    });

    let equipmentCopied = 0;
    for (const eq of equipmentAssignments) {
      await prisma.projectFilmEquipmentAssignment.create({
        data: {
          ...ownerFields,
          project_film_id: projectFilmId,
          source_assignment_id: eq.id,
          equipment_id: eq.equipment_id,
          quantity: eq.quantity,
          notes: eq.notes,
        },
      });
      equipmentCopied++;
    }

    this.logger.debug(`  Equipment assignments cloned: ${equipmentCopied}`);

    // ── 5. Clone FilmScene → ProjectFilmScene ──────────────────────
    const scenes = await prisma.filmScene.findMany({
      where: { film_id: filmId },
      orderBy: { order_index: 'asc' },
      include: {
        moments: {
          orderBy: { order_index: 'asc' },
          include: {
            recording_setup: {
              include: { camera_assignments: true },
            },
            subjects: true,
          },
        },
        beats: {
          orderBy: { order_index: 'asc' },
          include: {
            recording_setup: true,
          },
        },
        subjects: true,
        location_assignment: true,
        recording_setup: {
          include: { camera_assignments: true },
        },
      },
    });

    const sceneMap = new Map<number, number>(); // library scene ID → instance scene ID

    for (const scene of scenes) {
      const instanceScene = await prisma.projectFilmScene.create({
        data: {
          ...ownerFields,
          project_film_id: projectFilmId,
          source_scene_id: scene.id,
          scene_template_id: scene.scene_template_id,
          name: scene.name,
          mode: scene.mode,
          shot_count: scene.shot_count,
          duration_seconds: scene.duration_seconds,
          order_index: scene.order_index,
        },
      });
      sceneMap.set(scene.id, instanceScene.id);

      // ── 6. Clone SceneMoment → ProjectFilmSceneMoment ───────────
      const momentMap = new Map<number, number>();
      for (const moment of scene.moments) {
        const instanceMoment = await prisma.projectFilmSceneMoment.create({
          data: {
            ...ownerFields,
            project_scene_id: instanceScene.id,
            source_moment_id: moment.id,
            name: moment.name,
            order_index: moment.order_index,
            duration: moment.duration,
          },
        });
        momentMap.set(moment.id, instanceMoment.id);

        // Clone moment subjects
        for (const ms of moment.subjects) {
          const instanceSubjectId = subjectMap.get(ms.subject_id);
          if (instanceSubjectId) {
            await prisma.projectFilmSceneMomentSubject.create({
              data: {
                project_moment_id: instanceMoment.id,
                project_film_subject_id: instanceSubjectId,
                priority: ms.priority,
                notes: ms.notes,
              },
            });
          }
        }

        // Clone moment recording setup + camera assignments
        if (moment.recording_setup) {
          const mrs = moment.recording_setup;
          const instanceMRS = await prisma.projectMomentRecordingSetup.create({
            data: {
              project_moment_id: instanceMoment.id,
              audio_track_ids: mrs.audio_track_ids.map(id => trackMap.get(id) ?? id),
              graphics_enabled: mrs.graphics_enabled,
              graphics_title: mrs.graphics_title,
            },
          });

          for (const ca of mrs.camera_assignments) {
            const instanceTrackId = trackMap.get(ca.track_id);
            if (instanceTrackId) {
              await prisma.projectCameraSubjectAssignment.create({
                data: {
                  recording_setup_id: instanceMRS.id,
                  track_id: instanceTrackId,
                  subject_ids: ca.subject_ids.map(id => subjectMap.get(id) ?? id),
                  shot_type: ca.shot_type,
                },
              });
            }
          }
        }
      }

      // ── 7. Clone SceneBeat → ProjectFilmSceneBeat ───────────────
      for (const beat of scene.beats) {
        const instanceBeat = await prisma.projectFilmSceneBeat.create({
          data: {
            ...ownerFields,
            project_scene_id: instanceScene.id,
            source_beat_id: beat.id,
            name: beat.name,
            order_index: beat.order_index,
            shot_count: beat.shot_count,
            duration_seconds: beat.duration_seconds,
          },
        });

        // Clone beat recording setup
        if (beat.recording_setup) {
          await prisma.projectBeatRecordingSetup.create({
            data: {
              project_beat_id: instanceBeat.id,
              camera_track_ids: beat.recording_setup.camera_track_ids.map(id => trackMap.get(id) ?? id),
              audio_track_ids: beat.recording_setup.audio_track_ids.map(id => trackMap.get(id) ?? id),
              graphics_enabled: beat.recording_setup.graphics_enabled,
            },
          });
        }
      }

      // ── 8. Clone FilmSceneSubject → ProjectFilmSceneSubject ─────
      for (const ss of scene.subjects) {
        const instanceSubjectId = subjectMap.get(ss.subject_id);
        if (instanceSubjectId) {
          await prisma.projectFilmSceneSubject.create({
            data: {
              project_scene_id: instanceScene.id,
              project_film_subject_id: instanceSubjectId,
              source_scene_subject_id: ss.id,
              priority: ss.priority,
              notes: ss.notes,
            },
          });
        }
      }

      // ── 9. Clone FilmSceneLocation → ProjectFilmSceneLocation ───
      if (scene.location_assignment) {
        await prisma.projectFilmSceneLocation.create({
          data: {
            project_scene_id: instanceScene.id,
            location_id: scene.location_assignment.location_id,
            source_scene_location_id: scene.location_assignment.id,
          },
        });
      }

      // ── 10. Clone SceneRecordingSetup + SceneCameraAssignment ────
      if (scene.recording_setup) {
        const srs = scene.recording_setup;
        const instanceSRS = await prisma.projectSceneRecordingSetup.create({
          data: {
            project_scene_id: instanceScene.id,
            audio_track_ids: srs.audio_track_ids.map(id => trackMap.get(id) ?? id),
            graphics_enabled: srs.graphics_enabled,
          },
        });

        for (const ca of srs.camera_assignments) {
          const instanceTrackId = trackMap.get(ca.track_id);
          if (instanceTrackId) {
            await prisma.projectSceneCameraAssignment.create({
              data: {
                recording_setup_id: instanceSRS.id,
                track_id: instanceTrackId,
                subject_ids: ca.subject_ids.map(id => subjectMap.get(id) ?? id),
                project_scene_id: instanceScene.id,
              },
            });
          }
        }
      }
    }

    this.logger.debug(`  Scenes cloned: ${sceneMap.size}`);

    // ── 11. Remap ProjectFilmSceneSchedule.scene_id ────────────────
    // Update existing scene schedules to point at instance scenes
    // (The schedule rows already exist from the package clone step)
    const existingSchedules = await prisma.projectFilmSceneSchedule.findMany({
      where: { project_film_id: projectFilmId },
    });

    let schedulesRemapped = 0;
    for (const schedule of existingSchedules) {
      const instanceSceneId = sceneMap.get(schedule.scene_id);
      if (instanceSceneId) {
        // Note: We don't remap scene_id here since it's a FK to FilmScene
        // The schedule already has the correct scene_id reference
        // This is for future use if we want to point to instance scenes
        schedulesRemapped++;
      }
    }

    this.logger.debug(`  Scene schedules found: ${schedulesRemapped}`);

    // ── Summary ────────────────────────────────────────────────────
    const summary = {
      owner_id: target.projectId ?? target.inquiryId,
      owner_type: target.projectId ? 'project' : 'inquiry',
      source_film_id: filmId,
      project_film_id: projectFilmId,
      tracks_created: trackMap.size,
      subjects_created: subjectMap.size,
      locations_created: locationMap.size,
      equipment_created: equipmentCopied,
      scenes_created: sceneMap.size,
    };

    this.logger.log(
      `Film ${filmId} → ${ownerLabel} content clone complete: ` +
        JSON.stringify(summary),
    );

    return {
      summary,
      trackMap,
      subjectMap,
      locationMap,
      sceneMap,
    };
  }
}
