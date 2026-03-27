import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateFloorPlanDto } from './create-floor-plan.dto';

/**
 * DTO for updating an existing floor plan
 * Excludes space_id (cannot be changed after creation)
 */
export class UpdateFloorPlanDto extends PartialType(
    OmitType(CreateFloorPlanDto, ['space_id'])
) { }
