import {
  IsString,
  IsOptional,
  IsArray,
  IsIn,
  IsInt,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SelectedActivityDto } from './selected-activity.dto';
import { CustomActivityDto } from './custom-activity.dto';
import { MomentKeyOverrideDto } from './moment-key-override.dto';
import { CrewAssignmentDto } from './crew-assignment.dto';
import { EquipmentSlotDto } from './equipment-slot.dto';
import { RoleSlotDto } from './role-slot.dto';

export class CreatePackageFromEventTypeDto {
  @IsString()
  packageName!: string;

  @IsOptional()
  @IsString()
  packageDescription?: string;

  // Selected event day link IDs — EventTypeDay.id values
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

  @IsOptional()
  @IsInt()
  @IsIn([50, 100, 150])
  standardGuestCount?: number;

  // Location count (1-5)
  @IsInt()
  @Min(1)
  locationCount!: number;

  // Role slots (positions needed, with optional crew assignment)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleSlotDto)
  roleSlots!: RoleSlotDto[];

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

  /**
   * Optional: published DayBlueprintVersion to consume into this
   * package. When provided, Day Designer content (activities, moments,
   * actions) is materialized alongside the preset-based content and
   * stamped with source_day_blueprint_*_id lineage columns. When
   * omitted, the existing preset-based build runs unchanged.
   */
  @IsOptional()
  @IsInt()
  sourceDayBlueprintVersionId?: number;
}
