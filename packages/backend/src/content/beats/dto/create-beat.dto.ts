import { IsString, IsOptional, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateBeatDto {
    @IsNumber()
    @IsOptional()
    film_scene_id?: number;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    order_index?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    shot_count?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    duration_seconds?: number;

    @IsNumber()
    @IsOptional()
    source_activity_id?: number;

    @IsNumber()
    @IsOptional()
    source_moment_id?: number;

    @IsNumber()
    @IsOptional()
    source_scene_id?: number;
}
