import { IsInt, IsString, IsOptional } from 'class-validator';

export class EquipmentSlotDto {
  @IsInt()
  equipmentId!: number;

  @IsString()
  slotLabel!: string; // "Camera 1", "Audio 1", etc.

  @IsString()
  slotType!: string; // "CAMERA" | "AUDIO"

  @IsOptional()
  @IsInt()
  contributorId?: number;

  @IsOptional()
  @IsInt()
  jobRoleId?: number;
}
