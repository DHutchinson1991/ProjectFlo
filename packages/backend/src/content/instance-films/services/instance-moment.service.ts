import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { ShotType } from '@prisma/client';
import { CreateInstanceMomentDto } from '../dto/create-instance-moment.dto';
import { UpdateInstanceMomentDto } from '../dto/update-instance-moment.dto';
import { dedupeInts } from './instance-scene.service';

@Injectable()
export class InstanceMomentService {
  constructor(private readonly prisma: PrismaService) {}

  async createMoment(sceneId: number, dto: CreateInstanceMomentDto) {
    const scene = await this.assertSceneExists(sceneId);

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
    await this.assertSceneExists(sceneId);

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
    await this.assertSceneExists(sceneId);
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

    const audioTrackIds = dedupeInts(data.audio_track_ids);

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

  private async assertSceneExists(id: number) {
    const scene = await this.prisma.projectFilmScene.findUnique({ where: { id } });
    if (!scene) throw new NotFoundException(`Instance scene ${id} not found`);
    return scene;
  }
}
