import { IsInt, IsString, Min, Max, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ScaffoldPackageActivityDto } from './scaffold-package-activity.dto';

/** Named package day to scaffold when the wizard skips preset activities. */
export class ScaffoldPackageDayDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  order_index!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  locationCount?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScaffoldPackageActivityDto)
  activities?: ScaffoldPackageActivityDto[];
}
