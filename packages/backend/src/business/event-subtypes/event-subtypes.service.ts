import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
   * Create a new package from an event subtype template
   * Auto-populates:
   * - Event days based on event subtype
   * - Activities with times calculated from offsets
   * - Moments for each activity
   */
  async createPackageFromTemplate(
    brandId: number,
    eventSubtypeId: number,
    packageName: string,
    packageDescription?: string,
  ) {
    // 1. Fetch the event subtype with all activities and moments
    const eventSubtype = await this.findOne(eventSubtypeId, brandId);

    // 1b. Fetch the brand's currency to inherit
    const brand = await this.prisma.brands.findUnique({
      where: { id: brandId },
      select: { currency: true },
    });

    // 2. Create the service package
    const servicePackage = await this.prisma.service_packages.create({
      data: {
        brand_id: brandId,
        wedding_type_id: eventSubtypeId,
        name: packageName,
        description: packageDescription || eventSubtype.description,
        category: 'Wedding',
        currency: brand?.currency || 'USD',
        is_active: true,
      },
    });

    // 3. Create a default event day (Wedding Day)
    // Get or create the "Wedding Day" event day template for this brand
    let weddingDayEventDay = await this.prisma.eventDay.findFirst({
      where: {
        brand_id: brandId,
        name: 'Wedding Day',
      },
    });

    if (!weddingDayEventDay) {
      weddingDayEventDay = await this.prisma.eventDay.create({
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
        event_day_template_id: weddingDayEventDay.id,
        order_index: 1,
      },
    });

    // 5. Create subjects from event subtype subjects (global event day level)
    const subjectMap = new Map<number, number>(); // eventSubtypeSubject.id -> packageSubject.id
    
    for (const subject of eventSubtype.subjects) {
      const packageSubject = await this.prisma.packageDaySubject.create({
        data: {
          package_id: servicePackage.id,
          event_day_template_id: weddingDayEventDay.id,
          name: subject.name,
          category: 'PEOPLE', // All event subtype subjects are people
          order_index: subject.order_index,
          notes: `Auto-populated from ${eventSubtype.name} template`,
        },
      });
      subjectMap.set(subject.id, packageSubject.id);
    }

    // 5b. Create location slots from event subtype locations
    // Each wedding type location becomes a location slot (1-5)
    const locationSlotMap = new Map<number, number>(); // eventSubtypeLocation.id -> locationSlot.id
    
    for (let i = 0; i < eventSubtype.locations.length && i < 5; i++) {
      const locationSlot = await this.prisma.packageLocationSlot.create({
        data: {
          package_id: servicePackage.id,
          event_day_template_id: weddingDayEventDay.id,
          location_number: i + 1, // Slots numbered 1-5
        },
      });
      locationSlotMap.set(eventSubtype.locations[i].id, locationSlot.id);
    }

    // 6. Create activities from event subtype activities
    for (const activity of eventSubtype.activities) {
      const calculatedStartTime = this.calculateTimeFromOffset(
        eventSubtype.event_start_time,
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

      // 6a. Link subjects specifically to this activity
      // Get all subjects that belong to this activity from the template
      for (const activitySubject of activity.activity_subjects) {
        const packageSubjectId = subjectMap.get(activitySubject.wedding_type_subject_id);
        if (packageSubjectId) {
          // Create an assignment linking this subject to this activity
          await this.prisma.packageDaySubjectActivity.create({
            data: {
              package_day_subject_id: packageSubjectId,
              package_activity_id: packageActivity.id,
            },
          });
        }
      }

      // 6b. Link locations specifically to this activity
      // Get all locations that belong to this activity from the template
      for (const activityLocation of activity.activity_locations) {
        const locationSlotId = locationSlotMap.get(activityLocation.wedding_type_location_id);
        if (locationSlotId) {
          // Create an assignment linking this location slot to the activity
          await this.prisma.locationActivityAssignment.create({
            data: {
              package_location_slot_id: locationSlotId,
              package_activity_id: packageActivity.id,
            },
          });
        }
      }

      // 7. Create moments for this activity
      for (const moment of activity.moments) {
        await this.prisma.packageActivityMoment.create({
          data: {
            package_activity_id: packageActivity.id,
            name: moment.name,
            order_index: moment.order_index,
            duration_seconds: moment.duration_seconds,
            is_required: moment.is_key_moment, // Key moments are required
            notes: `Auto-populated from ${eventSubtype.name} template`,
          },
        });
      }
    }

    // 8. Return the created package with relationships
    return this.prisma.service_packages.findUniqueOrThrow({
      where: { id: servicePackage.id },
      include: {
        wedding_type: {
          include: {
            subjects: true,
            locations: true,
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
        package_day_subjects: {
          include: {
            activity_assignments: true,
          },
          orderBy: { order_index: 'asc' },
        },
        package_location_slots: {
          include: {
            activity_assignments: true,
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
