import { IsString, IsOptional, IsNumber, IsNotEmpty, IsInt, IsIn, Min, Max } from 'class-validator';

const MONTAGE_STYLE_VALUES = ['RHYTHMIC', 'IMPRESSIONISTIC', 'SEQUENTIAL', 'PARALLEL', 'HIGHLIGHTS', 'NARRATIVE_ARC'];

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

    @IsString()
    @IsOptional()
    @IsIn(MONTAGE_STYLE_VALUES)
    montage_style?: string;

    @IsInt()
    @IsOptional()
    @Min(40)
    @Max(240)
    montage_bpm?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    order_index?: number;
}
