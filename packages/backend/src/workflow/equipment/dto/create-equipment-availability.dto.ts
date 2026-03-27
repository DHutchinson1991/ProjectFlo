import { IsNotEmpty, IsOptional, IsBoolean, IsDateString, IsString, IsInt, IsEnum } from 'class-validator';
import { equipment_availability_status } from '@prisma/client';

export class CreateEquipmentAvailabilityDto {
    @IsInt()
    @IsOptional()
    equipment_id?: number;

    @IsDateString()
    @IsNotEmpty()
    start_date: string;

    @IsDateString()
    @IsNotEmpty()
    end_date: string;

    @IsBoolean()
    @IsOptional()
    all_day?: boolean = true;

    @IsEnum(equipment_availability_status)
    @IsOptional()
    status?: equipment_availability_status = equipment_availability_status.AVAILABLE;

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
