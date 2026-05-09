import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DayBlueprintGuardrailsService } from './day-blueprint-guardrails.service';
import { CreateDayBlueprintVersionDto, PublishDayBlueprintVersionDto } from '../dto';

/**
 * Version lifecycle for DayBlueprint authoring.
 *
 * Rules:
 *   1. Edits only happen on a DRAFT version.
 *   2. PUBLISHED versions are immutable.
 *   3. Creating a new draft always branches from latest (published or
 *      draft) so work never starts blank by accident.
 *   4. Publish flips DayBlueprint.latest_published_version_id.
 */
@Injectable()
export class DayBlueprintVersionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly guardrails: DayBlueprintGuardrailsService,
  ) {}

  async findAll(brandId: number, blueprintId: number) {
    await this.assertBlueprint(brandId, blueprintId);
    return this.prisma.dayBlueprintVersion.findMany({
      where: { day_blueprint_id: blueprintId },
      orderBy: { version_number: 'desc' },
    });
  }

  async findOne(brandId: number, blueprintId: number, versionId: number) {
    await this.assertBlueprint(brandId, blueprintId);
    const version = await this.prisma.dayBlueprintVersion.findFirst({
      where: { id: versionId, day_blueprint_id: blueprintId },
      include: {
        days: {
          include: {
            activities: {
              include: {
                activity_locations: {
                  include: { location_role: true },
                  orderBy: { order_index: 'asc' },
                },
                moments: {
                  include: {
                    actions: { orderBy: { order_index: 'asc' } },
                    placements: { orderBy: { order_index: 'asc' } },
                  },
                  orderBy: { order_index: 'asc' },
                },
              },
              orderBy: { order_index: 'asc' },
            },
          },
          orderBy: { order_index: 'asc' },
        },
        subject_roles: { include: { subject_role: true }, orderBy: { order_index: 'asc' } },
        lock_rules: true,
        space_slots: { include: { location_role: true }, orderBy: { order_index: 'asc' } },
      },
    });
    if (!version) throw new NotFoundException('Day blueprint version not found');
    return version;
  }

  async createDraft(brandId: number, blueprintId: number, dto: CreateDayBlueprintVersionDto) {
    await this.assertBlueprint(brandId, blueprintId);
    const latest = await this.prisma.dayBlueprintVersion.findFirst({
      where: { day_blueprint_id: blueprintId },
      orderBy: { version_number: 'desc' },
      select: { version_number: true },
    });
    const nextVersion = (latest?.version_number ?? 0) + 1;
    return this.prisma.dayBlueprintVersion.create({
      data: {
        day_blueprint_id: blueprintId,
        version_number: nextVersion,
        status: 'DRAFT',
        change_summary: dto.change_summary,
        source_ai_run_id: dto.source_ai_run_id,
      },
    });
  }

  async publish(brandId: number, blueprintId: number, versionId: number, dto: PublishDayBlueprintVersionDto) {
    const version = await this.findOne(brandId, blueprintId, versionId);
    if (version.status === 'PUBLISHED') throw new ConflictException('Version already published');
    if (version.status === 'ARCHIVED') throw new ConflictException('Archived version cannot be published');

    await this.guardrails.assertPublishable(versionId);

    return this.prisma.$transaction(async (tx) => {
      const published = await tx.dayBlueprintVersion.update({
        where: { id: versionId },
        data: {
          status: 'PUBLISHED',
          published_at: new Date(),
          change_summary: dto.change_summary ?? version.change_summary ?? undefined,
        },
      });
      await tx.dayBlueprint.update({
        where: { id: blueprintId },
        data: { latest_published_version_id: versionId },
      });
      // Mark all package usages that were on OLDER versions of this blueprint as
      // outdated so drift-detection UX can surface "Blueprint updated" banners.
      await tx.dayBlueprintUsage.updateMany({
        where: {
          version: { day_blueprint_id: blueprintId },
          day_blueprint_version_id: { not: versionId },
          is_current: true,
        },
        data: { is_current: false },
      });
      return published;
    });
  }

  async archive(brandId: number, blueprintId: number, versionId: number) {
    const version = await this.findOne(brandId, blueprintId, versionId);
    if (version.status === 'ARCHIVED') return version;
    return this.prisma.dayBlueprintVersion.update({
      where: { id: versionId },
      data: { status: 'ARCHIVED' },
    });
  }

  /**
   * Guard: authoring mutations must only touch DRAFT versions.
   * Callers of child-row services should use this before writes.
   */
  async assertDraft(versionId: number) {
    const version = await this.prisma.dayBlueprintVersion.findUnique({
      where: { id: versionId },
      select: { id: true, status: true },
    });
    if (!version) throw new NotFoundException('Day blueprint version not found');
    if (version.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT versions can be edited');
    }
  }

  private async assertBlueprint(brandId: number, blueprintId: number) {
    const exists = await this.prisma.dayBlueprint.findFirst({
      where: { id: blueprintId, brand_id: brandId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Day blueprint not found');
  }
}
