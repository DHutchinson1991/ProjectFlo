import { IsInt, IsOptional, IsArray } from 'class-validator';

export class AddPackageEventDayDto {
  @IsInt()
  event_day_template_id: number;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

export class SetPackageEventDaysDto {
  @IsArray()
  @IsInt({ each: true })
  event_day_template_ids: number[];
}
