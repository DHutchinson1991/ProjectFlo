import { IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDayBlueprintDayDto {
  @IsString() @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) default_start_time?: string;
  @IsOptional() @IsInt() @Min(0) default_duration_hours?: number;
  @IsOptional() @IsInt() @Min(0) order_index?: number;
  @IsOptional() @IsInt() source_event_day_id?: number;
}

export class UpdateDayBlueprintDayDto extends PartialType(CreateDayBlueprintDayDto) {}
