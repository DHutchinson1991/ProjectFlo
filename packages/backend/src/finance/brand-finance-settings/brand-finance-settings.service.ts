import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { UpsertBrandFinanceSettingsDto } from './dto/upsert-brand-finance-settings.dto';

@Injectable()
export class BrandFinanceSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(brandId: number) {
    const settings = await this.prisma.brand_finance_settings.findUnique({
      where: { brand_id: brandId },
    });
    if (!settings) {
      // Return defaults without persisting
      return {
        brand_id: brandId,
        onsite_half_day_max_hours: 6,
        onsite_full_day_max_hours: 12,
      };
    }
    return settings;
  }

  async upsert(brandId: number, dto: UpsertBrandFinanceSettingsDto) {
    const brand = await this.prisma.brands.findUnique({ where: { id: brandId }, select: { id: true } });
    if (!brand) throw new NotFoundException(`Brand ${brandId} not found`);

    return this.prisma.brand_finance_settings.upsert({
      where: { brand_id: brandId },
      create: {
        brand_id: brandId,
        onsite_half_day_max_hours: dto.onsite_half_day_max_hours ?? 6,
        onsite_full_day_max_hours: dto.onsite_full_day_max_hours ?? 12,
      },
      update: {
        ...(dto.onsite_half_day_max_hours !== undefined && { onsite_half_day_max_hours: dto.onsite_half_day_max_hours }),
        ...(dto.onsite_full_day_max_hours !== undefined && { onsite_full_day_max_hours: dto.onsite_full_day_max_hours }),
      },
    });
  }
}
