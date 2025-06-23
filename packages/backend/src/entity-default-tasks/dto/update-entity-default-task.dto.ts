import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
} from "class-validator";

export class UpdateEntityDefaultTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  taskName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  taskTemplateId?: number;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}
