import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { ShotType } from '@prisma/client';
import { buildRecordingSetupResponse } from './moment.mapper';

@Injectable()
export class MomentRecordingSetupService {
    constructor(private prisma: PrismaService) { }

    async getRecordingSetup(momentId: number) {
        const moment = await this.prisma.sceneMoment.findUnique({
            where: { id: momentId },
            include: {
                recording_setup: {
                    include: {
                        camera_assignments: { include: { track: true } },
                    },
                },
            },
        });

        if (!moment) throw new NotFoundException(`Moment with ID ${momentId} not found`);

        if (!moment.recording_setup) {
            return null;
        }

        return buildRecordingSetupResponse(moment.recording_setup);
    }

    async upsertRecordingSetup(momentId: number, data: {
        camera_track_ids?: number[];
        camera_assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: ShotType | null }>;
        audio_track_ids?: number[];
        graphics_enabled?: boolean;
        graphics_title?: string | null;
    }) {
        const moment = await this.prisma.sceneMoment.findUnique({ where: { id: momentId } });
        if (!moment) throw new NotFoundException(`Moment with ID ${momentId} not found`);

        const cameraAssignmentsSource = (data.camera_assignments || [])
            .filter((assignment) => Number.isInteger(assignment?.track_id));
        const cameraTrackIds = Array.from(
            new Set(
                (cameraAssignmentsSource.length > 0
                    ? cameraAssignmentsSource.map((a) => a.track_id)
                    : (data.camera_track_ids || [])
                ).filter((trackId) => Number.isInteger(trackId))
            )
        );
        const cameraAssignments = cameraTrackIds.map((trackId) => {
            const source = cameraAssignmentsSource.find((a) => a.track_id === trackId);
            const subjectIds = Array.from(
                new Set((source?.subject_ids || []).filter((id) => Number.isInteger(id)))
            );
            return {
                track_id: trackId,
                subject_ids: subjectIds,
                shot_type: (source?.shot_type as ShotType | null | undefined) ?? undefined,
            };
        });
        const audioTrackIds = Array.from(
            new Set((data.audio_track_ids || []).filter((trackId) => Number.isInteger(trackId)))
        );
        const graphicsTitle = typeof data.graphics_title === 'string' ? data.graphics_title.trim() : undefined;
        const normalizedGraphicsTitle = data.graphics_enabled ? (graphicsTitle || null) : null;

        const existing = await this.prisma.momentRecordingSetup.findUnique({
            where: { moment_id: momentId },
        });

        if (existing) {
            await this.prisma.cameraSubjectAssignment.deleteMany({
                where: { recording_setup_id: existing.id },
            });

            const updated = await this.prisma.momentRecordingSetup.update({
                where: { moment_id: momentId },
                data: {
                    audio_track_ids: audioTrackIds,
                    graphics_enabled: !!data.graphics_enabled,
                    graphics_title: normalizedGraphicsTitle,
                    ...(cameraTrackIds.length > 0
                        ? { camera_assignments: { createMany: { data: cameraAssignments } } }
                        : {}),
                },
                include: { camera_assignments: { include: { track: true } } },
            });

            return buildRecordingSetupResponse(updated);
        }

        const created = await this.prisma.momentRecordingSetup.create({
            data: {
                moment_id: momentId,
                audio_track_ids: audioTrackIds,
                graphics_enabled: !!data.graphics_enabled,
                graphics_title: normalizedGraphicsTitle,
                ...(cameraTrackIds.length > 0
                    ? { camera_assignments: { createMany: { data: cameraAssignments } } }
                    : {}),
            },
            include: { camera_assignments: { include: { track: true } } },
        });

        return buildRecordingSetupResponse(created);
    }

    async deleteRecordingSetup(momentId: number) {
        const moment = await this.prisma.sceneMoment.findUnique({ where: { id: momentId } });
        if (!moment) throw new NotFoundException(`Moment with ID ${momentId} not found`);

        const existing = await this.prisma.momentRecordingSetup.findUnique({
            where: { moment_id: momentId },
        });

        if (!existing) {
            return { message: 'Moment recording setup not found' };
        }

        await this.prisma.momentRecordingSetup.delete({ where: { moment_id: momentId } });
        return { message: 'Moment recording setup deleted successfully' };
    }
}
