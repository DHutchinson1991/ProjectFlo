import { IsObject, IsOptional, IsString } from 'class-validator';

export class ReviewIwSubmissionDto {
    @IsOptional()
    @IsString()
    review_notes?: string;

    @IsOptional()
    @IsObject()
    review_checklist_state?: Record<string, unknown>;
}
