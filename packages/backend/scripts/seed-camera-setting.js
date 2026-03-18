/**
 * Seed default "max_cameras_per_operator" brand setting for all brands.
 *
 * Usage (from packages/backend):
 *   node scripts/seed-camera-setting.js
 *
 * Idempotent — skips brands that already have this setting.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SETTING_KEY = "max_cameras_per_operator";
const DEFAULT_VALUE = "3";

async function main() {
  const brands = await prisma.brands.findMany({ where: { is_active: true }, select: { id: true, name: true } });
  console.log(`Found ${brands.length} active brand(s)`);

  for (const brand of brands) {
    const existing = await prisma.brand_settings.findUnique({
      where: { brand_id_key: { brand_id: brand.id, key: SETTING_KEY } },
    });

    if (existing) {
      console.log(`  ✓ ${brand.name}: already has ${SETTING_KEY} = ${existing.value}`);
      continue;
    }

    await prisma.brand_settings.create({
      data: {
        brand_id: brand.id,
        key: SETTING_KEY,
        value: DEFAULT_VALUE,
        data_type: "number",
        category: "crew",
        description: "Maximum number of cameras a single videographer/operator can manage during real-time coverage",
        is_active: true,
      },
    });
    console.log(`  + ${brand.name}: created ${SETTING_KEY} = ${DEFAULT_VALUE}`);
  }

  console.log("\nDone!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
