import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WeddingTypesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all active wedding types (system-seeded or brand-specific)
   * Includes activities with moments, locations, and subjects for preview/selection
   */
  async findAll(brandId: number) {
    return this.prisma.weddingType.findMany({
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
              orderBy: { location_sequence_index: 'asc' },
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
   * Get a specific wedding type with all activities, moments, locations, and subjects
   */
  async findOne(id: number, brandId: number) {
    const weddingType = await this.prisma.weddingType.findFirstOrThrow({
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
              orderBy: { location_sequence_index: 'asc' },
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

    return weddingType;
  }

  /**
   * Create a new package from a wedding type template
   * Auto-populates:
   * - Event days based on wedding type
   * - Activities with times calculated from offsets
   * - Moments for each activity
   */
  async createPackageFromTemplate(
    brandId: number,
    weddingTypeId: number,
    packageName: string,
    packageDescription?: string,
  ) {
    // 1. Fetch the wedding type with all activities and moments
    const weddingType = await this.findOne(weddingTypeId, brandId);

    // 2. Create the service package
    const servicePackage = await this.prisma.service_packages.create({
      data: {
        brand_id: brandId,
        wedding_type_id: weddingTypeId,
        name: packageName,
        description: packageDescription || weddingType.description,
        category: 'Wedding',
        is_active: true,
      },
    });

    // 3. Create a default event day (Wedding Day)
    // Get or create the "Wedding Day" event day template for this brand
    let weddingDayTemplate = await this.prisma.eventDayTemplate.findFirst({
      where: {
        brand_id: brandId,
        name: 'Wedding Day',
      },
    });

    if (!weddingDayTemplate) {
      weddingDayTemplate = await this.prisma.eventDayTemplate.create({
        data: {
          brand_id: brandId,
          name: 'Wedding Day',
          description: 'Main wedding day event',
          order_index: 1,
          is_active: true,
        },
      });
    }

    // 4. Link package to event day
    const packageEventDay = await this.prisma.packageEventDay.create({
      data: {
        package_id: servicePackage.id,
        event_day_template_id: weddingDayTemplate.id,
        order_index: 1,
      },
    });

    // 5. Create activities from wedding type activities
    for (const activity of weddingType.activities) {
      const calculatedStartTime = this.calculateTimeFromOffset(
        weddingType.event_start_time,
        activity.start_time_offset_minutes,
      );

      const packageActivity = await this.prisma.packageActivity.create({
        data: {
          package_id: servicePackage.id,
          package_event_day_id: packageEventDay.id,
          name: activity.name,
          description: activity.description,
          color: activity.color,
          icon: activity.icon,
          start_time: calculatedStartTime,
          duration_minutes: activity.duration_minutes,
          order_index: activity.order_index,
        },
      });

      // 6. Create moments for this activity
      for (const moment of activity.moments) {
        await this.prisma.packageActivityMoment.create({
          data: {
            package_activity_id: packageActivity.id,
            name: moment.name,
            order_index: moment.order_index,
            duration_seconds: moment.duration_seconds,
            is_required: moment.is_key_moment, // Key moments are required
            notes: `Auto-populated from ${weddingType.name} template`,
          },
        });
      }
    }

    // 7. Return the created package with relationships
    return this.prisma.service_packages.findUniqueOrThrow({
      where: { id: servicePackage.id },
      include: {
        wedding_type: {
          include: {
            activities: {
              include: {
                moments: true,
              },
            },
          },
        },
        package_event_days: {
          include: {
            activities: {
              include: {
                moments: true,
              },
            },
            event_day: true,
          },
        },
      },
    });
  }

  /**
   * Calculate actual time from offset minutes
   * e.g., if start_time is "14:00" and offset is 120 (2 hours), returns "16:00"
   */
  private calculateTimeFromOffset(startTime: string, offsetMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + offsetMinutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  }

  /**
   * Get system-seeded wedding types (available to all brands)
   */
  async findSystemSeeded() {
    return this.prisma.weddingType.findMany({
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
              orderBy: { location_sequence_index: 'asc' },
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
    return this.prisma.weddingType.findMany({
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
              orderBy: { location_sequence_index: 'asc' },
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
