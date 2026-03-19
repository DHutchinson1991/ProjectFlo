/**
 * Seed equipment owners — assigns Andy Galloway and Daniel Hutchinson as owners
 * across all equipment, alternating by item order.
 *
 * Usage (from packages/backend):
 *   node scripts/seed-equipment-owners.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Look up Andy Galloway via contributors → contact join
    const andyContributor = await prisma.contributors.findFirst({
        where: {
            contact: {
                first_name: { equals: 'Andy',    mode: 'insensitive' },
                last_name:  { equals: 'Galloway', mode: 'insensitive' },
            },
        },
        select: { id: true, contact: { select: { first_name: true, last_name: true } } },
    });

    // Look up Daniel Hutchinson
    const danielContributor = await prisma.contributors.findFirst({
        where: {
            contact: {
                first_name: { equals: 'Daniel',     mode: 'insensitive' },
                last_name:  { equals: 'Hutchinson', mode: 'insensitive' },
            },
        },
        select: { id: true, contact: { select: { first_name: true, last_name: true } } },
    });

    if (!andyContributor) {
        throw new Error('Could not find a contributor record for Andy Galloway. Make sure the contact exists.');
    }
    if (!danielContributor) {
        throw new Error('Could not find a contributor record for Daniel Hutchinson. Make sure the contact exists.');
    }

    const andyId   = andyContributor.id;
    const danielId = danielContributor.id;

    console.log(`Andy Galloway  → contributor id ${andyId}`);
    console.log(`Daniel Hutchinson → contributor id ${danielId}`);

    // Fetch all equipment ordered by id
    const allEquipment = await prisma.equipment.findMany({
        select: { id: true, item_name: true },
        orderBy: { id: 'asc' },
    });

    console.log(`\nFound ${allEquipment.length} equipment items. Assigning owners...`);

    let andyCount   = 0;
    let danielCount = 0;

    for (let i = 0; i < allEquipment.length; i++) {
        const item    = allEquipment[i];
        const ownerId = i % 2 === 0 ? andyId : danielId;
        const name    = i % 2 === 0 ? 'Andy Galloway' : 'Daniel Hutchinson';

        await prisma.equipment.update({
            where: { id: item.id },
            data:  { owner_id: ownerId },
        });

        console.log(`  [${i + 1}/${allEquipment.length}] "${item.item_name}" → ${name}`);
        if (i % 2 === 0) andyCount++; else danielCount++;
    }

    console.log(`\nDone. Andy: ${andyCount} items  |  Daniel: ${danielCount} items`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
