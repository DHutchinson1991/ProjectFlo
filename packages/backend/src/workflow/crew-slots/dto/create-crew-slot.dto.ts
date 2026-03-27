import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateCrewSlotDto {
  @IsNumber()
  event_day_template_id: number = undefined as unknown as number;

  @IsNumber()
  job_role_id: number = undefined as unknown as number;

  @IsNumber()
  @IsOptional()
  crew_member_id?: number | null;

  @IsString()
  @IsOptional()
  label?: string | null;

  @IsNumber()
  @IsOptional()
  hours?: number;

  @IsNumber()
  @IsOptional()
  package_activity_id?: number | null;
}
