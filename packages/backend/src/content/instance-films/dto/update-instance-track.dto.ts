import { IsOptional, IsString, IsInt, IsBoolean, IsNumber } from 'class-validator';

export class UpdateInstanceTrackDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_unmanned?: boolean;

  @IsOptional()
  @IsInt()
  crew_member_id?: number;
}
