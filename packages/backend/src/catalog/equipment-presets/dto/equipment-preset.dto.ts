import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class EquipmentPresetSlotDto {
  @IsIn(['CAMERA', 'AUDIO'])
  slot_type!: 'CAMERA' | 'AUDIO';

  @IsOptional()
  @IsInt()
  equipment_id?: number | null;

  @IsOptional()
  @IsInt()
  crew_id?: number | null;

  @IsOptional()
  @IsInt()
  job_role_id?: number | null;

  @IsInt()
  @Min(0)
  order_index!: number;
}

export class CreateEquipmentPresetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EquipmentPresetSlotDto)
  slots!: EquipmentPresetSlotDto[];
}

export class UpdateEquipmentPresetDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentPresetSlotDto)
  slots?: EquipmentPresetSlotDto[];
}
