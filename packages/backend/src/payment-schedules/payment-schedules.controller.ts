import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, ParseIntPipe,
} from '@nestjs/common';
import { PaymentSchedulesService } from './payment-schedules.service';
import {
  CreatePaymentScheduleTemplateDto,
  UpdatePaymentScheduleTemplateDto,
  ApplyScheduleToEstimateDto,
  ApplyScheduleToQuoteDto,
} from './dto/payment-schedule.dto';

// ── Brand-scoped template management ──────────────────────────────────────────
@Controller('api/brands/:brandId/payment-schedules')
export class PaymentSchedulesController {
  constructor(private readonly svc: PaymentSchedulesService) {}

  @Get()
  findAll(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.svc.findAllTemplates(brandId);
  }

  @Get('default')
  getDefault(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.svc.getDefaultTemplate(brandId);
  }

  @Get(':id')
  findOne(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.findOneTemplate(brandId, id);
  }

  @Post()
  create(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body() dto: CreatePaymentScheduleTemplateDto,
  ) {
    return this.svc.createTemplate({ ...dto, brand_id: brandId });
  }

  @Put(':id')
  update(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentScheduleTemplateDto,
  ) {
    return this.svc.updateTemplate(brandId, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.deleteTemplate(brandId, id);
  }
}

// ── Estimate-scoped milestone endpoints ───────────────────────────────────────
@Controller('api/estimates')
export class EstimateMilestonesController {
  constructor(private readonly svc: PaymentSchedulesService) {}

  @Get(':estimateId/milestones')
  getMilestones(@Param('estimateId', ParseIntPipe) estimateId: number) {
    return this.svc.getMilestonesForEstimate(estimateId);
  }

  @Post(':estimateId/apply-schedule')
  applySchedule(
    @Param('estimateId', ParseIntPipe) estimateId: number,
    @Body() dto: ApplyScheduleToEstimateDto,
  ) {
    return this.svc.applyToEstimate(estimateId, dto);
  }

  @Patch('milestones/:milestoneId/status')
  updateStatus(
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
    @Body('status') status: string,
  ) {
    return this.svc.updateMilestoneStatus(milestoneId, status);
  }
}

// ── Quote-scoped milestone endpoints ──────────────────────────────────────────
@Controller('api/quotes')
export class QuoteMilestonesController {
  constructor(private readonly svc: PaymentSchedulesService) {}

  @Get(':quoteId/milestones')
  getMilestones(@Param('quoteId', ParseIntPipe) quoteId: number) {
    return this.svc.getMilestonesForQuote(quoteId);
  }

  @Post(':quoteId/apply-schedule')
  applySchedule(
    @Param('quoteId', ParseIntPipe) quoteId: number,
    @Body() dto: ApplyScheduleToQuoteDto,
  ) {
    return this.svc.applyToQuote(quoteId, dto);
  }

  @Patch('milestones/:milestoneId/status')
  updateStatus(
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
    @Body('status') status: string,
  ) {
    return this.svc.updateQuoteMilestoneStatus(milestoneId, status);
  }
}
