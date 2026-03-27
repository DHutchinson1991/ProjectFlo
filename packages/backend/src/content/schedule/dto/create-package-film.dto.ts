import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePackageFilmDto {
  @IsInt()
  film_id: number;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
