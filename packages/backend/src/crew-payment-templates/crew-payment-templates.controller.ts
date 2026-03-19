import {
  Controller, Get, Post, Put, Delete,
  Body, Param, ParseIntPipe,
} from '@nestjs/common';
import { CrewPaymentTemplatesService } from './crew-payment-templates.service';
import {
  CreateCrewPaymentTemplateDto,
  UpdateCrewPaymentTemplateDto,
} from './dto/crew-payment-template.dto';

@Controller('api/brands/:brandId/crew-payment-templates')
export class CrewPaymentTemplatesController {
  constructor(private readonly svc: CrewPaymentTemplatesService) {}

  @Get()
  findAll(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.svc.findAll(brandId);
  }

  @Get(':id')
  findOne(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.findOne(brandId, id);
  }

  @Post()
  create(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body() dto: CreateCrewPaymentTemplateDto,
  ) {
    return this.svc.create({ ...dto, brand_id: brandId });
  }

  @Put(':id')
  update(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCrewPaymentTemplateDto,
  ) {
    return this.svc.update(brandId, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.delete(brandId, id);
  }
}
