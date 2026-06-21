import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ScaffoldPackageActivityDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;
}
