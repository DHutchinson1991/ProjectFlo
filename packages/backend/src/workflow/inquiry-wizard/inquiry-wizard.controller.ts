import {
    Body,
    Controller,
    Get,
    Headers,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    Query,
    UseGuards,
    Logger,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateInquiryWizardTemplateDto } from './dto/create-inquiry-wizard-template.dto';
import { UpdateInquiryWizardTemplateDto } from './dto/update-inquiry-wizard-template.dto';
import { CreateInquiryWizardSubmissionDto } from './dto/create-inquiry-wizard-submission.dto';
import { ReviewIwSubmissionDto } from './dto/review-iw-submission.dto';
import { ListIwSubmissionsQueryDto } from './dto/list-iw-submissions-query.dto';
import { InquiryWizardTemplateService } from './services/inquiry-wizard-template.service';
import { InquiryWizardSubmissionService } from './services/inquiry-wizard-submission.service';
import { InquiryWizardConflictService } from './services/inquiry-wizard-conflict.service';

@Controller('api/inquiry-wizard')
@UseGuards(AuthGuard('jwt'))
export class InquiryWizardController {
    private readonly logger = new Logger(InquiryWizardController.name);

    constructor(
        private readonly templateService: InquiryWizardTemplateService,
        private readonly submissionService: InquiryWizardSubmissionService,
        private readonly conflictService: InquiryWizardConflictService,
    ) {}

    @Get('templates')
    listTemplates(@Headers('x-brand-context') brandId: string) {
        const brandIdNum = Number(brandId);
        return this.templateService.listTemplates(Number.isNaN(brandIdNum) ? 0 : brandIdNum);
    }

    @Get('templates/active')
    getActiveTemplate(@Headers('x-brand-context') brandId: string) {
        const brandIdNum = Number(brandId);
        this.logger.log(`Fetching active template for brandId: ${brandIdNum || 'none'}`);
        return this.templateService.getActiveTemplate(Number.isNaN(brandIdNum) ? undefined : brandIdNum);
    }

    @Get('templates/:id')
    getTemplate(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.templateService.getTemplateById(id, Number(brandId));
    }

    @Post('templates')
    createTemplate(
        @Body(new ValidationPipe({ transform: true })) payload: CreateInquiryWizardTemplateDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.templateService.createTemplate(payload, Number(brandId));
    }

    @Put('templates/:id')
    updateTemplate(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) payload: UpdateInquiryWizardTemplateDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.templateService.updateTemplate(id, payload, Number(brandId));
    }

    @Get('submissions')
    listSubmissions(
        @Headers('x-brand-context') brandId: string,
        @Query(new ValidationPipe({ transform: true })) query: ListIwSubmissionsQueryDto,
    ) {
        const brandIdNum = Number(brandId);
        return this.submissionService.listSubmissions(
            Number.isNaN(brandIdNum) ? undefined : brandIdNum,
            query.inquiryId,
        );
    }

    @Get('submissions/:id')
    getSubmission(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.submissionService.getSubmissionById(id, Number(brandId));
    }

    @Post('submissions')
    createSubmission(
        @Body(new ValidationPipe({ transform: true })) payload: CreateInquiryWizardSubmissionDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.submissionService.createSubmission(payload, Number(brandId));
    }

    @Post('submissions/:id/convert')
    convertSubmission(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.submissionService.convertSubmission(id, Number(brandId));
    }

    @Get('submissions/:id/conflict-check')
    checkDateConflicts(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.conflictService.checkDateConflicts(id, Number(brandId));
    }

    @Get('submissions/:id/crew-conflict-check')
    checkCrewConflicts(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.conflictService.checkCrewConflicts(id, Number(brandId));
    }

    @Patch('submissions/:id/review')
    reviewSubmission(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
        @Body(new ValidationPipe({ transform: true })) body: ReviewIwSubmissionDto,
    ) {
        return this.submissionService.reviewSubmission(id, Number(brandId), body);
    }

    @Post('templates/:id/share-token')
    generateShareToken(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.templateService.generateShareToken(id, Number(brandId)).then(
            (share_token) => ({ share_token }),
        );
    }
}
