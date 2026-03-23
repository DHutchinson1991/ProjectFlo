/**
 * Backfill: link existing service_package_categories to their matching EventType
 * by name (case-insensitive). Also creates missing categories for any EventTypes
 * that have no matching category yet.
 *
 * Safe to run multiple times — all operations are upserts / conditional updates.
 *
 * Usage (from packages/backend):
 *   node scripts/backfill-event-type-categories.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Backfill: EventType → service_package_categories ===\n');

  const eventTypes = await prisma.eventType.findMany({
    select: { id: true, name: true, brand_id: true },
  });
  console.log(`Found ${eventTypes.length} event type(s).`);

  let linked = 0;
  let created = 0;
  let alreadyDone = 0;

  for (const et of eventTypes) {
    // Find an existing category with the same name (case-insensitive) in the same brand
    const category = await prisma.service_package_categories.findFirst({
      where: {
        brand_id: et.brand_id,
        name: { equals: et.name, mode: 'insensitive' },
      },
    });

    if (category) {
      if (category.event_type_id === et.id) {
        console.log(`  ✓ Already linked: "${et.name}" (category id=${category.id})`);
        alreadyDone++;
      } else {
        await prisma.service_package_categories.update({
          where: { id: category.id },
          data: { event_type_id: et.id },
        });
        console.log(`  🔗 Linked: "${et.name}" → category id=${category.id}`);
        linked++;
      }
    } else {
      // No matching category — create one
      const newCat = await prisma.service_package_categories.create({
        data: { brand_id: et.brand_id, name: et.name, event_type_id: et.id },
      });
      console.log(`  ✨ Created new category: "${et.name}" (id=${newCat.id})`);
      created++;
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`  Already linked : ${alreadyDone}`);
  console.log(`  Newly linked   : ${linked}`);
  console.log(`  Categories created: ${created}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
