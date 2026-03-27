import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SceneMusic, MomentMusic, MusicType } from '@prisma/client';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateSceneMusicDto, CreateMomentMusicDto } from './dto/create-music.dto';
import { UpdateSceneMusicDto, UpdateMomentMusicDto } from './dto/update-music.dto';

export interface SceneMusicResponseDto {
    id: number;
    film_scene_id: number;
    music_name: string;
    artist: string | null;
    duration: number | null;
    music_type: string;
    created_at: Date;
    updated_at: Date;
}

export interface MomentMusicResponseDto {
    id: number;
    moment_id: number;
    music_name: string;
    artist: string | null;
    duration: number | null;
    music_type: string;
    overrides_scene_music: boolean;
    created_at: Date;
    updated_at: Date;
}

@Injectable()
export class MusicService {
    constructor(private prisma: PrismaService) { }

    private mapSceneToResponseDto(music: SceneMusic): SceneMusicResponseDto {
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

    private mapMomentToResponseDto(music: MomentMusic): MomentMusicResponseDto {
        return {
            id: music.id,
            moment_id: music.moment_id,
            music_name: music.music_name,
            artist: music.artist,
            duration: music.duration,
            music_type: music.music_type,
            overrides_scene_music: music.overrides_scene_music,
            created_at: music.created_at,
            updated_at: music.updated_at,
        };
    }

    // Scene Music Methods
    async createSceneMusic(createDto: CreateSceneMusicDto) {
        // Verify scene exists (film_scene_id is guaranteed to be set by controller)
        const sceneId = createDto.film_scene_id!;
        
        const scene = await this.prisma.filmScene.findUnique({
            where: { id: sceneId },
        });

        if (!scene) {
            throw new NotFoundException(
                `Scene with ID ${sceneId} not found`,
            );
        }

        // Scene music is unique, so delete existing if present
        await this.prisma.sceneMusic.deleteMany({
            where: { film_scene_id: sceneId },
        });

        const music = await this.prisma.sceneMusic.create({
            data: {
                film_scene_id: sceneId,
                music_name: createDto.music_name,
                artist: createDto.artist,
                duration: createDto.duration,
                music_type: (createDto.music_type as MusicType) || MusicType.MODERN,
            },
        });

        return this.mapSceneToResponseDto(music);
    }

    async getSceneMusic(sceneId: number) {
        const music = await this.prisma.sceneMusic.findUnique({
            where: { film_scene_id: sceneId },
        });

        if (!music) {
            throw new NotFoundException(`No music assigned to scene ${sceneId}`);
        }

        return this.mapSceneToResponseDto(music);
    }

    async updateSceneMusic(sceneId: number, updateDto: UpdateSceneMusicDto) {
        const music = await this.prisma.sceneMusic.findUnique({
            where: { film_scene_id: sceneId },
        });

        if (!music) {
            throw new NotFoundException(`No music assigned to scene ${sceneId}`);
        }

        const updated = await this.prisma.sceneMusic.update({
            where: { id: music.id },
            data: updateDto as Prisma.SceneMusicUpdateInput,
        });

        return this.mapSceneToResponseDto(updated);
    }

    async removeSceneMusic(sceneId: number) {
        const music = await this.prisma.sceneMusic.findUnique({
            where: { film_scene_id: sceneId },
        });

        if (!music) {
            throw new NotFoundException(`No music assigned to scene ${sceneId}`);
        }

        await this.prisma.sceneMusic.delete({
            where: { id: music.id },
        });

        return { message: `Removed music from scene ${sceneId}` };
    }

    // Moment Music Methods
    async createMomentMusic(createDto: CreateMomentMusicDto) {
        // Verify moment exists (moment_id is guaranteed to be set by controller)
        const momentId = createDto.moment_id!;
        
        const moment = await this.prisma.sceneMoment.findUnique({
            where: { id: momentId },
        });

        if (!moment) {
            throw new NotFoundException(
                `Moment with ID ${momentId} not found`,
            );
        }

        // Moment music is unique, so delete existing if present
        await this.prisma.momentMusic.deleteMany({
            where: { moment_id: momentId },
        });

        const music = await this.prisma.momentMusic.create({
            data: {
                moment_id: momentId,
                music_name: createDto.music_name,
                artist: createDto.artist,
                duration: createDto.duration,
                music_type: (createDto.music_type as MusicType) || MusicType.MODERN,
                overrides_scene_music: createDto.overrides_scene_music ?? true,
            },
        });

        return this.mapMomentToResponseDto(music);
    }

    async getMomentMusic(momentId: number) {
        const music = await this.prisma.momentMusic.findUnique({
            where: { moment_id: momentId },
        });

        if (!music) {
            throw new NotFoundException(`No music assigned to moment ${momentId}`);
        }

        return this.mapMomentToResponseDto(music);
    }

    async updateMomentMusic(momentId: number, updateDto: UpdateMomentMusicDto) {
        const music = await this.prisma.momentMusic.findUnique({
            where: { moment_id: momentId },
        });

        if (!music) {
            throw new NotFoundException(`No music assigned to moment ${momentId}`);
        }

        const updated = await this.prisma.momentMusic.update({
            where: { id: music.id },
            data: updateDto as Prisma.MomentMusicUpdateInput,
        });

        return this.mapMomentToResponseDto(updated);
    }

    async removeMomentMusic(momentId: number) {
        const music = await this.prisma.momentMusic.findUnique({
            where: { moment_id: momentId },
        });

        if (!music) {
            throw new NotFoundException(`No music assigned to moment ${momentId}`);
        }

        await this.prisma.momentMusic.delete({
            where: { id: music.id },
        });

        return { message: `Removed music from moment ${momentId}` };
    }

    // Utility methods
    async getMusicTypes() {
        return [
            'MODERN',
            'ORCHESTRAL',
            'PIANO',
            'VINTAGE',
            'AMBIENT',
            'UPLIFTING',
            'DRAMATIC',
            'COMEDIC',
        ];
    }

    async getFilmMusic(filmId: number) {
        // Get all music across all scenes in the film
        const scenesWithMusic = await this.prisma.filmScene.findMany({
            where: { film_id: filmId },
            include: {
                scene_music: true,
                moments: {
                    include: {
                        moment_music: true,
                    },
                },
            },
        });

        const sceneMusic = scenesWithMusic
            .filter(s => s.scene_music)
            .map(s => ({
                type: 'scene',
                scene_id: s.id,
                scene_name: s.name,
                music: s.scene_music,
            }));

        const momentMusic = scenesWithMusic
            .flatMap(s => s.moments
                .filter(m => m.moment_music)
                .map(m => ({
                    type: 'moment',
                    scene_id: s.id,
                    scene_name: s.name,
                    moment_id: m.id,
                    moment_name: m.name,
                    music: m.moment_music,
                }))
            );

        return {
            film_id: filmId,
            scene_music: sceneMusic,
            moment_music: momentMusic,
            total_music_items: sceneMusic.length + momentMusic.length,
        };
    }
}
