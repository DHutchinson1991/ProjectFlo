import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { LinkEventDayDto } from '../dto/link-event-day.dto';
import { LinkSubjectRoleDto } from '../dto/link-subject-role.dto';

@Injectable()
export class EventTypesLinkingService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────── LINK / UNLINK EVENT DAYS ──────────────────────

  async linkEventDay(eventTypeId: number, brandId: number, dto: LinkEventDayDto) {
    await this.assertExists(eventTypeId, brandId);

    let orderIndex = dto.order_index;
    if (orderIndex === undefined) {
      const maxOrder = await this.prisma.eventTypeDay.aggregate({
        where: { event_type_id: eventTypeId },
        _max: { order_index: true },
      });
      orderIndex = (maxOrder._max.order_index ?? -1) + 1;
    }

    try {
      return await this.prisma.eventTypeDay.create({
        data: {
          event_type_id: eventTypeId,
          event_day_template_id: dto.event_day_template_id,
          order_index: orderIndex,
          is_default: dto.is_default ?? true,
        },
        include: {
          event_day_template: {
            include: {
              activity_presets: {
                orderBy: { order_index: 'asc' },
                include: { moments: { orderBy: { order_index: 'asc' } } },
              },
            },
          },
        },
      });
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === 'P2002') {
        throw new ConflictException(
          'This event day template is already linked to this event type',
        );
      }
      throw error;
    }
  }

  async unlinkEventDay(
    eventTypeId: number,
    eventDayId: number,
    brandId: number,
  ) {
    await this.assertExists(eventTypeId, brandId);

    const junction = await this.prisma.eventTypeDay.findFirst({
      where: {
        event_type_id: eventTypeId,
        event_day_template_id: eventDayId,
      },
    });
    if (!junction) throw new NotFoundException('Link not found');

    return this.prisma.eventTypeDay.delete({ where: { id: junction.id } });
  }

  // ────────────────────── LINK / UNLINK SUBJECT ROLES ──────────────────────

  async linkSubjectRole(
    eventTypeId: number,
    brandId: number,
    dto: LinkSubjectRoleDto,
  ) {
    await this.assertExists(eventTypeId, brandId);

    let orderIndex = dto.order_index;
    if (orderIndex === undefined) {
      const maxOrder = await this.prisma.eventTypeSubject.aggregate({
        where: { event_type_id: eventTypeId },
        _max: { order_index: true },
      });
      orderIndex = (maxOrder._max.order_index ?? -1) + 1;
    }

    try {
      return await this.prisma.eventTypeSubject.create({
        data: {
          event_type_id: eventTypeId,
          subject_role_id: dto.subject_role_id,
          order_index: orderIndex,
          is_default: dto.is_default ?? true,
        },
        include: { subject_role: true },
      });
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === 'P2002') {
        throw new ConflictException(
          'This subject role is already linked to this event type',
        );
      }
      throw error;
    }
  }

  async unlinkSubjectRole(
    eventTypeId: number,
    subjectRoleId: number,
    brandId: number,
  ) {
    await this.assertExists(eventTypeId, brandId);

    const junction = await this.prisma.eventTypeSubject.findFirst({
      where: {
        event_type_id: eventTypeId,
        subject_role_id: subjectRoleId,
      },
    });
    if (!junction) throw new NotFoundException('Link not found');

    return this.prisma.eventTypeSubject.delete({ where: { id: junction.id } });
  }

  // ─── Private ────────────────────────────────────────────────────────

  private async assertExists(id: number, brandId: number) {
    const eventType = await this.prisma.eventType.findFirst({
      where: { id, brand_id: brandId },
    });
    if (!eventType) throw new NotFoundException(`Event type #${id} not found`);
    return eventType;
  }
}
