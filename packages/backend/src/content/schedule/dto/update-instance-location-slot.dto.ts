import { IsOptional, IsString } from 'class-validator';

export class UpdateInstanceLocationSlotDto {
  @IsOptional()
  @IsString()
  name?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
