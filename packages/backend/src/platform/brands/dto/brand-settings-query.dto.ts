import { IsOptional, IsString } from 'class-validator';

export class BrandSettingsQueryDto {
  @IsOptional()
  @IsString()
  category?: string;
}
