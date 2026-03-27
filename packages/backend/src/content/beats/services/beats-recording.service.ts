import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { BeatRecordingSetupDto } from '../types/beat.types';

@Injectable()
export class BeatsRecordingService {
    constructor(private prisma: PrismaService) {}

    async getRecordingSetup(id: number): Promise<BeatRecordingSetupDto | null> {
        const beat = await this.prisma.sceneBeat.findUnique({
            where: { id },
            include: { recording_setup: true },
        });
        if (!beat) {
            throw new NotFoundException(`Beat with ID ${id} not found`);
        }
        if (!beat.recording_setup) return null;
        return {
            id: beat.recording_setup.id,
            camera_track_ids: beat.recording_setup.camera_track_ids,
            audio_track_ids: beat.recording_setup.audio_track_ids,
            graphics_enabled: beat.recording_setup.graphics_enabled,
            created_at: beat.recording_setup.created_at,
            updated_at: beat.recording_setup.updated_at,
        };
    }

    async upsertRecordingSetup(
        id: number,
        data: { camera_track_ids?: number[]; audio_track_ids?: number[]; graphics_enabled?: boolean },
    ): Promise<BeatRecordingSetupDto> {
        const beat = await this.prisma.sceneBeat.findUnique({ where: { id } });
        if (!beat) {
            throw new NotFoundException(`Beat with ID ${id} not found`);
        }

        const cameraTrackIds = Array.from(
            new Set((data.camera_track_ids || []).filter(v => Number.isInteger(v))),
        );
        const audioTrackIds = Array.from(
            new Set((data.audio_track_ids || []).filter(v => Number.isInteger(v))),
        );

        const existing = await this.prisma.beatRecordingSetup.findUnique({
            where: { beat_id: id },
        });
        const next = existing
            ? await this.prisma.beatRecordingSetup.update({
                  where: { beat_id: id },
                  data: {
                      camera_track_ids: cameraTrackIds,
                      audio_track_ids: audioTrackIds,
                      graphics_enabled: !!data.graphics_enabled,
                  },
              })
            : await this.prisma.beatRecordingSetup.create({
                  data: {
                      beat_id: id,
                      camera_track_ids: cameraTrackIds,
                      audio_track_ids: audioTrackIds,
                      graphics_enabled: !!data.graphics_enabled,
                  },
              });

        return {
            id: next.id,
            camera_track_ids: next.camera_track_ids,
            audio_track_ids: next.audio_track_ids,
            graphics_enabled: next.graphics_enabled,
            created_at: next.created_at,
            updated_at: next.updated_at,
        };
    }

    async deleteRecordingSetup(id: number) {
        const beat = await this.prisma.sceneBeat.findUnique({ where: { id } });
        if (!beat) {
            throw new NotFoundException(`Beat with ID ${id} not found`);
        }
        await this.prisma.beatRecordingSetup.deleteMany({ where: { beat_id: id } });
        return { message: `Recording setup cleared for beat ${id}` };
    }
}
