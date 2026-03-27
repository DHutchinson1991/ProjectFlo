import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateEquipmentTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
