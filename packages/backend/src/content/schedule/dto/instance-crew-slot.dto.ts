import { IsInt, IsOptional, IsString, IsNumber } from 'class-validator';

export { UpdateInstanceCrewSlotDto } from './update-instance-crew-slot.dto';

export class CreateInstanceCrewSlotDto {
  @IsInt()
  project_event_day_id: number;

  @IsInt()
  job_role_id: number;

  @IsOptional()
  @IsInt()
  crew_id?: number | null;

  @IsOptional()
  @IsNumber()
  hours?: number;

  @IsOptional()
  @IsString()
  label?: string | null;
}
