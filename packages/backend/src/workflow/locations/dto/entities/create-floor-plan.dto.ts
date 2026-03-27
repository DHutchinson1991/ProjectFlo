import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Prisma } from '@prisma/client';

/**
 * DTO for creating a new floor plan for a location space
 */
export class CreateFloorPlanDto {
    @IsInt()
    @Type(() => Number)
    space_id: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    project_id?: number; // NULL for default library version

    @IsString()
    name: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    version?: number = 1;

    fabric_data: Prisma.InputJsonValue; // Fabric.js canvas data

    @IsOptional()
    layers_data?: Prisma.InputJsonValue; // Layer information

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    is_default?: boolean = false;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    is_active?: boolean = true;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    created_by_id?: number;
}
