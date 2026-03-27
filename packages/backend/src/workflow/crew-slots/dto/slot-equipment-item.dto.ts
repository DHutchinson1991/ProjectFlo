import { IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class SlotEquipmentItemDto {
  @IsNumber()
  equipment_id: number = undefined as unknown as number;

  @IsOptional()
  @IsBoolean()
  is_primary: boolean = false;
}
