import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    Query,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DiscoveryQuestionnaireService } from './discovery-questionnaire.service';
import { DiscoveryQuestionnaireSubmissionsService } from './services/discovery-questionnaire-submissions.service';
import { CreateDiscoveryQuestionnaireSubmissionDto } from './dto/create-discovery-questionnaire-submission.dto';
import { UpdateDiscoveryQuestionnaireSubmissionDto } from './dto/update-discovery-questionnaire-submission.dto';
import { CreateDiscoveryQuestionnaireTemplateDto } from './dto/create-discovery-questionnaire-template.dto';
import { UpdateDiscoveryQuestionnaireTemplateDto } from './dto/update-discovery-questionnaire-template.dto';
import { ListDiscoveryQuestionnaireSubmissionsQueryDto } from './dto/list-discovery-questionnaire-submissions-query.dto';
import { BrandId } from '../../platform/auth/decorators/brand-id.decorator';

@Controller('api/discovery-questionnaire')
@UseGuards(AuthGuard('jwt'))
export class DiscoveryQuestionnaireController {
    constructor(
        private readonly service: DiscoveryQuestionnaireService,
        private readonly submissionsService: DiscoveryQuestionnaireSubmissionsService,
    ) {}

    // ─── Templates ─────────────────────────────────────────────────────────

    @Get('templates')
    listTemplates(@BrandId() brandId: number) {
        return this.service.listTemplates(brandId);
    }

    @Get('templates/active')
    getActiveTemplate(@BrandId() brandId: number) {
        return this.service.getActiveTemplate(brandId);
    }

    @Get('templates/:id')
    getTemplate(
        @Param('id', ParseIntPipe) id: number,
        @BrandId() brandId: number,
    ) {
        return this.service.getTemplateById(id, brandId);
    }

    @Post('templates')
    createTemplate(
        @Body(new ValidationPipe({ transform: true })) payload: CreateDiscoveryQuestionnaireTemplateDto,
        @BrandId() brandId: number,
    ) {
        return this.service.createTemplate(payload, brandId);
    }

    @Put('templates/:id')
    updateTemplate(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) payload: UpdateDiscoveryQuestionnaireTemplateDto,
        @BrandId() brandId: number,
    ) {
        return this.service.updateTemplate(id, payload, brandId);
    }

    // ─── Submissions ────────────────────────────────────────────────────────

    @Get('submissions')
    listSubmissions(
        @BrandId() brandId: number,
        @Query(new ValidationPipe({ transform: true })) query: ListDiscoveryQuestionnaireSubmissionsQueryDto,
    ) {
        return this.submissionsService.listSubmissions(brandId, query.inquiryId);
    }

    @Get('submissions/by-inquiry/:inquiryId')
    getByInquiry(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @BrandId() brandId: number,
    ) {
        return this.submissionsService.getSubmissionByInquiryId(inquiryId, brandId);
    }

    @Get('submissions/:id')
    getSubmission(
        @Param('id', ParseIntPipe) id: number,
        @BrandId() brandId: number,
    ) {
        return this.submissionsService.getSubmissionById(id, brandId);
    }

    @Post('submissions')
    createSubmission(
        @Body(new ValidationPipe({ transform: true })) payload: CreateDiscoveryQuestionnaireSubmissionDto,
        @BrandId() brandId: number,
    ) {
        return this.submissionsService.createSubmission(payload, brandId);
    }

    @Patch('submissions/:id')
    updateSubmission(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) payload: UpdateDiscoveryQuestionnaireSubmissionDto,
        @BrandId() brandId: number,
    ) {
        return this.submissionsService.updateSubmission(id, payload, brandId);
    }
}
