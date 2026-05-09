import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SelectedActivityDto {
  @IsInt()
  presetId!: number;

  @IsOptional()
  @IsString()
  startTime?: string; // "HH:MM"

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;
}
