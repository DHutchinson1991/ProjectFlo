import { IsInt, IsOptional, IsString, IsNumber } from 'class-validator';

export { UpdateInstanceDayOperatorDto } from './update-instance-day-operator.dto';

export class CreateInstanceDayOperatorDto {
  @IsInt()
  project_event_day_id: number;

  @IsInt()
  job_role_id: number;

  @IsOptional()
  @IsInt()
  crew_member_id?: number | null;

  @IsOptional()
  @IsNumber()
  hours?: number;

  @IsOptional()
  @IsString()
  label?: string | null;

  @IsOptional()
  @IsInt()
  project_activity_id?: number | null;
}

