import { IsOptional, IsString } from 'class-validator';

export class InstanceFilmStructureQueryDto {
  @IsOptional()
  @IsString()
  activeOnly?: string;
}
