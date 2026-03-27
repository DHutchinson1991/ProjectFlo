import { IsOptional, IsInt, IsBoolean, Min } from 'class-validator';

export class UpdateEquipmentDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  num_cameras?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  num_audio?: number;

  @IsOptional()
  @IsBoolean()
  allow_removal?: boolean;
}
