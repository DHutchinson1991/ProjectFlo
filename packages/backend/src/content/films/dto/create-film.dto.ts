import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
} from "class-validator";
import { FilmType, MusicType } from "@prisma/client";
import { Type } from "class-transformer";

export class CreateFilmSceneDto {
  @IsNumber()
  @IsNotEmpty()
  default_editing_style_id: number;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  settings?: Record<string, string | number | boolean>;
}

export class CreateFilmDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(FilmType)
  @IsNotEmpty()
  type: FilmType;

  @IsOptional()
  @IsEnum(MusicType)
  default_music_type?: MusicType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  delivery_timeline?: number;

  @IsOptional()
  @IsBoolean()
  includes_music?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFilmSceneDto)
  scenes?: CreateFilmSceneDto[];
}
