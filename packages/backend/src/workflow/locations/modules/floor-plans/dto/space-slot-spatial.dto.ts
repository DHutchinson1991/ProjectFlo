import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FloorPlanObjectType, FacingTargetType } from '@prisma/client';

// ── Objects ──────────────────────────────────────────────────

export class BulkUpsertSpaceSlotObjectDto {
    @IsInt()
    @IsOptional()
    id?: number;

    @IsEnum(FloorPlanObjectType)
    object_type: FloorPlanObjectType;

    @IsString()
    @IsOptional()
    label?: string;

    @IsNumber()
    x: number;

    @IsNumber()
    y: number;

    @IsNumber()
    @IsOptional()
    width?: number;

    @IsNumber()
    @IsOptional()
    height?: number;

    @IsNumber()
    @IsOptional()
    rotation?: number;

    @IsOptional()
    metadata?: any; // eslint-disable-line @typescript-eslint/no-explicit-any

    @IsInt()
    @IsOptional()
    order_index?: number;
}

// ── Camera Positions ─────────────────────────────────────────

export class BulkUpsertSpaceSlotCameraDto {
    @IsInt()
    @IsOptional()
    id?: number;

    @IsInt()
    @IsOptional()
    crew_slot_id?: number;

    @IsString()
    @IsOptional()
    label?: string;

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

    @IsNumber()
    @IsOptional()
    fov_angle?: number;

    @IsEnum(FacingTargetType)
    @IsOptional()
    facing_target_type?: FacingTargetType;

    @IsInt()
    @IsOptional()
    facing_target_id?: number;

    @IsInt()
    @IsOptional()
    order_index?: number;
}

// ── Subject Positions ────────────────────────────────────────

export class BulkUpsertSpaceSlotSubjectDto {
    @IsInt()
    @IsOptional()
    id?: number;

    @IsInt()
    @IsOptional()
    day_subject_id?: number;

    @IsString()
    @IsOptional()
    label?: string;

    @IsNumber()
    x: number;

    @IsNumber()
    y: number;

    @IsNumber()
    @IsOptional()
    rotation?: number;

    @IsInt()
    @IsOptional()
    bound_object_id?: number;

    @IsNumber()
    @IsOptional()
    bound_offset_x?: number;

    @IsNumber()
    @IsOptional()
    bound_offset_y?: number;

    @IsEnum(FacingTargetType)
    @IsOptional()
    facing_target_type?: FacingTargetType;

    @IsInt()
    @IsOptional()
    facing_target_id?: number;

    @IsInt()
    @IsOptional()
    order_index?: number;
}

// ── Save Canvas (full upsert) ────────────────────────────────

export class SaveSpaceSlotCanvasDto {
    @IsOptional()
    layout_json?: any; // eslint-disable-line @typescript-eslint/no-explicit-any

    @IsInt()
    @IsOptional()
    canvas_width?: number;

    @IsInt()
    @IsOptional()
    canvas_height?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkUpsertSpaceSlotObjectDto)
    @IsOptional()
    objects?: BulkUpsertSpaceSlotObjectDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkUpsertSpaceSlotCameraDto)
    @IsOptional()
    cameras?: BulkUpsertSpaceSlotCameraDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkUpsertSpaceSlotSubjectDto)
    @IsOptional()
    subjects?: BulkUpsertSpaceSlotSubjectDto[];
}

// ── Zones ────────────────────────────────────────────────────

export class UpsertSpaceSlotZoneDto {
    @IsInt()
    @IsOptional()
    id?: number;

    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    label?: string;

    @IsArray()
    polygon: Array<{ x: number; y: number }>;

    @IsString()
    @IsOptional()
    color?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsInt()
    @IsOptional()
    order_index?: number;
}

