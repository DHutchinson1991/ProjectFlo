import { IsInt, IsOptional, IsString, IsArray } from 'class-validator';

export { UpdateInstanceEventDaySubjectDto } from './update-instance-event-day-subject.dto';

export class CreateInstanceEventDaySubjectDto {
  @IsInt()
  project_event_day_id: number;

  @IsOptional()
  @IsInt()
  role_template_id?: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  real_name?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  count?: number;

  @IsOptional()
  @IsArray()
  member_names?: string[] | null;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

