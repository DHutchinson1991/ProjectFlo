import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * General-purpose submission patch, primarily used for DISCOVERY_CALL-stage
 * submissions (call notes/transcript/sentiment). INTAKE-stage submissions are
 * more commonly updated via the dedicated `/submissions/:id/review` and
 * `/submissions/:id/responses` routes.
 */
export class UpdateInquiryWizardSubmissionDto {
    @IsOptional()
    @IsObject()
    responses?: Record<string, unknown>;

    @IsOptional()
    @IsString()
    call_notes?: string;

    @IsOptional()
    @IsString()
    transcript?: string;

    @IsOptional()
    @IsObject()
    sentiment?: Record<string, unknown>;

    @IsOptional()
    @IsInt()
    call_duration_seconds?: number;
}
