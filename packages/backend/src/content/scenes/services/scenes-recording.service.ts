import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { SceneMapper } from '../mappers/scene.mapper';

@Injectable()
export class ScenesRecordingService {
    constructor(private prisma: PrismaService) {}

    async getRecordingSetup(sceneId: number) {
        const scene = await this.prisma.filmScene.findUnique({
            where: { id: sceneId },
            include: {
                recording_setup: {
                    include: { camera_assignments: { include: { track: true } } },
                },
            },
        });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }
        return SceneMapper.toRecordingSetupWithAssignments(scene.recording_setup);
    }

    async upsertRecordingSetup(
        sceneId: number,
        data: {
            camera_track_ids?: number[];
            audio_track_ids?: number[];
            graphics_enabled?: boolean;
        },
    ) {
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const cameraTrackIds = Array.from(
            new Set((data.camera_track_ids || []).filter(id => Number.isInteger(id))),
        );
        const audioTrackIds = Array.from(
            new Set((data.audio_track_ids || []).filter(id => Number.isInteger(id))),
        );

        const existing = await this.prisma.sceneRecordingSetup.findUnique({
            where: { scene_id: sceneId },
        });

        if (existing) {
            await this.prisma.sceneCameraAssignment.deleteMany({
                where: { recording_setup_id: existing.id },
            });
            return this.prisma.sceneRecordingSetup.update({
                where: { scene_id: sceneId },
                data: {
                    audio_track_ids: audioTrackIds,
                    graphics_enabled: !!data.graphics_enabled,
                    ...(cameraTrackIds.length > 0
                        ? {
                              camera_assignments: {
                                  createMany: {
                                      data: cameraTrackIds.map(trackId => ({
                                          track_id: trackId,
                                          subject_ids: [],
                                      })),
                                  },
                              },
                          }
                        : {}),
                },
            });
        }

        return this.prisma.sceneRecordingSetup.create({
            data: {
                scene_id: sceneId,
                audio_track_ids: audioTrackIds,
                graphics_enabled: !!data.graphics_enabled,
                ...(cameraTrackIds.length > 0
                    ? {
                          camera_assignments: {
                              createMany: {
                                  data: cameraTrackIds.map(trackId => ({
                                      track_id: trackId,
                                      subject_ids: [],
                                  })),
                              },
                          },
                      }
                    : {}),
            },
        });
    }

    async deleteRecordingSetup(sceneId: number) {
        const existing = await this.prisma.sceneRecordingSetup.findUnique({
            where: { scene_id: sceneId },
        });
        if (!existing) {
            return { message: `Scene recording setup not found` };
        }
        await this.prisma.sceneRecordingSetup.delete({ where: { scene_id: sceneId } });
        return { message: `Scene recording setup deleted successfully` };
    }
}
