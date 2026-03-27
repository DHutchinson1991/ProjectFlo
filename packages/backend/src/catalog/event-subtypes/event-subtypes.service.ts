import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';

@Injectable()
export class EventSubtypesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all active event subtypes (system-seeded or brand-specific)
   * Includes activities with moments, locations, and subjects for preview/selection
   */
  async findAll(brandId: number) {
    return this.prisma.eventSubtype.findMany({
      where: {
        is_active: true,
        OR: [
          { brand_id: null }, // System-seeded
          { brand_id: brandId }, // Brand-specific overrides
        ],
      },
      include: {
        locations: {
          orderBy: { order_index: 'asc' },
        },
        subjects: {
          orderBy: { order_index: 'asc' },
        },
        activities: {
          orderBy: { order_index: 'asc' },
          include: {
            moments: {
              orderBy: { order_index: 'asc' },
            },
            activity_locations: {
              include: {
                wedding_type_location: true,
              },
            },
            activity_subjects: {
              include: {
                wedding_type_subject: true,
              },
            },
          },
        },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  /**
   * Get a specific event subtype with all activities, moments, locations, and subjects
   */
  async findOne(id: number, brandId: number) {
    const eventSubtype = await this.prisma.eventSubtype.findFirstOrThrow({
      where: {
        id,
        OR: [
          { brand_id: null }, // System-seeded
          { brand_id: brandId }, // Brand-specific
        ],
      },
      include: {
        locations: {
          orderBy: { order_index: 'asc' },
        },
        subjects: {
          orderBy: { order_index: 'asc' },
        },
        activities: {
          orderBy: { order_index: 'asc' },
          include: {
            moments: {
              orderBy: { order_index: 'asc' },
            },
            activity_locations: {
              include: {
                wedding_type_location: true,
              },
            },
            activity_subjects: {
              include: {
                wedding_type_subject: true,
              },
            },
          },
        },
      },
    });

    return eventSubtype;
  }

  /**
   * Get system-seeded wedding types (available to all brands)
   */
  async findSystemSeeded() {
    return this.prisma.eventSubtype.findMany({
      where: {
        is_system_seeded: true,
        is_active: true,
      },
      include: {
        locations: {
          orderBy: { order_index: 'asc' },
        },
        subjects: {
          orderBy: { order_index: 'asc' },
        },
        activities: {
          orderBy: { order_index: 'asc' },
          include: {
            moments: {
              orderBy: { order_index: 'asc' },
            },
            activity_locations: {
              include: {
                wedding_type_location: true,
              },
            },
            activity_subjects: {
              include: {
                wedding_type_subject: true,
              },
            },
          },
        },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  /**
   * Get brand-specific wedding type overrides
   */
  async findBrandSpecific(brandId: number) {
    return this.prisma.eventSubtype.findMany({
      where: {
        brand_id: brandId,
      },
      include: {
        locations: {
          orderBy: { order_index: 'asc' },
        },
        subjects: {
          orderBy: { order_index: 'asc' },
        },
        activities: {
          orderBy: { order_index: 'asc' },
          include: {
            moments: {
              orderBy: { order_index: 'asc' },
            },
            activity_locations: {
              include: {
                wedding_type_location: true,
              },
            },
            activity_subjects: {
              include: {
                wedding_type_subject: true,
              },
            },
          },
        },
      },
      orderBy: { order_index: 'asc' },
    });
  }
}
