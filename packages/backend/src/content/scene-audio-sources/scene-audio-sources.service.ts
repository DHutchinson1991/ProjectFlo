import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SceneAudioSource, AudioSourceType, AudioTrackType } from '@prisma/client';
import { CreateSceneAudioSourceDto } from './dto/create-scene-audio-source.dto';
import { UpdateSceneAudioSourceDto } from './dto/update-scene-audio-source.dto';

@Injectable()
export class SceneAudioSourcesService {
    constructor(private prisma: PrismaService) {}

    private mapToResponseDto(source: SceneAudioSource) {
        return {
            id: source.id,
            scene_id: source.scene_id,
            source_type: source.source_type,
            source_activity_id: source.source_activity_id,
            source_moment_id: source.source_moment_id,
            source_scene_id: source.source_scene_id,
            track_type: source.track_type,
            start_offset_seconds: source.start_offset_seconds,
            duration_seconds: source.duration_seconds,
            order_index: source.order_index,
            notes: source.notes,
            created_at: source.created_at,
            updated_at: source.updated_at,
        };
    }

    async create(createDto: CreateSceneAudioSourceDto) {
        const sceneId = createDto.scene_id!;
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const orderIndex = createDto.order_index ??
            (await this.prisma.sceneAudioSource.count({ where: { scene_id: sceneId } }));

        const source = await this.prisma.sceneAudioSource.create({
            data: {
                scene_id: sceneId,
                source_type: createDto.source_type as AudioSourceType,
                source_activity_id: createDto.source_activity_id ?? null,
                source_moment_id: createDto.source_moment_id ?? null,
                source_scene_id: createDto.source_scene_id ?? null,
                track_type: (createDto.track_type as AudioTrackType) ?? 'SPEECH',
                start_offset_seconds: createDto.start_offset_seconds ?? null,
                duration_seconds: createDto.duration_seconds ?? null,
                order_index: orderIndex,
                notes: createDto.notes ?? null,
            },
        });

        return this.mapToResponseDto(source);
    }

    async findAll(sceneId: number) {
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const sources = await this.prisma.sceneAudioSource.findMany({
            where: { scene_id: sceneId },
            orderBy: { order_index: 'asc' },
        });

        return sources.map((s) => this.mapToResponseDto(s));
    }

    async findOne(id: number) {
        const source = await this.prisma.sceneAudioSource.findUnique({ where: { id } });
        if (!source) {
            throw new NotFoundException(`SceneAudioSource with ID ${id} not found`);
        }
        return this.mapToResponseDto(source);
    }

    async update(id: number, updateDto: UpdateSceneAudioSourceDto) {
        const source = await this.prisma.sceneAudioSource.findUnique({ where: { id } });
        if (!source) {
            throw new NotFoundException(`SceneAudioSource with ID ${id} not found`);
        }

        const updated = await this.prisma.sceneAudioSource.update({
            where: { id },
            data: {
                source_type: updateDto.source_type as AudioSourceType,
                source_activity_id: updateDto.source_activity_id,
                source_moment_id: updateDto.source_moment_id,
                source_scene_id: updateDto.source_scene_id,
                track_type: updateDto.track_type as AudioTrackType,
                start_offset_seconds: updateDto.start_offset_seconds,
                duration_seconds: updateDto.duration_seconds,
                order_index: updateDto.order_index,
                notes: updateDto.notes,
            },
        });

        return this.mapToResponseDto(updated);
    }

    async remove(id: number) {
        const source = await this.prisma.sceneAudioSource.findUnique({ where: { id } });
        if (!source) {
            throw new NotFoundException(`SceneAudioSource with ID ${id} not found`);
        }

        await this.prisma.sceneAudioSource.delete({ where: { id } });
        return { message: `SceneAudioSource with ID ${id} deleted successfully` };
    }

    async reorder(sceneId: number, orderings: Array<{ id: number; order_index: number }>) {
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        await Promise.all(
            orderings.map((o) =>
                this.prisma.sceneAudioSource.update({
                    where: { id: o.id },
                    data: { order_index: o.order_index },
                }),
            ),
        );

        return { message: `Reordered ${orderings.length} audio sources`, scene_id: sceneId };
    }
}
