import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    ParseIntPipe,
    ValidationPipe,
} from '@nestjs/common';
import { InquiryWizardTemplateService } from './services/inquiry-wizard-template.service';
import { InquiryWizardSubmissionService } from './services/inquiry-wizard-submission.service';
import { PublicSubmissionDto } from './dto/public-submission.dto';
import { UpdateSubmissionResponsesDto } from './dto/update-submission-responses.dto';

@Controller('api/inquiry-wizard/share')
export class PublicInquiryWizardController {
    constructor(
        private readonly templateService: InquiryWizardTemplateService,
        private readonly submissionService: InquiryWizardSubmissionService,
    ) {}

    @Get(':token')
    async getByShareToken(@Param('token') token: string) {
        return this.templateService.findByShareToken(token);
    }

    @Post(':token/submit')
    async submit(
        @Param('token') token: string,
        @Body(new ValidationPipe({ transform: true })) dto: PublicSubmissionDto,
    ) {
        return this.submissionService.createPublicSubmission(token, dto);
    }

    @Patch('submission/:submissionId/responses')
    async updateResponses(
        @Param('submissionId', ParseIntPipe) submissionId: number,
        @Body(new ValidationPipe({ transform: true })) dto: UpdateSubmissionResponsesDto,
    ) {
        return this.submissionService.updateSubmissionResponses(submissionId, dto.responses);
    }
}
