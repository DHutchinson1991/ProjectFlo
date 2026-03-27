import { IsString, IsOptional, IsNumber, IsNotEmpty, IsBoolean } from 'class-validator';
import { MusicType } from '@prisma/client';

export class CreateMomentMusicDto {
    @IsNumber()
    @IsOptional()
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
