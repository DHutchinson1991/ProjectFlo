import { IsString, IsOptional, IsInt } from 'class-validator';

export class UpdatePackageDaySubjectDto {
  @IsOptional()
  @IsInt()
  event_day_template_id?: number;

  @IsOptional()
  @IsInt()
  role_template_id?: number | null;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  count?: number | null;

  @IsOptional()
  @IsInt()
  order_index?: number;
}
