import {
    IsBoolean,
    IsInt,
    IsObject,
    IsOptional,
    IsString,
} from 'class-validator';

export class InquiryWizardQuestionDto {
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
