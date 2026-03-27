import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { CreateSceneDto } from '../dto/create-scene.dto';
import { UpdateSceneDto } from '../dto/update-scene.dto';
import { SceneType, MontageStyle } from '@prisma/client';
import { SceneMapper } from '../mappers/scene.mapper';
import { SceneResponseDto } from '../types/scene.types';
import { SceneWithDetails } from '../types/scene-payload.type';

@Injectable()
export class ScenesCrudService {
    constructor(private prisma: PrismaService) {}

    async create(createSceneDto: CreateSceneDto): Promise<SceneResponseDto> {
        const filmId = createSceneDto.film_id!;
        const film = await this.prisma.film.findUnique({ where: { id: filmId } });
        if (!film) {
            throw new NotFoundException(`Film with ID ${filmId} not found`);
        }

        let sceneMode: SceneType =
            createSceneDto.mode === 'MONTAGE' ? SceneType.MONTAGE : SceneType.MOMENTS;
        if (createSceneDto.scene_template_id) {
            const template = await this.prisma.sceneTemplate.findUnique({
                where: { id: createSceneDto.scene_template_id },
            });
            if (!template) {
                throw new NotFoundException(
                    `Scene template with ID ${createSceneDto.scene_template_id} not found`,
                );
            }
            if (template.type) sceneMode = template.type;
        }

        const orderIndex =
            createSceneDto.order_index ??
            (await this.prisma.filmScene.count({ where: { film_id: filmId } }));

        const scene = await this.prisma.filmScene.create({
            data: {
                film_id: filmId,
                name: createSceneDto.name,
                scene_template_id: createSceneDto.scene_template_id || null,
                mode: sceneMode,
                shot_count: createSceneDto.shot_count ?? null,
                duration_seconds: createSceneDto.duration_seconds ?? null,
                montage_style: createSceneDto.montage_style
                    ? (createSceneDto.montage_style as MontageStyle)
                    : null,
                montage_bpm: createSceneDto.montage_bpm ?? null,
                order_index: orderIndex,
            },
        });

        return SceneMapper.toBase(scene);
    }

    async findAll(filmId: number) {
        const film = await this.prisma.film.findUnique({ where: { id: filmId } });
        if (!film) {
            throw new NotFoundException(`Film with ID ${filmId} not found`);
        }

        const scenes = (await this.prisma.filmScene.findMany({
            where: { film_id: filmId },
            include: {
                template: true,
                location_assignment: { include: { location: true } },
                moments: {
                    include: {
                        recording_setup: {
                            include: { camera_assignments: { include: { track: true } } },
                        },
                        moment_music: true,
                        subjects: {
                            include: { subject: { include: { role_template: true } } },
                        },
                    },
                },
                beats: { orderBy: { order_index: 'asc' }, include: { recording_setup: true } },
                recording_setup: {
                    include: { camera_assignments: { include: { track: true } } },
                },
                scene_music: true,
            },
            orderBy: { order_index: 'asc' },
        })) as SceneWithDetails[];

        return scenes.map((s: SceneWithDetails) => ({
            ...SceneMapper.toBase(s),
            template: s.template
                ? { id: s.template.id, name: s.template.name, type: s.template.type }
                : null,
            location_assignment: s.location_assignment
                ? {
                      id: s.location_assignment.id,
                      location_id: s.location_assignment.location_id,
                      location: s.location_assignment.location
                          ? {
                                id: s.location_assignment.location.id,
                                name: s.location_assignment.location.name,
                            }
                          : null,
                  }
                : null,
            moments: s.moments.map(m => SceneMapper.toMomentSummary(m)),
            moments_count: s.moments.length,
            beats: s.beats.map(b => SceneMapper.toBeat(b)),
            recording_setup: SceneMapper.toRecordingSetupWithAssignments(s.recording_setup),
            scene_music: SceneMapper.toSceneMusic(s.scene_music),
        }));
    }

    async findOne(id: number) {
        const scene = await this.prisma.filmScene.findUnique({
            where: { id },
            include: {
                film: true,
                template: true,
                moments: {
                    orderBy: { order_index: 'asc' },
                    include: {
                        recording_setup: {
                            include: { camera_assignments: { include: { track: true } } },
                        },
                        moment_music: true,
                        subjects: {
                            include: { subject: { include: { role_template: true } } },
                        },
                    },
                },
                beats: { orderBy: { order_index: 'asc' }, include: { recording_setup: true } },
                recording_setup: {
                    include: { camera_assignments: { include: { track: true } } },
                },
                scene_music: true,
            },
        });

        if (!scene) {
            throw new NotFoundException(`Scene with ID ${id} not found`);
        }

        return {
            ...SceneMapper.toBase(scene),
            film_name: scene.film.name,
            template: scene.template
                ? { id: scene.template.id, name: scene.template.name, type: scene.template.type }
                : null,
            moments: scene.moments.map(m => SceneMapper.toMomentDetail(m)),
            beats: scene.beats.map(b => SceneMapper.toBeat(b)),
            recording_setup: SceneMapper.toRecordingSetupWithAssignments(scene.recording_setup),
            scene_music: scene.scene_music
                ? { id: scene.scene_music.id, music_type: scene.scene_music.music_type }
                : null,
        };
    }

    async update(id: number, updateSceneDto: UpdateSceneDto): Promise<SceneResponseDto> {
        const scene = await this.prisma.filmScene.findUnique({ where: { id } });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${id} not found`);
        }

        if (
            updateSceneDto.scene_template_id !== undefined &&
            updateSceneDto.scene_template_id !== null
        ) {
            const template = await this.prisma.sceneTemplate.findUnique({
                where: { id: updateSceneDto.scene_template_id },
            });
            if (!template) {
                throw new NotFoundException(
                    `Scene template with ID ${updateSceneDto.scene_template_id} not found`,
                );
            }
        }

        const updated = await this.prisma.filmScene.update({
            where: { id },
            data: {
                ...updateSceneDto,
                shot_count: updateSceneDto.shot_count ?? null,
                duration_seconds: updateSceneDto.duration_seconds ?? null,
                montage_style:
                    updateSceneDto.montage_style !== undefined
                        ? (updateSceneDto.montage_style as unknown as MontageStyle | null)
                        : undefined,
                montage_bpm:
                    updateSceneDto.montage_bpm !== undefined
                        ? updateSceneDto.montage_bpm
                        : undefined,
            },
        });

        return SceneMapper.toBase(updated);
    }

    async remove(id: number) {
        const scene = await this.prisma.filmScene.findUnique({ where: { id } });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${id} not found`);
        }
        await this.prisma.filmScene.delete({ where: { id } });
        return { message: `Scene with ID ${id} deleted successfully` };
    }

    async reorderScenes(
        filmId: number,
        sceneOrderings: Array<{ id: number; order_index: number }>,
    ) {
        const film = await this.prisma.film.findUnique({ where: { id: filmId } });
        if (!film) {
            throw new NotFoundException(`Film with ID ${filmId} not found`);
        }
        await Promise.all(
            sceneOrderings.map(ordering =>
                this.prisma.filmScene.update({
                    where: { id: ordering.id },
                    data: { order_index: ordering.order_index },
                }),
            ),
        );
        return { message: `Reordered ${sceneOrderings.length} scenes`, film_id: filmId };
    }
}
