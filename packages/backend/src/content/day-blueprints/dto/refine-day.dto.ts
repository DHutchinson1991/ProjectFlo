import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/**
 * Body for the Simulator's "Refine wedding day" endpoint.
 *
 * The refiner regenerates the whole day with a richer brief composed
 * from the user's wizard answers + a summary of the current state.
 * `focus` lets the LLM emphasise one area on the next pass.
 */
export class RefineDayBlueprintDayDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prompt?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  assumptions?: string[];

  @IsOptional()
  @IsIn(['moments', 'actions', 'placements', 'timing', 'people', 'locations', 'all'])
  focus?: 'moments' | 'actions' | 'placements' | 'timing' | 'people' | 'locations' | 'all';

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(160, { each: true })
  allowed_activity_names?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  expected_activity_count?: number;

  @IsOptional()
  @IsBoolean()
  lock_activity_set?: boolean;
}
