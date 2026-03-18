import { IsString, IsOptional, IsNumber, IsInt, IsIn, Min, Max } from 'class-validator';

const MONTAGE_STYLE_VALUES = ['RHYTHMIC', 'IMPRESSIONISTIC', 'SEQUENTIAL', 'PARALLEL', 'HIGHLIGHTS', 'NARRATIVE_ARC'];

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

    @IsString()
    @IsOptional()
    @IsIn(MONTAGE_STYLE_VALUES)
    montage_style?: string | null;

    @IsInt()
    @IsOptional()
    @Min(40)
    @Max(240)
    montage_bpm?: number | null;
}
