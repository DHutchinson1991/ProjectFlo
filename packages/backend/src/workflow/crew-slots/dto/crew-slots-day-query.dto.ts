import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class CrewSlotsDayQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dayId?: number;
}
