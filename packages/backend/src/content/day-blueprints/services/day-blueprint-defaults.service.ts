import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WEDDING_ROLES_DATA } from '../../../platform/brands/provisioning/wedding-data';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
  normalizeLabel,
  normalizeName,
  SANDBOX_LOCATION_ROLE_DESCRIPTION,
  SANDBOX_LOCATION_ROLE_KEY,
  SANDBOX_LOCATION_ROLE_LABEL,
  toStableKey,
  WEDDING_PRIMARY_ROLES,
  WEDDING_TYPICAL_COUNTS,
} from './day-blueprint-defaults.helpers';

type DbClient = Prisma.TransactionClient | PrismaService;

const WEDDING_ROLE_ORDER = WEDDING_ROLES_DATA.map((role) => normalizeName(role.role_name));

@Injectable()
export class DayBlueprintDefaultsService {
  constructor(private readonly prisma: PrismaService) {}

  isWeddingCategory(eventCategory: string | null | undefined): boolean {
    return (eventCategory ?? '').toLowerCase().includes('wedding');
  }

  async seedInitialVersionDefaults(
    tx: DbClient,
    params: { brandId: number; versionId: number; eventCategory: string; guestCount?: number },
  ) {
    await this.ensureSandboxLocationRole(tx, params.brandId);

    if (this.isWeddingCategory(params.eventCategory)) {
      await this.ensureWeddingSubjectRoles(tx, params.brandId, params.versionId, params.guestCount);
    }
  }

  async ensureActivityLocationDefaults(
    tx: DbClient,
    params: {
      brandId: number;
      versionId: number;
      activityId: number;
      activityName: string;
      sourceEventDayActivityId?: number | null;
    },
  ) {
    const sourceLocationLabel = await this.loadSourceLocationLabel(tx, params.sourceEventDayActivityId);
    const activityName = normalizeLabel(params.activityName) ?? 'Activity';

    const locationRole = sourceLocationLabel
      ? await this.ensureNamedLocationRole(tx, params.brandId, sourceLocationLabel)
      : await this.ensureSandboxLocationRole(tx, params.brandId);

    await this.ensureActivityAttachedToRole(tx, params.activityId, locationRole.id);

    if (sourceLocationLabel) {
      await this.ensureVersionSpaceSlot(tx, {
        versionId: params.versionId,
        locationRoleId: locationRole.id,
        key: toStableKey(sourceLocationLabel),
        label: sourceLocationLabel,
        description: `Default placement canvas for ${sourceLocationLabel}.`,
      });
      return;
    }

    await this.ensureVersionSpaceSlot(tx, {
      versionId: params.versionId,
      locationRoleId: locationRole.id,
      key: toStableKey(`${activityName} space`),
      label: `${activityName} Space`,
      description: `Default sandbox canvas for ${activityName}.`,
    });
  }

  async ensureDefaultSpaceSlotForLocationRole(
    tx: DbClient,
    params: {
      versionId: number;
      locationRoleId: number;
      locationRoleLabel: string;
      locationRoleDescription?: string | null;
    },
  ) {
    const existing = await tx.dayBlueprintSpaceSlot.findFirst({
      where: {
        day_blueprint_version_id: params.versionId,
        day_blueprint_location_role_id: params.locationRoleId,
      },
      select: { id: true },
    });
    if (existing) {
      return existing;
    }

    const label = normalizeLabel(params.locationRoleLabel) ?? SANDBOX_LOCATION_ROLE_LABEL;
    return this.ensureVersionSpaceSlot(tx, {
      versionId: params.versionId,
      locationRoleId: params.locationRoleId,
      key: toStableKey(label),
      label,
      description: params.locationRoleDescription ?? `Default placement canvas for ${label}.`,
    });
  }

  private async loadSourceLocationLabel(
    tx: DbClient,
    sourceEventDayActivityId?: number | null,
  ): Promise<string | null> {
    if (!sourceEventDayActivityId) {
      return null;
    }

    const sourceActivity = await tx.eventDayActivity.findUnique({
      where: { id: sourceEventDayActivityId },
      select: { location_label: true },
    });

    return normalizeLabel(sourceActivity?.location_label);
  }

  private async ensureNamedLocationRole(
    tx: DbClient,
    brandId: number,
    label: string,
  ) {
    const key = toStableKey(label);
    return tx.dayBlueprintLocationRole.upsert({
      where: {
        brand_id_key: {
          brand_id: brandId,
          key,
        },
      },
      create: {
        brand_id: brandId,
        key,
        display_name: label,
        description: `Auto-created from activity location label "${label}".`,
        order_index: 0,
        is_active: true,
      },
      update: {
        is_active: true,
      },
    });
  }

  private async ensureActivityAttachedToRole(
    tx: DbClient,
    activityId: number,
    locationRoleId: number,
  ) {
    await tx.dayBlueprintActivityLocation.createMany({
      data: [
        {
          day_blueprint_activity_id: activityId,
          day_blueprint_location_role_id: locationRoleId,
          is_primary: true,
          order_index: 0,
        },
      ],
      skipDuplicates: true,
    });
  }

  private async ensureSandboxLocationRole(tx: DbClient, brandId: number) {
    return tx.dayBlueprintLocationRole.upsert({
      where: {
        brand_id_key: {
          brand_id: brandId,
          key: SANDBOX_LOCATION_ROLE_KEY,
        },
      },
      create: {
        brand_id: brandId,
        key: SANDBOX_LOCATION_ROLE_KEY,
        display_name: SANDBOX_LOCATION_ROLE_LABEL,
        description: SANDBOX_LOCATION_ROLE_DESCRIPTION,
        order_index: 0,
        is_active: true,
      },
      update: {
        description: SANDBOX_LOCATION_ROLE_DESCRIPTION,
        is_active: true,
      },
    });
  }

  private async ensureVersionSpaceSlot(
    tx: DbClient,
    params: {
      versionId: number;
      locationRoleId: number;
      key: string;
      label: string;
      description?: string | null;
    },
  ) {
    const existing = await tx.dayBlueprintSpaceSlot.findFirst({
      where: {
        day_blueprint_version_id: params.versionId,
        day_blueprint_location_role_id: params.locationRoleId,
        key: params.key,
      },
      select: { id: true },
    });
    if (existing) {
      return existing;
    }

    const orderIndex = await tx.dayBlueprintSpaceSlot.count({
      where: {
        day_blueprint_version_id: params.versionId,
        day_blueprint_location_role_id: params.locationRoleId,
      },
    });

    return tx.dayBlueprintSpaceSlot.create({
      data: {
        day_blueprint_version_id: params.versionId,
        day_blueprint_location_role_id: params.locationRoleId,
        key: params.key,
        label: params.label,
        description: params.description ?? undefined,
        order_index: orderIndex,
      },
    });
  }

  private async ensureWeddingSubjectRoles(
    tx: DbClient,
    brandId: number,
    versionId: number,
    guestCount?: number,
  ) {
    const brandRoles = await tx.subjectRole.findMany({
      where: { brand_id: brandId },
      select: { id: true, role_name: true, is_group: true },
      orderBy: [{ order_index: 'asc' }, { role_name: 'asc' }],
    });

    const byNormalizedName = new Map<string, (typeof brandRoles)[number]>();
    for (const role of brandRoles) {
      const normalized = normalizeName(role.role_name);
      if (WEDDING_ROLE_ORDER.includes(normalized) && !byNormalizedName.has(normalized)) {
        byNormalizedName.set(normalized, role);
      }
    }

    const data = WEDDING_ROLE_ORDER.flatMap((normalizedName, orderIndex) => {
      const role = byNormalizedName.get(normalizedName);
      if (!role) {
        return [];
      }

      return [
        {
          day_blueprint_version_id: versionId,
          subject_role_id: role.id,
          is_primary: WEDDING_PRIMARY_ROLES.has(normalizedName),
          typical_count: this.getWeddingTypicalCount(normalizedName, role.is_group, guestCount),
          order_index: orderIndex,
        },
      ];
    });

    if (data.length === 0) {
      return;
    }

    await tx.dayBlueprintSubjectRole.createMany({
      data,
      skipDuplicates: true,
    });
  }

  private getWeddingTypicalCount(normalizedName: string, isGroup: boolean, guestCount?: number): number {
    if (normalizedName === 'guests' && guestCount != null) {
      return Math.max(1, Math.floor(guestCount));
    }

    const explicit = WEDDING_TYPICAL_COUNTS.get(normalizedName);
    if (explicit != null) {
      return explicit;
    }
    return isGroup ? 4 : 1;
  }
}