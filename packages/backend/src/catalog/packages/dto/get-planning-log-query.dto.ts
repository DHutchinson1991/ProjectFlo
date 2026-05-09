import { IsString, MinLength } from 'class-validator';

export class GetPlanningLogQueryDto {
  @IsString()
  @MinLength(1)
  path: string;
}