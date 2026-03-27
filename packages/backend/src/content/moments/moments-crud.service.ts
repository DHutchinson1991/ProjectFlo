import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
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
export class MomentsCrudService {
    constructor(private prisma: PrismaService) {}

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
        const sceneId = createMomentDto.film_scene_id!;

        const scene = await this.prisma.filmScene.findUnique({
            where: { id: sceneId },
        });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const orderIndex =
            createMomentDto.order_index ??
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
            select: { subject_id: true, priority: true, notes: true },
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
                            include: { track: true },
                        },
                    },
                },
                moment_music: true,
            },
            orderBy: { order_index: 'asc' },
        });

        return moments.map((m) => ({
            ...this.mapToResponseDto(m),
            has_recording_setup: !!m.recording_setup,
            has_music: !!m.moment_music,
            recording_setup: m.recording_setup
                ? {
                      id: m.recording_setup.id,
                      audio_track_ids: m.recording_setup.audio_track_ids,
                      graphics_enabled: m.recording_setup.graphics_enabled,
                      graphics_title: m.recording_setup.graphics_title ?? null,
                      camera_assignments: m.recording_setup.camera_assignments.map((a) => ({
                          track_id: a.track_id,
                          track_name: a.track?.name || String(a.track_id),
                          track_type: a.track?.type ? String(a.track.type) : undefined,
                          subject_ids: a.subject_ids,
                          shot_type: (a as Record<string, unknown>).shot_type ?? undefined,
                      })),
                  }
                : null,
        }));
    }

    async findOne(id: number) {
        const moment = await this.prisma.sceneMoment.findUnique({
            where: { id },
            include: {
                film_scene: true,
                recording_setup: {
                    include: { camera_assignments: true },
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
            recording_setup: moment.recording_setup
                ? {
                      id: moment.recording_setup.id,
                      audio_track_ids: moment.recording_setup.audio_track_ids,
                      graphics_enabled: moment.recording_setup.graphics_enabled,
                      graphics_title: moment.recording_setup.graphics_title ?? null,
                      camera_assignments_count: moment.recording_setup.camera_assignments.length,
                  }
                : null,
            music: moment.moment_music
                ? { id: moment.moment_music.id, music_type: moment.moment_music.music_type }
                : null,
        };
    }

    async update(id: number, updateMomentDto: UpdateMomentDto) {
        const moment = await this.prisma.sceneMoment.findUnique({ where: { id } });
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
        const moment = await this.prisma.sceneMoment.findUnique({ where: { id } });
        if (!moment) {
            throw new NotFoundException(`Moment with ID ${id} not found`);
        }

        await this.prisma.sceneMoment.delete({ where: { id } });
        return { message: `Moment with ID ${id} deleted successfully` };
    }

    async reorderMoments(sceneId: number, momentOrderings: Array<{ id: number; order_index: number }>) {
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const updates = momentOrderings.map((ordering) =>
            this.prisma.sceneMoment.update({
                where: { id: ordering.id },
                data: { order_index: ordering.order_index },
            }),
        );
        await Promise.all(updates);

        return { message: `Reordered ${momentOrderings.length} moments`, scene_id: sceneId };
    }
}
