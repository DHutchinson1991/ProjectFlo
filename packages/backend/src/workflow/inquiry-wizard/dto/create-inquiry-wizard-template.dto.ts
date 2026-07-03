import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InquiryWizardStage } from '@prisma/client';
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

    /** Defaults to INTAKE. Set to DISCOVERY_CALL for a discovery-call script/notes template. */
    @IsOptional()
    @IsEnum(InquiryWizardStage)
    stage?: InquiryWizardStage;

    @IsOptional()
    @IsArray()
    steps_config?: Array<Record<string, unknown>>;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InquiryWizardQuestionDto)
    questions: InquiryWizardQuestionDto[];
}
