import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateCrewSlotDto {
  @IsNumber()
  package_event_day_id: number = undefined as unknown as number;

  @IsNumber()
  job_role_id: number = undefined as unknown as number;

  @IsNumber()
  @IsOptional()
  crew_id?: number | null;

  @IsString()
  @IsOptional()
  label?: string | null;

  @IsNumber()
  @IsOptional()
  hours?: number;

}
