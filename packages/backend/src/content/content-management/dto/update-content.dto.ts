import { PartialType } from '@nestjs/mapped-types';
import { CreateContentDto, CreateContentComponentDto } from './create-content.dto';
import { IsString, IsOptional, MaxLength, IsEnum, IsBoolean, IsNumber, Min, IsArray, ValidateNested } from 'class-validator';
import { ContentType, MusicType } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateContentDto extends PartialType(CreateContentDto) {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(ContentType)
  type?: ContentType;

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
  @Type(() => CreateContentComponentDto)
  components?: CreateContentComponentDto[];
}
