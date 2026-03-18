import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsBoolean,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Nested DTOs ──────────────────────────────────────────────────────

export class SelectedActivityDto {
  @IsInt()
  presetId!: number;

  @IsOptional()
  @IsString()
  startTime?: string; // "HH:MM"

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;
}

export class CustomMomentDto {
  @IsString()
  name!: string;

  @IsBoolean()
  isKeyMoment!: boolean;
}

export class CustomActivityDto {
  @IsString()
  name!: string;

  @IsInt()
  dayTemplateId!: number; // EventDayTemplate.id

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomMomentDto)
  moments!: CustomMomentDto[];
}

export class MomentKeyOverrideDto {
  @IsInt()
  momentId!: number;

  @IsBoolean()
  isKey!: boolean;
}

export class CrewAssignmentDto {
  @IsInt()
  contributorId!: number;

  @IsInt()
  jobRoleId!: number;

  @IsString()
  positionName!: string;

  @IsOptional()
  @IsString()
  positionColor?: string;
}

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

// ── Main DTO ─────────────────────────────────────────────────────────

export class CreatePackageFromEventTypeDto {
  @IsString()
  packageName!: string;

  @IsOptional()
  @IsString()
  packageDescription?: string;

  // Selected event day link IDs — EventTypeEventDay.id values
  @IsArray()
  @IsInt({ each: true })
  selectedDayIds!: number[];

  // Selected activity presets with optional time/duration overrides
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedActivityDto)
  selectedActivities!: SelectedActivityDto[];

  // Custom activities added by user
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomActivityDto)
  customActivities!: CustomActivityDto[];

  // Selected moment preset IDs
  @IsArray()
  @IsInt({ each: true })
  selectedMomentIds!: number[];

  // Key-moment overrides (momentPresetId → isKey)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MomentKeyOverrideDto)
  momentKeyOverrides!: MomentKeyOverrideDto[];

  // Selected subject role IDs
  @IsArray()
  @IsInt({ each: true })
  selectedRoleIds!: number[];

  // Location count (1-5)
  @IsInt()
  @Min(1)
  locationCount!: number;

  // Crew assignments
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewAssignmentDto)
  crewAssignments!: CrewAssignmentDto[];

  // Camera/audio equipment slots
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentSlotDto)
  equipmentSlots!: EquipmentSlotDto[];
}
