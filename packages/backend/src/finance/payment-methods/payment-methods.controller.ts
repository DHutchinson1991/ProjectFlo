import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/payment-methods')
export class PaymentMethodsController {
  constructor(private readonly service: PaymentMethodsService) {}

  @Get()
  findAll(@Headers('x-brand-context') brandHeader: string) {
    const brandId = this.parseBrandId(brandHeader);
    return this.service.findAll(brandId);
  }

  @Get(':id')
  findOne(
    @Headers('x-brand-context') brandHeader: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const brandId = this.parseBrandId(brandHeader);
    return this.service.findOne(brandId, id);
  }

  @Post()
  create(
    @Headers('x-brand-context') brandHeader: string,
    @Body(new ValidationPipe({ transform: true })) dto: CreatePaymentMethodDto,
  ) {
    const brandId = this.parseBrandId(brandHeader);
    return this.service.create(brandId, dto);
  }

  @Patch(':id')
  update(
    @Headers('x-brand-context') brandHeader: string,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdatePaymentMethodDto,
  ) {
    const brandId = this.parseBrandId(brandHeader);
    return this.service.update(brandId, id, dto);
  }

  @Delete(':id')
  remove(
    @Headers('x-brand-context') brandHeader: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const brandId = this.parseBrandId(brandHeader);
    return this.service.remove(brandId, id);
  }

  @Post('reorder')
  reorder(
    @Headers('x-brand-context') brandHeader: string,
    @Body() body: { ids: number[] },
  ) {
    const brandId = this.parseBrandId(brandHeader);
    return this.service.reorder(brandId, body.ids);
  }

  private parseBrandId(header: string): number {
    const brandId = parseInt(header, 10);
    if (!brandId) throw new BadRequestException('x-brand-context header required');
    return brandId;
  }
}
