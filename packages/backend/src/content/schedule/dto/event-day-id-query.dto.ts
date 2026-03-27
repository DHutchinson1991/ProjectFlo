import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class EventDayIdQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  eventDayId?: number;
}
