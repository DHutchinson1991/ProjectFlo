import { IsInt, IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateInstanceActivityMomentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsInt()
  duration_seconds?: number;

  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
