import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { Prisma } from '@prisma/client';

type BlueprintRef = {
  id: number;
  key: string;
  display_name: string;
};

type BlueprintVersionRef = {
  id: number;
  version_number: number;
};

type SnapshotPackageInput = {
  id: number;
  name: string;
  currency: string | null;
  contents: Prisma.JsonValue | null;
  source_day_blueprint_id?: number | null;
  source_day_blueprint_version_id?: number | null;
  source_day_blueprint?: BlueprintRef | null;
  source_day_blueprint_version?: BlueprintVersionRef | null;
};

type PackageContentsSnapshot = Prisma.InputJsonObject & {
  snapshot_taken_at: string;
  package_id: number;
  package_name: string;
  currency: string;
  contents: Prisma.InputJsonValue | null;
  source_day_blueprint_id: number | null;
  source_day_blueprint_version_id: number | null;
  source_day_blueprint_display_name: string | null;
  source_day_blueprint_key: string | null;
  source_day_blueprint_version_number: number | null;
};

export function buildPackageContentsSnapshot(pkg: SnapshotPackageInput | null): PackageContentsSnapshot | null {
  if (!pkg) return null;

  return {
    snapshot_taken_at: new Date().toISOString(),
    package_id: pkg.id,
    package_name: pkg.name,
    currency: pkg.currency ?? DEFAULT_CURRENCY,
    contents: pkg.contents as Prisma.InputJsonValue | null,
    source_day_blueprint_id: pkg.source_day_blueprint_id ?? null,
    source_day_blueprint_version_id: pkg.source_day_blueprint_version_id ?? null,
    source_day_blueprint_display_name: pkg.source_day_blueprint?.display_name ?? null,
    source_day_blueprint_key: pkg.source_day_blueprint?.key ?? null,
    source_day_blueprint_version_number: pkg.source_day_blueprint_version?.version_number ?? null,
  };
}