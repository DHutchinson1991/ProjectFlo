import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { CreateBeatDto } from '../dto/create-beat.dto';
import { UpdateBeatDto } from '../dto/update-beat.dto';
import { BeatMapper } from '../mappers/beat.mapper';
import { BeatResponseDto } from '../types/beat.types';

@Injectable()
export class BeatsCrudService {
    constructor(private prisma: PrismaService) {}

    async create(createBeatDto: CreateBeatDto): Promise<BeatResponseDto> {
        const sceneId = createBeatDto.film_scene_id!;
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const orderIndex =
            createBeatDto.order_index ??
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

        return BeatMapper.toResponse(beat);
    }

    async findAll(sceneId: number): Promise<BeatResponseDto[]> {
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const beats = await this.prisma.sceneBeat.findMany({
            where: { film_scene_id: sceneId },
            orderBy: { order_index: 'asc' },
            include: { recording_setup: true },
        });

        return beats.map(b => BeatMapper.toResponse(b));
    }

    async findOne(id: number): Promise<BeatResponseDto> {
        const beat = await this.prisma.sceneBeat.findUnique({
            where: { id },
            include: { recording_setup: true },
        });
        if (!beat) {
            throw new NotFoundException(`Beat with ID ${id} not found`);
        }
        return BeatMapper.toResponse(beat);
    }

    async update(id: number, updateBeatDto: UpdateBeatDto): Promise<BeatResponseDto> {
        const beat = await this.prisma.sceneBeat.findUnique({
            where: { id },
            include: { recording_setup: true },
        });
        if (!beat) {
            throw new NotFoundException(`Beat with ID ${id} not found`);
        }

        await this.prisma.sceneBeat.update({
            where: { id },
            data: {
                name: updateBeatDto.name,
                order_index: updateBeatDto.order_index,
                shot_count: updateBeatDto.shot_count ?? beat.shot_count,
                duration_seconds: updateBeatDto.duration_seconds ?? beat.duration_seconds,
                source_activity_id:
                    updateBeatDto.source_activity_id !== undefined
                        ? updateBeatDto.source_activity_id
                        : undefined,
                source_moment_id:
                    updateBeatDto.source_moment_id !== undefined
                        ? updateBeatDto.source_moment_id
                        : undefined,
                source_scene_id:
                    updateBeatDto.source_scene_id !== undefined
                        ? updateBeatDto.source_scene_id
                        : undefined,
            },
        });

        const reloaded = await this.prisma.sceneBeat.findUnique({
            where: { id },
            include: { recording_setup: true },
        });
        return BeatMapper.toResponse(reloaded!);
    }

    async remove(id: number) {
        const beat = await this.prisma.sceneBeat.findUnique({ where: { id } });
        if (!beat) {
            throw new NotFoundException(`Beat with ID ${id} not found`);
        }
        await this.prisma.sceneBeat.delete({ where: { id } });
        return { message: `Beat with ID ${id} deleted successfully` };
    }

    async reorderBeats(
        sceneId: number,
        beatOrderings: Array<{ id: number; order_index: number }>,
    ) {
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }
        await Promise.all(
            beatOrderings.map(ordering =>
                this.prisma.sceneBeat.update({
                    where: { id: ordering.id },
                    data: { order_index: ordering.order_index },
                }),
            ),
        );
        return { message: `Reordered ${beatOrderings.length} beats`, film_scene_id: sceneId };
    }
}
