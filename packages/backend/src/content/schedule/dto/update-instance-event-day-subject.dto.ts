import { IsInt, IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateInstanceEventDaySubjectDto {
  @IsOptional()
  @IsInt()
  project_event_day_id?: number;

  @IsOptional()
  @IsInt()
  role_template_id?: number | null;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  real_name?: string | null;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  count?: number | null;

  @IsOptional()
  @IsArray()
  member_names?: string[] | null;

  @IsOptional()
  @IsInt()
  order_index?: number;
}
