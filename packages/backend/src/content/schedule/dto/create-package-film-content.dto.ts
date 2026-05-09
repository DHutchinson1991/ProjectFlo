import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { AudioSourceType, AudioTrackType, FilmType, MontageStyle } from '@prisma/client';

export class PackageFilmSceneConfigDto {
  @IsInt()
  @Type(() => Number)
  activity_id!: number;

  @IsString()
  @IsNotEmpty()
  mode!: 'REALTIME' | 'MONTAGE';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  montage_duration_seconds?: number;

  @IsOptional()
  @IsEnum(MontageStyle)
  montage_style?: MontageStyle;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  montage_bpm?: number;
}

export class PackageFilmSceneAssignmentMomentIdsDto {
  @IsInt()
  @Type(() => Number)
  activity_id!: number;

  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  moment_ids!: number[];
}

export class PackageFilmSceneAssignmentDto {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  scene_index!: number;

  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  activity_ids!: number[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageFilmSceneAssignmentMomentIdsDto)
  moment_ids_by_activity!: PackageFilmSceneAssignmentMomentIdsDto[];
}

export class PackageFilmAudioConfigDto {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  scene_index!: number;

  @IsOptional()
  @IsEnum(AudioSourceType)
  source_type?: AudioSourceType;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  source_activity_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  source_moment_id?: number;

  @IsEnum(AudioTrackType)
  track_type!: AudioTrackType;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PackageFilmDurationOverrideDto {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  scene_index!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  duration_seconds!: number;
}

export class PackageFilmSceneOrderEntryDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsString()
  @IsNotEmpty()
  mode!: 'REALTIME' | 'MONTAGE';

  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  activity_ids!: number[];

  @IsOptional()
  @IsEnum(MontageStyle)
  style?: MontageStyle;

  @IsBoolean()
  is_combined!: boolean;
}

export class CreatePackageFilmContentDto {
  @IsEnum(FilmType)
  film_type!: FilmType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  film_name?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  montage_preset_id?: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Type(() => Number)
  selected_activity_ids!: number[];

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  structure_template_id?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageFilmSceneConfigDto)
  scene_configs!: PackageFilmSceneConfigDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageFilmSceneAssignmentDto)
  scene_assignments!: PackageFilmSceneAssignmentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageFilmAudioConfigDto)
  audio_configs!: PackageFilmAudioConfigDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageFilmDurationOverrideDto)
  duration_overrides!: PackageFilmDurationOverrideDto[];

  @IsBoolean()
  combine_montage!: boolean;

  @IsOptional()
  @IsEnum(MontageStyle)
  combined_montage_style?: MontageStyle;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  combined_montage_duration?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageFilmSceneOrderEntryDto)
  scene_order!: PackageFilmSceneOrderEntryDto[];
}