import { IsInt, IsOptional, IsBoolean } from 'class-validator';

export class LinkEventDayDto {
  @IsInt()
  event_day_template_id!: number;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
