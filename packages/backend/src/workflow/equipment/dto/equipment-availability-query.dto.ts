import { IsOptional, IsDateString, IsInt, IsEnum } from 'class-validator';
import { equipment_availability_status } from '@prisma/client';

export class EquipmentAvailabilityQueryDto {
    @IsDateString()
    @IsOptional()
    start_date?: string;

    @IsDateString()
    @IsOptional()
    end_date?: string;

    @IsInt()
    @IsOptional()
    equipment_id?: number;

    @IsInt()
    @IsOptional()
    project_id?: number;

    @IsEnum(equipment_availability_status)
    @IsOptional()
    status?: equipment_availability_status;
}
