import { IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderDto {
  @IsArray()
  @IsInt({ each: true })
  ids!: number[];
}