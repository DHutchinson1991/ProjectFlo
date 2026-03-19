import { IsOptional, IsEnum, IsNumber, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum TaskStatus {
    To_Do = 'To_Do',
    Ready_to_Start = 'Ready_to_Start',
    In_Progress = 'In_Progress',
    Completed = 'Completed',
    Archived = 'Archived',
}

export class UpdateInquiryTaskDto {
    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @IsOptional()
    @IsDateString()
    due_date?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    order_index?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    assigned_to_id?: number | null;
}

export class ToggleInquiryTaskDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    completed_by_id?: number;
}

export class ToggleInquirySubtaskDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    completed_by_id?: number;
}
