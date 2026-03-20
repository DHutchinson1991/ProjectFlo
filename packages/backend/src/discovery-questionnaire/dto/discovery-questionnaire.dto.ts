import { IsBoolean, IsInt, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDiscoveryQuestionnaireQuestionDto {
    @IsInt() order_index: number;
    @IsOptional() @IsString() section?: string;
    @IsString() prompt: string;
    @IsOptional() @IsString() script_hint?: string;
    @IsString() field_type: string;
    @IsOptional() @IsString() field_key?: string;
    @IsOptional() @IsBoolean() required?: boolean;
    @IsOptional() options?: Record<string, unknown>;
    @IsOptional() @IsString() visibility?: string;
}

export class CreateDiscoveryQuestionnaireTemplateDto {
    @IsString() name: string;
    @IsOptional() @IsString() description?: string;
    @IsOptional() @IsBoolean() is_active?: boolean;
    @ValidateNested({ each: true })
    @Type(() => CreateDiscoveryQuestionnaireQuestionDto)
    questions: CreateDiscoveryQuestionnaireQuestionDto[];
}

export class UpdateDiscoveryQuestionnaireTemplateDto {
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsString() description?: string;
    @IsOptional() @IsBoolean() is_active?: boolean;
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateDiscoveryQuestionnaireQuestionDto)
    questions?: CreateDiscoveryQuestionnaireQuestionDto[];
}

export class CreateDiscoveryQuestionnaireSubmissionDto {
    @IsInt() template_id: number;
    @IsOptional() @IsInt() inquiry_id?: number;
    @IsObject() responses: Record<string, unknown>;
    @IsOptional() @IsString() call_notes?: string;
    @IsOptional() @IsString() transcript?: string;
    @IsOptional() @IsObject() sentiment?: Record<string, unknown>;
    @IsOptional() @IsInt() call_duration_seconds?: number;
}

export class UpdateDiscoveryQuestionnaireSubmissionDto {
    @IsOptional() @IsObject() responses?: Record<string, unknown>;
    @IsOptional() @IsString() call_notes?: string;
    @IsOptional() @IsString() transcript?: string;
    @IsOptional() @IsObject() sentiment?: Record<string, unknown>;
    @IsOptional() @IsInt() call_duration_seconds?: number;
}
