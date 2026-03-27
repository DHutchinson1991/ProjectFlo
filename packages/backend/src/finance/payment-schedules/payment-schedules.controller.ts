import {
  Controller, Get, Post, Delete, Patch,
  Body, Param, ParseIntPipe, UseGuards, ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentSchedulesService } from './payment-schedules.service';
import { CreatePaymentScheduleTemplateDto } from './dto/create-payment-schedule-template.dto';
import { UpdatePaymentScheduleTemplateDto } from './dto/update-payment-schedule-template.dto';

// ── Brand-scoped template management ──────────────────────────────────────────
@UseGuards(AuthGuard('jwt'))
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
    @Body(new ValidationPipe({ transform: true })) dto: CreatePaymentScheduleTemplateDto,
  ) {
    return this.svc.createTemplate({ ...dto, brand_id: brandId });
  }

  @Patch(':id')
  update(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdatePaymentScheduleTemplateDto,
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


