import { IsOptional, IsString } from 'class-validator';

export class InquiryWizardSubmissionContactDto {
    @IsOptional()
    @IsString()
    first_name?: string;

    @IsOptional()
    @IsString()
    last_name?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    phone_number?: string;
}
