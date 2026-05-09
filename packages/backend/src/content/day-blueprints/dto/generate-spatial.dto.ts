import { IsInt, IsOptional, Min } from 'class-validator';

export class GenerateDayBlueprintSpatialDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  activity_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  moment_id?: number;
}
