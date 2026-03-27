import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
import { MusicType } from '@prisma/client';

export class CreateSceneMusicDto {
    @IsNumber()
    @IsOptional()
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
