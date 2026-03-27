import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateJobRoleDto {
  @IsString()
  name: string;

  @IsString()
  display_name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}