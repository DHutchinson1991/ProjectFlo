import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class ResolvedScheduleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  packageFilmId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  projectFilmId?: number;
}
