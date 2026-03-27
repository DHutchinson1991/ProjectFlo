import { IsInt, IsArray } from 'class-validator';

export class SetPackageEventDaysDto {
  @IsArray()
  @IsInt({ each: true })
  event_day_template_ids: number[];
}
