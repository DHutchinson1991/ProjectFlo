import { PartialType } from "@nestjs/mapped-types";
import { CreateFilmDto, CreateFilmSceneDto } from "./create-film.dto";
import {
  IsString,
  IsOptional,
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

export class UpdateFilmDto extends PartialType(CreateFilmDto) {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(FilmType)
  type?: FilmType;

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
