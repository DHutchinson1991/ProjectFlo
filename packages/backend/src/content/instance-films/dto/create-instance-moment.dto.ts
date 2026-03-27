import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateInstanceMomentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;
}
