import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ToggleInquirySubtaskDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    completed_by_id?: number;
}
