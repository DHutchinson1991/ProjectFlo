import { IsString, IsOptional, IsNumber, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateSceneDto {
    @IsNumber()
    @IsOptional() // Optional in DTO - set by controller from URL
    film_id?: number;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @IsOptional()
    scene_template_id?: number;

    @IsNumber()
    @IsOptional()
    shot_count?: number;

    @IsNumber()
    @IsOptional()
    duration_seconds?: number;

    @IsString()
    @IsOptional()
    mode?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    order_index?: number;
}
