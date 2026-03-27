import { IsInt, IsOptional } from 'class-validator';

export class CreateProjectFilmDto {
  @IsInt()
  film_id: number;

  @IsOptional()
  @IsInt()
  package_film_id?: number;

  @IsOptional()
  @IsInt()
  order_index?: number;
}
