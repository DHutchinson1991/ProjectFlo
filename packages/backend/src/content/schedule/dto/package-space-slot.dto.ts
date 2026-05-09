import { IsArray, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { SpaceType } from '@prisma/client';

export class CreatePackageSpaceSlotDto {
  @IsInt()
  event_day_template_id!: number;

  @IsString()
  label!: string; // e.g. 'Ceremony Space', 'Bridal Suite'

  @IsOptional()
  @IsInt()
  location_slot_id?: number; // FK → PackageLocationSlot (assign later)

  @IsOptional()
  @IsInt()
  location_space_id?: number; // FK → LocationSpace (link to venue library space)

  @IsOptional()
  @IsArray()
  @IsEnum(SpaceType, { each: true })
  space_type_tags?: SpaceType[]; // e.g. ['CEREMONY_AREA', 'OUTDOOR_AREA']

  @IsOptional()
  @IsInt()
  preset_id?: number; // FK → FloorPlanPreset (auto-apply objects from this preset)
}

export class UpdatePackageSpaceSlotDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsInt()
  location_slot_id?: number | null; // null = unlink from location slot

  @IsOptional()
  @IsInt()
  location_space_id?: number | null; // null = unlink from venue space

  @IsOptional()
  @IsArray()
  @IsEnum(SpaceType, { each: true })
  space_type_tags?: SpaceType[]; // replaces all existing tags
}
