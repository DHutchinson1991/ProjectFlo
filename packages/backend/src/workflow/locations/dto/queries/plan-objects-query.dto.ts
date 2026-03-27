import { IsOptional, IsString } from 'class-validator';

export class PlanObjectsQueryDto {
  @IsOptional()
  @IsString()
  category?: string;
}
