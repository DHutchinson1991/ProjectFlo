import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDiscoveryQuestionnaireQuestionDto } from './create-discovery-questionnaire-question.dto';

export class UpdateDiscoveryQuestionnaireTemplateDto {
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsString() description?: string;
    @IsOptional() @IsBoolean() is_active?: boolean;
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateDiscoveryQuestionnaireQuestionDto)
    questions?: CreateDiscoveryQuestionnaireQuestionDto[];
}
