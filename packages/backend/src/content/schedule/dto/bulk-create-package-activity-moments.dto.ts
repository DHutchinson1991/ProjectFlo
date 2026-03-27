import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePackageActivityMomentDto } from './create-package-activity-moment.dto';

export class BulkCreatePackageActivityMomentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackageActivityMomentDto)
  moments: CreatePackageActivityMomentDto[];
}
