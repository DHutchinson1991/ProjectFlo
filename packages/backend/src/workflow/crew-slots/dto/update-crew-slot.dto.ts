import { IsNumber, IsString, IsOptional } from 'class-validator';

export class UpdateCrewSlotDto {
  @IsNumber()
  @IsOptional()
  job_role_id?: number;

  @IsNumber()
  @IsOptional()
  crew_id?: number | null;

  @IsString()
  @IsOptional()
  label?: string | null;

  @IsNumber()
  @IsOptional()
  hours?: number;

  @IsNumber()
  @IsOptional()
  order_index?: number;
}
