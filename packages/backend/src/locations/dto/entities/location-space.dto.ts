import { IsString, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { Prisma } from '@prisma/client';

/**
 * DTO for creating a new space within a location/venue
 */
export class CreateLocationSpaceDto {
    @IsInt()
    @Type(() => Number)
    location_id: number;

    @IsString()
    name: string;

    @IsString()
    space_type: string; // Free-form: "Dance Floor", "Ceremony Area", "Reception Hall", etc.

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    capacity?: number;

    @IsOptional()
    @Type(() => Number)
    dimensions_length?: number;

    @IsOptional()
    @Type(() => Number)
    dimensions_width?: number;

    @IsOptional()
    @Type(() => Number)
    dimensions_height?: number;

    @IsOptional()
    metadata?: Prisma.InputJsonValue; // Flexible metadata for floor plan layout

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    is_active?: boolean = true;
}

/**
 * DTO for updating an existing location space
 * Excludes location_id (cannot be changed after creation)
 */
export class UpdateLocationSpaceDto extends PartialType(
    OmitType(CreateLocationSpaceDto, ['location_id'])
) { }
