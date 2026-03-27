import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
  UpsertSchedulePresetDto,
  CreateEventDayDto,
  UpdateEventDayDto,
  CreateEventDayActivityDto,
  UpdateEventDayActivityDto,
  CreatePresetMomentDto,
  UpdatePresetMomentDto,
} from '../dto';

@Injectable()
export class SchedulePresetService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Shared Schedule Presets (Brand-level) ─────────────────────────

  async getSchedulePresets(brandId: number) {
    return this.prisma.schedulePreset.findMany({
      where: { brand_id: brandId },
      orderBy: { name: 'asc' },
    });
  }

  async upsertSchedulePreset(brandId: number, dto: UpsertSchedulePresetDto) {
    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('Preset name is required');

    return this.prisma.schedulePreset.upsert({
      where: { brand_id_name: { brand_id: brandId, name } },
      create: { brand_id: brandId, name, schedule_data: dto.schedule_data as object },
      update: { schedule_data: dto.schedule_data as object },
    });
  }

  async renameSchedulePreset(brandId: number, presetId: number, name: string) {
    const cleanName = name?.trim();
    if (!cleanName) throw new BadRequestException('Preset name is required');

    const existing = await this.prisma.schedulePreset.findFirst({
      where: { id: presetId, brand_id: brandId },
    });
    if (!existing) throw new NotFoundException('Schedule preset not found');

    return this.prisma.schedulePreset.update({
      where: { id: presetId },
      data: { name: cleanName },
    });
  }

  async deleteSchedulePreset(brandId: number, presetId: number) {
    const existing = await this.prisma.schedulePreset.findFirst({
      where: { id: presetId, brand_id: brandId },
    });
    if (!existing) throw new NotFoundException('Schedule preset not found');
    return this.prisma.schedulePreset.delete({ where: { id: presetId } });
  }

  // ─── Event Day Templates ─────────────────────────────────────────────

  async findAllEventDays(brandId: number) {
    return this.prisma.eventDay.findMany({
      where: { brand_id: brandId, is_active: true },
      orderBy: { order_index: 'asc' },
      include: {
        activity_presets: {
          where: { is_active: true },
          orderBy: { order_index: 'asc' },
          include: { moments: { orderBy: { order_index: 'asc' } } },
        },
      },
    });
  }

  async findOneEventDay(id: number, brandId: number) {
    const template = await this.prisma.eventDay.findFirst({
      where: { id, brand_id: brandId },
    });
    if (!template) throw new NotFoundException('Event day template not found');
    return template;
  }

  async createEventDay(brandId: number, dto: CreateEventDayDto) {
    return this.prisma.eventDay.create({
      data: {
        brand_id: brandId,
        name: dto.name,
        description: dto.description,
        order_index: dto.order_index ?? 0,
      },
    });
  }

  async updateEventDay(id: number, brandId: number, dto: UpdateEventDayDto) {
    await this.findOneEventDay(id, brandId);
    return this.prisma.eventDay.update({ where: { id }, data: dto });
  }

  async deleteEventDay(id: number, brandId: number) {
    await this.findOneEventDay(id, brandId);
    return this.prisma.eventDay.update({ where: { id }, data: { is_active: false } });
  }

  // ─── Event Day Activity Presets ──────────────────────────────────────

  async findActivityPresets(eventDayId: number) {
    return this.prisma.eventDayActivity.findMany({
      where: { event_day_template_id: eventDayId, is_active: true },
      orderBy: { order_index: 'asc' },
      include: { moments: { orderBy: { order_index: 'asc' } } },
    });
  }

  async createActivityPreset(eventDayId: number, dto: CreateEventDayActivityDto) {
    return this.prisma.eventDayActivity.create({
      data: {
        event_day_template_id: eventDayId,
        name: dto.name,
        description: dto.description,
        color: dto.color,
        icon: dto.icon,
        default_start_time: dto.default_start_time,
        default_duration_minutes: dto.default_duration_minutes,
        order_index: dto.order_index ?? 0,
      },
    });
  }

  async updateActivityPreset(presetId: number, dto: UpdateEventDayActivityDto) {
    const preset = await this.prisma.eventDayActivity.findUnique({ where: { id: presetId } });
    if (!preset) throw new NotFoundException('Activity preset not found');
    return this.prisma.eventDayActivity.update({ where: { id: presetId }, data: dto });
  }

  async deleteActivityPreset(presetId: number) {
    const preset = await this.prisma.eventDayActivity.findUnique({ where: { id: presetId } });
    if (!preset) throw new NotFoundException('Activity preset not found');
    return this.prisma.eventDayActivity.delete({ where: { id: presetId } });
  }

  async bulkCreateActivityPresets(
    eventDayId: number,
    presets: { name: string; color?: string; default_start_time?: string; description?: string; order_index?: number }[],
  ) {
    const data = presets.map((p, i) => ({
      event_day_template_id: eventDayId,
      name: p.name,
      color: p.color,
      default_start_time: p.default_start_time,
      description: p.description,
      order_index: p.order_index ?? i,
    }));
    return this.prisma.eventDayActivity.createMany({ data, skipDuplicates: true });
  }

  // ─── Preset Moments ──────────────────────────────────────────────────

  async findPresetMoments(presetId: number) {
    return this.prisma.eventDayActivityMoment.findMany({
      where: { event_day_activity_preset_id: presetId },
      orderBy: { order_index: 'asc' },
    });
  }

  async createPresetMoment(presetId: number, dto: CreatePresetMomentDto) {
    return this.prisma.eventDayActivityMoment.create({
      data: {
        event_day_activity_preset_id: presetId,
        name: dto.name,
        description: dto.description,
        duration_seconds: dto.duration_seconds ?? 60,
        order_index: dto.order_index ?? 0,
        is_key_moment: dto.is_key_moment ?? false,
      },
    });
  }

  async updatePresetMoment(momentId: number, dto: UpdatePresetMomentDto) {
    const moment = await this.prisma.eventDayActivityMoment.findUnique({ where: { id: momentId } });
    if (!moment) throw new NotFoundException('Preset moment not found');
    return this.prisma.eventDayActivityMoment.update({ where: { id: momentId }, data: dto });
  }

  async deletePresetMoment(momentId: number) {
    const moment = await this.prisma.eventDayActivityMoment.findUnique({ where: { id: momentId } });
    if (!moment) throw new NotFoundException('Preset moment not found');
    return this.prisma.eventDayActivityMoment.delete({ where: { id: momentId } });
  }

  async bulkCreatePresetMoments(
    presetId: number,
    moments: { name: string; duration_seconds?: number; order_index?: number; is_key_moment?: boolean }[],
  ) {
    const data = moments.map((m, i) => ({
      event_day_activity_preset_id: presetId,
      name: m.name,
      duration_seconds: m.duration_seconds ?? 60,
      order_index: m.order_index ?? i,
      is_key_moment: m.is_key_moment ?? false,
    }));
    return this.prisma.eventDayActivityMoment.createMany({ data, skipDuplicates: true });
  }
}
