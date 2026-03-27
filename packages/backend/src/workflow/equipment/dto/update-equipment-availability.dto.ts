import { IsOptional, IsBoolean, IsDateString, IsString, IsInt, IsEnum } from 'class-validator';
import { equipment_availability_status } from '@prisma/client';

export class UpdateEquipmentAvailabilityDto {
    @IsDateString()
    @IsOptional()
    start_date?: string;

    @IsDateString()
    @IsOptional()
    end_date?: string;

    @IsBoolean()
    @IsOptional()
    all_day?: boolean;

    @IsEnum(equipment_availability_status)
    @IsOptional()
    status?: equipment_availability_status;

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsInt()
    @IsOptional()
    project_id?: number;

    @IsInt()
    @IsOptional()
    booked_by_id?: number;

    @IsInt()
    @IsOptional()
    client_id?: number;

    @IsString()
    @IsOptional()
    booking_notes?: string;

    @IsString()
    @IsOptional()
    internal_notes?: string;

    @IsString()
    @IsOptional()
    recurring_rule?: string;

    @IsDateString()
    @IsOptional()
    recurring_until?: string;
}
