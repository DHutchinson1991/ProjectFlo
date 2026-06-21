import type { DayBlueprintSummary } from '@/features/content/day-blueprints/types';
import { WEDDING_TEMPLATE_KEYS } from '../../../day-design/wedding-template-keys';
import { normalizeCategory } from './day-design-shared';

export type LibraryDayDesignKind = 'template' | 'saved';

export interface LibraryDayDesignOption {
  blueprintId: number;
  versionId: number;
  versionNumber: number;
  versionStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  name: string;
  description: string;
  kind: LibraryDayDesignKind;
  dayCount: number;
  activityCount: number;
  momentCount: number;
}

function isWizardEphemeralBlueprint(blueprint: DayBlueprintSummary): boolean {
  const tags = blueprint.variant_tags;
  return Boolean(tags && typeof tags === 'object' && tags.package_wizard_ephemeral === true);
}

function resolveTemplateDescription(key: string, fallback?: string | null): string {
  const template = WEDDING_TEMPLATE_KEYS.find((entry) => entry.key === key);
  return template?.description ?? fallback?.trim() ?? '';
}

function resolveKind(blueprint: DayBlueprintSummary): LibraryDayDesignKind {
  const isKnownTemplate = WEDDING_TEMPLATE_KEYS.some((entry) => entry.key === blueprint.key);
  const isSeeded = (blueprint as DayBlueprintSummary & { is_system_seeded?: boolean }).is_system_seeded;
  return isKnownTemplate || isSeeded ? 'template' : 'saved';
}

/** Blueprints the package wizard can pick without cloning or AI generation. */
export function buildLibraryDayDesignOptions(
  blueprints: DayBlueprintSummary[],
  eventCategory: string,
): LibraryDayDesignOption[] {
  const category = normalizeCategory(eventCategory);

  return blueprints
    .filter((blueprint) => normalizeCategory(blueprint.event_category) === category)
    .filter((blueprint) => !isWizardEphemeralBlueprint(blueprint))
    .flatMap((blueprint) => {
      const versionId = blueprint.row_summary?.primary_version_id;
      const versionNumber = blueprint.row_summary?.primary_version_number;
      const versionStatus = blueprint.row_summary?.primary_version_status;
      const activityCount = blueprint.row_summary?.activity_count ?? 0;
      const dayCount = blueprint.row_summary?.day_count ?? 0;

      if (!versionId || !versionNumber || !versionStatus || versionStatus === 'ARCHIVED') {
        return [];
      }
      if (dayCount === 0 || activityCount === 0) {
        return [];
      }

      const kind = resolveKind(blueprint);
      return [{
        blueprintId: blueprint.id,
        versionId,
        versionNumber,
        versionStatus,
        name: blueprint.display_name,
        description: resolveTemplateDescription(blueprint.key, blueprint.description),
        kind,
        dayCount,
        activityCount,
        momentCount: blueprint.row_summary?.moment_count ?? 0,
      }];
    })
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'template' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}
