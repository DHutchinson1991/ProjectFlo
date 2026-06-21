/**
 * Remove day blueprints created by package-wizard testing (published duplicates
 * like "Wedding Day Design", ephemeral drafts, etc.). Never touches
 * is_system_seeded templates (Standard UK, Punjabi, Catholic).
 *
 * Skips blueprints referenced by service_packages.source_day_blueprint_id.
 *
 * Usage (from packages/backend):
 *   pnpm exec tsx scripts/cleanup-wizard-day-blueprint-spam.ts
 *   pnpm exec tsx scripts/cleanup-wizard-day-blueprint-spam.ts --dry-run
 */
import { PrismaClient } from '@prisma/client';

const WIZARD_SPAM_DISPLAY_NAMES = [
  'Wedding Day Design',
  'New Wedding Blueprint',
  'Birthday Day Design',
  'Engagement Day Design',
] as const;

function isWizardEphemeral(variantTags: unknown): boolean {
  if (!variantTags || typeof variantTags !== 'object' || Array.isArray(variantTags)) return false;
  return (variantTags as Record<string, unknown>).package_wizard_ephemeral === true;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const prisma = new PrismaClient();

  try {
    const brands = await prisma.brands.findMany({ select: { id: true, name: true } });
    if (brands.length === 0) {
      console.log('No brands found.');
      return;
    }

    let totalDeleted = 0;
    let totalSkipped = 0;

    for (const brand of brands) {
      const candidates = await prisma.dayBlueprint.findMany({
        where: {
          brand_id: brand.id,
          is_system_seeded: false,
        },
        include: {
          versions: { select: { id: true, status: true, version_number: true } },
          _count: { select: { source_service_packages: true } },
        },
      });

      const toDelete = candidates.filter((bp) => {
        if (bp._count.source_service_packages > 0) return false;

        const nameMatch =
          WIZARD_SPAM_DISPLAY_NAMES.includes(
            bp.display_name as (typeof WIZARD_SPAM_DISPLAY_NAMES)[number],
          )
          || / Day Design$/i.test(bp.display_name.trim());

        const taggedEphemeral = isWizardEphemeral(bp.variant_tags);

        return nameMatch || taggedEphemeral;
      });

      if (toDelete.length === 0) continue;

      console.log(`\nBrand: ${brand.name} (id=${brand.id})`);
      for (const bp of toDelete) {
        const versions = bp.versions
          .map((v) => `v${v.version_number} ${v.status}`)
          .join(', ');
        console.log(
          `  ${dryRun ? '[dry-run] would delete' : 'deleting'} #${bp.id} "${bp.display_name}" [${versions || 'no versions'}]`,
        );
      }

      const skipped = candidates.filter(
        (bp) =>
          !bp.is_system_seeded
          && bp._count.source_service_packages > 0
          && (
            WIZARD_SPAM_DISPLAY_NAMES.includes(
              bp.display_name as (typeof WIZARD_SPAM_DISPLAY_NAMES)[number],
            )
            || / Day Design$/i.test(bp.display_name.trim())
          ),
      );
      for (const bp of skipped) {
        console.log(
          `  skip #${bp.id} "${bp.display_name}" — referenced by ${bp._count.source_service_packages} package(s)`,
        );
        totalSkipped += 1;
      }

      if (!dryRun && toDelete.length > 0) {
        const result = await prisma.dayBlueprint.deleteMany({
          where: { id: { in: toDelete.map((bp) => bp.id) } },
        });
        totalDeleted += result.count;
      } else {
        totalDeleted += toDelete.length;
      }
    }

    console.log(
      `\n${dryRun ? 'Would delete' : 'Deleted'} ${totalDeleted} wizard test blueprint(s). Skipped ${totalSkipped} (in use by packages).`,
    );
    if (dryRun) {
      console.log('Re-run without --dry-run to apply.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main();
