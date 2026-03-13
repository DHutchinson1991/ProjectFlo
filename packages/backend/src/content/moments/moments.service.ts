import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ShotType } from '@prisma/client';
import { CreateMomentDto } from './dto/create-moment.dto';
import { UpdateMomentDto } from './dto/update-moment.dto';

export interface MomentResponseDto {
    id: number;
    film_scene_id: number;
    name: string;
    order_index: number;
    duration: number;
    created_at: Date;
    updated_at: Date;
}

@Injectable()
export class MomentsService {
    constructor(private prisma: PrismaService) { }

    private buildRecordingSetupResponse(recording: {
        id: number;
        audio_track_ids: number[];
        graphics_enabled: boolean;
        graphics_title?: string | null;
        camera_assignments: Array<{
            track_id: number;
            subject_ids: number[];
            track?: { name: string; type: string } | null;
        }>;
    }) {
        return {
            id: recording.id,
            audio_track_ids: recording.audio_track_ids,
            graphics_enabled: recording.graphics_enabled,
            graphics_title: recording.graphics_title ?? null,
            camera_assignments: recording.camera_assignments.map(a => ({
                track_id: a.track_id,
                track_name: a.track?.name || String(a.track_id),
                track_type: a.track?.type ? String(a.track.type) : undefined,
                subject_ids: a.subject_ids,
                shot_type: (a as any).shot_type ?? undefined,
            })),
        };
    }

    private mapToResponseDto(moment: {
        id: number;
        film_scene_id: number;
        name: string;
        order_index: number;
        duration: number;
        created_at: Date;
        updated_at: Date;
    }): MomentResponseDto {
        return {
            id: moment.id,
            film_scene_id: moment.film_scene_id,
            name: moment.name,
            order_index: moment.order_index,
            duration: moment.duration,
            created_at: moment.created_at,
            updated_at: moment.updated_at,
        };
    }

    async create(createMomentDto: CreateMomentDto) {
        // Verify scene exists (film_scene_id is guaranteed to be set by controller)
        const sceneId = createMomentDto.film_scene_id!;
        
        const scene = await this.prisma.filmScene.findUnique({
            where: { id: sceneId },
        });

        if (!scene) {
            throw new NotFoundException(
                `Scene with ID ${sceneId} not found`,
            );
        }

        // Auto-assign order_index if not provided
        const orderIndex = createMomentDto.order_index ??
            (await this.prisma.sceneMoment.count({ where: { film_scene_id: sceneId } }));

        const moment = await this.prisma.sceneMoment.create({
            data: {
                film_scene_id: sceneId,
                name: createMomentDto.name,
                order_index: orderIndex,
                duration: createMomentDto.duration || 60,
                source_activity_id: createMomentDto.source_activity_id ?? null,
            },
        });

        const sceneSubjects = await this.prisma.filmSceneSubject.findMany({
            where: { scene_id: sceneId },
            select: {
                subject_id: true,
                priority: true,
                notes: true,
            },
        });

        if (sceneSubjects.length > 0) {
            await this.prisma.filmSceneMomentSubject.createMany({
                data: sceneSubjects.map((assignment) => ({
                    moment_id: moment.id,
                    subject_id: assignment.subject_id,
                    priority: assignment.priority,
                    notes: assignment.notes ?? undefined,
                })),
                skipDuplicates: true,
            });
        }

        return this.mapToResponseDto(moment);
    }

    async findAll(sceneId: number) {
        // Verify scene exists
        const scene = await this.prisma.filmScene.findUnique({
            where: { id: sceneId },
        });

        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const moments = await this.prisma.sceneMoment.findMany({
            where: { film_scene_id: sceneId },
            include: {
                recording_setup: {
                    include: {
                        camera_assignments: {
                            include: {
                                track: true,
                            },
                        },
                    },
                },
                moment_music: true,
            },
            orderBy: { order_index: 'asc' },
        });

        return moments.map(m => ({
            ...this.mapToResponseDto(m),
            has_recording_setup: !!m.recording_setup,
            has_music: !!m.moment_music,
            recording_setup: m.recording_setup ? {
                id: m.recording_setup.id,
                audio_track_ids: m.recording_setup.audio_track_ids,
                graphics_enabled: m.recording_setup.graphics_enabled,
                graphics_title: m.recording_setup.graphics_title ?? null,
                camera_assignments: m.recording_setup.camera_assignments.map(a => ({
                    track_id: a.track_id,
                    track_name: a.track?.name || String(a.track_id),
                    track_type: a.track?.type ? String(a.track.type) : undefined,
                    subject_ids: a.subject_ids,
                    shot_type: (a as any).shot_type ?? undefined,
                })),
            } : null,
        }));
    }

    async findOne(id: number) {
        const moment = await this.prisma.sceneMoment.findUnique({
            where: { id },
            include: {
                film_scene: true,
                recording_setup: {
                    include: {
                        camera_assignments: true,
                    },
                },
                moment_music: true,
            },
        });

        if (!moment) {
            throw new NotFoundException(`Moment with ID ${id} not found`);
        }

        return {
            ...this.mapToResponseDto(moment),
            scene_name: moment.film_scene.name,
            recording_setup: moment.recording_setup ? {
                id: moment.recording_setup.id,
                audio_track_ids: moment.recording_setup.audio_track_ids,
                graphics_enabled: moment.recording_setup.graphics_enabled,
                graphics_title: moment.recording_setup.graphics_title ?? null,
                camera_assignments_count: moment.recording_setup.camera_assignments.length,
            } : null,
            music: moment.moment_music ? {
                id: moment.moment_music.id,
                music_type: moment.moment_music.music_type,
            } : null,
        };
    }

    async getRecordingSetup(id: number) {
        const moment = await this.prisma.sceneMoment.findUnique({
            where: { id },
            include: {
                recording_setup: {
                    include: {
                        camera_assignments: {
                            include: {
                                track: true,
                            },
                        },
                    },
                },
            },
        });

        if (!moment) {
            throw new NotFoundException(`Moment with ID ${id} not found`);
        }

        console.info('[MOMENT] Get recording setup', {
            momentId: id,
            hasRecordingSetup: !!moment.recording_setup,
            recordingSetup: moment.recording_setup,
        });

        if (!moment.recording_setup) {
            return null;
        }

        const response = this.buildRecordingSetupResponse(moment.recording_setup);
        console.info('[MOMENT] Recording setup response', {
            momentId: id,
            response,
        });
        return response;
    }

    async update(id: number, updateMomentDto: UpdateMomentDto) {
        // Verify moment exists
        const moment = await this.prisma.sceneMoment.findUnique({
            where: { id },
        });

        if (!moment) {
            throw new NotFoundException(`Moment with ID ${id} not found`);
        }

        const updated = await this.prisma.sceneMoment.update({
            where: { id },
            data: updateMomentDto,
        });

        return this.mapToResponseDto(updated);
    }

    async remove(id: number) {
        // Verify moment exists
        const moment = await this.prisma.sceneMoment.findUnique({
            where: { id },
        });

        if (!moment) {
            throw new NotFoundException(`Moment with ID ${id} not found`);
        }

        // Delete will cascade automatically due to onDelete: Cascade in schema
        await this.prisma.sceneMoment.delete({
            where: { id },
        });

        return { message: `Moment with ID ${id} deleted successfully` };
    }

    async deleteRecordingSetup(id: number) {
        // Verify moment exists
        const moment = await this.prisma.sceneMoment.findUnique({
            where: { id },
        });

        if (!moment) {
            throw new NotFoundException(`Moment with ID ${id} not found`);
        }

        const existing = await this.prisma.momentRecordingSetup.findUnique({
            where: { moment_id: id },
        });

        if (!existing) {
            return { message: `Moment recording setup not found` };
        }

        await this.prisma.momentRecordingSetup.delete({
            where: { moment_id: id },
        });

        return { message: `Moment recording setup deleted successfully` };
    }

    async upsertRecordingSetup(id: number, data: {
        camera_track_ids?: number[];
        camera_assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: ShotType | null }>;
        audio_track_ids?: number[];
        graphics_enabled?: boolean;
        graphics_title?: string | null;
    }) {
        // Verify moment exists
        const moment = await this.prisma.sceneMoment.findUnique({
            where: { id },
        });

        if (!moment) {
            throw new NotFoundException(`Moment with ID ${id} not found`);
        }

        const cameraAssignmentsSource = (data.camera_assignments || [])
            .filter((assignment) => Number.isInteger(assignment?.track_id));
        const cameraTrackIds = Array.from(
            new Set(
                (cameraAssignmentsSource.length > 0
                    ? cameraAssignmentsSource.map((assignment) => assignment.track_id)
                    : (data.camera_track_ids || [])
                ).filter((trackId) => Number.isInteger(trackId))
            )
        );
        const cameraAssignments = cameraTrackIds.map((trackId) => {
            const source = cameraAssignmentsSource.find((assignment) => assignment.track_id === trackId);
            const subjectIds = Array.from(
                new Set((source?.subject_ids || []).filter((subjectId) => Number.isInteger(subjectId)))
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
            where: { moment_id: id },
        });

        if (existing) {
            await this.prisma.cameraSubjectAssignment.deleteMany({
                where: { recording_setup_id: existing.id },
            });

            const updated = await this.prisma.momentRecordingSetup.update({
                where: { moment_id: id },
                data: {
                    audio_track_ids: audioTrackIds,
                    graphics_enabled: !!data.graphics_enabled,
                    graphics_title: normalizedGraphicsTitle,
                    ...(cameraTrackIds.length > 0
                        ? {
                              camera_assignments: {
                                  createMany: {
                                      data: cameraAssignments,
                                  },
                              },
                          }
                        : {}),
                },
                include: {
                    camera_assignments: {
                        include: {
                            track: true,
                        },
                    },
                },
            });

            return this.buildRecordingSetupResponse(updated);
        }

        const created = await this.prisma.momentRecordingSetup.create({
            data: {
                moment_id: id,
                audio_track_ids: audioTrackIds,
                graphics_enabled: !!data.graphics_enabled,
                graphics_title: normalizedGraphicsTitle,
                ...(cameraTrackIds.length > 0
                    ? {
                          camera_assignments: {
                              createMany: {
                                  data: cameraAssignments,
                              },
                          },
                      }
                    : {}),
            },
            include: {
                camera_assignments: {
                    include: {
                        track: true,
                    },
                },
            },
        });

        return this.buildRecordingSetupResponse(created);
    }

    async getMomentsByScene(sceneId: number) {
        // Verify scene exists
        const scene = await this.prisma.filmScene.findUnique({
            where: { id: sceneId },
        });

        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        return this.findAll(sceneId);
    }

    async reorderMoments(sceneId: number, momentOrderings: Array<{ id: number; order_index: number }>) {
        // Verify scene exists
        const scene = await this.prisma.filmScene.findUnique({
            where: { id: sceneId },
        });

        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const updates = momentOrderings.map(ordering =>
            this.prisma.sceneMoment.update({
                where: { id: ordering.id },
                data: { order_index: ordering.order_index },
            })
        );

        await Promise.all(updates);

        return {
            message: `Reordered ${momentOrderings.length} moments`,
            scene_id: sceneId,
        };
    }
}
