import { IsString, IsOptional } from 'class-validator';

export class AddSlotDto {
  @IsString()
  @IsOptional()
  slot_label?: string;
}
