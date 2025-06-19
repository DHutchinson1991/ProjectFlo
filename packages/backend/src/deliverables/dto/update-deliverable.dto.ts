import { PartialType } from '@nestjs/mapped-types';
import { CreateDeliverableDto, CreateDeliverableComponentDto } from './create-deliverable.dto';
import { IsString, IsOptional, MaxLength, IsEnum, IsBoolean, IsNumber, Min, IsArray, ValidateNested } from 'class-validator';
import { DeliverableType, MusicType } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateDeliverableDto extends PartialType(CreateDeliverableDto) {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(DeliverableType)
  type?: DeliverableType;

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
  @Type(() => CreateDeliverableComponentDto)
  components?: CreateDeliverableComponentDto[];
}
