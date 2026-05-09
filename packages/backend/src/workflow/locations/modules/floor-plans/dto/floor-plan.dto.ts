import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { FloorPlanObjectType } from '@prisma/client';

export class CreateFloorPlanDto {
    @IsInt()
    location_id: number;

    @IsString()
    @IsOptional()
    name?: string;

    @IsInt()
    @IsOptional()
    canvas_width?: number;

    @IsInt()
    @IsOptional()
    canvas_height?: number;

    @IsOptional()
    layout_json?: any;

    @IsBoolean()
    @IsOptional()
    is_default?: boolean;
}

export class UpdateFloorPlanDto extends PartialType(CreateFloorPlanDto) {}

export class CreateFloorPlanObjectDto {
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
    metadata?: any;

    @IsInt()
    @IsOptional()
    order_index?: number;
}

export class UpdateFloorPlanObjectDto extends PartialType(CreateFloorPlanObjectDto) {}

export class BulkUpsertFloorPlanObjectDto {
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
    metadata?: any;

    @IsInt()
    @IsOptional()
    order_index?: number;
}

export class SaveFloorPlanDto {
    @IsOptional()
    layout_json?: any;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkUpsertFloorPlanObjectDto)
    @IsOptional()
    objects?: BulkUpsertFloorPlanObjectDto[];
}

export class UpdateSpaceBoundaryDto {
    @IsOptional()
    boundary_json?: any;

    @IsString()
    @IsOptional()
    fill_color?: string;
}
