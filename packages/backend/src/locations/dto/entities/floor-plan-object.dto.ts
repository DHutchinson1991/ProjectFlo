import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { Prisma } from '@prisma/client';

/**
 * DTO for creating a new floor plan object (furniture, equipment, etc.)
 */
export class CreateFloorPlanObjectDto {
    @IsString()
    name: string;

    @IsString()
    category: string; // "Furniture", "Equipment", "Structural", etc.

    @IsString()
    object_type: string; // "Chair", "Table", "Stage", "Pillar", etc.

    fabric_template: Prisma.InputJsonValue; // Fabric.js object template

    @IsOptional()
    @IsString()
    thumbnail_url?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    brand_id?: number;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    is_active?: boolean = true;
}

/**
 * DTO for updating an existing floor plan object
 * Excludes brand_id initially but allows it to be set explicitly
 */
export class UpdateFloorPlanObjectDto extends PartialType(
    OmitType(CreateFloorPlanObjectDto, ['brand_id'])
) {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    brand_id?: number;
}
