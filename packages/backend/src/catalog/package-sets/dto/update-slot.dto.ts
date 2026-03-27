import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateSlotDto {
  @IsString()
  @IsOptional()
  slot_label?: string;

  @IsNumber()
  @IsOptional()
  service_package_id?: number | null;

  @IsNumber()
  @IsOptional()
  order_index?: number;
}
