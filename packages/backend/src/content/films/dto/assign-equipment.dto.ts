import { IsInt, IsString, IsOptional, Min } from 'class-validator';

export class AssignEquipmentDto {
  @IsInt()
  @Min(1)
  equipment_id: number;

  @IsInt()
  @Min(1)
  quantity: number = 1;

  @IsString()
  @IsOptional()
  notes?: string;
}
