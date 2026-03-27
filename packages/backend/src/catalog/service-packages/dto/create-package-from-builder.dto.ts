import { IsNumber, IsArray, IsOptional, IsString, ValidateNested, ArrayMinSize } from 'class-validator';
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
  eventTypeId!: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  @Type(() => Number)
  selectedActivityPresetIds!: number[];

  @IsNumber()
  @Type(() => Number)
  operatorCount!: number;

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
}
