import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CrewPresetSlotDto {
  @IsInt()
  job_role_id!: number;

  @IsOptional()
  @IsInt()
  crew_id?: number | null;

  @IsOptional()
  @IsInt()
  equipment_id?: number | null;

  @IsInt()
  @Min(0)
  order_index!: number;
}

export class CreateCrewPresetDto {
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
  @Type(() => CrewPresetSlotDto)
  slots!: CrewPresetSlotDto[];
}

export class UpdateCrewPresetDto {
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
  @Type(() => CrewPresetSlotDto)
  slots?: CrewPresetSlotDto[];
}
