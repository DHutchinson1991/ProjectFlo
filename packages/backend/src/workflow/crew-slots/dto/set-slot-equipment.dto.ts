import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SlotEquipmentItemDto } from './slot-equipment-item.dto';

export class SetSlotEquipmentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlotEquipmentItemDto)
  equipment: SlotEquipmentItemDto[] = undefined as unknown as SlotEquipmentItemDto[];
}
