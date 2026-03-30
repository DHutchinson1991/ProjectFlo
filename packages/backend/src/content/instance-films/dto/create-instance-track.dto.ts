import { IsOptional, IsString, IsInt, IsBoolean, IsNumber } from 'class-validator';

export class CreateInstanceTrackDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

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
  crew_id?: number;
}
