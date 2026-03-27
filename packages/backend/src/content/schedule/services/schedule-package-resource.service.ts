import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
  CreatePackageDaySubjectDto,
  UpdatePackageDaySubjectDto,
  CreatePackageEventDayLocationDto,
  UpdatePackageEventDayLocationDto,
  CreatePackageLocationSlotDto,
} from '../dto';

@Injectable()
export class SchedulePackageResourceService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Package Event Day Subjects ──────────────────────────────────────

  async getPackageEventDaySubjects(packageId: number, eventDayId?: number) {
    return this.prisma.packageDaySubject.findMany({
      where: { package_id: packageId, ...(eventDayId ? { event_day_template_id: eventDayId } : {}) },
      include: { role_template: true, event_day: true, activity_assignments: { include: { package_activity: true } } },
      orderBy: [{ event_day_template_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  async createPackageEventDaySubject(packageId: number, dto: CreatePackageDaySubjectDto) {
    const existing = await this.prisma.packageDaySubject.findMany({
      where: { package_id: packageId, event_day_template_id: dto.event_day_template_id },
      orderBy: { order_index: 'desc' },
      take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    return this.prisma.packageDaySubject.create({
      data: {
        package_id: packageId, event_day_template_id: dto.event_day_template_id,
        role_template_id: dto.role_template_id, name: dto.name, count: dto.count,
        notes: dto.notes, order_index: dto.order_index ?? nextOrder,
      },
      include: { role_template: true, event_day: true, activity_assignments: { include: { package_activity: true } } },
    });
  }

  async updatePackageEventDaySubject(subjectId: number, dto: UpdatePackageDaySubjectDto) {
    const record = await this.prisma.packageDaySubject.findUnique({ where: { id: subjectId } });
    if (!record) throw new NotFoundException('Package event day subject not found');
    return this.prisma.packageDaySubject.update({
      where: { id: subjectId }, data: dto,
      include: { role_template: true, event_day: true, activity_assignments: { include: { package_activity: true } } },
    });
  }

  async deletePackageEventDaySubject(subjectId: number) {
    const record = await this.prisma.packageDaySubject.findUnique({ where: { id: subjectId } });
    if (!record) throw new NotFoundException('Package event day subject not found');
    return this.prisma.packageDaySubject.delete({ where: { id: subjectId } });
  }

  // ─── Subject Activity Assignments ────────────────────────────────────

  async assignSubjectToActivity(subjectId: number, activityId: number) {
    const existing = await this.prisma.packageDaySubject.findUnique({ where: { id: subjectId } });
    if (!existing) throw new NotFoundException('Package event day subject not found');

    try {
      await this.prisma.packageDaySubjectActivity.create({
        data: { package_day_subject_id: subjectId, package_activity_id: activityId },
      });
    } catch { /* Already assigned — ignore */ }

    return this.prisma.packageDaySubject.findUnique({
      where: { id: subjectId },
      include: { role_template: true, event_day: true, activity_assignments: { include: { package_activity: true } } },
    });
  }

  async unassignSubjectFromActivity(subjectId: number, activityId: number) {
    const existing = await this.prisma.packageDaySubject.findUnique({ where: { id: subjectId } });
    if (!existing) throw new NotFoundException('Package event day subject not found');

    await this.prisma.packageDaySubjectActivity.deleteMany({
      where: { package_day_subject_id: subjectId, package_activity_id: activityId },
    });
    return this.prisma.packageDaySubject.findUnique({
      where: { id: subjectId },
      include: { role_template: true, event_day: true, activity_assignments: { include: { package_activity: true } } },
    });
  }

  // ─── Package Event Day Locations ─────────────────────────────────────

  async getPackageEventDayLocations(packageId: number, eventDayId?: number) {
    return this.prisma.packageEventDayLocation.findMany({
      where: { package_id: packageId, ...(eventDayId ? { event_day_template_id: eventDayId } : {}) },
      include: { location: true, package_activity: true, event_day: true },
      orderBy: [{ event_day_template_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  async createPackageEventDayLocation(packageId: number, dto: CreatePackageEventDayLocationDto) {
    const existing = await this.prisma.packageEventDayLocation.findMany({
      where: { package_id: packageId, event_day_template_id: dto.event_day_template_id },
      orderBy: { order_index: 'desc' },
      take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    return this.prisma.packageEventDayLocation.create({
      data: {
        package_id: packageId, event_day_template_id: dto.event_day_template_id,
        package_activity_id: dto.package_activity_id, location_id: dto.location_id,
        notes: dto.notes, order_index: dto.order_index ?? nextOrder,
      },
      include: { location: true, package_activity: true, event_day: true },
    });
  }

  async updatePackageEventDayLocation(locationId: number, dto: UpdatePackageEventDayLocationDto) {
    const record = await this.prisma.packageEventDayLocation.findUnique({ where: { id: locationId } });
    if (!record) throw new NotFoundException('Package event day location not found');
    return this.prisma.packageEventDayLocation.update({
      where: { id: locationId }, data: dto,
      include: { location: true, package_activity: true, event_day: true },
    });
  }

  async deletePackageEventDayLocation(locationId: number) {
    const record = await this.prisma.packageEventDayLocation.findUnique({ where: { id: locationId } });
    if (!record) throw new NotFoundException('Package event day location not found');
    return this.prisma.packageEventDayLocation.delete({ where: { id: locationId } });
  }

  // ─── Package Location Slots ──────────────────────────────────────────

  private readonly locationSlotInclude = {
    event_day: true,
    activity_assignments: { include: { package_activity: true } },
  };

  async getPackageLocationSlots(packageId: number, eventDayId?: number) {
    return this.prisma.packageLocationSlot.findMany({
      where: { package_id: packageId, ...(eventDayId ? { event_day_template_id: eventDayId } : {}) },
      include: this.locationSlotInclude,
      orderBy: { location_number: 'asc' },
    });
  }

  async createPackageLocationSlot(packageId: number, dto: CreatePackageLocationSlotDto) {
    let locationNumber = dto.location_number;

    if (!locationNumber) {
      const existing = await this.prisma.packageLocationSlot.findMany({
        where: { package_id: packageId, event_day_template_id: dto.event_day_template_id },
        select: { location_number: true },
        orderBy: { location_number: 'asc' },
      });
      const usedNumbers = new Set(existing.map((s) => s.location_number));
      for (let i = 1; i <= 5; i++) {
        if (!usedNumbers.has(i)) { locationNumber = i; break; }
      }
      if (!locationNumber) throw new BadRequestException('Maximum of 5 location slots per event day');
    }

    if (locationNumber < 1 || locationNumber > 5) {
      throw new BadRequestException('Location number must be between 1 and 5');
    }

    try {
      return await this.prisma.packageLocationSlot.create({
        data: { package_id: packageId, event_day_template_id: dto.event_day_template_id, location_number: locationNumber },
        include: this.locationSlotInclude,
      });
    } catch {
      throw new BadRequestException(`Location ${locationNumber} already exists for this event day`);
    }
  }

  async deletePackageLocationSlot(slotId: number) {
    const record = await this.prisma.packageLocationSlot.findUnique({ where: { id: slotId } });
    if (!record) throw new NotFoundException('Package location slot not found');
    return this.prisma.packageLocationSlot.delete({ where: { id: slotId } });
  }

  async assignLocationSlotToActivity(slotId: number, activityId: number) {
    const existing = await this.prisma.packageLocationSlot.findUnique({ where: { id: slotId } });
    if (!existing) throw new NotFoundException('Package location slot not found');

    try {
      await this.prisma.locationActivityAssignment.create({
        data: { package_location_slot_id: slotId, package_activity_id: activityId },
      });
    } catch { /* Already assigned — ignore */ }

    return this.prisma.packageLocationSlot.findUnique({ where: { id: slotId }, include: this.locationSlotInclude });
  }

  async unassignLocationSlotFromActivity(slotId: number, activityId: number) {
    const existing = await this.prisma.packageLocationSlot.findUnique({ where: { id: slotId } });
    if (!existing) throw new NotFoundException('Package location slot not found');

    await this.prisma.locationActivityAssignment.deleteMany({
      where: { package_location_slot_id: slotId, package_activity_id: activityId },
    });
    return this.prisma.packageLocationSlot.findUnique({ where: { id: slotId }, include: this.locationSlotInclude });
  }
}
