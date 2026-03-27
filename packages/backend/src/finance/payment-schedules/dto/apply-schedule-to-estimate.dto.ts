import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ApplyScheduleToEstimateDto {
  @Type(() => Number)
  @IsNumber()
  template_id: number;

  @IsString()
  booking_date: string;   // ISO date — when booking was confirmed

  @IsString()
  event_date: string;     // ISO date — the wedding/event date

  @Type(() => Number)
  @IsNumber()
  total_amount: number;
}