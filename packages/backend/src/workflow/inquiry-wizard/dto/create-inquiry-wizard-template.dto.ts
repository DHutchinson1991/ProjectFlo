import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InquiryWizardQuestionDto } from './inquiry-wizard-question.dto';

export class CreateInquiryWizardTemplateDto {
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

    @IsOptional()
    @IsArray()
    steps_config?: Array<Record<string, unknown>>;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InquiryWizardQuestionDto)
    questions: InquiryWizardQuestionDto[];
}
