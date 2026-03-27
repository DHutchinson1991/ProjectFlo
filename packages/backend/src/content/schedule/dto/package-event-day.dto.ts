import { IsInt, IsOptional, IsArray } from 'class-validator';

export { SetPackageEventDaysDto } from './set-package-event-days.dto';

export class AddPackageEventDayDto {
  @IsInt()
  event_day_template_id: number;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

