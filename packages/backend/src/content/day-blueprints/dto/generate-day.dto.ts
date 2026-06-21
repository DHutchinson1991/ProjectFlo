import { DayBlueprintGenerationMode } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class GenerateDayBlueprintDayDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prompt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  activity_id?: number;

  @IsOptional()
  @IsEnum(DayBlueprintGenerationMode)
  mode?: DayBlueprintGenerationMode;
}
