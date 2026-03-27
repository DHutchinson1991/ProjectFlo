import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { CreateInstanceBeatDto } from '../dto/create-instance-beat.dto';
import { UpdateInstanceBeatDto } from '../dto/update-instance-beat.dto';
import { dedupeInts } from './instance-scene.service';

@Injectable()
export class InstanceBeatService {
  constructor(private readonly prisma: PrismaService) {}

  async createBeat(sceneId: number, dto: CreateInstanceBeatDto) {
    const scene = await this.assertSceneExists(sceneId);

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
    await this.assertSceneExists(sceneId);

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

    const cameraTrackIds = dedupeInts(data.camera_track_ids);
    const audioTrackIds = dedupeInts(data.audio_track_ids);

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

  private async assertSceneExists(id: number) {
    const scene = await this.prisma.projectFilmScene.findUnique({ where: { id } });
    if (!scene) throw new NotFoundException(`Instance scene ${id} not found`);
    return scene;
  }
}
