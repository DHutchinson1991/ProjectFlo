import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdatePackageFilmDto {
  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
