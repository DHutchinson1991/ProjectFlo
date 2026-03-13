import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBeatDto } from './dto/create-beat.dto';
import { UpdateBeatDto } from './dto/update-beat.dto';

export interface BeatResponseDto {
    id: number;
    film_scene_id: number;
    name: string;
    order_index: number;
    shot_count?: number | null;
    duration_seconds: number;
    source_activity_id?: number | null;
    source_moment_id?: number | null;
    source_scene_id?: number | null;
    created_at: Date;
    updated_at: Date;
    recording_setup?: {
        id: number;
        camera_track_ids: number[];
        audio_track_ids: number[];
        graphics_enabled: boolean;
        created_at: Date;
        updated_at: Date;
    } | null;
}

@Injectable()
export class BeatsService {
    constructor(private prisma: PrismaService) {}

    private mapToResponseDto(beat: any): BeatResponseDto {
        return {
            id: beat.id,
            film_scene_id: beat.film_scene_id,
            name: beat.name,
            order_index: beat.order_index,
            shot_count: beat.shot_count ?? null,
            duration_seconds: beat.duration_seconds,
            source_activity_id: beat.source_activity_id ?? null,
            source_moment_id: beat.source_moment_id ?? null,
            source_scene_id: beat.source_scene_id ?? null,
            created_at: beat.created_at,
            updated_at: beat.updated_at,
            recording_setup: beat.recording_setup
                ? {
                    id: beat.recording_setup.id,
                    camera_track_ids: beat.recording_setup.camera_track_ids,
                    audio_track_ids: beat.recording_setup.audio_track_ids,
                    graphics_enabled: beat.recording_setup.graphics_enabled,
                    created_at: beat.recording_setup.created_at,
                    updated_at: beat.recording_setup.updated_at,
                }
                : null,
        };
    }

    async create(createBeatDto: CreateBeatDto) {
        const sceneId = createBeatDto.film_scene_id!;
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const orderIndex = createBeatDto.order_index ??
            (await this.prisma.sceneBeat.count({ where: { film_scene_id: sceneId } }));

        const beat = await this.prisma.sceneBeat.create({
            data: {
                film_scene_id: sceneId,
                name: createBeatDto.name,
                order_index: orderIndex,
                shot_count: createBeatDto.shot_count ?? null,
                duration_seconds: createBeatDto.duration_seconds ?? 10,
                source_activity_id: createBeatDto.source_activity_id ?? null,
                source_moment_id: createBeatDto.source_moment_id ?? null,
                source_scene_id: createBeatDto.source_scene_id ?? null,
            },
        });

        return this.mapToResponseDto(beat);
    }

    async findAll(sceneId: number) {
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const beats = await this.prisma.sceneBeat.findMany({
            where: { film_scene_id: sceneId },
            orderBy: { order_index: 'asc' },
            include: {
                recording_setup: true,
            },
        });

        return beats.map((beat) => this.mapToResponseDto(beat));
    }

    async findOne(id: number) {
        const beat = await this.prisma.sceneBeat.findUnique({
            where: { id },
            include: { recording_setup: true },
        });
        if (!beat) {
            throw new NotFoundException(`Beat with ID ${id} not found`);
        }
        return this.mapToResponseDto(beat);
    }

    async update(id: number, updateBeatDto: UpdateBeatDto) {
        const beat = await this.prisma.sceneBeat.findUnique({
            where: { id },
            include: { recording_setup: true },
        });
        if (!beat) {
            throw new NotFoundException(`Beat with ID ${id} not found`);
        }

        const updated = await this.prisma.sceneBeat.update({
            where: { id },
            data: {
                name: updateBeatDto.name,
                order_index: updateBeatDto.order_index,
                shot_count: updateBeatDto.shot_count ?? beat.shot_count,
                duration_seconds: updateBeatDto.duration_seconds ?? beat.duration_seconds,
                source_activity_id: updateBeatDto.source_activity_id !== undefined ? updateBeatDto.source_activity_id : undefined,
                source_moment_id: updateBeatDto.source_moment_id !== undefined ? updateBeatDto.source_moment_id : undefined,
                source_scene_id: updateBeatDto.source_scene_id !== undefined ? updateBeatDto.source_scene_id : undefined,
            },
        });

        const reloaded = await this.prisma.sceneBeat.findUnique({
            where: { id: updated.id },
            include: { recording_setup: true },
        });
        return this.mapToResponseDto(reloaded || updated);
    }

    async getRecordingSetup(id: number) {
        const beat = await this.prisma.sceneBeat.findUnique({
            where: { id },
            include: { recording_setup: true },
        });

        if (!beat) {
            throw new NotFoundException(`Beat with ID ${id} not found`);
        }

        return beat.recording_setup
            ? {
                id: beat.recording_setup.id,
                camera_track_ids: beat.recording_setup.camera_track_ids,
                audio_track_ids: beat.recording_setup.audio_track_ids,
                graphics_enabled: beat.recording_setup.graphics_enabled,
                created_at: beat.recording_setup.created_at,
                updated_at: beat.recording_setup.updated_at,
            }
            : null;
    }

    async upsertRecordingSetup(id: number, data: { camera_track_ids?: number[]; audio_track_ids?: number[]; graphics_enabled?: boolean }) {
        const beat = await this.prisma.sceneBeat.findUnique({ where: { id } });
        if (!beat) {
            throw new NotFoundException(`Beat with ID ${id} not found`);
        }

        const cameraTrackIds = Array.from(new Set((data.camera_track_ids || []).filter((value) => Number.isInteger(value))));
        const audioTrackIds = Array.from(new Set((data.audio_track_ids || []).filter((value) => Number.isInteger(value))));

        const existing = await this.prisma.beatRecordingSetup.findUnique({ where: { beat_id: id } });
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

    async remove(id: number) {
        const beat = await this.prisma.sceneBeat.findUnique({ where: { id } });
        if (!beat) {
            throw new NotFoundException(`Beat with ID ${id} not found`);
        }

        await this.prisma.sceneBeat.delete({ where: { id } });
        return { message: `Beat with ID ${id} deleted successfully` };
    }

    async reorderBeats(sceneId: number, beatOrderings: Array<{ id: number; order_index: number }>) {
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        await Promise.all(
            beatOrderings.map((ordering) =>
                this.prisma.sceneBeat.update({
                    where: { id: ordering.id },
                    data: { order_index: ordering.order_index },
                })
            )
        );

        return { message: `Reordered ${beatOrderings.length} beats`, film_scene_id: sceneId };
    }
}
