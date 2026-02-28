import {
    IsArray,
    IsBoolean,
    IsInt,
    IsObject,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NeedsAssessmentQuestionDto {
    @IsInt()
    order_index: number;

    @IsString()
    prompt: string;

    @IsString()
    field_type: string;

    @IsOptional()
    @IsString()
    field_key?: string;

    @IsOptional()
    @IsBoolean()
    required?: boolean;

    @IsOptional()
    @IsObject()
    options?: Record<string, unknown>;

    @IsOptional()
    @IsObject()
    condition_json?: Record<string, unknown>;

    @IsOptional()
    @IsString()
    help_text?: string;

    @IsOptional()
    @IsString()
    category?: string;
}

export class CreateNeedsAssessmentTemplateDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    version?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NeedsAssessmentQuestionDto)
    questions: NeedsAssessmentQuestionDto[];
}

export class UpdateNeedsAssessmentTemplateDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    version?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NeedsAssessmentQuestionDto)
    questions?: NeedsAssessmentQuestionDto[];
}

export class NeedsAssessmentSubmissionContactDto {
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

export class NeedsAssessmentSubmissionInquiryDto {
    @IsOptional()
    @IsString()
    wedding_date?: string;

    @IsOptional()
    @IsString()
    venue_details?: string;

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
}

export class CreateNeedsAssessmentSubmissionDto {
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
    @ValidateNested()
    @Type(() => NeedsAssessmentSubmissionContactDto)
    contact?: NeedsAssessmentSubmissionContactDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => NeedsAssessmentSubmissionInquiryDto)
    inquiry?: NeedsAssessmentSubmissionInquiryDto;
}
