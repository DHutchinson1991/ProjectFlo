import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { MusicType, MomentMusic } from '@prisma/client';
import { CreateMomentMusicDto } from '../dto/create-music.dto';
import { UpdateMomentMusicDto } from '../dto/update-music.dto';
import { MomentMusicResponseDto } from '../dto/moment-music-response.dto';

@Injectable()
export class MomentMusicService {
    constructor(private prisma: PrismaService) {}

    private mapToResponseDto(music: MomentMusic): MomentMusicResponseDto {
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

    async create(momentId: number, createDto: CreateMomentMusicDto): Promise<MomentMusicResponseDto> {
        const moment = await this.prisma.sceneMoment.findUnique({ where: { id: momentId } });
        if (!moment) {
            throw new NotFoundException(`Moment with ID ${momentId} not found`);
        }

        // Moment music is one-to-one; replace any existing entry.
        await this.prisma.momentMusic.deleteMany({ where: { moment_id: momentId } });

        const music = await this.prisma.momentMusic.create({
            data: {
                moment_id: momentId,
                music_name: createDto.music_name,
                artist: createDto.artist,
                duration: createDto.duration,
                music_type: (createDto.music_type as MusicType) ?? MusicType.MODERN,
                overrides_scene_music: createDto.overrides_scene_music ?? true,
            },
        });

        return this.mapToResponseDto(music);
    }

    async findOne(momentId: number): Promise<MomentMusicResponseDto> {
        const music = await this.prisma.momentMusic.findUnique({
            where: { moment_id: momentId },
        });
        if (!music) {
            throw new NotFoundException(`No music assigned to moment ${momentId}`);
        }
        return this.mapToResponseDto(music);
    }

    async update(momentId: number, updateDto: UpdateMomentMusicDto): Promise<MomentMusicResponseDto> {
        const music = await this.prisma.momentMusic.findUnique({
            where: { moment_id: momentId },
        });
        if (!music) {
            throw new NotFoundException(`No music assigned to moment ${momentId}`);
        }

        const updated = await this.prisma.momentMusic.update({
            where: { id: music.id },
            data: {
                music_name: updateDto.music_name,
                artist: updateDto.artist,
                duration: updateDto.duration,
                music_type: updateDto.music_type as MusicType | undefined,
                overrides_scene_music: updateDto.overrides_scene_music,
            },
        });

        return this.mapToResponseDto(updated);
    }

    async remove(momentId: number): Promise<{ message: string }> {
        const music = await this.prisma.momentMusic.findUnique({
            where: { moment_id: momentId },
        });
        if (!music) {
            throw new NotFoundException(`No music assigned to moment ${momentId}`);
        }
        await this.prisma.momentMusic.delete({ where: { id: music.id } });
        return { message: `Removed music from moment ${momentId}` };
    }
}
