import { IsNumber, IsArray, ArrayNotEmpty } from 'class-validator';

export class ReorderSlotsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayNotEmpty()
  slot_ids: number[] = undefined as unknown as number[];
}
