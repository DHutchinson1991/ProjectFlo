import { IsNumber, IsEnum } from 'class-validator';

export class AddTemplateItemDto {
  @IsNumber()
  equipment_id: number = undefined as unknown as number;

  @IsEnum(['CAMERA', 'AUDIO'])
  slot_type: 'CAMERA' | 'AUDIO' = undefined as unknown as 'CAMERA' | 'AUDIO';

  @IsNumber()
  slot_index: number = undefined as unknown as number;
}
