import { IsOptional, IsNumber, IsString, IsArray, Min, Max } from 'class-validator';

export class UpsertMeetingSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(480)
  duration_minutes?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  available_days?: number[];

  @IsOptional()
  @IsString()
  available_from?: string;

  @IsOptional()
  @IsString()
  available_to?: string;

  @IsOptional()
  @IsString()
  google_meet_link?: string;
}
