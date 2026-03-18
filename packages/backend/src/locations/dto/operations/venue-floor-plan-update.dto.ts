import { IsOptional, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for updating venue-specific floor plan data
 * This handles the special case of venue floor plan configurations
 * that are separate from the standard floor plan templates
 */
export class UpdateVenueFloorPlanDto {
    @IsObject()
    venue_floor_plan_data: Record<string, unknown>;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    venue_floor_plan_version?: number;
}
