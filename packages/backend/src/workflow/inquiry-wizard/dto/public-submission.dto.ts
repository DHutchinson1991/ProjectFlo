import { IsObject, IsOptional, IsString, IsBoolean, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InquiryWizardSubmissionContactDto } from './inquiry-wizard-submission-contact.dto';
import { InquiryWizardSubmissionInquiryDto } from './inquiry-wizard-submission-inquiry.dto';

export class PublicSubmissionDto {
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
    selected_package_id?: number;

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
    preferred_payment_schedule_template_id?: number;
}
