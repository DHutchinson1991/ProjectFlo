import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { MusicType, SceneMusic, MomentMusic } from '@prisma/client';
import { CreateSceneMusicDto } from '../dto/create-music.dto';
import { UpdateSceneMusicDto } from '../dto/update-music.dto';
import { SceneMusicResponseDto } from '../dto/scene-music-response.dto';

@Injectable()
export class SceneMusicService {
    constructor(private prisma: PrismaService) {}

    private mapToResponseDto(music: SceneMusic): SceneMusicResponseDto {
        return {
            id: music.id,
            film_scene_id: music.film_scene_id,
            music_name: music.music_name,
            artist: music.artist,
            duration: music.duration,
            music_type: music.music_type,
            created_at: music.created_at,
            updated_at: music.updated_at,
        };
    }

    async create(sceneId: number, createDto: CreateSceneMusicDto): Promise<SceneMusicResponseDto> {
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        // Scene music is one-to-one; replace any existing entry.
        await this.prisma.sceneMusic.deleteMany({ where: { film_scene_id: sceneId } });

        const music = await this.prisma.sceneMusic.create({
            data: {
                film_scene_id: sceneId,
                music_name: createDto.music_name,
                artist: createDto.artist,
                duration: createDto.duration,
                music_type: (createDto.music_type as MusicType) ?? MusicType.MODERN,
            },
        });

        return this.mapToResponseDto(music);
    }

    async findOne(sceneId: number): Promise<SceneMusicResponseDto> {
        const music = await this.prisma.sceneMusic.findUnique({
            where: { film_scene_id: sceneId },
        });
        if (!music) {
            throw new NotFoundException(`No music assigned to scene ${sceneId}`);
        }
        return this.mapToResponseDto(music);
    }

    async update(sceneId: number, updateDto: UpdateSceneMusicDto): Promise<SceneMusicResponseDto> {
        const music = await this.prisma.sceneMusic.findUnique({
            where: { film_scene_id: sceneId },
        });
        if (!music) {
            throw new NotFoundException(`No music assigned to scene ${sceneId}`);
        }

        const updated = await this.prisma.sceneMusic.update({
            where: { id: music.id },
            data: {
                music_name: updateDto.music_name,
                artist: updateDto.artist,
                duration: updateDto.duration,
                music_type: updateDto.music_type as MusicType | undefined,
            },
        });

        return this.mapToResponseDto(updated);
    }

    async remove(sceneId: number): Promise<{ message: string }> {
        const music = await this.prisma.sceneMusic.findUnique({
            where: { film_scene_id: sceneId },
        });
        if (!music) {
            throw new NotFoundException(`No music assigned to scene ${sceneId}`);
        }
        await this.prisma.sceneMusic.delete({ where: { id: music.id } });
        return { message: `Removed music from scene ${sceneId}` };
    }

    async getFilmMusic(filmId: number) {
        const scenesWithMusic = await this.prisma.filmScene.findMany({
            where: { film_id: filmId },
            include: {
                scene_music: true,
                moments: { include: { moment_music: true } },
            },
        });

        const sceneMusic = scenesWithMusic
            .filter((s) => s.scene_music)
            .map((s) => ({
                type: 'scene' as const,
                scene_id: s.id,
                scene_name: s.name,
                music: s.scene_music as SceneMusic,
            }));

        const momentMusic = scenesWithMusic.flatMap((s) =>
            s.moments
                .filter((m) => m.moment_music)
                .map((m) => ({
                    type: 'moment' as const,
                    scene_id: s.id,
                    scene_name: s.name,
                    moment_id: m.id,
                    moment_name: m.name,
                    music: m.moment_music as MomentMusic,
                })),
        );

        return {
            film_id: filmId,
            scene_music: sceneMusic,
            moment_music: momentMusic,
            total_music_items: sceneMusic.length + momentMusic.length,
        };
    }

    getMusicTypes(): string[] {
        return Object.values(MusicType);
    }
}
