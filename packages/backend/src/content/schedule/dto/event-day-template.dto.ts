import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export { UpdateEventDayDto } from './update-event-day.dto';

export class CreateEventDayDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

