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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NeedsAssessmentsService } from './needs-assessments.service';
import {
    CreateNeedsAssessmentSubmissionDto,
    CreateNeedsAssessmentTemplateDto,
    ReviewNaSubmissionDto,
    UpdateNeedsAssessmentTemplateDto,
} from './dto/needs-assessment.dto';

@Controller('api/needs-assessments')
@UseGuards(AuthGuard('jwt'))
export class NeedsAssessmentsController {
    constructor(private readonly needsAssessmentsService: NeedsAssessmentsService) {}

    @Get('templates')
    listTemplates(@Headers('x-brand-context') brandId: string) {
        const brandIdNum = Number(brandId);
        return this.needsAssessmentsService.listTemplates(Number.isNaN(brandIdNum) ? 0 : brandIdNum);
    }

    @Get('templates/active')
    getActiveTemplate(@Headers('x-brand-context') brandId: string) {
        const brandIdNum = Number(brandId);
        return this.needsAssessmentsService.getActiveTemplate(Number.isNaN(brandIdNum) ? undefined : brandIdNum);
    }

    @Get('templates/:id')
    getTemplate(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.needsAssessmentsService.getTemplateById(id, Number(brandId));
    }

    @Post('templates')
    createTemplate(
        @Body() payload: CreateNeedsAssessmentTemplateDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.needsAssessmentsService.createTemplate(payload, Number(brandId));
    }

    @Put('templates/:id')
    updateTemplate(
        @Param('id', ParseIntPipe) id: number,
        @Body() payload: UpdateNeedsAssessmentTemplateDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.needsAssessmentsService.updateTemplate(id, payload, Number(brandId));
    }

    @Get('submissions')
    listSubmissions(
        @Headers('x-brand-context') brandId: string,
        @Query('inquiryId') inquiryId?: string,
    ) {
        const brandIdNum = Number(brandId);
        return this.needsAssessmentsService.listSubmissions(
            Number.isNaN(brandIdNum) ? undefined : brandIdNum,
            inquiryId ? Number(inquiryId) : undefined,
        );
    }

    @Get('submissions/:id')
    getSubmission(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.needsAssessmentsService.getSubmissionById(id, Number(brandId));
    }

    @Post('submissions')
    createSubmission(
        @Body() payload: CreateNeedsAssessmentSubmissionDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.needsAssessmentsService.createSubmission(payload, Number(brandId));
    }

    @Post('submissions/:id/convert')
    convertSubmission(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.needsAssessmentsService.convertSubmission(id, Number(brandId));
    }

    @Get('submissions/:id/conflict-check')
    checkDateConflicts(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.needsAssessmentsService.checkDateConflicts(id, Number(brandId));
    }

    @Get('submissions/:id/crew-conflict-check')
    checkCrewConflicts(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.needsAssessmentsService.checkCrewConflicts(id, Number(brandId));
    }

    @Patch('submissions/:id/review')
    reviewSubmission(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
        @Body() body: ReviewNaSubmissionDto,
    ) {
        return this.needsAssessmentsService.reviewSubmission(id, Number(brandId), body);
    }

    @Post('templates/:id/share-token')
    generateShareToken(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.needsAssessmentsService.generateShareToken(id, Number(brandId)).then(
            (share_token) => ({ share_token }),
        );
    }
}
