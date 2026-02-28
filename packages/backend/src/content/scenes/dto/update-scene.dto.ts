import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateSceneDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsNumber()
    @IsOptional()
    scene_template_id?: number | null;

    @IsNumber()
    @IsOptional()
    shot_count?: number | null;

    @IsNumber()
    @IsOptional()
    duration_seconds?: number | null;

    @IsNumber()
    @IsOptional()
    order_index?: number;
}
