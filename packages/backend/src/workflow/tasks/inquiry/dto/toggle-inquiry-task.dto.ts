import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ToggleInquiryTaskDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    completed_by_id?: number;
}
