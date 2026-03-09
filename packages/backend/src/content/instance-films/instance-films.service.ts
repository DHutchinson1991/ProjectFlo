import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ShotType, SceneType, SubjectCategory, SubjectPriority, TrackType } from '@prisma/client';
import {
  CreateInstanceSceneDto,
  UpdateInstanceSceneDto,
  CreateInstanceMomentDto,
  UpdateInstanceMomentDto,
  CreateInstanceBeatDto,
  UpdateInstanceBeatDto,
  CreateInstanceTrackDto,
  UpdateInstanceTrackDto,
  CreateInstanceSubjectDto,
  UpdateInstanceSubjectDto,
} from './dto/instance-film.dto';

/**
 * InstanceFilmsService
 *
 * Mirrors the library film content CRUD (scenes, moments, beats, tracks,
 * subjects, locations, recording setups) but operates on the Project* instance
 * tables. These rows are fully independent copies — edits never propagate to
 * the library originals.
 *
 * Endpoint prefix: /instance-films
 */
@Injectable()
export class InstanceFilmsService {
  constructor(private readonly prisma: PrismaService) {}

  // ════════════════════════════════════════════════════════════════════
  // SCENES
  // ════════════════════════════════════════════════════════════════════

  async createScene(projectFilmId: number, dto: CreateInstanceSceneDto) {
    await this.assertProjectFilmExists(projectFilmId);

    const pf = await this.prisma.projectFilm.findUniqueOrThrow({
      where: { id: projectFilmId },
    });

    // Resolve mode from template if provided
    let sceneMode: SceneType = (dto.mode as SceneType) ?? SceneType.MOMENTS;
    if (dto.scene_template_id) {
      const template = await this.prisma.sceneTemplate.findUnique({
        where: { id: dto.scene_template_id },
      });
      if (template?.type) sceneMode = template.type;
    }

    const orderIndex =
      dto.order_index ??
      (await this.prisma.projectFilmScene.count({
        where: { project_film_id: projectFilmId },
      }));

    return this.prisma.projectFilmScene.create({
      data: {
        project_film_id: projectFilmId,
        project_id: pf.project_id,
        inquiry_id: pf.inquiry_id,
        scene_template_id: dto.scene_template_id ?? null,
        name: dto.name,
        mode: sceneMode,
        shot_count: dto.shot_count ?? null,
        duration_seconds: dto.duration_seconds ?? null,
        order_index: orderIndex,
      },
    });
  }

  async findAllScenes(projectFilmId: number) {
    await this.assertProjectFilmExists(projectFilmId);

    return this.prisma.projectFilmScene.findMany({
      where: { project_film_id: projectFilmId },
      include: {
        template: true,
        location_assignment: true,
        moments: {
          orderBy: { order_index: 'asc' },
          include: {
            recording_setup: {
              include: { camera_assignments: { include: { track: true } } },
            },
            subjects: {
              include: { project_subject: { include: { role_template: true } } },
            },
          },
        },
        beats: {
          orderBy: { order_index: 'asc' },
          include: { recording_setup: true },
        },
        recording_setup: {
          include: { camera_assignments: { include: { track: true } } },
        },
        subjects: {
          include: { project_subject: { include: { role_template: true } } },
        },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  async findOneScene(sceneId: number) {
    const scene = await this.prisma.projectFilmScene.findUnique({
      where: { id: sceneId },
      include: {
        template: true,
        location_assignment: true,
        moments: {
          orderBy: { order_index: 'asc' },
          include: {
            recording_setup: {
              include: { camera_assignments: { include: { track: true } } },
            },
            subjects: {
              include: { project_subject: { include: { role_template: true } } },
            },
          },
        },
        beats: {
          orderBy: { order_index: 'asc' },
          include: { recording_setup: true },
        },
        recording_setup: {
          include: { camera_assignments: { include: { track: true } } },
        },
      },
    });
    if (!scene) throw new NotFoundException(`Instance scene ${sceneId} not found`);
    return scene;
  }

  async updateScene(sceneId: number, dto: UpdateInstanceSceneDto) {
    await this.assertInstanceSceneExists(sceneId);

    return this.prisma.projectFilmScene.update({
      where: { id: sceneId },
      data: {
        name: dto.name,
        mode: dto.mode as SceneType | undefined,
        shot_count: dto.shot_count,
        duration_seconds: dto.duration_seconds,
        order_index: dto.order_index,
      },
    });
  }

  async removeScene(sceneId: number) {
    await this.assertInstanceSceneExists(sceneId);
    await this.prisma.projectFilmScene.delete({ where: { id: sceneId } });
    return { deleted: true };
  }

  async reorderScenes(
    projectFilmId: number,
    orderings: Array<{ id: number; order_index: number }>,
  ) {
    await this.assertProjectFilmExists(projectFilmId);
    await Promise.all(
      orderings.map((o) =>
        this.prisma.projectFilmScene.update({
          where: { id: o.id },
          data: { order_index: o.order_index },
        }),
      ),
    );
    return { success: true };
  }

  // ── Scene Recording Setup ─────────────────────────────────────────

  async getSceneRecordingSetup(sceneId: number) {
    await this.assertInstanceSceneExists(sceneId);
    return this.prisma.projectSceneRecordingSetup.findUnique({
      where: { project_scene_id: sceneId },
      include: { camera_assignments: { include: { track: true } } },
    });
  }

  async upsertSceneRecordingSetup(
    sceneId: number,
    data: { audio_track_ids?: number[]; graphics_enabled?: boolean },
  ) {
    await this.assertInstanceSceneExists(sceneId);

    const audioTrackIds = this.dedupeInts(data.audio_track_ids);

    const existing = await this.prisma.projectSceneRecordingSetup.findUnique({
      where: { project_scene_id: sceneId },
    });

    return existing
      ? this.prisma.projectSceneRecordingSetup.update({
          where: { project_scene_id: sceneId },
          data: { audio_track_ids: audioTrackIds, graphics_enabled: !!data.graphics_enabled },
          include: { camera_assignments: { include: { track: true } } },
        })
      : this.prisma.projectSceneRecordingSetup.create({
          data: {
            project_scene_id: sceneId,
            audio_track_ids: audioTrackIds,
            graphics_enabled: !!data.graphics_enabled,
          },
          include: { camera_assignments: { include: { track: true } } },
        });
  }

  async deleteSceneRecordingSetup(sceneId: number) {
    await this.assertInstanceSceneExists(sceneId);
    const existing = await this.prisma.projectSceneRecordingSetup.findUnique({
      where: { project_scene_id: sceneId },
    });
    if (existing) {
      await this.prisma.projectSceneRecordingSetup.delete({
        where: { project_scene_id: sceneId },
      });
    }
    return { message: 'Recording setup deleted' };
  }

  // ════════════════════════════════════════════════════════════════════
  // MOMENTS
  // ════════════════════════════════════════════════════════════════════

  async createMoment(sceneId: number, dto: CreateInstanceMomentDto) {
    await this.assertInstanceSceneExists(sceneId);

    const scene = await this.prisma.projectFilmScene.findUniqueOrThrow({
      where: { id: sceneId },
    });

    const orderIndex =
      dto.order_index ??
      (await this.prisma.projectFilmSceneMoment.count({
        where: { project_scene_id: sceneId },
      }));

    const moment = await this.prisma.projectFilmSceneMoment.create({
      data: {
        project_scene_id: sceneId,
        project_id: scene.project_id,
        inquiry_id: scene.inquiry_id,
        name: dto.name,
        order_index: orderIndex,
        duration: dto.duration ?? 60,
      },
    });

    // Copy scene-level subject assignments to moment
    const sceneSubjects = await this.prisma.projectFilmSceneSubject.findMany({
      where: { project_scene_id: sceneId },
    });
    if (sceneSubjects.length > 0) {
      await this.prisma.projectFilmSceneMomentSubject.createMany({
        data: sceneSubjects.map((s) => ({
          project_moment_id: moment.id,
          project_film_subject_id: s.project_film_subject_id,
          priority: s.priority,
          notes: s.notes,
        })),
        skipDuplicates: true,
      });
    }

    return moment;
  }

  async findAllMoments(sceneId: number) {
    await this.assertInstanceSceneExists(sceneId);

    return this.prisma.projectFilmSceneMoment.findMany({
      where: { project_scene_id: sceneId },
      include: {
        recording_setup: {
          include: { camera_assignments: { include: { track: true } } },
        },
        subjects: {
          include: { project_subject: { include: { role_template: true } } },
        },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  async findOneMoment(momentId: number) {
    const moment = await this.prisma.projectFilmSceneMoment.findUnique({
      where: { id: momentId },
      include: {
        recording_setup: {
          include: { camera_assignments: { include: { track: true } } },
        },
        subjects: {
          include: { project_subject: { include: { role_template: true } } },
        },
      },
    });
    if (!moment) throw new NotFoundException(`Instance moment ${momentId} not found`);
    return moment;
  }

  async updateMoment(momentId: number, dto: UpdateInstanceMomentDto) {
    const moment = await this.prisma.projectFilmSceneMoment.findUnique({ where: { id: momentId } });
    if (!moment) throw new NotFoundException(`Instance moment ${momentId} not found`);

    return this.prisma.projectFilmSceneMoment.update({
      where: { id: momentId },
      data: {
        name: dto.name,
        order_index: dto.order_index,
        duration: dto.duration,
      },
    });
  }

  async removeMoment(momentId: number) {
    const moment = await this.prisma.projectFilmSceneMoment.findUnique({ where: { id: momentId } });
    if (!moment) throw new NotFoundException(`Instance moment ${momentId} not found`);
    await this.prisma.projectFilmSceneMoment.delete({ where: { id: momentId } });
    return { deleted: true };
  }

  async reorderMoments(sceneId: number, orderings: Array<{ id: number; order_index: number }>) {
    await this.assertInstanceSceneExists(sceneId);
    await Promise.all(
      orderings.map((o) =>
        this.prisma.projectFilmSceneMoment.update({
          where: { id: o.id },
          data: { order_index: o.order_index },
        }),
      ),
    );
    return { success: true };
  }

  // ── Moment Recording Setup ────────────────────────────────────────

  async getMomentRecordingSetup(momentId: number) {
    const moment = await this.prisma.projectFilmSceneMoment.findUnique({ where: { id: momentId } });
    if (!moment) throw new NotFoundException(`Instance moment ${momentId} not found`);

    return this.prisma.projectMomentRecordingSetup.findUnique({
      where: { project_moment_id: momentId },
      include: { camera_assignments: { include: { track: true } } },
    });
  }

  async upsertMomentRecordingSetup(
    momentId: number,
    data: {
      camera_assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: ShotType | null }>;
      audio_track_ids?: number[];
      graphics_enabled?: boolean;
      graphics_title?: string | null;
    },
  ) {
    const moment = await this.prisma.projectFilmSceneMoment.findUnique({ where: { id: momentId } });
    if (!moment) throw new NotFoundException(`Instance moment ${momentId} not found`);

    const audioTrackIds = this.dedupeInts(data.audio_track_ids);

    const existing = await this.prisma.projectMomentRecordingSetup.findUnique({
      where: { project_moment_id: momentId },
    });

    const recordingSetup = existing
      ? await this.prisma.projectMomentRecordingSetup.update({
          where: { project_moment_id: momentId },
          data: {
            audio_track_ids: audioTrackIds,
            graphics_enabled: data.graphics_enabled ?? existing.graphics_enabled,
            graphics_title: data.graphics_title !== undefined ? data.graphics_title : existing.graphics_title,
          },
        })
      : await this.prisma.projectMomentRecordingSetup.create({
          data: {
            project_moment_id: momentId,
            audio_track_ids: audioTrackIds,
            graphics_enabled: !!data.graphics_enabled,
            graphics_title: data.graphics_title ?? null,
          },
        });

    // Sync camera assignments
    if (data.camera_assignments) {
      await this.prisma.projectCameraSubjectAssignment.deleteMany({
        where: { recording_setup_id: recordingSetup.id },
      });
      for (const ca of data.camera_assignments) {
        await this.prisma.projectCameraSubjectAssignment.create({
          data: {
            recording_setup_id: recordingSetup.id,
            track_id: ca.track_id,
            subject_ids: ca.subject_ids ?? [],
            shot_type: ca.shot_type ?? null,
          },
        });
      }
    }

    return this.prisma.projectMomentRecordingSetup.findUnique({
      where: { project_moment_id: momentId },
      include: { camera_assignments: { include: { track: true } } },
    });
  }

  async deleteMomentRecordingSetup(momentId: number) {
    const existing = await this.prisma.projectMomentRecordingSetup.findUnique({
      where: { project_moment_id: momentId },
    });
    if (existing) {
      await this.prisma.projectMomentRecordingSetup.delete({
        where: { project_moment_id: momentId },
      });
    }
    return { message: 'Recording setup deleted' };
  }

  // ════════════════════════════════════════════════════════════════════
  // BEATS
  // ════════════════════════════════════════════════════════════════════

  async createBeat(sceneId: number, dto: CreateInstanceBeatDto) {
    await this.assertInstanceSceneExists(sceneId);

    const scene = await this.prisma.projectFilmScene.findUniqueOrThrow({
      where: { id: sceneId },
    });

    const orderIndex =
      dto.order_index ??
      (await this.prisma.projectFilmSceneBeat.count({
        where: { project_scene_id: sceneId },
      }));

    return this.prisma.projectFilmSceneBeat.create({
      data: {
        project_scene_id: sceneId,
        project_id: scene.project_id,
        inquiry_id: scene.inquiry_id,
        name: dto.name,
        order_index: orderIndex,
        shot_count: dto.shot_count ?? null,
        duration_seconds: dto.duration_seconds ?? 10,
      },
    });
  }

  async findAllBeats(sceneId: number) {
    await this.assertInstanceSceneExists(sceneId);

    return this.prisma.projectFilmSceneBeat.findMany({
      where: { project_scene_id: sceneId },
      include: { recording_setup: true },
      orderBy: { order_index: 'asc' },
    });
  }

  async findOneBeat(beatId: number) {
    const beat = await this.prisma.projectFilmSceneBeat.findUnique({
      where: { id: beatId },
      include: { recording_setup: true },
    });
    if (!beat) throw new NotFoundException(`Instance beat ${beatId} not found`);
    return beat;
  }

  async updateBeat(beatId: number, dto: UpdateInstanceBeatDto) {
    const beat = await this.prisma.projectFilmSceneBeat.findUnique({ where: { id: beatId } });
    if (!beat) throw new NotFoundException(`Instance beat ${beatId} not found`);

    return this.prisma.projectFilmSceneBeat.update({
      where: { id: beatId },
      data: {
        name: dto.name,
        order_index: dto.order_index,
        shot_count: dto.shot_count ?? beat.shot_count,
        duration_seconds: dto.duration_seconds ?? beat.duration_seconds,
      },
      include: { recording_setup: true },
    });
  }

  async removeBeat(beatId: number) {
    const beat = await this.prisma.projectFilmSceneBeat.findUnique({ where: { id: beatId } });
    if (!beat) throw new NotFoundException(`Instance beat ${beatId} not found`);
    await this.prisma.projectFilmSceneBeat.delete({ where: { id: beatId } });
    return { deleted: true };
  }

  // ── Beat Recording Setup ──────────────────────────────────────────

  async getBeatRecordingSetup(beatId: number) {
    const beat = await this.prisma.projectFilmSceneBeat.findUnique({ where: { id: beatId } });
    if (!beat) throw new NotFoundException(`Instance beat ${beatId} not found`);

    return this.prisma.projectBeatRecordingSetup.findUnique({
      where: { project_beat_id: beatId },
    });
  }

  async upsertBeatRecordingSetup(
    beatId: number,
    data: { camera_track_ids?: number[]; audio_track_ids?: number[]; graphics_enabled?: boolean },
  ) {
    const beat = await this.prisma.projectFilmSceneBeat.findUnique({ where: { id: beatId } });
    if (!beat) throw new NotFoundException(`Instance beat ${beatId} not found`);

    const cameraTrackIds = this.dedupeInts(data.camera_track_ids);
    const audioTrackIds = this.dedupeInts(data.audio_track_ids);

    const existing = await this.prisma.projectBeatRecordingSetup.findUnique({
      where: { project_beat_id: beatId },
    });

    return existing
      ? this.prisma.projectBeatRecordingSetup.update({
          where: { project_beat_id: beatId },
          data: { camera_track_ids: cameraTrackIds, audio_track_ids: audioTrackIds, graphics_enabled: !!data.graphics_enabled },
        })
      : this.prisma.projectBeatRecordingSetup.create({
          data: {
            project_beat_id: beatId,
            camera_track_ids: cameraTrackIds,
            audio_track_ids: audioTrackIds,
            graphics_enabled: !!data.graphics_enabled,
          },
        });
  }

  async deleteBeatRecordingSetup(beatId: number) {
    const existing = await this.prisma.projectBeatRecordingSetup.findUnique({
      where: { project_beat_id: beatId },
    });
    if (existing) {
      await this.prisma.projectBeatRecordingSetup.delete({
        where: { project_beat_id: beatId },
      });
    }
    return { message: 'Recording setup deleted' };
  }

  // ════════════════════════════════════════════════════════════════════
  // TRACKS
  // ════════════════════════════════════════════════════════════════════

  async findAllTracks(projectFilmId: number, activeOnly = false) {
    await this.assertProjectFilmExists(projectFilmId);

    return this.prisma.projectFilmTimelineTrack.findMany({
      where: {
        project_film_id: projectFilmId,
        ...(activeOnly ? { is_active: true } : {}),
      },
      orderBy: { order_index: 'asc' },
    });
  }

  async createTrack(projectFilmId: number, dto: CreateInstanceTrackDto) {
    await this.assertProjectFilmExists(projectFilmId);

    const pf = await this.prisma.projectFilm.findUniqueOrThrow({
      where: { id: projectFilmId },
    });

    const orderIndex =
      dto.order_index ??
      (await this.prisma.projectFilmTimelineTrack.count({
        where: { project_film_id: projectFilmId },
      }));

    return this.prisma.projectFilmTimelineTrack.create({
      data: {
        project_film_id: projectFilmId,
        project_id: pf.project_id,
        inquiry_id: pf.inquiry_id,
        name: dto.name,
        type: dto.type as TrackType,
        order_index: orderIndex,
        is_active: dto.is_active ?? true,
        is_unmanned: dto.is_unmanned ?? false,
        contributor_id: dto.contributor_id ?? null,
      },
    });
  }

  async updateTrack(trackId: number, dto: UpdateInstanceTrackDto) {
    const track = await this.prisma.projectFilmTimelineTrack.findUnique({ where: { id: trackId } });
    if (!track) throw new NotFoundException(`Instance track ${trackId} not found`);

    return this.prisma.projectFilmTimelineTrack.update({
      where: { id: trackId },
      data: {
        name: dto.name,
        type: dto.type as TrackType | undefined,
        order_index: dto.order_index,
        is_active: dto.is_active,
        is_unmanned: dto.is_unmanned,
        contributor_id: dto.contributor_id,
      },
    });
  }

  async removeTrack(trackId: number) {
    const track = await this.prisma.projectFilmTimelineTrack.findUnique({ where: { id: trackId } });
    if (!track) throw new NotFoundException(`Instance track ${trackId} not found`);
    await this.prisma.projectFilmTimelineTrack.delete({ where: { id: trackId } });
    return { deleted: true };
  }

  // ════════════════════════════════════════════════════════════════════
  // SUBJECTS
  // ════════════════════════════════════════════════════════════════════

  async findAllSubjects(projectFilmId: number) {
    await this.assertProjectFilmExists(projectFilmId);

    return this.prisma.projectFilmSubject.findMany({
      where: { project_film_id: projectFilmId },
      include: { role_template: true },
      orderBy: { id: 'asc' },
    });
  }

  async createSubject(projectFilmId: number, dto: CreateInstanceSubjectDto) {
    await this.assertProjectFilmExists(projectFilmId);

    const pf = await this.prisma.projectFilm.findUniqueOrThrow({
      where: { id: projectFilmId },
    });

    return this.prisma.projectFilmSubject.create({
      data: {
        project_film_id: projectFilmId,
        project_id: pf.project_id,
        inquiry_id: pf.inquiry_id,
        name: dto.name,
        category: (dto.category as SubjectCategory) ?? undefined,
        role_template_id: dto.role_template_id ?? null,
        is_custom: dto.is_custom ?? false,
      },
      include: { role_template: true },
    });
  }

  async updateSubject(subjectId: number, dto: UpdateInstanceSubjectDto) {
    const subject = await this.prisma.projectFilmSubject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new NotFoundException(`Instance subject ${subjectId} not found`);

    return this.prisma.projectFilmSubject.update({
      where: { id: subjectId },
      data: {
        name: dto.name,
        category: dto.category as SubjectCategory | undefined,
        role_template_id: dto.role_template_id,
        is_custom: dto.is_custom,
      },
      include: { role_template: true },
    });
  }

  async removeSubject(subjectId: number) {
    const subject = await this.prisma.projectFilmSubject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new NotFoundException(`Instance subject ${subjectId} not found`);
    await this.prisma.projectFilmSubject.delete({ where: { id: subjectId } });
    return { deleted: true };
  }

  // ════════════════════════════════════════════════════════════════════
  // LOCATIONS
  // ════════════════════════════════════════════════════════════════════

  async findAllLocations(projectFilmId: number) {
    await this.assertProjectFilmExists(projectFilmId);

    return this.prisma.projectFilmLocation.findMany({
      where: { project_film_id: projectFilmId },
      include: { location: true },
      orderBy: { id: 'asc' },
    });
  }

  async createLocation(projectFilmId: number, data: { location_id: number; notes?: string }) {
    await this.assertProjectFilmExists(projectFilmId);

    const pf = await this.prisma.projectFilm.findUniqueOrThrow({
      where: { id: projectFilmId },
    });

    return this.prisma.projectFilmLocation.create({
      data: {
        project_film_id: projectFilmId,
        project_id: pf.project_id,
        inquiry_id: pf.inquiry_id,
        location_id: data.location_id,
        notes: data.notes ?? null,
      },
      include: { location: true },
    });
  }

  async removeLocation(locationId: number) {
    const loc = await this.prisma.projectFilmLocation.findUnique({ where: { id: locationId } });
    if (!loc) throw new NotFoundException(`Instance film location ${locationId} not found`);
    await this.prisma.projectFilmLocation.delete({ where: { id: locationId } });
    return { deleted: true };
  }

  // ════════════════════════════════════════════════════════════════════
  // SCENE SUBJECTS (assignment of film subjects to a specific scene)
  // ════════════════════════════════════════════════════════════════════

  async findSceneSubjects(sceneId: number) {
    await this.assertInstanceSceneExists(sceneId);

    return this.prisma.projectFilmSceneSubject.findMany({
      where: { project_scene_id: sceneId },
      include: { project_subject: { include: { role_template: true } } },
    });
  }

  async addSceneSubject(
    sceneId: number,
    data: { project_film_subject_id: number; priority?: number; notes?: string },
  ) {
    await this.assertInstanceSceneExists(sceneId);

    return this.prisma.projectFilmSceneSubject.create({
      data: {
        project_scene_id: sceneId,
        project_film_subject_id: data.project_film_subject_id,
        priority: (data.priority as unknown as SubjectPriority) ?? SubjectPriority.BACKGROUND,
        notes: data.notes ?? null,
      },
      include: { project_subject: { include: { role_template: true } } },
    });
  }

  async removeSceneSubject(id: number) {
    const ss = await this.prisma.projectFilmSceneSubject.findUnique({ where: { id } });
    if (!ss) throw new NotFoundException(`Instance scene subject ${id} not found`);
    await this.prisma.projectFilmSceneSubject.delete({ where: { id } });
    return { deleted: true };
  }

  // ════════════════════════════════════════════════════════════════════
  // SCENE LOCATIONS (scene-level location assignment)
  // ════════════════════════════════════════════════════════════════════

  async getSceneLocation(sceneId: number) {
    await this.assertInstanceSceneExists(sceneId);
    return this.prisma.projectFilmSceneLocation.findUnique({
      where: { project_scene_id: sceneId },
    });
  }

  async setSceneLocation(sceneId: number, data: { location_id: number }) {
    await this.assertInstanceSceneExists(sceneId);

    const existing = await this.prisma.projectFilmSceneLocation.findUnique({
      where: { project_scene_id: sceneId },
    });

    return existing
      ? this.prisma.projectFilmSceneLocation.update({
          where: { project_scene_id: sceneId },
          data: { location_id: data.location_id },
        })
      : this.prisma.projectFilmSceneLocation.create({
          data: { project_scene_id: sceneId, location_id: data.location_id },
        });
  }

  async removeSceneLocation(sceneId: number) {
    const existing = await this.prisma.projectFilmSceneLocation.findUnique({
      where: { project_scene_id: sceneId },
    });
    if (existing) {
      await this.prisma.projectFilmSceneLocation.delete({
        where: { project_scene_id: sceneId },
      });
    }
    return { deleted: true };
  }

  // ════════════════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════════════════

  private async assertProjectFilmExists(id: number) {
    const pf = await this.prisma.projectFilm.findUnique({ where: { id } });
    if (!pf) throw new NotFoundException(`ProjectFilm ${id} not found`);
    return pf;
  }

  private async assertInstanceSceneExists(id: number) {
    const scene = await this.prisma.projectFilmScene.findUnique({ where: { id } });
    if (!scene) throw new NotFoundException(`Instance scene ${id} not found`);
    return scene;
  }

  private dedupeInts(arr?: number[]): number[] {
    return Array.from(new Set((arr ?? []).filter((v) => Number.isInteger(v))));
  }
}
