import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class TaskOrderUpdateDto {
    @IsNumber()
    @Type(() => Number)
    id: number;

    @IsNumber()
    @Type(() => Number)
    order_index: number;
}
