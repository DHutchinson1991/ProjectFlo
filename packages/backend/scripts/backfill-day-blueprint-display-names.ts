/**
 * One-off backfill: align seeded Moonrise blueprint display names with updated naming.
 * Run: cd packages/backend && npx ts-node scripts/backfill-day-blueprint-display-names.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type RenameRule = {
  key: string;
  nextDisplayName: string;
  nextDescription?: string;
};

const RENAME_RULES: RenameRule[] = [
  {
    key: 'punjabi-3day-wedding',
    nextDisplayName: 'Punjabi Wedding',
    nextDescription:
      'Punjabi wedding structure: Mehndi night, main Anand Karaj ceremony day, and evening reception/reception day.',
  },
  {
    key: 'catholic-ceremony-17',
    nextDisplayName: 'Catholic Ceremony',
  },
  {
    key: 'catholic-ceremony',
    nextDisplayName: 'Catholic Ceremony',
  },
];

async function main() {
  const updates: Array<{ key: string; matched: number; changed: number }> = [];

  for (const rule of RENAME_RULES) {
    const records = await prisma.dayBlueprint.findMany({
      where: { key: rule.key },
      select: { id: true, display_name: true, description: true },
    });

    let changed = 0;

    for (const record of records) {
      const needsNameUpdate = record.display_name !== rule.nextDisplayName;
      const needsDescriptionUpdate =
        typeof rule.nextDescription === 'string' && record.description !== rule.nextDescription;

      if (!needsNameUpdate && !needsDescriptionUpdate) {
        continue;
      }

      await prisma.dayBlueprint.update({
        where: { id: record.id },
        data: {
          display_name: rule.nextDisplayName,
          ...(typeof rule.nextDescription === 'string'
            ? { description: rule.nextDescription }
            : {}),
        },
      });

      changed += 1;
    }

    updates.push({ key: rule.key, matched: records.length, changed });
  }

  const totalChanged = updates.reduce((sum, update) => sum + update.changed, 0);

  updates.forEach((update) => {
    console.log(
      `[BlueprintNameBackfill] key=${update.key} matched=${update.matched} changed=${update.changed}`,
    );
  });

  console.log(`[BlueprintNameBackfill] total_changed=${totalChanged}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
