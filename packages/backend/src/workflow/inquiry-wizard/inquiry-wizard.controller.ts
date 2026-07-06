import {
    Body,
    Controller,
    Get,
    Headers,
    NotFoundException,
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
import { InquiryWizardStage } from '@prisma/client';
import { CreateInquiryWizardTemplateDto } from './dto/create-inquiry-wizard-template.dto';
import { UpdateInquiryWizardTemplateDto } from './dto/update-inquiry-wizard-template.dto';
import { CreateInquiryWizardSubmissionDto } from './dto/create-inquiry-wizard-submission.dto';
import { UpdateInquiryWizardSubmissionDto } from './dto/update-inquiry-wizard-submission.dto';
import { ReviewIwSubmissionDto } from './dto/review-iw-submission.dto';
import { ListIwSubmissionsQueryDto } from './dto/list-iw-submissions-query.dto';
import { InquiryWizardTemplateService } from './services/inquiry-wizard-template.service';
import { InquiryWizardSubmissionService } from './services/inquiry-wizard-submission.service';
import { InquiryWizardConflictService } from './services/inquiry-wizard-conflict.service';

/** Parses a raw `?stage=` query value into the enum, ignoring anything invalid. */
function parseStage(raw?: string): InquiryWizardStage | undefined {
    if (raw === InquiryWizardStage.INTAKE || raw === InquiryWizardStage.DISCOVERY_CALL) {
        return raw;
    }
    return undefined;
}

function parseRequiredBrandId(brandId: string): number {
    const brandIdNum = parseInt(brandId, 10);
    if (!brandIdNum) throw new NotFoundException('Brand ID is required');
    return brandIdNum;
}

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
    listTemplates(
        @Headers('x-brand-context') brandId: string,
        @Query('stage') stage?: string,
    ) {
        return this.templateService.listTemplates(parseRequiredBrandId(brandId), parseStage(stage));
    }

    @Get('templates/active')
    getActiveTemplate(
        @Headers('x-brand-context') brandId: string,
        @Query('stage') stage?: string,
    ) {
        const brandIdNum = parseRequiredBrandId(brandId);
        this.logger.log(`Fetching active template for brandId: ${brandIdNum}`);
        return this.templateService.getActiveTemplate(
            brandIdNum,
            parseStage(stage) ?? InquiryWizardStage.INTAKE,
        );
    }

    @Post('templates/reset')
    resetActiveTemplate(
        @Headers('x-brand-context') brandId: string,
        @Query('stage') stage?: string,
    ) {
        return this.templateService.resetActiveTemplate(
            parseRequiredBrandId(brandId),
            parseStage(stage) ?? InquiryWizardStage.DISCOVERY_CALL,
        );
    }

    @Get('templates/:id')
    getTemplate(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.templateService.getTemplateById(id, parseRequiredBrandId(brandId));
    }

    @Post('templates')
    createTemplate(
        @Body(new ValidationPipe({ transform: true })) payload: CreateInquiryWizardTemplateDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.templateService.createTemplate(payload, parseRequiredBrandId(brandId));
    }

    @Put('templates/:id')
    updateTemplate(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) payload: UpdateInquiryWizardTemplateDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.templateService.updateTemplate(id, payload, parseRequiredBrandId(brandId));
    }

    @Get('submissions')
    listSubmissions(
        @Headers('x-brand-context') brandId: string,
        @Query(new ValidationPipe({ transform: true })) query: ListIwSubmissionsQueryDto,
    ) {
        return this.submissionService.listSubmissions(
            parseRequiredBrandId(brandId),
            query.inquiryId,
            query.stage,
        );
    }

    @Get('submissions/by-inquiry/:inquiryId')
    getSubmissionByInquiry(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Headers('x-brand-context') brandId: string,
        @Query('stage') stage?: string,
    ) {
        return this.submissionService.getSubmissionByInquiryId(
            inquiryId,
            parseRequiredBrandId(brandId),
            parseStage(stage),
        );
    }

    @Get('submissions/:id')
    getSubmission(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.submissionService.getSubmissionById(id, parseRequiredBrandId(brandId));
    }

    @Post('submissions')
    createSubmission(
        @Body(new ValidationPipe({ transform: true })) payload: CreateInquiryWizardSubmissionDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.submissionService.createSubmission(payload, parseRequiredBrandId(brandId));
    }

    @Patch('submissions/:id')
    updateSubmission(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) payload: UpdateInquiryWizardSubmissionDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.submissionService.updateSubmission(id, payload, parseRequiredBrandId(brandId));
    }

    @Post('submissions/:id/convert')
    convertSubmission(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.submissionService.convertSubmission(id, parseRequiredBrandId(brandId));
    }

    @Get('submissions/:id/conflict-check')
    checkDateConflicts(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.conflictService.checkDateConflicts(id, parseRequiredBrandId(brandId));
    }

    @Get('submissions/:id/crew-conflict-check')
    checkCrewConflicts(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.conflictService.checkCrewConflicts(id, parseRequiredBrandId(brandId));
    }

    @Patch('submissions/:id/review')
    reviewSubmission(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
        @Body(new ValidationPipe({ transform: true })) body: ReviewIwSubmissionDto,
    ) {
        return this.submissionService.reviewSubmission(id, parseRequiredBrandId(brandId), body);
    }

    @Post('templates/:id/share-token')
    generateShareToken(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.templateService.generateShareToken(id, parseRequiredBrandId(brandId)).then(
            (share_token) => ({ share_token }),
        );
    }
}
