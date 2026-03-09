import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Filter discriminator: exactly one key is set.
 */
export type OwnerFilter =
  | { projectId: number; inquiryId?: never }
  | { inquiryId: number; projectId?: never };

/**
 * ProjectPackageSnapshotService
 *
 * Read-only service for retrieving package snapshot data owned by
 * either a project or an inquiry (dual-owner support).
 * These are the cloned entities — fully independent of the original package.
 */
@Injectable()
export class ProjectPackageSnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Convert OwnerFilter → Prisma where clause fragment.
   */
  private ownerWhere(filter: OwnerFilter) {
    return filter.projectId != null
      ? { project_id: filter.projectId }
      : { inquiry_id: filter.inquiryId };
  }

  /**
   * Human-readable label for log messages / errors.
   */
  private ownerLabel(filter: OwnerFilter) {
    return filter.projectId != null
      ? `Project ${filter.projectId}`
      : `Inquiry ${filter.inquiryId}`;
  }

  /**
   * Get the full package snapshot summary for a project OR inquiry.
   * Returns source package info, event days (with counts), and aggregate stats.
   */
  async getSnapshotSummary(filter: OwnerFilter) {
    const where = this.ownerWhere(filter);
    const label = this.ownerLabel(filter);

    // Fetch source package info from the owner record
    let source_package_id: number | null = null;
    let package_contents_snapshot: unknown = null;
    let source_package: { id: number; name: string; description: string | null } | null = null;
    let owner_id: number;

    if (filter.projectId != null) {
      const project = await this.prisma.projects.findUnique({
        where: { id: filter.projectId },
        select: {
          id: true,
          source_package_id: true,
          package_contents_snapshot: true,
          source_package: {
            select: { id: true, name: true, description: true },
          },
        },
      });
      if (!project) throw new NotFoundException(`${label} not found`);
      owner_id = project.id;
      source_package_id = project.source_package_id;
      package_contents_snapshot = project.package_contents_snapshot;
      source_package = project.source_package;
    } else {
      const inquiry = await this.prisma.inquiries.findUnique({
        where: { id: filter.inquiryId },
        select: {
          id: true,
          source_package_id: true,
          package_contents_snapshot: true,
          source_package_for_inquiry: {
            select: { id: true, name: true, description: true },
          },
        },
      });
      if (!inquiry) throw new NotFoundException(`${label} not found`);
      owner_id = inquiry.id;
      source_package_id = inquiry.source_package_id;
      package_contents_snapshot = inquiry.package_contents_snapshot;
      source_package = inquiry.source_package_for_inquiry;
    }

    // Aggregate counts for quick overview
    const [
      eventDayCount,
      activityCount,
      filmCount,
      operatorCount,
      subjectCount,
      locationSlotCount,
    ] = await Promise.all([
      this.prisma.projectEventDay.count({ where }),
      this.prisma.projectActivity.count({ where }),
      this.prisma.projectFilm.count({ where }),
      this.prisma.projectDayOperator.count({ where }),
      this.prisma.projectEventDaySubject.count({ where }),
      this.prisma.projectLocationSlot.count({ where }),
    ]);

    return {
      owner_id,
      owner_type: filter.projectId != null ? 'project' : 'inquiry',
      source_package_id,
      source_package,
      package_contents_snapshot,
      has_package_data: eventDayCount > 0 || activityCount > 0 || filmCount > 0,
      counts: {
        event_days: eventDayCount,
        activities: activityCount,
        films: filmCount,
        operators: operatorCount,
        subjects: subjectCount,
        location_slots: locationSlotCount,
      },
    };
  }

  /**
   * Get all event days with their activities, operators, subjects, and locations.
   */
  async getEventDays(filter: OwnerFilter) {
    return this.prisma.projectEventDay.findMany({
      where: this.ownerWhere(filter),
      include: {
        event_day_template: true,
        activities: {
          orderBy: { order_index: 'asc' },
          include: {
            moments: { orderBy: { order_index: 'asc' } },
          },
        },
        day_operators: {
          orderBy: { order_index: 'asc' },
          include: {
            contributor: {
              include: {
                contact: {
                  select: { id: true, first_name: true, last_name: true, email: true },
                },
              },
            },
            job_role: {
              select: { id: true, name: true, display_name: true, category: true },
            },
            equipment: {
              include: {
                equipment: {
                  select: {
                    id: true,
                    item_name: true,
                    category: true,
                    type: true,
                    model: true,
                    is_unmanned: true,
                  },
                },
              },
            },
            activity_assignments: {
              include: { project_activity: { select: { id: true, name: true } } },
            },
          },
        },
        subjects: {
          orderBy: { order_index: 'asc' },
          include: {
            role_template: true,
            project_activity: { select: { id: true, name: true } },
            activity_assignments: {
              include: { project_activity: { select: { id: true, name: true } } },
            },
          },
        },
        location_slots: {
          orderBy: { order_index: 'asc' },
          include: {
            location: true,
            project_activity: { select: { id: true, name: true } },
            activity_assignments: {
              include: { project_activity: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  /**
   * Get all activities (across all event days).
   */
  async getActivities(filter: OwnerFilter) {
    return this.prisma.projectActivity.findMany({
      where: this.ownerWhere(filter),
      include: {
        project_event_day: {
          select: { id: true, name: true, date: true },
        },
        package_activity: {
          select: { id: true, name: true },
        },
        moments: { orderBy: { order_index: 'asc' } },
        scene_schedules: {
          include: {
            scene: true,
            project_film: { include: { film: true } },
          },
        },
        operator_assignments: {
          include: {
            project_day_operator: {
              select: { id: true, position_name: true, contributor_id: true },
            },
          },
        },
        subject_assignments: {
          include: {
            project_event_day_subject: {
              select: { id: true, name: true, real_name: true },
            },
          },
        },
        location_assignments: {
          include: {
            project_location_slot: {
              select: { id: true, location_number: true, name: true },
            },
          },
        },
      },
      orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  /**
   * Get all operators (crew slots).
   */
  async getOperators(filter: OwnerFilter) {
    return this.prisma.projectDayOperator.findMany({
      where: this.ownerWhere(filter),
      include: {
        project_event_day: {
          select: { id: true, name: true, date: true },
        },
        project_activity: {
          select: { id: true, name: true },
        },
        contributor: {
          include: {
            contact: {
              select: { id: true, first_name: true, last_name: true, email: true },
            },
            contributor_job_roles: {
              include: {
                job_role: {
                  select: { id: true, name: true, display_name: true },
                },
                payment_bracket: {
                  select: { id: true, name: true, display_name: true, level: true, hourly_rate: true, day_rate: true },
                },
              },
            },
          },
        },
        job_role: {
          select: { id: true, name: true, display_name: true, category: true },
        },
        equipment: {
          include: {
            equipment: {
              select: {
                id: true,
                item_name: true,
                category: true,
                type: true,
                model: true,
                is_unmanned: true,
                is_active: true,
              },
            },
          },
        },
        activity_assignments: {
          include: { project_activity: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  /**
   * Get all subjects.
   */
  async getSubjects(filter: OwnerFilter) {
    return this.prisma.projectEventDaySubject.findMany({
      where: this.ownerWhere(filter),
      include: {
        project_event_day: {
          select: { id: true, name: true, date: true },
        },
        project_activity: {
          select: { id: true, name: true },
        },
        role_template: {
          include: { subject_type: true },
        },
        activity_assignments: {
          include: { project_activity: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  /**
   * Get all location slots.
   */
  async getLocationSlots(filter: OwnerFilter) {
    return this.prisma.projectLocationSlot.findMany({
      where: this.ownerWhere(filter),
      include: {
        project_event_day: {
          select: { id: true, name: true, date: true },
        },
        project_activity: {
          select: { id: true, name: true },
        },
        location: true,
        activity_assignments: {
          include: { project_activity: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  /**
   * Get all films with scene schedules.
   */
  async getFilms(filter: OwnerFilter) {
    return this.prisma.projectFilm.findMany({
      where: this.ownerWhere(filter),
      include: {
        film: {
          include: {
            scenes: {
              orderBy: { order_index: 'asc' },
              include: {
                moments: { orderBy: { order_index: 'asc' } },
                beats: { orderBy: { order_index: 'asc' } },
              },
            },
          },
        },
        package_film: {
          select: { id: true, package_id: true },
        },
        scene_schedules: {
          include: {
            project_event_day: { select: { id: true, name: true } },
            project_activity: { select: { id: true, name: true } },
            scene: true,
          },
          orderBy: { order_index: 'asc' },
        },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  /**
   * Get moments for a specific activity.
   */
  async getActivityMoments(filter: OwnerFilter, activityId: number) {
    const where = this.ownerWhere(filter);
    const activity = await this.prisma.projectActivity.findFirst({
      where: { id: activityId, ...where },
    });
    if (!activity) throw new NotFoundException(`Activity ${activityId} not found for ${this.ownerLabel(filter)}`);

    return this.prisma.projectActivityMoment.findMany({
      where: { project_activity_id: activityId, ...where },
      orderBy: { order_index: 'asc' },
    });
  }
}
