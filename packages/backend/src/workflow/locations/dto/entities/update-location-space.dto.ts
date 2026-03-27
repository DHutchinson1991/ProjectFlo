import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateLocationSpaceDto } from './create-location-space.dto';

/**
 * DTO for updating an existing location space
 * Excludes location_id (cannot be changed after creation)
 */
export class UpdateLocationSpaceDto extends PartialType(
    OmitType(CreateLocationSpaceDto, ['location_id'])
) { }
