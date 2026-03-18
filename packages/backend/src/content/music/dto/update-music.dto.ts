import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { MusicType } from '@prisma/client';

export class UpdateSceneMusicDto {
    @IsString()
    @IsOptional()
    music_name?: string;

    @IsString()
    @IsOptional()
    artist?: string;

    @IsNumber()
    @IsOptional()
    duration?: number;

    @IsString()
    @IsOptional()
    music_type?: MusicType;
}

export class UpdateMomentMusicDto {
    @IsString()
    @IsOptional()
    music_name?: string;

    @IsString()
    @IsOptional()
    artist?: string;

    @IsNumber()
    @IsOptional()
    duration?: number;

    @IsString()
    @IsOptional()
    music_type?: MusicType;

    @IsBoolean()
    @IsOptional()
    overrides_scene_music?: boolean;
}
