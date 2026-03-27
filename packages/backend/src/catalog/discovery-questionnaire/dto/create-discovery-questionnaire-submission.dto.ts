import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateDiscoveryQuestionnaireSubmissionDto {
    @IsInt() template_id: number;
    @IsOptional() @IsInt() inquiry_id?: number;
    @IsObject() responses: Record<string, unknown>;
    @IsOptional() @IsString() call_notes?: string;
    @IsOptional() @IsString() transcript?: string;
    @IsOptional() @IsObject() sentiment?: Record<string, unknown>;
    @IsOptional() @IsInt() call_duration_seconds?: number;
}
