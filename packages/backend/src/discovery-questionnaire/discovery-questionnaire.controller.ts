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
import { DiscoveryQuestionnaireService } from './discovery-questionnaire.service';
import {
    CreateDiscoveryQuestionnaireSubmissionDto,
    UpdateDiscoveryQuestionnaireSubmissionDto,
    CreateDiscoveryQuestionnaireTemplateDto,
    UpdateDiscoveryQuestionnaireTemplateDto,
} from './dto/discovery-questionnaire.dto';

@Controller('api/discovery-questionnaire')
@UseGuards(AuthGuard('jwt'))
export class DiscoveryQuestionnaireController {
    constructor(private readonly service: DiscoveryQuestionnaireService) {}

    // ─── Templates ─────────────────────────────────────────────────────────

    @Get('templates')
    listTemplates(@Headers('x-brand-context') brandId: string) {
        return this.service.listTemplates(Number(brandId));
    }

    @Get('templates/active')
    getActiveTemplate(@Headers('x-brand-context') brandId: string) {
        return this.service.getActiveTemplate(Number(brandId));
    }

    @Get('templates/:id')
    getTemplate(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.service.getTemplateById(id, Number(brandId));
    }

    @Post('templates')
    createTemplate(
        @Body() payload: CreateDiscoveryQuestionnaireTemplateDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.service.createTemplate(payload, Number(brandId));
    }

    @Put('templates/:id')
    updateTemplate(
        @Param('id', ParseIntPipe) id: number,
        @Body() payload: UpdateDiscoveryQuestionnaireTemplateDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.service.updateTemplate(id, payload, Number(brandId));
    }

    // ─── Submissions ────────────────────────────────────────────────────────

    @Get('submissions')
    listSubmissions(
        @Headers('x-brand-context') brandId: string,
        @Query('inquiryId') inquiryId?: string,
    ) {
        return this.service.listSubmissions(
            Number(brandId),
            inquiryId ? Number(inquiryId) : undefined,
        );
    }

    @Get('submissions/by-inquiry/:inquiryId')
    getByInquiry(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.service.getSubmissionByInquiryId(inquiryId, Number(brandId));
    }

    @Get('submissions/:id')
    getSubmission(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.service.getSubmissionById(id, Number(brandId));
    }

    @Post('submissions')
    createSubmission(
        @Body() payload: CreateDiscoveryQuestionnaireSubmissionDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.service.createSubmission(payload, Number(brandId));
    }

    @Patch('submissions/:id')
    updateSubmission(
        @Param('id', ParseIntPipe) id: number,
        @Body() payload: UpdateDiscoveryQuestionnaireSubmissionDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        return this.service.updateSubmission(id, payload, Number(brandId));
    }
}
