import { DayBlueprintGenerationMode } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDayBlueprintVersionDto {
  @IsOptional() @IsString() @MaxLength(500) change_summary?: string;
  @IsOptional() @IsInt() source_ai_run_id?: number;
  @IsOptional() @IsEnum(DayBlueprintGenerationMode) generation_mode?: DayBlueprintGenerationMode;
  /** Branch from this version; defaults to latest published, else latest version. */
  @IsOptional() @IsInt() source_version_id?: number;
  /** When true, deletes the existing DRAFT before creating a new branched draft. */
  @IsOptional() @IsBoolean() replace_existing_draft?: boolean;
}

export class PublishDayBlueprintVersionDto {
  @IsOptional() @IsString() @MaxLength(500) change_summary?: string;
}
