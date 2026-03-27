import { IsString, IsEmail, IsOptional, IsDateString, IsEnum, IsInt } from 'class-validator';
import { $Enums } from '@prisma/client';

export class CreateInquiryDto {
    @IsString()
    first_name: string;

    @IsString()
    last_name: string;

    @IsEmail()
    email: string;

    @IsString()
    phone_number: string;

    @IsDateString()
    wedding_date: string;

    @IsEnum($Enums.inquiries_status)
    status: $Enums.inquiries_status;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    lead_source?: string;

    @IsOptional()
    @IsString()
    lead_source_details?: string;

    @IsOptional()
    @IsString()
    guest_count?: string;

    @IsOptional()
    @IsInt()
    selected_package_id?: number;

    @IsOptional()
    @IsInt()
    preferred_payment_schedule_template_id?: number | null;

    @IsOptional()
    @IsInt()
    event_type_id?: number;
}
