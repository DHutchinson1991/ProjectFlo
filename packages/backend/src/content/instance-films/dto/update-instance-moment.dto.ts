import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateInstanceMomentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;
}
