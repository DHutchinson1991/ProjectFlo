/**
 * One-off: delete Moonrise system-seeded wedding day blueprints so the next
 * `prisma db seed` recreates them from `moonrise-wedding-blueprint-templates.seed.ts`.
 *
 * Usage (from packages/backend): pnpm exec ts-node scripts/reseed-wedding-blueprint-templates.ts
 */
import { PrismaClient } from '@prisma/client';

const TEMPLATE_KEYS = ['standard-uk-wedding', 'punjabi-3day-wedding', 'catholic-ceremony-17'] as const;

async function main() {
  const prisma = new PrismaClient();
  try {
    const brand = await prisma.brands.findFirst({ where: { name: 'Moonrise Films' } });
    if (!brand) {
      console.error('Moonrise Films brand not found');
      process.exit(1);
    }
    const result = await prisma.dayBlueprint.deleteMany({
      where: {
        brand_id: brand.id,
        key: { in: [...TEMPLATE_KEYS] },
        is_system_seeded: true,
      },
    });
    console.log(`Deleted ${result.count} wedding blueprint(s). Run: pnpm exec prisma db seed`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
