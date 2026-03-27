import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreatePackageDaySubjectDto {
  @IsInt()
  event_day_template_id!: number;

  @IsOptional()
  @IsInt()
  role_template_id?: number;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  count?: number;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

