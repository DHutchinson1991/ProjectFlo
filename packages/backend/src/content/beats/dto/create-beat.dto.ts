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
}
