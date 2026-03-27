import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, UseGuards, ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CrewPaymentTemplatesService } from './crew-payment-templates.service';
import { CreateCrewPaymentTemplateDto } from './dto/create-crew-payment-template.dto';
import { UpdateCrewPaymentTemplateDto } from './dto/update-crew-payment-template.dto';

@UseGuards(AuthGuard('jwt'))
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
    @Body(new ValidationPipe({ transform: true })) dto: CreateCrewPaymentTemplateDto,
  ) {
    return this.svc.create({ ...dto, brand_id: brandId });
  }

  @Patch(':id')
  update(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateCrewPaymentTemplateDto,
  ) {
    return this.svc.update(brandId, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.remove(brandId, id);
  }
}
