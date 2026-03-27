import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class TaskLibraryPhaseQueryDto {
  @Type(() => Number)
  @IsInt()
  brandId: number;
}