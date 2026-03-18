import { IsString, IsOptional, IsNumber, IsNotEmpty, IsBoolean } from 'class-validator';
import { MusicType } from '@prisma/client';

// Scene Music DTO
export class CreateSceneMusicDto {
    @IsNumber()
    @IsOptional() // Optional in DTO - set by controller from URL
    film_scene_id?: number;

    @IsString()
    @IsNotEmpty()
    music_name: string;

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

// Moment Music DTO
export class CreateMomentMusicDto {
    @IsNumber()
    @IsOptional() // Optional in DTO - set by controller from URL
    moment_id?: number;

    @IsString()
    @IsNotEmpty()
    music_name: string;

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
