import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

@Injectable()
export class PackageTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly deepInclude = {
    locations: { orderBy: { order_index: 'asc' as const } },
    subjects: {
      orderBy: { order_index: 'asc' as const },
      include: { subject_role: true },
    },
    days: {
      orderBy: { order_index: 'asc' as const },
      include: {
        event_day_template: {
          include: {
            activity_presets: { orderBy: { order_index: 'asc' as const } },
          },
        },
      },
    },
    activities: {
      orderBy: { order_index: 'asc' as const },
      include: {
        moments: { orderBy: { order_index: 'asc' as const } },
        activity_locations: { include: { package_template_location: true } },
        activity_subjects: { include: { package_template_subject: true } },
      },
    },
  };

  /** System-seeded templates (brand_id null) + brand-specific overrides. */
  findAll(brandId: number) {
    return this.prisma.packageTemplate.findMany({
      where: {
        is_active: true,
        OR: [{ brand_id: null }, { brand_id: brandId }],
      },
      include: this.deepInclude,
      orderBy: { order_index: 'asc' },
    });
  }

  findOne(id: number, brandId: number) {
    return this.prisma.packageTemplate.findFirstOrThrow({
      where: {
        id,
        OR: [{ brand_id: null }, { brand_id: brandId }],
      },
      include: this.deepInclude,
    });
  }

  findSystemSeeded() {
    return this.prisma.packageTemplate.findMany({
      where: { is_system_seeded: true, is_active: true },
      include: this.deepInclude,
      orderBy: { order_index: 'asc' },
    });
  }

  findBrandSpecific(brandId: number) {
    return this.prisma.packageTemplate.findMany({
      where: { brand_id: brandId },
      include: this.deepInclude,
      orderBy: { order_index: 'asc' },
    });
  }
}
