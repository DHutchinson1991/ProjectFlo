import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
} from "class-validator";
import { MediaType } from "@prisma/client";

export class CreateSceneDto {
  @IsString()
  name: string;

  @IsEnum(MediaType)
  type: MediaType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  complexity_score?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimated_duration?: number;

  @IsOptional()
  @IsString()
  default_editing_style?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  base_task_hours?: number;
}
