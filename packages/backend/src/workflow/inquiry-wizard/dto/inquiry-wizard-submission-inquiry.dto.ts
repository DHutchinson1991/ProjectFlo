import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class InquiryWizardSubmissionInquiryDto {
    @IsOptional()
    @IsString()
    wedding_date?: string;

    @IsOptional()
    @IsString()
    venue_details?: string;

    @IsOptional()
    @IsString()
    guest_count?: string;

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
    @IsInt()
    selected_package_id?: number;

    @IsOptional()
    @IsString()
    venue_address?: string;

    @IsOptional()
    @IsNumber()
    venue_lat?: number;

    @IsOptional()
    @IsNumber()
    venue_lng?: number;
}
