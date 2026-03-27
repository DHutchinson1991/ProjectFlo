import { PartialType } from '@nestjs/mapped-types';
import { CreateLocationDto } from './create-location.dto';

/**
 * DTO for updating an existing location/venue
 * All fields from CreateLocationDto are optional for updates
 */
export class UpdateLocationDto extends PartialType(CreateLocationDto) { }
