import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { SceneType } from '@prisma/client';
import { CreateInstanceSceneDto } from '../dto/create-instance-scene.dto';
import { UpdateInstanceSceneDto } from '../dto/update-instance-scene.dto';

@Injectable()
export class InstanceSceneService {
  constructor(private readonly prisma: PrismaService) {}

  async createScene(projectFilmId: number, dto: CreateInstanceSceneDto) {
    const pf = await this.assertProjectFilmExists(projectFilmId);

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

    const audioTrackIds = dedupeInts(data.audio_track_ids);

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

  // ── Helpers ───────────────────────────────────────────────────────

  async assertProjectFilmExists(id: number) {
    const pf = await this.prisma.projectFilm.findUnique({ where: { id } });
    if (!pf) throw new NotFoundException(`ProjectFilm ${id} not found`);
    return pf;
  }

  async assertInstanceSceneExists(id: number) {
    const scene = await this.prisma.projectFilmScene.findUnique({ where: { id } });
    if (!scene) throw new NotFoundException(`Instance scene ${id} not found`);
    return scene;
  }
}

/** Deduplicate an integer array. */
export function dedupeInts(arr?: number[]): number[] {
  return Array.from(new Set((arr ?? []).filter((v) => Number.isInteger(v))));
}
