import { IsArray, IsEnum, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskOrderUpdateDto } from './task-order-update.dto';
import { ProjectPhase } from './task-library-enums.dto';

export class BatchUpdateTaskOrderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TaskOrderUpdateDto)
    tasks: TaskOrderUpdateDto[];

    @IsEnum(ProjectPhase)
    phase: ProjectPhase;

    @IsNumber()
    @Type(() => Number)
    brand_id: number;
}
