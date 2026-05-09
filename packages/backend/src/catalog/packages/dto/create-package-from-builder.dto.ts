import { IsNumber, IsArray, IsOptional, IsString, ValidateNested, ArrayMinSize, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class FilmPreferenceDto {
  @IsString()
  type!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  activityPresetId?: number;

  @IsOptional()
  @IsString()
  activityName?: string;
}

export class CreatePackageFromBuilderDto {
  @IsNumber()
  @Type(() => Number)
  packageTemplateId!: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  @Type(() => Number)
  selectedActivityPresetIds!: number[];

  @IsNumber()
  @Type(() => Number)
  crewCount!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cameraCount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilmPreferenceDto)
  filmPreferences!: FilmPreferenceDto[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  inquiryId?: number;

  @IsOptional()
  @IsString()
  clientName?: string;

  /**
   * Optional: published DayBlueprintVersion to consume into the new
   * package after the preset-based build completes. See the catalog
   * creator DTO for the full lineage rationale.
   */
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sourceDayBlueprintVersionId?: number;
}
