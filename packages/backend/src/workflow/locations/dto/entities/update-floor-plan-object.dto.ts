import { IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateFloorPlanObjectDto } from './create-floor-plan-object.dto';

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
