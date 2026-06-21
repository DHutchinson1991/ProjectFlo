import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { CloneDayBlueprintDto, CreateDayBlueprintDto, UpdateDayBlueprintDto } from '../dto';
import { DayBlueprintDefaultsService } from './day-blueprint-defaults.service';
import { seedInitialVersionStructure } from './day-blueprints.seeding';
import {
  DayBlueprintVersionCopyService,
  dayBlueprintVersionCopyInclude,
} from './day-blueprint-version-copy.service';

type BlueprintListRowSummary = {
  primary_version_id: number | null;
  primary_version_number: number | null;
  primary_version_status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | null;
  day_count: number;
  activity_count: number;
  moment_count: number;
};

function isPrismaUniqueConstraintError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return true;
  }
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002';
}

/** Cloned blueprints must not keep blank-wizard-only authoring flags. */
function variantTagsForClone(source: Prisma.JsonValue | null | undefined): Prisma.InputJsonValue | undefined {
  if (source == null) {
    return undefined;
  }
  if (typeof source !== 'object' || Array.isArray(source)) {
    return source as Prisma.InputJsonValue;
  }
  const { blank_authoring: _omit, ...rest } = source as Record<string, unknown>;
  if (Object.keys(rest).length === 0) {
    return undefined;
  }
  return rest as Prisma.InputJsonValue;
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
    private readonly versionCopy: DayBlueprintVersionCopyService,
  ) {}

  async findAll(brandId: number, options?: { includeSeeded?: boolean }) {
    const includeSeeded = options?.includeSeeded ?? false;
    const blueprints = await this.prisma.dayBlueprint.findMany({
      where: {
        brand_id: brandId,
        ...(includeSeeded ? {} : { is_system_seeded: false }),
      },
      orderBy: [{ order_index: 'asc' }, { display_name: 'asc' }],
      include: {
        latest_published_version: true,
        versions: {
          orderBy: { version_number: 'desc' },
          select: {
            id: true,
            version_number: true,
            status: true,
            generation_mode: true,
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
            generation_mode: true,
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
          generation_mode: 'NORMAL',
          change_summary: 'Initial draft',
        },
      });

      await this.defaults.seedInitialVersionDefaults(tx, {
        brandId,
        versionId: version.id,
        eventCategory: blueprint.event_category,
        guestCount: dto.initial_guest_count,
      });

      await seedInitialVersionStructure(tx, this.defaults, {
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

  async cloneFromBlueprint(brandId: number, sourceBlueprintId: number, dto: CloneDayBlueprintDto) {
    const sourceBlueprint = await this.prisma.dayBlueprint.findFirst({
      where: { id: sourceBlueprintId, brand_id: brandId },
      include: {
        versions: {
          orderBy: { version_number: 'desc' },
          select: { id: true, version_number: true, status: true },
        },
      },
    });
    if (!sourceBlueprint) throw new NotFoundException('Source day blueprint not found');

    const sourceVersionSummary = dto.source_version_id
      ? sourceBlueprint.versions.find((version) => version.id === dto.source_version_id)
      : sourceBlueprint.versions.find((version) => version.status === 'PUBLISHED')
        ?? sourceBlueprint.versions.find((version) => version.status === 'DRAFT')
        ?? sourceBlueprint.versions[0];
    if (!sourceVersionSummary) {
      throw new BadRequestException('Source day blueprint has no versions to clone');
    }

    const sourceVersion = await this.prisma.dayBlueprintVersion.findUnique({
      where: { id: sourceVersionSummary.id },
      include: dayBlueprintVersionCopyInclude,
    });
    if (!sourceVersion || sourceVersion.day_blueprint_id !== sourceBlueprint.id) {
      throw new NotFoundException('Source day blueprint version not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const key = await this.resolveCloneKey(tx, brandId, sourceBlueprint.key, dto.key);
      const displayName = dto.display_name?.trim()
        || `${sourceBlueprint.display_name} (Copy)`.slice(0, 160);
      const clonedBlueprint = await tx.dayBlueprint.create({
        data: {
          brand_id: brandId,
          key,
          display_name: displayName,
          event_category: sourceBlueprint.event_category,
          description: sourceBlueprint.description,
          icon: sourceBlueprint.icon,
          color: sourceBlueprint.color,
          variant_tags: variantTagsForClone(sourceBlueprint.variant_tags),
          is_system_seeded: false,
          is_active: true,
          order_index: sourceBlueprint.order_index,
        },
      });

      const clonedVersion = await tx.dayBlueprintVersion.create({
        data: {
          day_blueprint_id: clonedBlueprint.id,
          version_number: 1,
          status: 'DRAFT',
          generation_mode: 'NORMAL',
          change_summary: `Cloned from ${sourceBlueprint.display_name} v${sourceVersion.version_number}`,
          source_ai_run_id: null,
        },
      });

      await this.versionCopy.copyVersionStructure(tx, {
        sourceVersion,
        targetVersionId: clonedVersion.id,
        isSystemSeededBlueprint: sourceBlueprint.is_system_seeded,
      });

      return clonedBlueprint;
    });
  }

  private async resolveCloneKey(
    tx: Prisma.TransactionClient,
    brandId: number,
    sourceKey: string,
    preferred?: string,
  ): Promise<string> {
    const desired = preferred?.trim();
    if (desired) {
      const existing = await tx.dayBlueprint.findUnique({
        where: { brand_id_key: { brand_id: brandId, key: desired } },
        select: { id: true },
      });
      if (!existing) return desired;
      throw new ConflictException('A day blueprint with this key already exists');
    }

    const stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const base = `${sourceKey}-copy-${stamp}`;
    let candidate = base.slice(0, 80);
    let attempt = 0;
    while (attempt < 20) {
      const existing = await tx.dayBlueprint.findUnique({
        where: { brand_id_key: { brand_id: brandId, key: candidate } },
        select: { id: true },
      });
      if (!existing) return candidate;
      attempt += 1;
      const suffix = `-${attempt}`;
      candidate = `${base.slice(0, Math.max(1, 80 - suffix.length))}${suffix}`;
    }
    throw new ConflictException('Could not generate a unique key for cloned blueprint');
  }
}
