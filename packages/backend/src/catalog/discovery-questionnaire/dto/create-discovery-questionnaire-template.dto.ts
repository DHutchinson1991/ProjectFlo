import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDiscoveryQuestionnaireQuestionDto } from './create-discovery-questionnaire-question.dto';

export class CreateDiscoveryQuestionnaireTemplateDto {
    @IsString() name: string;
    @IsOptional() @IsString() description?: string;
    @IsOptional() @IsBoolean() is_active?: boolean;
    @ValidateNested({ each: true })
    @Type(() => CreateDiscoveryQuestionnaireQuestionDto)
    questions: CreateDiscoveryQuestionnaireQuestionDto[];
}
