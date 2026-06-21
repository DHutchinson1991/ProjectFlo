import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SelectedActivityDto } from './selected-activity.dto';
import { CustomActivityDto } from './custom-activity.dto';
import { MomentKeyOverrideDto } from './moment-key-override.dto';
import { CrewAssignmentDto } from './crew-assignment.dto';
import { EquipmentSlotDto } from './equipment-slot.dto';
import { RoleSlotDto } from './role-slot.dto';
import { BlueprintDayMappingDto } from './blueprint-day-mapping.dto';
import { ScaffoldPackageDayDto } from './scaffold-package-day.dto';

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
  @Min(1)
  standardGuestCount?: number;

  // Location count (1-5)
  @IsInt()
  @Min(1)
  @Max(5)
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

  /**
   * When consuming a Day Blueprint, only materialize these
   * DayBlueprintActivity ids. Omit to include every activity on the
   * version (legacy behavior).
   */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  selectedDayBlueprintActivityIds?: number[];

  /**
   * When consuming a Day Blueprint with multiple days, maps each
   * DayBlueprintDay to a PackageTemplateDay row on the selected template.
   * Omitted for single-day auto 1:1 pairing by order_index.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlueprintDayMappingDto)
  blueprintDayMappings?: BlueprintDayMappingDto[];

  /**
   * When the wizard skips preset activities, scaffold empty package event days
   * by name. Activities and moments are added on the package edit page.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScaffoldPackageDayDto)
  scaffoldPackageDays?: ScaffoldPackageDayDto[];
}
