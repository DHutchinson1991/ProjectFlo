import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';

@Injectable()
export class EventTypesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deep include object reused across queries.
   * Loads event days (with activity presets + moments) and subject types (with roles).
   */
  private readonly deepInclude = {
    event_days: {
      orderBy: { order_index: 'asc' as const },
      include: {
        event_day_template: {
          include: {
            activity_presets: {
              orderBy: { order_index: 'asc' as const },
              include: {
                moments: {
                  orderBy: { order_index: 'asc' as const },
                },
              },
            },
          },
        },
      },
    },
    subject_roles: {
      orderBy: { order_index: 'asc' as const },
      include: {
        subject_role: true,
      },
    },
  };

  // ────────────────────────── CRUD ──────────────────────────

  async findAll(brandId: number) {
    return this.prisma.eventType.findMany({
      where: {
        brand_id: brandId,
        is_active: true,
      },
      include: this.deepInclude,
      orderBy: { order_index: 'asc' },
    });
  }

  async findOne(id: number, brandId: number) {
    const eventType = await this.prisma.eventType.findFirst({
      where: { id, brand_id: brandId },
      include: this.deepInclude,
    });
    if (!eventType) {
      throw new NotFoundException(`Event type #${id} not found`);
    }
    return eventType;
  }

  async create(brandId: number, dto: CreateEventTypeDto) {
    // Determine next order_index
    const maxOrder = await this.prisma.eventType.aggregate({
      where: { brand_id: brandId },
      _max: { order_index: true },
    });
    const nextOrder = (maxOrder._max.order_index ?? -1) + 1;

    const eventType = await this.prisma.eventType.create({
      data: {
        brand_id: brandId,
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        default_duration_hours: dto.default_duration_hours,
        default_start_time: dto.default_start_time,
        typical_guest_count: dto.typical_guest_count,
        order_index: dto.order_index ?? nextOrder,
      },
      include: this.deepInclude,
    });

    // Auto-create (or link) a matching service_package_category so the NA wizard
    // immediately shows packages for this event type without manual setup.
    await this.syncPackageCategory(brandId, eventType.id, dto.name);

    return eventType;
  }

  async update(id: number, brandId: number, dto: UpdateEventTypeDto) {
    // Ensure it exists for this brand
    const existing = await this.findOne(id, brandId);

    const updated = await this.prisma.eventType.update({
      where: { id },
      data: dto,
      include: this.deepInclude,
    });

    // If the name changed, keep the linked category name in sync
    if (dto.name && dto.name !== existing.name) {
      await this.syncPackageCategory(brandId, id, dto.name, existing.name);
    }

    return updated;
  }

  /**
   * Ensures a `service_package_categories` record exists for this event type.
   * - If a category with the same name already exists, links it via event_type_id.
   * - Otherwise creates a new category and links it.
   * - Safe to call multiple times (upsert pattern).
   */
  private async syncPackageCategory(
    brandId: number,
    eventTypeId: number,
    name: string,
    oldName?: string,
  ) {
    // If the event type was renamed, try to update the previously linked category name too
    if (oldName) {
      await this.prisma.service_package_categories.updateMany({
        where: { brand_id: brandId, event_type_id: eventTypeId },
        data: { name },
      }).catch(() => { /* ignore if unique constraint blocks — category may exist */ });
    }

    await this.prisma.service_package_categories.upsert({
      where: { brand_id_name: { brand_id: brandId, name } },
      create: { brand_id: brandId, name, event_type_id: eventTypeId },
      update: { event_type_id: eventTypeId },
    });
  }

  async remove(id: number, brandId: number) {
    await this.findOne(id, brandId);
    return this.prisma.eventType.delete({ where: { id } });
  }
}
