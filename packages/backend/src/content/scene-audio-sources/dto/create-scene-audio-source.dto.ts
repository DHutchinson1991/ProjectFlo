import { IsString, IsOptional, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateSceneAudioSourceDto {
    @IsNumber()
    @IsOptional()
    scene_id?: number; // set by controller from route param

    @IsString()
    @IsNotEmpty()
    source_type: string; // AudioSourceType: MOMENT | BEAT | SCENE | ACTIVITY

    @IsNumber()
    @IsOptional()
    source_activity_id?: number;

    @IsNumber()
    @IsOptional()
    source_moment_id?: number;

    @IsNumber()
    @IsOptional()
    source_scene_id?: number;

    @IsString()
    @IsOptional()
    track_type?: string; // AudioTrackType: SPEECH | AMBIENT | MUSIC

    @IsNumber()
    @IsOptional()
    @Min(0)
    start_offset_seconds?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    duration_seconds?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    order_index?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}
