import { IsInt, IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateInstanceCrewSlotDto {
  @IsOptional()
  @IsInt()
  crew_id?: number | null;

  @IsOptional()
  @IsInt()
  job_role_id?: number;

  @IsOptional()
  @IsNumber()
  hours?: number;

  @IsOptional()
  @IsString()
  label?: string | null;

  @IsOptional()
  @IsInt()
  order_index?: number;
}
