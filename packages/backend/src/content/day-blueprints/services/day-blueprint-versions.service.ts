import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { ExistingDraftVersionException } from '../exceptions/existing-draft-version.exception';
import { CreateDayBlueprintVersionDto, PublishDayBlueprintVersionDto } from '../dto';
import { DayBlueprintGuardrailsService } from './day-blueprint-guardrails.service';
import {
  DayBlueprintVersionCopyService,
  dayBlueprintVersionCopyInclude,
} from './day-blueprint-version-copy.service';

/**
 * Version lifecycle for DayBlueprint authoring.
 *
 * Rules:
 *   1. Edits only happen on a DRAFT version.
 *   2. PUBLISHED versions are immutable.
 *   3. Creating a new draft branches from latest (published or
 *      draft) so work never starts blank by accident.
 *   4. Publish flips DayBlueprint.latest_published_version_id.
 */
@Injectable()
export class DayBlueprintVersionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly guardrails: DayBlueprintGuardrailsService,
    private readonly versionCopy: DayBlueprintVersionCopyService,
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
    const blueprint = await this.prisma.dayBlueprint.findFirst({
      where: { id: blueprintId, brand_id: brandId },
      select: { id: true, is_system_seeded: true },
    });
    if (!blueprint) throw new NotFoundException('Day blueprint not found');

    const existingDraft = await this.prisma.dayBlueprintVersion.findFirst({
      where: { day_blueprint_id: blueprintId, status: 'DRAFT' },
      orderBy: { version_number: 'desc' },
      select: { id: true, version_number: true },
    });

    if (existingDraft) {
      if (!dto.replace_existing_draft) {
        throw new ExistingDraftVersionException(existingDraft.id, existingDraft.version_number);
      }
      await this.prisma.dayBlueprintVersion.delete({ where: { id: existingDraft.id } });
    }

    const sourceVersionId = await this.resolveBranchSourceVersionId(blueprintId, dto.source_version_id);
    const sourceVersion = sourceVersionId
      ? await this.prisma.dayBlueprintVersion.findUnique({
          where: { id: sourceVersionId },
          include: dayBlueprintVersionCopyInclude,
        })
      : null;

    if (sourceVersionId && (!sourceVersion || sourceVersion.day_blueprint_id !== blueprintId)) {
      throw new BadRequestException('Source version does not belong to this blueprint');
    }

    const latest = await this.prisma.dayBlueprintVersion.findFirst({
      where: { day_blueprint_id: blueprintId },
      orderBy: { version_number: 'desc' },
      select: { version_number: true },
    });
    const nextVersion = (latest?.version_number ?? 0) + 1;

    const changeSummary =
      dto.change_summary?.trim()
      ?? (sourceVersion
        ? `Draft branched from v${sourceVersion.version_number}`
        : 'New draft');

    return this.prisma.$transaction(async (tx) => {
      const draft = await tx.dayBlueprintVersion.create({
        data: {
          day_blueprint_id: blueprintId,
          version_number: nextVersion,
          status: 'DRAFT',
          change_summary: changeSummary,
          source_ai_run_id: dto.source_ai_run_id,
          generation_mode: dto.generation_mode ?? sourceVersion?.generation_mode ?? 'NORMAL',
        },
      });

      if (sourceVersion) {
        await this.versionCopy.copyVersionStructure(tx, {
          sourceVersion,
          targetVersionId: draft.id,
          isSystemSeededBlueprint: blueprint.is_system_seeded,
        });
      }

      return draft;
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

  private async resolveBranchSourceVersionId(
    blueprintId: number,
    explicitSourceVersionId?: number,
  ): Promise<number | null> {
    if (explicitSourceVersionId) {
      return explicitSourceVersionId;
    }

    const versions = await this.prisma.dayBlueprintVersion.findMany({
      where: { day_blueprint_id: blueprintId },
      orderBy: { version_number: 'desc' },
      select: { id: true, status: true, version_number: true },
    });

    if (versions.length === 0) return null;

    const latestPublished = versions.find((v) => v.status === 'PUBLISHED');
    if (latestPublished) return latestPublished.id;

    return versions[0]?.id ?? null;
  }

  private async assertBlueprint(brandId: number, blueprintId: number) {
    const exists = await this.prisma.dayBlueprint.findFirst({
      where: { id: blueprintId, brand_id: brandId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Day blueprint not found');
  }
}
