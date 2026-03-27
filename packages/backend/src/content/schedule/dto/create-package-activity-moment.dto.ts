import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreatePackageActivityMomentDto {
  @IsString()
  name: string;

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
