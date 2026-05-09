import { IsInt, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpsertCameraPositionDto {
    @IsInt()
    track_id: number;

    @IsInt()
    space_id: number;

    @IsNumber()
    x: number;

    @IsNumber()
    y: number;

    @IsNumber()
    @IsOptional()
    rotation?: number;

    @IsInt()
    @IsOptional()
    focal_length_mm?: number;

    @IsBoolean()
    @IsOptional()
    is_unmanned?: boolean;

    @IsString()
    @IsOptional()
    label?: string;
}

export class UpsertSubjectPositionDto {
    @IsInt()
    subject_id: number;

    @IsInt()
    space_id: number;

    @IsNumber()
    x: number;

    @IsNumber()
    y: number;

    @IsString()
    @IsOptional()
    label?: string;
}

export class AddSceneSpaceDto {
    @IsInt()
    space_id: number;

    @IsInt()
    @IsOptional()
    order_index?: number;
}

// ── Moment-Level Position Overrides (Keyframes) ─────────────

export class UpsertMomentCameraPositionDto {
    @IsInt()
    track_id: number;

    @IsInt()
    space_id: number;

    @IsNumber()
    x: number;

    @IsNumber()
    y: number;

    @IsNumber()
    @IsOptional()
    rotation?: number;

    @IsInt()
    @IsOptional()
    focal_length_mm?: number;

    @IsBoolean()
    @IsOptional()
    is_unmanned?: boolean;

    @IsString()
    @IsOptional()
    label?: string;

    @IsInt()
    @IsOptional()
    source_scene_position_id?: number;
}

export class UpsertMomentSubjectPositionDto {
    @IsInt()
    subject_id: number;

    @IsInt()
    space_id: number;

    @IsNumber()
    x: number;

    @IsNumber()
    y: number;

    @IsString()
    @IsOptional()
    label?: string;

    @IsInt()
    @IsOptional()
    source_scene_position_id?: number;
}
