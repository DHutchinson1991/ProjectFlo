import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsNumber()
  brand_id?: number;
}
