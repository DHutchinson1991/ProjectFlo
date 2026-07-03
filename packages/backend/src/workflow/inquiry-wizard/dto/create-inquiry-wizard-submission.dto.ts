import { IsBoolean, IsInt, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InquiryWizardSubmissionContactDto } from './inquiry-wizard-submission-contact.dto';
import { InquiryWizardSubmissionInquiryDto } from './inquiry-wizard-submission-inquiry.dto';

export class CreateInquiryWizardSubmissionDto {
    @IsInt()
    template_id: number;

    @IsObject()
    responses: Record<string, unknown>;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsBoolean()
    create_inquiry?: boolean;

    @IsOptional()
    @IsInt()
    inquiry_id?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => InquiryWizardSubmissionContactDto)
    contact?: InquiryWizardSubmissionContactDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => InquiryWizardSubmissionInquiryDto)
    inquiry?: InquiryWizardSubmissionInquiryDto;

    @IsOptional()
    @IsInt()
    selected_package_id?: number;

    @IsOptional()
    @IsInt()
    preferred_payment_schedule_template_id?: number;

    /** DISCOVERY_CALL-stage only: freeform notes captured during the call. */
    @IsOptional()
    @IsString()
    call_notes?: string;

    /** DISCOVERY_CALL-stage only: full call transcript, e.g. from an AI note-taker. */
    @IsOptional()
    @IsString()
    transcript?: string;

    /** DISCOVERY_CALL-stage only: structured sentiment/analysis output. */
    @IsOptional()
    @IsObject()
    sentiment?: Record<string, unknown>;

    /** DISCOVERY_CALL-stage only: call length in seconds. */
    @IsOptional()
    @IsInt()
    call_duration_seconds?: number;
}
