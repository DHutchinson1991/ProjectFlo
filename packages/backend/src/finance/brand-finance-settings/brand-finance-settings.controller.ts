import {
  Controller,
  Get,
  Put,
  Body,
  Headers,
  UseGuards,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BrandFinanceSettingsService } from './brand-finance-settings.service';
import { UpsertBrandFinanceSettingsDto } from './dto/upsert-brand-finance-settings.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/brand-finance-settings')
export class BrandFinanceSettingsController {
  constructor(private readonly service: BrandFinanceSettingsService) {}

  @Get()
  get(@Headers('x-brand-context') brandHeader: string) {
    const brandId = parseInt(brandHeader, 10);
    if (!brandId) throw new BadRequestException('x-brand-context header required');
    return this.service.get(brandId);
  }

  @Put()
  upsert(
    @Headers('x-brand-context') brandHeader: string,
    @Body(new ValidationPipe({ transform: true })) dto: UpsertBrandFinanceSettingsDto,
  ) {
    const brandId = parseInt(brandHeader, 10);
    if (!brandId) throw new BadRequestException('x-brand-context header required');
    return this.service.upsert(brandId, dto);
  }
}
