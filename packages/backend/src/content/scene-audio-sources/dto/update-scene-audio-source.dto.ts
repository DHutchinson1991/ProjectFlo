import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateSceneAudioSourceDto {
    @IsString()
    @IsOptional()
    source_type?: string;

    @IsNumber()
    @IsOptional()
    source_activity_id?: number | null;

    @IsNumber()
    @IsOptional()
    source_moment_id?: number | null;

    @IsNumber()
    @IsOptional()
    source_scene_id?: number | null;

    @IsString()
    @IsOptional()
    track_type?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    start_offset_seconds?: number | null;

    @IsNumber()
    @IsOptional()
    @Min(1)
    duration_seconds?: number | null;

    @IsNumber()
    @IsOptional()
    @Min(0)
    order_index?: number;

    @IsString()
    @IsOptional()
    notes?: string | null;
}
