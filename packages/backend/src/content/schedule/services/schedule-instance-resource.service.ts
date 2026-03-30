import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
  InstanceOwner,
  CreateInstanceEventDaySubjectDto,
  UpdateInstanceEventDaySubjectDto,
  CreateInstanceLocationSlotDto,
  CreateProjectFilmDto,
} from '../dto';

@Injectable()
export class ScheduleInstanceResourceService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Instance Event Day Subjects ─────────────────────────────────────

  private readonly instanceSubjectInclude = {
    role_template: true,
    project_event_day: true,
    contact: { select: { id: true, first_name: true, last_name: true, email: true } },
    activity_assignments: { include: { project_activity: true } },
  };

  async getInstanceEventDaySubjects(owner: InstanceOwner, eventDayId?: number) {
    return this.prisma.projectDaySubject.findMany({
      where: { ...owner, ...(eventDayId ? { project_event_day_id: eventDayId } : {}) },
      include: this.instanceSubjectInclude,
      orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  async createInstanceEventDaySubject(owner: InstanceOwner, dto: CreateInstanceEventDaySubjectDto) {
    const existing = await this.prisma.projectDaySubject.findMany({
      where: { ...owner, project_event_day_id: dto.project_event_day_id },
      orderBy: { order_index: 'desc' }, take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order_index + 1 : 0;

    const subject = await this.prisma.projectDaySubject.create({
      data: {
        ...owner, project_event_day_id: dto.project_event_day_id,
        role_template_id: dto.role_template_id, name: dto.name, real_name: dto.real_name,
        count: dto.count, notes: dto.notes, order_index: dto.order_index ?? nextOrder,
      },
      include: this.instanceSubjectInclude,
    });

    if (dto.real_name?.trim() && !subject.contact_id) {
      return await this.resolveSubjectContact(owner, subject) ?? subject;
    }
    return subject;
  }

  async updateInstanceEventDaySubject(subjectId: number, dto: UpdateInstanceEventDaySubjectDto) {
    const record = await this.prisma.projectDaySubject.findUnique({ where: { id: subjectId } });
    if (!record) throw new NotFoundException('Event day subject not found');

    const { member_names, project_activity_id: _dropped, ...rest } = dto as UpdateInstanceEventDaySubjectDto & { project_activity_id?: number }; // eslint-disable-line @typescript-eslint/no-unused-vars
    const data: Prisma.ProjectDaySubjectUncheckedUpdateInput = {
      ...rest,
      ...(member_names !== undefined && { member_names: member_names === null ? Prisma.DbNull : member_names }),
    };

    const updated = await this.prisma.projectDaySubject.update({
      where: { id: subjectId }, data, include: this.instanceSubjectInclude,
    });

    if (dto.real_name !== undefined && dto.real_name?.trim() && !updated.contact_id) {
      const owner: InstanceOwner = updated.project_id ? { project_id: updated.project_id } : { inquiry_id: updated.inquiry_id! };
      return await this.resolveSubjectContact(owner, updated, dto.real_name) ?? updated;
    }
    return updated;
  }

  async deleteInstanceEventDaySubject(subjectId: number) {
    const record = await this.prisma.projectDaySubject.findUnique({ where: { id: subjectId } });
    if (!record) throw new NotFoundException('Event day subject not found');
    return this.prisma.projectDaySubject.delete({ where: { id: subjectId } });
  }

  async assignInstanceSubjectToActivity(subjectId: number, activityId: number) {
    const existing = await this.prisma.projectDaySubject.findUnique({ where: { id: subjectId } });
    if (!existing) throw new NotFoundException('Event day subject not found');
    try {
      await this.prisma.projectDaySubjectActivity.create({
        data: { project_day_subject_id: subjectId, project_activity_id: activityId },
      });
    } catch { /* Already assigned — ignore */ }
    return this.prisma.projectDaySubject.findUnique({ where: { id: subjectId }, include: this.instanceSubjectInclude });
  }

  async unassignInstanceSubjectFromActivity(subjectId: number, activityId: number) {
    const existing = await this.prisma.projectDaySubject.findUnique({ where: { id: subjectId } });
    if (!existing) throw new NotFoundException('Event day subject not found');
    await this.prisma.projectDaySubjectActivity.deleteMany({
      where: { project_day_subject_id: subjectId, project_activity_id: activityId },
    });
    return this.prisma.projectDaySubject.findUnique({ where: { id: subjectId }, include: this.instanceSubjectInclude });
  }

  private async resolveSubjectContact(owner: InstanceOwner, subject: { id: number; real_name?: string | null }, realName?: string) {
    try {
      const name = (realName ?? subject.real_name ?? '').trim();
      if (!name) return null;
      const brandId = owner.project_id
        ? (await this.prisma.projects.findUnique({ where: { id: owner.project_id }, select: { brand_id: true } }))?.brand_id
        : (await this.prisma.inquiries.findUnique({ where: { id: owner.inquiry_id! }, select: { contact: { select: { brand_id: true } } } }))?.contact?.brand_id;
      if (!brandId) return null;
      const nameParts = name.split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
      const email = `${firstName.toLowerCase()}${lastName ? '.' + lastName.toLowerCase() : ''}.${subject.id}@placeholder.internal`;
      const contact = await this.prisma.contacts.upsert({
        where: { email },
        create: { first_name: firstName, last_name: lastName, email, type: 'Client', brand_id: brandId },
        update: {},
      });
      await this.prisma.projectDaySubject.update({ where: { id: subject.id }, data: { contact_id: contact.id } });
      return this.prisma.projectDaySubject.findUnique({ where: { id: subject.id }, include: this.instanceSubjectInclude });
    } catch { return null; }
  }

  // ─── Instance Location Slots ─────────────────────────────────────────

  private readonly instanceLocationSlotInclude = {
    project_event_day: true,
    location: true,
    activity_assignments: { include: { project_activity: true } },
  };

  async getInstanceLocationSlots(owner: InstanceOwner, eventDayId?: number) {
    return this.prisma.projectLocationSlot.findMany({
      where: { ...owner, ...(eventDayId ? { project_event_day_id: eventDayId } : {}) },
      include: this.instanceLocationSlotInclude,
      orderBy: { location_number: 'asc' },
    });
  }

  async createInstanceLocationSlot(owner: InstanceOwner, dto: CreateInstanceLocationSlotDto) {
    let locationNumber = dto.location_number;

    if (!locationNumber) {
      const existing = await this.prisma.projectLocationSlot.findMany({
        where: { ...owner, project_event_day_id: dto.project_event_day_id },
        select: { location_number: true }, orderBy: { location_number: 'asc' },
      });
      const usedNumbers = new Set(existing.map((s) => s.location_number));
      for (let i = 1; i <= 5; i++) {
        if (!usedNumbers.has(i)) { locationNumber = i; break; }
      }
      if (!locationNumber) throw new BadRequestException('Maximum of 5 location slots per event day');
    }

    if (locationNumber < 1 || locationNumber > 5) throw new BadRequestException('Location number must be between 1 and 5');

    try {
      return await this.prisma.projectLocationSlot.create({
        data: {
          ...owner, project_event_day_id: dto.project_event_day_id,
          location_number: locationNumber, name: dto.name, address: dto.address,
          location_id: dto.location_id, notes: dto.notes,
        },
        include: this.instanceLocationSlotInclude,
      });
    } catch {
      throw new BadRequestException(`Location ${locationNumber} already exists for this event day`);
    }
  }

  async updateInstanceLocationSlot(slotId: number, dto: { name?: string | null; address?: string | null; notes?: string | null }) {
    const record = await this.prisma.projectLocationSlot.findUnique({ where: { id: slotId } });
    if (!record) throw new NotFoundException('Location slot not found');
    return this.prisma.projectLocationSlot.update({
      where: { id: slotId }, data: dto, include: this.instanceLocationSlotInclude,
    });
  }

  async deleteInstanceLocationSlot(slotId: number) {
    const record = await this.prisma.projectLocationSlot.findUnique({ where: { id: slotId } });
    if (!record) throw new NotFoundException('Location slot not found');
    return this.prisma.projectLocationSlot.delete({ where: { id: slotId } });
  }

  async assignInstanceLocationSlotToActivity(slotId: number, activityId: number) {
    const existing = await this.prisma.projectLocationSlot.findUnique({ where: { id: slotId } });
    if (!existing) throw new NotFoundException('Location slot not found');
    try {
      await this.prisma.projectLocationActivityAssignment.create({
        data: { project_location_slot_id: slotId, project_activity_id: activityId },
      });
    } catch { /* Already assigned — ignore */ }
    return this.prisma.projectLocationSlot.findUnique({ where: { id: slotId }, include: this.instanceLocationSlotInclude });
  }

  async unassignInstanceLocationSlotFromActivity(slotId: number, activityId: number) {
    const existing = await this.prisma.projectLocationSlot.findUnique({ where: { id: slotId } });
    if (!existing) throw new NotFoundException('Location slot not found');
    await this.prisma.projectLocationActivityAssignment.deleteMany({
      where: { project_location_slot_id: slotId, project_activity_id: activityId },
    });
    return this.prisma.projectLocationSlot.findUnique({ where: { id: slotId }, include: this.instanceLocationSlotInclude });
  }

  // ─── Instance Films ──────────────────────────────────────────────────

  async getInstanceFilms(owner: InstanceOwner) {
    return this.prisma.projectFilm.findMany({
      where: { ...owner },
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
        package_film: true,
        scene_schedules: {
          include: { scene: true, project_event_day: true },
          orderBy: { order_index: 'asc' },
        },
      },
      orderBy: { order_index: 'asc' },
    });
  }

  async createInstanceFilm(owner: InstanceOwner, dto: CreateProjectFilmDto) {
    return this.prisma.projectFilm.create({
      data: {
        ...owner, film_id: dto.film_id, package_film_id: dto.package_film_id,
        order_index: dto.order_index ?? 0,
      },
      include: {
        film: { include: { scenes: { orderBy: { order_index: 'asc' } } } },
        package_film: true,
      },
    });
  }
}
