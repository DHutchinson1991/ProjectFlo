import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentBracketDto {
  @IsInt()
  job_role_id: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  display_name?: string;

  @IsInt()
  @Min(1)
  level: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  hourly_rate: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  day_rate?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  overtime_rate?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdatePaymentBracketDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  display_name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  level?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  hourly_rate?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  day_rate?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  overtime_rate?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class AssignBracketDto {
  @IsInt()
  contributor_id: number;

  @IsInt()
  job_role_id: number;

  @IsInt()
  payment_bracket_id: number;
}
