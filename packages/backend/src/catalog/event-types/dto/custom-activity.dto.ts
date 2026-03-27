import { IsString, IsOptional, IsInt, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomMomentDto } from './custom-moment.dto';

export class CustomActivityDto {
  @IsString()
  name!: string;

  @IsInt()
  dayTemplateId!: number; // EventDay.id

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomMomentDto)
  moments!: CustomMomentDto[];
}
