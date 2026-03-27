import { IsString, IsOptional } from 'class-validator';

export class CreateEquipmentTemplateDto {
  @IsString()
  name: string = undefined as unknown as string;

  @IsString()
  @IsOptional()
  description?: string | null;
}
