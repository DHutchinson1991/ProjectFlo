import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

export interface PackageSubject {
  id: number;
  name: string;
  role: string | null;
  isGroup: boolean;
}

/**
 * Deterministic package/activity context loader for activity planning.
 */
@Injectable()
export class PackageContextService {
  constructor(private readonly prisma: PrismaService) {}

  async loadPackageSubjects(packageId: number): Promise<PackageSubject[]> {
    const daySubjects = await this.prisma.packageDaySubject.findMany({
      where: { package_id: packageId },
      include: { role_template: { select: { role_name: true, is_group: true } } },
    });

    return daySubjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      role: subject.role_template?.role_name ?? null,
      isGroup: subject.role_template?.is_group ?? (subject.count ?? 1) > 1,
    }));
  }

  async loadActivitySubjects(activityId: number): Promise<PackageSubject[]> {
    const assignments = await this.prisma.packageDaySubjectActivity.findMany({
      where: { package_activity_id: activityId },
      include: {
        package_day_subject: {
          include: { role_template: { select: { role_name: true, is_group: true } } },
        },
      },
    });

    return assignments.map((assignment) => ({
      id: assignment.package_day_subject.id,
      name: assignment.package_day_subject.name,
      role: assignment.package_day_subject.role_template?.role_name ?? null,
      isGroup:
        assignment.package_day_subject.role_template?.is_group ??
        (assignment.package_day_subject.count ?? 1) > 1,
    }));
  }

  async loadLocationContext(packageId: number): Promise<string | undefined> {
    const locations = await this.prisma.packageLocationSlot.findMany({
      where: { package_id: packageId },
      include: {
        activity_assignments: { include: { package_activity: { select: { name: true } } } },
      },
    });

    if (locations.length === 0) {
      return undefined;
    }

    return locations
      .map((location) => {
        const activities = location.activity_assignments.map((assignment) => assignment.package_activity.name).join(', ');
        return `Location ${location.location_number}${activities ? ` (used for: ${activities})` : ''}`;
      })
      .join('; ');
  }
}