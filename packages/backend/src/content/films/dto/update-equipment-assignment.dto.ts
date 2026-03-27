import { IsInt, IsString, IsOptional, Min } from 'class-validator';

export class UpdateEquipmentAssignmentDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
