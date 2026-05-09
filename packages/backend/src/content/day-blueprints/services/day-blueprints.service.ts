import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { CreateDayBlueprintDto, UpdateDayBlueprintDto } from '../dto';
import { DayBlueprintDefaultsService } from './day-blueprint-defaults.service';

type BlueprintListRowSummary = {
  primary_version_id: number | null;
  primary_version_number: number | null;
  primary_version_status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | null;
  day_count: number;
  activity_count: number;
  moment_count: number;
};

const EVENT_DAY_ROLE_LABELS: Record<string, string> = {
  welcome: 'Welcome Event',
  rehearsal: 'Rehearsal',
  wedding: 'Wedding Day',
  cultural: 'Cultural Ceremony',
  'after-party': 'After Party',
  brunch: 'Brunch',
};

function normalizeActivityNames(values?: string[]): string[] {
  if (!values?.length) {
    return [];
  }

  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values) {
    const trimmed = value.trim().replace(/\s+/g, ' ');
    if (!trimmed) continue;
    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(trimmed);
  }

  return out;
}

function resolveDayName(params: {
  eventCategory: string;
  dayIndex: number;
  roleHint?: string;
}): string {
  const isWedding = params.eventCategory.toLowerCase().includes('wedding');
  const roleHint = params.roleHint?.trim().toLowerCase();
  if (roleHint && EVENT_DAY_ROLE_LABELS[roleHint]) {
    return EVENT_DAY_ROLE_LABELS[roleHint];
  }
  if (isWedding && params.dayIndex === 0) {
    return 'Wedding Day';
  }
  return isWedding ? `Event Day ${params.dayIndex + 1}` : `Day ${params.dayIndex + 1}`;
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return true;
  }
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002';
}

/**
 * CRUD for DayBlueprint headers (brand-scoped identity for a canonical
 * day design, e.g. "Wedding Day - Civil UK Ceremony"). Versions carry
 * the actual authored structure and live in DayBlueprintVersionsService.
 */
@Injectable()
export class DayBlueprintsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly defaults: DayBlueprintDefaultsService,
  ) {}

  async findAll(brandId: number) {
    const blueprints = await this.prisma.dayBlueprint.findMany({
      where: { brand_id: brandId },
      orderBy: [{ order_index: 'asc' }, { display_name: 'asc' }],
      include: {
        latest_published_version: true,
        versions: {
          orderBy: { version_number: 'desc' },
          select: {
            id: true,
            version_number: true,
            status: true,
            published_at: true,
            change_summary: true,
            created_at: true,
          },
        },
        _count: { select: { versions: true } },
      },
    });

    const primaryVersionsByBlueprint = new Map<number, { id: number; version_number: number; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }>();

    for (const blueprint of blueprints) {
      const versions = blueprint.versions ?? [];
      const published = versions
        .filter((version) => version.status === 'PUBLISHED')
        .sort((a, b) => b.version_number - a.version_number)[0];
      const draft = versions
        .filter((version) => version.status === 'DRAFT')
        .sort((a, b) => b.version_number - a.version_number)[0];
      const fallback = versions
        .slice()
        .sort((a, b) => b.version_number - a.version_number)[0];
      const primary = published ?? draft ?? fallback;

      if (primary) {
        primaryVersionsByBlueprint.set(blueprint.id, {
          id: primary.id,
          version_number: primary.version_number,
          status: primary.status,
        });
      }
    }

    const versionIds = Array.from(primaryVersionsByBlueprint.values()).map((version) => version.id);
    const countByVersion = new Map<number, { day_count: number; activity_count: number; moment_count: number }>();

    if (versionIds.length > 0) {
      const versions = await this.prisma.dayBlueprintVersion.findMany({
        where: { id: { in: versionIds } },
        select: {
          id: true,
          days: {
            select: {
              id: true,
              activities: {
                select: {
                  id: true,
                  moments: { select: { id: true } },
                },
              },
            },
          },
        },
      });

      for (const version of versions) {
        const day_count = version.days.length;
        const activity_count = version.days.reduce(
          (sum, day) => sum + day.activities.length,
          0,
        );
        const moment_count = version.days.reduce(
          (sum, day) =>
            sum + day.activities.reduce((activitySum, activity) => activitySum + activity.moments.length, 0),
          0,
        );

        countByVersion.set(version.id, {
          day_count,
          activity_count,
          moment_count,
        });
      }
    }

    return blueprints.map((blueprint) => {
      const primary = primaryVersionsByBlueprint.get(blueprint.id);
      const counts = primary ? countByVersion.get(primary.id) : null;
      const row_summary: BlueprintListRowSummary = {
        primary_version_id: primary?.id ?? null,
        primary_version_number: primary?.version_number ?? null,
        primary_version_status: primary?.status ?? null,
        day_count: counts?.day_count ?? 0,
        activity_count: counts?.activity_count ?? 0,
        moment_count: counts?.moment_count ?? 0,
      };

      return {
        ...blueprint,
        row_summary,
      };
    });
  }

  async findOne(brandId: number, id: number) {
    const record = await this.prisma.dayBlueprint.findFirst({
      where: { id, brand_id: brandId },
      include: {
        latest_published_version: true,
        versions: {
          orderBy: { version_number: 'desc' },
          select: {
            id: true,
            version_number: true,
            status: true,
            published_at: true,
            change_summary: true,
            created_at: true,
          },
        },
      },
    });
    if (!record) throw new NotFoundException('Day blueprint not found');
    return record;
  }

  async create(brandId: number, dto: CreateDayBlueprintDto) {
    const key = dto.key?.trim();
    if (!key) throw new BadRequestException('Day blueprint key is required');

    const existing = await this.prisma.dayBlueprint.findUnique({
      where: { brand_id_key: { brand_id: brandId, key } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('A day blueprint with this key already exists');
    }

    return this.prisma.$transaction(async (tx) => {
      const blueprint = await tx.dayBlueprint.create({
        data: {
          brand_id: brandId,
          key,
          display_name: dto.display_name.trim(),
          event_category: dto.event_category.trim(),
          description: dto.description,
          icon: dto.icon,
          color: dto.color,
          variant_tags: (dto.variant_tags ?? undefined) as Prisma.InputJsonValue | undefined,
          is_system_seeded: dto.is_system_seeded ?? false,
          is_active: dto.is_active ?? true,
          order_index: dto.order_index ?? 0,
        },
      }).catch((error: unknown) => {
        if (isPrismaUniqueConstraintError(error)) {
          throw new ConflictException('A day blueprint with this key already exists');
        }
        throw error;
      });
      // Every blueprint starts with version 1 in DRAFT so authors have
      // somewhere to work immediately.
      const version = await tx.dayBlueprintVersion.create({
        data: {
          day_blueprint_id: blueprint.id,
          version_number: 1,
          status: 'DRAFT',
          change_summary: 'Initial draft',
        },
      });

      await this.defaults.seedInitialVersionDefaults(tx, {
        brandId,
        versionId: version.id,
        eventCategory: blueprint.event_category,
      });

      await this.seedInitialVersionStructure(tx, {
        brandId,
        versionId: version.id,
        eventCategory: blueprint.event_category,
        eventDayCount: dto.initial_event_days,
        eventDayRoles: dto.initial_event_day_roles,
        activities: dto.initial_activities,
        dayTimings: dto.initial_day_timings,
        activityTimings: dto.initial_activity_timings,
      });

      return blueprint;
    });
  }

  private async seedInitialVersionStructure(
    tx: Prisma.TransactionClient,
    params: {
      brandId: number;
      versionId: number;
      eventCategory: string;
      eventDayCount?: number;
      eventDayRoles?: Record<string, string>;
      activities?: string[];
      dayTimings?: Array<{ day_number: number; default_start_time?: string; default_duration_hours?: number }>;
      activityTimings?: Array<{ name: string; default_start_time?: string; default_duration_minutes?: number; duration_min_minutes?: number; duration_max_minutes?: number }>;
    },
  ) {
    const activityNames = normalizeActivityNames(params.activities);
    const requestedDayCount = Math.max(params.eventDayCount ?? 0, 0);
    const dayCount = Math.max(requestedDayCount, activityNames.length > 0 ? 1 : 0);

    if (dayCount === 0) {
      return;
    }

    const createdDays: Array<{ id: number }> = [];
    for (let dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
      const dayTiming = params.dayTimings?.find((t) => t.day_number === dayIndex + 1);
      const day = await tx.dayBlueprintDay.create({
        data: {
          day_blueprint_version_id: params.versionId,
          name: resolveDayName({
            eventCategory: params.eventCategory,
            dayIndex,
            roleHint: params.eventDayRoles?.[String(dayIndex + 1)],
          }),
          order_index: dayIndex,
          default_start_time: dayTiming?.default_start_time,
          default_duration_hours: dayTiming?.default_duration_hours,
        },
      });
      createdDays.push(day);
    }

    const primaryDay = createdDays[0];
    for (let orderIndex = 0; orderIndex < activityNames.length; orderIndex += 1) {
      const actName = activityNames[orderIndex];
      const actTiming = params.activityTimings?.find(
        (t) => t.name.toLowerCase() === actName.toLowerCase(),
      );
      const activity = await tx.dayBlueprintActivity.create({
        data: {
          day_blueprint_day_id: primaryDay.id,
          name: actName,
          order_index: orderIndex,
          criticality: 'REQUIRED',
          default_start_time: actTiming?.default_start_time,
          default_duration_minutes: actTiming?.default_duration_minutes,
          duration_min_minutes: actTiming?.duration_min_minutes,
          duration_max_minutes: actTiming?.duration_max_minutes,
        },
      });

      await this.defaults.ensureActivityLocationDefaults(tx, {
        brandId: params.brandId,
        versionId: params.versionId,
        activityId: activity.id,
        activityName: activity.name,
      });
    }
  }

  async update(brandId: number, id: number, dto: UpdateDayBlueprintDto) {
    await this.findOne(brandId, id);
    return this.prisma.dayBlueprint.update({
      where: { id },
      data: {
        display_name: dto.display_name?.trim(),
        event_category: dto.event_category?.trim(),
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        variant_tags: (dto.variant_tags ?? undefined) as Prisma.InputJsonValue | undefined,
        is_system_seeded: dto.is_system_seeded,
        is_active: dto.is_active,
        order_index: dto.order_index,
      },
    });
  }

  async remove(brandId: number, id: number) {
    await this.findOne(brandId, id);
    return this.prisma.dayBlueprint.delete({ where: { id } });
  }
}
