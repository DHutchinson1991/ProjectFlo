/**
 * Backfill: copy event_type_id from service_package_categories → package_sets
 *
 * For every package_set that has a category_id but no event_type_id,
 * looks up the category's event_type_id and copies it directly onto the set.
 *
 * Safe to run multiple times (idempotent).
 *
 * Usage:  node scripts/backfill-package-set-event-type.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Find all package_sets that have a category but no event_type_id
    const sets = await prisma.package_sets.findMany({
        where: {
            category_id: { not: null },
            event_type_id: null,
        },
        include: {
            category: { select: { id: true, name: true, event_type_id: true } },
        },
    });

    console.log(`Found ${sets.length} package set(s) needing backfill`);

    let updated = 0;
    for (const s of sets) {
        const etId = s.category?.event_type_id;
        if (!etId) {
            console.log(`  SKIP set #${s.id} "${s.name}" — category has no event_type_id`);
            continue;
        }
        await prisma.package_sets.update({
            where: { id: s.id },
            data: { event_type_id: etId },
        });
        console.log(`  ✅ set #${s.id} "${s.name}" → event_type_id=${etId}`);
        updated++;
    }

    console.log(`\nDone. Updated ${updated} of ${sets.length} sets.`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
