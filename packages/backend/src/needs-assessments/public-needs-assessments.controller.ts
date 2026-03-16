import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    NotFoundException,
} from '@nestjs/common';
import { NeedsAssessmentsService } from './needs-assessments.service';
import { IsObject, IsOptional, IsString, IsBoolean, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
    NeedsAssessmentSubmissionContactDto,
    NeedsAssessmentSubmissionInquiryDto,
} from './dto/needs-assessment.dto';

class PublicSubmissionDto {
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
    @IsInt()
    selected_package_id?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => NeedsAssessmentSubmissionContactDto)
    contact?: NeedsAssessmentSubmissionContactDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => NeedsAssessmentSubmissionInquiryDto)
    inquiry?: NeedsAssessmentSubmissionInquiryDto;
}

@Controller('api/needs-assessments/share')
export class PublicNeedsAssessmentsController {
    constructor(private readonly needsAssessmentsService: NeedsAssessmentsService) {}

    @Get(':token')
    async getByShareToken(@Param('token') token: string) {
        if (!token || token.length < 10) {
            throw new NotFoundException('Invalid share token');
        }
        return this.needsAssessmentsService.findByShareToken(token);
    }

    @Post(':token/submit')
    async submit(
        @Param('token') token: string,
        @Body() dto: PublicSubmissionDto,
    ) {
        if (!token || token.length < 10) {
            throw new NotFoundException('Invalid share token');
        }
        return this.needsAssessmentsService.createPublicSubmission(token, dto);
    }
}
