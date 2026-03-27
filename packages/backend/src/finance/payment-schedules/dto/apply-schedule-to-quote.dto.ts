import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ApplyScheduleToQuoteDto {
  @Type(() => Number)
  @IsNumber()
  template_id: number;

  @IsString()
  booking_date: string;

  @IsString()
  event_date: string;

  @Type(() => Number)
  @IsNumber()
  total_amount: number;
}